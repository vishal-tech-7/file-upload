const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const File = require('./models/File'); // File model

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Database connection error:', err));

// Helmet for security headers
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

// Multer Configuration
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads')); // Serve uploaded files
app.use(express.static('public')); // Serve static files from "public" folder

// API Routes

// Get all files
app.get('/api/files', async (req, res) => {
  try {
    const files = await File.find();
    res.json(files);
  } catch (err) {
    res.status(500).send('Error loading files');
  }
});

// Upload a file
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { originalname, mimetype, size, filename } = req.file;

    const file = new File({ filename: originalname, path: filename, mimetype, size });
    await file.save();

    res.status(200).json({ message: 'File uploaded successfully' });
  } catch (err) {
    res.status(400).send('Error uploading file');
  }
});

// Download a file
app.get('/download/:id', async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) throw new Error('File not found');

    const safePath = path.join(__dirname, 'uploads', path.basename(file.path));
    res.download(safePath, file.filename);
  } catch (err) {
    res.status(404).send('File not found');
  }
});

// Delete a file
app.post('/delete/:id', async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) throw new Error('File not found');

    fs.unlinkSync(path.join(__dirname, 'uploads', file.path));
    await file.delete();

    res.status(200).json({ message: 'File deleted successfully' });
  } catch (err) {
    res.status(404).send('Error deleting file');
  }
});

// Start Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
