/* eslint-disable */
this.BX = this.BX || {};
this.BX.Mail = this.BX.Mail || {};
(function (exports, main_core) {
	'use strict';

	class DraftNotFoundError extends Error {
		errors = [{
			code: 'DRAFT_NOT_FOUND'
		}];
	}

	class DraftConnector {
		#context;
		#runAction;
		constructor(context, runAction = main_core.ajax.runAction) {
			this.#context = Object.freeze({
				...context
			});
			this.#runAction = runAction;
		}
		async config() {
			const response = await this.#runAction('mail.api.draft.config', {
				method: 'GET'
			});
			return response.data;
		}
		async save(request) {
			const action = this.#context.contextType === 'crm' ? 'crm.api.mail.draft.save' : 'mail.api.draft.save';
			const response = await this.#runAction(action, {
				data: {
					...this.#getCrmContext(),
					draftId: request.draftId,
					revision: request.revision,
					snapshot: request.snapshot
				}
			});
			return response.data.draft;
		}
		async get(draftId) {
			if (this.#context.contextType === 'crm') {
				const draft = await this.getByContext();
				if (draft === null) {
					throw new DraftNotFoundError('CRM draft was not found.');
				}
				return draft;
			}
			const response = await this.#runAction('mail.api.draft.get', {
				data: {
					draftId
				}
			});
			return response.data.draft;
		}
		async getByContext() {
			const response = await this.#runAction('crm.api.mail.draft.getByContext', {
				data: this.#getCrmContext()
			});
			return response.data.draft;
		}
		async deleteCurrent() {
			const response = await this.#runAction('crm.api.mail.draft.deleteCurrent', {
				data: this.#getCrmContext()
			});
			return Boolean(response.data.deleted);
		}
		async delete(draftId) {
			const response = await this.#runAction('mail.api.draft.delete', {
				data: {
					draftId
				}
			});
			return Boolean(response.data.deleted);
		}
		#getCrmContext() {
			if (this.#context.contextType !== 'crm') {
				return {};
			}
			return {
				entityTypeId: Number(this.#context.crmEntityTypeId || 0),
				entityId: Number(this.#context.crmEntityId || 0)
			};
		}
	}

	class DraftCoordinator {
		#form;
		#connector;
		#debounceDelay;
		#draftId;
		#revision;
		#hasPendingChanges = false;
		#inFlight = null;
		#debounceTimer = null;
		#destroyed = false;
		#saveBlocked = false;
		#lastError = null;
		#savedDuringSession = false;
		#closeNotificationSent = false;
		#initialSnapshotFingerprint;
		#isNewCompose;
		#savedSnapshotFingerprint;
		#onFlushError;
		#onStateChange;
		#onCloseWithSavedDraft;
		#onDeleteDraft;
		constructor(options) {
			this.#form = options.form;
			this.#connector = options.connector;
			this.#debounceDelay = options.debounceDelay ?? 1000;
			this.#draftId = options.draft?.id ?? null;
			this.#revision = options.draft?.revision ?? null;
			this.#initialSnapshotFingerprint = this.#getSnapshotFingerprint(this.#form.getComposeSnapshot());
			this.#isNewCompose = options.draft == null;
			this.#savedSnapshotFingerprint = this.#initialSnapshotFingerprint;
			this.#onFlushError = options.onFlushError ?? (async () => 'cancel');
			this.#onStateChange = options.onStateChange ?? (() => {});
			this.#onCloseWithSavedDraft = options.onCloseWithSavedDraft ?? (() => {});
			this.#onDeleteDraft = options.onDeleteDraft ?? (async () => false);
			this.#subscribe('MailForm:compose:changed', this.#handleChange);
			this.#subscribe('MailForm:beforeClose', this.#handleBeforeClose);
			this.#subscribe('MailForm:beforeSubmit', this.#handleBeforeSubmit);
			this.#subscribe('MailForm:submit:ajaxSuccess', this.#handleSubmitSuccess);
			this.#subscribe('MailForm:destroy', this.#handleDestroy);
		}
		getState() {
			return {
				draftId: this.#draftId,
				revision: this.#revision
			};
		}
		async flush() {
			this.#cancelDebounce();
			this.#saveBlocked = false;
			this.#lastError = null;
			while (!this.#destroyed && (this.#hasPendingChanges || this.#inFlight !== null)) {
				if (this.#inFlight === null) {
					this.#startDrain();
				}
				if (this.#inFlight !== null) {
					await this.#inFlight;
				}
				if (this.#lastError) {
					throw this.#lastError;
				}
			}
		}
		destroy() {
			if (this.#destroyed) {
				return;
			}
			this.#destroyed = true;
			this.#cancelDebounce();
			this.#hasPendingChanges = false;
			this.#unsubscribe('MailForm:compose:changed', this.#handleChange);
			this.#unsubscribe('MailForm:beforeClose', this.#handleBeforeClose);
			this.#unsubscribe('MailForm:beforeSubmit', this.#handleBeforeSubmit);
			this.#unsubscribe('MailForm:submit:ajaxSuccess', this.#handleSubmitSuccess);
			this.#unsubscribe('MailForm:destroy', this.#handleDestroy);
		}
		#handleChange = () => {
			this.markChanged();
		};
		markChanged() {
			if (this.#destroyed) {
				return;
			}
			this.#hasPendingChanges = true;
			this.#saveBlocked = false;
			this.#lastError = null;
			this.#cancelDebounce();
			this.#debounceTimer = window.setTimeout(() => this.#startDrain(), this.#debounceDelay);
		}
		#handleBeforeClose = guard => {
			if (!guard || !main_core.Type.isFunction(guard.waitUntil)) {
				return;
			}
			guard.waitUntil(this.#flushForClose(guard));
		};
		#handleBeforeSubmit = guard => {
			if (guard && main_core.Type.isFunction(guard.waitUntil)) {
				guard.waitUntil(this.flush());
			}
		};
		#handleSubmitSuccess = (...args) => {
			const data = args.at(-1);
			if (!data?.ERROR && !data?.ERROR_HTML) {
				this.destroy();
			}
		};
		#handleDestroy = () => {
			this.#notifySavedOnClose();
			this.destroy();
		};
		async #flushForClose(guard) {
			try {
				if (this.#shouldDeletePristineDraft()) {
					await this.#deletePristineDraft();
					return;
				}
				await this.flush();
				this.#notifySavedOnClose();
			} catch (error) {
				this.#form.showError?.(main_core.Loc.getMessage('MAIL_DRAFT_SAVE_ERROR') ?? '');
				const decision = await this.#onFlushError(error instanceof Error ? error : new Error(String(error)));
				if (decision === 'retry') {
					await this.#flushForClose(guard);
					return;
				}
				if (decision !== 'close-with-risk') {
					guard.preventDefault();
				}
			}
		}
		#notifySavedOnClose() {
			if (this.#draftId === null || !this.#savedDuringSession || this.#closeNotificationSent) {
				return;
			}
			this.#closeNotificationSent = true;
			this.#onCloseWithSavedDraft();
		}
		#shouldDeletePristineDraft() {
			return this.#isNewCompose && this.#getSnapshotFingerprint(this.#form.getComposeSnapshot()) === this.#initialSnapshotFingerprint;
		}
		async #deletePristineDraft() {
			this.#cancelDebounce();
			this.#hasPendingChanges = false;
			if (this.#inFlight !== null) {
				await this.#inFlight;
			}
			if (this.#lastError) {
				throw this.#lastError;
			}
			if (this.#draftId !== null) {
				if (!(await this.#onDeleteDraft(this.#draftId))) {
					throw new Error('Failed to delete an empty draft.');
				}
				this.#draftId = null;
				this.#revision = null;
				this.#savedSnapshotFingerprint = this.#initialSnapshotFingerprint;
			}
		}
		#startDrain() {
			this.#cancelDebounce();
			if (this.#destroyed || this.#saveBlocked || this.#inFlight !== null || !this.#hasPendingChanges) {
				return;
			}
			this.#inFlight = this.#drain().catch(error => {
				this.#saveBlocked = true;
				this.#lastError = error instanceof Error ? error : new Error(String(error));
			}).finally(() => {
				this.#inFlight = null;
				if (!this.#destroyed && !this.#saveBlocked && this.#hasPendingChanges) {
					this.#startDrain();
				}
			});
		}
		async #drain() {
			while (!this.#destroyed && this.#hasPendingChanges) {
				this.#hasPendingChanges = false;
				const snapshot = this.#form.getComposeSnapshot();
				if (this.#getSnapshotFingerprint(snapshot) === this.#savedSnapshotFingerprint) {
					continue;
				}
				try {
					let conflictRetryCount = 0;
					let draft;
					while (true) {
						try {
							draft = await this.#connector.save({
								draftId: this.#draftId,
								revision: this.#revision,
								snapshot
							});
							break;
						} catch (error) {
							if (!this.#isRevisionConflict(error) || this.#draftId === null || conflictRetryCount >= 1) {
								throw error;
							}
							conflictRetryCount++;
							if (!(await this.#resetIfDraftWasDeleted(this.#draftId))) {
								throw error;
							}
						}
					}
					if (!this.#destroyed) {
						this.#savedDuringSession = true;
						this.#draftId = draft.id;
						this.#revision = draft.revision;
						this.#form.syncDraftAttachmentSources?.(draft.snapshot.attachments, draft.attachments, snapshot.attachments);
						this.#savedSnapshotFingerprint = this.#getSnapshotFingerprint(draft.snapshot);
						this.#onStateChange(this.getState());
					}
				} catch (error) {
					this.#hasPendingChanges = true;
					throw error;
				}
			}
		}
		#getSnapshotFingerprint(snapshot) {
			return JSON.stringify(snapshot);
		}
		async #resetIfDraftWasDeleted(draftId) {
			try {
				await this.#connector.get(draftId);
				return false;
			} catch (error) {
				if (!this.#isDraftMissing(error)) {
					throw error;
				}
				this.#draftId = null;
				this.#revision = null;
				return true;
			}
		}
		#isRevisionConflict(error) {
			return this.#hasErrorCode(error, 'DRAFT_REVISION_CONFLICT');
		}
		#isDraftMissing(error) {
			return this.#hasErrorCode(error, 'DRAFT_NOT_FOUND');
		}
		#hasErrorCode(error, code) {
			return error?.errors?.some(item => item.code === code) === true;
		}
		#cancelDebounce() {
			if (this.#debounceTimer !== null) {
				window.clearTimeout(this.#debounceTimer);
				this.#debounceTimer = null;
			}
		}
		#subscribe(eventName, handler) {
			if (this.#form.subscribe) {
				this.#form.subscribe(eventName, handler);
			} else {
				BX.addCustomEvent(this.#form, eventName, handler);
			}
		}
		#unsubscribe(eventName, handler) {
			if (this.#form.unsubscribe) {
				this.#form.unsubscribe(eventName, handler);
			} else {
				BX.removeCustomEvent(this.#form, eventName, handler);
			}
		}
	}

	let mailDraftNotificationCenter = null;
	async function bootstrapMailDraft(options) {
		if (!main_core.Type.isFunction(options.form?.getComposeSnapshot)) {
			return null;
		}
		const connector = options.connector ?? new DraftConnector(options.context ?? {
			contextType: 'mail'
		});
		const lifecycleToken = options.form.getDraftLifecycleToken?.() ?? 0;
		options.form.setDraftLoading?.(true);
		try {
			options.form.setDraftRestoreFailed?.(false);
			if (!(await connector.config()).available || !isLifecycleActive(options.form, lifecycleToken)) {
				return null;
			}
			const draft = options.draft ?? (options.draftId ? await connector.get(options.draftId) : null);
			if (!isLifecycleActive(options.form, lifecycleToken)) {
				return null;
			}
			if (draft) {
				await options.form.applyComposeSnapshot?.(draft.snapshot, draft.attachments);
			}
			if (!isLifecycleActive(options.form, lifecycleToken)) {
				return null;
			}
			if (draft) {
				options.onDraftIdChange?.(draft.id, draft.revision);
			}
			await options.form.waitForDraftReady?.();
			if (!isLifecycleActive(options.form, lifecycleToken)) {
				return null;
			}
			if (window.top && window.top !== window) {
				await prepareMailDraftNotificationCenter();
			}
			return new DraftCoordinator({
				form: options.form,
				connector,
				draft,
				onFlushError: showFlushErrorDialog,
				onDeleteDraft: draftId => connector.delete(draftId),
				onCloseWithSavedDraft: notifyMailDraftClosed,
				onStateChange: ({
					draftId,
					revision
				}) => {
					if (draftId !== null && revision !== null) {
						options.onDraftIdChange?.(draftId, revision);
						notifyMailDraftSaved(draftId);
					}
				}
			});
		} catch (error) {
			handleMailDraftBootstrapError(options);
			throw error;
		} finally {
			options.form.setDraftLoading?.(false);
		}
	}
	function handleMailDraftBootstrapError(options) {
		if (options.draftId) {
			options.form.showError?.(main_core.Loc.getMessage('MAIL_DRAFT_RESTORE_ERROR') ?? '');
			options.form.setDraftRestoreFailed?.(true);
		}
	}
	function notifyMailDraftClosed() {
		const content = main_core.Loc.getMessage('MAIL_DRAFT_SAVED_NOTIFICATION') ?? '';
		const topWindow = window.top;
		const notificationCenter = mailDraftNotificationCenter ?? topWindow?.BX?.UI?.Notification?.Center;
		if (notificationCenter) {
			notificationCenter.notify({
				content
			});
			return;
		}
		void prepareMailDraftNotificationCenter().then(() => notifyMailDraftClosed());
	}
	async function prepareMailDraftNotificationCenter() {
		if (mailDraftNotificationCenter) {
			return;
		}
		const topWindow = window.top;
		mailDraftNotificationCenter = topWindow?.BX?.UI?.Notification?.Center ?? null;
		if (!mailDraftNotificationCenter) {
			const notificationExtension = topWindow?.BX?.Runtime ? await topWindow.BX.Runtime.loadExtension('ui.notification') : await main_core.Runtime.loadExtension('ui.notification');
			mailDraftNotificationCenter = topWindow?.BX?.UI?.Notification?.Center ?? notificationExtension.Center;
		}
	}
	function notifyMailDraftSaved(draftId) {
		const topWindow = window.top;
		const sidePanel = topWindow?.BX?.SidePanel ?? BX.SidePanel;
		sidePanel?.Instance?.postMessage?.(window, 'Mail.Client.DraftSaved', {
			draftId
		});
	}
	async function bootstrapCrmDraft(options) {
		const connector = options.connector ?? new DraftConnector(options.context ?? {
			contextType: 'crm'
		});
		const lifecycleToken = options.form.getDraftLifecycleToken?.() ?? 0;
		options.form.setDraftLoading?.(true);
		try {
			if (!(await connector.config()).available || !isLifecycleActive(options.form, lifecycleToken)) {
				return null;
			}
			const draft = options.draft ?? (await connector.getByContext());
			if (!isLifecycleActive(options.form, lifecycleToken)) {
				return null;
			}
			let coordinatorDraft = draft;
			if (draft) {
				const decision = await showCrmRestoreDialog();
				if (!isLifecycleActive(options.form, lifecycleToken)) {
					return null;
				}
				const result = await resolveCrmRestoreDecision(decision, connector);
				if (result === 'cancel') {
					await options.onCancel?.();
					return null;
				}
				if (result === 'continue') {
					await options.form.applyComposeSnapshot?.(draft.snapshot, draft.attachments);
				} else if (result === 'start-new') {
					coordinatorDraft = null;
				}
			}
			if (!isLifecycleActive(options.form, lifecycleToken)) {
				return null;
			}
			if (coordinatorDraft) {
				options.onDraftIdChange?.(coordinatorDraft.id, coordinatorDraft.revision);
			}
			if (window.top && window.top !== window) {
				await prepareMailDraftNotificationCenter();
			}
			return new DraftCoordinator({
				form: options.form,
				connector,
				draft: coordinatorDraft ?? null,
				onFlushError: showFlushErrorDialog,
				onDeleteDraft: () => connector.deleteCurrent(),
				onCloseWithSavedDraft: notifyMailDraftClosed,
				onStateChange: ({
					draftId,
					revision
				}) => {
					if (draftId !== null && revision !== null) {
						options.onDraftIdChange?.(draftId, revision);
					}
				}
			});
		} finally {
			options.form.setDraftLoading?.(false);
		}
	}
	function resolveCrmDraftContext(options) {
		const entityTypeId = Number(options.entityTypeId || 0);
		const entityId = Number(options.entityId || 0);
		if (entityTypeId > 0 && entityId > 0) {
			return {
				entityTypeId,
				entityId
			};
		}
		return {
			entityTypeId: Number(options.ownerEntityTypeId || 0),
			entityId: Number(options.ownerEntityId || 0)
		};
	}
	function isLifecycleActive(form, token) {
		return form.isDraftLifecycleActive?.(token) ?? true;
	}
	async function resolveCrmRestoreDecision(decision, connector) {
		if (decision === 'start-new') {
			await connector.deleteCurrent();
		}
		return decision;
	}
	function isDraftRoute(path) {
		return /\/drafts\/?(?:\?|$)/.test(path);
	}
	async function showCrmRestoreDialog() {
		const {
			Dialog,
			Button
		} = await loadDialogExtensions();
		return new Promise(resolve => {
			const presentation = getCrmRestoreDialogPresentation();
			let settled = false;
			const choose = (decision, close = true) => {
				if (settled) {
					return;
				}
				settled = true;
				if (close) {
					dialog.hide();
				}
				resolve(decision);
			};
			const dialogOptions = {
				title: main_core.Loc.getMessage('MAIL_DRAFT_RESTORE_TITLE') ?? '',
				content: main_core.Tag.render`
				<div data-testid="mail-draft-restore-dialog" data-dialog-shell="${presentation.shell}">
					${main_core.Loc.getMessage('MAIL_DRAFT_RESTORE_TEXT')}
				</div>
			`,
				[presentation.buttonGroup]: [createDialogButton(Button, main_core.Loc.getMessage('MAIL_DRAFT_RESTORE_START_NEW') ?? '', () => choose('start-new'), presentation.buttons.startNew), createDialogButton(Button, main_core.Loc.getMessage('MAIL_DRAFT_RESTORE_CONTINUE') ?? '', () => choose('continue'), presentation.buttons.continue)],
				width: presentation.width,
				hasOverlay: presentation.hasOverlay
			};
			const dialog = new Dialog(dialogOptions);
			dialog.subscribe('onHide', () => choose('cancel', false));
			dialog.show();
		});
	}
	async function showFlushErrorDialog() {
		const {
			Dialog,
			Button
		} = await loadDialogExtensions();
		return new Promise(resolve => {
			const presentation = getCrmRestoreDialogPresentation();
			let settled = false;
			const choose = (decision, close = true) => {
				if (settled) {
					return;
				}
				settled = true;
				if (close) {
					dialog.hide();
				}
				resolve(decision);
			};
			const dialogOptions = {
				title: main_core.Loc.getMessage('MAIL_DRAFT_CLOSE_ERROR_TITLE') ?? '',
				content: main_core.Tag.render`
				<div data-testid="mail-draft-close-error-dialog" data-dialog-shell="${presentation.shell}">
					${main_core.Loc.getMessage('MAIL_DRAFT_CLOSE_ERROR_TEXT')}
				</div>
			`,
				[presentation.buttonGroup]: [createDialogButton(Button, main_core.Loc.getMessage('MAIL_DRAFT_CLOSE_WITH_RISK') ?? '', () => choose('close-with-risk'), presentation.buttons.startNew), createDialogButton(Button, main_core.Loc.getMessage('MAIL_DRAFT_CLOSE_RETRY') ?? '', () => choose('retry'), presentation.buttons.continue)],
				width: presentation.width,
				hasOverlay: presentation.hasOverlay
			};
			const dialog = new Dialog(dialogOptions);
			dialog.subscribe('onHide', () => choose('cancel', false));
			dialog.show();
		});
	}
	function getCrmRestoreDialogPresentation() {
		return Object.freeze({
			shell: 'ui.system.dialog',
			width: 440,
			buttonGroup: 'centerButtons',
			hasOverlay: true,
			buttons: {
				continue: {
					size: 'ui-btn-md',
					style: '--style-filled',
					useAirDesign: true
				},
				startNew: {
					size: 'ui-btn-md',
					style: '--style-outline',
					useAirDesign: true
				}
			}
		});
	}
	function createDialogButton(ButtonClass, text, callback, presentation) {
		return new ButtonClass({
			text,
			size: presentation.size,
			style: presentation.style,
			useAirDesign: presentation.useAirDesign,
			collapsedIcon: '',
			onclick: () => {
				callback();
				return {};
			}
		});
	}
	async function loadDialogExtensions() {
		return await main_core.Runtime.loadExtension('ui.system.dialog', 'ui.buttons');
	}

	exports.DraftConnector = DraftConnector;
	exports.DraftCoordinator = DraftCoordinator;
	exports.bootstrapCrmDraft = bootstrapCrmDraft;
	exports.bootstrapMailDraft = bootstrapMailDraft;
	exports.getCrmRestoreDialogPresentation = getCrmRestoreDialogPresentation;
	exports.isDraftRoute = isDraftRoute;
	exports.resolveCrmDraftContext = resolveCrmDraftContext;
	exports.resolveCrmRestoreDecision = resolveCrmRestoreDecision;

})(this.BX.Mail.Draft = this.BX.Mail.Draft || {}, BX);
//# sourceMappingURL=draft.bundle.js.map
