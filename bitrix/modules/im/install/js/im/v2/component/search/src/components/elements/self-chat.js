import { type EventEmitter } from 'main.core.events';

import { SearchContextMenu } from '../../classes/search-context-menu';

import '../css/self-chat.css';

// @vue/component
export const SelfChat = {
	name: 'SelfChat',
	props: {
		// Comes from the composition of the carousel and is not worked out here: the chat this tile opens
		// by click has to be the very chat the traversal order opens by Enter.
		dialogId: {
			type: String,
			required: true,
		},
		active: {
			type: Boolean,
			default: false,
		},
		navIndex: {
			type: Number,
			default: null,
		},
	},
	emits: ['clickItem'],
	computed:
	{
		name(): string
		{
			return this.$Bitrix.Loc.getMessage('IM_SEARCH_MY_NOTES');
		},
	},
	created()
	{
		this.contextMenuManager = new SearchContextMenu({ emitter: this.getEmitter() });
	},
	beforeUnmount()
	{
		this.contextMenuManager.destroy();
	},
	methods:
	{
		onClick(event)
		{
			this.$emit('clickItem', {
				dialogId: this.dialogId,
				nativeEvent: event,
			});
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
	},
	template: `
		<div
			:data-id="dialogId"
			:data-testid="'im-search-carousel-item-' + dialogId"
			:data-nav-index="navIndex"
			class="bx-im-search-self-chat__container bx-im-search-self-chat__scope"
			:class="{'--keyboard-active': active}"
			@click="onClick"
			@click.right.prevent
		>
			<div class="bx-im-search-self-chat__avatar"></div>
			<div class="bx-im-search-self-chat__title" :title="name">{{ name }}</div>
		</div>
	`,
};
