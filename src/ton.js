const axios = require("axios");
const { ton } = require("./config");

// ✅ Función para limpiar direcciones (elimina "0:" y las pone en minúsculas)
function cleanTONAddress(address) {
    if (!address) return "";
    return address.replace(/^0:/, "").toLowerCase();
}

// ✅ Función principal: Verifica una transacción TON
async function verifyTONTransaction(txid, expectedAmount, expectedSender) {
    try {
        const apiUrl = `https://tonapi.io/v2/blockchain/transactions/${txid}`;
        const response = await axios.get(apiUrl);
        const txData = response.data;

        if (!txData) {
            console.log("❌ No se encontró información de la transacción.");
            return false;
        }

        console.log("📌 Verificando transacción en TON API...");
        console.log("🔹 TXID ingresado:", txid);
        console.log("🔹 Datos obtenidos:", txData);

        // ✅ Extraer los datos importantes
        const txHash = txData.hash;
        const txAmountNano = parseInt(txData.amount || 0, 10); // ✅ Monto en nanoTON
        const txSender = cleanTONAddress(txData.in_msg?.source?.account_address || "");
        const txReceiver = cleanTONAddress(txData.in_msg?.destination?.account_address || "");

        // ✅ Wallet de la app (donde deben recibir los fondos)
        const expectedReceiver = cleanTONAddress(ton.publicAddress);

        console.log("🔍 Comparando datos...");
        console.log({
            txHash,
            txAmountNano,
            txSender,
            txReceiver,
            expectedAmount,
            expectedSender,
            expectedReceiver
        });

        // 🔹 Validaciones
        if (txReceiver !== expectedReceiver) {
            console.log("❌ La transacción no fue enviada a la wallet de la app.");
            return false;
        }

        if (txAmountNano !== expectedAmount) {
            console.log("❌ El monto de la transacción no coincide.");
            return false;
        }

        if (expectedSender && txSender !== expectedSender) {
            console.log("❌ El remitente no coincide con el usuario esperado.");
            return false;
        }

        console.log("✅ Transacción válida.");
        return true;
    } catch (error) {
        console.error("❌ Error verificando transacción:", error.response?.data || error.message);
        return false;
    }
}

module.exports = { verifyTONTransaction };
