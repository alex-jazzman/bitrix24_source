/**
 * Shape shared by every board→host request that expects an answer.
 *
 * The board correlates the reply by `requestId`, so a host handler must echo it back untouched.
 * A handler resolves with its own success payload or with `SDKHostErrorResult`; anything else
 * (a rejection, a missing handler) is turned into an error event by the SDK itself.
 */
export interface SDKHostRequestData {
    requestId: string;
}
export interface SDKHostErrorResult {
    error: {
        code: string;
        message?: string;
    };
}
