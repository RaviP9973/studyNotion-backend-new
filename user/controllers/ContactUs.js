import { publishToQueue } from "../config/rabbitmq.js";


export const contactUs = async (req, res) => {
  const { firstName, lastName, email, message, phoneNo } = req.body;
  if (!firstName || !email || !message) {
    return res.status(403).send({
      success: false,
      message: "All Fields are required",
    });
  }
  try {
    const data = {
      firstName,
      lastName: `${lastName ? lastName : "null"}`,
      email,
      message,
      phoneNo: `${phoneNo ? phoneNo : "null"}`,
    };
    
  console.log(data);

    const emailMessage = {
      email: "rp031776@gmail.com",
      title: "Enquery",
      body : `<html><body>${Object.keys(data).map((key) => {
        return `<p>${key} : ${data[key]}</p>`;
      })}</body></html>`
    }

    await publishToQueue("email-queue" , emailMessage)
    return res.status(200).json({
      success:true,
      message: "your message has been sent successfully"
    })
    
  } catch (error) {
    console.error(error);
    return res.status(403).send({
      success: false,
      message: "Something went wrong",
    });
  }
};