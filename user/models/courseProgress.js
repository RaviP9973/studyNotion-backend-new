  // const mongoose = require("mongoose");
  import mongoose from "mongoose";

  const courseProgress = new mongoose.Schema({
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref:"Course"
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref:"user"
    },
    completedVideos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subsection",
      },
    ],
  });

  courseProgress.index({ userId: 1, courseId: 1 });

  export default mongoose.model("courseProgress", courseProgress);
