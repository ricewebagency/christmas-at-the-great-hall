const BASILISK_FRAME_SOURCES = [
    './assets/images/chamber/basilisk-stale-1.png',
    './assets/images/chamber/basilisk-stale-2.png',
    './assets/images/chamber/basilisk-taunt-1.png',
    './assets/images/chamber/basilisk-stale-1.png'
];

const BASILISK_HISS_AUDIO_SOURCE = './assets/music/chamber/snake-hiss-1.mp3';
const BASILISK_SECOND_HISS_AUDIO_SOURCE = './assets/music/chamber/snake-hiss-2.mp3';
const BASILISK_TAUNT_FRAME_SOURCE = './assets/images/chamber/basilisk-taunt-1.png';
const BASILISK_ENCHANTED_FRAME_SOURCE = './assets/images/chamber/basilisk-enchanted-1.png';
const BASILISK_ENCHANTED_FINAL_FRAME_SOURCE = './assets/images/chamber/basilisk-enchanted-2.png';
const BASILISK_SPELL_AUDIO_SOURCE_BY_DEPARTMENT = {
    hufflepuff: './assets/music/chamber/cedric-sectum.mp3',
    ravenclaw: './assets/music/chamber/luna-sectum.mp3',
    gryffindor: './assets/music/chamber/harry-sectum.mp3',
    slytherin: './assets/music/chamber/voldemort-avada.mp3'
};

const BASILISK_APPEAR_DELAY_MS = 2000;
const BASILISK_FRAME_STEP_MS = 320;
const BASILISK_FADE_IN_MS = 420;
const BASILISK_HISS_DELAY_MS = 200;
const BASILISK_BACKDROP_DELAY_MS = BASILISK_FRAME_STEP_MS * 3 + 50;
const BASILISK_BACKDROP_FADE_MS = 1800;
const BASILISK_CHATBOX_DELAY_MS = BASILISK_BACKDROP_FADE_MS;
const BASILISK_CONTINUE_DELAY_MS = 600;
const BASILISK_DIALOGUE_GROUP_REENTRY_DELAY_MS = BASILISK_FADE_IN_MS + 320;
const BASILISK_STAFF_FADE_IN_MS = 800;
const BASILISK_STAFF_SPELL_CAST_MS = 2400;
const BASILISK_SPELL_PARTICLE_COUNT = 96;
const BASILISK_DARK_SPELL_PARTICLE_COUNT = 168;
const BASILISK_SPELL_PARTICLE_DELAY_MS = 420;
const BASILISK_SLASH_FRAME_STEP_MS = 120;
const BASILISK_SLASH_FRAME_HOLD_MS = 180;
const BASILISK_TAUNT_DELAY_MS = 300;
const BASILISK_ENCHANTED_TRANSITION_LEAD_MS = 4000;
const BASILISK_FINAL_BACKDROP_FADE_IN_MS = 3000;
const BASILISK_FINAL_BASILISK_FADE_TOTAL_DELAY_MS = 1500;
const CABIN_STORAGE_KEY = 'magical-winter-banquet.cabin';
const CABIN_COOKIE_NAME = 'magical-winter-banquet.cabin';
const CABIN_DEPARTMENTS = ['gryffindor', 'hufflepuff', 'ravenclaw', 'slytherin'];
const STAFF_SOURCE_BY_DEPARTMENT = {
    gryffindor: './assets/images/chamber/staff-gryffindor.png',
    hufflepuff: './assets/images/chamber/staff-hufflepuff.png',
    ravenclaw: './assets/images/chamber/staff-ravenclaw.png',
    slytherin: './assets/images/chamber/staff-slytherin.png'
};
const BASILISK_PRELOADS = [
    ...BASILISK_FRAME_SOURCES.map(preloadImage),
    preloadImage(BASILISK_ENCHANTED_FRAME_SOURCE),
    preloadImage('./assets/images/chamber/basilisk-enchanted-2.png'),
    preloadImage('./assets/images/chatbox.png')
];

async function loadBasiliskDialogue() {
    try {
        const response = await fetch('./assets/files/chamber-dialogues.json');

        if (!response.ok) {
            throw new Error(`Failed to load chamber dialogues: ${response.status}`);
        }

        const data = await response.json();
        const groups = data?.groups;

        if (!Array.isArray(groups)) {
            throw new Error('Invalid chamber dialogues payload: expected groups array.');
        }

        const encounterGroup = groups.find((group) => Number(group?.groupId) === 1);
        const secondGroup = groups.find((group) => Number(group?.groupId) === 2);
        const thirdGroup = groups.find((group) => Number(group?.groupId) === 3);
        const fourthGroup = groups.find((group) => Number(group?.groupId) === 4);
        const fifthGroup = groups.find((group) => Number(group?.groupId) === 5);

        return {
            encounterDialogues: Array.isArray(encounterGroup?.dialogues) ? encounterGroup.dialogues : [],
            secondGroupDialogues: Array.isArray(secondGroup?.dialogues) ? secondGroup.dialogues : [],
            thirdGroupDialogues: Array.isArray(thirdGroup?.dialogues) ? thirdGroup.dialogues : [],
            fourthGroupDialogues: Array.isArray(fourthGroup?.dialogues) ? fourthGroup.dialogues : [],
            fifthGroupDialogues: Array.isArray(fifthGroup?.dialogues) ? fifthGroup.dialogues : []
        };
    } catch (error) {
        console.warn('Unable to load basilisk dialogue groups.', error);
        return {
            encounterDialogues: [],
            secondGroupDialogues: [],
            thirdGroupDialogues: [],
            fourthGroupDialogues: [],
            fifthGroupDialogues: []
        };
    }
}

function getDialogueEntry(dialogues, index) {
    return dialogues[index] ?? dialogues[dialogues.length - 1] ?? null;
}

const basiliskHissAudioBySource = Object.create(null);
let basiliskSpellAudio = null;
let basiliskSpellAudioSource = '';

function normalizeDepartment(value) {
    const normalizedDepartment = String(value ?? '').trim().toLowerCase();

    if (CABIN_DEPARTMENTS.includes(normalizedDepartment)) {
        return normalizedDepartment;
    }

    return null;
}

function readCabinCookie() {
    if (typeof document === 'undefined') {
        return null;
    }

    const cookies = document.cookie ? document.cookie.split('; ') : [];
    const matchingCookie = cookies.find((cookie) => cookie.startsWith(`${CABIN_COOKIE_NAME}=`));

    if (!matchingCookie) {
        return null;
    }

    try {
        return JSON.parse(decodeURIComponent(matchingCookie.split('=').slice(1).join('=')));
    } catch {
        return null;
    }
}

function readStoredCabinDepartment() {
    try {
        const cachedValue = window.localStorage.getItem(CABIN_STORAGE_KEY);

        if (cachedValue) {
            const parsedCache = JSON.parse(cachedValue);
            const cacheDepartment = normalizeDepartment(parsedCache?.department ?? parsedCache?.house);

            if (cacheDepartment) {
                return cacheDepartment;
            }
        }
    } catch {
        // Ignore cache parsing issues and continue to cookie fallback.
    }

    const cookieValue = readCabinCookie();
    return normalizeDepartment(cookieValue?.department ?? cookieValue?.house);
}

function preloadImage(source) {
    return new Promise((resolve) => {
        const image = new Image();

        image.addEventListener('load', () => resolve(image), { once: true });
        image.addEventListener('error', () => resolve(image), { once: true });
        image.src = source;
    });
}

function getBasiliskHissAudio(source = BASILISK_HISS_AUDIO_SOURCE) {
    if (basiliskHissAudioBySource[source] instanceof HTMLAudioElement) {
        return basiliskHissAudioBySource[source];
    }

    basiliskHissAudioBySource[source] = new Audio(source);
    basiliskHissAudioBySource[source].src = source;
    basiliskHissAudioBySource[source].preload = 'auto';

    return basiliskHissAudioBySource[source];
}

function playBasiliskHissAudio(source = BASILISK_HISS_AUDIO_SOURCE) {
    const audio = getBasiliskHissAudio(source);

    if (!(audio instanceof HTMLAudioElement)) {
        return;
    }

    audio.currentTime = 0;

    void audio.play().catch((error) => {
        console.info('Basilisk hiss audio autoplay was blocked by the browser.', error);
    });
}

function getBasiliskSpellAudio(department) {
    const source = BASILISK_SPELL_AUDIO_SOURCE_BY_DEPARTMENT[department];

    if (!source) {
        return null;
    }

    if (basiliskSpellAudio instanceof HTMLAudioElement && basiliskSpellAudioSource === source) {
        return basiliskSpellAudio;
    }

    basiliskSpellAudio = new Audio(source);
    basiliskSpellAudio.src = source;
    basiliskSpellAudio.preload = 'auto';
    basiliskSpellAudioSource = source;

    return basiliskSpellAudio;
}

function playBasiliskSpellAudio(department) {
    const audio = getBasiliskSpellAudio(department);

    if (!(audio instanceof HTMLAudioElement)) {
        return;
    }

    audio.currentTime = 0;

    void audio.play().catch((error) => {
        console.info('Basilisk spell audio autoplay was blocked by the browser.', error);
    });
}

function createBasiliskLayer() {
    const layer = document.createElement('div');

    layer.setAttribute('aria-hidden', 'true');
    layer.className = 'pointer-events-none fixed left-1/2 top-[100px] z-[3] aspect-[4/5] w-[min(62vw,34rem)] -translate-x-1/2 bg-contain bg-top bg-no-repeat opacity-0 transition-opacity ease-out';
    layer.style.transitionDuration = `${BASILISK_FADE_IN_MS}ms`;

    return layer;
}

function createBasiliskBackdrop() {
    const backdrop = document.createElement('div');

    backdrop.setAttribute('aria-hidden', 'true');
    backdrop.className = 'pointer-events-none fixed inset-0 z-[4] bg-gradient-to-b from-transparent via-black/40 to-black opacity-0';

    return backdrop;
}

function createBasiliskStaffLayer() {
    const staffLayer = document.createElement('div');

    staffLayer.setAttribute('aria-hidden', 'true');
    staffLayer.className = 'pointer-events-none fixed bottom-[212px] left-[154px] z-[5] aspect-[16/9] w-[min(64vw,44rem)] bg-contain bg-center bg-no-repeat opacity-0 transition-opacity ease-out';
    staffLayer.style.transitionDuration = `${BASILISK_STAFF_FADE_IN_MS}ms`;
    staffLayer.style.transform = 'rotate(-130deg)';
    staffLayer.style.transformOrigin = 'bottom center';

    return staffLayer;
}

function createBasiliskSpellParticlesLayer() {
    const particlesLayer = document.createElement('div');

    particlesLayer.setAttribute('aria-hidden', 'true');
    particlesLayer.className = 'pointer-events-none fixed inset-0 z-[7] overflow-hidden';

    return particlesLayer;
}

function createBasiliskChatbox(continueLabel, textContent = '') {
    const chatbox = document.createElement('div');
    const text = document.createElement('p');

    chatbox.setAttribute('aria-hidden', 'true');
    chatbox.className = "pointer-events-none fixed bottom-8 left-1/2 z-[5] flex w-[min(92vw,72rem)] -translate-x-1/2 items-center justify-center bg-[url('../assets/images/chatbox.png')] bg-contain bg-center bg-no-repeat px-[clamp(1.25rem,2.5vw,2.75rem)] pt-[clamp(1.5rem,3vw,3rem)] pb-[clamp(2.2rem,3vw,3rem)] opacity-0 transition-opacity ease-out";
    chatbox.style.transitionDuration = `${BASILISK_FADE_IN_MS}ms`;
    chatbox.style.pointerEvents = 'auto';

    text.className = 'max-w-[72ch] text-left font-inkpot text-sm leading-relaxed tracking-wide text-[#3a2413] drop-shadow-[0_1px_0_rgba(255,244,223,0.35)]';
    text.textContent = textContent;
    chatbox.appendChild(text);
    chatbox.appendChild(continueLabel);

    return chatbox;
}

function createBasiliskContinueLabel(labelText = '') {
    const label = document.createElement('button');

    label.type = 'button';
    label.setAttribute('aria-label', 'Continue basilisk dialogue');
    label.className = 'pointer-events-none absolute bottom-4 right-5 z-[6] opacity-0 transition-opacity ease-out';
    label.style.transitionDuration = `${BASILISK_FADE_IN_MS}ms`;
    label.style.pointerEvents = 'none';
    label.textContent = labelText;
    label.classList.add('font-inkpot', 'text-xs', 'tracking-wide', 'text-black/85', 'drop-shadow-[0_1px_0_rgba(255,255,255,0.18)]');

    return label;
}

function showBasiliskBackdrop(backdrop) {
    backdrop.classList.add('animate-fadeIn1800');
    backdrop.style.opacity = '1';
}

function showBasiliskChatbox(chatbox) {
    chatbox.style.opacity = '1';
}

function hideBasiliskChatbox(chatbox) {
    chatbox.style.opacity = '0';
    chatbox.style.pointerEvents = 'none';
}

function showBasiliskStaffLayer(staffLayer, department) {
    const source = STAFF_SOURCE_BY_DEPARTMENT[department];

    if (!source) {
        return;
    }

    staffLayer.style.backgroundImage = `url('${source}')`;
    staffLayer.style.opacity = '1';
}

function emitBasiliskSpellParticles(particlesLayer, originX, originY, department, onComplete) {
    const isDarkSpell = department === 'slytherin';
    const particleCount = isDarkSpell ? BASILISK_DARK_SPELL_PARTICLE_COUNT : BASILISK_SPELL_PARTICLE_COUNT;
    const shapes = isDarkSpell
        ? ['circle', 'square', 'diamond', 'spark']
        : ['circle', 'circle', 'diamond', 'spark', 'pill'];

    for (let index = 0; index < particleCount; index += 1) {
        const particle = document.createElement('span');
        const angle = Math.random() * Math.PI * 2;
        const distance = isDarkSpell ? 110 + Math.random() * 260 : 70 + Math.random() * 165;
        const deltaX = Math.cos(angle) * distance;
        const deltaY = Math.sin(angle) * distance - (isDarkSpell ? 40 : 20);
        const size = isDarkSpell ? 2.5 + Math.random() * 7.5 : 1.5 + Math.random() * 5.5;
        const duration = isDarkSpell ? 3400 + Math.random() * 2600 : 3000 + Math.random() * 2200;
        const useBlackParticle = isDarkSpell && Math.random() < 0.33;
        const hue = isDarkSpell ? 2 + Math.random() * 14 : 34 + Math.random() * 22;
        const saturation = useBlackParticle ? 0 : 96;
        const lightness = useBlackParticle ? 8 + Math.random() * 10 : 41 + Math.random() * 16;
        const alpha = useBlackParticle ? 0.92 : 0.96;
        const glowAlpha = useBlackParticle ? 0.38 : 0.86;
        const shape = shapes[Math.floor(Math.random() * shapes.length)];

        particle.className = 'absolute mix-blend-screen will-change-transform';
        particle.style.left = `${originX}px`;
        particle.style.top = `${originY}px`;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.background = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
        particle.style.boxShadow = `0 0 ${10 + size}px hsla(${hue}, ${saturation}%, ${lightness}%, ${glowAlpha})`;
        particle.style.opacity = '0';

        if (shape === 'circle') {
            particle.style.borderRadius = '9999px';
        } else if (shape === 'square') {
            particle.style.borderRadius = '15%';
        } else if (shape === 'diamond') {
            particle.style.clipPath = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
        } else if (shape === 'pill') {
            particle.style.borderRadius = '9999px';
            particle.style.width = `${size * 1.8}px`;
            particle.style.height = `${Math.max(1.5, size * 0.7)}px`;
        } else if (shape === 'spark') {
            particle.style.clipPath = 'polygon(50% 0%, 61% 34%, 98% 50%, 61% 66%, 50% 100%, 39% 66%, 2% 50%, 39% 34%)';
        }

        particlesLayer.appendChild(particle);

        const animation = particle.animate([
            {
                transform: 'translate3d(0, 0, 0) scale(0.4)',
                opacity: 0
            },
            {
                transform: 'translate3d(0, 0, 0) scale(1)',
                opacity: 1,
                offset: 0.14
            },
            {
                transform: `translate3d(${deltaX * 0.62}px, ${deltaY * 0.62}px, 0) scale(${isDarkSpell ? 0.72 : 0.78})`,
                opacity: isDarkSpell ? 0.62 : 0.54,
                offset: 0.68
            },
            {
                transform: `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${isDarkSpell ? 0.5 : 0.7})`,
                opacity: 0
            }
        ], {
            duration,
            easing: 'cubic-bezier(0.16, 0.74, 0.12, 1)',
            fill: 'forwards'
        });

        animation.addEventListener('finish', () => {
            particle.remove();
        }, { once: true });
    }

    if (typeof onComplete === 'function') {
        const maxParticleDuration = isDarkSpell ? 6000 : 5200;
        const transitionDelay = Math.max(0, maxParticleDuration - BASILISK_ENCHANTED_TRANSITION_LEAD_MS);

        window.setTimeout(onComplete, transitionDelay);
    }
}

function playBasiliskStaffSpellCast(staffLayer, particlesLayer, basiliskLayer, prefersReducedMotion, department, onEnchantedShown, enchantedFrameSource = BASILISK_ENCHANTED_FRAME_SOURCE, hissAudioSource = BASILISK_HISS_AUDIO_SOURCE) {
    const swing = staffLayer.animate([
        { transform: 'rotate(-130deg)' },
        { transform: 'rotate(-124deg)', offset: 0.18 },
        { transform: 'rotate(-118deg)', offset: 0.34 },
        { transform: 'rotate(-136deg)', offset: 0.56 },
        { transform: 'rotate(-123deg)', offset: 0.76 },
        { transform: 'rotate(-133deg)', offset: 0.9 },
        { transform: 'rotate(-130deg)' }
    ], {
        duration: BASILISK_STAFF_SPELL_CAST_MS,
        easing: 'cubic-bezier(0.22, 0.9, 0.16, 1)',
        fill: 'forwards'
    });

    if (prefersReducedMotion) {
        window.setTimeout(() => {
            showFrame(basiliskLayer, enchantedFrameSource);
            playBasiliskHissAudio(hissAudioSource);

            if (typeof onEnchantedShown === 'function') {
                onEnchantedShown();
            }
        }, BASILISK_STAFF_SPELL_CAST_MS);

        return swing;
    }

    const originX = window.innerWidth / 2;
    const originY = window.innerHeight / 2;

    playBasiliskSpellAudio(department);
    window.setTimeout(() => {
        showFrame(basiliskLayer, BASILISK_TAUNT_FRAME_SOURCE);
        playBasiliskHissAudio(hissAudioSource);

        emitBasiliskSpellParticles(particlesLayer, originX, originY, department, () => {
            window.setTimeout(() => {
                showFrame(basiliskLayer, enchantedFrameSource);

                if (typeof onEnchantedShown === 'function') {
                    onEnchantedShown();
                }
            }, BASILISK_TAUNT_DELAY_MS);
        });
    }, BASILISK_SPELL_PARTICLE_DELAY_MS);

    return swing;
}

function showBasiliskContinueLabel(label) {
    label.style.pointerEvents = 'auto';
    label.style.opacity = '1';
}

function hideBasiliskContinueLabel(label) {
    label.style.pointerEvents = 'none';
    label.style.opacity = '0';
}

function updateBasiliskDialogue(chatbox, continueLabel, dialogues, index) {
    const dialogue = getDialogueEntry(dialogues, index);
    const text = chatbox.querySelector('p');

    if (text instanceof HTMLElement) {
        text.textContent = dialogue?.text || '';
    }

    continueLabel.textContent = dialogue?.readMore || '';
}

function showFrame(layer, source) {
    layer.style.backgroundImage = `url('${source}')`;
}

function showFinalBackdropSlowly() {
    const finalBackdrop = document.getElementById('sorting-backdrop-final');

    if (!(finalBackdrop instanceof HTMLElement)) {
        return;
    }

    finalBackdrop.style.transitionDuration = `${BASILISK_FINAL_BACKDROP_FADE_IN_MS}ms`;
    finalBackdrop.style.opacity = '1';
}

function fadeOutBasiliskAfterFinalBackdrop(basiliskLayer) {
    if (!(basiliskLayer instanceof HTMLElement)) {
        return;
    }

    window.setTimeout(() => {
        basiliskLayer.style.opacity = '0';
    }, BASILISK_FINAL_BASILISK_FADE_TOTAL_DELAY_MS);
}

function startBasiliskSequence(layer, backdrop, chatbox, continueLabel, onContinueShown) {
    const timeoutIds = [];

    const schedule = (callback, delay) => {
        const timeoutId = window.setTimeout(callback, delay);
        timeoutIds.push(timeoutId);
        return timeoutId;
    };

    const runFrameSequence = () => {
        layer.style.opacity = '1';
        showFrame(layer, BASILISK_FRAME_SOURCES[0]);
        schedule(() => playBasiliskHissAudio(), BASILISK_HISS_DELAY_MS);

        schedule(() => showFrame(layer, BASILISK_FRAME_SOURCES[1]), BASILISK_FRAME_STEP_MS);

        schedule(() => {
            showFrame(layer, BASILISK_FRAME_SOURCES[2]);
        }, BASILISK_FRAME_STEP_MS * 2);

        schedule(() => showFrame(layer, BASILISK_FRAME_SOURCES[3]), BASILISK_FRAME_STEP_MS * 3);
        schedule(() => showBasiliskBackdrop(backdrop), BASILISK_BACKDROP_DELAY_MS);
        schedule(() => showBasiliskChatbox(chatbox), BASILISK_BACKDROP_DELAY_MS + BASILISK_CHATBOX_DELAY_MS);
        schedule(() => {
            showBasiliskContinueLabel(continueLabel);

            if (typeof onContinueShown === 'function') {
                onContinueShown();
            }
        }, BASILISK_BACKDROP_DELAY_MS + BASILISK_CHATBOX_DELAY_MS + BASILISK_CONTINUE_DELAY_MS);
    };

    const finishLoadingAndRun = async () => {
        await Promise.all(BASILISK_PRELOADS);
        runFrameSequence();
    };

    window.setTimeout(() => {
        void finishLoadingAndRun();
    }, BASILISK_APPEAR_DELAY_MS);

    return () => {
        for (const timeoutId of timeoutIds) {
            window.clearTimeout(timeoutId);
        }
    };
}

async function initChamberScene() {
    const body = document.body;

    if (!(body instanceof HTMLElement)) {
        return;
    }

    if (document.getElementById('basilisk-layer')) {
        return;
    }

    const dialogueGroups = await loadBasiliskDialogue();
    const encounterDialogues = dialogueGroups.encounterDialogues;
    const secondGroupDialogues = dialogueGroups.secondGroupDialogues;
    const thirdGroupDialogues = dialogueGroups.thirdGroupDialogues;
    const fourthGroupDialogues = dialogueGroups.fourthGroupDialogues;
    const fifthGroupDialogues = dialogueGroups.fifthGroupDialogues;

    if (encounterDialogues.length === 0) {
        return;
    }

    const firstDialogue = getDialogueEntry(encounterDialogues, 0);
    const cabinDepartment = readStoredCabinDepartment();
    const basiliskLayer = createBasiliskLayer();
    const basiliskBackdrop = createBasiliskBackdrop();
    const basiliskStaffLayer = createBasiliskStaffLayer();
    const basiliskSpellParticlesLayer = createBasiliskSpellParticlesLayer();
    const basiliskContinueLabel = createBasiliskContinueLabel(firstDialogue?.readMore || '');
    const basiliskChatbox = createBasiliskChatbox(basiliskContinueLabel, firstDialogue?.text || '');
    let activeDialogues = encounterDialogues;
    let currentDialogueIndex = 0;
    let currentGroupId = 1;
    let isTransitioningGroup = false;
    let hasShownStaffLayer = false;
    let isContinueVisible = false;

    const dialogueGroupById = {
        1: encounterDialogues,
        2: secondGroupDialogues,
        3: thirdGroupDialogues,
        4: fourthGroupDialogues,
        5: fifthGroupDialogues
    };

    const transitionToDialogueGroup = (groupId, delayMs = 0) => {
        const nextDialogues = dialogueGroupById[groupId];

        if (!Array.isArray(nextDialogues) || nextDialogues.length === 0) {
            isTransitioningGroup = false;
            return;
        }

        window.setTimeout(() => {
            currentGroupId = groupId;
            activeDialogues = nextDialogues;
            currentDialogueIndex = 0;

            if (currentGroupId === 4) {
                showFinalBackdropSlowly();
                fadeOutBasiliskAfterFinalBackdrop(basiliskLayer);
            }

            updateBasiliskDialogue(basiliskChatbox, basiliskContinueLabel, activeDialogues, currentDialogueIndex);
            showBasiliskChatbox(basiliskChatbox);
            showBasiliskContinueLabel(basiliskContinueLabel);
            isContinueVisible = true;
            isTransitioningGroup = false;
        }, delayMs);
    };

    basiliskContinueLabel.addEventListener('click', () => {
        if (isTransitioningGroup || !isContinueVisible) {
            return;
        }

        if (currentDialogueIndex >= activeDialogues.length - 1) {
            hideBasiliskChatbox(basiliskChatbox);
            hideBasiliskContinueLabel(basiliskContinueLabel);
            isContinueVisible = false;

            if (currentGroupId === 1 && secondGroupDialogues.length > 0) {
                isTransitioningGroup = true;

                if (!hasShownStaffLayer && cabinDepartment) {
                    showBasiliskStaffLayer(basiliskStaffLayer, cabinDepartment);
                    hasShownStaffLayer = true;
                }

                transitionToDialogueGroup(2, BASILISK_STAFF_FADE_IN_MS);
            } else if (currentGroupId === 2 || currentGroupId === 3) {
                isTransitioningGroup = true;

                const nextGroupId = currentGroupId === 2 && cabinDepartment === 'slytherin'
                    ? 4
                    : currentGroupId + 1;

                playBasiliskStaffSpellCast(
                    basiliskStaffLayer,
                    basiliskSpellParticlesLayer,
                    basiliskLayer,
                    prefersReducedMotion,
                    cabinDepartment,
                    () => {
                        transitionToDialogueGroup(nextGroupId);
                    },
                    currentGroupId === 3 ? BASILISK_ENCHANTED_FINAL_FRAME_SOURCE : BASILISK_ENCHANTED_FRAME_SOURCE,
                    currentGroupId === 3 ? BASILISK_SECOND_HISS_AUDIO_SOURCE : BASILISK_HISS_AUDIO_SOURCE
                );
            } else if (currentGroupId === 4) {
                isTransitioningGroup = true;

                transitionToDialogueGroup(5, BASILISK_DIALOGUE_GROUP_REENTRY_DELAY_MS);
            }

            return;
        }

        currentDialogueIndex += 1;
        updateBasiliskDialogue(basiliskChatbox, basiliskContinueLabel, activeDialogues, currentDialogueIndex);
    });
    basiliskLayer.id = 'basilisk-layer';
    basiliskBackdrop.id = 'basilisk-backdrop';
    basiliskStaffLayer.id = 'basilisk-staff-layer';
    basiliskSpellParticlesLayer.id = 'basilisk-spell-particles-layer';
    basiliskChatbox.id = 'basilisk-chatbox';
    body.appendChild(basiliskBackdrop);
    body.appendChild(basiliskLayer);
    body.appendChild(basiliskStaffLayer);
    body.appendChild(basiliskSpellParticlesLayer);
    body.appendChild(basiliskChatbox);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
        window.setTimeout(() => {
            showFrame(basiliskLayer, BASILISK_FRAME_SOURCES[0]);
            basiliskLayer.style.opacity = '1';
            showBasiliskBackdrop(basiliskBackdrop);
            window.setTimeout(() => showBasiliskChatbox(basiliskChatbox), BASILISK_CHATBOX_DELAY_MS);
            window.setTimeout(() => {
                showBasiliskContinueLabel(basiliskContinueLabel);
                isContinueVisible = true;
            }, BASILISK_CHATBOX_DELAY_MS + BASILISK_CONTINUE_DELAY_MS);
        }, BASILISK_APPEAR_DELAY_MS);
        return;
    }

    startBasiliskSequence(basiliskLayer, basiliskBackdrop, basiliskChatbox, basiliskContinueLabel, () => {
        isContinueVisible = true;
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        void initChamberScene();
    }, { once: true });
} else {
    void initChamberScene();
}
