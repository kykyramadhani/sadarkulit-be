require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const historyRoutes = require('./routes/historyRoutes');
const predictRoutes = require('./routes/predictRoutes');

const app = express();

app.set('strict routing', false);

const allowedOrigins = [
  'http://localhost:5173',
  'https://sadarkulit-fe.vercel.app'
];
app.use(cors({
  origin: (origin, callback) => {
    console.log('CORS Origin:', origin);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 300 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    console.log('File MIME type:', file.mimetype);
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Hanya gambar JPEG dan PNG yang diizinkan'), false);
    }
  }
});

app.use(express.json());

console.log('Mendaftarkan rute...');
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/history', historyRoutes);
app.use('/', upload.single('image'), predictRoutes);

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err.message);
    return res.status(400).json({ error: err.message });
  } else if (err) {
    console.error('File filter error:', err.message);
    return res.status(400).json({ error: err.message });
  }
  next();
});

app.get('/', (req, res) => {
  res.send('Halo dari SadarKulit Backend!');
});

app.use((req, res) => {
  console.error(`404: ${req.method} ${req.url} tidak ditemukan`);
  res.status(404).json({ error: `Tidak bisa ${req.method} ${req.url}` });
});

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 60000,
  socketTimeoutMS: 60000,
  connectTimeoutMS: 60000,
  maxPoolSize: 10
})
  .then(() => console.log('✅ Terhubung ke MongoDB Atlas'))
  .catch(err => console.error('❌ Gagal koneksi ke MongoDB:', err));

const PORT = process.env.PORT || 5173;
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});