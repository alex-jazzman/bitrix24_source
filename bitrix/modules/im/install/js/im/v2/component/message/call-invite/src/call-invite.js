import { DefaultMessage } from 'im.v2.component.message.default';
import { CallInviteMessage as OriginalCallInviteMessage } from 'call.widget.call-invite';
import { defineComponent } from 'ui.vue3';

// @vue/component
export const CallInviteMessage = defineComponent({
	name: 'CallInviteMessage',
	extends: OriginalCallInviteMessage || DefaultMessage,
});
