
//  Needs Connect — Admin Dashboard Script
// SUPABASE INIT 
const supabase = window.supabase.createClient(
  "https://xcrmpdrsgnffbnidbmmr.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhjcm1wZHJzZ25mZmJuaWRibW1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDY3ODIsImV4cCI6MjA3NjcyMjc4Mn0.9tys44Srv0QeXKRK9nzxSrtQ09_QPLBynAjjPhDmo38"
);


// Verify Admin Access

function verifyAdminAccess() {
  const userData = localStorage.getItem("app_user");
  if (!userData) {
    alert("⚠️ Please log in as an admin.");
    window.location.href = "auth.html";
    return null;
  }

  const user = JSON.parse(userData);
  if (user.role !== "admin") {
    alert("Access denied. Admins only.");
    window.location.href = "auth.html";
    return null;
  }

  document.getElementById("welcome-msg").textContent = `Welcome, ${user.full_name || "Admin"}`;
  return user;
}

const currentAdmin = verifyAdminAccess();
if (!currentAdmin) console.warn("No admin session found.");


// Logout

document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.removeItem("app_user");
  alert("Logged out successfully.");
  window.location.href = "auth.html";
});


// Helpers

function cap(s) { return String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1); }

// Badge markup
function renderBadges(need) {
  const bits = [];
  if (need.is_urgent) bits.push('<span class="badge urgent">Urgent</span>');
  if (need.time_sensitive) bits.push('<span class="badge time-sensitive"><i class="fa-regular fa-clock"></i> Time Sensitive</span>');
  return bits.join(" ");
}


// Load & Display Needs 

async function loadMyNeeds() {
  const needsList = document.getElementById("needs-list");
  needsList.innerHTML = "<p class='empty-text'>Loading your posted needs...</p>";

  const { data, error } = await supabase
    .from("needs")
    .select("*")
    .eq("created_by", currentAdmin.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching needs:", error.message);
    needsList.innerHTML = "<p class='empty-text'>Failed to load your needs.</p>";
    return;
  }

  if (!data || data.length === 0) {
    needsList.innerHTML = "<p class='empty-text'>You haven’t added any needs yet.</p>";
    return;
  }

  needsList.innerHTML = data
    .map((need) => {
      const collected = Number(need.amount_collected ?? 0);
      const total = Number(need.cost ?? 0);
      const remaining = Math.max(total - collected, 0);
      const percent = total > 0 ? Math.min((collected / total) * 100, 100).toFixed(1) : 0;

      const status = String(need.status || "ongoing").toLowerCase();
      const niceStatus = cap(status);
      const barColor = status === "completed" ? "#16a34a" : "#F4D35E";

      return `
      <div class="need-card">
        <img src="${need.image_url || "placeholder.png"}" alt="Need image" class="need-thumb"/>
        <div class="need-info">
          <h4>${need.need_name}</h4>
          <div class="status-row">
            <span class="status-pill status-${status}">${niceStatus}</span>
            ${renderBadges(need)}
          </div>
          <p>${need.description || ""}</p>
          <p><strong>Category:</strong> ${need.category || "—"}</p>
          <p><strong>Cost:</strong> AED ${total.toFixed(2)}</p>

          <div class="progress-wrapper">
            <div class="progress-bar">
              <div class="progress-fill" style="width:${percent}%; background:${barColor};"></div>
            </div>
            <p class="progress-text">
              AED ${collected.toFixed(2)} collected (${percent}% collected)<br>
              AED ${total.toFixed(2)} target — AED ${remaining.toFixed(2)} remaining
            </p>
          </div>

          <div class="need-actions">
            <button class="btn-edit" data-id="${need.id}"><i class="fa fa-pen"></i> Edit</button>
            <button class="btn-delete" data-id="${need.id}"><i class="fa fa-trash"></i> Delete</button>
          </div>
        </div>
      </div>`;
    })
    .join("");

  document.querySelectorAll(".btn-edit").forEach((btn) => btn.addEventListener("click", editNeed));
  document.querySelectorAll(".btn-delete").forEach((btn) => btn.addEventListener("click", deleteNeed));
}


// Delete Need

async function deleteNeed(e) {
  const id = e.target.closest("button").dataset.id;
  if (!confirm("Are you sure you want to delete this need?")) return;

  const { error } = await supabase.from("needs").delete().eq("id", id).eq("created_by", currentAdmin.id);
  if (error) {
    alert("❌ Failed to delete need.");
    console.error(error.message);
  } else {
    alert("✅ Need deleted successfully.");
    loadMyNeeds();
  }
}


// Edit Need 

const editModal = document.getElementById("edit-modal");
const closeEditModal = document.getElementById("close-edit-modal");
const editForm = document.getElementById("edit-need-form");

async function editNeed(e) {
  const needId = e.target.closest("button").dataset.id;
  const { data, error } = await supabase
    .from("needs")
    .select("*")
    .eq("id", needId)
    .eq("created_by", currentAdmin.id)
    .single();

  if (error) {
    alert("❌ Failed to fetch need for editing.");
    console.error(error.message);
    return;
  }

  document.getElementById("edit-id").value = data.id;
  document.getElementById("edit-need-name").value = data.need_name || "";
  document.getElementById("edit-description").value = data.description || "";
  document.getElementById("edit-cost").value = data.cost ?? 0;
  document.getElementById("edit-deadline").value = data.deadline || "";
  document.getElementById("edit-priority").value = data.priority || 3;
  document.getElementById("edit-category").value = data.category || "";
  document.getElementById("edit-time-sensitive").checked = !!data.time_sensitive;
  document.getElementById("edit-urgent").checked = !!data.is_urgent;
  document.getElementById("edit-status").value = (data.status || "ongoing").toLowerCase();

  editModal.classList.add("is-visible");
}

closeEditModal.addEventListener("click", () => editModal.classList.remove("is-visible"));

editForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("edit-id").value;
  const updates = {
    need_name: document.getElementById("edit-need-name").value.trim(),
    description: document.getElementById("edit-description").value.trim(),
    cost: parseFloat(document.getElementById("edit-cost").value) || 0,
    deadline: document.getElementById("edit-deadline").value || null,
    priority: parseInt(document.getElementById("edit-priority").value),
    category: document.getElementById("edit-category").value.trim(),
    time_sensitive: document.getElementById("edit-time-sensitive").checked,
    is_urgent: document.getElementById("edit-urgent").checked,
    status: document.getElementById("edit-status").value,
  };

  const { error } = await supabase.from("needs").update(updates).eq("id", id).eq("created_by", currentAdmin.id);

  if (error) {
    alert("❌ Failed to update need.");
    console.error(error.message);
  } else {
    alert("✅ Need updated successfully!");
    editModal.classList.remove("is-visible");
    loadMyNeeds();
  }
});


// Add New Need 

handleAddNeedForm();

async function handleAddNeedForm() {
  const form = document.getElementById("add-need-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const needName = document.getElementById("need-name").value.trim();
    const description = document.getElementById("description").value.trim();
    const cost = parseFloat(document.getElementById("cost").value) || 0;
    const deadline = document.getElementById("deadline").value || null;
    const priority = parseInt(document.getElementById("priority").value);
    const category = document.getElementById("category").value.trim();
    const isUrgent = document.getElementById("urgent").checked;
    const timeSensitive = document.getElementById("time-sensitive").checked;
    const status = document.getElementById("status").value || "ongoing";
    const imageFile = document.getElementById("need-image").files[0];

    if (!needName) {
      alert("⚠️ Please enter a need name");
      return;
    }

    try {
      let imageUrl = null;
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `needs/${fileName}`;

        const { error: uploadError } = await supabase.storage.from("need-images").upload(filePath, imageFile);
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("need-images").getPublicUrl(filePath);
        imageUrl = data.publicUrl;
      }

      const { error } = await supabase.from("needs").insert([
        {
          need_name: needName,
          description,
          cost,
          deadline,
          priority,
          category,
          is_urgent: isUrgent,
          time_sensitive: timeSensitive,
          image_url: imageUrl,
          created_by: currentAdmin.id,
          status,
          amount_collected: 0,
        },
      ]);

      if (error) throw error;

      form.reset();
      alert("✅ Need added successfully!");
      loadMyNeeds();
    } catch (err) {
      console.error("Error adding need:", err.message);
      alert("❌ Failed to add need.");
    }
  });
}


loadMyNeeds();
console.log("✅ Admin Dashboard ready");


