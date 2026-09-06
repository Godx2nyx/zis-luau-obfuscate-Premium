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
 * ============================================================
 * Zis Luau Obfuscate Premium v0.1
 * ============================================================
 *
 * Basic transformation engine
 * ============================================================
 */

function obfuscate(source, options = {}) {
    if (typeof source !== "string") {
        throw new Error("Invalid source code");
    }

    let output = source;

    /*
     * ----------------------------------------------------------
     * String Transform
     * ----------------------------------------------------------
     *
     * "is"
     * ->
     * string.char(105,115)
     *
     */

    if (options.strings) {
        output = output.replace(
            /(["'])([\s\S]*?)\1/g,
            (match, quote, value) => {
                const bytes = [];

                for (let i = 0; i < value.length; i++) {
                    bytes.push(
                        value.charCodeAt(i)
                    );
                }

                return `string.char(${bytes.join(",")})`;
            }
        );
    }

    /*
     * ----------------------------------------------------------
     * Number Transform
     * ----------------------------------------------------------
     */

    if (options.numbers) {
        output = output.replace(
            /\b\d+(?:\.\d+)?\b/g,
            (match) => {
                const value = Number(match);

                if (!Number.isFinite(value)) {
                    return match;
                }

                if (value === 0) {
                    return "(1-1)";
                }

                if (value === 1) {
                    return "(2-1)";
                }

                return `(${value}+0)`;
            }
        );
    }

    /*
     * ----------------------------------------------------------
     * Protection Header
     * ----------------------------------------------------------
     */

    output =
`-- Zis Luau Obfuscate Premium v0.1
-- Protected Source

${output}`;

    return output;
}


/*
 * ============================================================
 * Health Check
 * ============================================================
 */

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        name: "Zis Luau Obfuscate Premium",
        version: "0.1",
        status: "online"
    });
});


/*
 * ============================================================
 * Obfuscate API
 * ============================================================
 */

app.post("/api/obfuscate", (req, res) => {
    try {
        const body = req.body || {};

        const code = body.code;
        const options = body.options || {};

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

        const output = obfuscate(
            code,
            {
                strings:
                    options.strings === true,

                numbers:
                    options.numbers === true,

                rename:
                    options.rename === true,

                constants:
                    options.constants === true,

                controlFlow:
                    options.controlFlow === true
            }
        );

        return res.json({
            success: true,

            output,

            stats: {
                inputSize: code.length,
                outputSize: output.length,
                inputLines: code
                    .split(/\r\n|\r|\n/)
                    .length,
                outputLines: output
                    .split(/\r\n|\r|\n/)
                    .length
            }
        });

    } catch (error) {
        console.error(
            "[OBFUSCATE ERROR]",
            error
        );

        return res.status(500).json({
            success: false,
            error:
                error.message ||
                "Obfuscation failed"
        });
    }
});


/*
 * ============================================================
 * Root
 * ============================================================
 */

app.get("/", (req, res) => {
    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );
});


/*
 * ============================================================
 * 404 API
 * ============================================================
 */

app.use("/api", (req, res) => {
    res.status(404).json({
        success: false,
        error: "API endpoint not found"
    });
});


/*
 * ============================================================
 * Start Server
 * ============================================================
 */

app.listen(
    PORT,
    "0.0.0.0",
    () => {
        console.log(
            "=========================================="
        );

        console.log(
            " Zis Luau Obfuscate Premium v0.1"
        );

        console.log(
            ` Server running on port ${PORT}`
        );

        console.log(
            "=========================================="
        );
    }
);
