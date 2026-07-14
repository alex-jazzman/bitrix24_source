import { type JsonObject } from 'main.core';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { CopilotRolesDialog } from 'im.v2.component.elements.copilot-roles-dialog';
import { PromoId } from 'im.v2.const';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { PromoManager } from 'im.v2.lib.promo';
import { type ImModelCopilotRole } from 'im.v2.model';

import { CopilotService, type RawRole } from './classes/copilot-service';
import { ChangeRolePromo } from './components/change-role-promo';

import './css/copilot-role.css';

// @vue/component
export const CopilotRole = {
	name: 'CopilotRole',
	components: { ChangeRolePromo, CopilotRolesDialog, BIcon },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
	},
	data(): JsonObject
	{
		return {
			shouldShowChangeRolePromo: false,
			showRolesDialog: false,
		};
	},
	computed: {
		OutlineIcons: () => OutlineIcons,
		chatRole(): ImModelCopilotRole
		{
			const chatRole = this.$store.getters['copilot/chats/getRole'](this.dialogId);
			if (!chatRole)
			{
				return this.$store.getters['copilot/roles/getDefault'];
			}

			return chatRole;
		},
		roleName(): string
		{
			return this.chatRole.name;
		},
		canShowChangeRolePromo(): boolean
		{
			const needShowAddUsersToChatHint = PromoManager.getInstance().needToShow(PromoId.addUsersToCopilotChat);
			const needToShowChangeRolePromo = PromoManager.getInstance().needToShow(PromoId.changeRoleCopilot);

			return !needShowAddUsersToChatHint && needToShowChangeRolePromo;
		},
		isBitrixGptV2Available(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isBitrixGptV2Available);
		},
	},
	mounted()
	{
		// Show promo after sidebar animation is over.
		setTimeout(() => {
			this.shouldShowChangeRolePromo = this.canShowChangeRolePromo;
		}, 300);
	},
	beforeUnmount()
	{
		this.showRolesDialog = false;
		this.shouldShowChangeRolePromo = false;
	},
	methods: {
		handleChangeRole()
		{
			this.showRolesDialog = true;
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
		onChangeRolePromoAccept()
		{
			this.shouldShowChangeRolePromo = false;
			void PromoManager.getInstance().markAsWatched(PromoId.changeRoleCopilot);
		},
		onCopilotDialogSelectRole(role: RawRole)
		{
			void (new CopilotService()).updateRole({
				dialogId: this.dialogId,
				newRole: role,
			});
		},
	},
	template: `
		<div class="bx-im-sidebar-copilot-role__container" @click="handleChangeRole" ref="change-role">
			<div class="bx-im-sidebar-copilot-role__title">
				<BIcon
					v-if="isBitrixGptV2Available"
					:name="OutlineIcons.BITRIX_GPT"
					class="bx-im-sidebar-copilot-role__bgpt-icon"
				/>
				<div v-else class="bx-im-sidebar-copilot-role__title-icon"></div>
				<div
					:class="{'--bgpt-v2': isBitrixGptV2Available}"
					class="bx-im-sidebar-copilot-role__title-text"
				>
					{{ roleName }}
				</div>
			</div>
			<BIcon
				:name="OutlineIcons.CHEVRON_RIGHT_M"
				:hoverable="true"
				class="bx-im-sidebar-copilot-role__arrow-icon"
			/>
			<ChangeRolePromo 
				v-if="shouldShowChangeRolePromo"
				:bindElement="$refs['change-role']"
				@accept="onChangeRolePromoAccept"
				@hide="shouldShowChangeRolePromo = false"
			/>
			<CopilotRolesDialog
				v-if="showRolesDialog"
				:title="loc('IM_SIDEBAR_COPILOT_CHANGE_ROLE_DIALOG_TITLE')"
				@selectRole="onCopilotDialogSelectRole"
				@close="showRolesDialog = false"
			/>
		</div>
	`,
};
