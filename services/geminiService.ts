
import { GoogleGenAI } from "@google/genai";

// Use process.env.API_KEY as per the rules
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const explainQuestion = async (question: string, options: string[], correctAnswer: number) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Explain why the following question has the correct answer: "${options[correctAnswer]}". 
      Question: ${question}
      Options: ${options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join(', ')}`,
      config: {
        systemInstruction: "You are a helpful academic tutor at Al'Istiqama University Sumaila. Provide concise, accurate, and supportive academic explanations."
      }
    });
    return response.text;
  } catch (error) {
    console.error('Gemini explanation error:', error);
    return "The explanation engine is temporarily unavailable. Please check your course materials.";
  }
};

export const generateStudyPlan = async (examResults: any) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a personalized study plan for a student who scored ${examResults.percentage}% on their "${examResults.examTitle}" exam. 
      Incorrect Topics: ${JSON.stringify(examResults.questionBreakdown.filter((q: any) => !q.isCorrect).map((q: any) => q.question))}`,
      config: {
        systemInstruction: "You are a personalized learning coach at AUSU. Create supportive, actionable, and structured study plans based on student performance. Focus on weak areas."
      }
    });
    return response.text;
  } catch (error) {
    console.error('Gemini study plan error:', error);
    return "We could not generate a study plan at this moment. Focus on the questions you missed in your results breakdown.";
  }
};
