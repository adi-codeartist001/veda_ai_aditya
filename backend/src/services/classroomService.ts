import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface StudentPersona {
  id: string;
  name: string;
  archetype: 'bright' | 'confused' | 'bored' | 'curious' | 'shy' | 'backbencher' | 'overachiever' | 'average';
  row: number;
  col: number;
  expression: 'neutral' | 'happy' | 'confused' | 'bored' | 'excited' | 'hand_raised' | 'sleeping' | 'whispering';
  engagementScore: number;
}

export interface ClassroomResponse {
  studentReactions: {
    studentId: string;
    expression: StudentPersona['expression'];
    message?: string;
    isQuestion: boolean;
  }[];
  engagementChange: number;
  classroomMood: 'engaged' | 'confused' | 'bored' | 'excited' | 'mixed';
  teacherFeedback: string;
  suggestedNextAction: string;
}

export const STUDENT_NAMES = [
  'Aarav','Priya','Rohan','Ananya','Vikram','Sneha','Arjun','Kavya',
  'Rahul','Pooja','Akash','Neha','Siddharth','Riya','Karan','Divya',
  'Nikhil','Shreya','Aditya','Meera','Varun','Sakshi','Mohit','Tanvi',
  'Raj','Simran','Amit','Nisha','Harsh','Komal'
];

export const ARCHETYPES: StudentPersona['archetype'][] = [
  'bright','confused','bored','curious','shy','backbencher','overachiever','average',
  'average','average','average','curious','confused','bored','shy','backbencher'
];

export async function generateClassroomResponse(
  teacherMessage: string,
  subject: string,
  topic: string,
  students: StudentPersona[],
  conversationHistory: { role: string; content: string }[],
  language: 'english' | 'hindi' | 'hinglish'
): Promise<ClassroomResponse> {
  const langInstr = {
    english: 'Respond in English.',
    hindi: 'Respond in Hindi (Roman script, easy to read).',
    hinglish: 'Respond in Hinglish (mix of Hindi and English, conversational).',
  }[language];

  const studentSummary = students.slice(0, 8).map(s =>
    `${s.name} (${s.archetype}, engagement: ${s.engagementScore}%)`
  ).join(', ');

  const prompt = `You are simulating a realistic Indian school classroom for subject: ${subject}, topic: ${topic}.

Teacher just said: "${teacherMessage}"

Student profiles (sample): ${studentSummary}

${langInstr}

Generate realistic classroom reactions. Respond ONLY with valid JSON:
{
  "studentReactions": [
    {
      "studentId": "s1",
      "expression": "confused|happy|bored|excited|hand_raised|sleeping|whispering|neutral",
      "message": "what student says/thinks (optional, max 20 words)",
      "isQuestion": true/false
    }
  ],
  "engagementChange": number between -15 and +20,
  "classroomMood": "engaged|confused|bored|excited|mixed",
  "teacherFeedback": "1-2 sentences of coaching feedback for the teacher on how they explained",
  "suggestedNextAction": "specific suggestion for what teacher should do next"
}

Rules:
- Include 4-8 student reactions
- bright/overachiever students: hand_raised, excited, ask smart questions
- confused students: confused expression, ask clarifying questions  
- bored/backbencher: sleeping, whispering, minimal engagement
- curious students: excited, ask interesting questions
- shy students: neutral, rarely speak
- Make student messages sound like real Indian school students
- teacherFeedback should be constructive and encouraging`;

  const history = conversationHistory.slice(-6).map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      ...history,
      { role: 'user', content: prompt }
    ],
    max_tokens: 1000,
    temperature: 0.85,
  });

  const raw = response.choices[0]?.message?.content || '';
  const cleaned = raw.replace(/```json|```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  const result: ClassroomResponse = JSON.parse(cleaned.slice(start, end + 1));
  return result;
}
