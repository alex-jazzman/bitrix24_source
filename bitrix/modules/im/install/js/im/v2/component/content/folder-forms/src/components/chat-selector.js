import { type BaseEvent } from 'main.core.events';
import {
	type Dialog as SelectorDialog,
	type Item as SelectorItem,
	type TagSelectorOptions,
	TagSelector,
} from 'ui.entity-selector';

import { Notifier } from 'im.v2.lib.notifier';
import { SelectorEntity } from 'im.v2.const';

// @vue/component
export const ChatSelector = {
	name: 'ChatSelector',
	props: {
		selectedDialogIds: {
			type: Array,
			required: true,
		},
		chatLimit: {
			type: [Number, null],
			default: null,
		},
	},
	emits: ['selectionChange'],
	created()
	{
		this.membersSelector = new TagSelector(this.getSelectorOptions());
	},
	mounted()
	{
		this.membersSelector.renderTo(this.$refs['chat-selector']);
	},
	methods: {
		getSelectorOptions(): TagSelectorOptions
		{
			const addButtonCaption = this.loc('IM_CREATE_CHAT_USER_SELECTOR_ADD_MEMBERS_V2');
			const itemOrderConfig = { sort: 'desc' };
			const preselectedItems = this.selectedDialogIds.map((dialogId) => {
				return [SelectorEntity.recent, dialogId];
			});

			return {
				maxHeight: 99,
				placeholder: '',
				addButtonCaption,
				addButtonCaptionMore: addButtonCaption,
				showCreateButton: false,
				dialogOptions: {
					enableSearch: true,
					alwaysShowLabels: true,
					context: 'IM_FOLDER_CREATE',
					recentTabOptions: { itemOrder: itemOrderConfig },
					searchTabOptions: { itemOrder: itemOrderConfig },
					entities: [{
						id: SelectorEntity.recent,
						dynamicLoad: true,
						dynamicSearch: true,
						options: { fillDialogByRecent: true },
					}],
					preselectedItems,
					events: {
						'Item:onSelect': this.onItemsChange,
						'Item:onDeselect': this.onItemsChange,
					},
				},
			};
		},
		onItemsChange(event: BaseEvent)
		{
			const dialog: SelectorDialog = event.getTarget();
			const selectedItems: SelectorItem[] = dialog.getSelectedItems();
			if (this.chatLimit && selectedItems.length > this.chatLimit)
			{
				const { item }: { item: SelectorItem } = event.getData();
				Notifier.folder.onChatLimitError(this.chatLimit);
				item.deselect();

				return;
			}

			this.$emit('selectionChange', selectedItems.map((item) => item.getId()));
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-content-folder-forms__chat-selector_container" ref="chat-selector" data-testid="folder-form-chat-selector"></div>
	`,
};
