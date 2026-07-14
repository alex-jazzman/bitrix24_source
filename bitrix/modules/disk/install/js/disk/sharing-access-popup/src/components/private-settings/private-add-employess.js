import { Type, Loc, Runtime } from 'main.core';
import { markRaw } from 'ui.vue3';
import { Dialog } from 'ui.entity-selector';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { TextSm } from 'ui.system.typography.vue';

import {
	getSelectorItemByAccessCode,
	getAccessCodeByDialogItem,
} from '../../utils/private-members';
import { PrivateUserItem } from './private-users-selected';

// @vue/component
export const PrivateAccessAddEmployess = {
	name: 'PrivateAccessAddEmployess',
	components: { UiButton, TextSm, PrivateUserItem },
	props: {
		items: { type: Array, default: () => [] },
		isSaving: { type: Boolean, default: false },
	},
	emits: ['selectionChange', 'selectionApply', 'changeRight'],
	data()
	{
		return {
			dialog: null,
			isUnmounting: false,
			isProjectEntityAvailable: false,
		};
	},
	computed: {
		AirButtonStyle: () => AirButtonStyle,
		ButtonSize: () => ButtonSize,
	},
	beforeUnmount()
	{
		this.isUnmounting = true;
		this.destroyDialog();
	},
	methods: {
		canUseInSelector(item)
		{
			const selectorItem = getSelectorItemByAccessCode(item.entityId);
			if (!selectorItem)
			{
				return false;
			}

			return !(selectorItem[0] === 'project' && !this.isProjectEntityAvailable);
		},
		getPreselectedItems()
		{
			return this.items
				.filter((item) => this.canUseInSelector(item))
				.map((item) => getSelectorItemByAccessCode(item.entityId))
				.filter(Boolean);
		},
		getUndeselectedItems()
		{
			return this.items
				.filter((item) => item.readOnly && this.canUseInSelector(item))
				.map((item) => getSelectorItemByAccessCode(item.entityId))
				.filter(Boolean);
		},
		getUnmanagedCurrentItems()
		{
			return this.items
				.filter((item) => !this.canUseInSelector(item))
				.map((item) => ({
					entityId: item.entityId,
					title: item.title,
					avatar: item.avatar,
				}));
		},
		getSelectionSignature(items)
		{
			return items
				.map((item) => item.entityId)
				.filter(Boolean)
				.sort()
				.join('|');
		},
		getSelectedMembers()
		{
			if (!this.dialog)
			{
				return [];
			}

			return this.dialog.getSelectedItems().map((item) => {
				const entityId = getAccessCodeByDialogItem(item);
				if (!entityId)
				{
					return null;
				}

				return {
					entityId,
					title: item.getTitle(),
					avatar: item.getAvatar(),
				};
			}).filter(Boolean);
		},
		getNextItems()
		{
			return [
				...this.getSelectedMembers(),
				...this.getUnmanagedCurrentItems(),
			];
		},
		emitSelectionChange()
		{
			const nextItems = this.getNextItems();

			if (this.getSelectionSignature(nextItems) === this.getSelectionSignature(this.items))
			{
				return;
			}

			this.$emit('selectionChange', nextItems);
		},
		applySelection()
		{
			this.$emit('selectionApply', this.getNextItems());
		},
		getDialogEntities()
		{
			const entities = [
				{
					id: 'user',
					options: {
						inviteEmployeeLink: false,
						inviteGuestLink: true,
						selectFields: ['workDepartment'],
					},
				},

				{
					id: 'department',
					options: {
						selectMode: 'usersAndDepartments',
					},
				},
			];

			if (this.isProjectEntityAvailable)
			{
				entities.push({ id: 'project' });
			}

			return entities;
		},
		initDialog()
		{
			if (this.dialog)
			{
				return;
			}

			const targetNode = this.getTargetNode();
			if (!targetNode)
			{
				return;
			}

			this.dialog = markRaw(new Dialog({
				id: 'disk-sharing-private-access-selector',
				targetNode,
				width: 420,
				height: 360,
				multiple: true,
				enableSearch: true,
				compactView: true,
				context: 'DISK_SHARING_PRIVATE_ACCESS',
				preselectedItems: this.getPreselectedItems(),
				undeselectedItems: this.getUndeselectedItems(),
				entities: this.getDialogEntities(),
				events: {
					'Item:onSelect': () => {
						if (!this.isUnmounting)
						{
							this.emitSelectionChange();
						}
					},
					'Item:onDeselect': () => {
						if (!this.isUnmounting)
						{
							this.emitSelectionChange();
						}
					},
					onHide: () => {
						if (!this.isUnmounting)
						{
							this.applySelection();
						}
					},
					onDestroy: () => {
						this.dialog = null;
					},
				},
			}));
		},
		destroyDialog()
		{
			if (!this.dialog)
			{
				return;
			}

			if (Type.isFunction(this.dialog.destroy))
			{
				this.dialog.destroy();
			}

			this.dialog = null;
		},
		async openDialog()
		{
			if (this.isSaving)
			{
				return;
			}

			this.isProjectEntityAvailable = await Runtime.loadExtension('socialnetwork.entity-selector')
				.then(() => true)
				.catch(() => false);

			this.destroyDialog();
			this.initDialog();

			if (!this.dialog)
			{
				return;
			}

			const targetNode = this.getTargetNode();
			if (targetNode)
			{
				this.dialog.setTargetNode(targetNode);
			}

			this.dialog.show();
		},
		getTargetNode()
		{
			const buttonComponent = this.$refs.selectButton;

			if (!buttonComponent)
			{
				return null;
			}

			const button = buttonComponent.button;
			if (button && Type.isFunction(button.getContainer))
			{
				return button.getContainer();
			}

			return buttonComponent.$el ?? buttonComponent;
		},
	},
	template: `
		<div class="access-private-add-employess_wrapper">
			<TextSm
				tag="div"
				className="access-private-add-employess__description"
			>
				${Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PRIVATE_EMPLOYEES_LABEL')}
			</TextSm>
			<div class="access-private-add-employess__actions">
				<UiButton
					ref="selectButton"
					text="${Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PRIVATE_EMPLOYEES_BUTTON')}"
					:size="ButtonSize.MEDIUM"
					:style="AirButtonStyle.OUTLINE_ACCENT_2"
					:disabled="isSaving"
					@click="openDialog"
				/>
			</div>
		</div>
		<div v-if="items.length" class="access-private-add-employess__selected">
			<div class="access-private-head__menu">
				<TextSm
					tag="p"
					className="access-private-head__user-title"
				>
					${Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PRIVATE_USERS_NAME')}
				</TextSm>
				<TextSm
					tag="p"
					className="access-private-head__access-level"
				>
					${Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PRIVATE_ACCESS_LEVEL')}
				</TextSm>
			</div>
			<div class="access-private-user__users-container">
				<PrivateUserItem
					v-for="item in items"
					:key="item.entityId"
					:title="item.title"
					:taskName="item.right"
					:maxTaskName="item.maxTaskName"
					:readOnly="item.readOnly"
					@changeRight="$emit('changeRight', { entityId: item.entityId, right: $event })"
				/>
			</div>
		</div>
	`,
};
