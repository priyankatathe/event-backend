const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const cookieparser = require("cookie-parser")
require("dotenv").config()

const app = express()

app.use(express.json())
app.use(cookieparser())
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))

app.use("/api/auth", require("./routes/auth.routes"))
app.use("/api/customer", require("./routes/customer.routes"))
app.use("/api/razorpay", require("./routes/razorpay.routes"))
app.use("/api/event", require("./routes/upcomingevent.routes"))


app.use((req, res, next) => {
    res.status(404).send("Sorry can't find that!")
})

mongoose.connect(process.env.MONGO_URL)
mongoose.connection.once("open", () => {
    console.log("mongoose connected")
    app.listen(process.env.PORT, console.log("server runnningg"))
})

