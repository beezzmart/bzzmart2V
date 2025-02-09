const axios = require("axios");
const { ton } = require("./config");

// ✅ Función para limpiar la dirección (elimina el prefijo "0:" y la convierte a minúsculas)
function cleanTONAddress(address) {
    if (!address) return "";
    return address.replace(/^0:/, "").toLowerCase();  // 🔹 Eliminamos "0:" y pasamos a minúsculas
}

// ✅ Función para obtener los detalles de la transacción desde la API de TON
async function getTONTransaction(txid) {
    try {
        const response = await axios.get(`https://tonapi.io/v2/blockchain/transactions/${txid}`);
        return response.data;
    } catch (error) {
        console.error("❌ Error al obtener la transacción de la API de TON:", error.response?.data || error.message);
        return null; // 🔹 Devolvemos null si hay error
    }
}

// ✅ Función para verificar la transacción de TON
async function verifyTONTransaction(txid, totalCost, senderWallet) {
    try {
        // 🔹 Obtener los detalles de la transacción desde la API de TON
        const transaction = await getTONTransaction(txid);
        if (!transaction || !transaction.success) {
            console.error("❌ Transacción no encontrada o fallida.");
            return false;
        }

        // ✅ Verificar que la transacción tiene mensajes de salida
        if (!transaction.out_msgs || transaction.out_msgs.length === 0) {
            console.error("❌ La transacción no tiene salidas (out_msgs).");
            return false;
        }

        // ✅ Extraer el monto de la transacción en nanoTON
        const txAmountNano = parseInt(transaction.out_msgs[0].value, 10);
        if (txAmountNano !== totalCost) {
            console.error(`❌ El monto de la transacción (${txAmountNano} nanoTON) no coincide con el costo esperado (${totalCost} nanoTON).`);
            return false;
        }

        // ✅ Wallet de origen (emisor)
        const senderWalletClean = cleanTONAddress(senderWallet);  // 🔹 Limpiamos la wallet ingresada por el usuario
        const transactionSenderWallet = cleanTONAddress(transaction.in_msg?.source?.address);  // 🔹 Wallet del emisor según TON API

        // 🔹 Convertimos ambas a minúsculas y comparamos
        if (senderWalletClean.toLowerCase() !== transactionSenderWallet.toLowerCase()) {
            console.error(`❌ Wallet de origen incorrecta. Esperado: ${senderWalletClean}, Recibido: ${transactionSenderWallet}`);
            return false;
        }

        console.log("✅ Transacción válida.");
        return true;  // ✅ Todo validado correctamente
    } catch (error) {
        console.error("❌ Error verificando la transacción:", error.message || error.response?.data);
        return false;
    }
}

module.exports = { verifyTONTransaction };
