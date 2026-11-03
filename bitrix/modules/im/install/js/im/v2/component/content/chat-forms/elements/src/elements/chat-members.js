import { type BaseEvent } from 'main.core.events';
import {
	type Dialog as SelectorDialog,
	type EntityOptions,
	type Item as SelectorItem,
	TagSelector,
} from 'ui.entity-selector';

import 'ui.design-tokens.air';

import { Core } from 'im.v2.application.core';
import { getEntitiesConfig } from 'im.v2.lib.entity-selector-config';
import { SelectorEntity, type SelectorEntityItem } from 'im.v2.const';

import './css/chat-members.css';

// @vue/component
export const ChatMembersSelector = {
	props:
	{
		chatMembers: {
			type: Array,
			required: true,
		},
		customElements: {
			type: Array,
			default: () => [],
		},
		undeselectedItems: {
			type: Array,
			default(): SelectorEntityItem[] {
				return [[SelectorEntity.user, Core.getUserId()]];
			},
		},
		allowTeamsSelect: {
			type: Boolean,
			default: false,
		},
		chatType: {
			type: String,
			default: undefined,
		},
		// An update form knows the chat and its role in it; a creation form has neither yet.
		dialogId: {
			type: String,
			default: undefined,
		},
	},
	emits: ['membersChange'],
	created()
	{
		const addButtonCaption = this.loc('IM_CREATE_CHAT_USER_SELECTOR_ADD_MEMBERS_V2');

		this.membersSelector = new TagSelector({
			maxHeight: 99,
			placeholder: '',
			addButtonCaption,
			addButtonCaptionMore: addButtonCaption,
			showCreateButton: false,
			items: this.customElements,
			dialogOptions: {
				enableSearch: true,
				alwaysShowLabels: true,
				context: 'IM_CHAT_CREATE',
				entities: this.entitiesConfig(),
				preselectedItems: this.chatMembers,
				undeselectedItems: this.undeselectedItems,
				events: {
					'Item:onSelect': this.onItemsChange,
					'Item:onDeselect': this.onItemsChange,
				},
			},
		});
	},
	mounted()
	{
		this.membersSelector.renderTo(this.$refs.members);
	},
	methods:
	{
		entitiesConfig(): EntityOptions[]
		{
			return getEntitiesConfig({
				dialogId: this.dialogId,
				chatType: this.chatType,
				withTeams: this.allowTeamsSelect,
			});
		},
		onItemsChange(event: BaseEvent)
		{
			const dialog: SelectorDialog = event.getTarget();
			const selectedItems: SelectorItem[] = dialog.getSelectedItems();
			this.$emit('membersChange', selectedItems.map((item) => this.prepareTag(item)));
		},
		prepareTag(tag: SelectorItem): SelectorEntityItem
		{
			return [tag.getEntityId(), tag.getId()];
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div
			class="bx-im-chat-forms-chat-members__container"
			data-testid="im-chat-form-members"
			ref="members"
		></div>
	`,
};
