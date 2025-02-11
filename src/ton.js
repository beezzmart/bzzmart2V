const axios = require("axios");
const { ton } = require("./config");

// ✅ Función para limpiar direcciones TON (Elimina "0:")
function cleanTONAddress(address) {
    if (!address) return "";
    return address.replace(/^0:/, "");  
}

// ✅ Función para convertir una dirección TON a formato binario para comparación exacta
function convertTONAddressToBuffer(address) {
    if (!address) return Buffer.alloc(0);
    return Buffer.from(cleanTONAddress(address), "hex"); // Convertir a Buffer hexadecimal
}

// ✅ Función para obtener los detalles de la transacción desde la API de TON
async function getTONTransaction(txid) {
    try {
        const response = await axios.get(`https://tonapi.io/v2/blockchain/transactions/${txid}`);
        return response.data;
    } catch (error) {
        console.error("❌ Error al obtener la transacción de la API de TON:", error.response?.data || error.message);
        return null; 
    }
}

// ✅ Función para verificar la transacción en la blockchain de TON
async function verifyTONTransaction(txid, totalCost, senderWallet, userId) {
    try {
        const transaction = await getTONTransaction(txid);
        if (!transaction || !transaction.success) {
            console.error("❌ Transacción no encontrada o fallida.");
            return false;
        }

        if (!transaction.out_msgs || transaction.out_msgs.length === 0) {
            console.error("❌ La transacción no tiene salidas (out_msgs).");
            return false;
        }

        // ✅ Obtener el monto de la transacción
        const txAmountNano = parseInt(transaction.out_msgs[0].value, 10);
        if (txAmountNano !== totalCost) {
            console.error(`❌ El monto de la transacción (${txAmountNano} nanoTON) no coincide con el costo esperado (${totalCost} nanoTON).`);
            return false;
        }

        // ✅ Obtener la wallet de destino (de la app) y formatearla
        const receiverWalletRaw = transaction.out_msgs[0].destination?.address;
        const expectedReceiverWalletRaw = ton.publicAddress; // Wallet de la app

        // Convertimos ambas direcciones a formato binario con Buffer
        const receiverWalletBuffer = convertTONAddressToBuffer(receiverWalletRaw);
        const expectedReceiverWalletBuffer = convertTONAddressToBuffer(expectedReceiverWalletRaw);

        // Comparar las wallets con Buffer
        if (!receiverWalletBuffer.equals(expectedReceiverWalletBuffer)) {
            console.error(`❌ Wallet de destino incorrecta. Esperado: ${expectedReceiverWalletRaw}, Recibido: ${receiverWalletRaw}`);
            return false;
        }

        // ✅ Verificar la wallet de origen (del usuario)
        const senderWalletRaw = transaction.in_msg?.source?.address;
        const senderWalletBuffer = convertTONAddressToBuffer(senderWallet);
        const senderWalletFromTxBuffer = convertTONAddressToBuffer(senderWalletRaw);

        // Comparar la wallet de origen con Buffer
        if (!senderWalletFromTxBuffer.equals(senderWalletBuffer)) {
            console.error(`❌ Wallet de origen incorrecta. Esperado: ${senderWallet}, Recibido: ${senderWalletRaw}`);
            return false;
        }

        console.log("✅ Transacción válida. Usuario confirmado:", userId);
        return true;
    } catch (error) {
        console.error("❌ Error verificando la transacción:", error.message || error.response?.data);
        return false;
    }
}

module.exports = { verifyTONTransaction };
