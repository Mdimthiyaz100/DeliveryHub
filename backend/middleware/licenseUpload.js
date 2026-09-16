const multer = require('multer');

const allowedTypes = new Set(['application/pdf', 'image/jpeg']);

module.exports = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
        callback(null, allowedTypes.has(file.mimetype));
    }
});
