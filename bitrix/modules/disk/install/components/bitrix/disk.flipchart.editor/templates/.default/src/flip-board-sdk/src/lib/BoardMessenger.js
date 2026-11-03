/**
 * Owns the message channel to the board iframe.
 *
 * Every incoming message is checked against both the iframe window and the origin derived from
 * `appUrl`, and every outgoing message is addressed to that exact origin. Keeping the channel behind
 * this class is what prevents a `targetOrigin` of `'*'` — and the JWT leak it enables — from coming
 * back through an unrelated refactor.
 */
export class BoardMessenger {
    constructor(iframeEl, appUrl) {
        this._iframeEl = iframeEl;
        this._expectedOrigin = BoardMessenger.resolveExpectedOrigin(appUrl);
    }
    /**
     * A message is trusted only when it comes from the iframe window **and** from the expected origin.
     * The window check alone is not enough: `contentWindow` survives a navigation to a foreign
     * document, so the origin check is what stops a redirected iframe from continuing the exchange.
     */
    isTrusted(event) {
        return event.source === this._iframeEl.contentWindow && event.origin === this._expectedOrigin;
    }
    post(event, data) {
        var _a;
        const message = data === undefined ? { event } : { event, data };
        (_a = this._iframeEl.contentWindow) === null || _a === void 0 ? void 0 : _a.postMessage(message, this._expectedOrigin);
    }
    static resolveExpectedOrigin(appUrl) {
        let url;
        try {
            url = new URL(appUrl);
        }
        catch (e) {
            throw new Error('WebSDK: invalid appUrl');
        }
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            throw new Error('WebSDK: unsupported appUrl scheme');
        }
        return url.origin;
    }
}
//# sourceMappingURL=BoardMessenger.js.map