const axios = require('axios');
const FormData = require('form-data');
const { createHistory } = require('./historyController');

const classLabels = {
  "0": "Eczema",
  "1": "Warts Molluscum",
  "2": "Melanoma",
  "3": "Atopic Dermatitis",
  "4": "Basal Cell Carcinoma",
  "5": "Melanocytic Nevi",
  "6": "Benign Keratosis-like Lesions",
  "7": "Psoriasis",
  "8": "Seborrheic Keratoses / Benign Tumor",
  "9": "Tinea Ringworm Candidiasis / Fungal Infections",
};

const predict = async (req, res) => {
  try {
    console.log('Menerima request prediksi');
    console.log('Authorization Header:', req.headers.authorization); 
    console.log('User dari token:', req.user); 

    if (!req.file) {
      console.log('Tidak ada gambar yang dikirim dalam request');
      return res.status(400).json({ error: 'Tidak ada gambar yang dikirim' });
    }

    const formData = new FormData();
    formData.append('image', req.file.buffer, {
      filename: 'skin_image.jpg',
      contentType: req.file.mimetype,
    });

    const azureApiUrl = process.env.AZURE_API_URL || 'https://sadarkulit-ml-d6b8dderhsdxf7ay.southeastasia-01.azurewebsites.net/';
    const response = await axios.post(azureApiUrl, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      maxContentLength: 300 * 1024 * 1024, 
      maxBodyLength: 300 * 1024 * 1024, 
      timeout: 60000, 
    });

    console.log('Respons API Azure:', response.data);

    const predictedDisease = response.data.predicted_disease;
    const classId = predictedDisease.split('.')[0].trim(); 
    console.log('Extracted classId:', classId); 
    const friendlyDiseaseName = classLabels[classId] || predictedDisease; 
    console.log('Friendly Disease Name:', friendlyDiseaseName); 

    const modifiedResponse = {
      ...response.data,
      predicted_disease: friendlyDiseaseName
    };

    const historyReq = {
      user: req.user,
      body: { detectedDisease: friendlyDiseaseName },
    };
    const historyRes = {
      status: (code) => ({
        json: (data) => ({ statusCode: code, data }),
      }),
    };
    await createHistory(historyReq, historyRes);

    res.status(200).json(modifiedResponse);
  } catch (error) {
    console.error('Error prediksi:', {
      message: error.message,
      stack: error.stack,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data,
      } : null,
    });

    if (error.response) {
      return res.status(error.response.status).json({
        error: error.response.data.error || 'Error dari API Azure',
      });
    }
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'Request ke API Azure timeout' });
    }
    res.status(500).json({ error: 'Terjadi kesalahan internal saat prediksi' });
  }
};

module.exports = { predict };