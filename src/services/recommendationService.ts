import { GoogleGenAI, Type } from "@google/genai";
import { Job, UserProfile } from "../types";

export const recommendationService = {
  async getRecommendedJobs(profile: UserProfile, allJobs: Job[]): Promise<string[]> {
    if (!profile || allJobs.length === 0) return [];

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      // Prepare job data for the prompt - keep it minimal to save tokens
      const jobsData = allJobs.map(job => ({
        id: job.id,
        title: job.title,
        description: job.description.substring(0, 200) + "...",
        location: job.location,
        jobType: job.jobType,
        requirements: job.requirements || []
      }));

      // Prepare profile data
      const profileData = {
        skills: profile.skills || [],
        bio: profile.bio || "",
        experience: (profile.experience || []).map(exp => ({
          position: exp.position,
          company: exp.company,
          description: exp.description
        }))
      };

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            text: `As an expert career advisor, analyze the following medical professional's profile and recommend the best matching jobs from the provided list.
            
            User Profile:
            ${JSON.stringify(profileData)}
            
            Available Jobs:
            ${JSON.stringify(jobsData)}
            
            Return a JSON object with a single key 'recommendedJobIds' which is an array of strings containing the IDs of the top 5-10 most relevant jobs, ordered by relevance. If no good matches are found, return an empty array.`,
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendedJobIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["recommendedJobIds"]
          }
        }
      });

      const result = JSON.parse(response.text);
      return result.recommendedJobIds || [];
    } catch (error) {
      console.error("Error getting AI recommendations:", error);
      return [];
    }
  }
};
