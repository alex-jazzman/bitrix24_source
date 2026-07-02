import { CreateChatButton } from 'im.v2.component.list.container.elements.create-chat-button';
import { ChatSearchInput } from 'im.v2.component.search';

import { CreateMenu } from '../classes/create-menu';

// @vue/component
export const NestedListToolbar = {
	name: 'NestedListToolbar',
	components: { CreateChatButton, ChatSearchInput },
	props: {
		parentChatId: {
			type: Number,
			required: true,
		},
	},
	emits: ['createClick'],
	mounted()
	{
		this.contextMenuManager = new CreateMenu();
	},
	beforeUnmount()
	{
		this.contextMenuManager.destroy();
	},
	methods: {
		onCreateClick(event: PointerEvent)
		{
			const context = { parentChatId: this.parentChatId };
			this.contextMenuManager.openMenu(context, event.currentTarget);
		},
	},
	template: `
		<div class="bx-im-nested-list-collab__subheader">
			<div class="bx-im-nested-list-collab__search">
				<ChatSearchInput :searchMode="false" />
			</div>
			<CreateChatButton @click="onCreateClick" class="bx-im-nested-list-collab__subheader_create-button" ref="create-button" />
		</div>
	`,
};
