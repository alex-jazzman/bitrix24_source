export type SDKAITextOperationType = 'fix' | 'translate';
export interface SDKAITextRequestData {
    requestId: string;
    type: SDKAITextOperationType;
    text: string;
    language?: string;
}
export interface SDKAITextResponseData {
    requestId: string;
    result: string;
}
export interface SDKAITextErrorData {
    requestId: string;
    code: string;
    message?: string;
}
export interface SDKAITextCancelData {
    requestId: string;
}
export interface SDKAITextSuccessResult {
    result: string;
}
export interface SDKAITextErrorResult {
    error: {
        code: string;
        message?: string;
    };
}
