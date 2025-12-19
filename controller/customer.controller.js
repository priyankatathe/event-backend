const { checkEmpty } = require("../utils/checkEmpty")
const asyncHandler = require("express-async-handler")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const validator = require("validator")
const User = require("../module/User")


exports.registerCustomer = asyncHandler(async (req, res) => {
    const { name, email, password, mobile } = req.body
    const { isError, error } = checkEmpty({ name, email, password, mobile })
    if (isError) {
        return res.status(400).json({ message: "All Fields Required", error })
    }
    if (!validator.isEmail(email)) {
        return res.status(400).json({ message: "Inavlid Email" })
    }
    if (!validator.isStrongPassword(password)) {
        return res.status(400).json({ message: "Provide Strong Password" })
    }
    if (mobile && !validator.isMobilePhone(mobile)) {
        return res.status(400).json({ message: "Provide currect phone no" })
    }
    const isFound = await User.findOne({ email, mobile })
    if (isFound) {
        return res.status(400).json({ message: "Email OR Mobile Already registered with us" })
    }
    const hash = await bcrypt.hash(password, 10)
    const result = await User.create({ name, email, password: hash, mobile })
    res.json({ message: "customer register success", result })
})




exports.loginCustomer = asyncHandler(async (req, res) => {
    const { email, password } = req.body
    const { isError, error } = checkEmpty({ email, password })

    if (isError) {
        return res.status(400).json({ message: "All Fields Required", error })
    }

    try {
        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: "Invalid email format" })
        }

        const result = await User.findOne({ email })
        if (!result) {
            return res.status(404).json({ message: "User not registered" })
        }

        const isVerify = await bcrypt.compare(password, result.password)
        if (!isVerify) {
            return res.status(401).json({ message: "Password do not match" })
        }

        // ✅ Success
        const token = jwt.sign({ userId: result._id }, process.env.JWT_KEY, { expiresIn: "15d" })

        res.cookie("customer", token, {
            maxAge: 15 * 24 * 60 * 60 * 1000,
            httpOnly: true,
        })

        res.status(200).json({
            message: "Credentials Verify Success.",
            result: {
                _id: result._id,
                name: result.name,
                email: result.email,
                mobile: result.mobile,
            },
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Internal Server Error" })
    }
})




exports.logoutCustomer = (req, res) => {
    res.clearCookie("customer")
    res.json({ message: "Customer logout success" })
}

exports.fetchCustomers = asyncHandler(async (req, res) => {
    try {
        const customers = await User.find({ adminId: req.user }) // req.user = adminId

        res.json({ message: "Customers fetched successfully", customers })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error", error: error.message })
    }
})


