const recipient = "7Wnbb3dZujM6X5Beh1Kp44hteJd6praUVbAonmryNwbq";
document.getElementById("recipientAddress").textContent = recipient;

const amountEl = document.getElementById("amount");
const memoEl = document.getElementById("memo");
const generateBtn = document.getElementById("generateBtn");
const qrDiv = document.getElementById("qr");
const qrCard = document.getElementById("qrCard");
const statusEl = document.getElementById("status");
const copyBtn = document.getElementById("copyBtn");
const paymentTableBody = document.querySelector("#paymentHistory tbody");

let phantomLink = "";
let payments = [];

// Solana connection
const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl("mainnet-beta"), "confirmed");

// --- Detect Mobile ---
function isMobile() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// --- Add payment to history table ---
function addPaymentToTable(amount, memo, status) {
    const row = document.createElement("tr");
    const timestamp = new Date().toLocaleString();
    row.innerHTML = `
        <td>${amount}</td>
        <td>${memo || ""}</td>
        <td>${timestamp}</td>
        <td>${status}</td>
    `;
    paymentTableBody.prepend(row);
}

// --- Track payment ---
async function trackPayment(amount, memo) {
    const pubkey = new solanaWeb3.PublicKey(recipient);

    const listener = connection.onLogs(pubkey, async (logInfo) => {
        const txSig = logInfo.signature;
        try {
            const tx = await connection.getTransaction(txSig, { commitment: "confirmed" });
            if (tx && tx.transaction) {
                let paidAmount = 0;
                tx.transaction.message.instructions.forEach(ix => {
                    if (ix.programId.equals(solanaWeb3.SystemProgram.programId)) {
                        paidAmount += solanaWeb3.u64.fromBuffer(ix.data) / 1_000_000_000;
                    }
                });

                if (paidAmount >= amount) {
                    statusEl.textContent = "✅ Payment received!";
                    addPaymentToTable(amount, memo, "Paid ✅");
                    connection.removeOnLogsListener(listener);
                }
            }
        } catch (err) {
            console.log("Error checking transaction:", err);
        }
    });
}

// --- Generate payment ---
generateBtn.onclick = () => {
    const amount = parseFloat(amountEl.value);
    const memo = memoEl.value.trim();
    if (!amount || amount <= 0) return alert("Enter a valid amount");

    phantomLink = `phantom://x-callback-url/transfer?recipient=${recipient}&amount=${amount}&token=SOL&message=${encodeURIComponent(memo)}`;

    qrCard.style.display = "block";
    qrDiv.innerHTML = `<img src="https://chart.googleapis.com/chart?cht=qr&chs=250x250&chl=${encodeURIComponent(phantomLink)}">
                       <div class="muted">Scan with Phantom Watch Wallet to pay</div>`;

    statusEl.textContent = "Scan QR or use the link to pay.";

    copyBtn.onclick = () => {
        navigator.clipboard.writeText(phantomLink).then(() => alert("Payment link copied!"))
        .catch(err => alert("Failed to copy link: " + err));
    };

    if (isMobile()) {
        statusEl.textContent = "Opening Phantom Wallet...";
        window.location.href = phantomLink;
    }

    // Track payment and add to table
    addPaymentToTable(amount, memo, "Pending ⏳");
    trackPayment(amount, memo);
};