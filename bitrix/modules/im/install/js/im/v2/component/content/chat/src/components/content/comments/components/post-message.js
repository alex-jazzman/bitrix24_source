import { MessageComponent } from 'im.v2.const';
import type { ImModelMessage } from 'im.v2.model';
import type { JsonObject } from 'main.core';
import { MessageComponentManager } from '../../../../../../../message-list/src/classes/message-component-manager';

// @vue/component
export const PostMessage = {
	name: 'PostMessage',
	data(): JsonObject
	{
		return {};
	},
	methods:
	{
		getMessageComponentName(message: ImModelMessage): $Values<typeof MessageComponent>
		{
			return (new MessageComponentManager(message)).getName();
		},
	},
	template: `
		<component
			:is="getMessageComponentName(message)"
			:withTitle="index === 0"
			:item="message"
			:dialogId="dialogId"
			:key="message.id"
			:menuIsActiveForId="messageMenuIsActiveForId"
			@mouseup="onMessageMouseUp(message, $event)"
		>
		</component>
	`,
};
