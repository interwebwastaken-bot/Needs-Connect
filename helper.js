// =========================================
// Needs Connect — Helper Page
// =========================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  "https://xcrmpdrsgnffbnidbmmr.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhjcm1wZHJzZ25mZmJuaWRibW1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDY3ODIsImV4cCI6MjA3NjcyMjc4Mn0.9tys44Srv0QeXKRK9nzxSrtQ09_QPLBynAjjPhDmo38"
);

// ====== DOM Elements ======
const list = document.getElementById("needs-container");
const searchInput = document.getElementById("search");
const sortSelect = document.getElementById("sort");
const filterStatus = document.getElementById("filter-status");
const filterCategory = document.getElementById("filter-category");

// Donate modal
const donateOverlay = document.getElementById("donate-overlay");
const donateModal = document.getElementById("donate-modal");
const donateClose = document.getElementById("donate-close");
const donateForm = document.getElementById("donate-form");
const donateName = document.getElementById("donate-need-name");
const donateDesc = document.getElementById("donate-need-desc");
const donateAmount = document.getElementById("donate-amount");
const donateNote = document.getElementById("donate-note");
const donateFeedback = document.getElementById("donate-feedback");

// Cart sidebar
const cartBtn = document.getElementById("view-cart");
const cartSidebar = document.getElementById("cart-sidebar");
const closeCart = document.getElementById("close-cart");
const overlay = document.getElementById("overlay");
const cartItems = document.getElementById("cart-items");
const totalText = document.getElementById("cart-total");
const checkoutBtn = document.getElementById("checkout");

// Logout
const logoutBtn = document.getElementById("logout-btn");

// ====== State ======
let allNeeds = [];
let donatingNeed = null;

// ====== Fetch Data ======
async function fetchNeeds() {
  const { data, error } = await supabase
    .from("needs")
    .select(`
      *,
      fk_needs_created_by:app_users!fk_needs_created_by (
        full_name,
        charity_name
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch error:", error.message);
    list.innerHTML = `<p style="color:#c00;text-align:center">${error.message}</p>`;
    return;
  }

  allNeeds = data || [];
  populateCharityFilter(allNeeds);
  applyFilters();
}

// ====== Populate Filters ======
function populateCharityFilter(needs) {
  const charities = Array.from(
    new Set(
      needs.map((n) => (n.fk_needs_created_by?.charity_name || "").trim()).filter(Boolean)
    )
  ).sort();

  filterCategory.innerHTML =
    `<option value="">All Charities</option>` +
    charities.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
}

// ====== Apply Filters & Sorting ======
function applyFilters() {
  let filtered = [...allNeeds];
  const term = (searchInput.value || "").trim().toLowerCase();
  const status = filterStatus.value.toLowerCase();
  const charity = filterCategory.value;

  if (term) {
    filtered = filtered.filter(
      (n) =>
        (n.need_name || "").toLowerCase().includes(term) ||
        (n.category || "").toLowerCase().includes(term) ||
        (n.description || "").toLowerCase().includes(term)
    );
  }

  if (status) filtered = filtered.filter((n) => (n.status || "").toLowerCase() === status);
  if (charity)
    filtered = filtered.filter(
      (n) => (n.fk_needs_created_by?.charity_name || "") === charity
    );

  switch (sortSelect.value) {
    case "created_at.asc":
      filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      break;
    case "priority.desc":
      filtered.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
      break;
    case "cost.desc":
      filtered.sort((a, b) => (b.cost ?? 0) - (a.cost ?? 0));
      break;
    case "deadline.asc":
      filtered.sort(
        (a, b) =>
          new Date(a.deadline ?? "2100-01-01") - new Date(b.deadline ?? "2100-01-01")
      );
      break;
    case "created_at.desc":
    default:
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  renderNeeds(filtered);
}

searchInput.addEventListener("input", applyFilters);
sortSelect.addEventListener("change", applyFilters);
filterStatus.addEventListener("change", applyFilters);
filterCategory.addEventListener("change", applyFilters);

// ====== Render Cards ======
function renderNeeds(needs) {
  if (!needs.length) {
    list.innerHTML = `<p style="text-align:center;color:#64748B;">No needs found.</p>`;
    return;
  }

  list.innerHTML = needs
    .map((n) => {
      const collected = Number(n.amount_collected || 0);
      const total = Number(n.cost || 0);
      const remaining = Math.max(total - collected, 0);
      const percent = Math.min((collected / Math.max(total, 1)) * 100, 100).toFixed(1);
      const deadline = n.deadline ? new Date(n.deadline).toLocaleDateString() : "—";

      const status = (n.status || "ongoing").toLowerCase();
      const colorMap = {
        ongoing: "#94A3B8",
        paused: "#F4D35E",
        completed: "#16A34A",
        cancelled: "#EF4444",
      };
      const barColor = colorMap[status] || "#94A3B8";
      const isCompleted = status === "completed";
      const isCancelled = status === "cancelled";
      const isDisabled = isCompleted || isCancelled;

      const badges = [];
      if (n.is_urgent) badges.push('<span class="badge urgent">Urgent</span>');
      if (n.time_sensitive)
        badges.push(
          '<span class="badge time-sensitive"><i class="fa-regular fa-clock"></i> Time Sensitive</span>'
        );

      return `
        <div class="need-card ${isCompleted ? "completed" : ""} ${isCancelled ? "cancelled" : ""}" data-id="${n.id}">
          <img src="${escapeHtml(n.image_url || "placeholder.png")}"
               alt="${escapeHtml(n.need_name)}"
               class="need-image"
               onerror="this.src='placeholder.png'"/>

          <div class="status-row">
            <span class="status-pill" style="background:${barColor};">
              ${status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
            ${badges.join(" ")}
          </div>

          <h4>${escapeHtml(n.need_name)}</h4>
          <p>${escapeHtml(n.description || "No description provided.")}</p>
          <p><strong>Category:</strong> ${escapeHtml(n.category || "—")}</p>
          <p><strong>Deadline:</strong> ${escapeHtml(deadline)}</p>
          <p><strong>Charity:</strong> ${escapeHtml(n.fk_needs_created_by?.charity_name || "—")}</p>
          <p><strong>Admin:</strong> ${escapeHtml(n.fk_needs_created_by?.full_name || "—")}</p>

          <div class="progress-wrapper">
            <div class="progress-bar">
              <div class="progress-fill" style="width:${percent}%; background:${barColor};"></div>
            </div>
            <p class="progress-text">
              AED ${collected.toFixed(2)} collected (${percent}% collected)<br>
              AED ${total.toFixed(2)} target — AED ${remaining.toFixed(2)} remaining
            </p>
          </div>

          <button class="btn gold donate-btn"
                  data-id="${n.id}"
                  data-name="${escapeHtml(n.need_name)}"
                  data-desc="${escapeHtml(n.description || "")}"
                  data-remaining="${remaining}"
                  ${isDisabled ? "disabled" : ""}>
            ${
              isCompleted
                ? "Target Met"
                : isCancelled
                ? "Unavailable"
                : "Donate"
            }
          </button>
        </div>`;
    })
    .join("");
}

// ====== Donate UX ======
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".donate-btn");
  if (!btn || btn.disabled) return;

  donatingNeed = {
    id: btn.dataset.id,
    name: btn.dataset.name,
    desc: btn.dataset.desc || "",
    remaining: Number(btn.dataset.remaining || 0),
  };

  donateName.textContent = donatingNeed.name;
  donateDesc.textContent = donatingNeed.desc;
  donateAmount.value = "";
  donateFeedback.textContent = "";
  openDonate();
});

donateClose.addEventListener("click", closeDonate);
donateOverlay.addEventListener("click", (e) => {
  if (e.target.id === "donate-overlay") closeDonate();
});

donateForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!donatingNeed) return;

  const amount = Number(donateAmount.value || 0);
  const remaining = Number(donatingNeed.remaining || 0);

  if (!amount || amount <= 0)
    return setDonateError("Please enter a valid donation amount.");
  if (amount > remaining)
    return setDonateError(`Amount exceeds remaining need (max AED ${remaining.toFixed(2)}).`);

  let cart = [];
  try { cart = JSON.parse(localStorage.getItem("cart")) || []; } catch { cart = []; }

  const existing = cart.find((i) => String(i.id) === String(donatingNeed.id));
  if (existing) existing.cost = Number(existing.cost || 0) + amount;
  else
    cart.push({
      id: donatingNeed.id,
      need_name: donatingNeed.name,
      description: donatingNeed.desc,
      cost: amount,
      note: donateNote.value.trim() || null,
    });

  localStorage.setItem("cart", JSON.stringify(cart));

  donateFeedback.textContent = "✅ Added to basket!";
  donateFeedback.style.color = "#16A34A";

  setTimeout(() => {
    closeDonate();
    openCart();
    updateCart();
  }, 500);
});

// ====== Cart ======
function openCart() {
  cartSidebar.classList.add("active");
  overlay.classList.add("active");
  updateCart();
}
function closeCartFn() {
  cartSidebar.classList.remove("active");
  overlay.classList.remove("active");
}
cartBtn.addEventListener("click", openCart);
closeCart.addEventListener("click", closeCartFn);
overlay.addEventListener("click", (e) => {
  if (e.target.id === "overlay") closeCartFn();
});

function updateCart() {
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem("cart")) || []; } catch { cart = []; }

  if (!cart.length) {
    cartItems.innerHTML = `<p style="color:#64748B;text-align:center;">Your basket is empty.</p>`;
    totalText.innerHTML = `<strong>Total:</strong> AED 0.00`;
    return;
  }

  cartItems.innerHTML = cart
    .map(
      (item, i) => `
      <div class="cart-item" data-index="${i}">
        <div>
          <p><strong>${escapeHtml(item.need_name)}</strong></p>
          <p style="margin-top:4px;">AED ${Number(item.cost || 0).toFixed(2)}</p>
        </div>
        <button class="btn small danger remove-item" data-index="${i}">Remove</button>
      </div>
    `
    )
    .join("");

  const total = cart.reduce((s, n) => s + (Number(n.cost) || 0), 0);
  totalText.innerHTML = `<strong>Total:</strong> AED ${total.toFixed(2)}`;
}

cartItems.addEventListener("click", (e) => {
  if (!e.target.classList.contains("remove-item")) return;
  const idx = Number(e.target.dataset.index);
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.splice(idx, 1);
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCart();
});

checkoutBtn.addEventListener("click", () => {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  if (!cart.length) return alert("Your basket is empty.");
  window.location.href = "payment.html";
});

// ====== Donate Modal ======
function openDonate() {
  donateOverlay.classList.add("is-visible");
  donateModal.classList.add("is-visible");
}
function closeDonate() {
  donateOverlay.classList.remove("is-visible");
  donateModal.classList.remove("is-visible");
  donateForm.reset();
  donateFeedback.textContent = "";
  donatingNeed = null;
}
function setDonateError(msg) {
  donateFeedback.textContent = msg;
  donateFeedback.style.color = "#e74c3c";
}

// ====== Logout ======
logoutBtn?.addEventListener("click", async () => {
  try {
    await supabase.auth.signOut();
    alert("You have been logged out.");
    window.location.href = "auth.html";
  } catch (error) {
    console.error(error);
    alert("Logout failed.");
  }
});

// ====== Utils ======
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"'`]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

// ====== Init ======
document.addEventListener("DOMContentLoaded", fetchNeeds);

