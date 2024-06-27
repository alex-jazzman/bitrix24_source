import { BaseEvent } from 'main.core.events';
import {
	TagSelector,
	type Dialog as SelectorDialog,
	type Item as SelectorItem,
	type EntityOptions,
} from 'ui.entity-selector';

import { Core } from 'im.v2.application.core';
import { ChatType } from 'im.v2.const';
import { Feature, FeatureManager } from 'im.v2.lib.feature';

// @vue/component
export const ChatMembersSelector = {
	props:
	{
		chatMembers: {
			type: Array,
			required: true,
		},
		chatType: {
			type: String,
			default: ChatType.chat,
		},
	},
	emits: ['membersChange'],
	created()
	{
		const preselectedItems = [['user', Core.getUserId()], ...this.chatMembers];
		const addButtonCaption = this.loc('IM_CREATE_CHAT_USER_SELECTOR_ADD_MEMBERS_V2');

		this.membersSelector = new TagSelector({
			maxHeight: 99,
			placeholder: '',
			addButtonCaption,
			addButtonCaptionMore: addButtonCaption,
			showCreateButton: false,
			dialogOptions: {
				enableSearch: true,
				context: 'IM_CHAT_CREATE',
				entities: this.getEntitiesConfig(),
				preselectedItems,
				undeselectedItems: [['user', Core.getUserId()]],
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
		getEntitiesConfig(): EntityOptions[]
		{
			const entitiesConfig = [{ id: 'user' }];
			const allowDepartments = FeatureManager.isFeatureAvailable(Feature.chatDepartments);
			if (allowDepartments)
			{
				entitiesConfig.push({
					id: 'department',
					options: {
						selectMode: 'usersAndDepartments',
						allowFlatDepartments: true,
						allowSelectRootDepartment: true,
					},
				});
			}
			else
			{
				entitiesConfig.push({ id: 'department' });
			}

			return entitiesConfig;
		},
		onItemsChange(event: BaseEvent)
		{
			const dialog: SelectorDialog = event.getTarget();
			const selectedItems: SelectorItem[] = dialog.getSelectedItems();
			this.$emit('membersChange', selectedItems.map((item) => this.prepareTag(item)));
		},
		prepareTag(tag: SelectorItem): [string, number | string]
		{
			return [tag.getEntityId(), tag.getId()];
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-content-create-chat__members" ref="members"></div>
	`,
};
