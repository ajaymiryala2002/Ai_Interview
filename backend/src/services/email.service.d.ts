export declare const assertEmailConfiguration: () => void;
export declare const sendInterviewInvitationEmail: (candidate: {
    name: string;
    email: string;
}, inviteLink: string) => Promise<import("nodemailer/lib/smtp-transport").SentMessageInfo>;
export declare const sendInterviewResultEmail: (candidate: {
    name: string;
    email: string;
}, score: number, correctCount: number, passed: boolean, rejectionReason?: string | null) => Promise<import("nodemailer/lib/smtp-transport").SentMessageInfo>;
//# sourceMappingURL=email.service.d.ts.map