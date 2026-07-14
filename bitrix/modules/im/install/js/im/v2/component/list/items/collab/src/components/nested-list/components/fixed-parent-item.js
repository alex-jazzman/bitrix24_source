import { type EventEmitter } from 'main.core.events';

import { BaseRecentItem, FixedItemContainer } from 'im.v2.component.list.items.base';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelRecentItem } from 'im.v2.model';

import { FixedParentRecentMenu } from './classes/context-menu';

// @vue/component
export const FixedParentItem = {
	name: 'FixedParentItem',
	components: { FixedItemContainer, BaseRecentItem },
	props: {
		parentChatId: {
			type: Number,
			required: true,
		},
	},
	computed: {
		parentDialogId(): string
		{
			return Utils.dialog.buildChatDialogId(this.parentChatId);
		},
		parentRecentItem(): ImModelRecentItem
		{
			return this.$store.getters['recent/get'](this.parentDialogId);
		},
	},
	created()
	{
		this.contextMenuManager = new FixedParentRecentMenu({ emitter: this.getEmitter() });
	},
	methods: {
		onRightClick(event: PointerEvent)
		{
			event.preventDefault();

			const context = {
				dialogId: this.parentRecentItem.dialogId,
				recentItem: this.parentRecentItem,
			};

			this.contextMenuManager.openMenu(context, {
				left: event.pageX,
				top: event.pageY,
			});
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
	},
	template: `
		<FixedItemContainer  class="bx-im-collab-nested-list__fixed-items_container">
			<BaseRecentItem
				:item="parentRecentItem"
				:withPinStatus="false"
				:withChildrenCounter="false"
				@click.right="onRightClick"
			/>
		</FixedItemContainer>
	`,
};
