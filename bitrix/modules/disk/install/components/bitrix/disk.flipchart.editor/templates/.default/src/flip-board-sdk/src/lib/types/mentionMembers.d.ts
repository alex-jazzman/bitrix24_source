import { SDKHostRequestData } from './hostRequest';
/**
 * A person the board may offer for a mention. `id` is echoed back to the board and stored inside
 * the message content, so it must be the identifier the backend knows the user by.
 */
export interface SDKMentionMember {
    id: string;
    name: string;
    email?: string;
    avatarUrl?: string;
}
export interface SDKMentionMembersRequestData extends SDKHostRequestData {
    /** Text typed after `@`, empty while the picker is opened from the toolbar button. */
    query: string;
}
export interface SDKMentionMembersResponseData extends SDKHostRequestData {
    members: SDKMentionMember[];
}
export interface SDKMentionMembersErrorData extends SDKHostRequestData {
    code: string;
    message?: string;
}
export interface SDKMentionMembersCancelData extends SDKHostRequestData {
    requestId: string;
}
export interface SDKMentionMembersSuccessResult {
    members: SDKMentionMember[];
}
export interface SDKMentionMembersErrorResult {
    error: {
        code: string;
        message?: string;
    };
}
