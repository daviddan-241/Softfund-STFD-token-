import { Connection, PublicKey, SystemProgram, Transaction, clusterApiUrl } from "https://esm.sh/@solana/web3.js";
import { Token, TOKEN_PROGRAM_ID } from "https://cdn.jsdelivr.net/npm/@solana/spl-token@0.3.9/lib/index.iife.js";
import { WalletAdapter, WalletError } from "https://cdn.jsdelivr.net/npm/@solana/wallet-adapter-base@0.10.0/dist/index.umd.js";
import { PhantomWalletAdapter, SolflareWalletAdapter, SlopeWalletAdapter } from "https://cdn.jsdelivr.net/npm/@solana/wallet-adapter-wallets@0.10.0/dist/index.umd.js";

// --- Setup ---
const network = "mainnet-beta";
const connection = new Connection(clusterApiUrl(network), "confirmed");

// DOM elements
const walletSelect = document.getElementById("walletSelect");
const connectBtn = document.getElementById("connectBtn");
const walletStatus = document.getElementById("walletStatus");
const createBtn = document.getElementById("createBtn");
const recipientEl = document.getElementById("recipient");
const amountEl = document.getElementById("amount");
const tokenMintEl = document.getElementById("tokenMint");
const memoEl = document.getElementById("memo");
const invoiceCard = document.getElementById("invoiceCard");
const invoiceDetails = document.getElementById("invoiceDetails");
const qrDiv = document.getElementById("qr");
const payBtn = document.getElementById("payBtn");
const statusEl = document.getElementById("status");

// --- Wallet Adapter Setup ---
const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new SlopeWalletAdapter()
];

wallets.forEach((w, i) => {
    const option = document.createElement("option");
    option.value = i;
    option.text = w.name;
    walletSelect.appendChild(option);
});

let selectedWallet = null;
let walletPublicKey = null;
let invoice = null;

// --- Connect Wallet ---
connectBtn.onclick = async () => {
    const index = parseInt(walletSelect.value);
    selectedWallet = wallets[index];
    if (!selectedWallet) return alert("Select a wallet");

    try {
        await selectedWallet.connect();
        walletPublicKey = selectedWallet.publicKey;
        walletStatus.textContent = `Connected: ${walletPublicKey.toString().slice(0,6)}...`;
        createBtn.disabled = false;
        statusEl.textContent = "Wallet connected. Create invoice.";
    } catch (err) {
        console.error(err);
        alert("Wallet connection failed");
    }
};

// --- Create Invoice ---
createBtn.onclick = () => {
    if (!walletPublicKey) return alert("Connect wallet first");

    const recipient = recipientEl.value.trim();
    const amount = parseFloat(amountEl.value);
    const tokenMint = tokenMintEl.value.trim();
    const memo = memoEl.value.trim();

    if (!recipient || !amount || amount <= 0) return alert("Enter valid recipient and amount");

    invoice = { recipient, amount, tokenMint, memo, id:"inv_" + Date.now() };

    invoiceCard.style.display = "block";
    invoiceDetails.innerHTML = `
        <p><strong>Invoice ID:</strong> ${invoice.id}</p>
        <p><strong>Recipient:</strong> ${invoice.recipient}</p>
        <p><strong>Amount:</strong> ${invoice.amount} ${invoice.tokenMint ? "SPL" : "SOL"}</p>
        <p><strong>Memo:</strong> ${invoice.memo || "(none)"}</p>
    `;

    qrDiv.innerHTML = `<img src="https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=${encodeURIComponent(JSON.stringify(invoice))}">
                       <div class="muted">Scan with mobile/watch wallet</div>`;

    payBtn.disabled = false;
    statusEl.textContent = "Invoice ready. Click Pay to continue.";
};

// --- Pay Invoice ---
payBtn.onclick = async () => {
    if (!invoice) return alert("Create invoice first");
    if (!selectedWallet || !walletPublicKey) return alert("Connect wallet first");

    try {
        if (invoice.tokenMint === "") {
            // SOL Transfer
            const lamports = Math.round(invoice.amount * 1_000_000_000);
            const tx = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: walletPublicKey,
                    toPubkey: new PublicKey(invoice.recipient),
                    lamports
                })
            );
            tx.feePayer = walletPublicKey;
            const { blockhash } = await connection.getLatestBlockhash();
            tx.recentBlockhash = blockhash;

            statusEl.textContent = "Waiting for wallet to sign...";
            const signed = await selectedWallet.signTransaction(tx);
            const sig = await connection.sendRawTransaction(signed.serialize());
            statusEl.textContent = `Transaction submitted: ${sig}. Confirming...`;
            await connection.confirmTransaction(sig, "confirmed");
            statusEl.textContent = `Payment successful! Tx: ${sig}`;
        } else {
            // SPL Token Transfer
            const mintPubkey = new PublicKey(invoice.tokenMint);
            const token = new Token(connection, mintPubkey, TOKEN_PROGRAM_ID, selectedWallet);
            const fromTokenAccount = await token.getOrCreateAssociatedAccountInfo(walletPublicKey);
            const toTokenAccount = await token.getOrCreateAssociatedAccountInfo(new PublicKey(invoice.recipient));
            const tx = new Transaction().add(
                Token.createTransferInstruction(
                    TOKEN_PROGRAM_ID,
                    fromTokenAccount.address,
                    toTokenAccount.address,
                    walletPublicKey,
                    [],
                    invoice.amount * (10 ** (await token.getMintInfo()).decimals)
                )
            );
            tx.feePayer = walletPublicKey;
            const { blockhash } = await connection.getLatestBlockhash();
            tx.recentBlockhash = blockhash;

            statusEl.textContent = "Waiting for wallet to sign SPL token transfer...";
            const signed = await selectedWallet.signTransaction(tx);
            const sig = await connection.sendRawTransaction(signed.serialize());
            statusEl.textContent = `Transaction submitted: ${sig}. Confirming...`;
            await connection.confirmTransaction(sig, "confirmed");
            statusEl.textContent = `SPL Payment successful! Tx: ${sig}`;
        }
    } catch (err) {
        console.error(err);
        statusEl.textContent = `Payment failed: ${err.message || err}`;
        alert("Transaction failed or cancelled");
    }
};