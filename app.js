import { Connection, PublicKey, SystemProgram, Transaction, clusterApiUrl } from "https://esm.sh/@solana/web3.js";

// --- Configuration ---
const network = "mainnet-beta";
const recipient = new PublicKey("7Wnbb3dZujM6X5Beh1Kp44hteJd6praUVbAonmryNwbq"); // your wallet
const connection = new Connection(clusterApiUrl(network), "confirmed");

// DOM elements
const amountEl = document.getElementById("amount");
const memoEl = document.getElementById("memo");
const createBtn = document.getElementById("createBtn");
const qrDiv = document.getElementById("qr");
const qrCard = document.getElementById("qrCard");
const statusEl = document.getElementById("status");

// --- Create Payment QR ---
createBtn.onclick = async () => {
    const amount = parseFloat(amountEl.value);
    const memo = memoEl.value.trim();

    if (!amount || amount <= 0) return alert("Enter a valid amount");

    // Create transaction
    const tx = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: new PublicKey("11111111111111111111111111111111"), // placeholder, will be signed in Phantom
            toPubkey: recipient,
            lamports: Math.round(amount * 1_000_000_000),
        })
    );

    // Optional memo
    if (memo) {
        const memoInstruction = SystemProgram.memo({ programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"), data: memo });
        tx.add(memoInstruction);
    }

    // Serialize transaction without signing
    tx.feePayer = recipient; // placeholder, Phantom will set actual payer
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;

    const serializedTx = tx.serialize({ requireAllSignatures: false });
    const base64Tx = serializedTx.toString("base64");

    // Show QR
    qrCard.style.display = "block";
    qrDiv.innerHTML = `<img src="https://chart.googleapis.com/chart?cht=qr&chs=250x250&chl=${encodeURIComponent(base64Tx)}">
                       <div class="muted">Scan with Phantom watch wallet to pay</div>`;
    statusEl.textContent = "Scan QR with Phantom watch wallet to approve the transaction";
};