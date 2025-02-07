const axios = require("axios");
const { ton } = require("./config");

async function verifyTONTransaction(txid, expectedAmount, telegramId) {
    try {
        console.log(`📌 Verificando transacción en TonViewer...`);
        console.log(`🔹 TXID ingresado: ${txid}`);

        // Consulta a TonViewer
        const apiUrl = `https://tonviewer.com/transaction/${txid}`;
        const response = await axios.get(apiUrl);

        if (!response.data) {
            console.log("❌ No se encontró información en TonViewer.");
            return false;
        }

        const transaction = response.data;
        console.log("🔍 Datos de la transacción recibida:", transaction);

        // Extraer el monto y la wallet destino desde in_msg
        const inMsg = transaction.in_msg || {};
        const txDestination = inMsg.destination?.address || "";
        const txAmount = parseFloat(inMsg.value || 0);

        console.log("🔍 Comparando:", {
            txHash: txid,
            txAmount,
            txDestination,
            expectedAmount,
            expectedAddress: ton.publicAddress
        });

        // Comparar monto y dirección destino
        if (
            txDestination === ton.publicAddress &&
            txAmount === expectedAmount * 1e9 // Convertimos TON a nanotons
        ) {
            console.log("✅ ¡Transacción válida!");
            return true;
        } else {
            console.log("❌ La transacción no coincide con los datos esperados.");
            return false;
        }
    } catch (error) {
        console.error("❌ Error verificando transacción en TonViewer:", error.message);
        return false;
    }
}

module.exports = { verifyTONTransaction };
