/* eslint-disable */
this.BX = this.BX || {};
this.BX.Disk = this.BX.Disk || {};
(function (exports, main_core, main_core_events, pull_client, disk_externalLink, ui_buttons, ui_iconSet_outline, disk_documentHeader, ui_dialogs_messagebox, main_core_cache) {
	'use strict';

	class BaseCommandHandler {
		options = null;
		onlyOffice = null;
		constructor(commandOptions) {
			this.options = commandOptions;
			this.context = commandOptions.context;
			this.onlyOffice = commandOptions.onlyOffice;
		}
		getModuleId() {
			return 'disk';
		}
		getSubscriptionType() {
			return pull_client.PullClient.SubscriptionType.Server;
		}
		filterCurrentObject(handler) {
			return data => {
				if (this.context.object.id !== data.object.id) {
					return;
				}
				return handler(data);
			};
		}
		isCurrentUser(userId) {
			return this.context.currentUser.id === userId;
		}

		/**
		 * The channel belongs to the object, so a message reaches every tab which has it open. The hash of
		 * the document session names the opening the message came from: editors of one editing session
		 * share it, while a viewing and a reopening each have one of their own.
		 */
		isCurrentDocumentSession(documentSessionHash) {
			return main_core.Type.isStringFilled(documentSessionHash) && this.context.documentSession?.hash === documentSessionHash;
		}
	}

	const ALLOWED_ATTEMPTS_TO_GET_USER_INFO = 3;

	/** `DocumentInfo::CONTENT_STATUS_NO_CHANGES`: the session ended with nothing to save. */
	const CONTENT_STATUS_NO_CHANGES = 6;
	class ServerCommandHandler extends BaseCommandHandler {
		#badAttempts = new Map();
		getMap() {
			return {
				onlyoffice: this.filterCurrentObject(this.handleSavedDocument.bind(this)),
				onlyofficeIntermediateSave: this.filterCurrentObject(this.handleIntermediateSave.bind(this)),
				contentUpdated: this.filterCurrentObject(this.handleContentUpdated.bind(this))
			};
		}
		handleSavedDocument(data) {
			console.log('handleSavedDocument', data);

			// the same command carries the signal to the participants of the document, and that one speaks of
			// the document alone: it has no report of a session and so no outcome to tell the header about
			if (!main_core.Type.isPlainObject(data.documentSessionInfo)) {
				return;
			}

			// the channel speaks on the end of the session, whatever it ended with, so the message is asked
			// what became of the document: a save is confirmed only by the write to Disk, and the saves
			// inside the session are told by the editor itself
			if (data.documentSessionInfo.wasFinallySaved) {
				this.onlyOffice.getSaveAdapter().handleSaveConfirmed();

				// the notification, unlike the status, belongs to the end of the session and never hides itself
				BX.UI.Notification.Center.notify({
					autoHide: false,
					content: main_core.Loc.getMessage('DISK_FILE_EDITOR_ONLYOFFICE_SAVED_AFTER_IDLE')
				});
				return;
			}

			// an end without a save is not a refusal only when there was nothing to save: the document was
			// left as it was opened, and the header has nothing to claim about it. The refusal itself is
			// narrowed to the session which ended: unlike the confirmation, it is a claim about the work of
			// this very page, and a viewing tab or a session of somebody else has no save to take back
			if (data.documentSessionInfo.contentStatus !== CONTENT_STATUS_NO_CHANGES && this.isCurrentDocumentSession(data.documentSession?.hash)) {
				this.onlyOffice.getSaveAdapter().handleSaveRejected(data.documentSessionInfo.failureCategory ?? null, data.documentSessionInfo.contentStatus ?? null);
			}
		}

		/**
		 * The outcome of a save asked for inside the session, the Ctrl+S of the editor. The session goes on,
		 * so a refusal is told as it is, and a written version only as the evidence it is: the editor claims
		 * the saves of a living session itself, and the adapter takes the write for a page which was told
		 * its session had ended without one.
		 */
		handleIntermediateSave(data) {
			if (!this.isCurrentDocumentSession(data.documentSession?.hash)) {
				return;
			}
			if (data.saveInfo?.wasWritten === true) {
				this.onlyOffice.getSaveAdapter().handleIntermediateWrite();
				return;
			}
			if (data.saveInfo?.wasWritten !== false) {
				return;
			}
			this.onlyOffice.getSaveAdapter().handleSaveRejected(data.saveInfo.failureCategory ?? null, data.saveInfo.contentStatus ?? null);
		}
		handleContentUpdated(data) {
			console.log('handleContentUpdated', data);
			if (!data.object.updatedBy || this.isCurrentUser(data.object.updatedBy)) {
				return;
			}
			if (this.onlyOffice.wasDocumentChanged()) {
				this.#getUserInfo(data.object.updatedBy, data.updatedBy.infoToken).then(userData => {
					BX.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('DISK_FILE_EDITOR_ONLYOFFICE_SAVED_WHILE_EDITING', {
							'#NAME#': main_core.Text.encode(data.object.name),
							'#USER_NAME#': main_core.Text.encode(userData.name)
						})
					});
				}, () => {});
			} else if (this.onlyOffice.isViewMode()) {
				this.#getUserInfo(data.object.updatedBy, data.updatedBy.infoToken).then(userData => {
					let content = main_core.Loc.getMessage('DISK_FILE_EDITOR_ONLYOFFICE_VIEW_NON_ACTUAL_VERSION', {
						'#NAME#': main_core.Text.encode(data.object.name),
						'#USER_NAME#': main_core.Text.encode(userData.name)
					});
					content = main_core.Tag.render`<span>${content}</span>`;
					const refreshButton = content.querySelector('[data-refresh-btn]');
					if (refreshButton) {
						main_core.Tag.style(refreshButton)`
						cursor: pointer;
					`;
						refreshButton.addEventListener('click', this.#handleClickToRefreshEditor.bind(this));
					}
					BX.UI.Notification.Center.notify({
						content: content
					});
				}, () => {});
			}
		}
		#handleClickToRefreshEditor() {
			this.onlyOffice.reloadView();
		}

		/**
		 * Name and avatar of the author of the update: the notification is the only place of the page which
		 * still needs them, and the token the author signs itself with is the only way to ask for them.
		 */
		#getUserInfo(userId, infoToken) {
			if (this.#badAttempts.get(userId) >= ALLOWED_ATTEMPTS_TO_GET_USER_INFO) {
				return Promise.reject({
					status: 'blocked'
				});
			}
			return new Promise((resolve, reject) => {
				main_core.ajax.runComponentAction('bitrix:disk.file.editor-onlyoffice', 'getUserInfo', {
					mode: 'ajax',
					json: {
						documentSessionId: this.context.documentSession.id,
						documentSessionHash: this.context.documentSession.hash,
						userId: userId,
						infoToken: infoToken
					}
				}).then(response => {
					if (response.status === 'success') {
						this.#badAttempts.delete(userId);
						resolve(response.data.user);
					}
				}, response => {
					const attempts = this.#badAttempts.get(userId) || 0;
					this.#badAttempts.set(userId, attempts + 1);
					reject(response);
				});
			});
		}
	}

	class CustomErrorControl {
		showWhenTooLarge(fileName, container, targetNode, linkToDownload, downloadSizeValue) {
			this.showCommonWarning({
				container: container,
				targetNode: targetNode,
				title: main_core.Loc.getMessage('DISK_FILE_EDITOR_ONLYOFFICE_CUSTOM_ERROR_LARGE_FILE_TITLE'),
				description: main_core.Loc.getMessage('DISK_FILE_EDITOR_ONLYOFFICE_CUSTOM_ERROR_LARGE_FILE_DESCR'),
				fileName: fileName,
				linkToDownload: linkToDownload,
				downloadSizeValue: downloadSizeValue
			});
		}
		showWhenNotFound(container, targetNode) {
			this.showCommonWarning({
				container: container,
				targetNode: targetNode,
				title: main_core.Loc.getMessage('DISK_FILE_EDITOR_ONLYOFFICE_CUSTOM_ERROR_FILE_TITLE'),
				description: main_core.Loc.getMessage('DISK_FILE_EDITOR_ONLYOFFICE_CUSTOM_ERROR_RIGHTS_OR_NOT_FOUND_DESCR')
			});
		}
		showCommonWarning(options) {
			const containerClass = 'disk-fe-office-warning--popup';
			let fileNameNode = '';
			if (options.fileName) {
				fileNameNode = main_core.Tag.render`<div class="disk-fe-office-warning-file-name">${main_core.Text.encode(options.fileName)}</div>`;
			}
			let downloadButtonNode = '';
			if (options.linkToDownload) {
				let downloadSize = '';
				if (options.downloadSizeValue) {
					downloadSize = options.downloadSizeValue;
				}
				const downloadButton = new ui_buttons.Button({
					text: main_core.Loc.getMessage('DISK_FILE_EDITOR_ONLYOFFICE_HEADER_BTN_DOWNLOAD'),
					round: true,
					noCaps: true,
					tag: ui_buttons.Button.Tag.LINK,
					link: options.linkToDownload,
					color: ui_buttons.AirButtonStyle.FILLED,
					className: '--air disk-fe-office-warning-btn',
					icon: ui_buttons.ButtonIcon.DOWNLOAD,
					iconPosition: 'left',
					size: ui_buttons.ButtonSize.LARGE,
					props: {
						target: '_blank'
					}
				});
				downloadButtonNode = downloadButton.render();
				downloadButton.setText(`${main_core.Loc.getMessage('DISK_FILE_EDITOR_ONLYOFFICE_HEADER_BTN_DOWNLOAD')} ${downloadSize}`);
			}
			const errorControl = main_core.Tag.render`
			<div class="disk-fe-office-warning-wrap">
				<div class="disk-fe-office-warning-overlay"></div>
				<div class="disk-fe-office-warning-box">
					<div class="disk-fe-office-warning-icon"></div>
					<div class="disk-fe-office-warning-title">${options.title}</div>				
					<div class="disk-fe-office-warning-desc">${options.description}</div>
					${fileNameNode}
					${downloadButtonNode}
				</div>
			</div>
		`;
			main_core.Dom.addClass(options.container, containerClass);
			main_core.Dom.prepend(errorControl, options.targetNode);
		}
	}

	/** Three product states of saving plus the neutral one, as the header of the document knows them. */

	/**
	 * Starts the save the editor runs on its own. OnlyOffice keeps saving entirely inside the document
	 * server: the editor saves by itself and by its own button, and its public interface for the page
	 * offers no save among its methods - a forced save is a call between the servers. So the shell has
	 * nothing to pass here and the header renders no retry, which costs the user nothing: the editor
	 * repeats a refused save on its own, and the repetition reaches the header as the next state of the
	 * document. A request appears the day a save of this document becomes reachable from the page.
	 */

	/**
	 * How the page tells the instruction of a failure. The indicator of the header holds one short line
	 * and neither wraps nor shrinks it, so what to do about the failure goes to a notification instead.
	 * `isFinal` marks the failure nothing follows: such an instruction waits for the user.
	 */

	/** Clock of the guard: the page leaves it to the timers of the window, a test replaces both. */

	/** `onDocumentStateChange` of the editor: `data` is true while the changes are not collected yet. */

	/** Payload of `onError` of the editor. */

	/** Payload of `onWarning` of the editor, already unpacked by the page. */

	/**
	 * A failure worth a report to the portal, and the moment the editor takes it back. The text of the
	 * editor travels here and only here: the header speaks the phrases of the portal. `isFinal` marks
	 * the failure nothing follows; a removable one the editor takes back by saving again.
	 */

	/** A save which stays unconfirmed this long is not coming: the normal one takes about a second. */
	const GUARD_SECONDS = 30;

	/** The editor stopped on its own error; nothing about this document follows it. */
	const EDITOR_FAILURE_WARNING = -25;

	/** The portal refused the save the editor offered; the editing goes on. */
	const REFUSED_SAVE_WARNING = -331;

	/** `DocumentInfo::CONTENT_STATUS_SAVE_REJECTED`: the portal refused the save which ended the session. */
	const REJECTED_CONTENT_STATUS = 7;

	/** `DocumentInfo::CONTENT_STATUS_INTERRUPTED`: the session ended without a final save. */
	const INTERRUPTED_CONTENT_STATUS = 8;

	/** The statuses which end the session: the editor has no save of this document left to confirm. */
	const finalContentStatuses = new Set([REJECTED_CONTENT_STATUS, INTERRUPTED_CONTENT_STATUS]);

	/** What the indicator of the header keeps, and what the notification tells once about the same failure. */

	const Phrase = {
		notSavedToDisk: {
			state: 'DISK_FILE_EDITOR_ONLYOFFICE_SAVE_STATUS_NOT_SAVED_TO_DISK',
			hint: 'DISK_FILE_EDITOR_ONLYOFFICE_SAVE_STATUS_NOT_SAVED_TO_DISK_HINT'
		},
		interrupted: {
			state: 'DISK_FILE_EDITOR_ONLYOFFICE_SAVE_STATUS_INTERRUPTED',
			hint: 'DISK_FILE_EDITOR_ONLYOFFICE_SAVE_STATUS_INTERRUPTED_HINT'
		},
		editorFailure: {
			state: 'DISK_FILE_EDITOR_ONLYOFFICE_SAVE_STATUS_EDITOR_FAILURE',
			hint: 'DISK_FILE_EDITOR_ONLYOFFICE_SAVE_STATUS_EDITOR_FAILURE_HINT'
		},
		unconfirmed: {
			state: 'DISK_FILE_EDITOR_ONLYOFFICE_SAVE_STATUS_UNCONFIRMED',
			hint: 'DISK_FILE_EDITOR_ONLYOFFICE_SAVE_STATUS_UNCONFIRMED_HINT'
		}
	};

	/** Categories of a refused save of the portal, `Save\FailureCategory` of the module. */
	const phraseByCategory = new Map([['download_failed', Phrase.notSavedToDisk], ['incomplete_file', Phrase.notSavedToDisk], ['write_failed', Phrase.notSavedToDisk], ['session_interrupted', Phrase.interrupted]]);

	/**
	 * State of saving of a document opened in OnlyOffice, told to the header in the three product states
	 * of the editor adapter contract. The editor reports the beginning of a change and the moment it has
	 * handed every change over to the document server - that moment is the save the header shows, the
	 * same one the own indicator of the editor works by. The channel of the document confirms the write
	 * to Disk afterwards and only repeats the state the header is already in.
	 *
	 * A save which never happens reaches the page three ways: as a warning of the editor, as an error of
	 * the editor, or as nothing at all - and the last one is why the adapter keeps a guard of its own.
	 */
	class SaveAdapter {
		#listeners = new Set();
		#failureListeners = new Set();
		#status = null;
		#requestSave = null;
		#timers = {
			setTimeout: (handler, timeout) => setTimeout(handler, timeout),
			clearTimeout: timer => clearTimeout(timer)
		};
		#showHint = () => {};
		#guardTimer = null;
		/** The failure of the editor is final: no state of the document is believed after it. */
		#terminal = false;
		/**
		 * The session ended and the changes never reached Disk. The editor of this page goes on reporting
		 * states of the document, and none of them is evidence of a write any more: only the write itself.
		 */
		#endedWithoutSave = false;
		/** The instruction is told once per continuous failure; the state of it stays in the header. */
		#hintTold = false;
		/** The failure reported to the page, kept until the editor takes it back. */
		#failure = null;
		constructor(options = {}) {
			if (main_core.Type.isFunction(options.requestSave)) {
				this.#requestSave = options.requestSave;
			}
			if (main_core.Type.isFunction(options.timers?.setTimeout) && main_core.Type.isFunction(options.timers?.clearTimeout)) {
				this.#timers = options.timers;
			}
			if (main_core.Type.isFunction(options.showHint)) {
				this.#showHint = options.showHint;
			}
		}
		subscribeToSaveStatus(listener) {
			if (!main_core.Type.isFunction(listener)) {
				return () => {};
			}
			this.#listeners.add(listener);

			// a header mounted after the editor has already reported something starts from the truth
			if (this.#status !== null) {
				listener(this.#status);
			}
			return () => {
				this.#listeners.delete(listener);
			};
		}

		/**
		 * The page reports a failure to the portal once per continuous failure, so the events come in
		 * pairs: a failure, and the recovery which takes a removable one back.
		 */
		subscribeToFailure(listener) {
			if (!main_core.Type.isFunction(listener)) {
				return () => {};
			}
			this.#failureListeners.add(listener);
			return () => {
				this.#failureListeners.delete(listener);
			};
		}
		canRetrySave() {
			return this.#requestSave !== null;
		}
		async retrySave() {
			if (this.#requestSave === null || this.#terminal) {
				return;
			}
			this.#publish({
				state: 'saving'
			});
			try {
				// the request is only started here: its result comes back as the next status, not as a resolution
				this.#requestSave();
			} catch {
				// the attempt could not even be started, so the refusal has no explanation of its own
				this.#publish({
					state: 'failed'
				});
			}
		}

		/**
		 * A document with changes the editing service has not collected yet is a document being saved, and
		 * a document whose changes it has collected is a saved one. This is the only source of the status
		 * inside the session: the channel of the document reports the save which ends the session, not the
		 * saves inside it, so waiting for it would leave the header in saving until the very end.
		 */
		handleDocumentStateChange(event) {
			if (this.#terminal || this.#endedWithoutSave) {
				return;
			}
			if (event?.data === true) {
				this.#publish({
					state: 'saving'
				});
				return;
			}
			if (event?.data !== false) {
				return;
			}

			// the editor has confirmed the changes itself, which takes a removable failure back
			if (this.#failure !== null) {
				this.#publish({
					state: 'saved'
				});
				this.#emitRecovered();
				return;
			}
			if (this.#hasUnconfirmedChanges()) {
				this.#publish({
					state: 'saved'
				});
			}
		}

		/** The channel of the document carries the write to Disk of the save which ended the session. */
		handleSaveConfirmed() {
			if (this.#terminal) {
				return;
			}

			// the write to Disk is the only thing which takes back a session ended without a save
			this.#endedWithoutSave = false;
			this.#publish({
				state: 'saved'
			});
		}

		/**
		 * A version written inside the session. The editor of a living session claims its own saves, so
		 * such a write says nothing new to a page whose session goes on. To a page told the session ended
		 * without a save it says everything: the write is the very evidence that refusal waits for, and it
		 * takes the refusal back the way the write which ends the session does.
		 */
		handleIntermediateWrite() {
			if (this.#terminal || !this.#endedWithoutSave) {
				return;
			}
			this.#endedWithoutSave = false;
			this.#publish({
				state: 'saved'
			});
			// the page saves again, so it may go back to telling the portal that the work goes on
			this.#emitRecovered();
		}

		/**
		 * The session ended on a save which never reached Disk. The channel tells the outcome of the whole
		 * session, so the refusal is published whatever the header shows now: the editor of this page may
		 * have handed its changes over long ago and be sitting in saved, and that is exactly the claim
		 * being taken back. The category names what went wrong on the portal side.
		 */
		handleSaveRejected(category = null, contentStatus = null) {
			if (this.#terminal) {
				return;
			}
			const endsSession = finalContentStatuses.has(contentStatus);

			// the end of the session is the last word about this document, so its instruction is told even
			// when a failure before it has told one of its own - and once, however often it is reported
			if (endsSession && !this.#endedWithoutSave) {
				this.#hintTold = false;
			}
			this.#publishFailure(this.#phraseOfRefusal(category, contentStatus));

			// the editor of this page knows nothing of the end of the session: it goes on collecting the
			// changes of the user and calling them saves, and not one of them reaches Disk any more
			if (endsSession) {
				this.#endedWithoutSave = true;
			}
		}

		/**
		 * The editor reports a refused save and its own breakdown as warnings, and `onError` arrives in
		 * neither case. A breakdown of the editor (-25) is final: the session of this document is lost
		 * inside the editor and only a copy saved by hand carries the changes out.
		 */
		handleEditorWarning(warning) {
			if (!main_core.Type.isNumber(warning?.warningCode)) {
				// eslint-disable-next-line no-console
				console.warn('disk.file.editor-onlyoffice: a warning of the editor without a code', warning);
				return;
			}
			if (this.#terminal) {
				return;
			}
			if (warning.warningCode === EDITOR_FAILURE_WARNING) {
				this.#terminal = true;
				// a copy saved by hand is all that is left of the changes, so this instruction is told again
				this.#hintTold = false;
				this.#publishFailure(Phrase.editorFailure);
				// the breakdown is reported even when a removable failure has already been reported
				this.#failure = null;
				this.#emitFailure('editor_failure', warning.warningCode, warning.warningDescription);
				return;
			}

			// the session has already ended without the changes reaching Disk; a refused save of the editor
			// neither adds to that nor is able to take it back
			if (this.#endedWithoutSave) {
				return;
			}
			if (warning.warningCode === REFUSED_SAVE_WARNING) {
				this.#publishFailure(Phrase.notSavedToDisk);
			}
		}

		/**
		 * Errors of opening arrive the same way as errors of saving, so a refusal is reported only while
		 * there are changes no save has confirmed yet. Such an error is not the end of the editing: the
		 * state is removable and the editor takes it back by confirming the changes.
		 */
		handleEditorError(error) {
			// a page whose session is over must not soften the refusal with a status which never updates
			if (this.#terminal || this.#endedWithoutSave || !this.#hasUnconfirmedChanges()) {
				return;
			}
			this.#publishFailure(Phrase.unconfirmed);
			this.#emitFailure('editor_failure', error?.errorCode, error?.errorDescription);
		}
		#phraseOfRefusal(category, contentStatus) {
			const phrase = main_core.Type.isStringFilled(category) ? phraseByCategory.get(category) : undefined;
			if (phrase !== undefined) {
				return phrase;
			}
			if (contentStatus === INTERRUPTED_CONTENT_STATUS) {
				return Phrase.interrupted;
			}

			// a category the page does not know still means the changes are not on Disk
			return Phrase.notSavedToDisk;
		}
		#hasUnconfirmedChanges() {
			return this.#status?.state === 'saving' || this.#status?.state === 'failed';
		}

		/**
		 * Nothing has confirmed the save for too long and nothing has refused it either: the page says so
		 * itself rather than leaving the header in saving forever.
		 */
		#startGuard() {
			if (this.#terminal || this.#guardTimer !== null) {
				return;
			}
			this.#guardTimer = this.#timers.setTimeout(() => {
				this.#guardTimer = null;
				this.#publishFailure(Phrase.unconfirmed);
				this.#emitFailure('save_unconfirmed', null, null);
			}, GUARD_SECONDS * 1000);
		}
		#stopGuard() {
			if (this.#guardTimer === null) {
				return;
			}
			this.#timers.clearTimeout(this.#guardTimer);
			this.#guardTimer = null;
		}
		#publishFailure(phrase) {
			this.#publish({
				state: 'failed',
				errorMessage: main_core.Loc.getMessage(phrase.state)
			});
			this.#tellHint(phrase);
		}

		/**
		 * What to do about a failure is longer than the one line of the indicator, so the page tells it
		 * once per continuous failure: a second notification about a state already shown is noise.
		 */
		#tellHint(phrase) {
			if (this.#hintTold) {
				return;
			}
			this.#hintTold = true;
			this.#showHint(main_core.Loc.getMessage(phrase.hint), this.#terminal);
		}
		#publish(status) {
			if (this.#status?.state === status.state && this.#status?.errorMessage === status.errorMessage) {
				return;
			}
			this.#status = status;
			if (status.state !== 'failed') {
				this.#hintTold = false;
			}
			if (status.state === 'saving') {
				this.#startGuard();
			} else {
				this.#stopGuard();
			}
			this.#listeners.forEach(listener => listener(status));
		}
		#emitFailure(reason, editorCode, editorMessage) {
			// one report per continuous failure: the page turns this event into a request to the portal
			if (this.#failure !== null) {
				return;
			}
			this.#failure = {
				kind: 'failure',
				reason,
				isFinal: this.#terminal,
				editorCode: main_core.Type.isNumber(editorCode) ? editorCode : null,
				editorMessage: main_core.Type.isStringFilled(editorMessage) ? editorMessage : null
			};
			this.#failureListeners.forEach(listener => listener(this.#failure));
		}
		#emitRecovered() {
			if (this.#failure === null) {
				return;
			}
			const recovered = {
				...this.#failure,
				kind: 'recovered'
			};
			this.#failure = null;
			this.#failureListeners.forEach(listener => listener(recovered));
		}
	}

	/** `disk.api.onlyoffice.reportEditorFailure`: the log of the portal, not a claim to the user. */
	const REPORT_ACTION = 'disk.api.onlyoffice.reportEditorFailure';
	/**
	 * What the page does with a failure of saving the adapter has found: it reports the failure to the
	 * log, and a failure nothing follows also stops it telling the portal that the work on the document
	 * goes on. A removable failure leaves that signal alone: the editor saves again on its own, while a
	 * page gone silent meanwhile is an idle session the portal interrupts for everyone editing the
	 * document. The session itself stays open - the co-authors go on editing the same document - so
	 * nothing here touches it.
	 *
	 * The watch knows the page only by the two calls it was given, which is what keeps it free of the
	 * editor shell and of every extension that shell loads.
	 */
	class SaveFailureWatch {
		#sessionId = 0;
		#documentSessionHash = '';
		#onFailure = () => {};
		#onRecovered = () => {};
		#unsubscribe = null;
		constructor(options) {
			this.#sessionId = options.sessionId;
			this.#documentSessionHash = options.documentSessionHash;
			if (main_core.Type.isFunction(options.onFailure)) {
				this.#onFailure = options.onFailure;
			}
			if (main_core.Type.isFunction(options.onRecovered)) {
				this.#onRecovered = options.onRecovered;
			}
			this.#unsubscribe = options.adapter.subscribeToFailure(this.#handleFailure.bind(this));
		}
		destroy() {
			if (this.#unsubscribe === null) {
				return;
			}
			this.#unsubscribe();
			this.#unsubscribe = null;
		}
		#handleFailure(event) {
			if (event.kind === 'recovered') {
				this.#onRecovered();
				return;
			}

			// a page which will never save again must not tell the portal that the work on the document
			// goes on; a page which still may save must go on telling it, or the session is interrupted
			if (event.isFinal) {
				this.#onFailure();
			}

			// the log of the portal keeps every failure, removable or not
			this.#report(event);
		}
		#report(failure) {
			main_core.ajax.runAction(REPORT_ACTION, {
				mode: 'ajax',
				json: {
					sessionId: this.#sessionId,
					documentSessionHash: this.#documentSessionHash,
					reason: failure.reason,
					editorCode: failure.editorCode,
					editorMessage: failure.editorMessage
				}
			}).catch(() => {
				// the failure itself is already told by the header; a report nobody took changes nothing here
			});
		}
	}

	const SECONDS_TO_MARK_AS_STILL_WORKING = 60;

	/** The component serving the presence requests of this shell. */
	const COMPONENT_NAME = 'bitrix:disk.file.editor-onlyoffice';

	/** The container of the boost button is rendered by the header itself, so its id belongs to the page. */
	const BOOST_BUTTON_CONTAINER_ID = 'oo-editor-boost-button-container';
	const cache = new main_core_cache.LocalStorageCache();
	class OnlyOffice {
		editor = null;
		editorJson = null;
		editorNode = null;
		editorWrapperNode = null;
		targetNode = null;
		documentSession = null;
		linkToEdit = null;
		linkToView = null;
		linkToDownload = null;
		downloadSizeValue = null;
		pullConfig = null;
		pullUserConfig = null;
		documentWasChanged = false;
		dontEndCurrentDocumentSession = false;
		context = null;
		brokenDocumentOpened = false;
		realtimeForceReloadTag = null;
		realtimeForceReloadCommand = null;
		autoForceReloadAfter = null;
		texts = null;
		userPullClient = null;
		saveAdapter = null;
		documentHeader = null;
		presenceConfig = null;
		presenceChannel = null;
		/** The interval of the signal of activity, kept so that a failure of saving can stop it. */
		trackWorkTimer = null;
		saveFailureWatch = null;
		#beforeStartEditHandler = null;
		constructor(editorOptions) {
			const options = main_core.Type.isPlainObject(editorOptions) ? editorOptions : {};
			this.pullConfig = options.pullConfig;
			this.pullUserConfig = options.pullUserConfig;
			this.documentSession = options.documentSession;
			this.linkToEdit = options.linkToEdit;
			this.linkToView = options.linkToView;
			this.linkToDownload = options.linkToDownload;
			this.downloadSizeValue = options.downloadSizeValue;
			this.targetNode = options.targetNode;
			this.editorNode = options.editorNode;
			this.editorWrapperNode = options.editorWrapperNode;
			this.context = {
				currentUser: options.currentUser,
				documentSession: this.documentSession,
				object: options.object,
				attachedObject: options.attachedObject
			};
			this.realtimeForceReloadTag = options.realtimeForceReloadTag;
			this.realtimeForceReloadCommand = options.realtimeForceReloadCommand;
			this.autoForceReloadAfter = options.autoForceReloadAfter || 300_000; // default is 5 minutes in ms
			this.texts = options.texts || {};
			this.presenceConfig = options.presenceConfig || null;
			this.saveAdapter = new SaveAdapter({
				showHint: (message, isFinal) => this.showSaveHint(message, isFinal)
			});
			this.mountDocumentHeader(options);
			this.initializeEditor(options.editorJson);
			const currentSlider = BX.SidePanel.Instance.getSliderByWindow(window);
			if (currentSlider) {
				currentSlider.getData().set('documentSession', this.documentSession);
			}
			this.loadDiskExtensionInTopWindow();
			this.initPull();
			this.bindEvents();
			this.watchSaveFailures();
			if (this.isEditMode()) {
				this.registerTimerToTrackWork();
			}
		}

		/**
		 * The header of the opened document. It draws itself from the composition the server describes and
		 * asks the editor about saving through the adapter; the page has nothing to do after the mount.
		 * Until the shell of the page renders the container, the page simply works without a header.
		 */
		mountDocumentHeader(options) {
			if (!main_core.Type.isElementNode(options.headerContainerNode)) {
				return;
			}
			this.documentHeader = new disk_documentHeader.DocumentHeader(options.headerContainerNode, {
				documentSessionHash: this.documentSession.hash,
				adapter: this.getSaveAdapter(),
				boostContainerId: BOOST_BUTTON_CONTAINER_ID,
				logoUrl: main_core.Type.isString(options.logoUrl) ? options.logoUrl : '',
				editUrl: main_core.Type.isString(this.linkToEdit) ? this.linkToEdit : '',
				sessionBoost: mapSessionBoost(options.sessionBoostOptions),
				shouldShowPromoImmediately: options.promoShowImmediately === true,
				composition: options.headerComposition ?? null
			});
			this.#beforeStartEditHandler = this.handleBeforeStartEdit.bind(this);
			main_core_events.EventEmitter.subscribe(disk_documentHeader.BeforeStartEditEvent, this.#beforeStartEditHandler);
		}
		registerTimerToTrackWork() {
			if (this.trackWorkTimer) {
				return;
			}
			this.trackWorkTimer = setInterval(() => this.#trackWork(), SECONDS_TO_MARK_AS_STILL_WORKING * 1000);
		}
		stopTimerToTrackWork() {
			if (!this.trackWorkTimer) {
				return;
			}
			clearInterval(this.trackWorkTimer);
			this.trackWorkTimer = null;
		}
		#trackWork() {
			main_core.ajax.runComponentAction('bitrix:disk.file.editor-onlyoffice', 'markAsStillWorkingSession', {
				mode: 'ajax',
				json: {
					documentSessionId: this.context.documentSession.id,
					documentSessionHash: this.context.documentSession.hash
				}
			}).then(responce => {});
		}
		initPull() {
			if (this.pullConfig) {
				BX.PULL = new pull_client.PullClient({
					skipStorageInit: true
				});
				BX.PULL.start(this.pullConfig);
			}
			if (this.pullUserConfig) {
				this.userPullClient = new pull_client.PullClient();
				this.userPullClient.start(this.pullUserConfig);
			}
		}
		bindEvents() {
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onClose', this.handleSliderClose.bind(this));
			main_core_events.EventEmitter.subscribe(window, 'beforeunload', this.handleClose.bind(this));
			if (window.top !== window) {
				main_core_events.EventEmitter.subscribe(window, 'message', event => {
					if (event.data === 'closeIframe') {
						this.handleClose();
					}
				});
			}
			pull_client.PULL.subscribe(new ServerCommandHandler({
				onlyOffice: this,
				context: this.context
			}));
			if (this.userPullClient && this.realtimeForceReloadTag) {
				this.userPullClient.extendWatch(this.realtimeForceReloadTag);
				this.userPullClient.subscribe({
					type: BX.PullClient.SubscriptionType.Server,
					moduleId: 'disk',
					command: this.realtimeForceReloadCommand,
					callback: data => {
						const message = {
							regular: this.texts.forceReloadRegularServer,
							booster: this.texts.forceReloadBoosterServer
						}[data.newServersType] || this.texts.forceReloadUndefinedServer;
						const mb = new ui_dialogs_messagebox.MessageBox({
							message,
							modal: true,
							onOk: () => location.reload(),
							okCaption: this.texts.forceReloadPopupOkButton,
							buttons: ui_dialogs_messagebox.MessageBoxButtons.OK
						});
						mb.show();
						setTimeout(() => {
							location.reload();
						}, this.autoForceReloadAfter);
					}
				});
			}
		}
		initializeEditor(options) {
			if (!options) {
				return;
			}
			options.events = {
				...options.events,
				onDocumentStateChange: this.handleDocumentStateChange.bind(this),
				onDocumentReady: this.handleDocumentReady.bind(this),
				onMetaChange: this.handleMetaChange.bind(this),
				onInfo: this.handleInfo.bind(this),
				onWarning: this.handleWarning.bind(this),
				onError: this.handleError.bind(this),
				onRequestClose: this.handleRequestClose.bind(this)
			};
			if (options.document?.permissions?.rename) {
				options.events.onRequestRename = this.handleRequestRename.bind(this);
			}
			this.editorJson = options;
			this.editor = new DocsAPI.DocEditor(this.editorNode.id, options);
		}
		loadDiskExtensionInTopWindow() {
			if (window.top !== window && !BX.getClass('window.top.BX.Disk.endEditSession')) {
				top.BX.loadExt('disk');
			}
		}
		emitEventOnSaved() {
			const sliderByWindow = BX.SidePanel.Instance.getSliderByWindow(window);
			if (sliderByWindow) {
				BX.SidePanel.Instance.postMessageAll(window, 'Disk.OnlyOffice:onSaved', {
					documentSession: this.documentSession,
					object: this.context.object
				});
			}
			main_core_events.EventEmitter.emit('Disk.OnlyOffice:onSaved', {
				documentSession: this.documentSession,
				object: this.context.object
			});
		}
		emitEventOnClosed() {
			const sliderByWindow = BX.SidePanel.Instance.getSliderByWindow(window);
			let process = 'edit';
			if (sliderByWindow) {
				process = sliderByWindow.getData().get('process') || 'edit';
				BX.SidePanel.Instance.postMessageAll(window, 'Disk.OnlyOffice:onClosed', {
					documentSession: this.documentSession,
					object: this.context.object,
					process: process,
					documentWasChanged: this.documentWasChanged
				});
			}
			main_core_events.EventEmitter.emit('Disk.OnlyOffice:onClosed', {
				documentSession: this.documentSession,
				object: this.context.object,
				process: process,
				documentWasChanged: this.documentWasChanged
			});
		}
		handleRequestClose() {
			const currentSlider = BX.SidePanel.Instance.getSliderByWindow(window);
			if (!currentSlider) {
				return;
			}
			currentSlider.getData().set('dontInvokeRequestClose', true);
			this.handleClose();
			currentSlider.close();
		}
		isDocumentReadyToEdit() {
			if (this.brokenDocumentOpened) {
				return false;
			}
			if (!this.caughtDocumentReady) {
				return false;
			}
			return true;
		}
		handleSliderClose(event) {
			const currentSlider = BX.SidePanel.Instance.getSliderByWindow(window);
			if (!currentSlider) {
				return;
			}
			const currentSliderData = currentSlider.getData();
			const uid = currentSliderData.get('uid');

			/** @type {BX.SidePanel.Event} */
			const [sliderEvent] = event.getData();
			if (sliderEvent.getSlider().getData().get('uid') !== uid) {
				return;
			}
			if (this.isViewMode() || !this.isDocumentReadyToEdit()) {
				this.handleClose();
				return;
			}
			if (this.editor.hasOwnProperty('requestClose')) {
				if (currentSliderData.get('dontInvokeRequestClose')) {
					return;
				}
				this.editor.requestClose();
				sliderEvent.denyAction();
			} else {
				this.handleClose();
			}
		}
		handleClose() {
			this.presenceChannel?.stop();
			this.presenceChannel = null;
			this.documentHeader?.unmount();
			this.documentHeader = null;
			if (this.#beforeStartEditHandler) {
				main_core_events.EventEmitter.unsubscribe(disk_documentHeader.BeforeStartEditEvent, this.#beforeStartEditHandler);
				this.#beforeStartEditHandler = null;
			}
			this.emitEventOnClosed();
			if (this.dontEndCurrentDocumentSession) {
				return;
			}
			top.BX.Disk.endEditSession({
				id: this.documentSession.id,
				hash: this.documentSession.hash,
				documentWasChanged: this.documentWasChanged
			});
		}
		handleDocumentStateChange(event) {
			if (!this.caughtDocumentReady || !this.caughtInfoEvent) {
				return;
			}
			if (Date.now() - Math.max(this.caughtDocumentReady, this.caughtInfoEvent) < 500) {
				return;
			}
			this.documentWasChanged = true;
			this.saveAdapter.handleDocumentStateChange(event);
		}
		wasDocumentChanged() {
			return this.documentWasChanged;
		}
		isEditMode() {
			return this.editorJson.editorConfig.mode === 'edit';
		}
		isViewMode() {
			return !this.isEditMode();
		}
		reloadView() {
			if (this.isViewMode()) {
				document.location = this.linkToView;
			}
		}
		handleInfo() {
			this.caughtInfoEvent = Date.now();
		}

		/** The editor reports a refused save (-331) and its own breakdown (-25) as warnings, never as errors. */
		handleWarning(d) {
			console.log('onlyoffice warning:', d.data);
			this.saveAdapter.handleEditorWarning(d.data);
		}
		handleError(d) {
			console.log('onlyoffice error:', d.data);
			this.saveAdapter.handleEditorError(d.data);
			if (d.data.errorCode === -82) {
				this.brokenDocumentOpened = true;
				this.processBrokenDocument();
			} else if (d.data.errorCode === -84) {
				setTimeout(() => {
					new CustomErrorControl().showWhenTooLarge(this.context.object.name, this.getEditorWrapperNode(), this.getContainer(), this.linkToDownload, this.downloadSizeValue);
				}, 100);
			}
		}

		/**
		 * What to do about a failure of saving: the indicator of the header keeps the state of the document
		 * in one short line, and the longer instruction beside it is told by a notification. The one about
		 * a breakdown of the editor waits for the user - nothing else will change after it.
		 */
		showSaveHint(message, isFinal) {
			if (!main_core.Type.isStringFilled(message)) {
				return;
			}
			BX.UI.Notification.Center.notify({
				content: message,
				autoHide: !isFinal
			});
		}

		/** The signal of activity belongs to a page which still saves, so a failure of saving stops it. */
		watchSaveFailures() {
			this.saveFailureWatch = new SaveFailureWatch({
				adapter: this.saveAdapter,
				sessionId: this.context.documentSession.id,
				documentSessionHash: this.context.documentSession.hash,
				onFailure: () => this.stopTimerToTrackWork(),
				onRecovered: () => {
					if (this.isEditMode()) {
						this.registerTimerToTrackWork();
					}
				}
			});
		}
		processBrokenDocument() {
			if (!this.context.documentSession.id || !this.brokenDocumentOpened) {
				return;
			}
			const key = `oo_broken_doc_${this.context.documentSession.id}`;
			const lastTime = cache.get(key);
			if (lastTime && Date.now() - lastTime < 1000 * 60) {
				return;
			}
			main_core.ajax.runAction('disk.api.onlyoffice.recoverSessionWithBrokenFile', {
				mode: 'ajax',
				json: {
					force: true,
					sessionId: this.documentSession.id,
					documentSessionHash: this.documentSession.hash
				}
			}).then(response => {
				if (response.status === 'success') {
					document.location.href = response.data.link;
				}
			});
			cache.set(key, Date.now());
		}
		handleRequestRename(event) {
			const newName = event.data;
			main_core.ajax.runAction('disk.api.onlyoffice.renameDocument', {
				mode: 'ajax',
				json: {
					documentSessionId: this.context.documentSession.id,
					documentSessionHash: this.context.documentSession.hash,
					newName: newName
				}
			});
		}
		handleMetaChange(event) {}
		handleDocumentReady() {
			this.caughtDocumentReady = Date.now();
			this.startPresence();
		}

		/**
		 * The live roster of the header. It is opened after the document is ready, so the starting roster of
		 * the header is already answered by then and a live event never overtakes it. An opening the server
		 * gave no presence configuration to - a public external link among them - simply keeps no channel.
		 * The roster comes to the private channel of the user, which this page already listens to, so the
		 * header is given that client instead of opening a second connection to the same channel.
		 */
		startPresence() {
			if (this.presenceChannel !== null || this.presenceConfig?.enabled !== true) {
				return;
			}
			this.presenceChannel = new disk_documentHeader.PresenceChannel(COMPONENT_NAME, this.userPullClient);
			void this.presenceChannel.start(this.presenceConfig);
		}

		/**
		 * The header opens the editing of the same object, and the session of the current view continues
		 * there: leaving the page for the editor must not close it.
		 */
		handleBeforeStartEdit() {
			this.dontEndCurrentDocumentSession = true;
		}
		getEditor() {
			return this.editor;
		}
		getSaveAdapter() {
			return this.saveAdapter;
		}
		getEditorNode() {
			return this.editorNode;
		}
		getEditorWrapperNode() {
			return this.editorWrapperNode;
		}
		getContainer() {
			return this.targetNode;
		}
	}

	/**
	 * The scenario of the automatic show of the widget of the boosts, as the header expects it. The server
	 * assigns it only to an editing session which may still see the widget; anything else means no scenario.
	 */
	function mapSessionBoost(options) {
		const viewOption = options?.optionParamsToControlButtonWidgetDisplay;
		if (!main_core.Type.isPlainObject(viewOption)) {
			return null;
		}
		return {
			shouldShowWidgetInstantly: options.shouldShowButtonWidgetInstantly === true,
			widgetViewOption: {
				category: viewOption.category,
				name: viewOption.name
			}
		};
	}

	class Waiting {
		documentSession = null;
		object = null;
		unifiedLinkMode = false;
		constructor(waitingOptions) {
			const options = main_core.Type.isPlainObject(waitingOptions) ? waitingOptions : {};
			this.documentSession = options.documentSession;
			this.object = options.object;
			this.unifiedLinkMode = options.unifiedLinkMode;
			const loader = new BX.Loader({
				target: options.targetNode
			});
			loader.show();
			this.bindEvents();
			this.handleSavedDocument({});
		}
		bindEvents() {
			pull_client.PULL.subscribe({
				type: BX.PullClient.SubscriptionType.Server,
				moduleId: 'disk',
				command: 'onlyoffice',
				callback: this.handleSavedDocument.bind(this)
			});
		}
		handleSavedDocument(data) {
			console.log('handleSavedDocument', data);
			main_core.ajax.runAction('disk.api.onlyoffice.continueWithNewSession', {
				mode: 'ajax',
				json: {
					sessionId: this.documentSession.id,
					documentSessionHash: this.documentSession.hash
				}
			}).then(response => {
				if (response.status === 'success') {
					if (this.unifiedLinkMode) {
						window.location.reload();
					} else {
						document.location.href = response.data.documentSession.link;
					}
				}
			});
		}
	}

	exports.CustomErrorControl = CustomErrorControl;
	exports.OnlyOffice = OnlyOffice;
	exports.Waiting = Waiting;

})(this.BX.Disk.Editor = this.BX.Disk.Editor || {}, BX, BX.Event, BX, BX.Disk, BX.UI, window, BX.Disk, BX.UI.Dialogs, BX.Cache);
//# sourceMappingURL=script.js.map
