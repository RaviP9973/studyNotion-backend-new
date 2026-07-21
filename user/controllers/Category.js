import redisClient from "../config/redis.js";
import Category from "../models/category.js";

export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: "All feilds are required",
      });
    }

    //create entry in db
    const categoryDetails = await Category.create({
      name: name,
      description: description,
    });
    console.log(categoryDetails);
    return res.status(200).json({
      success: true,
      message: "Category created successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//getAllcategory handler function

export const showAllCategory = async (req, res) => {
  try {
    const cacheKey = "categories:all";
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      const cachedData = JSON.parse(cached);
      return res.status(200).json({
        success: true,
        message: "All categories returned successfully",
        data: cachedData.allCategory,
      });
    }
    const allCategory = await Category.find(
      {},
      { name: true, description: true }
    );
    await redisClient.set(cacheKey, JSON.stringify({ allCategory }), { EX: 60 * 60 });

    res.status(200).json({
      success: true,
      message: "All categories returned successfully",
      data: allCategory,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const categoryPageDetails = async (req, res) => {
  try {
    const { categoryId } = req.body;

    // Get courses for the specified category
    // console.log("categoryId",categoryId);

    const cacheKey = `category:${categoryId}`;
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      const cachedData = JSON.parse(cached);
      cachedData.success = true;

      return res.status(200).json(cachedData);
    }


    const selectedCategory = await Category.findById({ _id: categoryId }) //populate instuctor and rating and reviews from courses
      .populate({
        path: "course",
        match: {
          status: "Published",
        },
        populate: [
          {
            path: "instructor",
          },
          {
            path: "ratingAndReviews",
          },
        ],
      })
      .exec();
    // console.log("selectedCategory",selectedCategory);
    // Handle the case when the category is not found
    if (!selectedCategory) {
      console.log("Category not found.");
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }
    // Handle the case when there are no courses
    if (selectedCategory.course.length === 0) {
      console.log("No courses found for the selected category.");
      return res.status(404).json({
        success: false,
        message: "No courses found for the selected category.",
      });
    }

    // Sort by newest first
    const selectedCourses = selectedCategory.course.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    // Get courses for other categories
    const categoriesExceptSelected = await Category.find({
      _id: { $ne: categoryId },
    }).populate({
      path: "course",
      match: { status: "Published" },
      populate: [{ path: "instructor" }, { path: "ratingAndReviews" }],
    });
    // console.log("present here")
    let differentCourses = [];
    for (const category of categoriesExceptSelected) {
      differentCourses.push(...category.course);
    }
    // Sort by newest first
    differentCourses.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    // Get top-selling courses across all categories
    const allCategories = await Category.find().populate({
      path: "course",
      match: { status: "Published" },
      populate: [{ path: "instructor" }, { path: "ratingAndReviews" }],
    });
    const allCourses = allCategories.flatMap((category) => category.course);
    const mostSellingCourses = allCourses
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 10);
    // console.log("most selling courses",mostSellingCourses);

    await redisClient.set(cacheKey, JSON.stringify({ selectedCategory, selectedCourses, differentCourses, mostSellingCourses }), { EX: 60 * 60 * 24 })
    res.status(200).json({
      selectedCategory,
      selectedCourses: selectedCourses,
      differentCourses: differentCourses,
      mostSellingCourses: mostSellingCourses,
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
