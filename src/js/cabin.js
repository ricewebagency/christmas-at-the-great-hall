import { getCabinData, sendCabinDishSelection } from './api-client.js';

const DEFAULT_CABIN_IMAGE = './assets/images/hogwarts-express-cabin-front-gryffindor.png';
const BACKDROP_SELECTOR = '[data-cabin-backdrop]';
const ARRIVAL_AUDIO_SELECTOR = '[data-arrival-audio]';
const TROLLEY_AUDIO_SELECTOR = '[data-trolley-audio]';
const TROLLEY_IMAGE_SELECTOR = '[data-trolley-witch]';
const PARCHMENT_SELECTOR = '[data-parchment-container]';
const PARCHMENT_REVEAL_SELECTOR = '[data-parchment-reveal]';
const SCREEN_LOADER_SELECTOR = '[data-screen-loader]';
const TRAIN_SHAKE_SELECTOR = '[data-train-shake]';
const DISH_INTRO_PANEL_SELECTOR = '[data-dish-intro-panel]';
const DISH_INTRO_SELECTOR = '[data-dish-intro]';
const DISH_PANEL_SELECTOR = '[data-dish-panel]';
const DISH_CHOICE_SELECTOR = '[data-dish-choice]';
const DISH_CONFIRM_SELECTOR = '[data-dish-confirm]';
const DISH_SELECTION_STORAGE_KEY = 'magical-winter-banquet.cabin-dish-selection';
const DISH_SELECTION_LIMIT = 2;
const CABIN_CONFIRM_REDIRECT_PATH = './chamber';
const CABIN_EXIT_FADE_DURATION_MS = 1300;
const CABIN_SCREEN_LOADER_DURATION_MS = 2200;

function getTickPauseShakeValues(cycle, intensity = 1) {
    let x = 0;
    let y = 0;

    if (cycle < 0.28) {
        const t = cycle / 0.28;
        x = 0.18 * intensity * t;
        y = -0.8 * intensity * t;
    } else if (cycle < 0.52) {
        const t = (cycle - 0.28) / (0.52 - 0.28);
        x = (-0.24 + (0.12 * t)) * intensity;
        y = (0.7 - (1.0 * t)) * intensity;
    } else if (cycle < 0.8) {
        const t = (cycle - 0.52) / (0.8 - 0.52);
        x = (0.08 * (1 - t)) * intensity;
        y = (-0.3 * (1 - t)) * intensity;
    } else if (cycle < 1.08) {
        const t = (cycle - 0.8) / (1.08 - 0.8);
        x = (-0.14 * t) * intensity;
        y = (0.55 * t) * intensity;
    } else if (cycle < 1.36) {
        const t = (cycle - 1.08) / (1.36 - 1.08);
        x = (0.05 * (1 - t)) * intensity;
        y = (-0.2 * (1 - t)) * intensity;
    } else if (cycle < 1.64) {
        const t = (cycle - 1.36) / (1.64 - 1.36);
        x = (-0.1 * t) * intensity;
        y = (0.35 * t) * intensity;
    } else {
        const t = Math.min((cycle - 1.64) / 0.76, 1);
        const eased = 1 - Math.pow(1 - t, 2);
        x = (0.05 * (1 - eased)) * intensity;
        y = (0.18 * (1 - eased)) * intensity;
    }

    return { x, y };
}

function initShakeAnimation(element, intensity = 1, delaySeconds = 0) {
    if (!(element instanceof HTMLElement)) {
        return;
    }

    let start = performance.now();

    const animate = (timestamp) => {
        const elapsed = (timestamp - start) / 1000 - delaySeconds;
        const cycle = elapsed < 0 ? 0 : elapsed % 2.4;
        const { x, y } = getTickPauseShakeValues(cycle, intensity);

        element.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
        window.requestAnimationFrame(animate);
    };

    window.requestAnimationFrame(animate);
}

function initTrainShake() {
    const trainShakeEl = document.querySelector(TRAIN_SHAKE_SELECTOR);
    initShakeAnimation(trainShakeEl, 1);
}

function initCabinFrontShake() {
    const cabinFrontEl = document.querySelector(BACKDROP_SELECTOR);
    initShakeAnimation(cabinFrontEl, 0.5, 0.2);
}

function getCabinBackdropElement() {
    const backdropEl = document.querySelector(BACKDROP_SELECTOR);
    return backdropEl instanceof HTMLElement ? backdropEl : null;
}

function getParchmentElement() {
    const parchmentEl = document.querySelector(PARCHMENT_SELECTOR);
    return parchmentEl instanceof HTMLElement ? parchmentEl : null;
}

function initArrivalAudio() {
    const arrivalAudio = document.querySelector(ARRIVAL_AUDIO_SELECTOR);

    if (!(arrivalAudio instanceof HTMLAudioElement)) {
        return;
    }

    arrivalAudio.volume = 0.5;
    arrivalAudio.muted = false;

    void arrivalAudio.play().catch(() => {
        // Browsers may block autoplay until a user interaction; the audio element is still configured correctly.
    });
}

function initScreenLoader() {
    const loaderEl = document.querySelector(SCREEN_LOADER_SELECTOR);

    if (!(loaderEl instanceof HTMLElement)) {
        return;
    }

    loaderEl.addEventListener('animationend', () => {
        loaderEl.remove();
    }, { once: true });

    window.setTimeout(() => {
        loaderEl.remove();
    }, CABIN_SCREEN_LOADER_DURATION_MS + 250);
}

function initTrainAudio() {
    const trainAudio = document.querySelector('[data-train-audio]');

    if (!(trainAudio instanceof HTMLAudioElement)) {
        return;
    }

    trainAudio.volume = 0.05;
    trainAudio.muted = false;

    void trainAudio.play().catch(() => {
        // Browsers may block autoplay until a user interaction; the audio element is still configured correctly.
    });
}

function revealParchment() {
    const parchmentEl = getParchmentElement();

    if (!(parchmentEl instanceof HTMLElement)) {
        return;
    }

    // Remove hidden to allow rendering
    parchmentEl.classList.remove('hidden');
    parchmentEl.classList.add('flex', 'opacity-0');
    
    // Force reflow so browser registers the opacity-0 state
    void parchmentEl.offsetHeight;
    
    // Now remove opacity-0 and add animation
    parchmentEl.classList.remove('opacity-0');
    parchmentEl.classList.add('animate-fadeIn1800');
}

function getSavedDishSelection() {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const storedValue = window.localStorage.getItem(DISH_SELECTION_STORAGE_KEY);

        if (!storedValue) {
            return [];
        }

        const parsedValue = JSON.parse(storedValue);

        if (!Array.isArray(parsedValue)) {
            return [];
        }

        return parsedValue.filter((value) => typeof value === 'string' && value.trim().length > 0).slice(0, DISH_SELECTION_LIMIT);
    } catch {
        return [];
    }
}

function persistDishSelection(selectedDishIds) {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.localStorage.setItem(DISH_SELECTION_STORAGE_KEY, JSON.stringify(selectedDishIds));
    } catch {
        // Ignore storage restrictions and keep the page interaction usable.
    }
}

function fadeOutBodyAndNavigate(destination, durationMs = CABIN_EXIT_FADE_DURATION_MS) {
    if (typeof window === 'undefined' || !destination) {
        return;
    }

    const body = document.body;

    if (!(body instanceof HTMLElement)) {
        window.location.assign(destination);
        return;
    }

    body.style.transitionProperty = 'opacity';
    body.style.transitionDuration = `${durationMs}ms`;
    body.style.transitionTimingFunction = 'ease';
    body.style.opacity = '1';

    window.requestAnimationFrame(() => {
        body.style.opacity = '0';
    });

    window.setTimeout(() => {
        window.location.assign(destination);
    }, durationMs);
}

function initDishSelection() {
    const introPanel = document.querySelector(DISH_INTRO_PANEL_SELECTOR);
    const introButton = document.querySelector(DISH_INTRO_SELECTOR);
    const dishPanel = document.querySelector(DISH_PANEL_SELECTOR);
    const dishButtons = Array.from(document.querySelectorAll(DISH_CHOICE_SELECTOR));
    const dishConfirmButton = document.querySelector(DISH_CONFIRM_SELECTOR);

    if (
        !(introPanel instanceof HTMLElement) ||
        !(introButton instanceof HTMLButtonElement) ||
        !(dishPanel instanceof HTMLElement) ||
        !dishButtons.length ||
        !(dishConfirmButton instanceof HTMLButtonElement)
    ) {
        return;
    }

    const selectedDishIds = new Set(getSavedDishSelection());
    let isSubmittingSelection = false;

    const syncDishButtonState = (button) => {
        const dishId = button.dataset.dishChoice || '';
        const isSelected = selectedDishIds.has(dishId);
        const shouldDisable = !isSelected && selectedDishIds.size >= DISH_SELECTION_LIMIT;

        button.setAttribute('aria-pressed', String(isSelected));
        button.toggleAttribute('disabled', shouldDisable);
        button.classList.toggle('opacity-100', isSelected);
        button.classList.toggle('opacity-70', !isSelected && !shouldDisable);
        button.classList.toggle('opacity-35', shouldDisable);
        button.classList.toggle('pointer-events-none', shouldDisable);
    };

    const syncDishState = () => {
        dishButtons.forEach((button) => {
            if (button instanceof HTMLButtonElement) {
                syncDishButtonState(button);
            }
        });

        dishConfirmButton.disabled = selectedDishIds.size === 0;

        if (selectedDishIds.size === 0) {
            dishConfirmButton.classList.add('opacity-35', 'pointer-events-none');
        } else {
            dishConfirmButton.classList.remove('opacity-35', 'pointer-events-none');
        }
    };

    const revealDishPanel = () => {
        if (dishPanel.classList.contains('opacity-100')) {
            return;
        }

        introPanel.classList.add('opacity-0');
        introPanel.classList.add('pointer-events-none');

        introPanel.addEventListener('transitionend', () => {
            introPanel.classList.add('hidden');

            dishPanel.classList.remove('hidden');
            window.requestAnimationFrame(() => {
                dishPanel.classList.remove('translate-y-1');
                dishPanel.classList.add('opacity-100', 'pointer-events-auto');
            });
        }, { once: true });

        dishPanel.classList.remove('pointer-events-none');
    };

    introButton.addEventListener('click', () => {
        introButton.classList.add('pointer-events-none', 'opacity-0');
        revealDishPanel();
    });

    dishButtons.forEach((button) => {
        if (!(button instanceof HTMLButtonElement)) {
            return;
        }

        button.addEventListener('click', () => {
            const dishId = button.dataset.dishChoice || '';

            if (!dishId) {
                return;
            }

            if (selectedDishIds.has(dishId)) {
                selectedDishIds.delete(dishId);
                persistDishSelection(Array.from(selectedDishIds));
                syncDishState();
                return;
            }

            if (selectedDishIds.size >= DISH_SELECTION_LIMIT) {
                return;
            }

            selectedDishIds.add(dishId);
            persistDishSelection(Array.from(selectedDishIds));
            syncDishState();
        });
    });

    dishConfirmButton.addEventListener('click', async () => {
        if (selectedDishIds.size === 0 || isSubmittingSelection) {
            return;
        }

        isSubmittingSelection = true;
        const dishSelection = Array.from(selectedDishIds);
        persistDishSelection(dishSelection);

        dishConfirmButton.disabled = true;
        dishConfirmButton.classList.add('opacity-35', 'pointer-events-none');

        try {
            await sendCabinDishSelection({ dishSelection });
        } catch (error) {
            console.warn('Dish selection API update failed; continuing with stored selection.', error);
        }

        dishConfirmButton.blur();
        fadeOutBodyAndNavigate(CABIN_CONFIRM_REDIRECT_PATH);
    });

    syncDishState();
}

function initTrolleyArrival() {
    const trolleyAudio = document.querySelector(TROLLEY_AUDIO_SELECTOR);
    const trolleyImage = document.querySelector(TROLLEY_IMAGE_SELECTOR);

    if (!(trolleyAudio instanceof HTMLAudioElement) || !(trolleyImage instanceof HTMLElement)) {
        return;
    }

    trolleyAudio.muted = false;
    trolleyAudio.volume = 1;

    window.setTimeout(() => {
        void trolleyAudio.play().catch(() => {
            // Browsers may block playback until interaction; keep visual timing intact.
        });
    }, 2000);

    window.setTimeout(() => {
        trolleyImage.classList.remove('translate-x-full');
        trolleyImage.classList.add('translate-x-[50px]');

        trolleyImage.addEventListener('transitionend', () => {
            window.setTimeout(() => {
                revealParchment();
            }, 1000);
        }, { once: true });
    }, 3000);
}

function applyCabinBackdrop(imageUrl) {
    const backdropEl = getCabinBackdropElement();

    if (!(backdropEl instanceof HTMLElement)) {
        return;
    }

    backdropEl.style.backgroundImage = `url("${imageUrl}")`;
}

async function initCabinBackdrop() {
    const fallbackImage = DEFAULT_CABIN_IMAGE;

    try {
        const cabinData = await getCabinData();
        const imagePath = cabinData?.cabinFrontImage || fallbackImage;

        applyCabinBackdrop(imagePath);
    } catch (error) {
        console.warn('Falling back to the default cabin front image.', error);
        applyCabinBackdrop(fallbackImage);
    }
}

if (typeof document === 'undefined') {
    void 0;
} else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initArrivalAudio();
        initTrainAudio();
        initScreenLoader();
        initTrainShake();
        initCabinFrontShake();
        initCabinBackdrop();
        initDishSelection();
    }, { once: true });

    window.addEventListener('load', initTrolleyArrival, { once: true });
} else {
    initArrivalAudio();
    initTrainAudio();
    initScreenLoader();
    initTrainShake();
    initCabinFrontShake();
    initCabinBackdrop();
    initDishSelection();

    if (document.readyState === 'complete') {
        initTrolleyArrival();
    } else {
        window.addEventListener('load', initTrolleyArrival, { once: true });
    }
}
