import { sendSortingHouseResult } from './api-client.js';

const STORAGE_KEY = 'magical-winter-banquet.sorting-hat';
const HOUSE_ORDER = ['gryffindor', 'hufflepuff', 'ravenclaw', 'slytherin'];
const QUESTIONS_URL = new URL('../assets/files/sorting-hat-questions.json', import.meta.url);
const HOUSE_REVEAL_AUDIO = {
    gryffindor: {
        first: new URL('../assets/music/sorting-hat/gryffindor-1.mp3', import.meta.url).href,
        second: new URL('../assets/music/sorting-hat/gryffindor-2.mp3', import.meta.url).href
    },
    hufflepuff: {
        first: new URL('../assets/music/sorting-hat/hufflepuff-1.mp3', import.meta.url).href,
        second: new URL('../assets/music/sorting-hat/hufflepuff-2.mp3', import.meta.url).href
    },
    ravenclaw: {
        first: new URL('../assets/music/sorting-hat/ravenclaw-1.mp3', import.meta.url).href,
        second: new URL('../assets/music/sorting-hat/ravenclaw-2.mp3', import.meta.url).href
    },
    slytherin: {
        first: new URL('../assets/music/sorting-hat/slytherin-1.mp3', import.meta.url).href,
        second: new URL('../assets/music/sorting-hat/slytherin-2.mp3', import.meta.url).href
    }
};
const SORTING_HAT_FRAGMENT_SOURCES = [
    new URL('../assets/music/sorting-hat/ah-i-see.mp3', import.meta.url).href,
    new URL('../assets/music/sorting-hat/alright-very-well.mp3', import.meta.url).href,
    new URL('../assets/music/sorting-hat/go-on-hurry-up.mp3', import.meta.url).href,
    new URL('../assets/music/sorting-hat/ha-okay.mp3', import.meta.url).href,
    new URL('../assets/music/sorting-hat/i-would-not-have-guessed.mp3', import.meta.url).href,
    new URL('../assets/music/sorting-hat/interesting.mp3', import.meta.url).href,
    new URL('../assets/music/sorting-hat/mmm-alrighty-then.mp3', import.meta.url).href,
    new URL('../assets/music/sorting-hat/mmm-okay.mp3', import.meta.url).href,
    new URL('../assets/music/sorting-hat/pick-your-next-one-wisely.mp3', import.meta.url).href,
    new URL('../assets/music/sorting-hat/thats-an-interesting-pick.mp3', import.meta.url).href,
    new URL('../assets/music/sorting-hat/very-well-then.mp3', import.meta.url).href,
    new URL('../assets/music/sorting-hat/youre-almost-there.mp3', import.meta.url).href
];
const SORTING_HAT_FRAGMENT_HISTORY_LIMIT = 10;
const QUESTION_TRANSITION_MS = 220;
const BUTTON_STAGGER_MS = 60;

function createEmptyScores() {
    return Object.fromEntries(HOUSE_ORDER.map((house) => [house, 0]));
}

function formatHouseName(house) {
    return house.charAt(0).toUpperCase() + house.slice(1);
}

function getWinningHouse(scores) {
    return HOUSE_ORDER.reduce((bestHouse, currentHouse) => {
        const bestScore = scores[bestHouse] ?? 0;
        const currentScore = scores[currentHouse] ?? 0;

        if (currentScore > bestScore) {
            return currentHouse;
        }

        return bestHouse;
    }, HOUSE_ORDER[0]);
}

function getAnswerGridClass(answerCount) {
    if (answerCount <= 1) {
        return 'grid gap-3';
    }

    if (answerCount === 2) {
        return 'grid gap-3 sm:grid-cols-2';
    }

    if (answerCount > 4) {
        return 'grid max-h-[60vh] gap-3 overflow-y-auto pr-2 sm:max-h-[28rem] sm:grid-cols-2';
    }

    return 'grid gap-3 sm:grid-cols-2';
}

function setEnterState(element) {
    element.classList.add('opacity-0', 'translate-y-2');
    element.classList.remove('opacity-100', 'translate-y-0');
}

function playEnterAnimation(elements) {
    window.requestAnimationFrame(() => {
        elements.forEach((element) => {
            element.classList.remove('opacity-0', 'translate-y-2');
            element.classList.add('opacity-100', 'translate-y-0');
        });
    });
}

function playExitAnimation(questionEl, buttons) {
    questionEl.classList.remove('opacity-100', 'translate-y-0');
    questionEl.classList.add('opacity-0', 'translate-y-2');

    buttons.forEach((button) => {
        button.classList.remove('opacity-100', 'translate-y-0');
        button.classList.add('opacity-0', 'translate-y-2');
    });
}

function pickRandomQuestions(questions, count) {
    const pool = [...questions];
    const selectedQuestions = [];
    const targetCount = Math.min(count, pool.length);

    while (selectedQuestions.length < targetCount && pool.length > 0) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        const [nextQuestion] = pool.splice(randomIndex, 1);
        selectedQuestions.push(nextQuestion);
    }

    return selectedQuestions;
}

function getRandomSortingHatFragmentSource(recentSources) {
    const recentSourceSet = new Set(recentSources);
    const availableSources = SORTING_HAT_FRAGMENT_SOURCES.filter((source) => !recentSourceSet.has(source));
    const pool = availableSources.length > 0 ? availableSources : SORTING_HAT_FRAGMENT_SOURCES;
    const randomIndex = Math.floor(Math.random() * pool.length);

    return pool[randomIndex];
}

function createAudio(source, volume = 0.95) {
    const audio = new Audio(source);

    audio.preload = 'auto';
    audio.volume = volume;

    return audio;
}

function playAudioAndWait(audio) {
    return new Promise((resolve, reject) => {
        const cleanup = () => {
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
        };

        const handleEnded = () => {
            cleanup();
            resolve();
        };

        const handleError = () => {
            cleanup();
            reject(new Error('Audio playback failed.'));
        };

        audio.addEventListener('ended', handleEnded, { once: true });
        audio.addEventListener('error', handleError, { once: true });

        audio.play().catch((error) => {
            cleanup();
            reject(error);
        });
    });
}

function safeStoreState(state) {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // Ignore storage failures and keep the quiz usable.
    }
}

function resetStoredState() {
    const state = {
        currentQuestionIndex: 0,
        scores: createEmptyScores()
    };

    safeStoreState(state);
    return state;
}

async function loadQuestions() {
    const response = await fetch(QUESTIONS_URL);

    if (!response.ok) {
        throw new Error(`Failed to load sorting questions: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data?.questions) || data.questions.length === 0) {
        throw new Error('Sorting questions are missing.');
    }

    return data;
}

function initSortingQuiz() {
    const progressEl = document.getElementById('sorting-progress');
    const questionEl = document.getElementById('sorting-question');
    const optionsEl = document.getElementById('sorting-options');
    const resultEl = document.getElementById('sorting-result');
    const resultCopyEl = document.getElementById('sorting-result-copy');
    const restartButton = document.getElementById('sorting-restart');

    if (
        !(progressEl instanceof HTMLElement) ||
        !(questionEl instanceof HTMLElement) ||
        !(optionsEl instanceof HTMLElement) ||
        !(resultEl instanceof HTMLElement) ||
        !(resultCopyEl instanceof HTMLElement) ||
        !(restartButton instanceof HTMLButtonElement)
    ) {
        return;
    }

    let currentQuestionIndex = 0;
    let scores = createEmptyScores();
    let questions = [];
    let hasSentResult = false;
    let isTransitioning = false;
    let playedSortingHatFragments = [];
    let activeSortingHatFragments = new Set();
    let revealHouseButton = null;
    let pendingRevealHouse = null;
    let houseRevealAudio = null;
    let houseRevealLocked = false;

    function persistState() {
        safeStoreState({
            currentQuestionIndex,
            scores
        });
    }

    function resetSortingHatFragments() {
        activeSortingHatFragments.forEach((audio) => {
            audio.pause();
            audio.currentTime = 0;
        });

        activeSortingHatFragments.clear();
        playedSortingHatFragments = [];
    }

    function resetHouseRevealState() {
        if (houseRevealAudio) {
            houseRevealAudio.pause();
            houseRevealAudio.currentTime = 0;
        }

        houseRevealAudio = null;
        houseRevealLocked = false;
        pendingRevealHouse = null;

        if (revealHouseButton) {
            revealHouseButton.remove();
            revealHouseButton = null;
        }
    }

    function getRevealHouseAudio(house, stage) {
        return HOUSE_REVEAL_AUDIO[house]?.[stage] ?? null;
    }

    async function playHouseRevealIntro(house) {
        const source = getRevealHouseAudio(house, 'first');

        if (!source) {
            pendingRevealHouse = house;
            showRevealHouseButton();
            return;
        }

        houseRevealAudio = createAudio(source, 0.95);

        try {
            await playAudioAndWait(houseRevealAudio);
            pendingRevealHouse = house;
            showRevealHouseButton();
        } catch (error) {
            console.info('Sorting Hat reveal intro was blocked by the browser.', error);
            pendingRevealHouse = house;
            showRevealHouseButton();
        }
    }

    function revealHouseResult(house) {
        const source = getRevealHouseAudio(house, 'second');

        const finalizeReveal = () => {
            resultEl.classList.remove('hidden', 'opacity-0');
            resultEl.classList.add('opacity-100');
            progressEl.textContent = 'Result';
            questionEl.textContent = 'Sorting complete';
            optionsEl.innerHTML = '';
            resultCopyEl.classList.remove('hidden');
            restartButton.classList.remove('hidden');
            resultCopyEl.textContent = `${formatHouseName(house)} has the highest score. The result has been saved locally and sent through the mock API.`;

            if (!hasSentResult) {
                hasSentResult = true;
                void sendSortingHouseResult({
                    house,
                    scores: { ...scores },
                    questionsAnswered: questions.length
                }).catch(() => {
                    resultCopyEl.textContent = `${formatHouseName(house)} has the highest score, but the mock API call failed.`;
                });
            }
        };

        if (!source) {
            finalizeReveal();
            return;
        }

        if (houseRevealLocked) {
            return;
        }

        houseRevealLocked = true;
        houseRevealAudio = createAudio(source, 0.95);

        playAudioAndWait(houseRevealAudio)
            .then(finalizeReveal)
            .catch((error) => {
                console.info('Sorting Hat reveal audio was blocked by the browser.', error);
                finalizeReveal();
            })
            .finally(() => {
                houseRevealLocked = false;
            });
    }

    function showRevealHouseButton() {
        if (!pendingRevealHouse) {
            return;
        }

        if (revealHouseButton) {
            revealHouseButton.remove();
        }

        revealHouseButton = document.createElement('button');
        revealHouseButton.type = 'button';
        revealHouseButton.className = 'group flex w-full items-center justify-between rounded-none border border-amber-100/20 bg-amber-50/5 px-4 py-3 text-left text-sm text-amber-50 transition-colors duration-200 hover:border-amber-50/30 hover:bg-amber-50/10 focus:outline-none focus-visible:outline-none sm:text-base';
        revealHouseButton.textContent = 'Reveal house';

        revealHouseButton.addEventListener('click', () => {
            if (!pendingRevealHouse) {
                return;
            }

            const house = pendingRevealHouse;
            pendingRevealHouse = null;
            revealHouseButton?.remove();
            revealHouseButton = null;
            revealHouseResult(house);
        });

        resultEl.classList.remove('hidden', 'opacity-0');
        resultEl.classList.add('opacity-100');
        resultCopyEl.classList.add('hidden');
        restartButton.classList.add('hidden');
        resultEl.insertBefore(revealHouseButton, resultCopyEl);
    }

    function playSortingHatFragment() {
        const source = getRandomSortingHatFragmentSource(playedSortingHatFragments);
        const audio = createAudio(source);
        activeSortingHatFragments.add(audio);

        const removeAudio = () => {
            activeSortingHatFragments.delete(audio);
        };

        audio.addEventListener('ended', removeAudio, { once: true });
        audio.addEventListener('error', removeAudio, { once: true });

        playedSortingHatFragments = [...playedSortingHatFragments, source].slice(-SORTING_HAT_FRAGMENT_HISTORY_LIMIT);

        audio.play().catch((error) => {
            activeSortingHatFragments.delete(audio);
            const failedSourceIndex = playedSortingHatFragments.lastIndexOf(source);

            if (failedSourceIndex !== -1) {
                playedSortingHatFragments.splice(failedSourceIndex, 1);
            }

            console.info('Sorting Hat fragment autoplay was blocked by the browser.', error);
        });
    }

    function applyAnswer(answer) {
        if (isTransitioning) {
            return;
        }

        HOUSE_ORDER.forEach((house) => {
            scores[house] += Number(answer?.scores?.[house] ?? 0);
        });

        currentQuestionIndex += 1;
        persistState();
        playSortingHatFragment();
        void renderQuestion();
    }

    function renderResult() {
        const winningHouse = getWinningHouse(scores);

        progressEl.textContent = 'Result';
        optionsEl.innerHTML = '';
        resultEl.classList.add('hidden');
        resultEl.classList.remove('opacity-100');
        questionEl.textContent = 'Sorting complete';
        resultCopyEl.classList.add('hidden');
        restartButton.classList.add('hidden');
        resetHouseRevealState();
        void playHouseRevealIntro(winningHouse);
    }

    async function renderQuestion() {
        const question = questions[currentQuestionIndex];

        if (!question) {
            renderResult();
            return;
        }

        if (optionsEl.children.length > 0) {
            isTransitioning = true;
            optionsEl.classList.add('pointer-events-none');

            const existingButtons = Array.from(optionsEl.querySelectorAll('button'));
            playExitAnimation(questionEl, existingButtons);

            await new Promise((resolve) => {
                window.setTimeout(resolve, QUESTION_TRANSITION_MS);
            });

            optionsEl.innerHTML = '';
            optionsEl.classList.remove('pointer-events-none');
        }

        resultEl.classList.add('hidden');
        resultEl.classList.remove('opacity-100');
        progressEl.textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
        questionEl.textContent = question.question;
        setEnterState(questionEl);
        optionsEl.className = getAnswerGridClass(question.answers?.length ?? 0);
        optionsEl.innerHTML = '';

        const answers = Array.isArray(question.answers) ? question.answers : [];
        const renderedButtons = [];

        answers.forEach((answer, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'group flex items-center justify-between rounded-none border border-amber-100/20 bg-amber-50/5 px-4 py-3 text-left text-sm text-amber-50 transition-all duration-200 ease-out hover:border-amber-50/30 hover:bg-amber-50/10 focus:outline-none focus-visible:outline-none sm:text-base';

            const answerText = document.createElement('span');
            answerText.textContent = answer.text;

            const arrow = document.createElement('span');
            arrow.setAttribute('aria-hidden', 'true');
            arrow.className = 'text-amber-200/80 transition-transform duration-200 group-hover:translate-x-1';
            arrow.textContent = '→';

            button.append(answerText, arrow);
            button.addEventListener('click', () => applyAnswer(answer));
            button.style.transitionDelay = `${index * BUTTON_STAGGER_MS}ms`;
            setEnterState(button);
            optionsEl.appendChild(button);
            renderedButtons.push(button);
        });

        playEnterAnimation([questionEl, ...renderedButtons]);
        isTransitioning = false;
    }

    restartButton.addEventListener('click', () => {
        const state = resetStoredState();
        currentQuestionIndex = state.currentQuestionIndex;
        scores = state.scores;
        hasSentResult = false;
        isTransitioning = false;
        resetSortingHatFragments();
        resetHouseRevealState();
        renderQuestion();
    });

    void loadQuestions()
        .then((data) => {
            questions = pickRandomQuestions(data.questions, 10);
            const state = resetStoredState();
            currentQuestionIndex = state.currentQuestionIndex;
            scores = state.scores;
            hasSentResult = false;
            isTransitioning = false;
            resetSortingHatFragments();
            resetHouseRevealState();
            renderQuestion();
        })
        .catch(() => {
            progressEl.textContent = 'Sorting unavailable';
            questionEl.textContent = 'The Sorting Hat questions could not be loaded.';
            optionsEl.innerHTML = '';
            resultEl.classList.add('hidden');
        });
}

document.addEventListener('DOMContentLoaded', initSortingQuiz);