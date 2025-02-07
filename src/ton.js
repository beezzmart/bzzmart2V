const axios = require("axios");
const { ton } = require("./config");

async function verifyTONTransaction(txid, expectedAmount, telegramId) {
    const apiUrl = `https://tonscan.org/tx/${txid}`;

    try {
        console.log("\n📌 Verificando transacción en TONSCAN...");
        console.log("🔹 TXID ingresado:", txid);
        console.log("🔹 URL de consulta:", apiUrl);

        // 🛠️ Hacemos la petición HTTP a TONSCAN
        const response = await axios.get(apiUrl);
        const html = response.data;

        console.log("\n🔍 HTML recibido (primeros 500 caracteres):");
        console.log(html.substring(0, 500)); // Mostramos un fragmento del HTML para analizar

        // 🔎 Intentamos extraer la dirección de destino y el monto recibido
        const addressMatch = html.match(/To<\/div>\s*<div[^>]*>(EQ[^\s<]+)/);
        const amountMatch = html.match(/Value Received TON<\/div>\s*<div[^>]*>([\d.]+) TON/);

        if (!addressMatch || !amountMatch) {
            console.log("❌ No se encontró información válida en TONSCAN.");
            return false;
        }

        const txDestination = addressMatch[1];  // 🔹 Dirección de destino en formato `EQ...`
        const txAmount = parseFloat(amountMatch[1]); // 🔹 Monto recibido en TON

        console.log("🔍 Comparando:", {
            txAmount,
            txDestination,
            expectedAmount,
            expectedAddress: ton.publicAddress
        });

        // ✅ Verificar si la transacción es válida
        if (
            txAmount === expectedAmount &&
            txDestination === ton.publicAddress
        ) {
            console.log("✅ Transacción válida encontrada.");
            return true;
        } else {
            console.log("❌ La transacción no coincide con los datos esperados.");
            return false;
        }
    } catch (error) {
        console.error("❌ Error verificando transacción en TONSCAN:", error.message);
        return false;
    }
}

module.exports = { verifyTONTransaction };
