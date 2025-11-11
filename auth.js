
// Needs Connect — Auth Page

window.__NC__ = window.__NC__ || {};

// SUPABASE INIT 
(function initSupabase() {
  if (!window.supabase || !window.supabase.createClient) {
    console.error("Supabase UMD not loaded.");
    return;
  }
  window.__NC__.supabase = window.supabase.createClient(
    "https://xcrmpdrsgnffbnidbmmr.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhjcm1wZHJzZ25mZmJuaWRibW1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDY3ODIsImV4cCI6MjA3NjcyMjc4Mn0.9tys44Srv0QeXKRK9nzxSrtQ09_QPLBynAjjPhDmo38"
  );
})();
const supabase = window.__NC__.supabase;

// MODALS 
(function initModals() {
  const overlay = document.querySelector(".overlay");
  const modals = {
    login: document.getElementById("login-modal"),
    signup: document.getElementById("signup-modal"),
    about: document.getElementById("about-modal"),
    contact: document.getElementById("contact-modal"),
  };

  function showOverlay() { overlay.classList.add("is-visible"); }
  function hideOverlay() { overlay.classList.remove("is-visible"); }
  function showModal(modal) {
    if (!modal) return;
    showOverlay();
    modal.classList.add("is-visible");
    modal.setAttribute("aria-hidden", "false");
  }
  function hideModal(modal) {
    if (!modal) return;
    modal.classList.remove("is-visible");
    modal.setAttribute("aria-hidden", "true");
  }
  function closeAll() {
    Object.values(modals).forEach(hideModal);
    hideOverlay();
  }

  document.addEventListener("click", (e) => {
    const openBtn = e.target.closest("[data-open]");
    if (openBtn) {
      const target = openBtn.getAttribute("data-open");
      closeAll();
      showModal(modals[target]);
      return;
    }
    if (e.target.classList.contains("overlay") || e.target.closest("[data-close]")) {
      closeAll();
    }
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAll(); });
})();

// LOGIN 
(function initLogin() {
  const loginForm = document.getElementById("login-form");
  const loginRole = document.getElementById("login-role");
  const charitySection = document.getElementById("login-charity-section");
  const errorEl = document.getElementById("login-error");

  loginRole.addEventListener("change", () => {
    charitySection.style.display = loginRole.value === "admin" ? "block" : "none";
  });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.textContent = "";

    const email = document.getElementById("login-email").value.trim().toLowerCase();
    const password = document.getElementById("login-password").value.trim();
    const role = loginRole.value;
    const charityCode = document.getElementById("login-charity-code").value.trim();

    if (!email || !password || !role) {
      errorEl.textContent = "Please fill all fields.";
      return;
    }
    if (role === "admin" && !charityCode) {
      errorEl.textContent = "Admins must enter a valid charity code.";
      return;
    }

    const { data, error } = await supabase.rpc("verify_user", {
      p_email: email,
      p_password: password,
      p_charity_code: charityCode || null,
    });

    if (error) {
      errorEl.textContent = "Login failed: " + error.message;
      return;
    }
    if (!data || data.length === 0) {
      errorEl.textContent = "Invalid credentials or missing charity code.";
      return;
    }

    const user = data[0];
    localStorage.setItem("app_user", JSON.stringify({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      charity_code: user.charity_code,
    }));

    window.location.href = role === "admin" ? "admin.html" : "helper.html";
  });
})();

// SIGNUP 
(function initSignup() {
  const signupForm = document.getElementById("signup-form");
  const signupRole = document.getElementById("signup-role");
  const adminMsg = document.getElementById("admin-message");
  const errorEl = document.getElementById("signup-error");

  signupRole.addEventListener("change", () => {
    adminMsg.style.display = signupRole.value === "admin" ? "block" : "none";
  });

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.textContent = "";

    const name = document.getElementById("signup-name").value.trim();
    const email = document.getElementById("signup-email").value.trim().toLowerCase();
    const password = document.getElementById("signup-password").value.trim();
    const repeat = document.getElementById("signup-password-repeat").value.trim();
    const role = signupRole.value;

    if (!name || !email || !password || !repeat || !role) {
      errorEl.textContent = "Please fill all fields.";
      return;
    }
    if (password !== repeat) {
      errorEl.textContent = "Passwords do not match.";
      return;
    }

    const { data, error } = await supabase.rpc("create_user", {
      p_full_name: name,
      p_email: email,
      p_password: password,
      p_role: role,
      p_charity_code: null,
    });

    if (error) {
      errorEl.textContent = error.message.includes("23505")
        ? "Email already exists."
        : "Error creating account: " + error.message;
      return;
    }

    if (role === "admin") {
      try {
        await sendAdminNotification(name, email);
        alert("Admin registration received. We'll verify and send your charity code soon.");
      } catch {
        alert("Admin registered, but email notification could not be sent.");
      }
    } else {
      alert("Account created successfully! Please log in.");
    }

    document.querySelector('[data-open="login"]').click();
  });
})();

// SEND ADMIN NOTIFICATION 
async function sendAdminNotification(name, email) {
  const body = {
    from: "Needs Connect <onboarding@resend.dev>",
    to: "interwebwastaken@gmail.com",
    subject: "New Admin Registration on Needs Connect",
    html: `
      <h3>New Admin Registration</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p>This user signed up as an admin and is pending verification.</p>
    `,
  };

  const response = await fetch("http://localhost:3000/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  console.log("✅ Email sent successfully:", data);
}
