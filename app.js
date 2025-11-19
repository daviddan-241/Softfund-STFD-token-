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
const copyBtn = document.getElementById("copyBtn");

let phantomLink = "";

// --- Detect Mobile Device ---
function isMobile() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// --- Generate Payment Link & QR ---
generateBtn.onclick = () => {
    const amount = parseFloat(amountEl.value);
    const memo = memoEl.value.trim();

    if (!amount || amount <= 0) return alert("Enter a valid amount");

    // Phantom Watch deep link
    phantomLink = `https://phantom.app/ul/v1/transfer?destination=${recipient}&amount=${amount}&message=${encodeURIComponent(memo)}`;

    qrCard.style.display = "block";

    // Show QR code
    qrDiv.innerHTML = `<img src="https://chart.googleapis.com/chart?cht=qr&chs=250x250&chl=${encodeURIComponent(phantomLink)}">
                       <div class="muted">Scan with Phantom Watch Wallet to pay</div>`;

    statusEl.textContent = "Scan QR or use the link to pay.";

    // Copy button functionality
    copyBtn.onclick = () => {
        navigator.clipboard.writeText(phantomLink)
            .then(() => alert("Payment link copied!"))
            .catch(err => alert("Failed to copy link: " + err));
    };

    // Automatically open link if on mobile
    if (isMobile()) {
        statusEl.textContent = "Opening Phantom Wallet...";
        window.location.href = phantomLink;
    }
};