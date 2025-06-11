const axios = require('axios');
const FormData = require('form-data');

const predict = async (req, res) => {
  try {
    console.log('Received predict request');
    if (!req.file) {
      console.log('No image provided in request');
      return res.status(400).json({ error: 'No image provided' });
    }

    // Create FormData for Azure API
    const formData = new FormData();
    formData.append('image', req.file.buffer, {
      filename: 'skin_image.jpg',
      contentType: req.file.mimetype,
    });

    // Send request to Azure API
    const azureApiUrl = process.env.AZURE_API_URL || 'https://sadarkulit-ml-d6b8dderhsdxf7ay.southeastasia-01.azurewebsites.net/';
    const response = await axios.post(azureApiUrl, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      maxContentLength: 300 * 1024 * 1024, // 300 MB
      maxBodyLength: 300 * 1024 * 1024, // 300 MB
      timeout: 60000, // 60 seconds
    });

    console.log('Azure API response:', response.data);
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Prediction error:', {
      message: error.message,
      stack: error.stack,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data,
      } : null,
    });

    if (error.response) {
      return res.status(error.response.status).json({
        error: error.response.data.error || 'Error from Azure API',
      });
    }
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'Request to Azure API timed out' });
    }
    res.status(500).json({ error: 'Internal server error during prediction' });
  }
};

module.exports = { predict };