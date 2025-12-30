
import { GoogleGenAI, Type } from "@google/genai";

// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const explainQuestion = async (question: string, options: string[], correctAnswer: number) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Explain why the following question has the correct answer: "${options[correctAnswer]}". 
      Question: ${question}
      Options: ${options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join(', ')}`,
      config: {
        systemInstruction: "You are a helpful academic tutor at Al'Istiqama University Sumaila. Provide concise, accurate explanations for computer science and mathematics students."
      }
    });
    // Use .text property directly
    return response.text;
  } catch (error) {
    console.error('Gemini explanation error:', error);
    return "Explanation unavailable at the moment.";
  }
};

export const generateStudyPlan = async (examResults: any) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a personalized study plan for a student who scored ${examResults.percentage}% on their "${examResults.examTitle}" exam. 
      Details: ${JSON.stringify(examResults.questionBreakdown.filter((q: any) => !q.isCorrect))}`,
      config: {
        systemInstruction: "You are a personalized learning coach at AUSU. Create supportive and actionable study plans based on exam results."
      }
    });
    // Use .text property directly
    return response.text;
  } catch (error) {
    console.error('Gemini study plan error:', error);
    return "Study plan could not be generated.";
  }
};
