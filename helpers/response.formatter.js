module.exports = {
    //response : key object yang akan dipanggil pas export/require di file lain
    response: (status, message, data) => {
        if (data) {
            // kalau response nya ada ada data
            return {
                status: status,
                message: message,
                data: data
            }
        } else {
            // kalau response gaada data (misal error) hasil di postmannya jangan kirim key data di jsonnya
            return {
                status: status,
                message: message
            }
        }
    }
}
  