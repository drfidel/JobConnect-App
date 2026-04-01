import { geminiService } from "./geminiService";

export const emailService = {
  sendApplicationStatusUpdate: async (
    to: string,
    applicantName: string,
    jobTitle: string,
    companyName: string,
    status: string
  ) => {
    const html = await geminiService.generateApplicationStatusEmail(
      applicantName,
      jobTitle,
      companyName,
      status
    );

    const subject = `Application Status Update: ${jobTitle} at ${companyName}`;

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to,
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Email API error:", errorData);
        return { success: false, error: errorData.error };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("Failed to send email:", error);
      return { success: false, error: "Network error" };
    }
  },
};
