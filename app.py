# backend_flask/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import logging # Impor modul logging

# Impor modul secara keseluruhan. Ini penting untuk mengatasi masalah scope.
import model_loader
import image_processor # Pastikan file image_processor.py Anda sudah ada

app = Flask(__name__)

# Setup logging dasar untuk aplikasi Flask
# Anda bisa mengatur format dan level yang lebih detail jika diperlukan
logging.basicConfig(level=logging.INFO)
app.logger.setLevel(logging.INFO) # Atau logging.DEBUG untuk lebih detail saat pengembangan

# Aktifkan CORS. Untuk produksi, batasi origins ke domain frontend React Anda.
# Contoh: CORS(app, resources={r"/api/*": {"origins": "https://domain-react-anda.com"}})
CORS(app, resources={r"/api/*": {"origins": "*"}}) # Mengizinkan semua origin untuk path /api/*

# --- Memuat Model dan Label saat Aplikasi Dimulai ---
# Ini akan dijalankan sekali saat server Flask pertama kali dijalankan.
# Menggunakan try-except untuk menangani potensi error saat startup.
try:
    with app.app_context():
        app.logger.info("Memulai pemuatan model dan label dari app.py...")
        model_loader.load_model_and_labels() # Memanggil fungsi dari modul model_loader
except Exception as e:
    app.logger.error(f"!!! GAGAL MEMUAT MODEL ATAU LABEL SAAT STARTUP: {str(e)}", exc_info=True)
    # Jika model adalah krusial, aplikasi mungkin tidak berguna.
    # Anda bisa memutuskan untuk menghentikan aplikasi (exit(1)) di sini dalam skenario produksi.

# --- Endpoints API ---
@app.route('/')
def home():
    # Akses variabel model dan class_labels melalui modul 'model_loader'
    status_model_msg = "Model SIAP." if model_loader.model is not None else "PERINGATAN: Model GAGAL dimuat atau belum siap."
    status_label_msg = "Label kelas SIAP." if model_loader.class_labels else "PERINGATAN: Label kelas GAGAL dimuat atau tidak ada."
    
    # Mencetak status ke log server juga bisa membantu debugging
    app.logger.info(f"Status endpoint '/' : Model - {status_model_msg}, Label - {status_label_msg}")
    
    return f"Selamat datang di API Prediksi Penyakit Kulit! Status: [{status_model_msg}] [{status_label_msg}]"

@app.route('/api/predict', methods=['POST'])
def predict_endpoint():
    app.logger.info(f"Menerima permintaan ke {request.method} {request.path}")
    
    # Akses variabel model melalui modul 'model_loader'
    if model_loader.model is None:
        app.logger.error("Endpoint /api/predict: Model tidak dimuat.")
        return jsonify({'error': 'Model tidak tersedia atau gagal dimuat. Silakan periksa log server.'}), 503

    if 'image' not in request.files:
        app.logger.warning("Permintaan ke /api/predict tidak menyertakan file 'image'.")
        return jsonify({'error': "Tidak ada bagian file 'image' dalam request files."}), 400

    file = request.files['image']
    if file.filename == '':
        app.logger.warning("Permintaan ke /api/predict: Nama file kosong.")
        return jsonify({'error': 'Tidak ada file gambar yang dipilih.'}), 400

    if file:
        app.logger.info(f"Menerima file: {file.filename}, Content-Type: {file.content_type}")
        try:
            image_bytes = file.read()
            app.logger.info(f"Ukuran file gambar yang diterima: {len(image_bytes)} bytes")

            # Menggunakan fungsi preprocess_image dari modul image_processor
            processed_image_array = image_processor.preprocess_image(image_bytes)
            app.logger.info(f"Pra-pemrosesan gambar berhasil. Shape array: {processed_image_array.shape}")
            
            # Akses variabel model melalui modul 'model_loader'
            predictions_raw = model_loader.model.predict(processed_image_array)
            app.logger.info("Prediksi model berhasil dilakukan.")

            probabilities = predictions_raw[0] # Asumsi output untuk satu gambar (batch size 1)
            predicted_index = np.argmax(probabilities)
            confidence_score = float(probabilities[predicted_index])

            disease_name = f"Kelas Indeks {predicted_index}" # Default jika label tidak ditemukan
            # Akses variabel class_labels melalui modul 'model_loader'
            if model_loader.class_labels and str(predicted_index) in model_loader.class_labels:
                disease_name = model_loader.class_labels[str(predicted_index)]
            else:
                app.logger.warning(f"Label untuk indeks {predicted_index} tidak ditemukan dalam class_labels. Pastikan class_labels.json benar.")

            response_data = {
                'filename': file.filename,
                'predicted_disease': disease_name,
                'confidence': f"{confidence_score:.4f}" # Format ke 4 angka desimal
                # 'all_probabilities': [f"{p:.4f}" for p in probabilities.tolist()] # Opsional, jika frontend butuh
            }
            app.logger.info(f"Hasil prediksi dikirim: {response_data}")
            return jsonify(response_data)

        except ValueError as ve: # Error spesifik dari preprocess_image
            app.logger.error(f"Error saat pra-pemrosesan gambar: {str(ve)}", exc_info=True)
            return jsonify({'error': f"Error memproses gambar: {str(ve)}"}), 400
        except Exception as e:
            # Log error yang lebih umum di server untuk debugging
            app.logger.error(f"Error tidak terduga saat prediksi di endpoint /api/predict: {str(e)}", exc_info=True)
            return jsonify({'error': 'Terjadi kesalahan internal di server saat melakukan prediksi.'}), 500
    
    app.logger.warning("Permintaan ke /api/predict: File tidak valid atau kondisi tidak tertangani lainnya.")
    return jsonify({'error': 'File tidak valid atau error tidak diketahui saat memproses permintaan.'}), 400

if __name__ == '__main__':
    app.logger.info("Memulai Flask development server...")
    # host='0.0.0.0' membuat server bisa diakses dari perangkat lain di jaringan yang sama
    # debug=True HANYA untuk pengembangan. Matikan (set ke False) di produksi.
    app.run(debug=True, host='0.0.0.0', port=5000)