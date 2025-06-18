const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const cors = require('cors');
const Jimp = require('jimp');
const axios = require('axios');

const app = express();

// Basic CORS configuration for local development
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

// Middleware
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Setup directories
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};
ensureDirectoryExists(path.join(__dirname, 'uploads'));
ensureDirectoryExists(path.join(__dirname, 'processed'));

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Process image function
const processImage = async (inputPath, bgColor, filename) => {
  const outputPath = path.join(__dirname, 'processed', `${filename}-nobg.png`);
  const finalPath = path.join(__dirname, 'processed', `${filename}-final.png`);

  // Remove background
  await new Promise((resolve, reject) => {
    const process = exec(`rembg i "${inputPath}" "${outputPath}"`, (err) => {
      if (err) return reject(new Error('Background removal failed'));
      resolve();
    });

    setTimeout(() => {
      process.kill();
      reject(new Error('Background removal timed out'));
    }, 30000);
  });

  // Apply new background color
  const image = await Jimp.read(outputPath);
  const bg = new Jimp(image.bitmap.width, image.bitmap.height, bgColor);
  bg.composite(image, 0, 0);
  await bg.writeAsync(finalPath);

  const base64 = await fs.promises.readFile(finalPath, { encoding: 'base64' });
  
  return {
    base64: `data:image/png;base64,${base64}`,
    url: `http://localhost:5000/processed/${path.basename(finalPath)}`
  };
};

// Serve processed files
app.use('/processed', express.static(path.join(__dirname, 'processed')));

// Upload endpoint
app.post('/upload', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file && !req.body.photo_url) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const bgColor = req.body.color || '#ffffff';
    let inputPath, filename;

    if (req.file) {
      inputPath = req.file.path;
      filename = path.parse(req.file.filename).name;
    } else {
      try {
        new URL(req.body.photo_url);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid URL format' });
      }

      const response = await axios({
        method: 'get',
        url: req.body.photo_url,
        responseType: 'arraybuffer',
        timeout: 10000
      });

      if (!response.headers['content-type']?.startsWith('image/')) {
        return res.status(400).json({ error: 'URL does not point to a valid image' });
      }

      filename = `url-${Date.now()}`;
      inputPath = path.join(__dirname, 'uploads', `${filename}.tmp`);
      await fs.promises.writeFile(inputPath, response.data);
    }

    const result = await processImage(inputPath, bgColor, filename);
    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message || 'Image processing failed' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Uploads directory:', path.join(__dirname, 'uploads'));
  console.log('Processed directory:', path.join(__dirname, 'processed'));
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});