import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

//  Supabase Setup 
const supabase = createClient(
  "https://xcrmpdrsgnffbnidbmmr.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhjcm1wZHJzZ25mZmJuaWRibW1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDY3ODIsImV4cCI6MjA3NjcyMjc4Mn0.9tys44Srv0QeXKRK9nzxSrtQ09_QPLBynAjjPhDmo38"
);

// DOM Elements 
const list = document.getElementById("donation-summary"); 
const totalText = document.getElementById("total-amount"); 
const feedback = document.getElementById("payment-feedback");
const confirmBtn = document.getElementById("confirm-payment");

let cart = [];

// Load and Render Cart 
function loadCart() {
  try {
    cart = JSON.parse(localStorage.getItem("cart")) || [];
  } catch {
    cart = [];
  }
}

function renderCart() {
  if (!list) return; 
  if (!cart.length) {
    list.innerHTML = `<p style="color:#64748B;margin:0;">Your cart is empty.</p>`;
    totalText.textContent = "";
    return;
  }

  const itemsHTML = cart
    .map(
      (item) => `
      <div class="checkout-item" style="border-bottom:1px solid #e2e8f0;padding:0.6rem 0;">
        <p style="margin:0 0 .25rem 0;"><strong>${item.need_name}</strong></p>
        <p style="margin:0;color:#475569;">Donation: <b>AED ${item.cost.toFixed(2)}</b></p>
      </div>
    `
    )
    .join("");

  const total = cart.reduce((sum, item) => sum + item.cost, 0);
  list.innerHTML = itemsHTML;
  totalText.textContent = `AED ${total.toFixed(2)}`;
}

loadCart();
renderCart();

// Confirm Payment 
confirmBtn.addEventListener("click", async () => {
  if (!cart.length) return alert("Your cart is empty!");

  confirmBtn.disabled = true;
  feedback.textContent = "Processing your donation…";
  feedback.style.color = "#475569";

  try {
    for (const item of cart) {
      
      const { data: need, error: needErr } = await supabase
        .from("needs")
        .select("id, need_name, cost, amount_collected, status")
        .eq("id", item.id)
        .single();

      if (needErr || !need) throw needErr || new Error("Need not found");

      // Calculate new totals
      const newCollected = (need.amount_collected ?? 0) + item.cost;
      const newStatus = newCollected >= (need.cost ?? 0) ? "completed" : "ongoing";

      // Update in database
      const { error: updErr } = await supabase
        .from("needs")
        .update({ amount_collected: newCollected, status: newStatus })
        .eq("id", item.id);

      if (updErr) throw updErr;
    }

    // Show popup confirmation
    showPopup("✅ Payment successful! Thank you for your donation.");

    // Clear cart
    localStorage.removeItem("cart");

    // Redirect after short delay
    setTimeout(() => {
      window.location.href = "helper.html";
    }, 2500);

  } catch (err) {
    console.error("Payment error:", err);
    showPopup("❌ Something went wrong. Please try again.", true);
  } finally {
    confirmBtn.disabled = false;
  }
});

// Simple Popup 
function showPopup(message, isError = false) {
  const existing = document.querySelector(".popup-message");
  if (existing) existing.remove();

  const popup = document.createElement("div");
  popup.className = "popup-message";
  popup.textContent = message;
  popup.style.position = "fixed";
  popup.style.top = "20px";
  popup.style.right = "20px";
  popup.style.background = isError ? "#e74c3c" : "#0B3C5D";
  popup.style.color = "white";
  popup.style.padding = "15px 20px";
  popup.style.borderRadius = "8px";
  popup.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
  popup.style.fontFamily = "Inter, sans-serif";
  popup.style.zIndex = "9999";
  popup.style.transition = "opacity 0.3s ease";
  popup.style.opacity = "1";

  document.body.appendChild(popup);

  setTimeout(() => {
    popup.style.opacity = "0";
    setTimeout(() => popup.remove(), 300);
  }, 2500);
}

