const axios = require("axios");
const { ton } = require("./config");

// ✅ Función para limpiar direcciones (elimina "0:" si existe)
function cleanTONAddress(address) {
    if (!address) return "";
    return address.replace(/^0:/, "").trim();  // Quitamos el prefijo "0:" y espacios en blanco
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

// ✅ Función para verificar la transacción en TON
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

        // ✅ Obtener el monto de la transacción en nanoTON
        const txAmountNano = parseInt(transaction.out_msgs[0].value, 10);
        if (txAmountNano !== totalCost) {
            console.error(`❌ El monto de la transacción (${txAmountNano} nanoTON) no coincide con el costo esperado (${totalCost} nanoTON).`);
            return false;
        }

        // ✅ Wallet de destino esperada (servidor)
        const expectedReceiverWallet = cleanTONAddress(ton.publicAddress);  // Wallet de la app
        // ✅ Wallet de destino obtenida de la transacción
        const receiverWallet = cleanTONAddress(transaction.out_msgs[0].destination?.address);

        if (receiverWallet !== expectedReceiverWallet) {
            console.error(`❌ Wallet de destino incorrecta. Esperado: ${expectedReceiverWallet}, Recibido: ${receiverWallet}`);
            return false;
        }

        // ✅ Wallet de origen esperada (del usuario)
        const expectedSenderWallet = cleanTONAddress(senderWallet);
        // ✅ Wallet de origen obtenida de la transacción
        const senderWalletFromTx = cleanTONAddress(transaction.in_msg?.source?.address);

        if (senderWalletFromTx !== expectedSenderWallet) {
            console.error(`❌ Wallet de origen incorrecta. Esperado: ${expectedSenderWallet}, Recibido: ${senderWalletFromTx}`);
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
