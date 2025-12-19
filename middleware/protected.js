const jwt = require("jsonwebtoken")

exports.adminProtected = (req, res, next) => {
    const { admin } = req.cookies
    if (!admin) {
        return res.status(401).json({ messae: "No Cookie Found" })
    }
    // token verify
    jwt.verify(admin, process.env.JWT_KEY, (error, decode) => {
        if (error) {
            console.log(error)
            return res.status(401).json({ message: "Invalid Token" })

        }
        req.user = { _id: decode.userId }
        next()
    })
}

exports.customerProtected = (req, res, next) => {
    const { customer } = req.cookies
    if (!customer) {
        // console.log("nooooooooooooo");

        return res.status(401).json({ message: "No Cookie Found" })
    }
    // Token Verify
    jwt.verify(customer, process.env.JWT_KEY, (error, decode) => {
        if (error) {
            console.log(error)
            return res.status(401).json({ message: "Invalid Token" })
        }
        req.user = decode.userId
        next()
    })
}

