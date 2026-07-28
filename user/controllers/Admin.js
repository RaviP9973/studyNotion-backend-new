import User from "../models/User.js";
import Course from "../models/Course.js";
import Category from "../models/category.js";

// Get dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ accountType: "Student" });
    const totalInstructors = await User.countDocuments({ accountType: "Instructor" });
    const totalCourses = await Course.countDocuments();
    const totalCategories = await Category.countDocuments();

    // Calculate total revenue (sum of all published courses' price * studentEnrolled.length)
    const courses = await Course.find({ status: "Published" });
    let totalRevenue = 0;
    courses.forEach(course => {
      totalRevenue += (course.price || 0) * course.studentEnrolled.length;
    });

    return res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalInstructors,
        totalCourses,
        totalCategories,
        totalRevenue
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard stats",
      error: error.message
    });
  }
};

// Get paginated users by type (Student or Instructor)
export const getUsers = async (req, res) => {
  try {
    const { type, page = 1, limit = 10, search = "" } = req.query;

    if (!["Student", "Instructor"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user type"
      });
    }

    const query = {
      accountType: type,
      $or: [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ]
    };

    const users = await User.find(query)
      .select("-password -token -resetPasswordExprires")
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: {
        users,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: Number(page)
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Failed to fetch ${req.query.type}s`,
      error: error.message
    });
  }
};

// Block a user
export const blockUser = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const user = await User.findByIdAndUpdate(userId, { isBlocked: true }, { new: true });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "User blocked successfully",
      data: user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to block user",
      error: error.message
    });
  }
};

// Unblock a user
export const unblockUser = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const user = await User.findByIdAndUpdate(userId, { isBlocked: false }, { new: true });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "User unblocked successfully",
      data: user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to unblock user",
      error: error.message
    });
  }
};

// Update a category
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name || !description) {
      return res.status(400).json({ success: false, message: "Name and description are required" });
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { name, description },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    let cursor = '0';

    do {
      const result = await redisClient.scan(cursor, {
        MATCH: "category:*",
        COUNT: 100,
      });

      cursor = String(result.cursor);

      if (result.keys.length) {
        await redisClient.del(result.keys);
      }
    } while (cursor !== '0');

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update category",
      error: error.message
    });
  }
};

// Delete a category
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category has courses
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    if (category.course && category.course.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete category with existing courses"
      });
    }

    await Category.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete category",
      error: error.message
    });
  }
};
