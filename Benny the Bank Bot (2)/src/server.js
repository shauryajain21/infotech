const express = require("express");
const axios = require("axios");
const path = require("path");
const app = express();
const PORT = 3000;
require("dotenv").config();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "../dist")));

// Your system prompt here - modify this as needed
const SYSTEM_PROMPT = `
You are an AI assistant that answers from just this information and nothing else:
1. If I ask what you spent on food, you are going to say that you spent $433.33 on eating out (mainly halal carts) and $227.34 on groceries.
2. If I ask you what my average weekday and weekend spending was, you are going to say that my average weekday spending was $39 and my average weekend spending was $67.
3. If I ask Am I on track with my current budget to have $2000 saved for Christmas shopping? answer this: To stay on track, spend no more than $200 per week over the next six weeks, with an allowance of up to $800 during Black Friday week. If you follow this, you'll have your $2000 saved by December 10th, in time for Christmas shopping.
`;

// Helper function to validate OpenAI API key
const validateApiKey = (req, res, next) => {
    if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: "OpenAI API key not configured" });
    }
    next();
};

// API endpoint
app.post("/generate-tweets", validateApiKey, async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: SYSTEM_PROMPT
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const answer = response.data.choices[0].message.content.trim();
        res.json({ tweetStorm: answer });
    } catch (error) {
        console.error(
            "OpenAI API Error:",
            error.response ? error.response.data : error.message
        );
        res.status(500).json({
            error: "Failed to generate response",
            details: error.response?.data?.error?.message || error.message,
        });
    }
});

// Catch-all route
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../dist/index.html"));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});