import { Extension, Loc, Reflection, Type } from 'main.core';
import { InfoHelper } from 'ui.info-helper';
import { Center as NotificationCenter } from 'ui.notification';
import { MenuItemDesign, type MenuItemOptions, type MenuOptions, type MenuSectionOptions } from 'ui.system.menu';

import { Messenger } from 'im.public';
import { Core } from 'im.v2.application.core';
import { ActionByRole, ChatType, RestMethod } from 'im.v2.const';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { BaseMenu } from 'im.v2.lib.menu';
import { PermissionManager } from 'im.v2.lib.permission';
import { runAction } from 'im.v2.lib.rest';
import { type ImModelChat, type ImModelUser } from 'im.v2.model';

import { CallTypes } from 'call.const';
import { Analytics } from 'call.lib.analytics';
import { CallManager } from 'call.lib.call-manager';

const MenuSectionCode = Object.freeze({
	main: 'main',
	phone: 'phone',
});

const EXTENSION_NAME = 'call.widget.call-button';
const SYNC_CALL_STARTER = 'BX.SyncConnector.startCall';

// Shape of the public method of syncconnector; see its call-start-api spec for the contract
type SyncCallTarget = { type: 'user', userId: string } | { type: 'chat', chatId: number };
type SyncCallStarter = (target: SyncCallTarget) => Promise<{ callId: string }>;

export class CallMenu extends BaseMenu
{
	declare context: ImModelChat;

	static events = {
		...BaseMenu.events,
		onMenuItemClick: 'onMenuItemClick',
	};

	constructor()
	{
		super();

		this.id = 'bx-im-chat-header-call-menu';
	}

	getMenuOptions(): MenuOptions
	{
		// MenuOptions type omits the popup offset props that the runtime menu accepts
		return {
			...super.getMenuOptions(),
			className: this.getMenuClassName(),
			angle: true,
			offsetLeft: 4,
			offsetTop: 5,
		} as MenuOptions;
	}

	getMenuClassName(): string
	{
		return 'bx-im-messenger__scope bx-call-chat-header-call-button__scope';
	}

	getMenuItems(): MenuItemOptions[]
	{
		// groupItems is typed MenuItemOptions[] | null[] but filters a mixed nullable list at runtime
		return [
			...this.groupItems(
				[
					this.#getVideoCallItem(),
					this.#getAudioCallItem(),
					this.#getSyncCallItem(),
					this.#getZoomItem(),
				] as MenuItemOptions[],
				MenuSectionCode.main,
			),
			...this.groupItems(
				[this.#getPersonalPhoneItem(), this.#getWorkPhoneItem(), this.#getInnerPhoneItem()] as MenuItemOptions[],
				MenuSectionCode.phone,
			),
		];
	}

	getMenuGroups(): MenuSectionOptions[]
	{
		// ui.system.menu types design/title as required, runtime needs only code
		return [{ code: MenuSectionCode.main }, { code: MenuSectionCode.phone }] as MenuSectionOptions[];
	}

	#getVideoCallItem(): Partial<MenuItemOptions>
	{
		const isAvailable = this.#isCallAvailable(this.context.dialogId);

		return {
			title: Loc.getMessage('CALL_CONTENT_CHAT_HEADER_VIDEOCALL') ?? '',
			design: isAvailable ? MenuItemDesign.Default : MenuItemDesign.Disabled,
			onClick: () => {
				if (!isAvailable)
				{
					return;
				}

				this.#analyticsOnStartCallClick(CallTypes.video.id);

				CallTypes.video.start(this.context.dialogId);
				this.emit(CallMenu.events.onMenuItemClick, CallTypes.video);
				this.menuInstance.close();
			},
		};
	}

	#getAudioCallItem(): Partial<MenuItemOptions>
	{
		const isAvailable = this.#isCallAvailable(this.context.dialogId);

		return {
			title: Loc.getMessage('CALL_CONTENT_CHAT_HEADER_CALL_MENU_AUDIO') ?? '',
			design: isAvailable ? MenuItemDesign.Default : MenuItemDesign.Disabled,
			onClick: () => {
				if (!isAvailable)
				{
					return;
				}

				this.#analyticsOnStartCallClick(CallTypes.audio.id);
				CallTypes.audio.start(this.context.dialogId);

				this.emit(CallMenu.events.onMenuItemClick, CallTypes.audio);
				this.menuInstance.close();
			},
		};
	}

	#getSyncCallItem(): Partial<MenuItemOptions> | null
	{
		if (!this.#isSyncCallEnabled())
		{
			return null;
		}

		const startCall = this.#getSyncCallStarter();
		if (startCall === null)
		{
			return null;
		}

		const isAvailable = this.#isCallAvailable(this.context.dialogId);
		const target = this.#getSyncCallTarget();

		return {
			title: Loc.getMessage('CALL_CONTENT_CHAT_HEADER_CALL_MENU_SYNC') ?? '',
			design: isAvailable ? MenuItemDesign.Default : MenuItemDesign.Disabled,
			onClick: () => {
				if (!isAvailable)
				{
					return;
				}

				// The SDK opens the tab of the caller before it awaits anything, and a browser allows that
				// only inside the click that asked for it: nothing may be awaited before this call.
				void startCall(target).catch((error: { reasonSentToTab?: unknown } | null | undefined) => {
					// The call tab was asked to show the reason itself: a toast would be a second message
					if (error?.reasonSentToTab === true)
					{
						return;
					}

					NotificationCenter.notify({
						content: Loc.getMessage('CALL_CONTENT_CHAT_HEADER_CALL_MENU_SYNC_START_ERROR') ?? '',
					});
				});

				this.menuInstance.close();
			},
		};
	}

	#isSyncCallEnabled(): boolean
	{
		return Extension.getSettings(EXTENSION_NAME).get('syncCallEnabled', false) === true;
	}

	/**
	 * syncconnector.embed is absent from documents its own embedding refuses - a slider, admin pages, a user
	 * it does not let in - so the published function is looked up instead of being declared a dependency.
	 */
	#getSyncCallStarter(): SyncCallStarter | null
	{
		const starter = Reflection.getClass(SYNC_CALL_STARTER);

		return Type.isFunction(starter) ? starter as SyncCallStarter : null;
	}

	#getSyncCallTarget(): SyncCallTarget
	{
		if (this.#isUser())
		{
			return { type: 'user', userId: this.context.dialogId };
		}

		return { type: 'chat', chatId: this.context.chatId };
	}

	#analyticsOnStartCallClick(callType: string)
	{
		Analytics.getInstance().onContextMenuStartCallClick({
			context: this.context,
			callType,
		});
	}

	#getPersonalPhoneItem(): Partial<MenuItemOptions> | null
	{
		const user = this.#getUser();
		if (!user)
		{
			return null;
		}

		const { phones } = user;
		if (!phones.personalMobile)
		{
			return null;
		}

		const title = Loc.getMessage('CALL_CONTENT_CHAT_HEADER_CALL_MENU_PERSONAL_PHONE') ?? '';

		return {
			title,
			subtitle: phones.personalMobile,
			onClick: () => {
				void Messenger.startPhoneCall(phones.personalMobile);
				this.menuInstance.close();
			},
		};
	}

	#getWorkPhoneItem(): Partial<MenuItemOptions> | null
	{
		const user = this.#getUser();
		if (!user)
		{
			return null;
		}

		const { phones } = user;
		if (!phones.workPhone)
		{
			return null;
		}

		return {
			title: Loc.getMessage('CALL_CONTENT_CHAT_HEADER_CALL_MENU_WORK_PHONE') ?? '',
			subtitle: phones.workPhone,
			onClick: () => {
				void Messenger.startPhoneCall(phones.workPhone);
				this.menuInstance.close();
			},
		};
	}

	#getInnerPhoneItem(): Partial<MenuItemOptions> | null
	{
		const user = this.#getUser();
		if (!user)
		{
			return null;
		}

		const { phones } = user;
		if (!phones.innerPhone)
		{
			return null;
		}

		return {
			title: Loc.getMessage('CALL_CONTENT_CHAT_HEADER_CALL_MENU_INNER_PHONE_MSGVER_1') ?? '',
			subtitle: phones.innerPhone,
			onClick: () => {
				void Messenger.startPhoneCall(phones.innerPhone);
				this.menuInstance.close();
			},
		};
	}

	#getZoomItem(): Partial<MenuItemOptions> | null
	{
		const isActive = FeatureManager.isFeatureAvailable(Feature.zoomActive);
		if (!isActive)
		{
			return null;
		}

		const isFeatureAvailable = FeatureManager.isFeatureAvailable(Feature.zoomAvailable);

		return {
			title: Loc.getMessage('CALL_CONTENT_CHAT_HEADER_CALL_MENU_ZOOM') ?? '',
			design: isFeatureAvailable ? MenuItemDesign.Default : MenuItemDesign.Disabled,
			onClick: () => {
				if (!isFeatureAvailable)
				{
					InfoHelper.show('limit_video_conference_zoom');

					return;
				}

				this.#requestCreateZoomConference(this.context.dialogId);
				this.menuInstance.close();
			},
		};
	}

	#isCallAvailable(dialogId: string): boolean
	{
		if (CallManager.getInstance().hasActiveCurrentCall(dialogId))
		{
			return true;
		}

		if (CallManager.getInstance().hasActiveAnotherCall(dialogId))
		{
			return false;
		}

		const chatCanBeCalled = CallManager.getInstance().chatCanBeCalled(dialogId);
		const chatIsAllowedToCall = PermissionManager.getInstance().canPerformActionByRole(ActionByRole.call, dialogId);

		return chatCanBeCalled && chatIsAllowedToCall;
	}

	#getUser(): ImModelUser | null
	{
		if (!this.#isUser())
		{
			return null;
		}

		return Core.getStore().getters['users/get'](this.context.dialogId);
	}

	#isUser(): boolean
	{
		return this.context.type === ChatType.user;
	}

	#requestCreateZoomConference(dialogId: string)
	{
		runAction(RestMethod.imV2CallZoomCreate, { data: { dialogId } }).catch((errors) => {
			let errorText = Loc.getMessage('CALL_CONTENT_CHAT_HEADER_CALL_MENU_ZOOM_CREATE_ERROR') ?? '';

			const notConnected = errors.some((error: { code: string }) => error.code === 'ZOOM_CONNECTED_ERROR');
			if (notConnected)
			{
				const userProfileUri = `/company/personal/user/${Core.getUserId()}/social_services/`;
				errorText = (Loc.getMessage('CALL_CONTENT_CHAT_HEADER_CALL_MENU_ZOOM_CONNECT_ERROR') ?? '')
					.replace('#HREF_START#', `<a href=${userProfileUri}>`)
					.replace('#HREF_END#', '</>');
			}

			NotificationCenter.notify({
				content: errorText,
			});
		});
	}
}
