import faq from "../data/faq.json";

const SECRETS = /password|passcode|\botp\b|\bpin\b|one[- ]?time (code|password)|verification code|\bcvv\b|card number/i;
const ACTIONS = /\b(for me|on my behalf)\b|\bpay (my|the|this) bill\b/i;

// Safety replies are shown immediately, without a network call.
export function safetyReply(text) {
    if (SECRETS.test(text)) {
        return "Please never share a password, one-time code (OTP) or PIN with anyone, including Aagahi. Aagahi will never ask for them. If someone asks you for one, stop and ask a family member.";
    }
    if (ACTIONS.test(text)) {
        return "Aagahi teaches you step by step, but it can't pay bills, send messages or tap things for you. I can explain how to do it yourself. Which task would you like to learn?";
    }
    return null;
}

export function localMatch(text) {
    const t = text.toLowerCase();
    let best = null;
    let bestScore = 0;
    for (const item of faq) {
        const score = item.keywords.filter((k) => t.includes(k.toLowerCase())).length;
        if (score > bestScore) { best = item; bestScore = score; }
    }
    return best ? { reply: best.reply, related: best.related } : null;
}