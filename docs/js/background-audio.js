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

function cancelSortingHatWelcomeAudio() {
    sortingHatAudioCancelled = true;

    const audio = document.getElementById("background-audio-2");

    if (!(audio instanceof HTMLAudioElement)) {
        return;
    }

    audio.pause();
    audio.currentTime = 0;
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
        if (sortingHatAudioCancelled) {
            return;
        }

        sortingHatAudioDelayElapsed = true;
        tryStartSortingHatAudio();
    }, SORTING_HAT_AUDIO_DELAY_MS);
}

window.unlockBackgroundAudio = unlockBackgroundAudio;
window.cancelSortingHatWelcomeAudio = cancelSortingHatWelcomeAudio;
window.switchSortingHatImageNow = switchSortingHatImageNow;

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
