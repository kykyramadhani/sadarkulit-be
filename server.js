require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const historyRoutes = require('./routes/historyRoutes');
const predictRoutes = require('./routes/predictRoutes');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'https://sadarkulit-fe.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
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
app.use(express.json());

// Middleware untuk menangani file biner (khusus untuk gambar)
app.use(express.raw({
  type: ['image/jpeg', 'image/png'],
  limit: '300mb'
}));

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 60000,
  socketTimeoutMS: 60000,
  connectTimeoutMS: 60000,
  maxPoolSize: 10
})
  .then(() => console.log('✅ Terhubung ke MongoDB Atlas'))
  .catch(err => console.error('❌ Gagal koneksi ke MongoDB:', err));

app.get('/', (req, res) => {
  res.send('Halo dari SadarKulit Backend!');
});

// Gunakan routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/history', historyRoutes);
app.use('/predict', predictRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});