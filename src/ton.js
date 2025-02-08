const axios = require("axios");
const { ton } = require("./config");

// ✅ Función para limpiar dirección (remueve "0:", minúsculas, sin espacios)
function cleanTONAddress(address) {
    if (!address) return "";
    return address.replace(/^0:/, "").trim().toLowerCase();
}

// ✅ Verificar transacción en TON API
async function verifyTONTransaction(txid, expectedAmountNano, telegramId) {
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

        // ✅ Convertimos la dirección esperada a formato TON correcto
        let expectedAddressTON = `0:${cleanTONAddress(ton.publicAddress)}`.trim().toLowerCase();
        console.log("🔹 Dirección esperada (TON):", expectedAddressTON);

        // 🔍 Buscar la transacción correcta
        const validTransaction = transactions.find(tx => {
            const txHash = tx.hash;
            const txAmountNano = parseInt(tx.in_msg?.value || tx.value || 0, 10);

            // 🔹 Normalizar dirección destino
            let txDestinationRaw = tx.in_msg?.destination?.account_address || tx.account?.address || "";
            let txDestination = `0:${cleanTONAddress(txDestinationRaw)}`.trim().toLowerCase();

            // ✅ NORMALIZAMOS TODO PARA COMPARACIÓN SEGURA
            const txAmountStr = String(txAmountNano).trim();
            const expectedAmountStr = String(expectedAmountNano).trim();
            const txDestinationStr = String(txDestination).trim();
            const expectedAddressStr = String(expectedAddressTON).trim();

            console.log("🔍 Comparando:", {
                txHash,
                txAmountNano,
                txAmountStr,         // 🔹 Convertido a string y sin espacios
                txDestinationRaw,    // 🔹 Dirección antes de limpiar
                txDestination,       // 🔹 Dirección después de limpiar
                txDestinationStr,    // 🔹 Convertido a string
                expectedAmountNano,  // 🔹 Monto esperado en NanoTON
                expectedAmountStr,   // 🔹 Convertido a string
                expectedAddressTON,  // 🔹 Dirección esperada en formato TON con "0:"
                expectedAddressStr   // 🔹 Convertido a string
            });

            return (
                txHash.toLowerCase().trim() === txid.toLowerCase().trim() && // ✅ TXID debe coincidir
                txAmountStr === expectedAmountStr &&                          // ✅ Monto en nanoTON debe coincidir
                txDestinationStr === expectedAddressStr                      // ✅ Dirección debe coincidir con mismo formato
            );
        });

        if (validTransaction) {
            console.log("✅ TRANSACCIÓN VÁLIDA ENCONTRADA:", validTransaction);
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
