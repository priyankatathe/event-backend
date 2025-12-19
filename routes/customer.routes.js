const router = require("express").Router()

const { adminProtected, customerProtected } = require("../middleware/protected")
const customerController = require("./../controller/customer.controller")


router
    .post("/customer-register", customerController.registerCustomer)
    .post("/customer-login", customerController.loginCustomer)
    .post("/customer-logout", customerController.logoutCustomer)

    // .put("/admin-update/:id", customerController.updateAdmin)

    .get("/customer-fetch", customerController.fetchCustomers)


module.exports = router