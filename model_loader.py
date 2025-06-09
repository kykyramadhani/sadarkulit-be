# D:\ML Dicoding\Capstone\proyek_flask_kulit\model_loader.py
import tensorflow as tf
import os
import json

# --- GANTI DENGAN NAMA FILE MODEL H5 ANDA ---
MODEL_FILENAME = "my_model.h5"  # Misalnya: "model_kulit_51mb.h5"
# -------------------------------------------
LABELS_FILENAME = "class_labels.json"

# Path ke direktori models_ml relatif dari file ini
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__)) # Ini akan menjadi D:\ML Dicoding\Capstone\proyek_flask_kulit
MODELS_ML_DIR = os.path.join(CURRENT_DIR, "model")

MODEL_PATH = os.path.join(MODELS_ML_DIR, MODEL_FILENAME)
LABEL_PATH = os.path.join(MODELS_ML_DIR, LABELS_FILENAME)

model = None
class_labels = None

def load_model_and_labels():
    global model, class_labels
    print("Mencoba memuat model dan label...")
    try:
        if os.path.exists(MODEL_PATH):
            model = tf.keras.models.load_model(MODEL_PATH)
            print(f"Model berhasil dimuat dari: {MODEL_PATH}")
        else:
            msg = f"ERROR KRITIS: File model '{MODEL_FILENAME}' tidak ditemukan di '{MODEL_PATH}'. Aplikasi mungkin tidak berfungsi."
            print(msg)
            raise FileNotFoundError(msg)

        if os.path.exists(LABEL_PATH):
            with open(LABEL_PATH, 'r', encoding='utf-8') as f:
                class_labels = json.load(f)
            print(f"Label kelas berhasil dimuat dari: {LABEL_PATH}")
        else:
            print(f"PERINGATAN: File label kelas '{LABELS_FILENAME}' tidak ditemukan di '{LABEL_PATH}'. Hasil prediksi mungkin hanya indeks.")
            class_labels = {} 

    except Exception as e:
        print(f"Terjadi kesalahan fatal saat memuat model atau label: {str(e)}")
        # Pertimbangkan untuk menghentikan aplikasi jika ada error fatal di sini
        raise e

