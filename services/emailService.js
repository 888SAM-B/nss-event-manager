const sendEmailViaBrevo = async ({ from, to, subject, html, bcc }) => {
    if (!process.env.BREVO_API_KEY) {
        console.warn('⚠️ BREVO_API_KEY is not set. Email not sent.');
        return { response: 'Mock success: Brevo API key not set', messageId: 'mock' };
    }

    const formatEmail = (email) => {
        if (typeof email === 'object') return email;
        return { email };
    };

    const toArr = Array.isArray(to) ? to.map(formatEmail) : (to ? [{ email: to }] : []);
    const bccArr = Array.isArray(bcc) ? bcc.map(formatEmail) : (bcc ? [{ email: bcc }] : []);

    const payload = {
        sender: formatEmail(from || process.env.EMAIL_USER || 'noreply@example.com'),
        subject: subject,
        htmlContent: html,
    };

    if (toArr.length > 0) payload.to = toArr;

    if (toArr.length === 0 && bccArr.length > 0) {
        payload.to = [formatEmail(from || process.env.EMAIL_USER || 'noreply@example.com')];
    }

    if (bccArr.length > 0) payload.bcc = bccArr;

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'api-key': process.env.BREVO_API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errData = await response.text();
        if (contentType && contentType.includes('application/json')) {
            try { errData = JSON.parse(errData); } catch (e) { }
        }
        const error = new Error(`Brevo API Error: ${typeof errData === 'object' ? JSON.stringify(errData) : errData}`);
        error.code = response.status;
        throw error;
    }

    const data = await response.json();
    return { response: '250 Message queued', messageId: data.messageId || 'unknown' };
};

module.exports = {
    sendEmailViaBrevo
};
