const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let bots = [];

app.post("/api/bots", (req, res) => {
    const bot = req.body;
    bots.push(bot);
    console.log("New bot registered:", bot);
    res.json({ message: "Bot registered successfully!" });
});

app.get("/api/bots", (req, res) => {
    res.json({ online_bots: bots.length, bots });
});

module.exports = app;
