async function verifyTONTransaction(txid, expectedAmount, telegramId) {
    const apiUrl = `https://tonapi.io/v1/blockchain/account/transactions?account=${ton.publicAddress}&limit=10`;

    try {
        const response = await axios.get(apiUrl);
        const transactions = response.data.transactions;

        console.log("📌 Verificando transacción...");
        console.log("🔹 Wallet pública:", ton.publicAddress);
        console.log("🔹 Transacciones recientes:", transactions);

        // Buscar la transacción por TXID
        const validTransaction = transactions.find(tx =>
            tx.utime && 
            tx.transaction_id.hash === txid &&
            parseFloat(tx.amount).toFixed(2) === (expectedAmount / 1e9).toFixed(2) && 
            tx.account.address === ton.publicAddress // Verifica que la wallet destino es la correcta
        );

        console.log("🔍 Transacción encontrada:", validTransaction || "No encontrada");
        return validTransaction !== undefined;
    } catch (error) {
        console.error("❌ Error verificando transacción TON:", error.message);
        return false;
    }
}
