import { Event, Loc } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { Popup } from 'main.popup';
import { Outline as OutlineIcons } from 'ui.icon-set.api.core';
import { MenuItemDesign, type MenuItemOptions, type MenuOptions } from 'ui.system.menu';

import { RolesDialog, RolesDialogEvents } from 'ai.roles-dialog';
import { type Role } from 'ai.engine';

import { Analytics } from 'im.v2.lib.analytics';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { BaseMenu } from 'im.v2.lib.menu';
import { runAction } from 'im.v2.lib.rest';
import { RestMethod } from 'im.v2.const';

type ModeMenuContext = {
	dialogId: string,
};

export class ModeMenu extends BaseMenu
{
	context: ModeMenuContext;
	#rolesDialog: ?RolesDialog = null;
	#hintPopup: ?Popup = null;

	constructor()
	{
		super();
		this.id = 'im-copilot-mode-menu';
		this.onSelectRoleHandler = (event: BaseEvent) => this.#onSelectRole(event);
	}

	getMenuOptions(): MenuOptions
	{
		return {
			...super.getMenuOptions(),
			bindOptions: { forceBindPosition: true, position: 'top' },
			offsetTop: 6,
			width: 280,
			closeTimeout: 700,
			closeOnItemClick: false,
		};
	}

	getMenuItems(): (MenuItemOptions | null)[]
	{
		return [
			this.getReasoningItem(),
			this.getRoleItem(),
		];
	}

	getReasoningItem(): MenuItemOptions | null
	{
		const modelCode = this.store.getters['copilot/chats/getAIModel'](this.context.dialogId)?.code;
		const isAvailableInModel = this.store.getters['copilot/isReasoningAvailableInModel'](modelCode);
		const isReasoningEnabled = this.store.getters['copilot/chats/isReasoningEnabled'](this.context.dialogId);

		return {
			title: Loc.getMessage('IM_CONTENT_COPILOT_MODE_MENU_REASONING'),
			icon: isReasoningEnabled ? OutlineIcons.CIRCLE_CHECK : OutlineIcons.AI_STARS,
			design: this.#getReasoningDesign(isAvailableInModel, isReasoningEnabled),
			onClick: () => {
				if (!isAvailableInModel)
				{
					this.#showHint(Loc.getMessage('IM_CONTENT_COPILOT_TEXTAREA_REASONING_BUTTON_HINT_NOT_AVAILABLE'));

					return;
				}

				this.store.dispatch('copilot/chats/toggleReasoning', this.context.dialogId);
				Analytics.getInstance().copilot.onToggleReasoning(this.context.dialogId);
				Analytics.getInstance().copilot.onChangeReasoning(this.context.dialogId);
				this.close();
			},
		};
	}

	getRoleItem(): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_CONTENT_COPILOT_MODE_MENU_ROLE'),
			icon: OutlineIcons.ROLES_LIBRARY,
			onClick: () => {
				this.#openRolesDialog();
				this.close();
			},
		};
	}

	#destroyRolesDialog(): void
	{
		if (!this.#rolesDialog)
		{
			return;
		}

		this.#rolesDialog.unsubscribe(RolesDialogEvents.SELECT_ROLE, this.onSelectRoleHandler);
		this.#rolesDialog.hide();
		this.#rolesDialog = null;
	}

	#showHint(text: string): void
	{
		this.#hideHint();

		const menuContainer = this.menuInstance?.getPopupContainer();
		if (!menuContainer)
		{
			return;
		}

		this.#hintPopup = new Popup({
			content: text,
			bindElement: menuContainer,
			className: 'ui-dialog-tooltip',
			darkMode: false,
			autoHide: true,
			maxWidth: 250,
			closeByEsc: true,
			offsetLeft: 50,
			bindOptions: {
				position: 'top',
			},
			angle: true,
			animation: 'fading-slide',
			events: {
				onAfterShow: (event: BaseEvent) => {
					const popup = event.getTarget();
					Event.bindOnce(popup.getPopupContainer(), 'click', () => this.#hideHint());
				},
			},
		});

		this.#hintPopup.show();
	}

	#hideHint(): void
	{
		this.#hintPopup?.close();
		this.#hintPopup = null;
	}

	#getReasoningDesign(isAvailableInModel: boolean, isReasoningEnabled: boolean): $Values<typeof MenuItemDesign>
	{
		const hasUpdatedDesign = FeatureManager.isFeatureAvailable(Feature.isBitrixGptV2Available);

		if (!isAvailableInModel)
		{
			return MenuItemDesign.Disabled;
		}

		if (isReasoningEnabled)
		{
			return hasUpdatedDesign ? MenuItemDesign.Accent2 : MenuItemDesign.Copilot;
		}

		return MenuItemDesign.Default;
	}

	#openRolesDialog(): void
	{
		const currentRoleCode = this.store.getters['copilot/chats/getRole'](this.context.dialogId)?.code;

		this.#rolesDialog = new RolesDialog({
			moduleId: 'im',
			contextId: 'im-copilot-mode-menu',
			title: Loc.getMessage('IM_CONTENT_COPILOT_MODE_MENU_ROLE'),
			selectedRoleCode: currentRoleCode,
		});

		this.#rolesDialog.subscribe(RolesDialogEvents.SELECT_ROLE, this.onSelectRoleHandler);

		void this.#rolesDialog.show();
	}

	#onSelectRole(event: BaseEvent): void
	{
		this.#destroyRolesDialog();

		const { role } = event.getData();
		if (!role)
		{
			return;
		}

		this.#updateRole(role);
	}

	#updateRole(newRole: Role): void
	{
		const { dialogId } = this.context;
		const currentRole = this.store.getters['copilot/chats/getRole'](dialogId);

		if (currentRole?.code === newRole.code)
		{
			return;
		}

		void this.store.dispatch('copilot/chats/set', { dialogId, role: newRole.code });
		void this.store.dispatch('copilot/roles/add', [newRole]);

		runAction(RestMethod.imV2ChatCopilotUpdateRole, {
			data: { dialogId, role: newRole.code },
		});
	}
}
