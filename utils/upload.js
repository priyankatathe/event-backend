const multer = require("multer")
const path = require("path")

const storage = multer.diskStorage({        //diskStorage imbild fuction  
    filename: (req, file, cb) => {   // date.now second cout krt
        const fn = Date.now() + path.extname(file.originalname)
        cb(null, fn)
    }
})
exports.upload = multer({ storage }).single("image")
exports.uploadImage = multer({ storage }).fields([
    { name: "coverImage", maxCount: 1 },
    { name: "images", maxCount: 5 },
])