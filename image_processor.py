# backend_flask/image_processor.py
from PIL import Image
import numpy as np
import io
import tensorflow as tf  # Impor TensorFlow
import logging

logger = logging.getLogger(__name__)

# Ukuran target sudah benar sesuai dengan pelatihan Anda di Colab
TARGET_IMAGE_WIDTH = 256
TARGET_IMAGE_HEIGHT = 256

def preprocess_image(image_bytes):
    """
    Melakukan pra-pemrosesan gambar.
    1. Baca byte gambar menjadi objek Image Pillow.
    2. Konversi ke mode RGB.
    3. Ubah ukuran gambar ke (256, 256).
    4. Konversi gambar menjadi NumPy array.
    5. Tambah dimensi batch.
    6. Gunakan pra-pemrosesan spesifik dari EfficientNet.
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        logger.info(f"Gambar asli berhasil dibuka: mode={image.mode}, size={image.size}")

        if image.mode != "RGB":
            image = image.convert("RGB")
            logger.info("Gambar dikonversi ke mode RGB.")

        image = image.resize((TARGET_IMAGE_WIDTH, TARGET_IMAGE_HEIGHT))
        logger.info(f"Gambar diubah ukurannya ke: ({TARGET_IMAGE_WIDTH}, {TARGET_IMAGE_HEIGHT})")

        image_array = np.array(image)
        
        # Tambahkan dimensi batch SEBELUM memanggil preprocess_input
        # karena fungsi ini mengharapkan batch gambar sebagai input
        image_array_expanded = np.expand_dims(image_array, axis=0)
        logger.info(f"Dimensi batch ditambahkan, shape sementara: {image_array_expanded.shape}")

        # --- PERUBAHAN KRUSIAL ADA DI SINI ---
        # Gunakan pra-pemrosesan spesifik dari EfficientNet, BUKAN pembagian dengan 255.0
        processed_image_array = tf.keras.applications.efficientnet.preprocess_input(image_array_expanded)
        
        logger.info("Pra-pemrosesan spesifik EfficientNet diterapkan.")
        logger.info(f"Shape array akhir untuk input model: {processed_image_array.shape}")

        return processed_image_array
        
    except Exception as e:
        logger.error(f"Error signifikan saat pra-pemrosesan gambar: {str(e)}", exc_info=True)
        raise ValueError(f"Gagal memproses gambar input: {str(e)}")