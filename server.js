// server.js — Resend proxy with CORS fix
const express = require("express");
const cors = require("cors"); // 🟢 add this line
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(express.json());
app.use(cors()); // 🟢 allow requests from your frontend (127.0.0.1:5500)

const RESEND_API_KEY = "re_XXXKf3pK_HWECegz4XKQmWBzvujomXzEd";

// Health check
app.get("/", (req, res) => {
  res.send("✅ Email proxy is running successfully!");
});

// Proxy endpoint
app.post("/send-email", async (req, res) => {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Resend API error:", data);
      return res.status(response.status).json(data);
    }

    console.log("✅ Email sent successfully:", data);
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("❌ Proxy error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log("🚀 Proxy running at http://localhost:3000");
});
