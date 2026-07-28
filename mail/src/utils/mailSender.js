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

        // Manually resolve IPv4 address to avoid Render IPv6 ENETUNREACH issues
        const dns = await import('dns');
        const ipv4Addresses = await dns.promises.resolve4(process.env.MAIL_HOST);
        const hostIp = ipv4Addresses[0];

        let transporter = nodemailer.createTransport({
            host: hostIp,
            port: 587,
            auth: {
                pass: process.env.MAIL_PASS,
                user: process.env.MAIL_USER,
            },
            secure: false,
            tls: {
                servername: process.env.MAIL_HOST // Required so TLS doesn't fail on IP address
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