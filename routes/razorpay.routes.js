const router = require("express").Router();
const razorpayController = require("../controller/razorpay.controller");
const { adminProtected } = require("../middleware/protected");

// 1️⃣ Create Razorpay Order & Booking
router.post("/book-ticket-payment", razorpayController.bookTicketWithPayment);

// 2️⃣ Verify Razorpay Payment
router.post("/verify-payment", razorpayController.verifyPayment)

router.get("/admin-history", adminProtected, razorpayController.getAdminBookings);


module.exports = router;
