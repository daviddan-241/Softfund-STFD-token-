// --- Configuration ---
const recipient = "7Wnbb3dZujM6X5Beh1Kp44hteJd6praUVbAonmryNwbq"; // Your SOL wallet
document.getElementById("recipientAddress").textContent = recipient;

// DOM elements
const amountEl = document.getElementById("amount");
const memoEl = document.getElementById("memo");
const generateBtn = document.getElementById("generateBtn");
const qrDiv = document.getElementById("qr");
const qrCard = document.getElementById("qrCard");
const statusEl = document.getElementById("status");

// --- Generate Phantom Watch Link & QR ---
generateBtn.onclick = () => {
    const amount = parseFloat(amountEl.value);
    const memo = memoEl.value.trim();

    if (!amount || amount <= 0) return alert("Enter a valid amount");

    // Phantom Watch deep link
    const link = `https://phantom.app/ul/v1/transfer?destination=${recipient}&amount=${amount}&message=${encodeURIComponent(memo)}`;

    // Show QR
    qrCard.style.display = "block";
    qrDiv.innerHTML = `<img src="https://chart.googleapis.com/chart?cht=qr&chs=250x250&chl=${encodeURIComponent(link)}">
                       <div class="muted">Scan with Phantom Watch Wallet to pay</div>`;

    statusEl.textContent = "Scan the QR code with Phantom Watch Wallet to approve the payment.";
};