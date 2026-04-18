import { GoogleGenerativeAI } from "@google/generative-ai";

const parseGeminiError = (error, defaultMsg) => {
  const msg = error?.message || "";
  if (msg.includes("fetch failed") || msg.includes("network")) return "Network connection failed. Please verify your internet.";
  if (msg.includes("API_KEY_INVALID") || msg.includes("API key expired")) return "API key expired or invalid. Please update your environment variables.";
  if (msg.includes("429") || msg.includes("quota")) return "API Rate limit exceeded. Please wait a moment.";
  return defaultMsg + " (" + msg.substring(0,40) + "...)";
};

export const generateStudyInsights = async (sessionsData) => {
  if (!sessionsData || sessionsData.length === 0) {
    return { error: "Start studying to unlock AI insights" };
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Gemini API Key missing in .env");
    return { error: "Unable to generate insights (API key missing)" };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const recentSessions = [...sessionsData].sort((a,b) => b.startTime - a.startTime).slice(0, 10);
    
    const sessionsText = recentSessions.map(session => {
      const min = Math.floor(session.duration / 60);
      const date = new Date(session.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      return `- ${date}: ${min} minutes`;
    }).join("\n");

    const prompt = `
You are an expert study data analyst.
Here are the user's last ${recentSessions.length} study sessions:
${sessionsText}

Please analyze this data and return EXACTLY a JSON string meeting this exact format structure, with no markdown formatting or extra text:
{
  "analysis": {
    "totalSessions": "${recentSessions.length}",
    "averageDuration": "X minutes",
    "frequentTime": "X",
    "consistency": "(low / medium / high)"
  },
  "recommendations": [
    "Actionable tip 1",
    "Actionable tip 2"
  ]
}

Rules for Recommendations:
- Suggest 2-3 actionable tips based on data.
- Include a Pomodoro suggestion if sessions are short, a break suggestion if long, or a consistency improvement if gaps exist.
- Keep it extremely practical.
- No motivational fluff AT ALL.
- No generic phrases like "great job".
- Base everything ONLY on the actual session data provided.
    `;

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { error: "Unable to generate insights" };
  }
};

export const generateQuizContent = async (notesText) => {
  if (!notesText || notesText.trim() === '') {
    return { error: "Please provide study notes to generate the quiz." };
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return { error: "Unable to generate test. API key is missing." };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
You are an expert educational AI. 
Based on the following study notes, generate a mix of testing materials.

Return EXACTLY a JSON string meeting this exact format structure, with no markdown formatting or extra text:
{
  "flashcards": [
    { "question": "Question text here?", "answer": "Answer here." }
  ],
  "mcqs": [
    {
      "question": "MCQ Question here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A"
    }
  ],
  "fillBlanks": [
    {
      "question": "React uses ___ to manage state",
      "answer": "hooks"
    }
  ]
}

Ensure you provide:
- Up to 5 concise flashcards
- Up to 5 good MCQs with EXACTLY 4 options and perfect correctAnswer exact matching one option.
- Up to 5 fill-in-the-blank questions (answer should be 1-2 words). Replace the blank with "___" in the question text.

Study Notes:
${notesText}
    `;

    const result = await model.generateContent(prompt);
    const resData = JSON.parse(result.response.text());
    return resData;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { error: parseGeminiError(error, "Unable to generate test setup.") };
  }
};

export const generateStudySummary = async (notesText) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return { error: "API key missing" };

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });
    const prompt = `
Create a quick AI summary of these study notes.
Return exactly a JSON string with a single array "summary" containing 4-6 concise bullet points explaining key concepts.
Do not use markdown blocks. Return only JSON format:
{
  "summary": ["Point 1", "Point 2"]
}
Notes:
${notesText}
    `;
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (err) {
    return { error: parseGeminiError(err, "Unable to generate insights.") };
  }
};

export const generateTestFeedback = async (qaData) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return { error: "API key missing" };

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });
    const prompt = `
You are an expert tutor. Analyze the student's test performance based on this data:
${JSON.stringify(qaData)}

Return exactly a JSON string meeting this exact format structure, no markdown blocks:
{
  "weakAreas": ["Topic A", "Topic B"],
  "strongAreas": ["Topic C", "Topic D"],
  "tips": [
    "Actionable tip 1",
    "Actionable tip 2"
  ]
}
    `;
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch(err) {
    return { error: parseGeminiError(err, "Unable to analyze performance.") };
  }
};

export const generateLearningSummary = async (testHistory) => {
  if (!testHistory || testHistory.length === 0) return { error: "No test history." };

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return { error: "API key missing" };

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const recentTests = [...testHistory].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
    const historyText = recentTests.map(t => {
      let txt = `- Score: ${t.score}/${t.total}`;
      if (t.feedback?.weakAreas?.length) txt += ` | Weaknesses: ${t.feedback.weakAreas.join(', ')}`;
      if (t.feedback?.strongAreas?.length) txt += ` | Strengths: ${t.feedback.strongAreas.join(', ')}`;
      return txt;
    }).join("\n");

    const prompt = `
You are an expert educational data analyst.
Here is the user's test history data (last ${recentTests.length} tests):
${historyText}

Analyze this performance and return EXACTLY a JSON string meeting this exact format structure, with no markdown formatting:
{
  "summary": {
    "trend": "(improving / declining / inconsistent)",
    "commonWeakTopics": ["Topic A", "Topic B"],
    "strongAreas": ["Topic C", "Topic D"]
  },
  "actionPlan": [
    "Specific suggestion 1 referencing weak topics",
    "Specific suggestion 2"
  ]
}

Rules:
- Give exactly 2-3 specific action plan suggestions targeting weak areas.
- Do NOT include generic motivational text.
- Must reference actual data.
- Keep concise and practical.
    `;

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (err) {
    return { error: parseGeminiError(err, "Unable to generate learning summary.") };
  }
};
