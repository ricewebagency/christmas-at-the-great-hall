function unlockBackgroundAudio() {
    const audio = document.getElementById("background-audio");

    if (!audio) {
        return Promise.resolve(false);
    }

    audio.muted = false;
    audio.volume = 0.28;

    return audio.play().then(() => true).catch((error) => {
        console.info("Background audio autoplay was blocked by the browser.", error);
        return false;
    });
}

const SORTING_HAT_IMAGE_SOURCES = [
    './assets/images/sorting-hat-talking-1.png',
    './assets/images/sorting-hat-talking-3.png',
    './assets/images/sorting-hat-talking-5.png',
    './assets/images/sorting-hat-talking-6.png',
    './assets/images/sorting-hat-talking-7.png'
];
const SORTING_HAT_AUDIO_DELAY_MS = 1;
const SORTING_HAT_IMAGE_CYCLE_MIN_MS = 1000;
const SORTING_HAT_IMAGE_CYCLE_MAX_MS = 3500;
const SORTING_HAT_IMAGE_CYCLE_DURATION_MS = 12000;

let sortingHatAudioDelayElapsed = false;
let sortingHatAudioStarted = false;

function getNextSortingHatImageSource(currentSource) {
    const candidates = SORTING_HAT_IMAGE_SOURCES.filter((source) => source !== currentSource);
    const pool = candidates.length > 0 ? candidates : SORTING_HAT_IMAGE_SOURCES;
    const randomIndex = Math.floor(Math.random() * pool.length);

    return pool[randomIndex];
}

function startSortingHatImageCycle() {
    const image = document.getElementById("sorting-hat-image");

    if (!(image instanceof HTMLImageElement)) {
        return;
    }

    const startedAt = Date.now();

    const scheduleNextSwap = () => {
        const elapsed = Date.now() - startedAt;
        const remaining = SORTING_HAT_IMAGE_CYCLE_DURATION_MS - elapsed;

        if (remaining < SORTING_HAT_IMAGE_CYCLE_MIN_MS) {
            return;
        }

        const maxDelay = Math.min(SORTING_HAT_IMAGE_CYCLE_MAX_MS, remaining);
        const delay = SORTING_HAT_IMAGE_CYCLE_MIN_MS + Math.random() * (maxDelay - SORTING_HAT_IMAGE_CYCLE_MIN_MS);

        window.setTimeout(() => {
            image.src = getNextSortingHatImageSource(image.getAttribute("src") ?? "");
            scheduleNextSwap();
        }, delay);
    };

    scheduleNextSwap();
}

function tryStartSortingHatAudio() {
    if (sortingHatAudioStarted || !sortingHatAudioDelayElapsed) {
        return;
    }

    const audio = document.getElementById("background-audio-2");

    if (!(audio instanceof HTMLAudioElement)) {
        return;
    }

    sortingHatAudioStarted = true;

    audio.play().then(() => {
        startSortingHatImageCycle();
    }).catch((error) => {
        sortingHatAudioStarted = false;
        console.info("Sorting audio autoplay was blocked by the browser.", error);
    });
}

function playDelayedSortingAudio() {
    window.setTimeout(() => {
        sortingHatAudioDelayElapsed = true;
        tryStartSortingHatAudio();
    }, SORTING_HAT_AUDIO_DELAY_MS);
}

window.unlockBackgroundAudio = unlockBackgroundAudio;

document.addEventListener("DOMContentLoaded", () => {
    const audio = document.getElementById("background-audio");

    if (!audio) {
        return;
    }

    const maybeStartAudio = () => {
        void unlockBackgroundAudio();
        tryStartSortingHatAudio();
    };

    document.addEventListener("pointerdown", maybeStartAudio);
    document.addEventListener("keydown", maybeStartAudio);

    void unlockBackgroundAudio();
    playDelayedSortingAudio();
});
