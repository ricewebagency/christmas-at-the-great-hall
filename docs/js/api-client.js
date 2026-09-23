const mockInvitation = {
    guestName: "Maurice van Dorst",
    eventDate: "2026-12-24T18:00:00",
    location: "Assendelft",
    department: "ravenclaw",
    rsvpStatus: "pending"
};

const mockSortingResultStore = {
    lastResult: null
};

const mockCabinDishSelectionStore = {
    lastSelection: null
};

const CABIN_STORAGE_KEY = 'magical-winter-banquet.cabin';
const CABIN_COOKIE_NAME = 'magical-winter-banquet.cabin';
const CABIN_DEPARTMENTS = ['gryffindor', 'hufflepuff', 'ravenclaw', 'slytherin'];
const CABIN_DISH_SELECTION_LIMIT = 2;

function normalizeDishSelection(selection) {
    if (!Array.isArray(selection)) {
        return [];
    }

    const sanitizedSelection = selection
        .map((item) => String(item ?? '').trim())
        .filter((item) => item.length > 0);

    return Array.from(new Set(sanitizedSelection)).slice(0, CABIN_DISH_SELECTION_LIMIT);
}

function normalizeDepartment(value) {
    const normalizedDepartment = String(value ?? '').trim().toLowerCase();

    if (CABIN_DEPARTMENTS.includes(normalizedDepartment)) {
        return normalizedDepartment;
    }

    return 'ravenclaw';
}

function getCabinImageForDepartment(department) {
    switch (normalizeDepartment(department)) {
        case 'gryffindor':
            return './assets/images/hogwarts-express-cabin-front-gryffindor.png';
        case 'hufflepuff':
            return './assets/images/hogwarts-express-cabin-front-hufflepuff.png';
        case 'ravenclaw':
            return './assets/images/hogwarts-express-cabin-front-ravenclaw.png';
        case 'slytherin':
            return './assets/images/hogwarts-express-cabin-front-slytherin.png';
        default:
            return './assets/images/hogwarts-express-cabin-front-gryffindor.png';
    }
}

function normalizeCabinData(data = {}) {
    const normalizedDepartment = normalizeDepartment(data.department ?? data.house);
    const guestName = String(data.guestName ?? 'Guest').trim() || 'Guest';
    const dishSelection = normalizeDishSelection(data.dishSelection);

    return {
        guestName,
        department: normalizedDepartment,
        cabinFrontImage: data.cabinFrontImage || getCabinImageForDepartment(normalizedDepartment),
        dishSelection,
        source: data.source || 'api'
    };
}

function writeCabinCookie(value) {
    if (typeof document === 'undefined') {
        return;
    }

    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toUTCString();
    document.cookie = `${CABIN_COOKIE_NAME}=${encodeURIComponent(value)}; expires=${expiresAt}; path=/; SameSite=Lax`;
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

function readStoredCabinData() {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const cachedValue = window.localStorage.getItem(CABIN_STORAGE_KEY);
        if (cachedValue) {
            const parsed = JSON.parse(cachedValue);
            if (parsed && typeof parsed === 'object') {
                return normalizeCabinData({ ...parsed, source: 'cache' });
            }
        }
    } catch {
        // Ignore storage issues and fall back to the cookie or mock API.
    }

    const cookieValue = readCabinCookie();
    if (cookieValue && typeof cookieValue === 'object') {
        return normalizeCabinData({ ...cookieValue, source: 'cookie' });
    }

    return null;
}

function persistCabinData(data) {
    const normalizedData = normalizeCabinData({ ...data, source: data?.source || 'api' });

    try {
        window.localStorage.setItem(CABIN_STORAGE_KEY, JSON.stringify(normalizedData));
    } catch {
        // Ignore storage restrictions and keep the data usable in the page.
    }

    writeCabinCookie(JSON.stringify(normalizedData));

    return normalizedData;
}

export async function getInvitationData() {
    // Keep this API shape stable so we can swap mock data for a real endpoint later.
    return { ...mockInvitation };
}

export async function fetchCabinDataForGuest(guestName, departmentOverride = null) {
    const normalizedGuestName = String(guestName ?? '').trim() || 'Guest';
    const normalizedDepartment = normalizeDepartment(departmentOverride ?? mockInvitation.department ?? 'ravenclaw');

    return {
        guestName: normalizedGuestName,
        department: normalizedDepartment,
        cabinFrontImage: getCabinImageForDepartment(normalizedDepartment),
        source: 'api'
    };
}

export async function getCabinData() {
    const storedCabinData = readStoredCabinData();
    if (storedCabinData) {
        return storedCabinData;
    }

    const invitation = await getInvitationData();
    const cabinData = await fetchCabinDataForGuest(
        invitation?.guestName,
        invitation?.department ?? invitation?.house ?? null
    );

    return persistCabinData(cabinData);
}

export async function sendAttendanceResponse(attendanceResponse) {
    const normalizedResponse = String(attendanceResponse ?? '').trim();

    if (!normalizedResponse) {
        throw new Error('Attendance response is required.');
    }

    // Mock API send behavior; keep contract stable for a future real endpoint.
    mockInvitation.rsvpStatus = normalizedResponse;

    return {
        ok: true,
        status: 200,
        data: {
            attendanceResponse: normalizedResponse
        }
    };
}

export async function sendSortingHouseResult(result) {
    const normalizedHouse = normalizeDepartment(result?.house ?? "");
    const normalizedGuestName = String(result?.guestName ?? '').trim() || mockInvitation.guestName || 'Guest';

    if (!result?.house && !normalizedHouse) {
        throw new Error("Sorting house is required.");
    }

    const normalizedScores = { ...(result?.scores ?? {}) };
    const savedResult = {
        guestName: normalizedGuestName,
        house: normalizedHouse,
        scores: normalizedScores,
        questionsAnswered: Number(result?.questionsAnswered ?? 0),
        savedAt: new Date().toISOString()
    };

    mockInvitation.guestName = normalizedGuestName;
    mockInvitation.department = normalizedHouse;
    mockInvitation.rsvpStatus = mockInvitation.rsvpStatus || 'pending';
    mockSortingResultStore.lastResult = savedResult;

    persistCabinData({
        guestName: normalizedGuestName,
        department: normalizedHouse,
        source: 'api'
    });

    return {
        ok: true,
        status: 200,
        data: savedResult
    };
}

export async function sendCabinDishSelection(payload) {
    const dishSelection = normalizeDishSelection(payload?.dishSelection ?? payload?.dishIds ?? []);

    if (dishSelection.length === 0) {
        throw new Error('At least one dish selection is required.');
    }

    const cabinData = await getCabinData();
    const savedSelection = {
        guestName: cabinData.guestName,
        dishSelection,
        savedAt: new Date().toISOString()
    };

    mockCabinDishSelectionStore.lastSelection = savedSelection;

    persistCabinData({
        ...cabinData,
        dishSelection,
        source: 'api'
    });

    return {
        ok: true,
        status: 200,
        data: savedSelection
    };
}