import { default as mongoose } from "mongoose";
import { instance } from "../config/razorpay.js";
import Course from "../models/Course.js"; 
import User from "../models/User.js";
import { courseEnrollmentEmail } from "../mail/courseEnrollmentEmail.js";
import { paymentSuccessEmail } from "../mail/paymentSuccessEmail.js";
import crypto from "crypto";
import courseProgress from "../models/courseProgress.js";
import { publishToQueue } from "../config/rabbitmq.js";

export const capturePayment = async (req, res) => {
  // get courseId and UserId
  const { courses } = req.body;
  console.log(courses);
  const userId = req.user.id;

  // validation
  if (!courses || !Array.isArray(courses) || courses.length === 0) {
    return res.json({
      success: false,
      message: "Please provide valid course ID",
    });
  }                       

  let totalAmount = 0;
  for (const course_id of courses) {
    // valid courseId
    let course;
    try {
      // console.log("course_id",course_id);
      // const {courseId} = course_id;
      course = await Course.findById(course_id);
      if (!course) {
        return res.json({
          success: false,
          message: "Could not find the course",
        });
      }
      // check if user already paid for the same course
      if (course.studentEnrolled.some(id => id.toString() === userId.toString())) {
        return res.status(200).json({
          success: false,
          message: "Student is already enrolled",
        });
      }

      totalAmount += course.price;
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // order create
  const currency = "INR";

  const options = {
    amount: totalAmount * 100,
    currency,
    receipt: `receipt_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    notes: {
      courseId: courses,
      userId,
    },
  };

  try {
    //initiate the payment using razorpay
    const paymentResponse = await instance.orders.create(options);
    console.log(paymentResponse);
    // return response
    return res.status(200).json({
      success: true,
      // courseName: course.courseName,
      // courseDescription: course.courseDescription,
      orderId: paymentResponse.id,
      currency: paymentResponse.currency,
      amount: paymentResponse.amount,
      message: paymentResponse,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Could not initiate order",
    });
  }
};

export const verifySignature = async (req, res) => {
  const razorpay_order_id = req.body?.razorpay_order_id;

  const razorpay_payment_id = req.body?.razorpay_payment_id;

  const razorpay_signature = req.body?.razorpay_signature;

  const courses = req.body?.courses;
  const userId = req.user.id;

  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !courses ||
    !userId
  ) {
    return res.status(401).json({
      success: false,
      message: "Validation failed",
      data: "Payment Id or Signature not found"
    });
  }

  let body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    try {
      await enrolledStudents(courses, userId);
      return res.status(200).json({
        success: true,
        message: "Payment verified",
      });
    } catch (error) {
      console.error("Error enrolling students:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to enroll students",
      });
    }
  }

  return res.status(400).json({
    success: false,
    message: "Payment failed",
  });
};

const enrolledStudents = async (courses, userId) => {
  if (!courses || !userId) {
    throw new Error("Please provide data for courses or userId");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  // Collect email messages to send AFTER transaction commits
  const emailMessages = [];

  try {
    for (const courseId of courses) {
      const enrolledCourse = await Course.findByIdAndUpdate(
        courseId,
        { $push: { studentEnrolled: userId } },
        { new: true, session }
      );
      if (!enrolledCourse) {
        throw new Error(`Course not found: ${courseId}`);
      }

      const [courseProgres] = await courseProgress.create(
        [{ courseId, userId, completedVideos: [] }],
        { session }
      );

      const enrolledStudent = await User.findByIdAndUpdate(
        userId,
        {
          $push: {
            courses: courseId,
            courseProgress: courseProgres._id,
          },
        },
        { new: true, session }
      );

      emailMessages.push({
        email: enrolledStudent.email,
        title: `Successfully Enrolled into ${enrolledCourse.name}`,
        body: courseEnrollmentEmail(
          enrolledCourse.name,
          `${enrolledStudent.firstName} ${enrolledStudent.lastName}`
        ),
      });
    }

    await session.commitTransaction();

    // Send emails only after successful commit
    for (const message of emailMessages) {
      await publishToQueue("email-queue", message);
    }
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};


export const sendPaymentSuccessEmail = async(req,res) => {
  const {orderId,paymentId,amount} = req.body;
  const userId = req.user.id;

  if(!orderId || !paymentId || !amount || !userId){
    return res.status(400).json({
      success:false,
      message: "provide all fields"
    })

  }

  try {
    const enrolledStudent = await User.findById(userId);
    const emailMessage = {
      email: enrolledStudent.email,
      title: `Payment Received`,
      body: paymentSuccessEmail(`${enrolledStudent.firstName} ${enrolledStudent.lastName}`, amount/100,orderId,paymentId)
    }
    await publishToQueue("email-queue",emailMessage);
    return res.status(200).json({
      success: true,
      message: "Payment success email sent",
    });
  } catch (error) {
    console.log("Error in sending mail",error);
    return res.status(500).json({
      success:false,
      message:error.message,
    })
  }
}
