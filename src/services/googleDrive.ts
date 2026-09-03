// Google Drive API Client Service for MEDUCA Digital Registry
import { getCachedDriveToken, setCachedDriveToken, loginWithGoogleForDrive } from './firebase';

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  createdTime?: string;
}

let tokenClient: any = null;

// Initialize Google Identity Services or Firebase Auth Token Client
export async function getGoogleDriveToken(): Promise<string> {
  // 1. If already cached in memory
  const existingCached = getCachedDriveToken();
  if (existingCached) {
    return existingCached;
  }

  // 2. Try acquiring via Firebase Auth Google provider popup (official AI Studio workspace pattern)
  try {
    const token = await loginWithGoogleForDrive();
    if (token) {
      setCachedDriveToken(token);
      return token;
    }
  } catch (firebaseErr: any) {
    console.info('Firebase auth drive popup notice:', firebaseErr?.message);
  }

  // 3. Fallback to Google Identity Services client if initialized in browser
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Google Drive integration requires a browser environment.'));
      return;
    }

    const google = (window as any).google;
    if (!google?.accounts?.oauth2) {
      reject(
        new Error(
          'La biblioteca de Google Identity Services aún no está lista. Por favor recargue la página e intente de nuevo.'
        )
      );
      return;
    }

    try {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: '275152670174-aistudio-client-id.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (tokenResponse: any) => {
          if (tokenResponse.error) {
            reject(new Error(tokenResponse.error_description || tokenResponse.error));
            return;
          }
          setCachedDriveToken(tokenResponse.access_token);
          resolve(tokenResponse.access_token);
        },
      });

      tokenClient.requestAccessToken({ prompt: '' });
    } catch (err: any) {
      reject(err);
    }
  });
}

// Ensure the dedicated application folder exists on user's Google Drive
export async function getOrCreateMeducaFolder(token: string): Promise<string> {
  const folderName = 'MEDUCA Registro Digital Docente';
  const query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!searchRes.ok) {
    throw new Error('Error al conectar con Google Drive.');
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder if not found
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Carpeta oficial de respaldos del Registro Digital Docente MEDUCA Panamá',
    }),
  });

  if (!createRes.ok) {
    throw new Error('No se pudo crear la carpeta de respaldos en Google Drive.');
  }

  const folderData = await createRes.json();
  return folderData.id;
}

// Upload a backup JSON file to Google Drive
export async function uploadBackupToDrive(
  token: string,
  backupData: object,
  customName?: string
): Promise<GoogleDriveFile> {
  const folderId = await getOrCreateMeducaFolder(token);
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  const fileName = customName || `MEDUCA_Respaldo_${dateStr}_${timeStr}.json`;

  const fileContent = JSON.stringify(backupData, null, 2);
  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    parents: [folderId],
    description: `Copia de seguridad del Registro Digital Docente MEDUCA generada el ${now.toLocaleString()}`,
  };

  const boundary = '-------meduca_boundary_' + Date.now();
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    fileContent +
    closeDelimiter;

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!uploadRes.ok) {
    const errDetails = await uploadRes.text();
    console.error('Drive upload failed:', errDetails);
    throw new Error('Error al subir el archivo de respaldo a Google Drive.');
  }

  return await uploadRes.json();
}

// List all MEDUCA backup files in user's Google Drive folder
export async function listDriveBackups(token: string): Promise<GoogleDriveFile[]> {
  const folderId = await getOrCreateMeducaFolder(token);
  const query = `'${folderId}' in parents and trashed=false and mimeType='application/json'`;

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      query
    )}&orderBy=modifiedTime desc&fields=files(id,name,mimeType,modifiedTime,size,createdTime)&pageSize=25`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    throw new Error('No se pudo obtener la lista de respaldos desde Google Drive.');
  }

  const data = await res.json();
  return data.files || [];
}

// Download/Read a backup file from Google Drive
export async function readBackupFromDrive(token: string, fileId: string): Promise<any> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    throw new Error('Error al descargar el archivo seleccionado desde Google Drive.');
  }

  return await res.json();
}

// Delete a backup file from Google Drive
export async function deleteDriveFile(token: string, fileId: string): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    throw new Error('No se pudo eliminar el archivo de Google Drive.');
  }
}
