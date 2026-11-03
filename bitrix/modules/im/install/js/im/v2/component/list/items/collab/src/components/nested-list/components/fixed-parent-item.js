import { type EventEmitter } from 'main.core.events';
import { markRaw } from 'ui.vue3';

import { BaseRecentItem, FixedItemContainer } from 'im.v2.component.list.items.base';
import { HotkeyCombination } from 'im.v2.const';
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
		this.contextMenuManager = markRaw(new FixedParentRecentMenu({ emitter: this.getEmitter() }));
	},
	beforeUnmount()
	{
		this.contextMenuManager.destroy();
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
		// The row of the project chat is pinned here precisely because it is not in the collection of
		// the section, so the list-wide row keydown handler finds no item for it and drops the
		// keystroke. This row answers for its own keyboard, the way the create-chat draft row does.
		handleActivationKeydown(event: KeyboardEvent): void
		{
			// Only the row itself reacts; keydowns bubbling up from nested content stay with them.
			if (event.target !== event.currentTarget)
			{
				return;
			}

			if (Utils.key.isCombination(event, HotkeyCombination.list.contextMenu))
			{
				// The same menu as a right click, anchored to the focused row instead of cursor
				// coordinates; preventDefault stops the browser's native menu.
				event.preventDefault();
				this.contextMenuManager.openMenuFromKeyboard(
					{ dialogId: this.parentRecentItem.dialogId, recentItem: this.parentRecentItem },
					event.currentTarget,
				);

				return;
			}

			if (event.key === 'Enter' || event.key === ' ')
			{
				// Synthesize the native click the mouse path uses: the list binds @click, which falls
				// through to the root of this component, so keyboard and mouse share one handler.
				event.preventDefault();
				event.currentTarget.click();
			}
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
				:forceOwnMessage="true"
				@click.right="onRightClick"
				@keydown="handleActivationKeydown"
			/>
		</FixedItemContainer>
	`,
};
