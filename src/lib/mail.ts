import nodemailer from "nodemailer";

/**
 * Centrally managed email notification service.
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || "587", 10);
    const secure = process.env.SMTP_SECURE === "true";
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || '"Achariya Portal" <samdev0418@gmail.com>';

    if (!host || !user || !pass) {
      console.warn("⚠️ SMTP credentials missing in .env. Email not sent.");
      return false;
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    console.log(`[Email Service] Sent: ${subject} to ${to} (ID: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error("[Email Service] Send Error Details:", error);
    return false;
  }
}
