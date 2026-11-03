import { BoardMessenger } from './BoardMessenger';
import { SDKEvents } from './types/events';
export type SdkEventHandler = (data: unknown) => void;
export type Unsubscribe = () => void;
/**
 * Single `message` listener for the whole SDK.
 *
 * Handlers are registered per event and never see an untrusted message: the trust check happens once
 * here instead of being repeated — and eventually forgotten — in every temporary handler.
 */
export declare class SdkEventBus {
    private readonly _messenger;
    private readonly _handlers;
    private _isListening;
    constructor(messenger: BoardMessenger);
    start(): void;
    stop(): void;
    /** Several handlers may listen to the same event; returns the unsubscribe for this one. */
    on(event: SDKEvents, handler: SdkEventHandler): Unsubscribe;
    /** Resolves on `successEvent`, rejects on `errorEvent`, and drops both subscriptions either way. */
    waitFor(successEvent: SDKEvents, errorEvent: SDKEvents): Promise<void>;
    private handleMessage;
}
