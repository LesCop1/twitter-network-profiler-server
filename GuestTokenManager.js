class GuestTokenManager {
    constructor() {
        this.token = null;
        this.setTime = null;
    }

    getToken() {
        return this.token;
    }

    setToken(token) {
        this.token = token;
        this.setTime = Date.now();
    }

    getSetTime() {
        return this.setTime;
    }

    reset() {
        this.token = null;
        this.setTime = null;
    }
}

export default GuestTokenManager;
