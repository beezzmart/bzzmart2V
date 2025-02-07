const axios = require("axios");
const { ton } = require("./config");

// ✅ Función para limpiar la dirección y compararla
function normalizeAddress(rawAddress) {
    return rawAddress.replace(/^0:/, "").toLowerCase(); // Quita el "0:" y pasa a minúsculas
}

// ✅ Verificar transacción en TON API sin usar TonWeb
async function verifyTONTransaction(txid, expectedAmount, telegramId) {
    const apiUrl = `https://tonapi.io/v2/blockchain/accounts/${ton.publicAddress}/transactions?limit=50`;

    try {
        const response = await axios.get(apiUrl);
        const transactions = response.data.transactions;

        if (!transactions || transactions.length === 0) {
            console.log("❌ No se encontraron transacciones en TON API.");
            return false;
        }

        console.log("📌 Verificando transacción...");
        console.log("🔹 TXID ingresado:", txid);
        console.log("🔹 Últimas transacciones recibidas:", transactions.map(tx => tx.hash));

        // 🔍 Buscar la transacción correcta
        const validTransaction = transactions.find(tx => {
            const txHash = tx.hash;
            const txAmount = parseInt(tx.in_msg?.value || tx.value || 0, 10); // Monto en nanoTON (sin dividir entre 1e9)
            const expectedNanoTON = expectedAmount * 1e9; // Convertimos el esperado a nanoTON

            // Extraer dirección destino
            let txDestination = tx.in_msg?.destination?.account_address || tx.account?.address || "";
            txDestination = normalizeAddress(txDestination);
            const expectedAddress = normalizeAddress(ton.publicAddress);

            console.log("🔍 Comparando:", {
                txHash,
                txAmount,
                txDestination,
                expectedNanoTON,
                expectedAddress
            });

            return (
                txHash === txid && // Comparar TXID
                txAmount === expectedNanoTON && // Comparar monto en nanoTON
                txDestination === expectedAddress // Comparar dirección destino en formato RAW
            );
        });

        if (validTransaction) {
            console.log("✅ Transacción válida encontrada:", validTransaction);
            return true;
        } else {
            console.log("❌ No se encontró una transacción válida con este TXID.");
            return false;
        }
    } catch (error) {
        console.error("❌ Error verificando transacción TON API:", error.response?.data || error.message);
        return false;
    }
}

module.exports = { verifyTONTransaction };
