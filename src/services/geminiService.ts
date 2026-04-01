import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const geminiService = {
  generateApplicationStatusEmail: async (
    applicantName: string,
    jobTitle: string,
    companyName: string,
    status: string
  ) => {
    const prompt = `
      Generate a professional and empathetic email to a job applicant named ${applicantName}.
      The job title is "${jobTitle}" at "${companyName}".
      The application status has been updated to: "${status}".
      
      If the status is "accepted", the email should be celebratory and mention that the company will be in touch soon for next steps.
      If the status is "rejected", the email should be polite, thanking them for their time and interest, and wishing them luck in their search.
      If the status is "reviewed", mention that their application has been reviewed and they will hear back soon.
      
      Return only the HTML content for the email body. Do not include a subject line or any other text.
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      return response.text || `<p>Your application for ${jobTitle} at ${companyName} has been updated to ${status}.</p>`;
    } catch (error) {
      console.error("Gemini email generation error:", error);
      return `<p>Your application for ${jobTitle} at ${companyName} has been updated to ${status}.</p>`;
    }
  },
};
