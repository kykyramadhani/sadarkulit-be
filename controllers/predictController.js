const axios = require('axios');

const predict = async (req, res) => {
  try {
    console.log('Received request body length:', req.body.length);
    if (!req.body || req.body.length === 0) {
      return res.status(400).json({ error: 'Tidak ada gambar yang dikirim' });
    }

    const formData = new FormData();
    formData.append('image', req.body, {
      filename: 'skin_image.jpg',
      contentType: req.get('content-type') || 'image/jpeg'
    });

    const response = await axios.post(
      'https://sadarkulit-ml-d6b8dderhsdxf7ay.southeastasia-01.azurewebsites.net/',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Content-Type': 'multipart/form-data'
        },
        maxContentLength: 300 * 1024 * 1024,
        maxBodyLength: 300 * 1024 * 1024,
        timeout: 10000
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error saat prediksi:', error.message, error.stack);
    if (error.response) {
      return res.status(error.response.status).json({ error: error.response.data.error });
    }
    res.status(500).json({ error: 'Terjadi kesalahan internal di server backend' });
  }
};

module.exports = { predict };