const asyncHandler = require("express-async-handler")
const UEvents = require("../module/UEvents")
const { uploadImage } = require("../utils/upload")
const cloudinary = require("../utils/cloudinary.config")
const { checkEmpty } = require("../utils/checkEmpty")
const mongoose = require("mongoose")



exports.getPublicEvents = asyncHandler(async (req, res) => {
    try {
        const events = await UEvents.find()
        res.json({ message: "Public events fetched successfully", result: events })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server Error", error: error.message })
    }
})


// Delete Event
exports.deleteEvent = asyncHandler(async (req, res) => {
    const eventId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(400).json({ message: "Invalid Event ID" });
    }

    const event = await UEvents.findByIdAndDelete(eventId)

    if (!event) {
        return res.status(404).json({ message: "Event not found" })
    }

    res.json({ message: "Event deleted successfully", result: event })
})



// Add Event
exports.addEvent = asyncHandler(async (req, res) => {
    uploadImage(req, res, async (err) => {
        if (err) {
            console.log(err)
            return res.status(400).json({ message: "Unable To Upload Image", error: err })
        }

        const {
            name,
            description,
            date,
            time,
            venue,
            ticketOptions,
            fees,
            tags,
            categories,
            organizer,
        } = req.body

        const { isError, error } = checkEmpty({ name, date })
        if (isError) {
            return res.status(400).json({ message: "Name and Date are required", error })
        }

        try {
            // Upload images to cloudinary
            let coverImageUrl = null
            let imagesUrls = []

            if (req.files && req.files.coverImage && req.files.coverImage[0]) {
                const { secure_url } = await cloudinary.uploader.upload(req.files.coverImage[0].path)
                coverImageUrl = secure_url
            }

            if (req.files && req.files.images && Array.isArray(req.files.images)) {
                for (const file of req.files.images) {
                    const { secure_url } = await cloudinary.uploader.upload(file.path)
                    imagesUrls.push(secure_url)
                }
            }

            // Parse ticketOptions
            let parsedTicketOptions = []
            if (ticketOptions) {
                try {
                    parsedTicketOptions = JSON.parse(ticketOptions).map(opt => ({
                        ...opt,
                        availableQuantity: opt.availableQuantity || 0,
                        status: (opt.availableQuantity || 0) > 0 ? "Available" : "Sold Out"
                    }))
                } catch (e) {
                    return res.status(400).json({ message: "Invalid ticketOptions format" })
                }
            }

            // Parse other nested objects
            const parsedVenue = venue ? JSON.parse(venue) : undefined
            const parsedFees = fees ? JSON.parse(fees) : { transactionFee: 2.14, convenienceFee: 1.0 }
            const parsedTags = tags ? JSON.parse(tags) : []
            const parsedCategories = categories ? JSON.parse(categories) : []
            const parsedOrganizer = organizer ? JSON.parse(organizer) : undefined



            const result = await UEvents.create({
                name,
                description,
                date: new Date(date),
                time,
                coverImage: coverImageUrl,
                images: imagesUrls,
                venue: parsedVenue,
                ticketOptions: parsedTicketOptions,
                fees: parsedFees,
                tags: parsedTags,
                categories: parsedCategories,
                organizer: parsedOrganizer,
                adminId: req.user
            })

            res.json({ message: "Event added successfully", result })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Something went wrong", error: error.message })
        }
    })
})



exports.updateEvent = asyncHandler(async (req, res) => {
    uploadImage(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: "Image Upload Failed", error: err });
        }

        const { id } = req.params
        // console.log("params id", id);

        const {
            name,
            description,
            date,
            time,
            venue,
            address,
            ticketOptions,
            fees,
            tags,
            categories,
            organizer,
        } = req.body;

        // Basic validation
        const { isError, error } = checkEmpty({ name, date });
        if (isError) {
            return res.status(400).json({ message: "Name and Date are required", error });
        }

        try {
            // 1️⃣ Cover Image
            let coverImageUrl = null;
            if (req.files?.coverImage?.[0]) {
                const { secure_url } = await cloudinary.uploader.upload(req.files.coverImage[0].path);
                coverImageUrl = secure_url;
            }

            // 2️⃣ Additional Images
            let imagesUrls = [];
            if (req.files?.images && Array.isArray(req.files.images)) {
                for (const file of req.files.images) {
                    const { secure_url } = await cloudinary.uploader.upload(file.path);
                    imagesUrls.push(secure_url);
                }
            }

            // 3️⃣ Parse venue safely
            let parsedVenue;
            try {
                parsedVenue = venue ? JSON.parse(venue) : { name: venue || "", address: address || "" };
            } catch {
                parsedVenue = { name: venue || "", address: address || "" };
            }

            // 4️⃣ Parse ticketOptions
            let parsedTicketOptions = [];
            if (ticketOptions) {
                try {
                    parsedTicketOptions = JSON.parse(ticketOptions);
                } catch {
                    return res.status(400).json({ message: "Invalid ticketOptions format" });
                }
            }

            // 5️⃣ Parse fees safely
            let parsedFees;
            try {
                parsedFees = fees ? JSON.parse(fees) : { transactionFee: 0, convenienceFee: 0 };
            } catch {
                parsedFees = { transactionFee: 0, convenienceFee: 0 };
            }

            // 6️⃣ Parse tags, categories, organizer
            let parsedTags = [];
            try { parsedTags = tags ? JSON.parse(tags) : []; } catch { }
            let parsedCategories = [];
            try { parsedCategories = categories ? JSON.parse(categories) : []; } catch { }
            let parsedOrganizer;
            try { parsedOrganizer = organizer ? JSON.parse(organizer) : undefined; } catch { }

            // Prepare update object
            const updateData = {
                name,
                description,
                date: new Date(date),
                time,
                venue: parsedVenue,
                ticketOptions: parsedTicketOptions,
                fees: parsedFees,
                tags: parsedTags,
                categories: parsedCategories,
                organizer: parsedOrganizer,
            };

            if (coverImageUrl) updateData.coverImage = coverImageUrl;
            if (imagesUrls.length > 0) updateData.images = imagesUrls;

            // Update in DB
            const result = await UEvents.findByIdAndUpdate(id, updateData, { new: true });

            if (!result) {
                return res.status(404).json({ message: "Event not found" });
            }

            res.json({ message: "Event updated successfully", result });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Update Failed", error: error.message });
        }
    });
});



exports.getEventById = asyncHandler(async (req, res) => {
    const eventId = req.params.id

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(400).json({ message: "Invalid Event ID" })
    }

    const event = await UEvents.findById(eventId)
    if (!event) {
        return res.status(404).json({ message: "Event not found" })
    }

    res.json({ message: "Event fetched successfully", event })
})

// Book Ticket
exports.bookTicket = asyncHandler(async (req, res) => {
    try {
        const { eventId, quantity } = req.body

        if (!eventId || !quantity) {
            return res.status(400).json({ message: "eventId and quantity are required" })
        }

        const event = await UEvents.findById(eventId)
        if (!event) {
            return res.status(404).json({ message: "Event not found" })
        }

        // Calculate total available tickets
        let totalAvailable = event.ticketOptions.reduce((acc, t) => acc + t.availableQuantity, 0)

        if (totalAvailable <= 0) {
            return res.status(400).json({ message: "Tickets are sold out", soldOut: true, remainingTickets: 0 })
        }

        if (totalAvailable < quantity) {
            return res.status(400).json({ message: `Only ${totalAvailable} tickets left`, soldOut: false, remainingTickets: totalAvailable })
        }

        // Reduce availableQuantity from ticketOptions
        let remaining = quantity
        for (let t of event.ticketOptions) {
            if (remaining === 0) break

            const bookNow = Math.min(t.availableQuantity, remaining)
            t.availableQuantity -= bookNow
            remaining -= bookNow
        }

        await event.save()

        const remainingTickets = event.ticketOptions.reduce((acc, t) => acc + t.availableQuantity, 0)

        res.json({
            message: "Ticket booked successfully",
            soldOut: remainingTickets === 0,
            remainingTickets,
            ticketOptions: event.ticketOptions.map(t => ({
                name: t.name,
                availableQuantity: t.availableQuantity,
                status: t.availableQuantity > 0 ? "Available" : "Sold Out"
            }))
        })

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message })
    }
})
