const axios = require("axios");
const { ton } = require("./config"); // Asegúrate de tener tu configuración de TON (API Key, baseURL, etc.)
const Buffer = require('buffer').Buffer;

// ✅ Función para limpiar direcciones (elimina "0:" pero no cambia a minúsculas)
function cleanTONAddress(address) {
    if (!address) return "";
    return address.replace(/^0:/, "");  // Elimina "0:" al principio de la dirección
}

// ✅ Función para convertir la wallet a un formato consistente (Buffer y codificación correcta)
function convertWalletToStandardFormat(wallet) {
    const cleanWallet = cleanTONAddress(wallet);
    const buffer = Buffer.from(cleanWallet, 'hex'); // Convertimos la wallet en un Buffer
    return buffer.toString('hex');  // Convertimos el buffer nuevamente en string hexadecimal
}

// ✅ Función para obtener los detalles de la transacción de la API de TON
async function getTONTransaction(txid) {
    try {
        const response = await axios.get(`https://tonapi.io/v2/blockchain/transactions/${txid}`); 
        return response.data; 
    } catch (error) {
        console.error("❌ Error al obtener la transacción de la API de TON:", error.response?.data || error.message);
        return null; // ⚠️ Devuelve null en caso de error
    }
}

// ✅ Función para verificar transacción en TON API
async function verifyTONTransaction(txid, totalCost, senderWallet, userId) {
    try {
        // 🔹 Llamada a la API para obtener la transacción
        const transaction = await getTONTransaction(txid);

        // 🔴 Si la transacción no existe o es inválida, devolver false
        if (!transaction || !transaction.success) {
            console.error("❌ Transacción no encontrada o fallida.");
            return false;
        }

        // ✅ Obtener el monto correcto desde `out_msgs`
        if (!transaction.out_msgs || transaction.out_msgs.length === 0) {
            console.error("❌ La transacción no tiene salidas (out_msgs).");
            return false;
        }

        // ✅ Extraer el monto real enviado en nanoTON
        const txAmountNano = parseInt(transaction.out_msgs[0].value, 10); // ⚠️ Asegurar que es un número entero

        // ✅ Comparar el monto con el esperado
        if (txAmountNano !== totalCost) {
            console.error(`❌ El monto de la transacción (${txAmountNano} nanoTON) no coincide con el costo esperado (${totalCost} nanoTON).`);
            return false;
        }

        // ✅ Validar la wallet de destino correcta (sin cambiar a minúsculas)
        const receiverWallet = cleanTONAddress(transaction.out_msgs[0].destination?.address);
        const expectedReceiverWallet = convertWalletToStandardFormat(ton.publicAddress); // Convertimos a formato estándar

        if (receiverWallet !== expectedReceiverWallet) {
            console.error(`❌ Wallet de destino incorrecta. Esperado: ${expectedReceiverWallet}, Recibido: ${receiverWallet}`);
            return false;
        }

        // ✅ Validar la wallet de origen correcta
        const senderWalletClean = cleanTONAddress(senderWallet);
        const transactionSenderWallet = cleanTONAddress(transaction.in_msg?.source?.address);

        if (transactionSenderWallet !== senderWalletClean) {
            console.error(`❌ Wallet de origen incorrecta. Esperado: ${senderWalletClean}, Recibido: ${transactionSenderWallet}`);
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
