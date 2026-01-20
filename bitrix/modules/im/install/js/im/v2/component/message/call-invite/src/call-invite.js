import { DefaultMessage } from 'im.v2.component.message.default';
import { CallInviteMessage as OriginalCallInviteMessage } from 'call.component.call-invite';

// @vue/component
export const CallInviteMessage = {
	name: 'CallInviteMessage',
	extends: OriginalCallInviteMessage || DefaultMessage,
};
