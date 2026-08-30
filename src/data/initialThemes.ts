import { ThemePlanner } from '../types';

export const INITIAL_THEME_PLANNERS: ThemePlanner[] = [
  {
    id: 'theme-01-grp-7a-t2',
    groupId: 'grp-7a',
    trimester: 2,
    themeNumber: 1,
    scenario: 'Following Instructions at School (S1)',
    themeTitle: 'First, I Cut the Paper.',
    cefrLevel: 'A1.3',
    gradeLevel: '7mo Grado (A1.3)',
    weeklyPeriods: 7,
    weeksRange: 'Semana 8 - Semana 12',
    schoolYear: 2026,
    status: 'En Curso',
    standardsAndOutcomes: [
      {
        skill: 'listening',
        skillName: '1. Listening',
        specificCurriculumStandard:
          'Follow clear instructions and execute multi-step oral directions in structured contexts.',
        expectedLearningOutcome:
          'Identify key vocabulary and main ideas from audio inputs with ≥80% accuracy using visual supports and gesture cues.',
      },
      {
        skill: 'reading',
        skillName: '2. Reading',
        specificCurriculumStandard:
          'Show comprehension of short written descriptions, stories, and simple procedures.',
        expectedLearningOutcome:
          'Locate and list 3–5 specific facts and target sequence words from texts related to "First, I Cut the Paper.".',
      },
      {
        skill: 'speaking',
        skillName: '3. Speaking',
        specificCurriculumStandard:
          'Give simple directions and participate in short, guided conversational exchanges.',
        expectedLearningOutcome:
          'Produce 2–3 coherent sentences using target imperative frames in a role-play or peer dialogue.',
      },
      {
        skill: 'writing',
        skillName: '4. Writing',
        specificCurriculumStandard:
          'Create short, organized texts using sentence starters and visual word banks.',
        expectedLearningOutcome:
          'Write 3–5 correctly punctuated sentences for the unit project presentation with sequence connectors.',
      },
      {
        skill: 'mediation',
        skillName: '5. Mediation',
        specificCurriculumStandard:
          'Simplify instructional content and assist peers using non-verbal and visual cues.',
        expectedLearningOutcome:
          'Present the unit project collaboratively applying at least 2 mediation strategies (visual cues, gestures, paraphrasing).',
      },
    ],
    competences: {
      linguistic: {
        grammar:
          'Imperatives (cut, fold, paste), Sequencing words (first, next, then, finally), Future intent (will / going to).',
        vocabulary:
          'paper, scissors, glue, pencil, poster, cut, fold, paste, draw, create, share, decorate, ruler, marker.',
        phonetics: "/p/ in 'poster', /s/ in 'scissors', and /f/ in 'fold'.",
      },
      pragmatic: {
        communicativeFunctions:
          'Giving step-by-step instructions, sequencing classroom actions, expressing future project plans.',
      },
      sociolinguistic: {
        socioCulturalAspects:
          'Active teamwork, polite turn-taking, respectful peer feedback, cultural appreciation of Panamanian contexts, and active listening.',
      },
    },
    unitProject: {
      title: 'Classroom How-To Guide',
      description:
        'Create an illustrated step-by-step guide for a classroom craft or procedure with oral presentation in pairs.',
    },
    materialsAndResources:
      'Flashcards, realia, audio/video recordings, visual graphic organizers, sentence starters, color-coded word banks, poster sheets, markers, mini whiteboards, and interactive digital flashcards.',
    differentiatedInstruction:
      'Visual image prompts, chunked instruction steps, peer buddy pairing, physical TPR gestures, extended practice time, simplified sentence frames, and flexible response modes.',
    lessons: [
      {
        id: 'les-01-t1-listening',
        skill: 'listening',
        lessonNumber: 1,
        skillTitle: 'Listening & Language Foundations',
        specificObjective:
          'By the end of this lesson, students will be able to identify key vocabulary and main ideas from an audio/video input with ≥80% accuracy using visual supports and gesture cues.',
        learningOutcome:
          'Demonstrate active oral/written comprehension of core vocabulary (paper, scissors, glue, pencil) using target imperative verbs.',
        totalTimeMinutes: 60,
        formativeAssessmentStrategy:
          'Observation checklist during pair check, Exit Ticket (1 keyword + 1 main fact), listening worksheet accuracy score.',
        reinforcementHomework:
          'Listen to 1 English word from daily life or media, write it down, and draw a picture representing "First, I Cut the Paper.".',
        teacherReflection: 'Monitorear la respuesta kinestésica (TPR) en estudiantes que requieren mayor apoyo fonético.',
        stages: [
          {
            stageNumber: 1,
            name: 'Stage 1 - Warm-up / Pre-task (Engagement, Modeling and Clarification)',
            shortName: 'Warm-up / Pre-task',
            durationMinutes: 10,
            description:
              'Engage students with a 2-minute audio clip or video related to "First, I Cut the Paper.". Ask: "What sounds or words did you hear?" Activate prior knowledge by showing physical flashcards or realia of paper, scissors, glue, pencil, poster, cut. Use Total Physical Response (TPR) gestures to introduce core verbs.',
            neuroscienceInsight: {
              title: 'Auditory Novelty & Attention Capture',
              description:
                'Varying pitch, sound effects, and physical gestures stimulates dopamine release and activates the reticular activating system (RAS) for heightened focus.',
            },
          },
          {
            stageNumber: 2,
            name: 'Stage 2 - Presentation',
            shortName: 'Presentation',
            durationMinutes: 10,
            description:
              'Present the listening focus task. Explain that students will listen to a short conversation about First, I Cut the Paper. Introduce key target structures: Imperatives (cut, fold, paste), Sequencing words (first, next, then, finally). Model the active listening strategy: "Listen for key words and main ideas first." Highlight target phonemes: /p/ in "poster", /s/ in "scissors", and /f/ in "fold".',
            neuroscienceInsight: {
              title: 'Cognitive Load Chunking',
              description:
                'Presenting audio in 30-second segments with visual anchors prevents working memory overload and strengthens phonetic neural maps.',
            },
          },
          {
            stageNumber: 3,
            name: 'Stage 3 - Preparation',
            shortName: 'Preparation',
            durationMinutes: 12,
            description:
              'Distribute a graphic listening worksheet (matching images to audio cues, gap-fill). Have students predict answers with a partner using sentence starters: "I think I will hear..." and "The main idea is...". Review key vocabulary pronunciation together.',
            neuroscienceInsight: {
              title: 'Predictive Coding in the Brain',
              description:
                'Pre-reading questions and image prediction activate neural schema, making subsequent auditory recognition significantly faster and more accurate.',
            },
          },
          {
            stageNumber: 4,
            name: 'Stage 4 - Performance',
            shortName: 'Performance',
            durationMinutes: 15,
            description:
              'Play the audio track twice. First pass: students circle recognized vocabulary words on their bingo/checklists. Second pass: students complete the guided comprehension items. In pairs, students turn to their buddy to verify answers and orally reconstruct the main message.',
            neuroscienceInsight: {
              title: 'Social Brain Activation',
              description:
                'Buddy checks activate the prefrontal cortex and social neural circuits, lowering language anxiety (affective filter) and boosting retention.',
            },
          },
          {
            stageNumber: 5,
            name: 'Stage 5 - Assessment / Post-task',
            shortName: 'Assessment / Post-task',
            durationMinutes: 8,
            description:
              'Review listening answers as a whole class using visual board checks. Conduct a quick oral check: "Who can tell me one keyword from the recording?" Administer a 2-question Exit Ticket: write 1 key vocabulary word and 1 main fact heard.',
            neuroscienceInsight: {
              title: 'Retrieval Practice & Dopamine Reinforcement',
              description:
                'Immediate post-task retrieval cements synaptic connections and delivers a feeling of competence.',
            },
          },
          {
            stageNumber: 6,
            name: 'Stage 6 - Reflection',
            shortName: 'Reflection',
            durationMinutes: 5,
            description:
              'Lead a short meta-cognitive reflection: "Which listening strategy helped you understand today (pictures, keywords, or buddy help)?" Connect today\'s listening input directly to the upcoming project: "Classroom How-To Guide". Preview Lesson 2 (Reading).',
            neuroscienceInsight: {
              title: 'Metacognitive Executive Function',
              description:
                'Self-reflecting on learning strategies strengthens prefrontal executive networks and promotes a growth mindset.',
            },
          },
        ],
      },
      {
        id: 'les-01-t2-reading',
        skill: 'reading',
        lessonNumber: 2,
        skillTitle: 'Reading & Understanding Concepts',
        specificObjective:
          'By the end of Lesson 2, students will be able to locate and list 3-5 specific facts and sequence connectors from a short contextualized illustrated procedure with teacher guidance.',
        learningOutcome:
          'Read and comprehend a step-by-step procedural text using visual cues and contextual vocabulary identification.',
        totalTimeMinutes: 60,
        formativeAssessmentStrategy:
          'Graphic organizer completion, sentence sequence ordering strip check, reading comprehension exit slip.',
        reinforcementHomework:
          'Read the 4-step craft card to a family member and underline the sequence words (First, Next, Then, Finally).',
        teacherReflection: 'Verificar el uso de organizadores gráficos para facilitar la decodificación en lectores iniciales.',
        stages: [
          {
            stageNumber: 1,
            name: 'Stage 1 - Warm-up / Pre-task (Engagement and Word Preview)',
            shortName: 'Warm-up / Pre-task',
            durationMinutes: 10,
            description:
              'Display jumbled sequence pictures of a paper craft. Ask students: "Which picture goes first?" Review target sight words (first, next, then, finally) using visual movement signals.',
            neuroscienceInsight: {
              title: 'Visual Pattern Recognition',
              description:
                'Arranging pictorial sequences primes the visual cortex and prefrontal logic centers for textual timeline processing.',
            },
          },
          {
            stageNumber: 2,
            name: 'Stage 2 - Presentation (Guided Model Reading)',
            shortName: 'Presentation',
            durationMinutes: 10,
            description:
              'Read the model text "How to Make a Classroom Poster" with expressive intonation. Point to key illustrations. Highlight target words: "First, cut the paper; next, draw the picture; then, fold; finally, paste".',
            neuroscienceInsight: {
              title: 'Dual Coding Theory',
              description:
                'Simultaneous verbal modeling and visual pointing creates dual semantic traces in both hemispheres.',
            },
          },
          {
            stageNumber: 3,
            name: 'Stage 3 - Preparation (Scaffolded Decoding)',
            shortName: 'Preparation',
            durationMinutes: 12,
            description:
              'Pair students with reading strip cards. Students match bold verbs (cut, fold, paste) to corresponding tool images. Model choral reading of challenging lines.',
            neuroscienceInsight: {
              title: 'Phonological Loop Reinforcement',
              description:
                'Choral reading stabilizes the phonological loop in working memory, enhancing fluent word recognition.',
            },
          },
          {
            stageNumber: 4,
            name: 'Stage 4 - Performance (Active Silent & Partner Reading)',
            shortName: 'Performance',
            durationMinutes: 15,
            description:
              'Students read the procedure individually with a highlighter tool. In pairs, Student A reads step 1-2 while Student B demonstrates the action with realia, then swap roles.',
            neuroscienceInsight: {
              title: 'Embodied Cognition',
              description:
                'Pairing physical mime with reading comprehension encodes semantic meaning in the motor cortex.',
            },
          },
          {
            stageNumber: 5,
            name: 'Stage 5 - Assessment / Post-task (Sequence Check)',
            shortName: 'Assessment / Post-task',
            durationMinutes: 8,
            description:
              'Administer a 4-item sequence ordering task on whiteboard mini-slates. Check quick comprehension answers: "What do we do after cutting?".',
            neuroscienceInsight: {
              title: 'Rapid Feedback Loop',
              description:
                'Immediate corrective feedback prevents incorrect mental schemas from consolidating into long-term memory.',
            },
          },
          {
            stageNumber: 6,
            name: 'Stage 6 - Reflection (Metacognitive Wrap-up)',
            shortName: 'Reflection',
            durationMinutes: 5,
            description:
              'Ask students: "Which clue words helped you know the order of steps?" Link reading structures to the upcoming Speaking lesson.',
            neuroscienceInsight: {
              title: 'Metacognitive Anchoring',
              description:
                'Explicitly recognizing discourse markers bridges receptive reading with productive oral output.',
            },
          },
        ],
      },
    ],
  },
];
