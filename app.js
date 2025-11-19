import { Connection, PublicKey, SystemProgram, Transaction, clusterApiUrl } from "https://esm.sh/@solana/web3.js";

// QR generator
function generateQR(text) {
  return `https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=${encodeURIComponent(text)}`;
}

const network = "mainnet-beta";
const connection = new Connection(clusterApiUrl(network), "confirmed");

let provider = null;
let walletPubKey = null;
let invoice = null;

// DOM elements
const connectBtn = document.getElementById("connectBtn");
const createBtn = document.getElementById("createBtn");
const payBtn = document.getElementById("payBtn");
const recipientEl = document.getElementById("recipient");
const amountEl = document.getElementById("amount");
const memoEl = document.getElementById("memo");
const invoiceCard = document.getElementById("invoiceCard");
const invoiceDetails = document.getElementById("invoiceDetails");
const qrDiv = document.getElementById("qr");
const statusEl = document.getElementById("status");

function phantomProvider() {
  return window.solana?.isPhantom ? window.solana : null;
}

// Connect Phantom Wallet
connectBtn.onclick = async () => {
  provider = phantomProvider();
  if (!provider) {
    alert("Phantom Wallet not found. Use Phantom browser or install extension.");
    return;
  }
  try {
    const resp = await provider.connect();
    walletPubKey = resp.publicKey;
    connectBtn.textContent = `Connected: ${walletPubKey.toString().slice(0,6)}...`;
    createBtn.disabled = false;
    statusEl.textContent = "Phantom connected. You can now create invoice.";
  } catch (e) {
    console.error(e);
    alert("Connection failed or cancelled");
  }
};

// Create Invoice
createBtn.onclick = () => {
  if (!walletPubKey) { alert("Connect Phantom first!"); return; }
  const recipient = recipientEl.value.trim();
  const amount = parseFloat(amountEl.value);
  if (!recipient || !amount || amount <= 0) { alert("Enter valid recipient and amount."); return; }

  invoice = {
    recipient,
    amount,
    memo: memoEl.value.trim(),
    id: "inv_" + Date.now()
  };

  invoiceCard.style.display = "block";
  invoiceDetails.innerHTML = `
    <p><strong>Invoice ID:</strong> ${invoice.id}</p>
    <p><strong>Recipient:</strong> ${invoice.recipient}</p>
    <p><strong>Amount:</strong> ${invoice.amount} SOL</p>
    <p><strong>Memo:</strong> ${invoice.memo || "(none)"}</p>
  `;

  qrDiv.innerHTML = `<img src="${generateQR(JSON.stringify(invoice))}">
                     <div class="muted">Scan with Phantom mobile browser</div>`;

  payBtn.disabled = false;
  statusEl.textContent = "Invoice ready. Click Pay to continue.";
};

// Pay with Phantom
payBtn.onclick = async () => {
  if (!invoice) { alert("Create invoice first."); return; }
  if (!provider || !walletPubKey) { alert("Connect Phantom first."); return; }

  try {
    const lamports = Math.round(invoice.amount * 1_000_000_000); // SOL -> lamports
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: walletPubKey,
        toPubkey: new PublicKey(invoice.recipient),
        lamports
      })
    );

    tx.feePayer = walletPubKey;
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;

    statusEl.textContent = "Waiting for Phantom to sign transaction...";
    const signedTx = await provider.signTransaction(tx);
    statusEl.textContent = "Sending transaction...";
    const signature = await connection.sendRawTransaction(signedTx.serialize());
    statusEl.textContent = `Transaction submitted: ${signature}. Confirming...`;
    await connection.confirmTransaction(signature, "confirmed");
    statusEl.textContent = `Payment successful! Tx: ${signature}`;
  } catch (err) {
    console.error(err);
    statusEl.textContent = `Payment failed: ${err.message || err}`;
    alert("Transaction failed or cancelled. Check Phantom wallet.");
  }
};