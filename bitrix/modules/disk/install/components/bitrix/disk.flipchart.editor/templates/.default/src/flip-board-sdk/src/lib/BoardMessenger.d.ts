import { SDKEvents } from './types/events';
/**
 * Owns the message channel to the board iframe.
 *
 * Every incoming message is checked against both the iframe window and the origin derived from
 * `appUrl`, and every outgoing message is addressed to that exact origin. Keeping the channel behind
 * this class is what prevents a `targetOrigin` of `'*'` — and the JWT leak it enables — from coming
 * back through an unrelated refactor.
 */
export declare class BoardMessenger {
    private readonly _iframeEl;
    private readonly _expectedOrigin;
    constructor(iframeEl: HTMLIFrameElement, appUrl: string);
    /**
     * A message is trusted only when it comes from the iframe window **and** from the expected origin.
     * The window check alone is not enough: `contentWindow` survives a navigation to a foreign
     * document, so the origin check is what stops a redirected iframe from continuing the exchange.
     */
    isTrusted(event: MessageEvent): boolean;
    post(event: SDKEvents, data?: unknown): void;
    private static resolveExpectedOrigin;
}
