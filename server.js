const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json({
    limit: "2mb"
}));

app.use(express.urlencoded({
    extended: true,
    limit: "2mb"
}));

app.use(express.static(
    path.join(__dirname, "public")
));

/*
 * Zis Luau Obfuscate Premium v0.1
 * API
 */

function obfuscate(source, options = {}) {
    /*
     * Placeholder สำหรับระบบจริง
     *
     * ขั้นต่อไปจะเสียบ:
     * Lexer
     * Parser
     * AST
     * Identifier Renamer
     * Constant Hider
     * String Transformer
     * Number Transformer
     * Control Flow
     * Compiler
     * VM
     */

    if (typeof source !== "string") {
        throw new Error("Invalid source");
    }

    // ตอนนี้ยังไม่เปลี่ยน source
    // เพื่อให้ทดสอบหน้าเว็บ/API ได้ก่อน
    return source;
}

/* Health check */
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        name: "Zis Luau Obfuscate Premium",
        version: "0.1",
        status: "online"
    });
});

/* Obfuscate API */
app.post("/api/obfuscate", (req, res) => {
    try {
        const {
            code,
            options = {}
        } = req.body || {};

        if (typeof code !== "string") {
            return res.status(400).json({
                success: false,
                error: "Source code is required"
            });
        }

        if (!code.trim()) {
            return res.status(400).json({
                success: false,
                error: "Source code is empty"
            });
        }

        if (code.length > 2_000_000) {
            return res.status(413).json({
                success: false,
                error: "Source code is too large"
            });
        }

        const output = obfuscate(code, options);

        res.json({
            success: true,
            output,
            stats: {
                inputSize: code.length,
                outputSize: output.length
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            error: error.message || "Obfuscation failed"
        });
    }
});

/* SPA fallback */
app.get("*", (req, res) => {
    res.sendFile(
        path.join(__dirname, "public", "index.html")
    );
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(
        `Zis Luau Obfuscate Premium v0.1`
    );

    console.log(
        `Server running on port ${PORT}`
    );
});
