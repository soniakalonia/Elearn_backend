const env = require("../config/env");

const publicUrl = (filename) => `/${env.UPLOAD_DIR}/${filename}`;

module.exports = { publicUrl };