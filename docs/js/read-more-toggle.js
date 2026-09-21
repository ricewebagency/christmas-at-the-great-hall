(() => {
    const DEFAULT_COLLAPSED_LINES = 3;
    const COLLAPSED_LABEL = "... meer";
    const EXPANDED_LABEL = "... minder";

    const items = [];

    const normalizeText = (value) => value.replace(/\s+/g, " ").trim();

    const getLineHeight = (element) => {
        const styles = window.getComputedStyle(element);
        const rawLineHeight = Number.parseFloat(styles.lineHeight);

        if (Number.isFinite(rawLineHeight)) {
            return rawLineHeight;
        }

        const fontSize = Number.parseFloat(styles.fontSize);
        return Number.isFinite(fontSize) ? fontSize * 1.5 : 20;
    };

    const getCollapsedLines = (paragraph) => {
        const configuredLines = Number.parseInt(paragraph.dataset.readmoreLines || "", 10);

        if (Number.isFinite(configuredLines) && configuredLines > 0) {
            return configuredLines;
        }

        return DEFAULT_COLLAPSED_LINES;
    };

    const getMaxCollapsedHeight = (paragraph) => getLineHeight(paragraph) * getCollapsedLines(paragraph);

    const getCollapsedText = ({ paragraph, textSpan, button, fullText }) => {
        const maxHeight = getMaxCollapsedHeight(paragraph);

        const fits = (candidate) => {
            textSpan.textContent = candidate;
            button.textContent = COLLAPSED_LABEL;
            button.classList.remove("hidden");

            return paragraph.scrollHeight <= maxHeight + 1;
        };

        if (fits(fullText)) {
            return null;
        }

        let low = 0;
        let high = fullText.length;
        let best = "";

        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const candidate = fullText.slice(0, mid).trimEnd();

            if (fits(candidate)) {
                best = candidate;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }

        if (!best) {
            return fullText;
        }

        const splitByWord = best.lastIndexOf(" ");
        let collapsed = splitByWord > 0 ? best.slice(0, splitByWord).trimEnd() : best;

        while (collapsed && !fits(collapsed)) {
            const nextSplit = collapsed.lastIndexOf(" ");
            collapsed = nextSplit > 0 ? collapsed.slice(0, nextSplit).trimEnd() : "";
        }

        return collapsed || best;
    };

    const renderCollapsed = (item) => {
        item.textSpan.textContent = item.collapsedText || item.fullText;
        item.button.textContent = COLLAPSED_LABEL;
        item.button.setAttribute("aria-expanded", "false");
        item.button.classList.toggle("hidden", !item.isTruncatable);
    };

    const renderExpanded = (item) => {
        item.textSpan.textContent = item.fullText;
        item.button.textContent = EXPANDED_LABEL;
        item.button.setAttribute("aria-expanded", "true");
        item.button.classList.toggle("hidden", !item.isTruncatable);
    };

    const recalculateItem = (item) => {
        item.fullText = normalizeText(item.textSpan.dataset.fullText || item.textSpan.textContent || "");
        item.textSpan.dataset.fullText = item.fullText;

        item.collapsedText = getCollapsedText(item);
        item.isTruncatable = Boolean(item.collapsedText && item.collapsedText.length < item.fullText.length);

        if (!item.isTruncatable) {
            item.isExpanded = false;
            item.textSpan.textContent = item.fullText;
            item.button.classList.add("hidden");
            item.button.setAttribute("aria-expanded", "false");
            return;
        }

        if (item.isExpanded) {
            renderExpanded(item);
            return;
        }

        renderCollapsed(item);
    };

    const init = () => {
        const paragraphs = document.querySelectorAll("[data-readmore-paragraph]");

        paragraphs.forEach((paragraph) => {
            if (paragraph.dataset.readmoreBound === "true") {
                return;
            }

            const textSpan = paragraph.querySelector("[data-readmore-text]");
            const button = paragraph.querySelector("[data-readmore-toggle]");

            if (!textSpan || !button) {
                return;
            }

            const item = {
                paragraph,
                textSpan,
                button,
                fullText: "",
                collapsedText: "",
                isTruncatable: false,
                isExpanded: false,
            };

            paragraph.dataset.readmoreBound = "true";

            button.addEventListener("click", () => {
                if (!item.isTruncatable) {
                    return;
                }

                item.isExpanded = !item.isExpanded;

                if (item.isExpanded) {
                    renderExpanded(item);
                    return;
                }

                renderCollapsed(item);
            });

            items.push(item);
            recalculateItem(item);
        });
    };

    let resizeTicking = false;

    window.addEventListener("resize", () => {
        if (resizeTicking) {
            return;
        }

        resizeTicking = true;
        window.requestAnimationFrame(() => {
            items.forEach(recalculateItem);
            resizeTicking = false;
        });
    });

    document.addEventListener("DOMContentLoaded", () => {
        init();

        // Re-run once so cards cloned by the carousel receive bindings as well.
        window.requestAnimationFrame(() => {
            init();
            items.forEach(recalculateItem);
        });
    });

    document.addEventListener("readmore:refresh", () => {
        init();
        items.forEach(recalculateItem);
    });
})();
