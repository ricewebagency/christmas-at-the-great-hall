export function readJsonFromLocalStorage(key, fallbackValue = null) {
    if (typeof window === 'undefined') {
        return fallbackValue;
    }

    try {
        const rawValue = window.localStorage.getItem(key);

        if (!rawValue) {
            return fallbackValue;
        }

        return JSON.parse(rawValue);
    } catch {
        return fallbackValue;
    }
}

export function writeJsonToLocalStorage(key, value) {
    if (typeof window === 'undefined') {
        return false;
    }

    try {
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
}

export function resetLocalStorageState(key, initialState) {
    writeJsonToLocalStorage(key, initialState);
    return initialState;
}

export function removeLocalStorageItem(key) {
    if (typeof window === 'undefined') {
        return false;
    }

    try {
        window.localStorage.removeItem(key);
        return true;
    } catch {
        return false;
    }
}

export function removeCookie(name, path = '/') {
    if (typeof document === 'undefined') {
        return false;
    }

    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; SameSite=Lax`;
    return true;
}

export function resetClientStorage({ localStorageKeys = [], cookieNames = [], cookiePath = '/' } = {}) {
    localStorageKeys.forEach((key) => {
        removeLocalStorageItem(key);
    });

    cookieNames.forEach((cookieName) => {
        removeCookie(cookieName, cookiePath);
    });
}
