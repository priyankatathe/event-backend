const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const crypto = require("crypto");
const razorpay = require("../utils/razorpay.config");
const UEvents = require("../module/UEvents");
const BookingTicket = require("../module/BookingTicket");


// 1️⃣ Book Ticket with Payment

exports.bookTicketWithPayment = asyncHandler(async (req, res) => {
    const { userId, eventId, tickets } = req.body;

    if (!userId || !eventId || !tickets || !Array.isArray(tickets)) {
        return res.status(400).json({ message: "userId, eventId and tickets[] are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(400).json({ message: "Invalid Event ID" });
    }

    const event = await UEvents.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    let totalAmount = 0;
    let ticketDetails = [];

    for (let t of tickets) {
        const ticketOption = event.ticketOptions.find(opt => opt.name === t.ticketName);
        if (!ticketOption) {
            return res.status(404).json({ message: `Ticket option '${t.ticketName}' not found` });
        }

        if (ticketOption.availableQuantity < t.quantity) {
            return res.status(400).json({ message: `Only ${ticketOption.availableQuantity} tickets left for ${t.ticketName}` });
        }

        const subTotal = ticketOption.price * t.quantity;
        totalAmount += subTotal;

        ticketDetails.push({
            optionName: ticketOption.name,
            price: ticketOption.price,
            quantity: t.quantity
        });
    }

    totalAmount = totalAmount + (event.fees?.transactionFee || 0) + (event.fees?.convenienceFee || 0);

    const order = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        receipt: `receipt_${Date.now()}`
    });

    // ⚠️ NOTE: Yaha DB me kuch save NHI karna

    res.json({
        message: "Order created successfully",
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_API_KEY,
        tickets: ticketDetails,
        totalAmount
    });
});



// 2️⃣ Verify Payment
exports.verifyPayment = asyncHandler(async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, eventId, tickets, totalAmount } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        // 🔑 Signature generate
        const generated_signature = crypto
            .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (generated_signature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: "Payment verification failed" });
        }

        // ✅ Event find
        const event = await UEvents.findById(eventId);
        if (!event) return res.status(404).json({ success: false, message: "Event not found" });

        // ✅ Reduce ticket quantities
        tickets.forEach(t => {
            const ticketOption = event.ticketOptions.find(opt => opt.name === t.ticketName);
            if (ticketOption) {
                ticketOption.availableQuantity -= t.quantity;
                if (ticketOption.availableQuantity < 0) ticketOption.availableQuantity = 0; // safeguard
            }
        });
        await event.save();

        // ✅ Booking create (only after verify)
        const booking = await BookingTicket.create({
            userId: new mongoose.Types.ObjectId(userId),
            eventId: new mongoose.Types.ObjectId(eventId),
            tickets: tickets.map(t => ({
                optionName: t.ticketName,
                price: event.ticketOptions.find(opt => opt.name === t.ticketName)?.price || 0,
                quantity: t.quantity
            })),
            totalAmount,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            status: "paid"
        });

        res.json({
            success: true,
            message: "Payment verified and tickets booked successfully",
            booking
        });

    } catch (err) {
        console.error("Verify Payment Error:", err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});





// 3️⃣ Admin Booking History

exports.getAdminBookings = asyncHandler(async (req, res) => {
    const adminId = req.user._id

    // 1️⃣ Fetch events created by this admin
    const events = await UEvents.find({ adminId }).select("_id");
    if (!events.length) {
        return res.status(404).json({ message: "No events found for this admin" });
    }

    // 2️⃣ Extract eventIds
    const eventIds = events.map(e => e._id);

    // 3️⃣ Find bookings for these events
    const bookings = await BookingTicket.find({ eventId: { $in: eventIds } })
        .populate("userId", "name email mobile")
        .populate("eventId", "name date time");

    if (!bookings.length) {
        return res.status(404).json({ message: "No bookings found for this admin's events" });
    }

    // 4️⃣ Response
    res.json({ success: true, bookings });
})
