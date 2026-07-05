// Local dev server — wraps the same handler used by Vercel (api/analyze.js)
import "dotenv/config";
import express from "express";
import handler from "../api/analyze.js";

const app = express();
app.use(express.json({ limit: "1mb" }));
app.post("/api/analyze", (req, res) => handler(req, res));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API proxy running → http://localhost:${PORT}`));
