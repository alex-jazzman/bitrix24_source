import BaseCommandHandler from "./base-command-handler";
import type {DocumentSavedMessage, IntermediateSaveMessage} from "./types";
import {ContentUpdatedMessage} from "./types";
import {ajax as Ajax, Loc, Tag, Text, Type} from "main.core";

const ALLOWED_ATTEMPTS_TO_GET_USER_INFO = 3;

/** `DocumentInfo::CONTENT_STATUS_NO_CHANGES`: the session ended with nothing to save. */
const CONTENT_STATUS_NO_CHANGES = 6;

export default class ServerCommandHandler extends BaseCommandHandler
{
	#badAttempts: Map<number, number> = new Map();

	getMap(): Object
	{
		return {
			onlyoffice: this.filterCurrentObject(this.handleSavedDocument.bind(this)),
			onlyofficeIntermediateSave: this.filterCurrentObject(this.handleIntermediateSave.bind(this)),
			contentUpdated: this.filterCurrentObject(this.handleContentUpdated.bind(this)),
		};
	}

	handleSavedDocument(data: DocumentSavedMessage): void
	{
		console.log('handleSavedDocument', data);

		// the same command carries the signal to the participants of the document, and that one speaks of
		// the document alone: it has no report of a session and so no outcome to tell the header about
		if (!Type.isPlainObject(data.documentSessionInfo))
		{
			return;
		}

		// the channel speaks on the end of the session, whatever it ended with, so the message is asked
		// what became of the document: a save is confirmed only by the write to Disk, and the saves
		// inside the session are told by the editor itself
		if (data.documentSessionInfo.wasFinallySaved)
		{
			this.onlyOffice.getSaveAdapter().handleSaveConfirmed();

			// the notification, unlike the status, belongs to the end of the session and never hides itself
			BX.UI.Notification.Center.notify({
				autoHide: false,
				content: Loc.getMessage('DISK_FILE_EDITOR_ONLYOFFICE_SAVED_AFTER_IDLE'),
			});

			return;
		}

		// an end without a save is not a refusal only when there was nothing to save: the document was
		// left as it was opened, and the header has nothing to claim about it. The refusal itself is
		// narrowed to the session which ended: unlike the confirmation, it is a claim about the work of
		// this very page, and a viewing tab or a session of somebody else has no save to take back
		if (
			data.documentSessionInfo.contentStatus !== CONTENT_STATUS_NO_CHANGES
			&& this.isCurrentDocumentSession(data.documentSession?.hash)
		)
		{
			this.onlyOffice.getSaveAdapter().handleSaveRejected(
				data.documentSessionInfo.failureCategory ?? null,
				data.documentSessionInfo.contentStatus ?? null,
			);
		}
	}

	/**
	 * The outcome of a save asked for inside the session, the Ctrl+S of the editor. The session goes on,
	 * so a refusal is told as it is, and a written version only as the evidence it is: the editor claims
	 * the saves of a living session itself, and the adapter takes the write for a page which was told
	 * its session had ended without one.
	 */
	handleIntermediateSave(data: IntermediateSaveMessage): void
	{
		if (!this.isCurrentDocumentSession(data.documentSession?.hash))
		{
			return;
		}

		if (data.saveInfo?.wasWritten === true)
		{
			this.onlyOffice.getSaveAdapter().handleIntermediateWrite();

			return;
		}

		if (data.saveInfo?.wasWritten !== false)
		{
			return;
		}

		this.onlyOffice.getSaveAdapter().handleSaveRejected(
			data.saveInfo.failureCategory ?? null,
			data.saveInfo.contentStatus ?? null,
		);
	}

	handleContentUpdated(data: ContentUpdatedMessage): void
	{
		console.log('handleContentUpdated', data);

		if (!data.object.updatedBy || this.isCurrentUser(data.object.updatedBy))
		{
			return;
		}

		if (this.onlyOffice.wasDocumentChanged())
		{
			this.#getUserInfo(data.object.updatedBy, data.updatedBy.infoToken).then(userData => {
				BX.UI.Notification.Center.notify({
					content: Loc.getMessage('DISK_FILE_EDITOR_ONLYOFFICE_SAVED_WHILE_EDITING', {
						'#NAME#': Text.encode(data.object.name),
						'#USER_NAME#': Text.encode(userData.name),
					}),
				});
			}, () => {});
		}
		else if (this.onlyOffice.isViewMode())
		{
			this.#getUserInfo(data.object.updatedBy, data.updatedBy.infoToken).then(userData => {
				let content = Loc.getMessage('DISK_FILE_EDITOR_ONLYOFFICE_VIEW_NON_ACTUAL_VERSION', {
					'#NAME#': Text.encode(data.object.name),
					'#USER_NAME#': Text.encode(userData.name),
				});
				content = Tag.render`<span>${content}</span>`;

				const refreshButton = content.querySelector('[data-refresh-btn]');
				if (refreshButton)
				{
					Tag.style(refreshButton)`
						cursor: pointer;
					`;
					refreshButton.addEventListener('click', this.#handleClickToRefreshEditor.bind(this));
				}

				BX.UI.Notification.Center.notify({
					content: content,
				});
			}, () => {});
		}
	}

	#handleClickToRefreshEditor(): void
	{
		this.onlyOffice.reloadView();
	}

	/**
	 * Name and avatar of the author of the update: the notification is the only place of the page which
	 * still needs them, and the token the author signs itself with is the only way to ask for them.
	 */
	#getUserInfo(userId: number, infoToken: string): Promise
	{
		if (this.#badAttempts.get(userId) >= ALLOWED_ATTEMPTS_TO_GET_USER_INFO)
		{
			return Promise.reject({status: 'blocked'});
		}

		return new Promise((resolve, reject) => {
			Ajax.runComponentAction('bitrix:disk.file.editor-onlyoffice', 'getUserInfo', {
				mode: 'ajax',
				json: {
					documentSessionId: this.context.documentSession.id,
					documentSessionHash: this.context.documentSession.hash,
					userId: userId,
					infoToken: infoToken,
				},
			}).then((response) => {
				if (response.status === 'success')
				{
					this.#badAttempts.delete(userId);
					resolve(response.data.user);
				}
			}, (response) => {
				const attempts = this.#badAttempts.get(userId) || 0;
				this.#badAttempts.set(userId, attempts + 1);

				reject(response);
			});
		});
	}
}