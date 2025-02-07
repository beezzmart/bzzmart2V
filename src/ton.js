const axios = require("axios");
const { ton } = require("./config");

async function verifyTONTransaction(txid, expectedAmount) {
    const apiUrl = `https://tonapi.io/v2/blockchain/transactions/${txid}`;

    try {
        console.log("\n📌 Verificando transacción en TONAPI...");
        console.log("🔹 TXID ingresado:", txid);
        console.log("🔹 URL de consulta:", apiUrl);

        // Hacemos la petición HTTP a TONAPI
        const response = await axios.get(apiUrl);
        const transaction = response.data;

        console.log("\n🔍 Respuesta de la API:");
        console.log(transaction);

        if (!transaction || !transaction.utime) {
            console.log("❌ No se encontró información válida en TONAPI.");
            return false;
        }

        // Extraer datos de la transacción
        const txDestination = transaction.out_msgs[0].destination.address;
        const txAmount = parseFloat(transaction.out_msgs[0].value) / 1e9; // Convertir nanotons a TON

        console.log("🔍 Comparando:", {
            txHash: txid,
            txAmount,
            txDestination,
            expectedAmount,
            expectedAddress: ton.publicAddress
        });

        // Verificar si la transacción es válida
        if (txAmount === expectedAmount && txDestination === ton.publicAddress) {
            console.log("✅ Transacción válida encontrada.");
            return true;
        } else {
            console.log("❌ La transacción no coincide con los datos esperados.");
            return false;
        }
    } catch (error) {
        console.error("❌ Error verificando transacción en TONAPI:", error.message);
        return false;
    }
}

module.exports = { verifyTONTransaction };
