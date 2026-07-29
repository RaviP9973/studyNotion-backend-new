const mailSender = async (email, title, body) => {
    try {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log("Invalid email format:", email);
            return {
                success: false,
                message: "Invalid email format"
            };
        }

        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "api-key": process.env.BREVO_API_KEY,
                "Content-Type": "application/json",
                "accept": "application/json"
            },
            body: JSON.stringify({
                sender: {
                    name: "StudyNotion",
                    email: process.env.MAIL_USER
                },
                to: [{ email: email }],
                subject: title,
                htmlContent: body
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.log("Brevo API error:", data);
            return {
                success: false,
                message: data.message || "Failed to send email"
            };
        }

        // console.log("Email sent via Brevo, messageId:", data.messageId);
        return {
            success: true,
            message: "Email sent successfully"
        };
    } catch (error) {
        console.log("Mail sender error:", error.message);
        return {
            success: false,
            message: error.message
        };
    }
}

export default mailSender;