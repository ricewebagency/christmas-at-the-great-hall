import { getInvitationData, sendAttendanceResponse } from './api-client.js';

function getRandomExitDelayMs() {
    const delayOptionsMs = [400, 800, 1200, 1600, 2000];
    const index = Math.floor(Math.random() * delayOptionsMs.length);
    return delayOptionsMs[index];
}

function wait(ms) {
    return new Promise((resolve) => {
        window.setTimeout(resolve, ms);
    });
}

async function playRevealExitSequence(root = document) {
    const revealItems = Array.from(root.querySelectorAll('[data-reveal]'));
    if (!revealItems.length) {
        return;
    }

    const animationDurationMs = 800;
    let maxDelayMs = 0;

    revealItems.forEach((element) => {
        const delayMs = getRandomExitDelayMs();
        maxDelayMs = Math.max(maxDelayMs, delayMs);

        element.style.animation = 'none';
        void element.offsetWidth;

        element.style.animation = `revealFade ${animationDurationMs}ms ease-in forwards`;
        element.style.animationDelay = `${delayMs}ms`;
        element.style.animationDirection = 'reverse';
        element.style.animationFillMode = 'both';
    });

    await wait(maxDelayMs + animationDurationMs);
}

async function populateGuestName() {
    const guestNameEl = document.getElementById('guest-name');
    if (!guestNameEl) {
        return;
    }

    try {
        const invitation = await getInvitationData();
        if (invitation && invitation.guestName) {
            guestNameEl.textContent = invitation.guestName;
        }
    } catch {
        // Keep fallback text when API data is unavailable.
    }
}

function initDishSelectionLimit() {
    const dishCheckboxes = Array.from(document.querySelectorAll('.rsvp-checkbox'));

    if (!dishCheckboxes.length) {
        return;
    }

    const limit = 2;

    const updateCheckboxState = () => {
        const checkedCount = dishCheckboxes.filter((checkbox) => checkbox.checked).length;

        dishCheckboxes.forEach((checkbox) => {
            const shouldDisable = checkedCount >= limit && !checkbox.checked;
            checkbox.disabled = shouldDisable;
        });
    };

    dishCheckboxes.forEach((checkbox) => {
        checkbox.addEventListener('change', () => {
            const checkedCount = dishCheckboxes.filter((item) => item.checked).length;

            if (checkedCount > limit) {
                checkbox.checked = false;
            }

            updateCheckboxState();
        });
    });

    updateCheckboxState();
}

function initRsvpFormSubmission() {
    const form = document.querySelector('form');
    if (!form) {
        return;
    }

    const responseInput = form.querySelector('#attendance-response');
    const submitButton = form.querySelector('button[type="submit"]');
    const rsvpRoot = document.getElementById('rsvp-root') || document;
    const burntPaper = document.querySelector('.burnt-paper-fade-out');
    let isSubmitting = false;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (isSubmitting) {
            return;
        }

        if (!responseInput || !(responseInput instanceof HTMLInputElement)) {
            return;
        }

        const attendanceResponse = responseInput.value.trim();
        if (!attendanceResponse) {
            responseInput.focus();
            return;
        }

        if (burntPaper) {
            burntPaper.classList.remove('burnt-paper-fade-out');
            void burntPaper.offsetWidth;
            burntPaper.classList.add('burnt-paper-fade-out');
        }

        isSubmitting = true;

        if (submitButton instanceof HTMLButtonElement) {
            submitButton.disabled = true;
            submitButton.classList.add('opacity-60', 'pointer-events-none');
        }

        try {
            await playRevealExitSequence(rsvpRoot);
            await sendAttendanceResponse(attendanceResponse);
            window.location.assign('./sorting/');
        } catch {
            isSubmitting = false;
            if (burntPaper) {
                burntPaper.classList.remove('burnt-paper-fade-out');
            }
            window.dispatchEvent(new Event('reveal-sequence:start'));
            if (submitButton instanceof HTMLButtonElement) {
                submitButton.disabled = false;
                submitButton.classList.remove('opacity-60', 'pointer-events-none');
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    void populateGuestName();
    initDishSelectionLimit();
    initRsvpFormSubmission();
});
