const mockInvitation = {
    guestName: "Maurice van Dorst",
    eventDate: "2026-12-24T18:00:00",
    location: "Assendelft",
    rsvpStatus: "pending"
};

const mockSortingResultStore = {
    lastResult: null
};

export async function getInvitationData() {
    // Keep this API shape stable so we can swap mock data for a real endpoint later.
    return { ...mockInvitation };
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
    const normalizedHouse = String(result?.house ?? "").trim();

    if (!normalizedHouse) {
        throw new Error("Sorting house is required.");
    }

    const normalizedScores = { ...(result?.scores ?? {}) };

    mockSortingResultStore.lastResult = {
        house: normalizedHouse,
        scores: normalizedScores,
        questionsAnswered: Number(result?.questionsAnswered ?? 0),
        savedAt: new Date().toISOString()
    };

    return {
        ok: true,
        status: 200,
        data: mockSortingResultStore.lastResult
    };
}