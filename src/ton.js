const axios = require("axios");
const { ton } = require("./config"); // Asegúrate de tener tu configuración de TON (API Key, baseURL, etc.)

// ✅ Función para limpiar direcciones (elimina "0:" y las pone en minúsculas)
function cleanTONAddress(address) {
    if (!address) return "";
    return address.replace(/^0:/, "").toLowerCase();
}

// Función para obtener los detalles de la transacción de la API de TON
async function getTONTransaction(txid) {
    try {
        const response = await axios.get(`https://tonapi.io/api/v1/transactions/${txid}`); // Ajusta esta URL según la documentación de la API TON
        return response.data; // Devuelve los datos de la transacción
    } catch (error) {
        console.error("❌ Error al obtener la transacción de la API de TON:", error.response?.data || error.message);
        throw new Error("Error al obtener la transacción");
    }
}

// Función para verificar transacción en TON API
async function verifyTONTransaction(txid, totalCost, senderWallet, userId) {
    try {
        // Llamada a la API de TON para obtener la transacción
        const transaction = await getTONTransaction(txid);  // Asegúrate de implementar la llamada API correctamente

        // Verificar que la transacción existe
        if (!transaction || transaction.success === false) {
            console.error("❌ Transacción no encontrada o fallida.");
            return false;
        }

        // Verificar que el monto de la transacción sea igual al costo
        // Usamos "value" en vez de "total_fees" ya que el "total_fees" es el costo de las tarifas, no del monto total
        if (transaction.value !== totalCost) {
            console.error("❌ El monto de la transacción no coincide con el costo de la compra.");
            return false;
        }

        // Verificar que la wallet de destino sea la wallet del usuario
        if (transaction.account.address !== senderWallet) {
            console.error("❌ La dirección de la wallet de destino no es la correcta.");
            return false;
        }

        // Verificar que la wallet desde donde se envió es la correcta
        if (transaction.in_msg.destination.address !== senderWallet) {
            console.error("❌ La wallet desde donde se envió no coincide.");
            return false;
        }

        // Verificar que el usuario que realizó la compra es el mismo que el que la está haciendo
        const transactionUser = await query("SELECT user_id FROM transactions WHERE txid = ?", [txid]);
        if (transactionUser.length === 0 || transactionUser[0].user_id !== userId) {
            console.error("❌ El usuario no coincide con el que realizó la transacción.");
            return false;
        }

        console.log("✅ Transacción válida.");
        return true;
    } catch (error) {
        console.error("❌ Error verificando transacción:", error.message || error.response?.data);
        return false;
    }
}

module.exports = { verifyTONTransaction };
