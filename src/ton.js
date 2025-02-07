const axios = require("axios");
const { ton } = require("./config");

// ✅ Función para limpiar dirección HEX y asegurar formato correcto
function cleanTONAddress(address) {
    if (!address) return "";
    return address.replace(/^0:/, "").trim().toLowerCase(); // 🔹 Elimina "0:" y espacios invisibles
}

// ✅ Función para convertir Base64 a dirección HEX con "0:" al inicio
function convertBase64ToTONAddress(base64Address) {
    try {
        const buffer = Buffer.from(base64Address, "base64");
        const hexAddress = buffer.toString("hex").toLowerCase();
        return `0:${hexAddress.slice(-64)}`.trim();
    } catch (error) {
        console.error("❌ Error convirtiendo dirección Base64 a TON:", error.message);
        return "";
    }
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

        // ✅ Convertimos la dirección esperada al formato correcto
        let expectedAddressTON = `0:${cleanTONAddress(convertBase64ToTONAddress(ton.publicAddress))}`.trim();
        console.log("🔹 Dirección esperada (TON):", expectedAddressTON);

        // 🔍 Buscar la transacción correcta
        const validTransaction = transactions.find(tx => {
            const txHash = tx.hash;
            const txAmountNano = parseInt(tx.in_msg?.value || tx.value || 0, 10);

            // 🔹 Normalizar dirección destino
            let txDestinationRaw = tx.in_msg?.destination?.account_address || tx.account?.address || "";
            let txDestination = `0:${cleanTONAddress(txDestinationRaw)}`.trim();

            // ✅ FORZAR TODO A STRING PARA EVITAR ERRORES DE COMPARACIÓN
            const txAmountStr = String(txAmountNano).trim();
            const expectedAmountStr = String(expectedAmountNano).trim();
            const txDestinationStr = String(txDestination).trim();
            const expectedAddressStr = String(expectedAddressTON).trim();

            console.log("🔍 Comparando:", {
                txHash,
                txAmountNano,
                txAmountStr,         // 🔹 Convertido a string
                txDestinationRaw,    // 🔹 Dirección antes de limpiar
                txDestination,       // 🔹 Dirección después de limpiar
                txDestinationStr,    // 🔹 Convertido a string
                expectedAmountNano,  // 🔹 Monto esperado en NanoTON
                expectedAmountStr,   // 🔹 Convertido a string
                expectedAddressTON,  // 🔹 Dirección esperada en formato TON con "0:"
                expectedAddressStr   // 🔹 Convertido a string
            });

            return (
                String(txHash).trim() === String(txid).trim() &&  // ✅ TXID debe coincidir
                txAmountStr === expectedAmountStr &&             // ✅ Monto en nanoTON (convertido a STRING) debe coincidir
                txDestinationStr === expectedAddressStr          // ✅ Dirección (convertida a STRING) debe coincidir
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
