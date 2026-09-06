/*
 * Zis Luau Obfuscate Premium v0.1
 */

const inputCode =
    document.getElementById("inputCode");

const outputCode =
    document.getElementById("outputCode");

const obfuscateButton =
    document.getElementById("obfuscateButton");

const buttonText =
    document.getElementById("buttonText");

const loader =
    document.getElementById("loader");

const copyButton =
    document.getElementById("copyButton");

const downloadButton =
    document.getElementById("downloadButton");

const clearInput =
    document.getElementById("clearInput");

const toast =
    document.getElementById("toast");

const inputLines =
    document.getElementById("inputLines");

const inputChars =
    document.getElementById("inputChars");

const outputLines =
    document.getElementById("outputLines");

const outputChars =
    document.getElementById("outputChars");

const status =
    document.getElementById("status");


function updateStats() {

    const input =
        inputCode.value;

    const output =
        outputCode.value;

    inputChars.textContent =
        input.length.toLocaleString();

    outputChars.textContent =
        output.length.toLocaleString();

    inputLines.textContent =
        countLines(input).toLocaleString();

    outputLines.textContent =
        countLines(output).toLocaleString();
}


function countLines(text) {

    if (!text) {
        return 0;
    }

    return text.split(/\r\n|\r|\n/).length;
}


function showToast(
    message,
    error = false
) {

    toast.textContent =
        message;

    toast.classList.toggle(
        "error",
        error
    );

    toast.classList.add("show");

    clearTimeout(
        showToast.timer
    );

    showToast.timer =
        setTimeout(() => {

            toast.classList.remove(
                "show"
            );

        }, 2200);
}


function setLoading(
    loading
) {

    obfuscateButton.disabled =
        loading;

    if (loading) {

        buttonText.textContent =
            "PROCESSING";

        loader.classList.remove(
            "hidden"
        );

    } else {

        buttonText.textContent =
            "OBFUSCATE";

        loader.classList.add(
            "hidden"
        );
    }
}


function getOptions() {

    return {

        rename:
            document.getElementById(
                "rename"
            ).checked,

        constants:
            document.getElementById(
                "constants"
            ).checked,

        strings:
            document.getElementById(
                "strings"
            ).checked,

        numbers:
            document.getElementById(
                "numbers"
            ).checked,

        controlFlow:
            document.getElementById(
                "controlFlow"
            ).checked
    };
}


async function obfuscate() {

    const code =
        inputCode.value;

    if (!code.trim()) {

        showToast(
            "Please enter Luau code",
            true
        );

        inputCode.focus();

        return;
    }

    setLoading(true);

    try {

        const response =
            await fetch(
                "/api/obfuscate",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        code,
                        options:
                            getOptions()
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok || !data.success) {

            throw new Error(
                data.error ||
                "Obfuscation failed"
            );
        }

        outputCode.value =
            data.output || "";

        updateStats();

        showToast(
            "Obfuscation completed"
        );

    } catch (error) {

        console.error(error);

        showToast(
            error.message ||
            "Something went wrong",
            true
        );

    } finally {

        setLoading(false);
    }
}


async function copyOutput() {

    const text =
        outputCode.value;

    if (!text) {

        showToast(
            "Nothing to copy",
            true
        );

        return;
    }

    try {

        await navigator.clipboard.writeText(
            text
        );

        showToast(
            "Copied to clipboard"
        );

    } catch {

        outputCode.select();

        document.execCommand(
            "copy"
        );

        showToast(
            "Copied to clipboard"
        );
    }
}


function downloadOutput() {

    const text =
        outputCode.value;

    if (!text) {

        showToast(
            "Nothing to download",
            true
        );

        return;
    }

    const blob =
        new Blob(
            [text],
            {
                type:
                    "text/plain;charset=utf-8"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href =
        url;

    link.download =
        "zis-obfuscated.luau";

    document.body.appendChild(
        link
    );

    link.click();

    link.remove();

    URL.revokeObjectURL(
        url
    );

    showToast(
        "Download started"
    );
}


function clearInputCode() {

    inputCode.value =
        "";

    updateStats();

    inputCode.focus();
}


inputCode.addEventListener(
    "input",
    updateStats
);


obfuscateButton.addEventListener(
    "click",
    obfuscate
);


copyButton.addEventListener(
    "click",
    copyOutput
);


downloadButton.addEventListener(
    "click",
    downloadOutput
);


clearInput.addEventListener(
    "click",
    clearInputCode
);


/*
 * Ctrl + Enter / Cmd + Enter
 */

inputCode.addEventListener(
    "keydown",
    event => {

        if (
            (event.ctrlKey ||
             event.metaKey) &&
            event.key === "Enter"
        ) {

            event.preventDefault();

            obfuscate();
        }
    }
);


/*
 * Check server
 */

async function checkServer() {

    try {

        const response =
            await fetch(
                "/api/health"
            );

        const data =
            await response.json();

        if (
            response.ok &&
            data.success
        ) {

            status.innerHTML = `
                <span class="status-dot"></span>
                Online
            `;

        } else {

            throw new Error();
        }

    } catch {

        status.innerHTML = `
            <span
                class="status-dot"
                style="background:#ef4444;box-shadow:0 0 10px rgba(239,68,68,.7)"
            ></span>
            Offline
        `;
    }
}


updateStats();
checkServer();
