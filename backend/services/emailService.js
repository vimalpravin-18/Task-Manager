const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

// Create a reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT || 587,
  auth: {
    user: process.env.EMAIL_USER, // Required
    pass: process.env.EMAIL_PASS  // Required
  }
});

const sendOverdueTaskEmail = async (userEmail, userName, taskTitle, dueDate) => {
  try {
    const formattedDate = new Date(dueDate).toLocaleDateString();
    
    const mailOptions = {
      from: `"TaskFlow" <${process.env.EMAIL_USER || 'noreply@taskmaster.com'}>`,
      to: userEmail,
      subject: `Action Required: Task "${taskTitle}" is Overdue!`,
      text: `Hello ${userName},\n\nThis is a friendly reminder that your task "${taskTitle}" was due on ${formattedDate}.\n\nPlease log in to TaskMaster to complete it or update its due date.\n\nBest regards,\nThe TaskMaster Team`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #ef4444;">Task Overdue</h2>
          <p>Hello <strong>${userName}</strong>,</p>
          <p>This is a friendly reminder that your task <strong>"${taskTitle}"</strong> was due on <strong>${formattedDate}</strong>.</p>
          <p>Please log in to TaskMaster to complete it or update its due date.</p>
          <br/>
          <p>Best regards,<br/><strong>The TaskMaster Team</strong></p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Reminder email sent to ${userEmail} for task "${taskTitle}" (Message ID: ${info.messageId})`);
    
    // If using ethereal, log the preview URL
    if (process.env.SMTP_HOST === 'smtp.ethereal.email' || !process.env.SMTP_HOST) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (error) {
    console.error(`Failed to send email to ${userEmail}:`, error.message);
    return false;
  }
};

module.exports = {
  sendOverdueTaskEmail
};
