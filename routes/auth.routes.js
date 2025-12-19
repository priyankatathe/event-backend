const router = require("express").Router()

const { adminProtected } = require("../middleware/protected")
const authController = require("./../controller/auth.controller")


router
    .post("/admin-register", authController.registerAdmin)
    .post("/admin-login", authController.loginAdmin)
    .post("/admin-logout", authController.logoutAdmin)

    .put("/admin-update/:id", authController.updateAdmin)


    .get("/admin-fetch", adminProtected, authController.fetchAdmin)
    .get("/admin-event", adminProtected, authController.getAdminEvents)

    .get("/admin/event/:eventId/bookings", adminProtected, authController.getAdminEventTickets)


module.exports = router