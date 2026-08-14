
import Cart from "../models/cart.js";

const buildCartPayload = (cart) => {
  if (!cart || !Array.isArray(cart.courses)) {
    return { cart: [], totalItems: 0, total: 0 };
  }

  const items = cart.courses
    .map((entry) => entry?.course)
    .filter(Boolean)
    .map((course) => (course.toObject ? course.toObject() : course));

  return {
    cart: items,
    totalItems: items.length,
    total: items.reduce((sum, course) => sum + Number(course?.price || 0), 0),
  };
};

export const addToCart = async (req, res) => {
  try {
    const { courseIds } = req.body;
    const userId = req.user.id;

    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No courses provided to add to cart",
      });
    }

    const cart = await Cart.findOne({ userId });
    const normalizedIds = courseIds.map((courseId) => courseId.toString());

    if (!cart) {
      const newCart = new Cart({
        userId,
        courses: normalizedIds.map((courseId) => ({ course: courseId })),
      });
      await newCart.save();
    } else {
      const existingCourseIds = new Set(
        cart.courses.map((entry) => entry.course.toString()),
      );

      const uniqueCourseIds = normalizedIds.filter(
        (courseId) => !existingCourseIds.has(courseId),
      );

      if (uniqueCourseIds.length > 0) {
        cart.courses.push(
          ...uniqueCourseIds.map((courseId) => ({ course: courseId })),
        );
        await cart.save();
      }
    }

    const updatedCart = await Cart.findOne({ userId }).populate({
      path: "courses.course",
      populate: { path: "category" },
    });

    const cartSummary = buildCartPayload(updatedCart || { courses: [] });

    return res.status(200).json({
      success: true,
      message: "Courses added to cart successfully",
      ...cartSummary,
    });
  } catch (error) {
    console.error("Error adding to cart: ", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "No course provided to remove from cart",
      });
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found or cart is already empty",
      });
    }

    cart.courses = cart.courses.filter(
      (entry) => entry.course.toString() !== courseId.toString(),
    );
    await cart.save();

    const updatedCart = await Cart.findOne({ userId }).populate({
      path: "courses.course",
      populate: { path: "category" },
    });
    const cartSummary = buildCartPayload(updatedCart || { courses: [] });

    return res.status(200).json({
      success: true,
      message: "Course removed from cart successfully",
      ...cartSummary,
    });
  } catch (error) {
    console.error("Error removing from cart: ", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ userId }).populate({
      path: "courses.course",
      populate: { path: "category" },
    });

    const cartSummary = buildCartPayload(cart || { courses: [] });

    return res.status(200).json({
      success: true,
      message: cartSummary.cart.length ? "Cart fetched successfully" : "Cart is empty",
      ...cartSummary,
    });
  } catch (error) {
    console.error("Error fetching cart: ", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
