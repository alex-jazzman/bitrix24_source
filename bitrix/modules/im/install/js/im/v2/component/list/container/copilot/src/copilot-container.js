import { Extension } from 'main.core';

import { Messenger } from 'im.public';
import { CopilotRolesDialog } from 'im.v2.component.elements';
import { CopilotList } from 'im.v2.component.list.items.copilot';
import { Layout } from 'im.v2.const';
import { Logger } from 'im.v2.lib.logger';
import { CopilotService } from 'im.v2.provider.service';

import { RoleSelectorMini } from './components/role-selector-mini/role-selector-mini';

import './css/copilot-container.css';

import type { JsonObject } from 'main.core';
import type { ImModelCopilotRole } from 'im.v2.model';

// @vue/component
export const CopilotListContainer = {
	name: 'CopilotListContainer',
	components: { CopilotList, RoleSelectorMini, CopilotRolesDialog },
	emits: ['selectEntity'],
	data(): JsonObject
	{
		return {
			showRoleSelector: false,
			showRolesDialog: false,
			isCreatingChat: false,
		};
	},
	computed:
	{
		isCopilotRolesAvailable(): boolean
		{
			const settings = Extension.getSettings('im.v2.component.content.copilot');

			return settings.copilotRolesAvailable === 'Y';
		},
		defaultRole(): ImModelCopilotRole
		{
			return this.$store.getters['copilot/roles/getDefault'];
		},
	},
	created()
	{
		Logger.warn('List: Copilot container created');
	},
	deactivated()
	{
		this.showRolesDialog = false;
		this.showRoleSelector = false;
	},
	methods:
	{
		async onCreateChatClick()
		{
			if (!this.isCopilotRolesAvailable)
			{
				void this.createChat(this.defaultRole.code);

				return;
			}

			this.showRoleSelector = true;
		},
		onChatClick(dialogId)
		{
			this.$emit('selectEntity', { layoutName: Layout.copilot.name, entityId: dialogId });
		},
		showCreateChatError()
		{
			BX.UI.Notification.Center.notify({
				content: this.loc('IM_LIST_CONTAINER_COPILOT_CREATE_CHAT_ERROR'),
			});
		},
		getCopilotService(): CopilotService
		{
			if (!this.copilotService)
			{
				this.copilotService = new CopilotService();
			}

			return this.copilotService;
		},
		async createChat(roleCode: string)
		{
			this.showRoleSelector = false;
			this.showRolesDialog = false;
			this.isCreatingChat = true;

			const newDialogId = await this.getCopilotService().createChat({ roleCode })
				.catch(() => {
					this.isCreatingChat = false;
					this.showCreateChatError();
				});

			this.isCreatingChat = false;
			void Messenger.openCopilot(newDialogId);
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
		onCopilotDialogSelectRole(role)
		{
			void this.createChat(role.code);
		},
		onOpenMainSelector()
		{
			this.showRoleSelector = false;
			this.showRolesDialog = true;
		},
	},
	template: `
		<div class="bx-im-list-container-copilot__scope bx-im-list-container-copilot__container">
			<div class="bx-im-list-container-copilot__header_container">
				<div class="bx-im-list-container-copilot__header_title">CoPilot</div>
				<div
					class="bx-im-list-container-copilot__create-chat"
					:class="{'--loading': isCreatingChat}"
					ref="createChatButton"
					@click="onCreateChatClick"
				>
					<div class="bx-im-list-container-copilot__create-chat_icon"></div>
				</div>
			</div>
			<div class="bx-im-list-container-copilot__elements_container">
				<div class="bx-im-list-container-copilot__elements">
					<CopilotList @chatClick="onChatClick" />
				</div>
			</div>
			<RoleSelectorMini
				v-if="showRoleSelector && isCopilotRolesAvailable"
				:bindElement="$refs.createChatButton"
				@close="showRoleSelector = false"
				@selectedRole="createChat"
				@openMainSelector="onOpenMainSelector"
			/>
			<CopilotRolesDialog
				v-if="showRolesDialog"
				@selectRole="onCopilotDialogSelectRole"
				@close="showRolesDialog = false"
			/>
		</div>
	`,
};
