import nodemailer from "nodemailer";

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

        let transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            auth: {
                pass: process.env.MAIL_PASS,
                user: process.env.MAIL_USER,
            }
        })

        await transporter.sendMail({
            from: 'StudyNotion || Codehelp - by Babbar',
            to: `${email}`,
            subject: `${title}`,
            html: `${body}`,
        })

        // console.log(info);
        // return {
        //     success: true,
        //     message: "Email sent successfully",
        //     info: info
        // };
    } catch (error) {
        console.log(error.message);
        return {
            success: false,
            message: error.message
        };
    }
}

export default mailSender;