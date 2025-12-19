const mongoose = require("mongoose")

const eventSchema = new mongoose.Schema({
    // Basic Info
    name: { type: String, required: true },
    description: { type: String },
    coverImage: { type: String, required: true },
    images: [{ type: String }],
    date: { type: Date, required: true },
    time: { type: String },
    // Venue Details
    venue: {
        name: { type: String, required: true },
        address: { type: String, required: true },
        googleMapUrl: { type: String },
        transportModes: {
            car: { type: Boolean, default: true },
            subway: { type: Boolean, default: false },
            bike: { type: Boolean, default: false },
            elderlyFriendly: { type: Boolean, default: false },
        },
    },
    // Tickets (Multiple options)
    ticketOptions: [
        {
            name: { type: String, required: true },  // VIP, Regular
            price: { type: Number, required: true },
            availableQuantity: { type: Number, required: true },
        },
    ],
    fees: {
        transactionFee: { type: Number, default: 2.14 },
        convenienceFee: { type: Number, default: 1.0 },
    },
    organizer: {
        name: { type: String, required: true },
        company: { type: String },
        image: { type: String },
    },
    tags: [String],           // ["Live Concert", "Hindi"]
    categories: [String],     // ["Music", "Festival"]
    category: { type: String, enum: ["upcomingevent", "fetureEvent"], default: "upcomingevent" },
    adminId: { type: mongoose.Types.ObjectId, ref: "admin" },


}, { timestamps: true })
module.exports = mongoose.model("Event", eventSchema)
