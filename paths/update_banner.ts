const fs = require('node:fs');
const path = require('node:path');
const Xenith = require('xenith');
const Token = require('./utils/Token');

module.exports = {
    path: "/update_banner",
    method: "POST",
    access: "LIMIT",
    execute: async (req, res) => {
        const decrypted = Xenith.decryptMessage(req.body.data, Xenith.privateKey);
        const token = req.headers.authorization?.split(" ")[1];
        const json = JSON.parse(decrypted);
        const image = json.imageData;
        if (!image) {
            return res.json({ error: "Image is required." }, 400);
        }
        try {
            const uploadsDir = path.join(__dirname, 'uploads');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir);
            }
            
            const buffer = Buffer.from(image, 'base64');
            const sharp = require('sharp');
            const fileName = `${Date.now()}.webp`;
            const filePath = path.join(uploadsDir, fileName);

            await sharp(buffer)
                .webp({ quality: 80 })
                .toFile(filePath);

            await Token.updateBanner(token, `https://api.lesbians.monster/uploads/${fileName}`);
            return res.json({ message: "Updated profile picture.", filePath }, 200);
        } catch (error) {
            console.error("Error saving the image:", error);
            return res.json({ error: "Failed to upload image." }, 500);
        }
    }
}