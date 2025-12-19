const mongoose = require("mongoose")

const bookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "customer", required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },

    tickets: [
        {
            optionName: { type: String, required: true }, // e.g., VIP / Regular
            price: { type: Number, required: true },
            quantity: { type: Number, required: true }
        }
    ],

    totalAmount: { type: Number, required: true },  // final amount after calculation

    razorpay_order_id: String,
    razorpay_payment_id: String,
    razorpay_signature: String,

    status: {
        type: String,
        enum: ["created", "paid", "cancelled", "failed"],
        default: "created"
    }

}, { timestamps: true })

module.exports = mongoose.model("BookingTicket", bookingSchema)
