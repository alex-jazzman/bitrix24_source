import { Loc, Type } from 'main.core';
import { AirButtonStyle } from 'ui.buttons';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';
import { Center as NotificationCenter, Position } from 'ui.notification';
import { Dialog } from 'ui.system.dialog';

import { catalogShareApi } from './catalog-share-api';
import {
	CatalogShareDialogView,
	type EntitySelectorFactory,
} from './catalog-share-dialog-view';
import {
	CatalogShareStateMachine,
	CatalogShareViewState,
	type CatalogShareSnapshot,
	type CatalogShareViewStateValue,
} from './catalog-share-state';
import {
	Audience,
	type AudienceValue,
	type CatalogChatWritingResult,
	type CatalogLinkState,
	type CatalogShareApplication,
	type CatalogShareDraft,
	type CatalogShareParticipant,
	type CatalogShareState,
	type SetCatalogLinkPayload,
} from './catalog-share-types';

export type CatalogShareDialogStateValue = CatalogShareViewStateValue;

export const CATALOG_SHARE_DIALOG_WIDTH = 588;

export const CatalogShareDialogState = Object.freeze({
	Loading: CatalogShareViewState.Loading,
	Ready: CatalogShareViewState.Audience,
	Audience: CatalogShareViewState.Audience,
	MemberDraft: CatalogShareViewState.MemberDraft,
	SavingShare: CatalogShareViewState.SavingShare,
	RefreshingLink: CatalogShareViewState.RefreshingLink,
	GeneratingDefaultLink: CatalogShareViewState.GeneratingDefaultLink,
	LinkSettings: CatalogShareViewState.LinkSettings,
	ConfirmAnonymousLink: CatalogShareViewState.ConfirmAnonymousLink,
	ConfirmPortalLinkRevoke: CatalogShareViewState.ConfirmPortalLinkRevoke,
	SavingLink: CatalogShareViewState.SavingLink,
	Closed: CatalogShareViewState.Closed,
});

type CatalogShareApi = {
	getShare: (catalogItemId: number) => Promise<CatalogShareState>,
	setShare: (catalogItemId: number, share: CatalogShareState) => Promise<CatalogShareState>,
	getLink: (catalogItemId: number) => Promise<CatalogLinkState>,
	setLink: (catalogItemId: number, payload: SetCatalogLinkPayload) => Promise<CatalogLinkState>,
	setChatWriting?: (catalogItemId: number, allowed: boolean) => Promise<CatalogChatWritingResult>,
};

type CatalogShareDialogOptions = {
	application: CatalogShareApplication,
	trigger: HTMLElement,
	api?: CatalogShareApi,
	selectorFactory?: EntitySelectorFactory,
	copyText?: (text: string) => Promise<boolean>,
	now?: () => Date,
	onChatWritingChanged?: (allowed: boolean) => void,
};

type ConfirmationOptions = {
	title: string,
	description: string,
	confirmText: string,
	confirmStyle?: string,
	onConfirm: () => void,
	onCancel: () => void,
};

export class CatalogShareDialog
{
	#application: CatalogShareApplication;
	#trigger: HTMLElement;
	#api: CatalogShareApi;
	#machine: CatalogShareStateMachine;
	#view: CatalogShareDialogView;
	#dialog: Dialog | null;
	#confirmationMessageBox: MessageBox | null = null;
	#confirmationCancel: (() => void) | null = null;
	#draft: CatalogShareDraft | null = null;
	#request: Promise<void> | null = null;
	#saveRequest: Promise<void> | null = null;
	#linkRequest: Promise<void> | null = null;
	#shareReloadRequest: Promise<void> | null = null;
	#linkReloadRequest: Promise<void> | null = null;
	#applicationLinkCopyRequest: Promise<void> | null = null;
	#chatWritingRequest: Promise<void> | null = null;
	#chatWritingAllowed: ?boolean = null;
	#onChatWritingChanged: ((allowed: boolean) => void) | null;
	#copyText: (text: string) => Promise<boolean>;
	#now: () => Date;
	#shown: boolean = false;
	#destroyed: boolean = false;

	constructor(options: CatalogShareDialogOptions)
	{
		this.#application = options.application;
		this.#trigger = options.trigger;
		this.#api = options.api ?? catalogShareApi;
		this.#copyText = options.copyText ?? this.#copyToClipboard;
		this.#chatWritingAllowed = Type.isBoolean(options.application.appChatWritingAllowed)
			? options.application.appChatWritingAllowed
			: null;
		this.#onChatWritingChanged = options.onChatWritingChanged ?? null;
		this.#now = options.now ?? (() => new Date());
		this.#machine = new CatalogShareStateMachine();
		this.#view = new CatalogShareDialogView({
			application: this.#application,
			selectorFactory: options.selectorFactory,
			now: this.#now,
			callbacks: {
				onRetryShare: this.#handleRetryShare,
				onRetryLink: this.#handleRetryLink,
				onSelectAudience: this.#handleSelectAudience,
				onSetMembers: this.#handleSetMembers,
				onSaveShare: this.#handleSaveShare,
				onCopyApplicationLink: this.#handleCopyApplicationLink,
				onOpenLinkSettings: this.#handleOpenLinkSettings,
				onCloseLinkSettings: this.#handleCloseLinkSettings,
				onSetLinkExpiryEnabled: this.#handleSetLinkExpiryEnabled,
				onSetLinkExpiry: this.#handleSetLinkExpiry,
				onSetLinkRequireB24Auth: this.#handleSetLinkRequireB24Auth,
				onSaveAndCopyLink: this.#handleSaveAndCopyLink,
				onRequestPortalLinkRevoke: this.#handleRequestPortalLinkRevoke,
				onSetChatWriting: this.#handleSetChatWriting,
			},
		});

		const rendering = this.#view.render(this.#machine.getSnapshot());
		this.#dialog = new Dialog({
			title: Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_TITLE'),
			width: CATALOG_SHARE_DIALOG_WIDTH,
			content: rendering.content,
			leftButtons: rendering.leftButtons,
			rightButtons: rendering.rightButtons,
			hasOverlay: true,
			events: {
				onAfterHide: this.#handleAfterHide,
			},
		});
	}

	static show(options: CatalogShareDialogOptions): CatalogShareDialog
	{
		const dialog = new CatalogShareDialog(options);
		void dialog.show();

		return dialog;
	}

	show(): Promise<void>
	{
		if (this.#destroyed)
		{
			return Promise.resolve();
		}

		if (!this.#shown)
		{
			this.#shown = true;
			this.#dialog?.show();
		}

		return this.refresh();
	}

	refresh(): Promise<void>
	{
		if (this.#destroyed)
		{
			return Promise.resolve();
		}

		if (this.#request !== null)
		{
			return this.#request;
		}

		const status = this.#machine.getSnapshot().status;
		if (status !== CatalogShareViewState.Loading)
		{
			if (!this.#machine.beginLoading())
			{
				return Promise.resolve();
			}
			this.#render();
		}

		const request = Promise.all([
			this.#api.getShare(this.#application.id).then(
				(share) => ({ value: share, errorCode: null }),
				(error) => ({ value: null, errorCode: this.#getErrorCode(error) }),
			),
			this.#api.getLink(this.#application.id).then(
				(linkState) => ({ value: linkState, errorCode: null }),
				(error) => ({ value: null, errorCode: this.#getErrorCode(error) }),
			),
		])
			.then(([shareResult, linkResult]) => {
				if (this.#destroyed)
				{
					return;
				}

				this.#machine.settleLoading({
					share: shareResult.value,
					shareErrorCode: shareResult.errorCode,
					linkState: linkResult.value,
					linkErrorCode: linkResult.errorCode,
				});
				this.#syncDraft();
				this.#render();
			})
			.finally(() => {
				if (this.#request === request)
				{
					this.#request = null;
				}
			})
		;

		this.#request = request;

		return request;
	}

	getState(): CatalogShareDialogStateValue
	{
		return this.#machine.getSnapshot().status;
	}

	getDraft(): CatalogShareDraft | null
	{
		return this.#draft;
	}

	destroy(): void
	{
		this.#release(true);
	}

	#handleRetryShare = (): void => {
		if (this.#shareReloadRequest !== null || this.#destroyed || !this.#machine.beginShareReload())
		{
			return;
		}

		this.#render();
		const request = this.#reloadShare();
		this.#shareReloadRequest = request;
		void request.finally(() => {
			if (this.#shareReloadRequest === request)
			{
				this.#shareReloadRequest = null;
			}
		});
	};

	async #reloadShare(): Promise<void>
	{
		try
		{
			const share = await this.#api.getShare(this.#application.id);
			if (this.#destroyed)
			{
				return;
			}

			this.#machine.completeShareReload(share);
		}
		catch (error)
		{
			if (this.#destroyed)
			{
				return;
			}

			this.#machine.failShareReload(this.#getErrorCode(error));
		}

		this.#syncDraft();
		this.#render();
	}

	#handleRetryLink = (): void => {
		if (this.#linkReloadRequest !== null || this.#destroyed || !this.#machine.beginLinkReload())
		{
			return;
		}

		this.#render();
		const request = this.#reloadLink();
		this.#linkReloadRequest = request;
		void request.finally(() => {
			if (this.#linkReloadRequest === request)
			{
				this.#linkReloadRequest = null;
			}
		});
	};

	async #reloadLink(): Promise<void>
	{
		try
		{
			const linkState = await this.#api.getLink(this.#application.id);
			if (this.#destroyed)
			{
				return;
			}

			this.#machine.completeLinkReload(linkState);
		}
		catch (error)
		{
			if (this.#destroyed)
			{
				return;
			}

			this.#machine.failLinkReload(this.#getErrorCode(error));
		}

		this.#syncDraft();
		this.#render();
	}

	#handleSelectAudience = (audience: AudienceValue): void => {
		if (this.#machine.selectAudience(audience))
		{
			this.#syncDraft();
			this.#render();

			return;
		}

		const snapshot = this.#machine.getSnapshot();
		if (snapshot.pendingAudience !== null)
		{
			const { title, description } = this.#getPendingAudienceConfirmationTexts(snapshot);
			this.#showConfirmation({
				title,
				description,
				confirmText: snapshot.pendingAudienceAddsCompanyToChat
					? Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_CONFIRM_APP_CHAT_BUTTON')
					: Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_CONFIRM_GLOBAL_BUTTON'),
				onConfirm: this.#handleConfirmLinkRevoke,
				onCancel: this.#handleCancelLinkRevoke,
			});
		}
	};

	#getPendingAudienceConfirmationTexts(
		snapshot: CatalogShareSnapshot,
	): { title: string, description: string }
	{
		const addsCompanyToChat = snapshot.pendingAudienceAddsCompanyToChat;
		const revokesLink = snapshot.pendingAudienceRevokesLink;

		if (snapshot.pendingAudience === Audience.Portal)
		{
			return {
				title: Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_CONFIRM_PORTAL_TITLE'),
				description: Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_CONFIRM_PORTAL_DESCRIPTION'),
			};
		}

		if (snapshot.pendingAudience === Audience.Authenticated)
		{
			let description = Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_CONFIRM_AUTHENTICATED_DESCRIPTION');
			if (addsCompanyToChat)
			{
				description = revokesLink
					? Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_CONFIRM_AUTHENTICATED_APP_CHAT_LINK_DESCRIPTION')
					: Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_CONFIRM_AUTHENTICATED_APP_CHAT_DESCRIPTION');
			}

			return {
				title: Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_CONFIRM_AUTHENTICATED_TITLE'),
				description,
			};
		}

		let description = Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_CONFIRM_PUBLIC_DESCRIPTION');
		if (addsCompanyToChat)
		{
			description = revokesLink
				? Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_CONFIRM_PUBLIC_APP_CHAT_LINK_DESCRIPTION')
				: Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_CONFIRM_PUBLIC_APP_CHAT_DESCRIPTION');
		}

		return {
			title: Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_CONFIRM_PUBLIC_TITLE'),
			description,
		};
	}

	#handleConfirmLinkRevoke = (): void => {
		if (this.#machine.confirmLinkRevoke())
		{
			this.#syncDraft();
			this.#render();
		}
	};

	#handleCancelLinkRevoke = (): void => {
		if (this.#machine.cancelLinkRevoke())
		{
			this.#render();
		}
	};

	#handleSetMembers = (
		users: CatalogShareParticipant[],
		departments: CatalogShareParticipant[],
	): void => {
		if (!this.#machine.setMembers(users, departments))
		{
			return;
		}

		this.#syncDraft();
		const snapshot = this.#machine.getSnapshot();
		this.#view.updateShareButton(snapshot);
		if (snapshot.ownerOnlyConfirmationRequired)
		{
			this.#showConfirmation({
				title: Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_CONFIRM_OWNER_ONLY_TITLE'),
				description: Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_CONFIRM_OWNER_ONLY_DESCRIPTION'),
				confirmText: Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_CONFIRM_OWNER_ONLY_BUTTON'),
				onConfirm: this.#handleConfirmOwnerOnly,
				onCancel: this.#handleCancelOwnerOnly,
			});
		}
	};

	#handleConfirmOwnerOnly = (): void => {
		if (this.#machine.confirmOwnerOnly())
		{
			this.#syncDraft();
			this.#render();
		}
	};

	#handleCancelOwnerOnly = (): void => {
		if (this.#machine.cancelOwnerOnly())
		{
			this.#render();
		}
	};

	#handleSaveShare = (): void => {
		if (this.#saveRequest !== null || this.#destroyed)
		{
			return;
		}

		const request = this.#saveShare();
		this.#saveRequest = request;
		void request.finally(() => {
			if (this.#saveRequest === request)
			{
				this.#saveRequest = null;
			}
		});
	};

	#handleCopyApplicationLink = (): void => {
		if (this.#applicationLinkCopyRequest !== null || this.#destroyed)
		{
			return;
		}

		const viewUrl = this.#application.viewUrl?.trim();
		if (!viewUrl)
		{
			return;
		}

		let absoluteUrl = '';
		try
		{
			absoluteUrl = new URL(viewUrl, window.location.origin).toString();
		}
		catch
		{
			return;
		}

		const request = this.#copyApplicationLink(absoluteUrl);
		this.#applicationLinkCopyRequest = request;
		void request.finally(() => {
			if (this.#applicationLinkCopyRequest === request)
			{
				this.#applicationLinkCopyRequest = null;
			}
		});
	};

	async #copyApplicationLink(url: string): Promise<void>
	{
		let copied = false;
		try
		{
			copied = await this.#copyText(url);
		}
		catch
		{
			copied = false;
		}

		if (this.#destroyed)
		{
			return;
		}

		NotificationCenter.notify({
			content: Loc.getMessage(copied
				? 'VIBECODECONNECTOR_CATALOG_SHARE_LINK_COPIED'
				: 'VIBECODECONNECTOR_CATALOG_SHARE_LINK_COPY_ERROR'),
			position: Position.TOP_RIGHT,
			useAirDesign: true,
		});
	}

	#handleOpenLinkSettings = (): void => {
		if (this.#machine.openLinkSettings(this.#now()))
		{
			this.#render();
			if (this.#machine.getSnapshot().status === CatalogShareViewState.GeneratingDefaultLink)
			{
				this.#startDefaultLinkGeneration();
			}
		}
	};

	#handleCloseLinkSettings = (): void => {
		if (this.#machine.closeLinkSettings())
		{
			this.#render();
		}
	};

	#handleSetLinkExpiry = (expiresAt: Date): void => {
		if (this.#machine.setLinkExpiry(expiresAt))
		{
			this.#render();
		}
	};

	#handleSetLinkExpiryEnabled = (expiryEnabled: boolean): void => {
		if (this.#machine.setLinkExpiryEnabled(expiryEnabled))
		{
			this.#render();
		}
	};

	#handleSetLinkRequireB24Auth = (requireB24Auth: boolean): void => {
		if (this.#machine.setLinkRequireB24Auth(requireB24Auth))
		{
			this.#render();
		}
	};

	#handleSaveAndCopyLink = (): void => {
		if (this.#linkRequest !== null || this.#destroyed)
		{
			return;
		}

		const snapshot = this.#machine.getSnapshot();
		if (!snapshot.isLinkDraftDirty && snapshot.linkState?.link !== null)
		{
			this.#startCopyRequest(snapshot.linkState.link.url);

			return;
		}

		try
		{
			const payload = this.#machine.prepareLinkSave(this.#now());
			if (payload === null)
			{
				this.#showConfirmation({
					title: Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LINK_CONFIRM_ANONYMOUS_TITLE'),
					description: Loc.getMessage(
						'VIBECODECONNECTOR_CATALOG_SHARE_LINK_CONFIRM_ANONYMOUS_DESCRIPTION',
					),
					confirmText: Loc.getMessage(
						'VIBECODECONNECTOR_CATALOG_SHARE_LINK_CONFIRM_ANONYMOUS_BUTTON',
					),
					onConfirm: this.#handleConfirmAnonymousLink,
					onCancel: this.#handleCancelAnonymousLink,
				});

				return;
			}

			this.#render();
			this.#startLinkRequest(payload, true, false);
		}
		catch (error)
		{
			this.#machine.setLinkSettingsError(this.#getErrorCode(error));
			this.#render();
		}
	};

	#handleConfirmAnonymousLink = (): void => {
		if (this.#linkRequest !== null || this.#destroyed)
		{
			return;
		}

		try
		{
			const payload = this.#machine.confirmAnonymousLinkSave(this.#now());
			this.#render();
			this.#startLinkRequest(payload, true, false);
		}
		catch (error)
		{
			this.#machine.cancelAnonymousLinkSave();
			this.#machine.setLinkSettingsError(this.#getErrorCode(error));
			this.#render();
		}
	};

	#handleCancelAnonymousLink = (): void => {
		if (this.#machine.cancelAnonymousLinkSave())
		{
			this.#render();
		}
	};

	#handleSetChatWriting = (allowed: boolean): void => {
		if (this.#chatWritingRequest !== null || this.#destroyed || !Type.isBoolean(this.#chatWritingAllowed))
		{
			return;
		}

		if (allowed === this.#chatWritingAllowed)
		{
			return;
		}

		const request = this.#saveChatWriting(allowed);
		this.#chatWritingRequest = request;
		void request.finally(() => {
			if (this.#chatWritingRequest === request)
			{
				this.#chatWritingRequest = null;
			}
		});
	};

	async #saveChatWriting(allowed: boolean): Promise<void>
	{
		const previousAllowed = this.#chatWritingAllowed;
		this.#view.setChatWriting(allowed, true);
		this.#render();

		let result: CatalogChatWritingResult | null = null;
		try
		{
			result = await this.#api.setChatWriting?.(this.#application.id, allowed) ?? null;
		}
		catch
		{
			result = null;
		}

		if (this.#destroyed)
		{
			return;
		}

		if (result === null || result.ok !== true)
		{
			this.#view.setChatWriting(previousAllowed, false);
			this.#render();
			NotificationCenter.notify({
				content: Loc.getMessage(result === null
					? 'VIBECODECONNECTOR_CATALOG_SHARE_CHAT_WRITING_ERROR'
					: 'VIBECODECONNECTOR_CATALOG_APP_CHAT_UNAVAILABLE'),
				position: Position.TOP_RIGHT,
				useAirDesign: true,
			});

			return;
		}

		this.#chatWritingAllowed = result.allowed;
		this.#onChatWritingChanged?.(result.allowed);
		this.#view.setChatWriting(result.allowed, false);
		this.#render();
	}

	#handleRequestPortalLinkRevoke = (): void => {
		if (this.#machine.requestPortalLinkRevoke())
		{
			this.#showConfirmation({
				title: Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LINK_CONFIRM_REVOKE_TITLE'),
				description: Loc.getMessage(
					'VIBECODECONNECTOR_CATALOG_SHARE_LINK_CONFIRM_REVOKE_DESCRIPTION',
				),
				confirmText: Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LINK_CONFIRM_REVOKE_BUTTON'),
				confirmStyle: AirButtonStyle.FILLED_ALERT,
				onConfirm: this.#handleConfirmPortalLinkRevoke,
				onCancel: this.#handleCancelPortalLinkRevoke,
			});
		}
	};

	#handleConfirmPortalLinkRevoke = (): void => {
		if (this.#linkRequest !== null || this.#destroyed)
		{
			return;
		}

		try
		{
			const payload = this.#machine.confirmPortalLinkRevoke();
			this.#render();
			this.#startLinkRequest(payload, false, true);
		}
		catch (error)
		{
			this.#machine.cancelPortalLinkRevoke();
			this.#machine.setLinkSettingsError(this.#getErrorCode(error));
			this.#render();
		}
	};

	#handleCancelPortalLinkRevoke = (): void => {
		if (this.#machine.cancelPortalLinkRevoke())
		{
			this.#render();
		}
	};

	#showConfirmation(options: ConfirmationOptions): void
	{
		if (this.#destroyed || this.#confirmationMessageBox !== null)
		{
			return;
		}

		let confirmationMessageBox: MessageBox | null = null;
		confirmationMessageBox = MessageBox.create({
			useAirDesign: true,
			title: options.title,
			message: options.description,
			buttons: MessageBoxButtons.OK_CANCEL,
			okCaption: options.confirmText,
			cancelCaption: Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_CANCEL'),
			onOk: () => {
				if (confirmationMessageBox === null || !this.#settleConfirmation(confirmationMessageBox))
				{
					return false;
				}

				options.onConfirm();

				return true;
			},
			onCancel: () => {
				if (confirmationMessageBox === null || !this.#settleConfirmation(confirmationMessageBox))
				{
					return false;
				}

				options.onCancel();

				return true;
			},
			popupOptions: {
				closeByEsc: true,
				events: {
					onClose: () => {
						if (confirmationMessageBox !== null)
						{
							this.#handleConfirmationClose(confirmationMessageBox);
						}
					},
				},
			},
		});
		confirmationMessageBox.getOkButton().setStyle(options.confirmStyle ?? AirButtonStyle.FILLED);
		confirmationMessageBox.getOkButton().getDataSet().testid = 'vibecode-catalog-share-confirm-accept';
		confirmationMessageBox.getCancelButton().getDataSet().testid = 'vibecode-catalog-share-confirm-cancel';
		this.#confirmationMessageBox = confirmationMessageBox;
		this.#confirmationCancel = options.onCancel;
		confirmationMessageBox.show();
	}

	#handleConfirmationClose(messageBox: MessageBox): void
	{
		if (this.#confirmationMessageBox !== messageBox)
		{
			return;
		}

		const cancel = this.#confirmationCancel;
		this.#confirmationMessageBox = null;
		this.#confirmationCancel = null;
		cancel?.();
	}

	#settleConfirmation(messageBox: MessageBox): boolean
	{
		if (this.#confirmationMessageBox !== messageBox)
		{
			return false;
		}

		this.#confirmationMessageBox = null;
		this.#confirmationCancel = null;

		return true;
	}

	#startLinkRequest(
		payload: SetCatalogLinkPayload,
		copyAfterSave: boolean,
		returnToAudience: boolean,
	): void
	{
		const request = this.#saveLink(payload, copyAfterSave, returnToAudience);
		this.#linkRequest = request;
		void request.finally(() => {
			if (this.#linkRequest === request)
			{
				this.#linkRequest = null;
			}
		});
	}

	async #saveLink(
		payload: SetCatalogLinkPayload,
		copyAfterSave: boolean,
		returnToAudience: boolean,
	): Promise<void>
	{
		try
		{
			const linkState = await this.#api.setLink(this.#application.id, payload);
			if (this.#destroyed)
			{
				return;
			}

			this.#machine.completeLinkSave(linkState);
			if (returnToAudience)
			{
				this.#machine.closeLinkSettings();
			}
			this.#syncDraft();
			if (copyAfterSave && linkState.link !== null)
			{
				let copied = false;
				try
				{
					copied = await this.#copyText(linkState.link.url);
				}
				catch
				{
					copied = false;
				}

				if (this.#destroyed)
				{
					return;
				}

				if (copied)
				{
					NotificationCenter.notify({
						content: Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LINK_COPIED'),
						position: Position.TOP_RIGHT,
						useAirDesign: true,
					});
				}
				else
				{
					this.#machine.setLinkSettingsError('COPY_FAILED');
				}
			}

			this.#render();
		}
		catch (error)
		{
			if (!this.#destroyed)
			{
				this.#machine.failSaving(this.#getErrorCode(error));
				this.#syncDraft();
				this.#render();
			}
		}
	}

	#startDefaultLinkGeneration(): void
	{
		if (this.#linkRequest !== null || this.#destroyed)
		{
			return;
		}

		try
		{
			const payload = this.#machine.prepareDefaultLinkGeneration(this.#now());
			const request = this.#generateDefaultLink(payload);
			this.#linkRequest = request;
			void request.finally(() => {
				if (this.#linkRequest === request)
				{
					this.#linkRequest = null;
				}
			});
		}
		catch (error)
		{
			this.#machine.failDefaultLinkGeneration(this.#getErrorCode(error));
			this.#render();
		}
	}

	async #generateDefaultLink(payload: SetCatalogLinkPayload): Promise<void>
	{
		try
		{
			const linkState = await this.#api.setLink(this.#application.id, payload);
			if (this.#destroyed)
			{
				return;
			}

			if (linkState.link === null)
			{
				throw new Error('LINK_GENERATION_FAILED');
			}

			this.#machine.completeDefaultLinkGeneration(linkState, this.#now());
			this.#syncDraft();
			this.#render();
		}
		catch (error)
		{
			if (!this.#destroyed)
			{
				this.#machine.failDefaultLinkGeneration(this.#getErrorCode(error));
				this.#render();
			}
		}
	}

	#startCopyRequest(url: string): void
	{
		const request = this.#copyCanonicalLink(url);
		this.#linkRequest = request;
		void request.finally(() => {
			if (this.#linkRequest === request)
			{
				this.#linkRequest = null;
			}
		});
	}

	async #copyCanonicalLink(url: string): Promise<void>
	{
		let copied = false;
		try
		{
			copied = await this.#copyText(url);
		}
		catch
		{
			copied = false;
		}

		if (this.#destroyed)
		{
			return;
		}

		if (copied)
		{
			NotificationCenter.notify({
				content: Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LINK_COPIED'),
				position: Position.TOP_RIGHT,
				useAirDesign: true,
			});
		}
		else
		{
			this.#machine.setLinkSettingsError('COPY_FAILED');
		}
		this.#render();
	}

	async #saveShare(): Promise<void>
	{
		let desiredShare: CatalogShareState | null = null;
		try
		{
			desiredShare = this.#machine.beginShareSave();
		}
		catch (error)
		{
			this.#machine.setEditableError(this.#getErrorCode(error));
			this.#render();

			return;
		}

		this.#render();

		try
		{
			const canonicalShare = await this.#api.setShare(this.#application.id, desiredShare);
			if (this.#destroyed)
			{
				return;
			}

			this.#machine.completeShareSave(canonicalShare);
			this.#syncDraft();
			this.#render();

			const canonicalLinkState = await this.#api.getLink(this.#application.id);
			if (this.#destroyed)
			{
				return;
			}

			this.#machine.completeLinkRefresh(canonicalLinkState);
			this.#syncDraft();
			this.#render();
			NotificationCenter.notify({
				content: Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_SAVED'),
				position: Position.TOP_RIGHT,
				useAirDesign: true,
			});
		}
		catch (error)
		{
			if (!this.#destroyed)
			{
				this.#machine.failSaving(this.#getErrorCode(error));
				this.#syncDraft();
				this.#render();
			}
		}
	}

	#syncDraft(): void
	{
		const snapshot = this.#machine.getSnapshot();
		if (snapshot.draftShare === null || snapshot.linkState === null)
		{
			return;
		}

		this.#draft = {
			share: snapshot.draftShare,
			linkState: snapshot.linkState,
		};
	}

	#render(): void
	{
		if (this.#dialog === null)
		{
			return;
		}

		const snapshot = this.#machine.getSnapshot();
		const rendering = this.#view.render(snapshot);
		const linkStatuses = new Set([
			CatalogShareViewState.GeneratingDefaultLink,
			CatalogShareViewState.LinkSettings,
			CatalogShareViewState.ConfirmAnonymousLink,
			CatalogShareViewState.ConfirmPortalLinkRevoke,
			CatalogShareViewState.SavingLink,
		]);
		this.#dialog.setTitle(Loc.getMessage(linkStatuses.has(snapshot.status)
			? 'VIBECODECONNECTOR_CATALOG_SHARE_LINK_TITLE'
			: 'VIBECODECONNECTOR_CATALOG_SHARE_TITLE'));
		this.#dialog.setContent(rendering.content);
		this.#dialog.setLeftButtons(rendering.leftButtons);
		this.#dialog.setRightButtons(rendering.rightButtons);
	}

	#getErrorCode(error: mixed): string
	{
		return error instanceof Error && error.message !== '' ? error.message : 'UNKNOWN_ERROR';
	}

	#copyToClipboard = async (text: string): Promise<boolean> => {
		if (navigator.clipboard && window.isSecureContext)
		{
			await navigator.clipboard.writeText(text);

			return true;
		}

		return BX.clipboard?.copy(text) === true;
	};

	#handleAfterHide = (): void => {
		this.#release(false);
	};

	#release(hide: boolean): void
	{
		if (this.#destroyed)
		{
			return;
		}

		this.#destroyed = true;
		const confirmationMessageBox = this.#confirmationMessageBox;
		this.#confirmationMessageBox = null;
		this.#confirmationCancel = null;
		confirmationMessageBox?.close();
		this.#machine.close();
		this.#request = null;
		this.#saveRequest = null;
		this.#linkRequest = null;
		this.#shareReloadRequest = null;
		this.#linkReloadRequest = null;
		this.#applicationLinkCopyRequest = null;
		this.#chatWritingRequest = null;
		this.#view.destroy();

		const dialog = this.#dialog;
		this.#dialog = null;
		dialog?.unsubscribeAll();
		if (hide)
		{
			dialog?.hide();
		}

		this.#trigger.focus({ preventScroll: true });
	}
}
