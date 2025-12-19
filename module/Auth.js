const mongoose = require("mongoose")

const authSchema = new mongoose.Schema({
    name: { type: String, required: true }, //  isme uniq ik lagaskte dekhna he
    image: { type: String, default: null },
    email: { type: String, required: true },
    mobile: { type: Number, required: true },
    password: { type: String, required: true },
    // adminId: { type: mongoose.Types.ObjectId, ref: "auth" },
    role: { type: String, enum: ["admin", "superadmin"], default: "admin" },
}, { timestamps: true })

module.exports = mongoose.model("admin", authSchema)
