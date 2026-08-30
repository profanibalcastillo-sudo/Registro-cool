import {
  EflSkill,
  LessonStage,
  SkillLessonPlan,
  ThemePlanner,
  WeeklyPlanner,
  TrimesterId,
} from '../types';

export const SKILL_METADATA: Record<
  EflSkill,
  {
    lessonNumber: number;
    title: string;
    iconName: string;
    color: string;
    accentBg: string;
    borderColor: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  listening: {
    lessonNumber: 1,
    title: 'Listening & Language Foundations',
    iconName: 'Headphones',
    color: 'text-indigo-700',
    accentBg: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-800',
  },
  reading: {
    lessonNumber: 2,
    title: 'Reading & Understanding Concepts',
    iconName: 'BookOpen',
    color: 'text-emerald-700',
    accentBg: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
  },
  speaking: {
    lessonNumber: 3,
    title: 'Productive & Interactive Speaking',
    iconName: 'Mic',
    color: 'text-amber-700',
    accentBg: 'bg-amber-50',
    borderColor: 'border-amber-200',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
  },
  writing: {
    lessonNumber: 4,
    title: 'Guided Writing & Project Drafting',
    iconName: 'PenTool',
    color: 'text-blue-700',
    accentBg: 'bg-blue-50',
    borderColor: 'border-blue-200',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
  },
  mediation: {
    lessonNumber: 5,
    title: 'Mediation & 21st-Century Project Collaboration',
    iconName: 'Users',
    color: 'text-purple-700',
    accentBg: 'bg-purple-50',
    borderColor: 'border-purple-200',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
  },
};

export const STANDARD_NEUROSCIENCE_INSIGHTS: Record<number, { title: string; description: string }> = {
  1: {
    title: 'Auditory Novelty & Attention Capture',
    description:
      'Varying pitch, acoustic novelty, and physical gestures stimulates dopamine release and activates the reticular activating system (RAS) for heightened focus.',
  },
  2: {
    title: 'Cognitive Load Chunking & Dual Coding',
    description:
      'Presenting target input in small multimodal chunks with visual anchors prevents working memory overload and strengthens phonological mapping.',
  },
  3: {
    title: 'Predictive Coding & Schema Activation',
    description:
      'Pre-task anticipation questions and image predictions activate neural schema, accelerating lexical retrieval and conceptual comprehension.',
  },
  4: {
    title: 'Social Brain Activation & Affective Filter Lowering',
    description:
      'Structured peer collaboration and buddy checks activate the prefrontal cortex and social neural circuits, lowering language anxiety.',
  },
  5: {
    title: 'Retrieval Practice & Dopamine Reinforcement',
    description:
      'Immediate post-task retrieval through exit tickets and board checks cements synaptic connections and delivers a feeling of competence.',
  },
  6: {
    title: 'Metacognitive Executive Function',
    description:
      'Self-reflecting on learning strategies strengthens prefrontal executive networks and promotes long-term autonomous learning habits.',
  },
};

export function generateDefaultStagesForSkill(
  skill: EflSkill,
  themeTitle: string,
  _scenario: string
): LessonStage[] {
  switch (skill) {
    case 'listening':
      return [
        {
          stageNumber: 1,
          name: 'Stage 1 - Warm-up / Pre-task (Engagement, Modeling and Clarification)',
          shortName: 'Warm-up / Pre-task',
          durationMinutes: 10,
          description: `Engage students with a 2-minute audio or video clip related to "${themeTitle}". Ask activating questions: "What keywords or sounds did you hear?" Use realia, flashcards, and Total Physical Response (TPR) gestures.`,
          neuroscienceInsight: STANDARD_NEUROSCIENCE_INSIGHTS[1],
        },
        {
          stageNumber: 2,
          name: 'Stage 2 - Presentation',
          shortName: 'Presentation',
          durationMinutes: 10,
          description: `Present the listening focus task for "${themeTitle}". Introduce key target vocabulary and grammatical structures. Model the active listening strategy: "Listen for main ideas first, then specific keywords."`,
          neuroscienceInsight: STANDARD_NEUROSCIENCE_INSIGHTS[2],
        },
        {
          stageNumber: 3,
          name: 'Stage 3 - Preparation',
          shortName: 'Preparation',
          durationMinutes: 12,
          description: `Distribute graphic listening worksheets (matching images, gap-fill, or checklist). Students formulate predictions with a partner using sentence starters before listening.`,
          neuroscienceInsight: STANDARD_NEUROSCIENCE_INSIGHTS[3],
        },
        {
          stageNumber: 4,
          name: 'Stage 4 - Performance',
          shortName: 'Performance',
          durationMinutes: 15,
          description: `Play the audio input twice. First pass: students identify core keywords. Second pass: complete guided comprehension items. In pairs, students verify responses orally.`,
          neuroscienceInsight: STANDARD_NEUROSCIENCE_INSIGHTS[4],
        },
        {
          stageNumber: 5,
          name: 'Stage 5 - Assessment / Post-task',
          shortName: 'Assessment / Post-task',
          durationMinutes: 8,
          description: `Review listening answers as a class. Administer a 2-question Exit Ticket: write 1 key vocabulary word and 1 main fact heard during the audio session.`,
          neuroscienceInsight: STANDARD_NEUROSCIENCE_INSIGHTS[5],
        },
        {
          stageNumber: 6,
          name: 'Stage 6 - Reflection',
          shortName: 'Reflection',
          durationMinutes: 5,
          description: `Lead a metacognitive reflection: "Which listening strategy helped you most today (pictures, keywords, or peer check)?" Connect today's input to the unit project.`,
          neuroscienceInsight: STANDARD_NEUROSCIENCE_INSIGHTS[6],
        },
      ];
    case 'reading':
      return [
        {
          stageNumber: 1,
          name: 'Stage 1 - Warm-up / Pre-task (Visual & Lexical Priming)',
          shortName: 'Warm-up / Pre-task',
          durationMinutes: 10,
          description: `Display illustrated cards or headlines related to "${themeTitle}". Students predict the reading topic and review key sight words.`,
          neuroscienceInsight: {
            title: 'Visual Pattern Recognition & Pre-activation',
            description:
              'Visual image prompts activate semantic memory networks in the occipital and temporal lobes before text processing.',
          },
        },
        {
          stageNumber: 2,
          name: 'Stage 2 - Presentation (Teacher Model Reading)',
          shortName: 'Presentation',
          durationMinutes: 10,
          description: `Read the model text aloud with expressive intonation. Point to text structures, headings, and sequence words. Model decoding strategies.`,
          neuroscienceInsight: STANDARD_NEUROSCIENCE_INSIGHTS[2],
        },
        {
          stageNumber: 3,
          name: 'Stage 3 - Preparation (Scaffolded Reading Guide)',
          shortName: 'Preparation',
          durationMinutes: 12,
          description: `Provide graphic organizers and reading strip cards. Students match highlighted vocabulary to illustrations and clarify difficult phrases in pairs.`,
          neuroscienceInsight: STANDARD_NEUROSCIENCE_INSIGHTS[3],
        },
        {
          stageNumber: 4,
          name: 'Stage 4 - Performance (Active Silent & Partner Reading)',
          shortName: 'Performance',
          durationMinutes: 15,
          description: `Students read the passage silently using highlighter pens. In pairs, Student A reads aloud while Student B locates key facts, then switch roles.`,
          neuroscienceInsight: STANDARD_NEUROSCIENCE_INSIGHTS[4],
        },
        {
          stageNumber: 5,
          name: 'Stage 5 - Assessment / Post-task (Fact Verification Check)',
          shortName: 'Assessment / Post-task',
          durationMinutes: 8,
          description: `Administer a 3-item true/false or sequence ordering check. Review answers as a whole group with immediate corrective feedback.`,
          neuroscienceInsight: STANDARD_NEUROSCIENCE_INSIGHTS[5],
        },
        {
          stageNumber: 6,
          name: 'Stage 6 - Reflection (Metacognitive Strategy Anchor)',
          shortName: 'Reflection',
          durationMinutes: 5,
          description: `Lead reflection: "How did finding clue words help you understand the text?" Preview the upcoming Speaking lesson.`,
          neuroscienceInsight: STANDARD_NEUROSCIENCE_INSIGHTS[6],
        },
      ];
    case 'speaking':
      return [
        {
          stageNumber: 1,
          name: 'Stage 1 - Warm-up / Pre-task (Pronunciation & Oral Drill)',
          shortName: 'Warm-up / Pre-task',
          durationMinutes: 10,
          description: `Conduct a rapid choral chant and physical command game (Simon Says / Quick Response) focusing on target sentence frames for "${themeTitle}".`,
          neuroscienceInsight: {
            title: 'Motor-Auditory Integration & Speech Priming',
            description:
              "Rhythmic oral repetition synchronizes speech motor circuits in Broca's area with auditory feedback loops.",
          },
        },
        {
          stageNumber: 2,
          name: 'Stage 2 - Presentation (Dialogue & Frame Modeling)',
          shortName: 'Presentation',
          durationMinutes: 10,
          description: `Demonstrate a two-way spoken exchange with a student volunteer. Introduce speaking frames: e.g. "In my opinion...", "First, we should...", "Can you help me with...?".`,
          neuroscienceInsight: {
            title: 'Mirror Neuron Acoustic Imitation',
            description:
              'Observing mouth movements and conversational rhythm activates mirror neurons, facilitating speech reproduction.',
          },
        },
        {
          stageNumber: 3,
          name: 'Stage 3 - Preparation (Dialogue Substitution Rehearsal)',
          shortName: 'Preparation',
          durationMinutes: 12,
          description: `In pairs, students practice substitution drill cards, alternating vocabulary words within the target grammatical frame. Teacher provides encouraging feedback.`,
          neuroscienceInsight: STANDARD_NEUROSCIENCE_INSIGHTS[3],
        },
        {
          stageNumber: 4,
          name: 'Stage 4 - Performance (Information-Gap / Role-Play)',
          shortName: 'Performance',
          durationMinutes: 15,
          description: `Students execute an interactive role-play or information-gap exchange using realia or cue cards. Both partners produce 2-3 intelligible communicative sentences.`,
          neuroscienceInsight: STANDARD_NEUROSCIENCE_INSIGHTS[4],
        },
        {
          stageNumber: 5,
          name: 'Stage 5 - Assessment / Post-task (Pair Showcase & Oral Rubric)',
          shortName: 'Assessment / Post-task',
          durationMinutes: 8,
          description: `Spotlight 2-3 pairs to present their dialogue. Peers provide thumbs-up feedback for clarity, volume, and target language usage.`,
          neuroscienceInsight: STANDARD_NEUROSCIENCE_INSIGHTS[5],
        },
        {
          stageNumber: 6,
          name: 'Stage 6 - Reflection (Self-Confidence Check)',
          shortName: 'Reflection',
          durationMinutes: 5,
          description: `Students self-rate their speaking confidence on a 1-3 scale. Teacher reinforces positive effort. Preview the Writing lesson.`,
          neuroscienceInsight: STANDARD_NEUROSCIENCE_INSIGHTS[6],
        },
      ];
    case 'writing':
      return [
        {
          stageNumber: 1,
          name: 'Stage 1 - Warm-up / Pre-task (Sentence Mechanics Warm-up)',
          shortName: 'Warm-up / Pre-task',
          durationMinutes: 10,
          description: `Race to un-scramble target sentences on the board. Review capital letters, word spacing, punctuation (periods/commas), and target spelling.`,
          neuroscienceInsight: {
            title: 'Syntactic Schema Priming & Working Memory',
            description:
              'Manipulating sentence fragments engages the left inferior frontal gyrus for syntactic rule application.',
          },
        },
        {
          stageNumber: 2,
          name: 'Stage 2 - Presentation (Writing Model Analysis)',
          shortName: 'Presentation',
          durationMinutes: 10,
          description: `Analyze a model paragraph or project card for "${themeTitle}". Highlight sentence starters, transition words, and grammar agreement.`,
          neuroscienceInsight: STANDARD_NEUROSCIENCE_INSIGHTS[2],
        },
        {
          stageNumber: 3,
          name: 'Stage 3 - Preparation (Word Bank & Graphic Organizer)',
          shortName: 'Preparation',
          durationMinutes: 12,
          description: `Students complete a pre-writing graphic organizer with thematic word banks, selecting verbs, adjectives, and connectors for their project sentences.`,
          neuroscienceInsight: STANDARD_NEUROSCIENCE_INSIGHTS[3],
        },
        {
          stageNumber: 4,
          name: 'Stage 4 - Performance (Guided Project Drafting)',
          shortName: 'Performance',
          durationMinutes: 15,
          description: `Students draft 3-5 structured sentences for their unit project on the official writing worksheet. Teacher circulates giving surgical feedback.`,
          neuroscienceInsight: {
            title: 'Haptic Encoding through Handwriting',
            description:
              'Writing by hand reinforces orthographic memory and syntactic retention compared to passive viewing.',
          },
        },
        {
          stageNumber: 5,
          name: 'Stage 5 - Assessment / Post-task (Peer Editing Check)',
          shortName: 'Assessment / Post-task',
          durationMinutes: 8,
          description: `Students swap drafts with a peer and complete a 4-point checklist: Capital letters, Punctuation, Target Vocabulary, Clarity.`,
          neuroscienceInsight: STANDARD_NEUROSCIENCE_INSIGHTS[5],
        },
        {
          stageNumber: 6,
          name: 'Stage 6 - Reflection (Publishing Pride)',
          shortName: 'Reflection',
          durationMinutes: 5,
          description: `Students share one sentence they are proud of with the class. Preview the collaborative Mediation lesson.`,
          neuroscienceInsight: STANDARD_NEUROSCIENCE_INSIGHTS[6],
        },
      ];
    case 'mediation':
      return [
        {
          stageNumber: 1,
          name: 'Stage 1 - Warm-up / Pre-task (Mediation Concept Activation)',
          shortName: 'Warm-up / Pre-task',
          durationMinutes: 10,
          description: `Introduce mediation in communication: "How can we help peers understand when words are challenging?" Demonstrate gestures, drawings, and simplification.`,
          neuroscienceInsight: {
            title: 'Theory of Mind & Social Empathy Networks',
            description:
              "Anticipating a peer's understanding activates the temporoparietal junction and empathetic social cognition.",
          },
        },
        {
          stageNumber: 2,
          name: 'Stage 2 - Presentation (Project Presentation Protocol)',
          shortName: 'Presentation',
          durationMinutes: 10,
          description: `Model the cooperative project presentation protocol for "${themeTitle}". Show how teammates divide speaking roles and support each other with visual aids.`,
          neuroscienceInsight: {
            title: 'Collaborative Goal Structuring',
            description:
              'Clear division of roles reduces anxiety and optimizes shared executive processing.',
          },
        },
        {
          stageNumber: 3,
          name: 'Stage 3 - Preparation (Team Project Rehearsal)',
          shortName: 'Preparation',
          durationMinutes: 12,
          description: `Teams rehearse their project presentation, practicing non-verbal cues, pointing to poster elements, and paraphrasing complex words for their audience.`,
          neuroscienceInsight: STANDARD_NEUROSCIENCE_INSIGHTS[3],
        },
        {
          stageNumber: 4,
          name: 'Stage 4 - Performance (Project Exhibition & Gallery Walk)',
          shortName: 'Performance',
          durationMinutes: 15,
          description: `Execute a classroom Gallery Walk / Exhibition. Presenters explain their project artifacts; visiting peers ask simple questions and provide feedback.`,
          neuroscienceInsight: {
            title: 'Dynamic Interactive Immersion',
            description:
              'Physical station rotation elevates alertness and promotes communicative flow in contextualized environments.',
          },
        },
        {
          stageNumber: 5,
          name: 'Stage 5 - Assessment / Post-task (Unit Evaluation & Rubric)',
          shortName: 'Assessment / Post-task',
          durationMinutes: 8,
          description: `Evaluate team presentations using the MEDUCA 21st-Century Collaborative Rubric. Students award peer appreciation stars.`,
          neuroscienceInsight: STANDARD_NEUROSCIENCE_INSIGHTS[5],
        },
        {
          stageNumber: 6,
          name: 'Stage 6 - Reflection (Unit Synthesis & Celebration)',
          shortName: 'Reflection',
          durationMinutes: 5,
          description: `Lead whole-class reflection: "How did we combine listening, reading, speaking, writing, and mediation to complete our project?" Celebrate achievements.`,
          neuroscienceInsight: STANDARD_NEUROSCIENCE_INSIGHTS[6],
        },
      ];
  }
}

export function createNewThemePlanner(
  groupId: string,
  trimester: TrimesterId | number,
  themeNumber: number,
  themeTitle: string,
  scenario: string,
  cefrLevel: string = 'A1.3',
  gradeLevel: string = '7mo Grado'
): ThemePlanner {
  const cleanTitle = themeTitle.trim() || 'First, I Cut the Paper.';
  const cleanScenario = scenario.trim() || 'Following Instructions at School (S1)';
  const skills: EflSkill[] = ['listening', 'reading', 'speaking', 'writing', 'mediation'];

  const lessons: SkillLessonPlan[] = skills.map((sk, idx) => {
    const meta = SKILL_METADATA[sk];
    return {
      id: `les-${Date.now()}-${sk}`,
      skill: sk,
      lessonNumber: idx + 1,
      skillTitle: meta.title,
      specificObjective: `By the end of Lesson ${idx + 1}, students will demonstrate communicative proficiency in ${sk} related to "${cleanTitle}" with ≥80% accuracy using visual supports and gesture cues.`,
      learningOutcome: `Demonstrate active comprehension and productive usage of target vocabulary and structures for ${sk} within the theme "${cleanTitle}".`,
      totalTimeMinutes: 60,
      stages: generateDefaultStagesForSkill(sk, cleanTitle, cleanScenario),
      formativeAssessmentStrategy: `Observation checklist during pair work, Exit Ticket (1 keyword + 1 fact), and ${sk} performance rating.`,
      reinforcementHomework: `Review the ${sk} worksheet at home and share 2 English concepts about "${cleanTitle}" with family.`,
      teacherReflection: `Monitorear el andamiaje visual y la respuesta de los estudiantes con adaptaciones curriculares.`,
    };
  });

  return {
    id: `theme-${Date.now()}`,
    groupId,
    trimester,
    themeNumber,
    scenario: cleanScenario,
    themeTitle: cleanTitle,
    cefrLevel,
    gradeLevel,
    weeklyPeriods: 7,
    weeksRange: `Semana ${themeNumber * 4} - Semana ${themeNumber * 4 + 4}`,
    schoolYear: 2026,
    status: 'Planificado',
    standardsAndOutcomes: [
      {
        skill: 'listening',
        skillName: '1. Listening',
        specificCurriculumStandard:
          'Follow clear instructions and execute multi-step oral directions in structured contexts.',
        expectedLearningOutcome:
          `Identify key vocabulary and main ideas from audio inputs related to "${cleanTitle}" with ≥80% accuracy.`,
      },
      {
        skill: 'reading',
        skillName: '2. Reading',
        specificCurriculumStandard:
          'Show comprehension of short written descriptions, stories, and simple procedures.',
        expectedLearningOutcome:
          `Locate and list 3–5 specific facts from texts related to "${cleanTitle}".`,
      },
      {
        skill: 'speaking',
        skillName: '3. Speaking',
        specificCurriculumStandard:
          'Give simple directions and participate in short, guided conversational exchanges.',
        expectedLearningOutcome:
          `Produce 2–3 coherent sentences using target frames in a role-play or peer dialogue about "${cleanTitle}".`,
      },
      {
        skill: 'writing',
        skillName: '4. Writing',
        specificCurriculumStandard:
          'Create short, organized texts using sentence starters and visual word banks.',
        expectedLearningOutcome:
          `Write 3–5 correctly punctuated sentences for the unit project presentation on "${cleanTitle}".`,
      },
      {
        skill: 'mediation',
        skillName: '5. Mediation',
        specificCurriculumStandard:
          'Simplify instructional content and assist peers using non-verbal and visual cues.',
        expectedLearningOutcome:
          `Present the unit project collaboratively applying at least 2 mediation strategies (gestures, simplification).`,
      },
    ],
    competences: {
      linguistic: {
        grammar: 'Imperatives, Sequence words (first, next, then, finally), Present Simple, Modals of advice.',
        vocabulary: 'action verbs, classroom objects, nature terms, sequence connectors, descriptive adjectives.',
        phonetics: 'Target phonemes and minimal pairs in context.',
      },
      pragmatic: {
        communicativeFunctions:
          'Giving instructions, expressing ideas, asking for clarification, collaborating in teams.',
      },
      sociolinguistic: {
        socioCulturalAspects:
          'Active teamwork, polite turn-taking, cultural appreciation of Panamanian contexts, and respectful listening.',
      },
    },
    unitProject: {
      title: `Project: Illustrated Guide & Showcase for "${cleanTitle}"`,
      description:
        `Create and co-present an illustrated project guide highlighting key concepts of "${cleanTitle}" with oral peer presentation.`,
    },
    materialsAndResources:
      'Flashcards, realia, audio/video recordings, visual graphic organizers, sentence starters, color-coded word banks, poster sheets, markers.',
    differentiatedInstruction:
      'Visual image prompts, chunked instruction steps, peer buddy pairing, physical TPR gestures, extended practice time, simplified sentence frames.',
    lessons,
  };
}

export const generateNewThemePlanner = createNewThemePlanner;

export function generateNewWeeklyPlanner(
  groupId: string,
  trimester: TrimesterId | number,
  weekNumber: number
): WeeklyPlanner {
  return {
    id: `weekly-${Date.now()}`,
    groupId,
    trimester,
    weekNumber,
    datesRange: '24 al 28 de Agosto, 2026',
    topic: 'Unit 5: Community & Environmental Stewardship in Boquete',
    area: 'Área 2: Estructura Gramatical y Comunicación Oral',
    weeklyHours: 5,
    fundamentalCompetencies: 'Comunicación en lengua extranjera, pensamiento crítico, ciudadanía y conservación.',
    learningAchievements: 'Identifica y describe acciones ecológicas utilizando vocabulario específico y estructuras de futuro.',
    learningActivities: {
      start: 'Dinámica de activación: lluvia de ideas sobre reciclaje y proyección de imágenes de Boquete.',
      development: 'Lectura compartida de texto "Eco-Action", trabajo en parejas resolviendo ejercicios de vocabulario y elaboración de mini-afiches.',
      closure: 'Presentación oral de afiches por equipos y ticket de salida con 2 compromisos ecológicos en inglés.',
    },
    evaluationCriteria: 'Rúbrica de expresión oral (claridad y pronunciación) y lista de cotejo de producción escrita.',
    didacticResources: 'Libro de texto MEDUCA, tarjetas léxicas, cartulinas, proyector multimedia.',
    status: 'En Curso',
  };
}
