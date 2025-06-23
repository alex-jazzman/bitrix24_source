import { getMemberRoles, type MemberRolesType } from 'humanresources.company-structure.api';
import { useChartStore } from 'humanresources.company-structure.chart-store';
import { PermissionActions, PermissionChecker } from 'humanresources.company-structure.permission-checker';
import { ConfirmationPopup } from 'humanresources.company-structure.structure-components';
import { EntityTypes } from 'humanresources.company-structure.utils';
import { Text } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { TagSelector } from 'ui.entity-selector';
import { UI } from 'ui.notification';
import { mapState } from 'ui.vue3.pinia';
import { DepartmentContentActions } from '../../../actions';
import { DepartmentAPI } from '../../../api';

import './styles/move-user-action-popup.css';

// @vue/component
export const MoveUserActionPopup = {
	name: 'MoveUserActionPopup',
	components: { ConfirmationPopup },
	emits: ['close', 'action'],

	props: {
		parentId: {
			type: Number,
			required: true,
		},
		user: {
			type: Object,
			required: true,
		},
		entityType: {
			type: String,
			required: true,
		},
	},

	created(): void
	{
		this.permissionChecker = PermissionChecker.getInstance();

		if (!this.permissionChecker)
		{
			return;
		}

		this.action = this.isTeamEntity
			? PermissionActions.teamAddMember
			: PermissionActions.employeeAddToDepartment
		;
		this.selectedDepartmentId = 0;
	},

	data(): Object
	{
		return {
			showMoveUserActionLoader: false,
			lockMoveUserActionButton: false,
			showUserAlreadyBelongsToDepartmentPopup: false,
			accessDenied: false,
		};
	},

	mounted(): void
	{
		const departmentContainer = this.$refs['department-selector'];
		this.departmentSelector = this.createTagSelector();
		this.departmentSelector.renderTo(departmentContainer);
	},

	computed: {
		...mapState(useChartStore, ['departments', 'focusedNode']),
		includedNodeEntityTypesInDialog(): string[]
		{
			return this.isTeamEntity ? ['team'] : ['department'];
		},
		getMoveUserActionPhrase(): string
		{
			const departmentName = Text.encode(this.departments.get(this.focusedNode).name ?? '');
			const userName = Text.encode(this.user.name ?? '');

			let phraseCode = '';
			if (this.isTeamEntity)
			{
				phraseCode = 'HUMANRESOURCES_DEPARTMENT_CONTENT_TAB_USER_ACTION_MENU_MOVE_TO_ANOTHER_TEAM_REMOVE_USER_DESCRIPTION';
				phraseCode += this.user.gender === 'F' ? '_F' : '_M';
			}
			else
			{
				phraseCode = 'HUMANRESOURCES_DEPARTMENT_CONTENT_TAB_USER_ACTION_MENU_MOVE_TO_ANOTHER_DEPARTMENT_ALREADY_BELONGS_TO_DEPARTMENT_DESCRIPTION_MSGVER_1';
			}

			return this.loc(
				phraseCode,
				{
					'#USER_NAME#': userName,
					'#DEPARTMENT_NAME#': departmentName,
				},
			)
				.replace(
					'[link]',
					`<a class="hr-department-detail-content__move-user-department-user-link" href="${this.user.url}">`,
				)
				.replace('[/link]', '</a>')
			;
		},
		getUserAlreadyBelongsToDepartmentPopupPhrase(): string
		{
			const departmentName = Text.encode(this.departments.get(this.selectedParentDepartment ?? 0).name ?? '');
			const userName = Text.encode(this.user.name ?? '');

			let phraseCode = '';
			if (this.isTeamEntity)
			{
				phraseCode = 'HUMANRESOURCES_DEPARTMENT_CONTENT_TAB_USER_ACTION_MENU_MOVE_TO_ANOTHER_TEAM_ALREADY_BELONGS_TO_TEAM_DESCRIPTION';
				phraseCode += this.user.gender === 'F' ? '_F' : '_M';
			}
			else
			{
				phraseCode = 'HUMANRESOURCES_DEPARTMENT_CONTENT_TAB_USER_ACTION_MENU_MOVE_TO_ANOTHER_DEPARTMENT_ALREADY_BELONGS_TO_DEPARTMENT_DESCRIPTION_MSGVER_1';
			}

			let phrase = this.loc(
				phraseCode,
				{
					'#USER_NAME#': userName,
					'#DEPARTMENT_NAME#': departmentName,
				},
			);
			phrase = phrase.replace('[link]', `<a class="hr-department-detail-content__move-user-department-user-link" href="${this.user.url}">`);
			phrase = phrase.replace('[/link]', '</a>');

			return phrase;
		},
		memberRoles(): MemberRolesType
		{
			return getMemberRoles(this.entityType);
		},
		isTeamEntity(): boolean
		{
			return this.entityType === EntityTypes.team;
		},
		confirmTitle(): string
		{
			return this.isTeamEntity
				? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_USER_ACTION_MENU_MOVE_TO_ANOTHER_TEAM_POPUP_CONFIRM_TITLE')
				: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_USER_ACTION_MENU_MOVE_TO_ANOTHER_DEPARTMENT_POPUP_CONFIRM_TITLE')
			;
		},
		confirmDescription(): string
		{
			return this.isTeamEntity
				? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_USER_ACTION_MENU_MOVE_TO_ANOTHER_TEAM_POPUP_ACTION_SELECT_TEAM_DESCRIPTION')
				: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_USER_ACTION_MENU_MOVE_TO_ANOTHER_DEPARTMENT_POPUP_ACTION_SELECT_DEPARTMENT_DESCRIPTION')
			;
		},
	},

	methods: {
		createTagSelector(): TagSelector
		{
			return new TagSelector({
				events: {
					onTagAdd: (event: BaseEvent) => {
						this.accessDenied = false;
						const { tag } = event.data;
						this.selectedParentDepartment = tag.id;
						if (PermissionChecker.hasPermission(this.action, tag.id))
						{
							this.lockMoveUserActionButton = false;

							return;
						}

						this.accessDenied = true;
						this.lockMoveUserActionButton = true;
					},
					onTagRemove: () => {
						this.lockMoveUserActionButton = true;
					},
				},
				multiple: false,
				dialogOptions: {
					width: 425,
					height: 350,
					dropdownMode: true,
					hideOnDeselect: true,
					entities: [
						{
							id: 'structure-node',
							options: {
								selectMode: 'departmentsOnly',
								restricted: 'addMember',
								includedNodeEntityTypes: this.includedNodeEntityTypesInDialog,
								useMultipleTabs: true,
							},
						},
					],
					preselectedItems: [['structure-node', this.parentId]],
				},
			});
		},
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
		async confirmMoveUser(): Promise<void>
		{
			this.showMoveUserActionLoader = true;
			const departmentId = this.focusedNode;
			const userId = this.user.id;
			const targetNodeId = this.selectedParentDepartment;

			try
			{
				await DepartmentAPI.moveUserToDepartment(
					departmentId,
					userId,
					targetNodeId,
				);
			}
			catch (error)
			{
				this.showMoveUserActionLoader = false;

				const code = error.code ?? 0;

				if (code === 'MEMBER_ALREADY_BELONGS_TO_NODE')
				{
					this.showUserAlreadyBelongsToDepartmentPopup = true;
				}
				else
				{
					const phraseCode = this.isTeamEntity
						? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_USER_ACTION_MENU_MOVE_TO_ANOTHER_TEAM_ERROR')
						: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_USER_ACTION_MENU_MOVE_TO_ANOTHER_DEPARTMENT_ERROR')
					;
					UI.Notification.Center.notify({
						content: phraseCode,
						autoHideDelay: 2000,
					});
					this.$emit('close');
				}

				return;
			}

			const departmentName = Text.encode(this.departments.get(targetNodeId)?.name ?? '');
			const phraseCode = this.isTeamEntity
				? 'HUMANRESOURCES_DEPARTMENT_CONTENT_TAB_USER_ACTION_MENU_MOVE_TO_ANOTHER_TEAM_SUCCESS_MESSAGE'
				: 'HUMANRESOURCES_DEPARTMENT_CONTENT_TAB_USER_ACTION_MENU_MOVE_TO_ANOTHER_DEPARTMENT_SUCCESS_MESSAGE'
			;
			UI.Notification.Center.notify({
				content: this.loc(
					phraseCode,
					{
						'#DEPARTMENT_NAME#': departmentName,
					},
				),
				autoHideDelay: 2000,
			});

			DepartmentContentActions.moveUserToDepartment(
				departmentId,
				userId,
				targetNodeId,
				this.user.role ?? this.memberRoles.employee,
			);

			this.$emit('action');
			this.showMoveUserActionLoader = false;
		},
		closeAction(): void
		{
			this.$emit('close');
		},
		closeUserAlreadyBelongsToDepartmentPopup(): void
		{
			this.showUserAlreadyBelongsToDepartmentPopup = false;
			this.closeAction();
		},
	},

	template: `
		<ConfirmationPopup
			@action="confirmMoveUser"
			@close="closeAction"
			:showActionButtonLoader="showMoveUserActionLoader"
			:lockActionButton="lockMoveUserActionButton"
			:title="confirmTitle"
			:confirmBtnText = "loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_USER_ACTION_MENU_MOVE_TO_ANOTHER_DEPARTMENT_POPUP_CONFIRM_BUTTON')"
			:width="364"
		>
			<template v-slot:content>
				<div class="hr-department-detail-content__user-action-text-container">
					<div v-html="getMoveUserActionPhrase"/>
					<span>
						{{confirmDescription}}
					</span>
				</div>
				<div
					class="hr-department-detail-content__move-user-department-selector"
					ref="department-selector"
					:class="{ 'ui-ctl-warning': accessDenied }"
				/>
				<div
					v-if="accessDenied"
					class="hr-department-detail-content__move-user-department_item-error"
				>
					<div class="ui-icon-set --warning"></div>
					<span
						class="hr-department-detail-content__move-user-department_item-error-message"
					>
							{{loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_USER_ACTION_MENU_MOVE_TO_ANOTHER_DEPARTMENT_PERMISSION_ERROR')}}
					</span>
				</div>
			</template>
		</ConfirmationPopup>
		<ConfirmationPopup
			@action="closeUserAlreadyBelongsToDepartmentPopup"
			@close="closeUserAlreadyBelongsToDepartmentPopup"
			v-if="showUserAlreadyBelongsToDepartmentPopup"
			:withoutTitleBar = true
			:onlyConfirmButtonMode = true
			:confirmBtnText = "loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_USER_ACTION_MENU_MOVE_TO_ANOTHER_DEPARTMENT_ALREADY_BELONGS_TO_DEPARTMENT_CLOSE_BUTTON')"
			:width="300"
		>
			<template v-slot:content>
				<div class="hr-department-detail-content__user-action-text-container">
					<div 
						class="hr-department-detail-content__user-belongs-to-department-text-container"
						v-html="getUserAlreadyBelongsToDepartmentPopupPhrase"
					/>
				</div>
				<div class="hr-department-detail-content__move-user-department-selector" ref="department-selector"></div>
			</template>
		</ConfirmationPopup>
	`,
};
