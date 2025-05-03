const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

/**
 * Saves a base64 image to the uploads directory with a unique filename.
 * @param {string} base64String - The base64 encoded image string.
 * @returns {string|null} - The saved filename or null on failure.
 */

function saveBase64Image(base64String) {
  try {
    // Ensure the uploads directory exists
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Extract image extension
    const match = base64String.match(/^data:image\/(\w+);base64,/);
    if (!match) {
      throw new Error("Invalid base64 image format");
    }
    const extension = match[1];

    // Generate a unique filename
    const uniqueId = crypto.randomBytes(8).toString("hex"); // 16-character random string
    const filename = `image_${Date.now()}_${uniqueId}.${extension}`;

    // Remove metadata from base64 string
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Define file path
    const filePath = path.join(uploadDir, filename);

    // Write file to disk
    // fs.writeFileSync(filePath, buffer);

    return filename; // Return only the filename
  } catch (error) {
    console.error("Error saving base64 image:", error);
    return null;
  }
}

module.exports = { saveBase64Image };
