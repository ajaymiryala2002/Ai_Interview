"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendInterviewResultEmail = exports.sendInterviewInvitationEmail = exports.assertEmailConfiguration = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const required = (name) => {
    const value = process.env[name];
    if (!value)
        throw new Error(`Email is not configured: missing ${name}`);
    return value;
};
const assertEmailConfiguration = () => {
    const host = required('SMTP_HOST');
    if (host === 'smtp.example.com') {
        throw new Error('Email is not configured: SMTP_HOST still uses the smtp.example.com placeholder');
    }
    required('SMTP_USER');
    required('SMTP_PASS');
    required('SMTP_FROM');
};
exports.assertEmailConfiguration = assertEmailConfiguration;
const getTransporter = () => {
    (0, exports.assertEmailConfiguration)();
    const port = Number(process.env.SMTP_PORT || 587);
    const user = required('SMTP_USER');
    const pass = required('SMTP_PASS');
    return nodemailer_1.default.createTransport({
        host: required('SMTP_HOST'),
        port,
        secure: process.env.SMTP_SECURE === 'true' || port === 465,
        auth: { user, pass },
        connectionTimeout: 10000, // fail fast if SMTP is unreachable
        greetingTimeout: 10000,
        socketTimeout: 15000
    });
};
const send = async (to, subject, html) => {
    const from = required('SMTP_FROM');
    return getTransporter().sendMail({ from, to, subject, html });
};
const sendInterviewInvitationEmail = (candidate, inviteLink) => send(candidate.email, 'Your PyProctor AI interview invitation', `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h2 style="color: #3b82f6;">PyProctor AI Interview</h2>
      <p>Hi ${candidate.name},</p>
      <p>You have been invited to complete an AI-conducted technical interview with PyProctor AI.</p>
      <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <a href="${inviteLink}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Start Your Interview</a>
      </div>
      <p style="color: #666; font-size: 14px;">This link expires in 7 days. Please ensure you are in a quiet room with good lighting and a working camera.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #999; font-size: 12px;">PyProctor AI - Automated Technical Interview Platform</p>
    </div>`);
exports.sendInterviewInvitationEmail = sendInterviewInvitationEmail;
const sendInterviewResultEmail = (candidate, score, correctCount, passed, rejectionReason) => {
    const subject = passed
        ? 'Congratulations - You passed your PyProctor AI interview!'
        : 'Update on your PyProctor AI interview';
    const message = passed
        ? 'Congratulations! You have successfully passed the technical interview. You answered <strong>' + correctCount + ' out of 10</strong> questions correctly. Our team will be in touch about the next steps soon.'
        : 'Thank you for completing the interview. Unfortunately, you did not meet the required criteria on this occasion.';
    const reasonBlock = !passed && rejectionReason
        ? `<div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <p style="color: #991b1b; margin: 0; font-weight: 600;">Reason:</p>
        <p style="color: #7f1d1d; margin: 8px 0 0 0;">${rejectionReason}</p>
       </div>`
        : '';
    const scoreColor = passed ? '#10b981' : '#ef4444';
    const scoreBg = passed ? '#ecfdf5' : '#fef2f2';
    return send(candidate.email, subject, `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: ${passed ? '#10b981' : '#ef4444'}; margin: 0;">
          ${passed ? 'Congratulations!' : 'Interview Result'}
        </h2>
      </div>
      <p>Hi ${candidate.name},</p>
      <p>${message}</p>
      ${reasonBlock}
      <div style="background: ${scoreBg}; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; color: #666; font-size: 14px;">Your Interview Score</p>
        <p style="margin: 8px 0 0 0; font-size: 36px; font-weight: 700; color: ${scoreColor};">${Math.round(score)}%</p>
        <p style="margin: 8px 0 0 0; color: #666; font-size: 14px;">Correct Answers: ${correctCount} / 10</p>
      </div>
      <p style="color: #666; font-size: 14px;">
        ${passed
        ? 'We were impressed with your performance. Expect to hear from our recruitment team within 2-3 business days.'
        : 'We encourage you to continue learning and apply again in the future. Best of luck with your career journey!'}
      </p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
      <p style="color: #999; font-size: 12px; text-align: center;">PyProctor AI - Automated Technical Interview Platform</p>
    </div>`);
};
exports.sendInterviewResultEmail = sendInterviewResultEmail;
//# sourceMappingURL=email.service.js.map