const axios = require("axios");
const { ton } = require("./config");
const { Buffer } = require("buffer"); // Importamos Buffer para la conversión correcta

// ✅ Función para limpiar direcciones TON (elimina el "0:" si lo tiene)
function cleanTONAddress(address) {
    if (!address) return "";
    return address.replace(/^0:/, "").trim();
}

// ✅ Función para convertir una dirección de wallet HEX a Base64URL (TON usa este formato)
function convertHexToBase64Url(hexAddress) {
    if (!hexAddress) return "";
    const buffer = Buffer.from(hexAddress, "hex"); // Convertimos de hex a buffer
    return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); // Formato base64url
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
async function verifyTONTransaction(txid, totalCost) {
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

        // ✅ Obtener y limpiar la wallet de destino desde la API
        const rawReceiverWallet = cleanTONAddress(transaction.out_msgs[0].destination?.address);

        // ✅ Asegurar que `ton.publicAddress` está definido y convertirlo correctamente
        if (!ton.publicAddress) {
            console.error("❌ ton.publicAddress no está definido en config.js");
            return false;
        }
        const expectedReceiverWallet = cleanTONAddress(ton.publicAddress);

        // ✅ Mostrar en consola para depuración
        console.log("🔍 Wallet esperada (Servidor):", expectedReceiverWallet || "No definida");
        console.log("🔍 Wallet recibida (TON API):", rawReceiverWallet || "No definida");

        // ✅ Comparamos directamente con la wallet recibida de la API
        if (rawReceiverWallet !== expectedReceiverWallet) {
            console.error(`❌ Wallet de destino incorrecta. Esperado: ${expectedReceiverWallet}, Recibido: ${rawReceiverWallet}`);
            return false;
        }

        console.log("✅ Transacción válida.");
        return true;
    } catch (error) {
        console.error("❌ Error verificando la transacción:", error.message || error.response?.data);
        return false;
    }
}

module.exports = { verifyTONTransaction };
