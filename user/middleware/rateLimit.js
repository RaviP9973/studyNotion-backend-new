import rateLimit from "express-rate-limit";

// Rate limiter for authentication routes (login, signup, etc.)
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per `window` (here, per 15 minutes)
  message: {
    success: false,
    message: "Too many authentication attempts from this IP, please try again after 15 minutes"
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Rate limiter for payment capture routes
export const paymentRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 payment capture requests per hour
  message: {
    success: false,
    message: "Too many payment requests from this IP, please try again after an hour"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const contactUsRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, //24 hours
  max: 1,
  message: {
    success: false,
    message: "Too many enquery requests from  this IP, please try again after 24 hour"
  },

  standardHeaders: true,
  legacyHeaders: false,

})