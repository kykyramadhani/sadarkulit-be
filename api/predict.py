# File: api/predict.py
# VERSI FINAL dengan perbaikan path impor untuk Vercel

# --- KODE BARU DIMULAI DI SINI ---
import sys
import os

# Menambahkan direktori root proyek ('sadarkulit-be') ke dalam path Python
# Ini WAJIB agar Vercel bisa menemukan 'model_loader' dan 'image_processor'
current_dir = os.path.dirname(__file__)
root_dir = os.path.abspath(os.path.join(current_dir, ".."))
if root_dir not in sys.path:
    sys.path.append(root_dir)
# --- KODE BARU BERAKHIR DI SINI ---


from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import logging

# Sekarang, impor ini akan berfungsi dengan baik di Vercel
import model_loader 
import image_processor

# Inisialisasi aplikasi Flask. Vercel akan menangani ini.
app = Flask(__name__)

# Konfigurasi logging
logging.basicConfig(level=logging.INFO)

# Konfigurasi CORS. Izinkan akses dari semua origin untuk endpoint ini.
CORS(app)

# --- PENTING: Pemuatan Model dan Label ---
try:
    logging.info("Memulai pemuatan model dan label untuk serverless function...")
    model_loader.load_model_and_labels() # Pastikan model_loader.py juga menggunakan path yang benar
    logging.info("Model dan label berhasil dimuat.")
except Exception as e:
    logging.error(f"!!! GAGAL TOTAL MEMUAT MODEL SAAT INISIALISASI: {str(e)}", exc_info=True)


# --- Endpoint Prediksi Utama ---
@app.route('/api/predict', methods=['POST'])
def predict_endpoint():
    logging.info(f"Menerima request ke /api/predict")

    if model_loader.model is None:
        logging.error("Model tidak tersedia karena gagal dimuat saat startup.")
        return jsonify({'error': 'Model tidak tersedia atau gagal dimuat. Periksa log server di Vercel.'}), 503

    if 'image' not in request.files:
        logging.warning("Request tidak menyertakan file 'image'.")
        return jsonify({'error': "Tidak ada bagian file 'image' dalam request."}), 400

    file = request.files['image']
    if file.filename == '':
        logging.warning("Nama file kosong, tidak ada gambar yang dipilih.")
        return jsonify({'error': 'Tidak ada file gambar yang dipilih.'}), 400

    if file:
        logging.info(f"Memproses file: {file.filename}")
        try:
            image_bytes = file.read()
            processed_image_array = image_processor.preprocess_image(image_bytes)
            
            predictions_raw = model_loader.model.predict(processed_image_array)
            
            probabilities = predictions_raw[0]
            predicted_index = np.argmax(probabilities)
            confidence_score = float(probabilities[predicted_index])

            disease_name = model_loader.class_labels.get(str(predicted_index), f"Kelas Indeks {predicted_index} (Tidak Dikenal)")
            
            response_data = {
                'predicted_disease': disease_name,
                'confidence': f"{confidence_score:.4f}"
            }
            
            logging.info(f"Hasil prediksi dikirim: {response_data}")
            return jsonify(response_data)

        except ValueError as ve:
            logging.error(f"Error saat pra-pemrosesan gambar: {str(ve)}", exc_info=True)
            return jsonify({'error': f"Error memproses gambar: {str(ve)}"}), 400
        except Exception as e:
            logging.error(f"Error tidak terduga saat prediksi: {str(e)}", exc_info=True)
            return jsonify({'error': 'Terjadi kesalahan internal di server.'}), 500
    
    return jsonify({'error': 'File tidak valid.'}), 400

# Blok "if __name__ == '__main__':" dan "app.run(...)" sudah dihapus karena tidak diperlukan oleh Vercel.