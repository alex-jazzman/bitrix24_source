import { ajax, Loc, Type } from 'main.core';
import { UI } from 'ui.notification';
import { Dialog } from 'ui.system.dialog';

import { Messenger } from 'im.public';
import 'im.v2.lib.opener';

import { FreeLicenseScreen } from './component/free-license-screen';
import { PaidLicenseScreen } from './component/paid-license-screen';
import { PortalDeleteScreen } from './component/portal-delete-screen';
import { RequestChatScreen } from './component/request-chat-screen';
import {
	DefaultSupportEmail,
	PortalDeleteUrl,
	SelfDeletePopupElementId,
	SelfDeletePopupScenario,
	TransferRightsHelpdeskCode,
} from './const';

import './self-delete-popup.css';

let currentPopup = null;
let currentPopupPromise = null;

export class SelfDeletePopup
{
	#dialog = null;
	#options = {};

	static async show(options = {}): Promise<SelfDeletePopup>
	{
		if (Type.isObject(options) && options.scenario)
		{
			const popup = new this(options);
			popup.show();

			return popup;
		}

		if (!currentPopupPromise)
		{
			currentPopupPromise = this.#showCurrentUserPopup()
				.finally(() => {
					currentPopupPromise = null;
				})
			;
		}

		return currentPopupPromise;
	}

	static async #getCurrentUserOptions(): Object
	{
		const currentUserOptionsResult = await ajax.runAction('intranet.v2.SelfDelete.getOptionsForCurrentUser');

		return currentUserOptionsResult.data;
	}

	static async #showCurrentUserPopup(): Promise<SelfDeletePopup>
	{
		const popupOptions = await this.#getCurrentUserOptions();

		if (currentPopup)
		{
			currentPopup.update(popupOptions);
		}
		else
		{
			currentPopup = new this(popupOptions);
		}

		currentPopup.show();

		return currentPopup;
	}

	constructor(options = {})
	{
		this.#options = this.#normalizeOptions(options);
	}

	show(): void
	{
		if (!this.#dialog)
		{
			const view = this.#renderView();
			this.#dialog = this.#createDialog(view);
		}

		this.#dialog.show();
	}

	close(): void
	{
		this.#dialog?.hide();
	}

	destroy(): void
	{
		this.close();

		if (currentPopup === this)
		{
			currentPopup = null;
		}
	}

	update(options = {}): void
	{
		this.#options = this.#normalizeOptions({
			...this.#options,
			...options,
		});

		if (this.#dialog)
		{
			this.#applyView(this.#renderView());
		}
	}

	#createDialog(view): Dialog
	{
		return new Dialog({
			content: view.content,
			closeByClickOutside: false,
			hasOverlay: true,
			closeByEsc: true,
			hasCloseButton: false,
			hasHorizontalPadding: false,
			hasVerticalPadding: false,
			events: {
				onAfterHide: () => {
					this.#dialog = null;
				},
			},
		});
	}

	#applyView(view): void
	{
		this.#dialog.setContent(view.content);
	}

	#renderView(): { content: HTMLElement }
	{
		let view = null;

		switch (this.#options.scenario)
		{
			case SelfDeletePopupScenario.NotLastAdmin:
				view = new RequestChatScreen(this.#options, this.#getScreenActions()).render();
				break;

			case SelfDeletePopupScenario.LastAdminFreeLicense:
				view = new FreeLicenseScreen(this.#options, this.#getScreenActions()).render();
				break;

			case SelfDeletePopupScenario.LastAdminPayedLicense:
				view = new PaidLicenseScreen(this.#options, this.#getScreenActions()).render();
				break;

			case SelfDeletePopupScenario.LastAdmin:
				view = new PortalDeleteScreen(this.#options, this.#getScreenActions()).render();
				break;

			default:
				throw new TypeError(`Unsupported self delete popup scenario: ${this.#options.scenario}`);
		}

		view.content.id = SelfDeletePopupElementId.Popup;
		view.content.dataset.testid = SelfDeletePopupElementId.Popup;

		return view;
	}

	#getScreenActions(): Object
	{
		return {
			cancel: this.close.bind(this),
			createChat: (button) => {
				this.#runAction(() => this.#createRequestChat(), button);
			},
			openTransferRights: this.#openTransferRightsHelpdesk.bind(this),
			openPortalDelete: this.#openPortalDelete.bind(this),
			setParticipants: (participants) => {
				this.#options.participants = this.#normalizeParticipants(participants, this.#options.adminIds);
			},
		};
	}

	#runAction(callback, button = null): void
	{
		if (!Type.isFunction(callback))
		{
			return;
		}

		try
		{
			const result = callback();

			if (result)
			{
				button?.setWaiting(true);
				Promise.resolve(result)
					.then(() => {
						button?.setWaiting(false);
					})
					.catch((error) => {
						this.#handleActionError(error);
						button?.setWaiting(false);
					})
				;
			}
		}
		catch (error)
		{
			this.#handleActionError(error);
			button?.setWaiting(false);
		}
	}

	async #createRequestChat(): Promise
	{
		const { data } = await ajax.runAction('intranet.v2.SelfDelete.createRequestChat', {
			data: {
				userIds: this.#options.participants.map((participant) => participant.id),
			},
		});
		const { chatId, messageId, alreadyExists } = this.#normalizeCreatedChatData(data);

		if (chatId <= 0 || (!alreadyExists && messageId <= 0))
		{
			throw new Error('Self delete request chat was not created');
		}

		await Messenger.openChat(`chat${chatId}`);
		this.close();
	}

	#normalizeCreatedChatData(data): { chatId: number, messageId: number, alreadyExists: boolean }
	{
		if (Type.isObjectLike(data))
		{
			return {
				chatId: Number(data.chatId ?? data.CHAT_ID),
				messageId: Number(data.messageId ?? data.MESSAGE_ID) || 0,
				alreadyExists: data.alreadyExists === true || data.ALREADY_EXISTS === true,
			};
		}

		return {
			chatId: Number(data),
			messageId: 0,
			alreadyExists: false,
		};
	}

	#openTransferRightsHelpdesk(): void
	{
		BX.Helper.show(TransferRightsHelpdeskCode);
	}

	#openPortalDelete(): void
	{
		this.#openUrl(PortalDeleteUrl);
	}

	#openUrl(url): void
	{
		if (!Type.isStringFilled(url))
		{
			return;
		}

		const sidePanel = top.BX?.SidePanel?.Instance;
		if (sidePanel)
		{
			sidePanel.open(url);

			return;
		}

		top.window.location.href = url;
	}

	#handleActionError(error): void
	{
		console.error(error);

		const message = Loc.getMessage('INTRANET_SELF_DELETE_POPUP_CREATE_CHAT_ERROR');
		if (Type.isStringFilled(message))
		{
			const notificationCenter = top.BX?.UI?.Notification?.Center ?? UI.Notification.Center;
			if (Type.isFunction(notificationCenter?.notify))
			{
				notificationCenter.notify({
					content: message,
					autoHide: true,
					useAirDesign: true,
				});
			}
		}
	}

	#normalizeOptions(options = {}): Object
	{
		const supportEmail = options.supportEmail;
		const adminIds = this.#normalizeAdminIds(options.adminIds);
		const participants = this.#normalizeParticipants(options.participants, adminIds);

		return {
			scenario: this.#normalizeScenario(options.scenario),
			adminIds,
			participants,
			supportEmail: Type.isStringFilled(supportEmail)
				? supportEmail.trim()
				: DefaultSupportEmail,
		};
	}

	#normalizeScenario(scenario): string
	{
		const availableScenarios = Object.values(SelfDeletePopupScenario);

		if (Type.isStringFilled(scenario) && availableScenarios.includes(scenario))
		{
			return scenario;
		}

		throw new TypeError(`Unsupported self delete popup scenario: ${String(scenario)}`);
	}

	#normalizeParticipants(participants, adminIds = null): Array<Object>
	{
		if (!Type.isArray(participants))
		{
			return [];
		}

		const hasAdminFilter = Type.isArray(adminIds) && adminIds.length > 0;

		return participants
			.map((participant) => this.#normalizeParticipant(participant))
			.filter((participant) => !Type.isNil(participant))
			.filter((participant, index, list) => {
				if (hasAdminFilter && !adminIds.includes(participant.id))
				{
					return false;
				}

				return list.findIndex((item) => item.id === participant.id) === index;
			})
		;
	}

	#normalizeParticipant(participant): ?Object
	{
		if (!Type.isObjectLike(participant))
		{
			return null;
		}

		const id = this.#getParticipantId(participant);
		const name = this.#getParticipantName(participant);

		if (!Type.isInteger(id) || id <= 0 || !Type.isStringFilled(name))
		{
			return null;
		}

		return {
			id,
			name: name.trim(),
			avatarUrl: this.#getParticipantAvatarUrl(participant),
		};
	}

	#getParticipantId(participant): number
	{
		const id = Type.isFunction(participant.getId) ? participant.getId() : participant.id;

		return Number(id);
	}

	#getParticipantName(participant): string
	{
		if (Type.isFunction(participant.getTitle))
		{
			return participant.getTitle();
		}

		if (Type.isString(participant.name))
		{
			return participant.name;
		}

		return Type.isString(participant.title) ? participant.title : '';
	}

	#getParticipantAvatarUrl(participant): ?string
	{
		const avatarUrl = Type.isFunction(participant.getAvatar)
			? participant.getAvatar()
			: participant.avatarUrl ?? participant.avatar;

		return Type.isStringFilled(avatarUrl) ? avatarUrl.trim() : null;
	}

	#normalizeAdminIds(adminIds): Array<number>
	{
		const ids = Type.isArray(adminIds) ? adminIds : [];

		return ids
			.map((id) => Number(id))
			.filter((id, index, list) => Number.isInteger(id) && id > 0 && list.indexOf(id) === index)
		;
	}
}
