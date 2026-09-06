import config from '../config/index.js';

const isPlaceholderKey = (key) => {
  if (!key) return true;
  const cleaned = key.trim().toLowerCase();
  return (
    cleaned === '' ||
    cleaned.includes('placeholder') ||
    cleaned.startsWith('your_') ||
    cleaned === 'dummy' ||
    cleaned === 'mock'
  );
};

/**
 * Send email using Brevo transactional API with safe fallback for dev/testing environments
 * @param {object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.subject - Email subject
 * @param {string} params.html - HTML content
 * @param {string} [params.text] - Plaintext fallback
 * @returns {Promise<{ success: boolean, id?: string, error?: string }>}
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const apiKey = config.brevo.apiKey;
  const fromEmail = config.brevo.fromEmail || 'noreply@fideloebike.store';
  const fromName = config.brevo.fromName || 'Fidelo E-Bike Store';

  if (isPlaceholderKey(apiKey)) {
    console.log(`[EMAIL DEV LOG] Brevo API key not configured or placeholder. Simulating email to: ${to}`);
    console.log(`[EMAIL DEV LOG] Subject: ${subject}`);
    console.log(`[EMAIL DEV LOG] Content:\n${text || html}`);
    return { success: true, id: 'simulated_dev_email_id' };
  }

  const payload = {
    sender: {
      name: fromName,
      email: fromEmail,
    },
    to: [{ email: to }],
    subject,
    htmlContent: html || (text ? text.replace(/\n/g, '<br>') : ''),
  };

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('[BREVO API ERROR]:', data);
      return { success: false, error: data.message || `Brevo request failed with status ${response.status}` };
    }

    const emailId = data.messageId || data.id || 'brevo_sent_id';
    console.log(`[BREVO EMAIL SENT] ID: ${emailId} to ${to}`);
    return { success: true, id: emailId };
  } catch (error) {
    console.error('[BREVO API EXCEPTION]:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send 6-digit Email Verification Code
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.code
 * @param {string} params.name
 */
export const sendVerificationEmail = async ({ email, code, name }) => {
  const subject = `Your Verification Code for Fidelo E-Bike Store: ${code}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #2563eb; margin-top: 0;">Welcome to Fidelo E-Bikes, ${name}!</h2>
      <p style="color: #475569; font-size: 15px;">Please use the verification code below to confirm your account email address:</p>
      <div style="background-color: #f1f5f9; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0f172a;">${code}</span>
      </div>
      <p style="color: #64748b; font-size: 13px;">This verification code will expire in 15 minutes. If you did not request this account, please ignore this email.</p>
    </div>
  `;
  const text = `Welcome to Fidelo E-Bikes, ${name}! Your verification code is: ${code}. It expires in 15 minutes.`;

  return await sendEmail({ to: email, subject, html, text });
};

export const sendPasswordResetEmail = async ({ email, code, name }) => {
  const subject = 'Reset your Fidelo E-Bike Store password';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #0f172a; margin-top: 0;">Password reset request</h2>
      <p style="color: #475569;">Hi ${name}, use this code to choose a new password:</p>
      <div style="background:#f1f5f9; padding:18px; text-align:center; border-radius:8px; margin:20px 0;">
        <span style="font-size:32px; font-weight:bold; letter-spacing:6px; color:#0f172a;">${code}</span>
      </div>
      <p style="color:#64748b; font-size:13px;">This code expires in 15 minutes. If you did not request a reset, you can safely ignore this email.</p>
    </div>`;
  const text = `Hi ${name}, your Fidelo password reset code is ${code}. It expires in 15 minutes.`;
  return sendEmail({ to: email, subject, html, text });
};

export const sendPasswordChangeCodeEmail = async ({ email, code, name }) => {
  const subject = 'Confirm your Fidelo password change';
  const html = `<div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px"><h2 style="color:#0f172a">Confirm password change</h2><p style="color:#475569">Hi ${name}, enter this code in your profile to confirm your password change:</p><div style="background:#f1f5f9;padding:18px;text-align:center;border-radius:8px;margin:20px 0"><strong style="font-size:32px;letter-spacing:6px;color:#0f172a">${code}</strong></div><p style="color:#64748b;font-size:13px">This code expires in 15 minutes. If you did not request it, secure your account and contact an administrator.</p></div>`;
  return sendEmail({ to: email, subject, html, text: `Hi ${name}, your password change confirmation code is ${code}. It expires in 15 minutes.` });
};

export default {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangeCodeEmail,
};
