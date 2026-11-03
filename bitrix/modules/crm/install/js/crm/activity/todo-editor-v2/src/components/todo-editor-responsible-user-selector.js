import { Text, Type } from 'main.core';
import type { BaseEvent } from 'main.core.events';
import { Dialog } from 'ui.entity-selector';
import { hint } from 'ui.vue3.directives.hint';
import { Events } from './events';

export const TodoEditorResponsibleUserSelector = {
	directives: { hint },
	props: {
		userId: {
			type: Number,
			required: true,
			default: 0,
		},
		userName: {
			type: String,
			required: true,
			default: '',
		},
		imageUrl: {
			type: String,
			required: true,
			default: '',
		},
	},

	data(): Object
	{
		return {
			userAvatarUrl: this.imageUrl,
		};
	},

	computed: {
		userIconClassName(): Array
		{
			return [
				'ui-icon',
				'ui-icon-common-user',
				'crm-timeline__user-icon',
			];
		},

		userIconStyles(): Object
		{
			if (!this.userAvatarUrl)
			{
				return {};
			}

			return {
				backgroundImage: `url('${encodeURI(Text.encode(this.userAvatarUrl))}')`,
				backgroundSize: '21px',
			};
		},

		hint(): Object
		{
			return {
				text: this.$Bitrix.Loc.getMessage('CRM_ACTIVITY_TODO_CHANGE_RESPONSIBLE'),
				popupOptions: {
					angle: {
						offset: 35,
						position: 'top',
					},
				},
			};
		},
	},

	beforeUnmount(): void
	{
		this.clearDeselectUserTimeout();
	},

	methods: {
		onSelectUser(event: BaseEvent): void
		{
			const selectedItem = event.getData().item.getDialog().getSelectedItems()[0];
			if (selectedItem)
			{
				this.userAvatarUrl = selectedItem.getAvatar();
				this.$Bitrix.eventEmitter.emit(
					Events.EVENT_RESPONSIBLE_USER_CHANGE,
					{
						responsibleUserId: selectedItem.getId(),
					},
				);
			}
		},

		onDeselectUser(event: BaseEvent): void
		{
			const dialog = event.getData().item.getDialog();
			this.clearDeselectUserTimeout();
			this.deselectUserTimeoutId = setTimeout(() => {
				this.deselectUserTimeoutId = null;
				if (this.userSelectorDialog !== dialog)
				{
					return;
				}

				const selectedItems = dialog.getSelectedItems();
				if (selectedItems.length === 0)
				{
					this.userAvatarUrl = this.imageUrl;
					dialog.hide();
					this.$Bitrix.eventEmitter.emit(
						Events.EVENT_RESPONSIBLE_USER_CHANGE,
						{
							responsibleUserId: this.userId,
						},
					);
				}
			}, 100);
		},

		clearDeselectUserTimeout(): void
		{
			clearTimeout(this.deselectUserTimeoutId);
			this.deselectUserTimeoutId = null;
		},

		showUserDialog(): void
		{
			setTimeout(() => {
				this.getUserSelectorDialog().show();
			}, 5);
		},

		resetToDefault(): void
		{
			this.clearDeselectUserTimeout();
			this.userAvatarUrl = this.imageUrl;
			if (this.userSelectorDialog)
			{
				this.userSelectorDialog.destroy();
				this.userSelectorDialog = null;
			}
		},

		getUserSelectorDialog(): Dialog
		{
			if (Type.isNil(this.userSelectorDialog))
			{
				this.userSelectorDialog = new Dialog({
					id: 'responsible-user-selector-dialog',
					targetNode: this.$refs.userSelector,
					context: 'CRM_ACTIVITY_TODO_RESPONSIBLE_USER',
					multiple: false,
					dropdownMode: true,
					showAvatars: true,
					enableSearch: true,
					width: 450,
					zIndex: 2500,
					entities: [
						{
							id: 'user',
						},
					],
					preselectedItems: [
						['user', this.userId],
					],
					undeselectedItems: [
						['user', this.userId],
					],
					events: {
						onDestroy: this.clearDeselectUserTimeout,
						'Item:onSelect': this.onSelectUser,
						'Item:onDeselect': this.onDeselectUser,
					},
				});
			}

			return this.userSelectorDialog;
		},
	},

	watch: {
		imageUrl(imageUrl: string): void
		{
			this.userAvatarUrl = imageUrl;
		},
	},

	template: `
		<div 
			class="crm-activity__todo-editor-v2_responsible-user-selector"
			ref="userSelector"
			@click="showUserDialog"
			v-hint="hint"
		>
			<span :class="userIconClassName">
				<i :style="userIconStyles"></i>
			</span>
		</div>
	`,
};
