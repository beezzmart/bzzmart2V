const axios = require("axios");
const { ton } = require("./config");

// ✅ Función para limpiar direcciones (elimina "0:" y las pone en minúsculas)
function cleanTONAddress(address) {
    if (!address) return "";
    return address.replace(/^0:/, "").toLowerCase();
}
// Función para verificar transacción en TON API
async function verifyTONTransaction(txid, totalCost, senderWallet, userId) {
  try {
    // Llamada a la API de TON para obtener la transacción
    const transaction = await getTONTransaction(txid);  // Asegúrate de implementar la llamada API correctamente

    // Verificar que la transacción existe
    if (!transaction || transaction.success === false) {
      console.error("❌ Transacción no encontrada o fallida.");
      return false;
    }

    // Verificar que el monto de la transacción sea igual al costo
    if (transaction.total_fees !== totalCost) {
      console.error("❌ El monto de la transacción no coincide con la compra.");
      return false;
    }

    // Verificar que la wallet de destino sea la wallet del usuario
    if (transaction.account.address !== senderWallet) {
      console.error("❌ La dirección de la wallet de destino no es la correcta.");
      return false;
    }

    // Verificar que la wallet desde donde se envió es la correcta
    if (transaction.in_msg.destination.address !== senderWallet) {
      console.error("❌ La wallet desde donde se envió no coincide.");
      return false;
    }

    // Verificar que el usuario que realizó la compra es el mismo que el que la está haciendo
    const transactionUser = await query("SELECT user_id FROM transactions WHERE txid = ?", [txid]);
    if (transactionUser.length === 0 || transactionUser[0].user_id !== userId) {
      console.error("❌ El usuario no coincide con el que realizó la transacción.");
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ Error en la verificación de la transacción:", error);
    return false;
  }
}


        console.log("✅ Transacción válida.");
        return true;
    } catch (error) {
        console.error("❌ Error verificando transacción:", error.response?.data || error.message);
        return false;
    }
}

module.exports = { verifyTONTransaction };
