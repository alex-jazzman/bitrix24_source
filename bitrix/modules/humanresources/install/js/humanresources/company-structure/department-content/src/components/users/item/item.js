import { Type } from 'main.core';
import { mapState } from 'ui.vue3.pinia';
import { EntityTypes } from 'humanresources.company-structure.utils';
import { PermissionActions, PermissionChecker } from 'humanresources.company-structure.permission-checker';
import { getMemberRoles, type MemberRolesType } from 'humanresources.company-structure.api';
import { useChartStore } from 'humanresources.company-structure.chart-store';
import { UserListItemActionButton } from './action-button';

import 'ui.tooltip';
import './styles/item.css';

export const UserListItem = {
	name: 'userList',
	emits: ['itemDragStart'],
	props: {
		user: {
			type: Object,
			required: true,
		},
		selectedUserId: {
			type: Number,
			required: false,
			default: null,
		},
		entityType: {
			type: String,
			required: true,
		},
		listType: {
			type: String,
			required: true,
		},
		canDrag: {
			type: Boolean,
			default: false,
		},
	},

	components: { UserListItemActionButton },

	computed: {
		memberRoles(): MemberRolesType
		{
			return getMemberRoles(this.entityType);
		},
		defaultAvatar(): string
		{
			return '/bitrix/js/humanresources/company-structure/org-chart/src/images/default-user.svg';
		},
		isUserMultiple(): boolean
		{
			const nodeIds = this.multipleUsers[this.user.id];
			if (Type.isArray(nodeIds))
			{
				return nodeIds.includes(this.focusedNode);
			}

			return false;
		},
		canEditUserSettings(): boolean
		{
			if (this.entityType !== EntityTypes.department)
			{
				return false;
			}

			return PermissionChecker.getInstance().checkMultipleUsersSettingsAvailable()
				&& PermissionChecker.getInstance().hasPermission(PermissionActions.departmentSettingsEdit, this.focusedNode)
			;
		},
		showMultiRoleAvatarBadge(): boolean
		{
			return this.isUserMultiple && this.canEditUserSettings;
		},
		showHeadAvatarBadge(): boolean
		{
			return this.user.role === this.memberRoles.head;
		},
		...mapState(useChartStore, ['focusedNode', 'multipleUsers', 'departments']),
	},

	methods: {
		loc(phraseCode: string, replacements: { [p: string]: string } = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
		handleUserClick(item): void
		{
			BX.SidePanel.Instance.open(item.url, {
				width: 1100,
				cacheable: false,
			});
		},
		handleMouseDown(event: MouseEvent): void
		{
			event.preventDefault();

			this.$emit('itemDragStart', {
				userId: this.user.id,
				initialListType: this.listType,
				event,
				element: this.$el,
			});
		},
	},

	template: `
		<div
			:key="user.id"
			class="hr-department-detail-content__user-container"
			:class="{ '--searched': user.id === selectedUserId }"
			:data-id="'hr-department-detail-content__user-' + user.id + '-item'"
		>
			<span v-if="canDrag"
				  @mousedown="handleMouseDown"
				  class="hr-department-detail-content__dnd-icon ui-icon-set --more-points">
			</span>
			<div class="hr-department-detail-content__user-avatar-container" @click="handleUserClick(user)">
				<img
					class="hr-department-detail-content__user-avatar-img"
					:src="user.avatar ? encodeURI(user.avatar) : defaultAvatar"
					alt=""
				/>
				<div
					v-if="showMultiRoleAvatarBadge"
					class="hr-department-detail-content__user-avatar-overlay-is-multiple"
				>
				</div>
				<div v-else-if="showHeadAvatarBadge" class="hr-department-detail-content__user-avatar-overlay"></div>
			</div>
			<div class="hr-department-detail-content-user__text-container">
				<div class="hr-department-detail-content__user-title">
					<div
						class="hr-department-detail-content__user-name"
						@click="handleUserClick(user)"
						:bx-tooltip-user-id="user.id"
						bx-tooltip-context="b24"
						:data-id="'hr-department-detail-content__user-' + user.id + '-item-name'"
					>
						{{ user.name }}
					</div>
					<div v-if="user.badgeText" class="hr-department-detail-content-user__name-badge">
						{{ user.badgeText }}
					</div>
				</div>
				<div
					class="hr-department-detail-content__user-subtitle"
					:class="{ '--without-work-position': !user.subtitle }"
				>
					{{
						(user.subtitle?.length ?? 0) > 0 ? user.subtitle : this.loc(
							'HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_LIST_DEFAULT_WORK_POSITION')
					}}
				</div>
				<div v-if="user.isInvited" class="hr-department-detail-content-user__item-badge">
					{{ this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_LIST_INVITED_BADGE_TEXT') }}
				</div>
			</div>
			<UserListItemActionButton
				:user="user"
				:departmentId="focusedNode"
				:isUserMultiple="isUserMultiple"
			/>
		</div>
	`,
};
