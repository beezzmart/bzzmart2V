const axios = require("axios");
const { ton } = require("./config"); // Asegúrate de tener tu configuración de TON (API Key, baseURL, etc.)
const Buffer = require('buffer').Buffer; // Importamos Buffer para la correcta comparación de la wallet

// ✅ Función para limpiar la dirección (elimina el prefijo "0:" de la dirección y pasa a minúsculas)
function cleanTONAddress(address) {
    if (!address) return "";
    return address.replace(/^0:/, "").toLowerCase();  // Elimina el "0:" y pasamos a minúsculas
}

// ✅ Función para comparar las wallets sin hacer transformaciones innecesarias
function compareWallets(expectedWallet, receivedWallet) {
    if (expectedWallet !== receivedWallet) {
        console.error(`❌ Wallet de origen incorrecta. Esperado: ${expectedWallet}, Recibido: ${receivedWallet}`);
        return false;
    }
    return true;  // Si las wallets coinciden
}

// ✅ Función para obtener los detalles de la transacción desde la API de TON
async function getTONTransaction(txid) {
    try {
        const response = await axios.get(`https://tonapi.io/v2/blockchain/transactions/${txid}`);
        return response.data; 
    } catch (error) {
        console.error("❌ Error al obtener la transacción de la API de TON:", error.response?.data || error.message);
        return null; // Si hay un error, devolvemos null
    }
}

// ✅ Función para verificar la transacción de TON
async function verifyTONTransaction(txid, totalCost, senderWallet) {
    try {
        // 🔹 Obtener los detalles de la transacción desde la API de TON
        const transaction = await getTONTransaction(txid);
        if (!transaction || !transaction.success) {
            console.error("❌ Transacción no encontrada o fallida.");
            return false;  // Si no se encuentra la transacción o es fallida, retornamos falso
        }

        // ✅ Verificar que la transacción tiene los mensajes de salida
        if (!transaction.out_msgs || transaction.out_msgs.length === 0) {
            console.error("❌ La transacción no tiene salidas (out_msgs).");
            return false;
        }

        // ✅ Extraer el monto de la transacción en nanoTON
        const txAmountNano = parseInt(transaction.out_msgs[0].value, 10);  // Aseguramos que sea un número entero
        if (txAmountNano !== totalCost) {
            console.error(`❌ El monto de la transacción (${txAmountNano} nanoTON) no coincide con el costo esperado (${totalCost} nanoTON).`);
            return false;  // Verificamos si el monto enviado es el correcto
        }

        // ✅ Limpiar y comparar la wallet de origen
        const senderWalletClean = cleanTONAddress(senderWallet);  // Limpiamos la wallet del emisor
        const transactionSenderWallet = cleanTONAddress(transaction.in_msg?.source?.address);  // Obtenemos la wallet del emisor de la transacción

        // ✅ Verificamos si la wallet del emisor coincide con la introducida por el usuario
        if (!compareWallets(senderWalletClean, transactionSenderWallet)) {
            return false;  // Si la wallet no coincide, retornamos falso
        }

        console.log("✅ Transacción válida.");
        return true;  // Si todo está correcto, retornamos verdadero
    } catch (error) {
        console.error("❌ Error verificando la transacción:", error.message || error.response?.data);
        return false;  // Si ocurre un error, retornamos falso
    }
}

module.exports = { verifyTONTransaction };
