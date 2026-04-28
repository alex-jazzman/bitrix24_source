import { type EventEmitter } from 'main.core.events';

import { Core } from 'im.v2.application.core';

import { SearchContextMenu } from '../../classes/search-context-menu';

import '../css/self-chat.css';

// @vue/component
export const SelfChat = {
	name: 'SelfChat',
	emits: ['clickItem'],
	computed:
	{
		dialogId(): number
		{
			return Core.getUserId().toString();
		},
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
			class="bx-im-search-self-chat__container bx-im-search-self-chat__scope"
			@click="onClick" 
			@click.right.prevent
		>
			<div class="bx-im-search-self-chat__avatar"></div>
			<div class="bx-im-search-self-chat__title" :title="name">{{ name }}</div>
		</div>
	`,
};
