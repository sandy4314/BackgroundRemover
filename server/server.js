const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const cors = require("cors");
const Jimp = require("jimp");
const app = express();

// Environment configuration
require('dotenv').config();
const isProduction = process.env.NODE_ENV === 'production';

// CORS configuration
const corsOptions = {
  origin: isProduction 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:3000',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Middleware
app.use(express.json());

// Create directories if they don't exist
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
if (!fs.existsSync("processed")) fs.mkdirSync("processed");

const upload = multer({ 
  dest: "uploads/",
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Upload endpoint
app.post("/upload", upload.single("photo"), async (req, res) => {
  try {
    const file = req.file;
    const bgColor = req.body.color || "#ffffff";

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const inputPath = file.path;
    const outputPath = `processed/${file.filename}_nobg.png`;
    const finalPath = `processed/${file.filename}_final.png`;

    // Background removal
    exec(`rembg i ${inputPath} ${outputPath}`, async (err) => {
      if (err) {
        console.error("Background removal failed", err);
        return res.status(500).json({ error: "Background removal failed" });
      }

      try {
        const fg = await Jimp.read(outputPath);
        const bg = new Jimp(fg.bitmap.width, fg.bitmap.height, bgColor);
        bg.composite(fg, 0, 0);

        await bg.writeAsync(finalPath);

        const base64 = await fs.promises.readFile(finalPath, { encoding: "base64" });

        // Clean up temporary files
        if (isProduction) {
          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputPath);
          fs.unlinkSync(finalPath);
        }

        res.json({
          final: `data:image/png;base64,${base64}`,
        });
      } catch (e) {
        console.error("Image processing error", e);
        res.status(500).json({ error: "Image composition failed" });
      }
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));