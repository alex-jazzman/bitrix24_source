import { IBoard, SDKParams } from './types/SDK';
declare global {
    interface Window {
        FlipBoard: IBoard;
    }
}
export declare class WebSDK {
    private readonly _params;
    private readonly _boardParams;
    private readonly _iframeEl;
    private readonly _messenger;
    private readonly _bus;
    constructor(params: SDKParams);
    init(): void;
    destroy(): void;
    isTrustedMessage(event: MessageEvent): boolean;
    private registerEventHandlers;
    private handleAITextRequest;
    private handleMentionMembersRequest;
    /**
     * Runs one host handler and answers the board on the matching event pair. A host that did not
     * subscribe gets `NOT_SUPPORTED` rather than silence, so the board can stop waiting instead of
     * hanging on a request nobody will ever answer. Shared so a new request event costs a
     * subscription rather than another copy of this flow.
     */
    private respondToBoard;
    private getBoardMethods;
    private createUrl;
}
