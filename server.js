// File: server.js (Versi Perbaikan)

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');

// Impor Rute
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const historyRoutes = require('./routes/historyRoutes');
const predictRoutes = require('./routes/predictRoutes'); // Rute baru untuk prediksi

// Inisialisasi aplikasi Express
const app = express();
const PORT = process.env.PORT || 3000;

// --- KONFIGURASI MIDDLEWARE ---

// 1. Konfigurasi CORS
const allowedOrigins = [
  'http://localhost:5173',
  'https://sadarkulit-fe.vercel.app' // Ganti jika URL frontend Anda berbeda
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Akses ditolak oleh CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// 2. Middleware untuk Logging Request
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 3. Middleware untuk membaca body JSON
app.use(express.json());

// 4. Konfigurasi Multer untuk upload file
const upload = multer({
  storage: multer.memoryStorage(), // Simpan file di memori (RAM)
  limits: { fileSize: 10 * 1024 * 1024 }, // Batas ukuran file 10 MB (lebih aman dari 300 MB)
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Hanya gambar format JPEG, PNG, atau WEBP yang diizinkan'), false);
    }
  }
});


// --- PENDAFTARAN RUTE (ROUTES) ---
console.log('Mendaftarkan rute...');

// Rute untuk CRUD (Create, Read, Update, Delete) data biasa
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/history', historyRoutes);

// Rute KHUSUS untuk prediksi yang memerlukan upload gambar
// Middleware 'upload.single('image')' hanya diterapkan pada rute ini
app.use('/predict', upload.single('image'), predictRoutes);

// Rute default untuk health check
app.get('/', (req, res) => {
  res.send('Halo dari SadarKulit Backend!');
});


// --- PENANGANAN ERROR (diletakkan di akhir) ---

// Handler untuk error dari Multer atau file filter
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err.message);
    return res.status(400).json({ error: `File Upload Error: ${err.message}` });
  } else if (err) {
    console.error('File filter error:', err.message);
    return res.status(400).json({ error: err.message });
  }
  next(err); // Teruskan ke handler error lain jika bukan error Multer
});

// Handler untuk 404 Not Found (jika tidak ada rute yang cocok)
app.use((req, res) => {
  console.error(`404: Rute ${req.method} ${req.url} tidak ditemukan.`);
  res.status(404).json({ error: `Rute tidak ditemukan: ${req.method} ${req.url}` });
});


// --- FUNGSI UTAMA UNTUK MENJALANKAN SERVER ---
const startServer = async () => {
  try {
    // 1. TUNGGU koneksi database sampai benar-benar selesai
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Terhubung ke MongoDB Atlas');

    // 2. HANYA SETELAH database terhubung, jalankan server Express
    app.listen(PORT, () => {
      console.log(`Server berjalan di port ${PORT}`);
    });

  } catch (error) {
    console.error('❌ Gagal total saat memulai server:', error);
    process.exit(1);
  }
};

// Panggil fungsi untuk memulai semuanya
startServer();