const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set the uploads directory to an absolute path
const uploadDir = path.resolve(__dirname, '../uploads');

// Ensure the directory exists before using it
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true }); // Create the uploads folder if it doesn't exist
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const uploadFields = (fields) => {
    return multer({
        storage: storage,
    }).fields(fields); // Dynamically set fields
};

module.exports = (fields) => {
    return (req, res, next) => {
        const upload = uploadFields(fields);
        upload(req, res, function (err) {
            if (err) {
                // Handle multer-specific errors
                if (err instanceof multer.MulterError) {
                    return res.status(500).json({ message: 'Multer error: ' + err.message });
                }
                // Handle validation errors (invalid file type, file too large)
                return res.status(500).json({ message: 'File upload error: ' + err.message });
            }

            // If files are uploaded successfully, add the filenames to req.uploadedFiles;
            if (req.files) {
                req.uploadedFiles = {};
                for (const field in req.files) {
                    req.uploadedFiles[field] = req.files[field].map(file => path.resolve(uploadDir, file.filename));
                }
            } else {
                req.uploadedFiles = {}; // No files uploaded
            }
            next();
        });
    }
};
