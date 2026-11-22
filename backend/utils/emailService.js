const nodemailer = require('nodemailer');

/**
 * Creates Nodemailer transporter based on .env settings
 */
const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    return null;
  }

  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
};

/**
 * Sends OTP email using Nodemailer, with high-visibility terminal logging fallback for testing
 */
const sendOtpEmail = async ({ to, name, otp }) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  // Prominent terminal notification for evaluation and local demo
  console.log(`
  ==============================================================
  🔑 [PICKSY AUTH] PASSWORD RESET OTP GENERATED
  👤 Recipient: ${name || 'Customer'} <${to}>
  🔢 6-Digit OTP: ${otp}
  ⏱️ Expiration: 10 Minutes from now
  ==============================================================
  `);

  if (!emailUser || !emailPass) {
    console.log('[Picksy Mailer] EMAIL_USER / EMAIL_PASS not configured in .env. Logged OTP in terminal for test convenience.');
    return { sent: false, fallback: true };
  }

  try {
    const transporter = createTransporter();
    if (!transporter) return { sent: false, fallback: true };

    const mailOptions = {
      from: `"Picksy Security" <${emailUser}>`,
      to,
      subject: `Your Picksy Password Reset OTP: ${otp}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #FAFAFC; border-radius: 16px; border: 1px solid #E2E8F0;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 12px; background: #4F46E5; color: #FFFFFF; font-size: 20px; font-weight: 800;">P</div>
            <h2 style="margin: 12px 0 4px 0; color: #0F172A; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Picksy</h2>
            <p style="margin: 0; color: #64748B; font-size: 13px;">Pick Smartly, Shop Wisely.</p>
          </div>
          
          <div style="background: #FFFFFF; border-radius: 14px; padding: 24px; border: 1px solid #E2E8F0; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);">
            <h3 style="margin: 0 0 12px 0; color: #0F172A; font-size: 16px; font-weight: 700;">Password Reset Verification</h3>
            <p style="margin: 0 0 18px 0; color: #475569; font-size: 14px; line-height: 1.5;">
              Hello ${name || 'User'},<br/>
              We received a request to reset your Picksy password. Enter the 6-digit One-Time Password (OTP) below to verify your identity:
            </p>
            
            <div style="text-align: center; margin: 24px 0; padding: 18px; background: #EEF2FF; border-radius: 12px; border: 1px dashed #6366F1;">
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #4338CA; font-family: monospace;">${otp}</span>
            </div>
            
            <p style="margin: 0 0 8px 0; color: #64748B; font-size: 12px; line-height: 1.4;">
              ⏱️ This code is strictly single-use and will expire in <strong>10 minutes</strong>.
            </p>
            <p style="margin: 0; color: #94A3B8; font-size: 12px;">
              If you didn't initiate this request, you can safely ignore this email; your password remains unchanged.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 24px; color: #94A3B8; font-size: 11px;">
            © ${new Date().getFullYear()} Picksy Inc. — Intelligent Shopping Decision Engine
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[Picksy Mailer] Email sent successfully to', to, '| MessageID:', info.messageId);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Picksy Mailer] Nodemailer error:', error.message);
    return { sent: false, error: error.message };
  }
};

module.exports = {
  sendOtpEmail,
};
