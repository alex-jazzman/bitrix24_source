import type { JsonObject } from 'main.core';
import { Loc } from 'main.core';
import { Menu, PopupManager } from 'main.popup';
import { getMemberRoles } from 'humanresources.company-structure.api';
import { ConfirmationPopup } from '../popup/confirmation-popup';

import type { MemberRolesType } from 'humanresources.company-structure.api';

import './styles/dnd-confirmation-popup.css';

// @vue/component
export const MoveEmployeeConfirmationPopup = {
	name: 'MoveEmployeeConfirmationPopup',
	components: { ConfirmationPopup },
	props: {
		title: {
			type: String,
			default: Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DND_USER_CONFIRM_POPUP_TITLE'),
		},
		description: {
			type: String,
			required: true,
		},
		confirmButtonText: {
			type: String,
			default: Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DND_USER_CONFIRM_POPUP_CONFIRM_BTN'),
		},
		entityType: {
			type: String,
			default: 'department',
		},
		showRoleSelect: {
			type: Boolean,
			default: false,
		},
		showCombineCheckbox: {
			type: Boolean,
			default: false,
		},
		isCombineOnly: {
			type: Boolean,
			default: false,
		},
		excludeEmployeeRole: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['confirm', 'close'],
	data(): JsonObject
	{
		return {
			selectedRole: null,
			combinePosition: this.isCombineOnly,
		};
	},
	computed: {
		memberRoles(): ?MemberRolesType
		{
			return getMemberRoles(this.entityType);
		},
		selectedRoleLabel(): string
		{
			switch (this.selectedRole)
			{
				case this.memberRoles.head:
					return this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DND_USER_CONFIRM_POPUP_BADGE_HEAD');
				case this.memberRoles.deputyHead:
					return this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DND_USER_CONFIRM_POPUP_BADGE_DEPUTY');
				case this.memberRoles.employee:
					return this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DND_USER_CONFIRM_POPUP_BADGE_EMPLOYEE');
				default:
					return '';
			}
		},
	},
	created()
	{
		if (this.showRoleSelect)
		{
			this.selectedRole = this.excludeEmployeeRole ? this.memberRoles.head : this.memberRoles.employee;
		}
	},
	methods: {
		loc(phrase: string): string
		{
			return Loc.getMessage(phrase);
		},
		handleConfirm(): void
		{
			const payload = {
				role: this.selectedRole,
				roleLabel: this.selectedRoleLabel,
				isCombineMode: this.combinePosition,
			};

			if (this.selectedRole !== this.memberRoles.employee)
			{
				payload.badgeText = this.selectedRoleLabel;
			}

			this.$emit('confirm', payload);
		},
		toggleRoleMenu(): void
		{
			const menuId = 'dnd-confirmation-role-menu';
			const bindElement = this.$refs.roleSelect;

			if (PopupManager.getPopupById(menuId))
			{
				PopupManager.getPopupById(menuId).destroy();

				return;
			}

			const menu = new Menu({
				id: menuId,
				bindElement,
				width: 334,
				items: this.roleMenuItems(),
				events: {
					onPopupClose: () => {
						menu.destroy();
					},
				},
			});
			menu.show();
		},
		roleMenuItems(): array
		{
			const memberRoles = getMemberRoles(this.entityType);

			const items = [
				{
					id: memberRoles.head,
					text: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DND_USER_CONFIRM_POPUP_BADGE_HEAD'),
				},
				{
					id: memberRoles.deputyHead,
					text: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DND_USER_CONFIRM_POPUP_BADGE_DEPUTY'),
				},
			];

			if (!this.excludeEmployeeRole)
			{
				items.push({
					id: memberRoles.employee,
					text: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DND_USER_CONFIRM_POPUP_BADGE_EMPLOYEE'),
				});
			}

			return items.map((item) => ({
				...item,
				onclick: (event, menuItem) => {
					this.selectedRole = menuItem.id;
					menuItem.getMenuWindow().close();
				},
			}));
		},
	},
	template: `
		<ConfirmationPopup
			:title="title"
			:width="364"
			:confirmBtnText="confirmButtonText"
			@action="handleConfirm"
			@close="$emit('close')"
		>
			<template v-slot:content>
				<div class="hr-dnd-confirmation_block">
					<div v-html="description" class="hr-dnd-confirmation_description"></div>
					<div v-if="showRoleSelect"
						 class="ui-ctl ui-ctl-w100 ui-ctl-sm ui-ctl-after-icon ui-ctl-dropdown hr-dnd-confirmation_select"
						 @click="toggleRoleMenu"
						 ref="roleSelect"
					>
						<div class="ui-ctl-after ui-ctl-icon-angle"></div>
						<div class="ui-ctl-element">{{ selectedRoleLabel }}</div>
					</div>
					<div v-if="showCombineCheckbox" class="ui-ctl ui-ctl-checkbox hr-dnd-confirmation_checkbox">
						<input
							type="checkbox"
							class="ui-ctl-element"
							v-model="combinePosition"
							:disabled="isCombineOnly"
							id="dnd-confirmation-combine-checkbox"
						>
						<label for="dnd-confirmation-combine-checkbox" class="ui-ctl-label-text">
							{{ loc('HUMANRESOURCES_COMPANY_STRUCTURE_DND_USER_CONFIRM_POPUP_CHECKBOX') }}
						</label>
					</div>
				</div>
			</template>
		</ConfirmationPopup>
	`,
};
