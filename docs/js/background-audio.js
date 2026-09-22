function unlockBackgroundAudio() {
    const audio = document.getElementById("background-audio");

    if (!audio) {
        return Promise.resolve(false);
    }

    audio.muted = false;
    audio.volume = 0.28;

    return audio.play().then(() => {
        window.audioIsEnabled = true;
        return true;
    }).catch((error) => {
        console.info("Background audio autoplay was blocked by the browser.", error);
        return false;
    });
}

function getAudioSourceFromElement(audio) {
    if (audio.currentSrc) {
        return audio.currentSrc;
    }

    const sourceElement = audio.querySelector("source[src]");

    if (sourceElement instanceof HTMLSourceElement) {
        return sourceElement.getAttribute("src") ?? "";
    }

    return audio.getAttribute("src") ?? "";
}

const SORTING_HAT_WELCOME_AUDIO_SOURCE = './assets/music/sorting-hat/sorting-hat-welcome.mp3';

const SORTING_HAT_IMAGE_SOURCES = [
    './assets/images/sorting-hat-talking-1.png',
    './assets/images/sorting-hat-talking-5.png',
    './assets/images/sorting-hat-talking-6.png'
];

const SORTING_HAT_AUDIO_DELAY_MS = 1;
const SORTING_HAT_IMAGE_CYCLE_MIN_MS = 100;
const SORTING_HAT_IMAGE_CYCLE_MAX_MS = 400;
const SORTING_HAT_IMAGE_CYCLE_DURATION_MS = 11000;

let sortingHatAudioDelayElapsed = false;
let sortingHatAudioStarted = false;
let sortingHatAudioCancelled = false;
let sortingHatImageCycleCancelled = false;
let sortingHatImageCycleTimeoutId = null;
let sortingHatWelcomeAudio = null;

function getSortingHatWelcomeAudio() {
    if (sortingHatWelcomeAudio instanceof HTMLAudioElement) {
        return sortingHatWelcomeAudio;
    }

    sortingHatWelcomeAudio = new Audio(SORTING_HAT_WELCOME_AUDIO_SOURCE);
    sortingHatWelcomeAudio.src = SORTING_HAT_WELCOME_AUDIO_SOURCE;
    sortingHatWelcomeAudio.preload = 'auto';

    return sortingHatWelcomeAudio;
}

function cancelSortingHatWelcomeAudio() {
    sortingHatAudioCancelled = true;

    const audio = getSortingHatWelcomeAudio();

    if (!(audio instanceof HTMLAudioElement)) {
        return;
    }

    audio.pause();
    audio.currentTime = 0;

    if (typeof window.clearSortingHatSubtitle === "function") {
        window.clearSortingHatSubtitle();
    }
}

function cancelSortingHatImageCycle() {
    sortingHatImageCycleCancelled = true;

    if (sortingHatImageCycleTimeoutId !== null) {
        window.clearTimeout(sortingHatImageCycleTimeoutId);
        sortingHatImageCycleTimeoutId = null;
    }
}

function getNextSortingHatImageSource(currentSource) {
    const candidates = SORTING_HAT_IMAGE_SOURCES.filter((source) => source !== currentSource);
    const pool = candidates.length > 0 ? candidates : SORTING_HAT_IMAGE_SOURCES;
    const randomIndex = Math.floor(Math.random() * pool.length);

    return pool[randomIndex];
}

function switchSortingHatImageNow() {
    const image = document.getElementById("sorting-hat-image");

    if (!(image instanceof HTMLImageElement)) {
        return;
    }

    image.src = getNextSortingHatImageSource(image.getAttribute("src") ?? "");
}

function startSortingHatImageCycle() {
    const image = document.getElementById("sorting-hat-image");

    if (!(image instanceof HTMLImageElement)) {
        return;
    }

    cancelSortingHatImageCycle();
    sortingHatImageCycleCancelled = false;

    const startedAt = Date.now();

    const scheduleNextSwap = () => {
        if (sortingHatImageCycleCancelled) {
            return;
        }

        const elapsed = Date.now() - startedAt;
        const remaining = SORTING_HAT_IMAGE_CYCLE_DURATION_MS - elapsed;

        if (remaining < SORTING_HAT_IMAGE_CYCLE_MIN_MS) {
            return;
        }

        const maxDelay = Math.min(SORTING_HAT_IMAGE_CYCLE_MAX_MS, remaining);
        const delay = SORTING_HAT_IMAGE_CYCLE_MIN_MS + Math.random() * (maxDelay - SORTING_HAT_IMAGE_CYCLE_MIN_MS);

        sortingHatImageCycleTimeoutId = window.setTimeout(() => {
            if (sortingHatImageCycleCancelled) {
                return;
            }

            switchSortingHatImageNow();
            scheduleNextSwap();
        }, delay);
    };

    scheduleNextSwap();
}

function tryStartSortingHatAudio() {
    if (sortingHatAudioCancelled || sortingHatAudioStarted || !sortingHatAudioDelayElapsed) {
        return;
    }

    const audio = getSortingHatWelcomeAudio();

    if (!(audio instanceof HTMLAudioElement)) {
        return;
    }

    sortingHatAudioStarted = true;

    const source = SORTING_HAT_WELCOME_AUDIO_SOURCE;

    Promise.resolve(
        typeof window.showSortingHatSubtitleForSource === "function"
            ? window.showSortingHatSubtitleForSource(source)
            : undefined
    ).then(() => {
        if (sortingHatAudioCancelled) {
            sortingHatAudioStarted = false;
            return;
        }

        audio.addEventListener("ended", () => {
            if (typeof window.clearSortingHatSubtitle === "function") {
                window.clearSortingHatSubtitle();
            }
        }, { once: true });

        return audio.play().then(() => {
            startSortingHatImageCycle();
        });
    }).catch((error) => {
        sortingHatAudioStarted = false;

        if (typeof window.clearSortingHatSubtitle === "function") {
            window.clearSortingHatSubtitle();
        }

        console.info("Sorting audio autoplay was blocked by the browser.", error);
    });
}

function playDelayedSortingAudio() {
    window.setTimeout(() => {
        if (sortingHatAudioCancelled) {
            return;
        }

        sortingHatAudioDelayElapsed = true;
        tryStartSortingHatAudio();
    }, SORTING_HAT_AUDIO_DELAY_MS);
}

function playSortingHatWelcomeAudio() {
    sortingHatAudioDelayElapsed = true;
    tryStartSortingHatAudio();
}

window.audioIsEnabled = false;
window.unlockBackgroundAudio = unlockBackgroundAudio;
window.cancelSortingHatWelcomeAudio = cancelSortingHatWelcomeAudio;
window.cancelSortingHatImageCycle = cancelSortingHatImageCycle;
window.switchSortingHatImageNow = switchSortingHatImageNow;
window.playDelayedSortingAudio = playDelayedSortingAudio;
window.playSortingHatWelcomeAudio = playSortingHatWelcomeAudio;
window.tryStartSortingHatAudio = tryStartSortingHatAudio;

document.addEventListener("DOMContentLoaded", () => {
    const audio = document.getElementById("background-audio");

    if (!audio) {
        return;
    }

    const maybeStartAudio = () => {
        if (window.audioIsEnabled) {
            tryStartSortingHatAudio();
            return;
        }

        void unlockBackgroundAudio().then((unlocked) => {
            if (unlocked) {
                tryStartSortingHatAudio();
            }
        });
    };

    document.addEventListener("pointerdown", maybeStartAudio);
    document.addEventListener("keydown", maybeStartAudio);
});
