import { confirm } from 'crm.timeline.dialog';
import { Router } from 'crm.router';
import { ajax, Dom, Loc, Runtime, Tag, Text } from 'main.core';
import type { FeatureResolver } from 'sign.feature-resolver';
import type { Api } from 'sign.v2.api';
import { UI } from 'ui.notification';
import ConfigurableItem from '../configurable-item';
import { Base } from './base';
import 'ui.buttons';

let featureResolver: FeatureResolver | null = null;
let api: Api | null = null;
Runtime.loadExtension(['sign.v2.api', 'sign.feature-resolver']).then(async (exports) => {
	if (exports?.Api && exports?.FeatureResolver)
	{
		featureResolver = exports?.FeatureResolver.instance();
		api = new exports.Api();
	}
}).catch((errors) => {
	UI.Notification.Center.notify({
		content: errors[0].message,
		autoHideDelay: 5000,
	});
});

export class SignB2eDocument extends Base
{
	#isCancellationInProgress: boolean = false;
	#isAnnulmentInProgress: boolean = false;
	static isItemSupported(item: ConfigurableItem): boolean
	{
		return (
			item.getType() === 'SignB2eDocument'
			|| item.getType() === 'Activity:SignB2eDocument'
		);
	}

	onItemAction(item: ConfigurableItem, actionParams: ActionParams): void
	{
		const { action, actionType, actionData, animationCallbacks } = actionParams;
		if (actionType !== 'jsEvent')
		{
			return;
		}
		const documentId = Text.toInteger(actionData?.documentId);
		const processUri = actionData?.processUri;
		const documentHash = actionData?.documentHash || '';

		if (action === 'Activity:SignB2eDocument:ShowSigningCancel')
		{
			this.#cancelWithConfirm(actionData?.documentUid);
		}
		else if (action === 'SignB2eDocument:ShowAnnulConfirm'
			|| action === 'Activity:SignB2eDocument:ShowAnnulConfirm')
		{
			this.#annulWithConfirm(actionData?.documentUid, actionData?.annul === 'Y');
		}
		else if ((action === 'SignB2eDocument:ShowSigningProcess'
			|| action === 'Activity:SignB2eDocument:ShowSigningProcess') && processUri.length > 0)
		{
			this.#showSigningProcess(processUri);
		}
		else if ((action === 'SignB2eDocument:Preview' || action === 'Activity:SignB2eDocument:Preview') && documentId > 0)
		{
			this.#previewDocument(actionData);
		}
		else if ((action === 'SignB2eDocument:CreateDocumentChat' || action === 'Activity:SignB2eDocument:CreateDocumentChat') && documentId > 0)
		{
			if (featureResolver && featureResolver.released('createDocumentChat'))
			{
				this.#createDocumentChat(actionData);
			}
		}
		else if ((action === 'SignB2eDocument:Modify' || action === 'Activity:SignB2eDocument:Modify') && documentId > 0)
		{
			this.#modifyDocument(actionData);
		}
		else if (action === 'SignB2eDocument:Resend' && documentId > 0 && actionData?.recipientHash)
		{
			// eslint-disable-next-line promise/catch-or-return
			this.#resendDocument(actionData, animationCallbacks).then(() => {
				if (actionData.buttonId)
				{
					const btn = item.getLayoutFooterButtonById(actionData.buttonId);
					btn.disableWithTimer(60);
				}
			});
		}
		else if (action === 'SignB2eDocument:TouchSigner' && documentId > 0)
		{
			this.#touchSigner(actionData);
		}
		else if (action === 'SignB2eDocument:Download' && documentHash)
		{
			this.#download(actionData, animationCallbacks);
		}
		else if (action === 'SignB2eDocumentEntry:Delete' && actionData?.entryId)
		{
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-dialogs
			confirm({
				content: Tag.render`<div>${Text.encode(actionData?.confirmationText || '')}</div>`,
				preset: 'YES_NO',
				destructive: true,
				onConfirm: () => {
					return this.#deleteEntry(actionData.entryId);
				},
			});
		}
		else if (action === 'SignB2eDocument:ModifyDateSignUntil')
		{
			this.#modifyDateSignUntil(item, actionData, animationCallbacks);
		}
	}

	#cancelWithConfirm(documentUid: string): void
	{
		if (this.#isCancellationInProgress)
		{
			return;
		}

		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-dialogs
		confirm({
			title: Loc.getMessage('CRM_TIMELINE_ITEM_SIGNING_CANCEL_DIALOG_TITLE'),
			content: Tag.render`<div>${Text.encode(Loc.getMessage('CRM_TIMELINE_ITEM_SIGNING_CANCEL_DIALOG_TEXT'))}</div>`,
			preset: 'OK_CANCEL',
			destructive: true,
			confirmText: Loc.getMessage('CRM_TIMELINE_ITEM_SIGNING_CANCEL_DIALOG_YES_BUTTON_TEXT'),
			cancelText: Loc.getMessage('CRM_TIMELINE_ITEM_SIGNING_CANCEL_DIALOG_NO_BUTTON_TEXT'),
			onConfirm: () => {
				this.#isCancellationInProgress = true;
				this.#cancelSigningProcess(documentUid).finally(() => {
					this.#isCancellationInProgress = false;
				});
			},
		});
	}

	#cancelSigningProcess(documentUid): Promise
	{
		return new Promise((resolve, reject) => {
			ajax.runAction(
				'sign.api_v1.document.signing.stop',
				{
					data: {
						uid: documentUid,
					},
					preparePost: false,
					headers: [{
						name: 'Content-Type',
						value: 'application/json',
					}],
				},
			).then((response) => {
				UI.Notification.Center.notify({
					content: Loc.getMessage('CRM_TIMELINE_ITEM_SIGNING_CANCEL_SUCCESS'),
					autoHideDelay: 5000,
				});
				resolve(response);
			}, (response) => {
				response.errors.forEach((error) => {
					UI.Notification.Center.notify({
						content: error.message,
						autoHideDelay: 5000,
					});
				});
				reject(response.errors);
			}).catch(() => {
				reject();
			});
		});
	}

	#annulWithConfirm(documentUid: string, annul: boolean): void
	{
		if (this.#isAnnulmentInProgress)
		{
			return;
		}

		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-dialogs
		confirm({
			title: Loc.getMessage(annul
				? 'CRM_TIMELINE_ITEM_SIGN_ANNUL_DIALOG_TITLE'
				: 'CRM_TIMELINE_ITEM_SIGN_UNANNUL_DIALOG_TITLE'),
			content: Tag.render`<div>${Text.encode(Loc.getMessage(annul
				? 'CRM_TIMELINE_ITEM_SIGN_ANNUL_DIALOG_TEXT'
				: 'CRM_TIMELINE_ITEM_SIGN_UNANNUL_DIALOG_TEXT'))}</div>`,
			preset: 'OK_CANCEL',
			confirmText: Loc.getMessage(annul
				? 'CRM_TIMELINE_ITEM_SIGN_ANNUL_DIALOG_YES_BUTTON_TEXT'
				: 'CRM_TIMELINE_ITEM_SIGN_UNANNUL_DIALOG_YES_BUTTON_TEXT'),
			cancelText: Loc.getMessage('CRM_TIMELINE_ITEM_SIGN_ANNUL_DIALOG_NO_BUTTON_TEXT'),
			onConfirm: () => {
				this.#isAnnulmentInProgress = true;
				this.#annulDocument(documentUid, annul).finally(() => {
					this.#isAnnulmentInProgress = false;
				});
			},
		});
	}

	#annulDocument(documentUid, annul: boolean): Promise
	{
		return new Promise((resolve, reject) => {
			ajax.runAction(
				'sign.api_v1.document.annulByDocument',
				{
					data: {
						uid: documentUid,
						annul,
					},
					preparePost: false,
					headers: [{
						name: 'Content-Type',
						value: 'application/json',
					}],
				},
			).then((response) => {
				UI.Notification.Center.notify({
					content: this.#getAnnulResultMessage(response?.data, annul),
					autoHideDelay: 5000,
				});
				resolve(response);
			}, (response) => {
				response.errors.forEach((error) => {
					UI.Notification.Center.notify({
						content: error.message,
						autoHideDelay: 5000,
					});
				});
				reject(response.errors);
			}).catch(() => {
				reject();
			});
		});
	}

	#getAnnulResultMessage(data, annul: boolean): string
	{
		const changed = Text.toInteger(data?.changed);
		const forbidden = Text.toInteger(data?.forbidden);

		if (changed > 0)
		{
			return Loc.getMessage(annul
				? 'CRM_TIMELINE_ITEM_SIGN_ANNUL_SUCCESS'
				: 'CRM_TIMELINE_ITEM_SIGN_UNANNUL_SUCCESS');
		}

		if (forbidden > 0)
		{
			return Loc.getMessage('CRM_TIMELINE_ITEM_SIGN_ANNUL_FORBIDDEN');
		}

		return Loc.getMessage('CRM_TIMELINE_ITEM_SIGN_ANNUL_UNCHANGED');
	}

	#deleteEntry(entryId): Promise
	{
		console.log(`delete entry${entryId}`);
	}

	#showSigningProcess(processUri): Promise
	{
		return Router.openSlider(processUri);
	}

	#modifyDocument({ documentId }): Promise
	{
		return Router.openSlider(
			`/sign/b2e/doc/0/?docId=${documentId}&stepId=changePartner&noRedirect=Y`,
			{
				width: 1250,
			},
		);
	}

	#previewDocument({ documentId }): Promise
	{
		return Router.openSlider(`/sign/b2e/preview/0/?docId=${documentId}&noRedirect=Y`);
	}

	async #createDocumentChat({ chatType, documentId }: { chatType: number, documentId: number }): void
	{
		if (api && featureResolver && featureResolver.released('createDocumentChat'))
		{
			const chatId = (await api.createDocumentChat(chatType, documentId)).chatId;

			Runtime.loadExtension('im.public.iframe').then((exports: Object) => {
				exports.Messenger.openChat(`chat${chatId}`);
			}).catch((exception) => {
				console.error('Error loading "im.public.iframe":', exception);
			});
		}
	}

	#resendDocument({ documentId, recipientHash }, animationCallbacks): Promise
	{
		if (animationCallbacks.onStart)
		{
			animationCallbacks.onStart();
		}

		return new Promise((resolve, reject) => {
			ajax.runAction(
				'sign.internal.document.resendFile',
				{
					data: {
						memberHash: recipientHash,
						documentId,
					},
				},
			).then(() => {
				UI.Notification.Center.notify({
					content: Loc.getMessage('CRM_TIMELINE_ITEM_SIGN_DOCUMENT_RESEND_SUCCESS'),
					autoHideDelay: 5000,
				});
				if (animationCallbacks.onStop)
				{
					animationCallbacks.onStop();
				}
				resolve();
			}, (response) => {
				UI.Notification.Center.notify({
					content: response.errors[0].message,
					autoHideDelay: 5000,
				});
				if (animationCallbacks.onStop)
				{
					animationCallbacks.onStop();
				}
				reject();
			});

			console.log(`resend document ${documentId} for ${recipientHash}`);
		});
	}

	#touchSigner({ documentId }): void
	{
		console.log(`touch signer document ${documentId}`);
	}

	#download({ filename, downloadLink }, animationCallbacks): void
	{
		if (animationCallbacks.onStart)
		{
			animationCallbacks.onStart();
		}

		const link = document.createElement('a');
		link.href = downloadLink;
		link.setAttribute('download', filename || '');

		Dom.document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		if (animationCallbacks.onStop)
		{
			animationCallbacks.onStop();
		}
	}

	async #modifyDateSignUntil(item: ConfigurableItem, actionData, animationCallbacks): void
	{
		if (!actionData.uid || !actionData.valueTs)
		{
			return;
		}

		if (animationCallbacks.onStart)
		{
			animationCallbacks.onStart();
		}

		const { uid, valueTs } = actionData;

		try
		{
			await api.modifyDateSignUntil(uid, valueTs);
		}
		catch
		{
			item.forceRefreshLayout();
		}

		if (animationCallbacks.onStop)
		{
			animationCallbacks.onStop();
		}
	}
}
