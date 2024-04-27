//Require necessary modules
const express = require("express");
const mongoose = require("mongoose");

//Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

//Set up MongoDB connection
mongoose
    .connect(process.env.DB_URL)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("Error connecting to MongoDB:", err));

//Bug Schema
const bugSchema = new mongoose.Schema({
    code: String,
    description: String,
    error: String,
    detectedAt: { type: Date, default: Date.now },
});

const Bug = mongoose.model("Bug", bugSchema);

app.use(express.json()); // Parse JSON request bodies
app.set("view engine", "ejs"); // Set EJS as view engine
app.set("views", "src/views"); // Set the views directory
app.use(express.static("public")); // Serve static files from the 'public' directory

// Bug report route
app.post("/report-bug", async (req, res) => {
    try {
        const { code } = req.body;

        // Try to evaluate the provided code snippet to detect syntax errors
        try {
            // Wrapping eval in a Function constructor to catch syntax errors
            new Function(code)();
            res.status(200).json({
                message:
                    "No syntax error detected. Thank you for your feedback.",
            });
        } catch (error) {
            if (error instanceof SyntaxError) {
                const bug = new Bug({
                    code,
                    error: error.message,
                    description: error.stack,
                });
                await bug.save();
                res.status(400).json({
                    message:
                        "Syntax error detected in the code. Please correct it.",
                });
            } else {
                throw error; // If it's not a SyntaxError, re-throw the error
            }
        }
    } catch (error) {
        console.error("Error reporting bug:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Render bug reporting form
app.get("/", (req, res) => {
    res.render("bug-report.ejs");
});

// 7. Start the server
app.listen(process.env.PORT || 8000, () => {
    console.log(`Server is running on port ${process.env.PORT || 8000}`);
});
