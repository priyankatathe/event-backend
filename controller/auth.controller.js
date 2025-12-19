const Auth = require("../module/Auth")
const { checkEmpty } = require("../utils/checkEmpty")
const asyncHandler = require("express-async-handler")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const validator = require("validator")
const UEvents = require("../module/UEvents")
const { upload } = require("../utils/upload")
const cloudinary = require("../utils/cloudinary.config")
const BookingTicket = require("../module/BookingTicket")


exports.registerAdmin = asyncHandler(async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.log(err)
            return res.status(400).json({ message: "Unable To Upload Image", error: err })
        }
        const { name, email, password, mobile, role } = req.body
        const { isError, error } = checkEmpty({ name, email, password, mobile, role })
        if (isError) {
            return res.status(400).json({ message: "All Fields Required", error })
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: "Invalid Email" })
        }

        if (!validator.isStrongPassword(password)) {
            return res.status(400).json({ message: "Provide Stong Password" })
        }

        if (mobile && !validator.isMobilePhone(mobile)) {
            return res.status(400).json({ message: "Provide currect phone Number " })
        }

        const isFound = await Auth.findOne({ email, mobile })
        if (isFound) {
            return res.status(400).json({ message: "Email Or Mobile Already registered witho us " })
        }
        const hash = await bcrypt.hash(password, 10)

        try {
            let imageURL = null
            if (req.file) {
                const { secure_url } = await cloudinary.uploader.upload(req.file.path);
                imageURL = secure_url;
            }

            const result = await Auth.create({
                name,
                email,
                password: hash,
                role: "admin",
                mobile,
                image: imageURL,
                adminId: req.user || null
            })
            res.json({ message: "Admin register successfully", result })
        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Something went wrong", error: error.message })
        }
    })


})

exports.updateAdmin = asyncHandler(async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: "Image Upload Failed", error: err });
        }

        const { id } = req.params;
        const { name, email, mobile } = req.body;

        // Basic validation
        if (!name || !email || !mobile) {
            return res.status(400).json({ message: "All fields are required" });
        }

        try {
            let imgAdmin = null;

            // Upload image only if provided
            if (req.file) {
                const { secure_url } = await cloudinary.uploader.upload(req.file.path);
                imgAdmin = secure_url;
            }


            // Prepare update object
            const updateData = {
                name,
                email,
                mobile,
            };

            if (imgAdmin) updateData.image = imgAdmin;

            // Update in database
            const result = await Auth.findByIdAndUpdate(id, updateData, { new: true });

            if (!result) {
                return res.status(404).json({ message: "Admin not found" });
            }

            res.json({ message: "Admin updated successfully", result });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Update Failed", error: error.message });
        }
    });
})






exports.loginAdmin = asyncHandler(async (req, res) => {

    const { email, password, } = req.body
    const { isError, error } = checkEmpty({ email, password })
    if (isError) {
        return res.status(400).json({ message: "All Fields Required", error })
    }


    try {
        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: "Invalid Email" })
        }

        const result = await Auth.findOne({ email })
        if (!result) {
            return res.status(400).json({ message: "Invalid Email" })
        }
        const isVerify = await bcrypt.compare(password, result.password)
        if (!isVerify) {
            return res.status(400).json({ message: "Password do not match" })
        }

        const token = jwt.sign({ userId: result._id },
            process.env.JWT_KEY, { expiresIn: "15d" })
        res.cookie("admin", token, {
            maxAge: 15 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: true, // https only
            sameSite: "None" // cross-site cookie
        })


        res.json({
            message: "admin login success.",
            result: {
                _id: result._id,
                name: result.name,
                email: result.email,
                mobile: result.mobile,
                image: result.image,
                role: result.role,
            }
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal Server Error" })

    }

})

exports.logoutAdmin = (req, res) => {
    res.clearCookie("admin")
    res.json({ message: "admin logout success" })
}

exports.fetchAdmin = asyncHandler(async (req, res) => {
    try {
        const result = await Auth.findOne({ _id: req.user })

        res.json({ message: "Admin fetch Success", result })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error ", error: error.message })
    }

})
exports.getAdminEvents = asyncHandler(async (req, res) => {
    try {
        const adminId = req.user

        const events = await UEvents.find({ adminId })

        res.json({ message: "Admin events fetched successfully", result: events })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server Error", error: error.message })
    }
})

// controllers/adminController.js
exports.getAdminEventTickets = asyncHandler(async (req, res) => {
    try {
        const adminId = req.user._id;  // middleware se aayega
        const { eventId } = req.params;  // URL se aayega

        // Check if event belongs to admin
        const event = await UEvents.findOne({ _id: eventId, adminId });
        if (!event) {
            return res.status(404).json({ message: "Event not found for this admin" });
        }

        // Fetch tickets for this event
        const tickets = await BookingTicket.find({ eventId }).populate("userId").populate("eventId");

        res.json({ message: "Tickets fetched successfully", result: tickets });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

