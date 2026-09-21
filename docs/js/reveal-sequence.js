function parseRevealDelayMs(element) {
    const datasetValue = element.dataset.revealDelay;
    if (datasetValue !== undefined && datasetValue !== "") {
        const parsed = Number.parseFloat(datasetValue);
        if (!Number.isNaN(parsed)) {
            return parsed;
        }
    }

    const customProperty = getComputedStyle(element).getPropertyValue("--reveal-delay").trim();
    if (!customProperty) {
        return 0;
    }

    const parsed = Number.parseFloat(customProperty);
    return Number.isNaN(parsed) ? 0 : parsed;
}

function startRevealSequence(root = document) {
    const revealItems = root.querySelectorAll("[data-reveal]");

    revealItems.forEach((element) => {
        const delayMs = parseRevealDelayMs(element);
        element.style.setProperty("--reveal-delay", `${delayMs}ms`);
        element.classList.remove("is-ready", "opacity-0", "opacity-100");

        void element.offsetWidth;
        element.classList.add("is-ready");
    });
}

function handleRevealSequenceStart() {
    startRevealSequence();
}

function initRevealSequence() {
    window.addEventListener("reveal-sequence:start", handleRevealSequenceStart);

    const shouldWaitForEnvelope = document.body && document.body.dataset.revealMode === "after-envelope";
    if (!shouldWaitForEnvelope) {
        handleRevealSequenceStart();
    }
}

document.addEventListener("DOMContentLoaded", initRevealSequence);
