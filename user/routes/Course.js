import express from "express";
const router = express.Router();

import {
  createCourse,
  showAllCourses,
  getCourseDetails,
  updateCourse,
  fetchInstructorCourses,
  deleteCourse,
  getFullCourseDetails,
} from "../controllers/Course.js";
import {
  showAllCategory,
  createCategory,
  categoryPageDetails,
} from "../controllers/Category.js";

import {
  createSection,
  updateSection,
  deleteSection,
} from "../controllers/Section.js";
import {
  createSubsection,
  updateSubSection,
  deleteSubSection,
} from "../controllers/Subsections.js";
import {
  createRating,
  getAverageRating,
  getAllRating,
} from "../controllers/RatingAndReview.js";
import { auth, isStudent, isInstructor, isAdmin } from "../middleware/auth.js";

// const {temp } = require("../controllers/temp")

import { updateCourseProgress } from "../controllers/CourseProgress.js";

router.get("/instructorCourses", auth, isInstructor, fetchInstructorCourses);
router.post("/createCourse", auth, isInstructor, createCourse);
router.post("/editCourse", auth, isInstructor, updateCourse);
router.post("/deleteCourse", auth, isInstructor, deleteCourse);
router.post("/updateCourseProgress", auth, isStudent, updateCourseProgress);

router.post("/addSection", auth, isInstructor, createSection);
router.put("/updateSection", auth, isInstructor, updateSection);
router.delete("/deleteSection", auth, isInstructor, deleteSection);

router.put("/updateSubSection", auth, isInstructor, updateSubSection);
router.delete("/deleteSubSection", auth, isInstructor, deleteSubSection);
router.post("/addSubSection", auth, isInstructor, createSubsection);

router.get("/getAllCourses", showAllCourses);
router.post("/getCourseDetails", auth, getCourseDetails);
router.post("/getFullCourseDetails", getFullCourseDetails);

router.post("/createCategory", auth, isAdmin, createCategory);
router.post("/getCategoryPageDetails", categoryPageDetails);
router.get("/showAllCategories", showAllCategory);
router.get("/getAverageRating", getAverageRating);
router.post("/createRating", auth, isStudent, createRating);

router.get("/getReviews", getAllRating);
// router.delete("/temp",auth,isInstructor,temp)

export default router;
