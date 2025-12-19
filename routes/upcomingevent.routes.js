const router = require("express").Router()

const { adminProtected } = require("../middleware/protected")
const upcomingeventController = require("./../controller/upcomingevent.controller")


router
    .post("/book-ticket", upcomingeventController.bookTicket)
    .get("/event/:id", upcomingeventController.getEventById)
    .get("/event-get", upcomingeventController.getPublicEvents)
    .post("/event-add", adminProtected, upcomingeventController.addEvent)

    .put("/event-update/:id", upcomingeventController.updateEvent)
    .delete("/event-delete/:id", upcomingeventController.deleteEvent)


module.exports = router