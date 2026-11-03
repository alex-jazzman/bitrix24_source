/**
 * Single `message` listener for the whole SDK.
 *
 * Handlers are registered per event and never see an untrusted message: the trust check happens once
 * here instead of being repeated — and eventually forgotten — in every temporary handler.
 */
export class SdkEventBus {
    constructor(messenger) {
        this._handlers = new Map();
        this._isListening = false;
        this.handleMessage = (event) => {
            if (!this._messenger.isTrusted(event)) {
                return;
            }
            const message = event.data;
            if (!message || typeof message.event !== 'string') {
                return;
            }
            const handlers = this._handlers.get(message.event);
            if (!handlers) {
                return;
            }
            // Copy first: a handler may unsubscribe itself or a sibling while we are dispatching.
            Array.from(handlers).forEach((handler) => handler(message.data));
        };
        this._messenger = messenger;
    }
    start() {
        if (this._isListening) {
            return;
        }
        window.addEventListener('message', this.handleMessage);
        this._isListening = true;
    }
    stop() {
        if (!this._isListening) {
            return;
        }
        window.removeEventListener('message', this.handleMessage);
        this._isListening = false;
    }
    /** Several handlers may listen to the same event; returns the unsubscribe for this one. */
    on(event, handler) {
        var _a;
        const handlers = (_a = this._handlers.get(event)) !== null && _a !== void 0 ? _a : new Set();
        handlers.add(handler);
        this._handlers.set(event, handlers);
        return () => {
            handlers.delete(handler);
        };
    }
    /** Resolves on `successEvent`, rejects on `errorEvent`, and drops both subscriptions either way. */
    waitFor(successEvent, errorEvent) {
        return new Promise((resolve, reject) => {
            const unsubscribes = [];
            const stopWaiting = () => unsubscribes.forEach((unsubscribe) => unsubscribe());
            unsubscribes.push(this.on(successEvent, () => {
                stopWaiting();
                resolve();
            }), this.on(errorEvent, () => {
                stopWaiting();
                reject();
            }));
        });
    }
}
//# sourceMappingURL=SdkEventBus.js.map