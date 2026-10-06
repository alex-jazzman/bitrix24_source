/* eslint-disable */
this.BX = this.BX || {};
this.BX.Mail = this.BX.Mail || {};
this.BX.Mail.Client = this.BX.Mail.Client || {};
(function (exports, main_core, main_core_events, main_loader, main_sidepanel, ui_vue3, mail_migrationState, ui_iconSet_api_vue, ui_iconSet_outline, ui_vue3_components_button, ui_dialogs_messagebox, ui_infoHelper, ui_buttons, ui_vue3_components_popup, main_popup, ui_system_label, ui_system_label_vue, ui_system_menu_vue, ui_system_input_vue, ui_system_typography_vue, ui_system_alert, ui_system_alert_vue, ui_a11y, ui_entitySelector, ui_system_chip_vue, ui_bannerDispatcher, ui_analytics) {
	'use strict';

	const Scenario = Object.freeze({
		New: 'new',
		Reply: 'reply',
		ReplyAll: 'replyAll',
		Forward: 'forward'
	});
	const RecipientsPerFieldUnlimited = -1;
	const RecipientsTotalLimitDefault = 10;
	const AddressBookIcon = '/bitrix/images/mail/entity_provider_icons/addressbook.svg';
	const AddressBookHelpArticle = '24146582';
	const BodyNodePrefix = Object.freeze({
		Signature: 'mail-compose-signature',
		Quote: 'mail-compose-quote'
	});
	const SlotsControlTestId = 'mail-compose-slots-action';
	const SendControlTestId = 'mail-compose-send';
	const AttachmentAnchorTestId = 'mail-compose-attachment-list';
	const NoticesTestId = 'mail-compose-form-notices';
	const Phrase = Object.freeze({
		TitleNew: 'MAIL_COMPOSE_FORM_TITLE_NEW',
		TitleReply: 'MAIL_COMPOSE_FORM_TITLE_REPLY',
		TitleForward: 'MAIL_COMPOSE_FORM_TITLE_FORWARD',
		SenderMenuTitle: 'MAIL_COMPOSE_FORM_SENDER_MENU_TITLE',
		SenderLabel: 'MAIL_COMPOSE_FORM_SENDER_LABEL',
		FieldTo: 'MAIL_COMPOSE_FORM_FIELD_TO',
		FieldCc: 'MAIL_COMPOSE_FORM_FIELD_CC',
		FieldBcc: 'MAIL_COMPOSE_FORM_FIELD_BCC',
		FieldAdd: 'MAIL_COMPOSE_FORM_FIELD_ADD',
		AddressBookAdd: 'MAIL_COMPOSE_FORM_ADDRESS_BOOK_ADD',
		AddressBookAddFromSearch: 'MAIL_COMPOSE_FORM_ADDRESS_BOOK_ADD_FROM_SEARCH',
		AddressBookEmptyTitle: 'MAIL_COMPOSE_FORM_ADDRESS_BOOK_EMPTY_TITLE',
		AddressBookEmptyText: 'MAIL_COMPOSE_FORM_ADDRESS_BOOK_EMPTY_TEXT',
		AddressBookEmptyHelp: 'MAIL_COMPOSE_FORM_ADDRESS_BOOK_EMPTY_HELP',
		AddressBookEmptyHelpLabel: 'MAIL_COMPOSE_FORM_ADDRESS_BOOK_EMPTY_HELP_LABEL',
		SubjectLabel: 'MAIL_COMPOSE_FORM_SUBJECT_LABEL',
		SubjectPlaceholder: 'MAIL_COMPOSE_FORM_SUBJECT_PLACEHOLDER',
		BodyPlaceholder: 'MAIL_COMPOSE_FORM_BODY_PLACEHOLDER',
		SignatureButton: 'MAIL_COMPOSE_FORM_SIGNATURE_BUTTON',
		SignatureMenuTitle: 'MAIL_COMPOSE_FORM_SIGNATURE_MENU_TITLE',
		SignatureShared: 'MAIL_COMPOSE_FORM_SIGNATURE_SHARED',
		SignaturePersonal: 'MAIL_COMPOSE_FORM_SIGNATURE_PERSONAL',
		SignatureNone: 'MAIL_COMPOSE_FORM_SIGNATURE_NONE',
		SignatureConfigure: 'MAIL_COMPOSE_FORM_SIGNATURE_CONFIGURE',
		QuoteShow: 'MAIL_COMPOSE_FORM_QUOTE_SHOW',
		AttachmentsShow: 'MAIL_COMPOSE_FORM_ATTACHMENTS_SHOW',
		AttachmentRemoveFile: 'MAIL_COMPOSE_FORM_ATTACHMENT_REMOVE_FILE',
		AttachmentMentionPatterns: 'MAIL_COMPOSE_FORM_ATTACHMENT_MENTION_PATTERNS',
		AttachmentMentionVerbs: 'MAIL_COMPOSE_FORM_ATTACHMENT_MENTION_VERBS',
		AttachmentMentionObjects: 'MAIL_COMPOSE_FORM_ATTACHMENT_MENTION_OBJECTS',
		AttachmentReminderTitle: 'MAIL_COMPOSE_FORM_ATTACHMENT_REMINDER_TITLE',
		AttachmentReminderText: 'MAIL_COMPOSE_FORM_ATTACHMENT_REMINDER_TEXT',
		AttachmentReminderAttach: 'MAIL_COMPOSE_FORM_ATTACHMENT_REMINDER_ATTACH',
		AttachmentReminderSend: 'MAIL_COMPOSE_FORM_ATTACHMENT_REMINDER_SEND',
		CopilotButton: 'MAIL_COMPOSE_FORM_COPILOT_BUTTON',
		AttachButton: 'MAIL_COMPOSE_FORM_ATTACH_BUTTON',
		SlotsButton: 'MAIL_COMPOSE_FORM_SLOTS_BUTTON',
		SendButton: 'MAIL_COMPOSE_FORM_SEND_BUTTON',
		CancelButton: 'MAIL_COMPOSE_FORM_CANCEL_BUTTON',
		CreateDocumentButton: 'MAIL_COMPOSE_FORM_CREATE_DOCUMENT_BUTTON',
		ScheduleButton: 'MAIL_COMPOSE_FORM_SCHEDULE_BUTTON',
		SchedulePresetToday: 'MAIL_COMPOSE_FORM_SCHEDULE_PRESET_TODAY',
		SchedulePresetTomorrow: 'MAIL_COMPOSE_FORM_SCHEDULE_PRESET_TOMORROW',
		SchedulePresetWeekEnd: 'MAIL_COMPOSE_FORM_SCHEDULE_PRESET_WEEK_END',
		SchedulePresetNextWeek: 'MAIL_COMPOSE_FORM_SCHEDULE_PRESET_NEXT_WEEK',
		SchedulePresetMonthEnd: 'MAIL_COMPOSE_FORM_SCHEDULE_PRESET_MONTH_END',
		TemplatesButton: 'MAIL_COMPOSE_FORM_TEMPLATES_BUTTON',
		TemplatesNewLabel: 'MAIL_COMPOSE_FORM_TEMPLATES_NEW_LABEL',
		TemplatesMenuTitle: 'MAIL_COMPOSE_FORM_TEMPLATES_MENU_TITLE',
		TemplatesRemember: 'MAIL_COMPOSE_FORM_TEMPLATES_REMEMBER',
		TemplatesAllButton: 'MAIL_COMPOSE_FORM_TEMPLATES_ALL_BUTTON',
		TemplatesConfigureButton: 'MAIL_COMPOSE_FORM_TEMPLATES_CONFIGURE_BUTTON',
		TemplatesSearch: 'MAIL_COMPOSE_FORM_TEMPLATES_SEARCH',
		TemplatesLoading: 'MAIL_COMPOSE_FORM_TEMPLATES_LOADING',
		TemplatesEmpty: 'MAIL_COMPOSE_FORM_TEMPLATES_EMPTY',
		TemplatesLoadError: 'MAIL_COMPOSE_FORM_TEMPLATES_LOAD_ERROR',
		TemplatesRetry: 'MAIL_COMPOSE_FORM_TEMPLATES_RETRY',
		TemplatesLoadMore: 'MAIL_COMPOSE_FORM_TEMPLATES_LOAD_MORE',
		TemplatesFoundCount: 'MAIL_COMPOSE_FORM_TEMPLATES_FOUND_COUNT',
		TemplateUnavailable: 'MAIL_COMPOSE_FORM_TEMPLATE_UNAVAILABLE',
		TemplateUnavailableCrmContext: 'MAIL_COMPOSE_FORM_TEMPLATE_UNAVAILABLE_CRM_CONTEXT',
		TemplateApplyTitle: 'MAIL_COMPOSE_FORM_TEMPLATE_APPLY_TITLE',
		TemplateApplyCancel: 'MAIL_COMPOSE_FORM_TEMPLATE_APPLY_CANCEL',
		TemplateApplyInsert: 'MAIL_COMPOSE_FORM_TEMPLATE_APPLY_INSERT',
		TemplateApplyReplace: 'MAIL_COMPOSE_FORM_TEMPLATE_APPLY_REPLACE',
		TemplateApplyError: 'MAIL_COMPOSE_FORM_TEMPLATE_APPLY_ERROR',
		SlotsText: 'MAIL_COMPOSE_FORM_SLOTS_TEXT',
		SlotsCalendarTitle: 'MAIL_COMPOSE_FORM_SLOTS_CALENDAR_TITLE',
		SlotsCalendarText: 'MAIL_COMPOSE_FORM_SLOTS_CALENDAR_TEXT',
		SlotsCalendarOpen: 'MAIL_COMPOSE_FORM_SLOTS_CALENDAR_OPEN',
		SlotsTourTitle: 'MAIL_COMPOSE_FORM_SLOTS_TOUR_TITLE',
		SlotsTourTextEnabled: 'MAIL_COMPOSE_FORM_SLOTS_TOUR_TEXT_ENABLED',
		SlotsTourTextDisabled: 'MAIL_COMPOSE_FORM_SLOTS_TOUR_TEXT_DISABLED',
		LargeAttachmentUploading: 'MAIL_COMPOSE_FORM_LARGE_ATTACHMENT_UPLOADING',
		LargeAttachmentLinkLost: 'MAIL_COMPOSE_FORM_LARGE_ATTACHMENT_LINK_LOST',
		SizeUnits: 'MAIL_COMPOSE_FORM_SIZE_UNITS',
		ErrorRecipientsLimit: 'MAIL_COMPOSE_FORM_ERROR_RECIPIENTS_LIMIT',
		ErrorRecipientsTotalLimit: 'MAIL_COMPOSE_FORM_ERROR_RECIPIENTS_TOTAL_LIMIT',
		ErrorRecipientsEmpty: 'MAIL_COMPOSE_FORM_ERROR_RECIPIENTS_EMPTY',
		ErrorAttachmentsUploading: 'MAIL_COMPOSE_FORM_ERROR_ATTACHMENTS_UPLOADING',
		ErrorAttachmentsSize: 'MAIL_COMPOSE_FORM_ERROR_ATTACHMENTS_SIZE',
		ErrorQuoteLost: 'MAIL_COMPOSE_FORM_ERROR_QUOTE_LOST',
		ErrorSendFailed: 'MAIL_COMPOSE_FORM_ERROR_SEND_FAILED',
		SendSuccess: 'MAIL_COMPOSE_FORM_SEND_SUCCESS'
	});

	const Controller$1 = 'mail.api.composeform';
	const transport$2 = main_core.ajax;
	function runAction$1(action, data = {}) {
		return transport$2.runAction(`${Controller$1}.${action}`, {
			data
		});
	}
	const Api = {
		getSignatures() {
			return runAction$1('getSignatures');
		},
		getCalendarSharingLink() {
			return runAction$1('getCalendarSharingLink');
		},
		sendMessage(form) {
			return new Promise((resolve, reject) => {
				transport$2.submitAjax(form, {
					method: 'POST',
					dataType: 'json',
					onsuccess: resolve,
					onfailure: reason => {
						reject(new Error(`Compose form send request failed: ${reason}.`));
					}
				});
			});
		}
	};

	function loc(phraseCode, replacements = {}) {
		return main_core.Loc.getMessage(phraseCode, replacements) ?? '';
	}

	function markMessageBox(box, testIds) {
		main_core.Dom.attr(box.getPopupWindow().getPopupContainer(), 'data-testid', testIds.dialog);
		if (testIds.ok) {
			main_core.Dom.attr(box.getOkButton().getContainer(), 'data-testid', testIds.ok);
		}
		if (testIds.cancel) {
			main_core.Dom.attr(box.getCancelButton().getContainer(), 'data-testid', testIds.cancel);
		}
	}

	const TestId$8 = Object.freeze({
		calendarDialog: 'mail-compose-slots-calendar',
		calendarOpen: 'mail-compose-slots-calendar-open'
	});
	const SharingFeatureId = 'calendar_sharing';
	const TourId = 'mail-start-calendar-sharing-tour';
	const TourArticle = '17198666';
	const TourWidth = 400;
	const TourDelay = 1500;
	const SafeLink = /^(?:\/(?!\/)|https?:\/\/)/i;
	const noop$3 = () => {};
	const VisibleFocus = {
		focusVisible: true
	};
	function loadTourGuide() {
		return main_core.Runtime.loadExtension('ui.tour').then(extension => extension.Guide);
	}
	const sharingLinkByForm = new WeakMap();
	function getSharingLink(state) {
		const asked = sharingLinkByForm.get(state);
		if (asked) {
			return asked;
		}
		const request = Api.getCalendarSharingLink().then(response => {
			if (response.data?.isSharingFeatureEnabled !== true) {
				sharingLinkByForm.delete(state);
			}
			return response;
		}, error => {
			sharingLinkByForm.delete(state);
			throw error;
		});
		sharingLinkByForm.set(state, request);
		return request;
	}
	function resolveSlotsPositions(nodes) {
		const anchor = nodes.signature ?? nodes.quote;
		return [{
			at: 'caret'
		}, anchor ? {
			at: 'before',
			anchor
		} : {
			at: 'end'
		}];
	}
	function insertCalendarSlots(params) {
		const {
			calendarSharing
		} = params.state;
		if (!calendarSharing.available) {
			return Promise.resolve(false);
		}
		if (!calendarSharing.featureEnabled) {
			showSharingPromo(params);
			return Promise.resolve(false);
		}
		return getSharingLink(params.state).then(response => {
			if (response.data?.isSharingFeatureEnabled !== true) {
				showOpenCalendarPopup(params);
				return false;
			}
			const link = toSafeLink(response.data.sharingUrl ?? '');
			return link === null ? false : insertSlotsLine(params.editor, link);
		}, () => false);
	}
	function showCalendarSlotsTour(params) {
		const {
			calendarSharing
		} = params.state;
		if (!calendarSharing.available || !calendarSharing.showTour) {
			return noop$3;
		}
		calendarSharing.showTour = false;
		let timer = null;
		const unsubscribeReady = params.editor.subscribeReady(() => {
			timer = setTimeout(() => {
				void startTour(params.state, params.getControlNode());
			}, TourDelay);
		});
		return () => {
			unsubscribeReady();
			if (timer !== null) {
				clearTimeout(timer);
			}
		};
	}
	function insertSlotsLine(editor, link) {
		const node = renderSlotsLine(link);
		const positions = resolveSlotsPositions({
			signature: editor.getBodyNode(editor.bodyNodes.signature),
			quote: editor.getBodyNode(editor.bodyNodes.quote)
		});
		const inserted = positions.some(position => editor.insertNode(node, position));
		if (inserted) {
			node.ownerDocument.body.dispatchEvent(new window.Event('input', {
				bubbles: true
			}));
		}
		return inserted;
	}
	function renderSlotsLine(link) {
		const address = main_core.Text.encode(link);
		return main_core.Tag.render`
		<span>${loc(Phrase.SlotsText, {
		'[sharing_link]': `<a href="${address}">`,
		'[/sharing_link]': '</a>',
		'#SHARING_LINK#': address
	})}</span>
	`;
	}
	function showSharingPromo(params) {
		ui_infoHelper.FeaturePromotersRegistry.getPromoter({
			featureId: SharingFeatureId,
			bindElement: params.getControlNode?.() ?? undefined
		}).show();
	}
	function showOpenCalendarPopup(params) {
		const path = toSafeLink(params.state.calendarSharing.userCalendarPath);
		const box = ui_dialogs_messagebox.MessageBox.create({
			title: loc(Phrase.SlotsCalendarTitle),
			message: loc(Phrase.SlotsCalendarText),
			buttons: path === null ? ui_dialogs_messagebox.MessageBoxButtons.OK : ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
			okCaption: path === null ? undefined : loc(Phrase.SlotsCalendarOpen),
			onOk: () => {
				openCalendar(path, params.getControlNode);
				return true;
			}
		});
		markMessageBox(box, {
			dialog: TestId$8.calendarDialog,
			ok: TestId$8.calendarOpen
		});
		box.show();
	}
	function openCalendar(path, getControlNode) {
		if (path === null) {
			return;
		}
		main_sidepanel.SidePanel.Instance.open(path, {
			events: {
				onCloseComplete: () => {
					const control = getControlNode?.() ?? null;
					if (control && document.body.contains(control)) {
						control.focus(VisibleFocus);
					}
				}
			}
		});
	}
	function startTour(state, control) {
		if (!control) {
			return Promise.resolve();
		}
		return Promise.all([getSharingLink(state), loadTourGuide()]).then(([response, Guide]) => {
			showTourGuide(Guide, control, response.data?.isSharingFeatureEnabled === true);
		}, () => {});
	}
	function showTourGuide(Guide, control, isSharingEnabled) {
		const guide = new Guide({
			id: TourId,
			autoSave: true,
			simpleMode: true,
			steps: [{
				target: control,
				position: 'top',
				title: loc(Phrase.SlotsTourTitle),
				text: loc(isSharingEnabled ? Phrase.SlotsTourTextEnabled : Phrase.SlotsTourTextDisabled),
				article: TourArticle
			}]
		});
		guide.getPopup().setWidth(TourWidth);
		guide.start();
	}
	function toSafeLink(url) {
		const address = url.trim();
		return SafeLink.test(address) ? address : null;
	}

	const EditorViewMode = Object.freeze({
		Visual: 'wysiwyg'
	});

	const EditorEvent = Object.freeze({
		ViewChanged: 'OnSetViewAfter',
		BodyClick: 'OnIframeClick'
	});
	const PostFormEvent = Object.freeze({
		Ready: 'OnEditorIsLoaded',
		Show: 'OnShowLHE',
		Shown: 'OnAfterShowLHE',
		Hidden: 'OnAfterHideLHE'
	});
	const UploaderEvent$1 = Object.freeze({
		FileAdd: 'BX.Disk.Uploader.Integration:Item:onAdd',
		FileRemove: 'BX.Disk.Uploader.Integration:Item:onRemove'
	});
	const ShowMode = 'justShow';
	const CopilotButtonSelector = '[data-id="copilot"]';
	const UploaderPanelSelector = '.disk-user-field-control';
	const BodyPlaceholderAttribute = 'placeholder';
	const BodyPlaceholderVisibleAttribute = 'data-mail-compose-placeholder-visible';
	const noop$2 = () => {};
	function buildBodyNodeIds() {
		const suffix = main_core.Text.getRandom();
		return {
			signature: `${BodyNodePrefix.Signature}-${suffix}`,
			quote: `${BodyNodePrefix.Quote}-${suffix}`
		};
	}
	function hasMeaningfulContent(node, ignoredNodes) {
		if (ignoredNodes.has(node)) {
			return false;
		}
		if (node.nodeType === Node.TEXT_NODE) {
			return (node.textContent ?? '').replaceAll('\u00A0', ' ').trim() !== '';
		}
		if (node.nodeType !== Node.ELEMENT_NODE) {
			return false;
		}
		if (['BR', 'WBR'].includes(node.nodeName)) {
			return false;
		}
		if (['IMG', 'VIDEO', 'AUDIO', 'IFRAME', 'TABLE', 'HR'].includes(node.nodeName)) {
			return true;
		}
		for (const child of node.childNodes) {
			if (hasMeaningfulContent(child, ignoredNodes)) {
				return true;
			}
		}
		return false;
	}
	const composeEditorKey = Symbol('mail-compose-form-editor');
	function useComposeEditor() {
		const editor = ui_vue3.inject(composeEditorKey);
		if (!editor) {
			throw new Error('Compose form editor adapter was not provided.');
		}
		return editor;
	}
	class EditorAdapter {
		editorId;
		bodyNodes;
		#uploaderControlId;
		#closeForm;
		#teardown = new Set();
		#systemNodeIds;
		#systemNodeRegistrations;
		#initialBody = null;
		#isInitialBodySet = false;
		#isDestroyed = false;
		constructor(params) {
			this.editorId = params.editorId;
			this.bodyNodes = buildBodyNodeIds();
			this.#systemNodeIds = new Set(Object.values(this.bodyNodes));
			this.#systemNodeRegistrations = new Map([...this.#systemNodeIds].map(nodeId => [nodeId, 1]));
			this.#uploaderControlId = params.uploaderControlId ?? '';
			this.#closeForm = params.closeForm ?? noop$2;
			this.subscribeReady(this.#handleReady);
		}
		getHostNode() {
			return this.#resolveHandler()?.getContainer() ?? null;
		}
		show() {
			const node = this.getHostNode();
			if (!node) {
				return false;
			}
			main_core_events.EventEmitter.emit(node, PostFormEvent.Show, [ShowMode]);
			return true;
		}
		focus() {
			const editor = this.#resolveEditor();
			if (!editor) {
				return false;
			}
			editor.Focus(false);
			return true;
		}
		getBody() {
			const content = this.#resolveEditor()?.GetContent();
			return main_core.Type.isString(content) ? content : '';
		}
		setBody(html) {
			const editor = this.#resolveEditor();
			if (!editor) {
				return false;
			}
			editor.SetContent(html, true);
			editor.synchro.FullSyncFromIframe();
			return true;
		}
		setInitialBody(html) {
			if (this.#isInitialBodySet) {
				return false;
			}
			this.#initialBody = html;
			return this.#isReady() && this.#applyInitialBody();
		}
		hasUserContent() {
			const body = this.#resolveEditor()?.GetIframeDoc()?.body;
			if (!body) {
				return false;
			}
			const systemNodes = this.#getSystemNodes(body);
			for (const node of body.childNodes) {
				if (hasMeaningfulContent(node, systemNodes)) {
					return true;
				}
			}
			return false;
		}
		replaceUserContent(html) {
			const editor = this.#resolveEditor();
			const body = editor?.GetIframeDoc()?.body;
			if (!editor || !body || editor.GetViewMode() !== EditorViewMode.Visual) {
				return false;
			}
			const systemNodes = [];
			for (const node of body.querySelectorAll(':scope > [id]')) {
				if (this.#systemNodeIds.has(node.id)) {
					systemNodes.push(node);
					main_core.Dom.remove(node);
				}
			}
			main_core.Dom.adjust(body, {
				html
			});
			for (const node of systemNodes) {
				main_core.Dom.append(node, body);
			}
			editor.synchro.FullSyncFromIframe();
			return true;
		}
		insertHtmlAtCaret(html) {
			const editor = this.#resolveEditor();
			const bodyDocument = editor?.GetIframeDoc();
			if (!editor || !bodyDocument || editor.GetViewMode() !== EditorViewMode.Visual) {
				return false;
			}
			const fragment = this.#createHtmlFragment(bodyDocument, html);
			const lastNode = fragment.lastChild;
			if (!lastNode) {
				return false;
			}
			editor.Focus();
			editor.selection.InsertNode(fragment);
			this.#placeCaretAfter(editor, lastNode);
			editor.synchro.FullSyncFromIframe();
			return true;
		}
		registerSystemNode(nodeId) {
			const registrations = this.#systemNodeRegistrations.get(nodeId) ?? 0;
			this.#systemNodeRegistrations.set(nodeId, registrations + 1);
			this.#systemNodeIds.add(nodeId);
			return () => {
				const remaining = (this.#systemNodeRegistrations.get(nodeId) ?? 1) - 1;
				if (remaining > 0) {
					this.#systemNodeRegistrations.set(nodeId, remaining);
					return;
				}
				this.#systemNodeRegistrations.delete(nodeId);
				this.#systemNodeIds.delete(nodeId);
			};
		}
		getBodyNode(nodeId) {
			return this.#resolveEditor()?.GetIframeDoc()?.getElementById(nodeId) ?? null;
		}
		insertNode(node, position) {
			const editor = this.#resolveEditor();
			if (!editor) {
				return false;
			}
			if (position.at === 'caret') {
				return this.#insertAtCaret(editor, node);
			}
			if (position.at === 'before') {
				if (!position.anchor.parentNode) {
					return false;
				}
				main_core.Dom.insertBefore(node, position.anchor);
			} else {
				const body = editor.GetIframeDoc()?.body;
				if (!body) {
					return false;
				}
				main_core.Dom.append(node, body);
			}
			this.#placeCaretAfter(editor, node);
			editor.synchro.FullSyncFromIframe();
			return true;
		}
		getFiles() {
			return this.#resolveUploaderControl()?.getFiles().map(file => {
				const id = Number(file.getCustomData('objectId'));
				return {
					fileId: file.getId(),
					id: Number.isInteger(id) && id > 0 ? id : null,
					name: file.getName(),
					size: file.getSize(),
					sizeFormatted: file.getSizeFormatted()
				};
			}) ?? [];
		}
		async replaceFiles(files) {
			const control = this.#resolveUploaderControl();
			if (!control) {
				return files.length === 0;
			}
			control.getFiles().forEach(file => {
				control.getUploader().removeFile(file.getId());
			});
			control.getUploader().addFiles(files.map(file => {
				const id = `n${file.id}`;
				return {
					id,
					serverFileId: id,
					name: file.name,
					size: file.size
				};
			}));
			await control.nextTick();
			return true;
		}
		removeFile(fileId) {
			const control = this.#resolveUploaderControl();
			if (!control) {
				return false;
			}
			control.getUploader().removeFile(fileId);
			return true;
		}
		showUploader() {
			const control = this.#resolveUploaderControl();
			if (!control) {
				return false;
			}
			control.showUploaderPanel();
			this.#scrollPanelIntoView(control);
			return true;
		}
		showCopilot() {
			const button = this.#resolveCopilotButton();
			if (!button) {
				return false;
			}
			button.click();
			return true;
		}
		showCreateDocument() {
			const control = this.#resolveUploaderControl();
			if (!control || !control.canCreateDocuments()) {
				return false;
			}
			control.showDocumentPanel();
			this.#scrollPanelIntoView(control);
			return true;
		}
		parseQuote(html) {
			const parsed = this.#resolveEditor()?.Parse(html, true, false);
			return main_core.Type.isString(parsed) ? parsed : null;
		}
		updateCopilotContext(parameters) {
			const bodyCopilot = this.#resolveEditor()?.iframeView?.copilot;
			const setContextParameters = bodyCopilot?.copilot?.setContextParameters;
			if (!bodyCopilot || !main_core.Type.isFunction(setContextParameters)) {
				return false;
			}
			setContextParameters.call(bodyCopilot.copilot, {
				...bodyCopilot.copilotParams?.contextParameters,
				...parameters
			});
			return true;
		}
		subscribeReady(handler) {
			if (this.#isReady()) {
				handler();
				return noop$2;
			}
			return this.#subscribeTo(this.#resolveHandler(), PostFormEvent.Ready, handler);
		}
		subscribeVisibilityChange(handler) {
			const node = this.getHostNode();
			const unsubscribeShown = this.#subscribeTo(node, PostFormEvent.Shown, () => {
				handler(true);
			});
			const unsubscribeHidden = this.#subscribeTo(node, PostFormEvent.Hidden, () => {
				handler(false);
			});
			return () => {
				unsubscribeShown();
				unsubscribeHidden();
			};
		}
		subscribeViewModeChange(handler) {
			return this.#subscribeEditor(EditorEvent.ViewChanged, () => {
				handler(this.#resolveEditor()?.GetViewMode() ?? '');
			});
		}
		subscribeBodyClick(handler) {
			return this.#subscribeEditor(EditorEvent.BodyClick, handler);
		}
		subscribeContentChange(handler) {
			let unsubscribeInput = noop$2;
			const unsubscribeReady = this.subscribeReady(() => {
				unsubscribeInput();
				const body = this.#resolveEditor()?.GetIframeDoc()?.body;
				if (body) {
					main_core.Event.bind(body, 'input', handler);
					unsubscribeInput = () => main_core.Event.unbind(body, 'input', handler);
				}
			});
			return () => {
				unsubscribeReady();
				unsubscribeInput();
			};
		}
		subscribeBodyPlaceholder(text) {
			let unsubscribeInput = noop$2;
			const unsubscribeReady = this.subscribeReady(() => {
				unsubscribeInput();
				unsubscribeInput = noop$2;
				const bodyDocument = this.#resolveEditor()?.GetIframeDoc();
				const body = bodyDocument?.body;
				if (!bodyDocument || !body) {
					return;
				}
				const style = bodyDocument.createElement('style');
				style.textContent = [
				`body[${BodyPlaceholderVisibleAttribute}] {`, '\tposition: relative;', '}', `body[${BodyPlaceholderVisibleAttribute}]::before {`, `\tcontent: attr(${BodyPlaceholderAttribute});`, '\tposition: absolute;', '\tinset: 0 auto auto 0;', '\tpointer-events: none;', '\tcolor: var(--ui-color-base-4, #a8adb4);', '\tfont: var(--ui-font-weight-normal, 400) var(--ui-font-size-md, 16px)/var(--ui-font-line-height-md, 22px) var(--ui-font-family-system, Arial, sans-serif);', '}'].join('\n');
				main_core.Dom.append(style, bodyDocument.head);
				body.setAttribute(BodyPlaceholderAttribute, text);
				body.setAttribute('aria-placeholder', text);
				let isCaretInBody = false;
				const update = () => {
					const systemNodes = this.#getSystemNodes(body);
					let isEmpty = true;
					for (const node of body.childNodes) {
						if (hasMeaningfulContent(node, systemNodes)) {
							isEmpty = false;
							break;
						}
					}
					body.toggleAttribute(BodyPlaceholderVisibleAttribute, isEmpty && !isCaretInBody);
				};
				const hide = () => {
					isCaretInBody = true;
					body.removeAttribute(BodyPlaceholderVisibleAttribute);
				};
				const release = () => {
					isCaretInBody = false;
					update();
				};
				const observer = new MutationObserver(update);
				observer.observe(body, {
					childList: true,
					characterData: true,
					subtree: true
				});
				main_core.Event.bind(body, 'input', update);
				main_core.Event.bind(body, 'mousedown', hide);
				main_core.Event.bind(body, 'keydown', hide);
				main_core.Event.bind(body, 'focus', hide);
				main_core.Event.bind(body, 'blur', release);
				update();
				unsubscribeInput = () => {
					observer.disconnect();
					main_core.Event.unbind(body, 'input', update);
					main_core.Event.unbind(body, 'mousedown', hide);
					main_core.Event.unbind(body, 'keydown', hide);
					main_core.Event.unbind(body, 'focus', hide);
					main_core.Event.unbind(body, 'blur', release);
					body.removeAttribute(BodyPlaceholderAttribute);
					body.removeAttribute('aria-placeholder');
					body.removeAttribute(BodyPlaceholderVisibleAttribute);
					main_core.Dom.remove(style);
				};
			});
			return () => {
				unsubscribeReady();
				unsubscribeInput();
			};
		}
		#scrollPanelIntoView(control) {
			void control.nextTick().then(() => {
				this.getHostNode()?.querySelector(UploaderPanelSelector)?.scrollIntoView({
					block: 'nearest'
				});
			});
		}
		subscribeFileAdd(handler) {
			return this.#subscribeGlobal(UploaderEvent$1.FileAdd, handler);
		}
		subscribeFileRemove(handler) {
			return this.#subscribeGlobal(UploaderEvent$1.FileRemove, handler);
		}
		destroy() {
			if (this.#isDestroyed) {
				return;
			}
			this.#isDestroyed = true;
			this.#teardown.forEach(unsubscribe => {
				unsubscribe();
			});
			this.#teardown.clear();
		}
		#handleReady = () => {
			if (this.#isDestroyed) {
				return;
			}
			this.#applyInitialBody();
			const bodyDocument = this.#resolveEditor()?.GetIframeDoc();
			if (!bodyDocument) {
				return;
			}
			main_core.Event.bind(bodyDocument, 'keydown', this.#handleBodyKeydown);
			this.#track(() => {
				main_core.Event.unbind(bodyDocument, 'keydown', this.#handleBodyKeydown);
			});
		};
		#handleBodyKeydown = event => {
			if (event.key !== 'Escape') {
				return;
			}
			if (this.#resolveTopSlider()?.canCloseByEsc() === true) {
				this.#closeForm();
			}
		};
		#isReady() {
			return this.#resolveHandler()?.isReady === true;
		}
		#applyInitialBody() {
			if (this.#initialBody === null || !this.setBody(this.#initialBody)) {
				return false;
			}
			this.#initialBody = null;
			this.#isInitialBodySet = true;
			return true;
		}
		#insertAtCaret(editor, node) {
			if (editor.GetViewMode() !== EditorViewMode.Visual) {
				return false;
			}
			editor.Focus();
			editor.selection.InsertNode(node);
			this.#placeCaretAfter(editor, node);
			editor.synchro.FullSyncFromIframe();
			return true;
		}
		#createHtmlFragment(bodyDocument, html) {
			const template = bodyDocument.createElement('template');
			main_core.Dom.adjust(template, {
				html
			});
			return template.content;
		}
		#getSystemNodes(body) {
			const nodes = new Set();
			const bodyDocument = body.ownerDocument;
			for (const nodeId of this.#systemNodeIds) {
				const node = bodyDocument.getElementById(nodeId);
				if (node && body.contains(node)) {
					nodes.add(node);
				}
			}
			return nodes;
		}
		#placeCaretAfter(editor, node) {
			if (editor.GetViewMode() !== EditorViewMode.Visual) {
				return;
			}
			editor.selection.SetAfter(node);
		}
		#subscribeEditor(eventName, handler) {
			let unsubscribeEditor = noop$2;
			const unsubscribeReady = this.subscribeReady(() => {
				unsubscribeEditor = this.#subscribeTo(this.#resolveEditor(), eventName, handler);
			});
			return () => {
				unsubscribeReady();
				unsubscribeEditor();
			};
		}
		#subscribeTo(target, eventName, handler) {
			if (!target || this.#isDestroyed) {
				return noop$2;
			}
			main_core_events.EventEmitter.subscribe(target, eventName, handler);
			return this.#track(() => {
				main_core_events.EventEmitter.unsubscribe(target, eventName, handler);
			});
		}
		#subscribeGlobal(eventName, handler) {
			if (this.#isDestroyed) {
				return noop$2;
			}
			main_core_events.EventEmitter.subscribe(eventName, handler);
			return this.#track(() => {
				main_core_events.EventEmitter.unsubscribe(eventName, handler);
			});
		}
		#track(unsubscribe) {
			this.#teardown.add(unsubscribe);
			return () => {
				this.#teardown.delete(unsubscribe);
				unsubscribe();
			};
		}
		#resolveEditor() {
			return window.BXHtmlEditor?.Get(this.editorId) || null;
		}
		#resolveHandler() {
			return window.LHEPostForm?.getHandler(this.editorId) ?? null;
		}
		#resolveUploaderControl() {
			if (this.#uploaderControlId === '') {
				return null;
			}
			const uploaderApi = BX.Disk?.Uploader?.UserFieldControl;
			return uploaderApi?.getById(this.#uploaderControlId) ?? null;
		}
		#resolveCopilotButton() {
			return this.getHostNode()?.querySelector(CopilotButtonSelector) ?? null;
		}
		#resolveTopSlider() {
			try {
				const topBx = window.top?.BX ?? null;
				return topBx?.SidePanel?.Instance?.getTopSlider?.() ?? null;
			} catch {
				return null;
			}
		}
	}

	const composeStateKey = Symbol('mail-compose-form-state');
	const ReplyScenarios = new Set([Scenario.Reply, Scenario.ReplyAll]);
	function useComposeState() {
		const state = ui_vue3.inject(composeStateKey);
		if (!state) {
			throw new Error('Compose form state was not provided.');
		}
		return state;
	}
	function getSelectedSender(state) {
		return state.senders.find(sender => sender.formated === state.selectedSender) ?? null;
	}
	function getSelectedSenderMailboxId(state) {
		const selectedMailboxId = Number(getSelectedSender(state)?.mailboxId ?? 0);
		if (selectedMailboxId > 0) {
			return selectedMailboxId;
		}
		return state.mailbox.id ?? state.send.mailboxId;
	}
	function isSelectedSenderMigrationActive(state) {
		const mailboxId = getSelectedSenderMailboxId(state);
		return mailboxId !== null && state.migrationActiveByMailboxId[mailboxId] === true;
	}
	function getRecipientCounts(state) {
		const {
			to,
			cc,
			bcc
		} = state.recipients;
		return {
			to: to.length,
			cc: cc.length,
			bcc: bcc.length
		};
	}
	function getRecipientsTotalCount(state) {
		const counts = getRecipientCounts(state);
		return counts.to + counts.cc + counts.bcc;
	}
	function isRecipientsTotalLimitExceeded(state) {
		return getRecipientsTotalCount(state) > state.limits.recipientsTotal;
	}
	function isLargeAttachmentEnabled(state) {
		return state.largeAttachment.localFeatureAvailable;
	}
	function getReplySendFields(state) {
		const {
			inReplyTo,
			mailboxId
		} = state.send;
		if (!ReplyScenarios.has(state.scenario) || inReplyTo === null || mailboxId === null) {
			return null;
		}
		return {
			inReplyTo,
			mailboxId
		};
	}
	function isEnabled(value) {
		return value === true;
	}
	function normalizeAddress(value) {
		return (value ?? '').trim().toLowerCase();
	}
	function toValueOrNull(value) {
		const trimmed = (value ?? '').trim();
		return trimmed === '' ? null : trimmed;
	}
	function toPositiveIdOrNull(value) {
		const id = Number(value ?? 0);
		return id > 0 ? id : null;
	}
	function findSender(senders, selectedSender, mailboxEmail) {
		if (selectedSender !== '') {
			const requested = senders.find(sender => sender.formated === selectedSender);
			if (requested) {
				return requested;
			}
		}
		return senders.find(sender => normalizeAddress(sender.email) === mailboxEmail) ?? senders[0];
	}
	function resolveSelectedSender(senders, selectedSender, mailboxEmail) {
		if (senders.length === 0) {
			return null;
		}
		const matched = findSender(senders, (selectedSender ?? '').trim(), mailboxEmail);
		return matched.formated === '' ? null : matched.formated;
	}
	function normalizeSignature(item) {
		const assignedAt = Number(item.assignedAt ?? 0);
		return {
			full: item.full ?? '',
			preview: item.preview ?? '',
			menuPreview: item.menuPreview,
			signatureId: toPositiveIdOrNull(item.signatureId) ?? 0,
			isShared: isEnabled(item.isShared),
			assignedAt: assignedAt > 0 ? assignedAt : null
		};
	}
	function buildSignatures(signatures) {
		const rawBySender = signatures?.bySender ?? {};
		const bySender = {};
		Object.keys(rawBySender).forEach(senderKey => {
			bySender[senderKey] = (rawBySender[senderKey] ?? []).map(item => normalizeSignature(item));
		});
		return {
			bySender,
			choices: {
				...signatures?.choices
			},
			settingsPath: signatures?.settingsPath ?? ''
		};
	}
	function buildRecipients(initialData) {
		return {
			to: initialData.recipients?.to ?? [],
			cc: initialData.recipients?.cc ?? [],
			bcc: initialData.recipients?.bcc ?? []
		};
	}
	function buildBody(initialData) {
		return {
			quote: initialData.body?.quote ?? '',
			quoteFolded: isEnabled(initialData.body?.quoteFolded)
		};
	}
	function buildAttachments(initialData) {
		return {
			files: initialData.attachments?.files ?? [],
			folded: isEnabled(initialData.attachments?.folded)
		};
	}
	function buildLimits(limits) {
		return {
			recipientsPerField: limits?.recipientsPerField ?? RecipientsPerFieldUnlimited,
			recipientsTotal: limits?.recipientsTotal ?? RecipientsTotalLimitDefault,
			maxAttachmentsSize: limits?.maxAttachmentsSize ?? 0,
			maxAttachmentsSizeAfterEncoding: limits?.maxAttachmentsSizeAfterEncoding ?? 0
		};
	}
	function buildCalendarSharing(calendarSharing) {
		return {
			available: isEnabled(calendarSharing?.available),
			featureEnabled: isEnabled(calendarSharing?.featureEnabled),
			crmFeatureEnabled: isEnabled(calendarSharing?.crmFeatureEnabled),
			showTour: isEnabled(calendarSharing?.showTour),
			userCalendarPath: calendarSharing?.userCalendarPath ?? ''
		};
	}
	function buildLargeAttachment(largeAttachment) {
		return {
			localFeatureAvailable: isEnabled(largeAttachment?.localFeatureAvailable),
			featureAvailable: isEnabled(largeAttachment?.featureAvailable),
			showAha: isEnabled(largeAttachment?.showAha),
			ahaOptionName: largeAttachment?.ahaOptionName ?? '',
			postSendPromptSuppressed: isEnabled(largeAttachment?.postSendPromptSuppressed),
			postSendPromptOptionName: largeAttachment?.postSendPromptOptionName ?? '',
			folderName: largeAttachment?.folderName ?? ''
		};
	}
	function buildSend(initialData) {
		return {
			actionUrl: initialData.send?.actionUrl ?? '',
			inReplyTo: toValueOrNull(initialData.send?.inReplyTo),
			mailboxId: toPositiveIdOrNull(initialData.send?.mailboxId)
		};
	}
	function buildAnalytics(initialData) {
		return {
			section: initialData.analytics?.section ?? '',
			element: initialData.analytics?.element ?? ''
		};
	}
	function buildPaths(initialData) {
		return {
			messageList: toValueOrNull(initialData.paths?.messageList),
			home: initialData.paths?.home ?? '',
			templatesManage: initialData.paths?.templatesManage ?? ''
		};
	}
	function createComposeState(initialData = {}) {
		const senders = initialData.senders ?? [];
		const mailboxEmail = normalizeAddress(initialData.mailbox?.email);
		const recipients = buildRecipients(initialData);
		return ui_vue3.reactive({
			scenario: initialData.scenario ?? Scenario.New,
			title: initialData.title ?? loc(Phrase.TitleNew),
			messageId: initialData.messageId ?? 0,
			parentMessageId: toPositiveIdOrNull(initialData.parentMessageId),
			mailbox: {
				id: toPositiveIdOrNull(initialData.mailbox?.id),
				email: mailboxEmail
			},
			senders,
			selectedSender: resolveSelectedSender(senders, initialData.selectedSender, mailboxEmail),
			recipients,
			bccExpanded: recipients.bcc.length > 0,
			subject: initialData.subject ?? '',
			signatures: buildSignatures(initialData.signatures),
			selectedSignatureId: null,
			body: buildBody(initialData),
			attachments: buildAttachments(initialData),
			limits: buildLimits(initialData.limits),
			calendarSharing: buildCalendarSharing(initialData.calendarSharing),
			copilot: initialData.copilot ?? {
				isCopilotEnabled: false
			},
			largeAttachment: buildLargeAttachment(initialData.largeAttachment),
			attachmentReminder: {
				enabled: isEnabled(initialData.attachmentReminder?.enabled)
			},
			send: buildSend(initialData),
			analytics: buildAnalytics(initialData),
			features: {
				unfinishedElements: isEnabled(initialData.features?.unfinishedElements),
				templates: isEnabled(initialData.features?.templates)
			},
			draft: {
				id: Math.max(0, Number(initialData.draft?.id ?? 0)),
				revision: Math.max(0, Number(initialData.draft?.revision ?? 0)),
				clientId: initialData.draft?.clientId ?? '',
				isLoading: false,
				restoreFailed: false
			},
			templates: {
				recent: [],
				isLoaded: false,
				isLoading: false,
				error: null,
				selected: null,
				prepared: null,
				rememberLast: false,
				autoApply: {
					candidate: null,
					status: 'idle'
				}
			},
			paths: buildPaths(initialData),
			migrationActiveByMailboxId: {},
			isSending: false,
			errors: []
		});
	}

	const TestId$7 = Object.freeze({
		popup: 'mail-compose-schedule-popup',
		calendar: 'mail-compose-schedule-calendar',
		presets: 'mail-compose-schedule-presets'
	});
	const CardPadding = 16;
	const PopupOffsetTop = 5;
	const Preset = Object.freeze([Phrase.SchedulePresetToday, Phrase.SchedulePresetTomorrow, Phrase.SchedulePresetWeekEnd, Phrase.SchedulePresetNextWeek, Phrase.SchedulePresetMonthEnd]);
	function loadDatePicker() {
		return main_core.Runtime.loadExtension('ui.date-picker').then(extension => extension.DatePicker);
	}
	const SchedulePopup = ui_vue3.defineComponent({
		name: 'MailComposeSchedulePopup',
		components: {
			Popup: ui_vue3_components_popup.Popup,
			UiButton: ui_vue3_components_button.Button
		},
		props: {
			bindElement: {
				type: Object,
				required: true
			},
			datePicker: {
				type: Function,
				required: true
			}
		},
		emits: ['close'],
		setup() {
			return {
				presetStyle: ui_vue3_components_button.AirButtonStyle.OUTLINE,
				presetSize: ui_vue3_components_button.ButtonSize.LARGE,
				testId: TestId$7
			};
		},
		data() {
			return {
				picker: null
			};
		},
		computed: {
			options() {
				return {
					bindElement: this.bindElement,
					targetContainer: document.body,
					offsetTop: PopupOffsetTop,
					padding: CardPadding,
					focusTrap: true,
					closeByEsc: true,
					ariaLabel: loc(Phrase.ScheduleButton)
				};
			},
			presets() {
				return Preset.map((phrase, index) => ({
					label: loc(phrase),
					testId: `mail-compose-schedule-preset-${index}`
				}));
			}
		},
		mounted() {
			this.createPicker();
		},
		beforeUnmount() {
			this.picker?.destroy();
			this.picker = null;
		},
		methods: {
			createPicker() {
				const Calendar = this.datePicker;
				const picker = ui_vue3.markRaw(new Calendar({
					targetNode: this.$refs.calendar,
					selectionMode: 'single',
					inline: true,
					enableTime: true
				}));
				this.picker = picker;
				picker.show();
			},
			handlePresetClick() {}
		},
		template: `
		<Popup :options="options" @close="$emit('close')">
			<div class="mail-compose-schedule" :data-testid="testId.popup">
				<div
					ref="calendar"
					class="mail-compose-schedule__calendar"
					:data-testid="testId.calendar"
				></div>
				<div class="mail-compose-schedule__presets" :data-testid="testId.presets">
					<UiButton
						v-for="preset of presets"
						:key="preset.testId"
						:text="preset.label"
						:style="presetStyle"
						:size="presetSize"
						wide
						:dataset="{ testid: preset.testId }"
						@click="handlePresetClick"
					/>
				</div>
			</div>
		</Popup>
	`
	});

	const TestId$6 = Object.freeze({
		control: 'mail-compose-send-split',
		send: SendControlTestId,
		schedule: 'mail-compose-schedule-action'
	});
	const ScheduleIconSize = 20;
	const ScheduleClassName = 'mail-compose-send-split__schedule';
	const SendSplitButton = ui_vue3.defineComponent({
		name: 'MailComposeSendSplitButton',
		components: {
			SchedulePopup
		},
		emits: ['send'],
		setup() {
			return {
				state: useComposeState(),
				testId: TestId$6
			};
		},
		data() {
			return {
				control: null,
				isScheduleShown: false,
				datePicker: null
			};
		},
		computed: {
			isSending() {
				return this.state.isSending;
			},
			isRecipientsLimitExceeded() {
				return isRecipientsTotalLimitExceeded(this.state);
			},
			isSendDisabled() {
				return this.isSending || isSelectedSenderMigrationActive(this.state) || this.isRecipientsLimitExceeded;
			},
			scheduleNode() {
				return this.control?.getMenuButton().getContainer() ?? null;
			}
		},
		watch: {
			isSending() {
				this.syncSending();
			},
			isSendDisabled() {
				this.syncSending();
			},
			isRecipientsLimitExceeded() {
				this.syncSending();
			}
		},
		mounted() {
			this.createControl();
			this.syncSending();
		},
		beforeUnmount() {
			this.destroyControl();
		},
		methods: {
			createControl() {
				const options = {
					useAirDesign: true,
					style: ui_buttons.AirButtonStyle.FILLED,
					size: ui_buttons.ButtonSize.MEDIUM,
					mainButton: {
						text: loc(Phrase.SendButton),
						dataset: {
							testid: TestId$6.send
						},
						props: {
							type: 'button'
						},
						onclick: () => {
							this.handleSend();
							return {};
						}
					},
					menuButton: {
						className: ScheduleClassName,
						dataset: {
							testid: TestId$6.schedule
						},
						props: {
							type: 'button',
							'aria-label': loc(Phrase.ScheduleButton),
							'aria-haspopup': 'dialog',
							'aria-expanded': 'false'
						},
						onclick: () => {
							this.handleSchedule();
							return {};
						}
					}
				};
				const control = ui_vue3.markRaw(new ui_buttons.SplitButton(options));
				this.control = control;
				control.renderTo(this.$refs.slot);
				this.renderScheduleIcon();
			},
			renderScheduleIcon() {
				const half = this.scheduleNode;
				if (half) {
					new ui_iconSet_api_vue.Icon({
						icon: ui_iconSet_api_vue.Outline.CALENDAR,
						size: ScheduleIconSize,
						color: 'var(--ui-btn-color)'
					}).renderTo(half);
				}
			},
			syncSending() {
				const control = this.control;
				if (!control) {
					return;
				}
				if (this.isSending) {
					control.setDisabled(false);
					control.setWaiting(true);
				} else {
					control.setWaiting(false);
					control.setDisabled(this.isSendDisabled);
				}
				main_core.Dom.attr(control.getMainButton().getContainer(), 'disabled', this.isSendDisabled ? true : null);
				main_core.Dom.attr(control.getMenuButton().getContainer(), 'disabled', this.isSendDisabled ? true : null);
				const title = isSelectedSenderMigrationActive(this.state) ? loc('MAIL_MIGRATION_SEND_UNAVAILABLE') : null;
				main_core.Dom.attr(control.getMainButton().getContainer(), 'title', title);
				main_core.Dom.attr(control.getMenuButton().getContainer(), 'title', title);
			},
			destroyControl() {
				main_core.Dom.remove(this.control?.getContainer());
				this.control = null;
			},
			handleSend() {
				if (this.isSendDisabled) {
					return;
				}
				this.$emit('send');
			},
			handleSchedule() {
				if (this.isSendDisabled) {
					return;
				}
				if (this.isScheduleShown) {
					this.handleScheduleClose();
					return;
				}
				void loadDatePicker().then(datePicker => {
					this.datePicker = datePicker;
					this.isScheduleShown = true;
					this.syncScheduleState();
				}, () => {});
			},
			handleScheduleClose() {
				this.isScheduleShown = false;
				this.syncScheduleState();
			},
			syncScheduleState() {
				this.control?.getMenuButton().setProps({
					'aria-expanded': this.isScheduleShown ? 'true' : 'false'
				});
			}
		},
		template: `
		<div ref="slot" class="mail-compose-send-split" :data-testid="testId.control"></div>
		<SchedulePopup
			v-if="isScheduleShown && scheduleNode && datePicker"
			:bindElement="scheduleNode"
			:datePicker="datePicker"
			@close="handleScheduleClose"
		/>
	`
	});

	const Controller = 'mail.MailTemplate';
	const transport$1 = main_core.ajax;
	class TemplateApiError extends Error {
		errors;
		constructor(errors = []) {
			super(errors[0]?.message ?? 'Mail template request failed.');
			this.name = 'TemplateApiError';
			this.errors = errors;
		}
	}
	function getErrors(reason) {
		if (!main_core.Type.isObjectLike(reason)) {
			return [];
		}
		const errors = reason.errors;
		return main_core.Type.isArray(errors) ? errors : [];
	}
	function normalizeError(reason) {
		return new TemplateApiError(getErrors(reason));
	}
	function requestConfig(payload, method) {
		return method === 'GET' ? {
			method,
			getParameters: payload
		} : {
			method,
			data: payload
		};
	}
	async function runAction(action, payload = {}, method = 'POST') {
		try {
			const response = await transport$1.runAction(`${Controller}.${action}`, requestConfig(payload, method));
			if (response.status === 'error' || response.data === undefined) {
				throw new TemplateApiError(response.errors);
			}
			return response.data;
		} catch (error) {
			throw normalizeError(error);
		}
	}
	const TemplateApi = {
		quickList() {
			return runAction('quickList', {}, 'GET');
		},
		search(request) {
			return runAction('search', {
				...request
			}, 'GET');
		},
		prepare(reference) {
			return runAction('prepare', {
				reference
			});
		},
		setRememberLast(enabled) {
			return runAction('setRememberLast', {
				enabled
			});
		},
		recordUsage(reference) {
			return runAction('recordUsage', {
				reference
			});
		}
	};

	const RecentLimit = 5;
	const rememberUpdates = new WeakMap();
	const pendingLoads = new WeakMap();
	async function loadRecentTemplates(state, force = false) {
		const pending = pendingLoads.get(state) ?? null;
		if (pending) {
			await pending;
			if (!force) {
				return;
			}
		}
		if (state.templates.isLoaded && !force) {
			return;
		}
		const request = requestRecentTemplates(state);
		pendingLoads.set(state, request);
		try {
			await request;
		} finally {
			if (pendingLoads.get(state) === request) {
				pendingLoads.delete(state);
			}
		}
	}
	async function requestRecentTemplates(state) {
		const {
			templates
		} = state;
		templates.isLoading = true;
		templates.error = null;
		try {
			const response = await TemplateApi.quickList();
			templates.recent = response.items.slice(0, RecentLimit);
			if (!rememberUpdates.has(state)) {
				templates.rememberLast = response.rememberLast;
			}
			templates.autoApply.candidate = response.autoApply;
			templates.isLoaded = true;
		} catch {
			templates.error = 'load';
			templates.isLoaded = false;
		} finally {
			templates.isLoading = false;
		}
	}
	async function updateRememberLast(state, enabled) {
		const {
			templates
		} = state;
		const update = rememberUpdates.get(state) ?? {
			desired: templates.rememberLast,
			confirmed: templates.rememberLast,
			promise: null
		};
		rememberUpdates.set(state, update);
		update.desired = enabled;
		templates.rememberLast = enabled;
		if (!update.promise) {
			update.promise = synchronizeRememberLast(state, update);
		}
		return update.promise;
	}
	async function synchronizeRememberLast(state, update) {
		const {
			templates
		} = state;
		const current = update;
		if (current.confirmed === current.desired) {
			current.promise = null;
			return true;
		}
		const requested = current.desired;
		try {
			const response = await TemplateApi.setRememberLast(requested);
			current.confirmed = response.enabled;
			if (current.desired === requested) {
				templates.rememberLast = response.enabled;
				if (response.enabled !== requested) {
					current.promise = null;
					return true;
				}
			}
		} catch {
			if (current.desired === requested) {
				templates.rememberLast = current.confirmed;
				current.promise = null;
				return false;
			}
		}
		return synchronizeRememberLast(state, current);
	}

	const ComposeFormEvent = Object.freeze({
		Changed: 'BX.Mail.Client.ComposeForm:changed',
		Submit: 'BX.Mail.Client.ComposeForm:submit',
		SendSuccess: 'BX.Mail.Client.ComposeForm:sendSuccess',
		SendError: 'BX.Mail.Client.ComposeForm:sendError',
		Destroy: 'BX.Mail.Client.ComposeForm:destroy'
	});
	const SliderMessage = Object.freeze({
		MessageCreated: 'Mail.Client.MessageCreatedSuccess'
	});

	async function prepareTemplateApplication(params, reference) {
		const {
			api,
			editor,
			state
		} = params;
		state.templates.prepared = null;
		const {
			template
		} = await api.prepare(reference);
		state.templates.prepared = template;
		if (editor.hasUserContent() || state.subject.trim() !== '') {
			return {
				status: 'needsDecision',
				template
			};
		}
		return applyPrepared(params, template, 'replace');
	}
	async function completeTemplateApplication(params, decision) {
		const {
			state
		} = params;
		const template = state.templates.prepared;
		if (decision === 'cancel' || !template) {
			state.templates.prepared = null;
			return {
				status: 'cancelled'
			};
		}
		return applyPrepared(params, template, decision);
	}
	async function applyPrepared(params, template, decision) {
		const {
			api,
			editor,
			formId,
			state
		} = params;
		const isApplied = decision === 'insert' ? editor.insertHtmlAtCaret(template.bodyHtml) : editor.replaceUserContent(template.bodyHtml);
		if (!isApplied) {
			return {
				status: 'failed',
				reason: 'editor'
			};
		}
		if (decision === 'replace') {
			state.subject = template.subject;
		}
		state.templates.prepared = null;
		const payload = {
			formId,
			reason: 'template'
		};
		main_core_events.EventEmitter.emit(ComposeFormEvent.Changed, payload);
		void api.recordUsage(template.reference).catch(() => {});
		return {
			status: 'applied'
		};
	}

	class StalePreparationError extends Error {}
	function createTemplatePreparationController(params) {
		let sequence = 0;
		let lastReference = null;
		const select = reference => {
			lastReference = reference;
			const requestSequence = ++sequence;
			params.onPendingChange(true);
			void prepareTemplateApplication({
				api: {
					prepare: async selectedReference => {
						const response = await TemplateApi.prepare(selectedReference);
						if (sequence !== requestSequence) {
							throw new StalePreparationError();
						}
						return response;
					},
					recordUsage: TemplateApi.recordUsage
				},
				editor: params.editor,
				state: params.state,
				formId: params.formId
			}, reference).then(result => {
				if (sequence === requestSequence) {
					params.onResult(result);
				}
			}, error => {
				if (sequence === requestSequence && !(error instanceof StalePreparationError)) {
					params.onError();
				}
			}).finally(() => {
				if (sequence === requestSequence) {
					params.onPendingChange(false);
				}
			});
		};
		return {
			select,
			retry() {
				if (lastReference) {
					select(lastReference);
				}
			},
			destroy() {
				sequence += 1;
			}
		};
	}
	function completeSelectedTemplate(params, decision) {
		return completeTemplateApplication({
			...params,
			api: TemplateApi
		}, decision);
	}

	const SearchDelay = 300;
	const SearchLimit = 20;
	const MaxQueryLength = 128;
	function createTemplateSearch(params) {
		const {
			state
		} = params;
		const api = params.api ?? TemplateApi;
		const delay = params.delay ?? SearchDelay;
		let timer = null;
		let sequence = 0;
		let currentQuery = '';
		let isQueryOverBound = false;
		const clearTimer = () => {
			if (timer !== null) {
				clearTimeout(timer);
				timer = null;
			}
		};
		const request = (query, offset, append, deferred) => {
			clearTimer();
			const requestSequence = ++sequence;
			const run = () => {
				timer = null;
				state.isLoading = true;
				state.error = false;
				void api.search({
					query,
					offset,
					limit: SearchLimit
				}).then(response => {
					if (sequence !== requestSequence) {
						return;
					}
					state.items = append ? [...state.items, ...response.items] : response.items;
					state.nextOffset = response.nextOffset;
					state.isLoading = false;
				}, () => {
					if (sequence !== requestSequence) {
						return;
					}
					state.error = true;
					state.isLoading = false;
				});
			};
			if (!deferred || delay <= 0) {
				run();
			} else {
				timer = setTimeout(run, delay);
			}
		};
		const answerNothingFound = () => {
			clearTimer();
			sequence += 1;
			state.items = [];
			state.isLoading = false;
			state.error = false;
		};
		return {
			search(query) {
				const characters = [...query.trim()];
				isQueryOverBound = characters.length > MaxQueryLength;
				currentQuery = characters.join('');
				state.nextOffset = null;
				if (isQueryOverBound) {
					answerNothingFound();
					return;
				}
				request(currentQuery, 0, false, true);
			},
			loadMore() {
				if (!state.isLoading && state.nextOffset !== null) {
					request(currentQuery, state.nextOffset, true, false);
				}
			},
			retry() {
				if (isQueryOverBound) {
					answerNothingFound();
					return;
				}
				request(currentQuery, 0, false, false);
			},
			destroy() {
				clearTimer();
				sequence += 1;
			}
		};
	}

	const TestId$5 = Object.freeze({
		screen: 'mail-compose-templates-all',
		search: 'mail-compose-templates-search',
		list: 'mail-compose-templates-list',
		status: 'mail-compose-templates-status',
		empty: 'mail-compose-templates-empty',
		rowName: 'mail-compose-template-row-name',
		rowSubtitle: 'mail-compose-template-row-subtitle',
		retry: 'mail-compose-templates-search-retry',
		loadMore: 'mail-compose-templates-load-more',
		applyRetry: 'mail-compose-templates-apply-retry'
	});
	const LockIconSize = 20;
	const TemplateAll = ui_vue3.defineComponent({
		name: 'MailComposeTemplateAll',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			BInput: ui_system_input_vue.BInput,
			Popup: ui_vue3_components_popup.Popup,
			TextMd: ui_system_typography_vue.TextMd,
			TextXs: ui_system_typography_vue.TextXs,
			UiButton: ui_vue3_components_button.Button
		},
		props: {
			popupId: {
				type: String,
				default: () => `mail-compose-templates-all-${main_core.Text.getRandom()}`
			},
			formId: {
				type: String,
				required: true
			}
		},
		emits: ['close', 'select'],
		setup() {
			return {
				state: useComposeState(),
				editor: useComposeEditor(),
				loc,
				searchSize: ui_system_input_vue.InputSize.Md,
				searchIcon: ui_iconSet_api_vue.Outline.SEARCH,
				lockIcon: ui_iconSet_api_vue.Outline.LOCK_L,
				lockIconSize: LockIconSize,
				buttonStyle: ui_vue3_components_button.AirButtonStyle.OUTLINE,
				buttonSize: ui_vue3_components_button.ButtonSize.SMALL,
				testId: TestId$5
			};
		},
		data() {
			return {
				query: '',
				search: {
					items: [],
					isLoading: false,
					error: false,
					nextOffset: null
				},
				controller: null,
				selectionController: null,
				selectionError: false,
				isSelectionPending: false
			};
		},
		computed: {
			options() {
				return {
					targetContainer: document.body,
					padding: 0,
					contentPadding: 0,
					closeByEsc: true,
					focusTrap: true,
					ariaLabel: loc(Phrase.TemplatesAllButton)
				};
			},
			searchLabel() {
				return loc(Phrase.TemplatesSearch);
			},
			isEmpty() {
				return !this.search.isLoading && !this.search.error && this.search.items.length === 0;
			},
			listStatus() {
				if (this.search.isLoading) {
					return loc(Phrase.TemplatesLoading);
				}
				if (this.search.error) {
					return loc(Phrase.TemplatesLoadError);
				}
				if (this.isEmpty) {
					return loc(Phrase.TemplatesEmpty);
				}
				return loc(Phrase.TemplatesFoundCount, {
					'#COUNT#': String(this.search.items.length)
				});
			}
		},
		watch: {
			query() {
				this.controller?.search(this.query);
			}
		},
		mounted() {
			this.controller = createTemplateSearch({
				state: this.search
			});
			this.controller.search(this.query);
		},
		beforeUnmount() {
			this.controller?.destroy();
			this.selectionController?.destroy();
			this.controller = null;
		},
		methods: {
			rowKey(template) {
				return `${template.reference.source}:${template.reference.id}`;
			},
			rowTestId(template) {
				return `mail-compose-template-row-${template.reference.source}-${template.reference.id}`;
			},
			subtitle(template) {
				if (template.canApply) {
					return template.subject;
				}
				return template.disabledReason === 'CRM_CONTEXT_REQUIRED' ? loc(Phrase.TemplateUnavailableCrmContext) : loc(Phrase.TemplateUnavailable);
			},
			handleClear() {
				this.query = '';
			},
			handleSelect(template) {
				if (!template.canApply) {
					return;
				}
				this.selectionError = false;
				this.getSelectionController().select(template.reference);
			},
			getSelectionController() {
				this.selectionController ??= createTemplatePreparationController({
					state: this.state,
					editor: this.editor,
					formId: this.formId,
					onPendingChange: isPending => {
						this.isSelectionPending = isPending;
						if (isPending) {
							this.selectionError = false;
						}
					},
					onResult: result => {
						this.selectionError = false;
						if (result.status === 'needsDecision') {
							this.$emit('select', result.template);
						} else if (result.status === 'applied') {
							this.$emit('close');
						}
					},
					onError: () => {
						this.selectionError = true;
					}
				});
				return this.selectionController;
			}
		},
		template: `
		<Popup :id="popupId" :options="options" @close="$emit('close')">
			<div class="mail-compose-templates-all" :data-testid="testId.screen">
				<BInput
					v-model="query"
					class="mail-compose-templates-all__search"
					:size="searchSize"
					:icon="searchIcon"
					:withClear="query !== ''"
					:placeholder="searchLabel"
					:aria-label="searchLabel"
					:data-testid="testId.search"
					@clear="handleClear"
				/>
				<div
					class="mail-compose-templates-all__status"
					role="status"
					aria-live="polite"
					:data-testid="testId.status"
				>{{ listStatus }}</div>
				<div class="mail-compose-templates-all__list" :data-testid="testId.list">
					<div v-if="selectionError" class="mail-compose-templates-all__state">
						<TextMd>{{ loc('MAIL_COMPOSE_FORM_TEMPLATE_APPLY_ERROR') }}</TextMd>
						<UiButton
							:text="loc('MAIL_COMPOSE_FORM_TEMPLATES_RETRY')"
							:style="buttonStyle"
							:size="buttonSize"
							:loading="isSelectionPending"
							:dataset="{ testid: testId.applyRetry }"
							@click="selectionController?.retry()"
						/>
					</div>
					<TextMd v-if="search.isLoading" className="mail-compose-templates-all__note">
						{{ loc('MAIL_COMPOSE_FORM_TEMPLATES_LOADING') }}
					</TextMd>
					<div v-else-if="search.error" class="mail-compose-templates-all__state">
						<TextMd>{{ loc('MAIL_COMPOSE_FORM_TEMPLATES_LOAD_ERROR') }}</TextMd>
						<UiButton
							:text="loc('MAIL_COMPOSE_FORM_TEMPLATES_RETRY')"
							:style="buttonStyle"
							:size="buttonSize"
							:dataset="{ testid: testId.retry }"
							@click="controller?.retry()"
						/>
					</div>
					<div
						v-else-if="isEmpty"
						class="mail-compose-template-row --locked --empty"
						:data-testid="testId.empty"
					>
						<div class="mail-compose-template-row__title">
							<TextMd
								className="mail-compose-template-row__name"
								wrap="truncate"
								:data-testid="testId.rowName"
							>
								{{ loc('MAIL_COMPOSE_FORM_TEMPLATES_EMPTY') }}
							</TextMd>
						</div>
					</div>
					<button
						v-for="template of search.items"
						:key="rowKey(template)"
						type="button"
						:class="['mail-compose-template-row', { '--locked': !template.canApply }]"
						:aria-disabled="template.canApply ? null : 'true'"
						:data-testid="rowTestId(template)"
						@click="handleSelect(template)"
					>
						<div class="mail-compose-template-row__title">
							<BIcon
								v-if="!template.canApply"
								class="mail-compose-template-row__lock"
								:name="lockIcon"
								:size="lockIconSize"
							/>
							<TextMd
								className="mail-compose-template-row__name"
								wrap="truncate"
								:data-testid="testId.rowName"
							>
								{{ template.title }}
							</TextMd>
						</div>
						<TextXs
							v-if="subtitle(template)"
							className="mail-compose-template-row__text"
							wrap="truncate"
							:data-testid="testId.rowSubtitle"
						>
							{{ subtitle(template) }}
						</TextXs>
					</button>
					<UiButton
						v-if="search.nextOffset !== null && !search.isLoading"
						class="mail-compose-templates-all__more"
						:text="loc('MAIL_COMPOSE_FORM_TEMPLATES_LOAD_MORE')"
						:style="buttonStyle"
						:size="buttonSize"
						:dataset="{ testid: testId.loadMore }"
						@click="controller?.loadMore()"
					/>
				</div>
			</div>
		</Popup>
	`
	});

	const TestId$4 = Object.freeze({
		dialog: 'mail-compose-template-apply',
		cancel: 'mail-compose-template-apply-cancel',
		insert: 'mail-compose-template-apply-insert',
		replace: 'mail-compose-template-apply-replace'
	});
	const DialogPadding = 24;
	const TemplateApplyDialog = ui_vue3.defineComponent({
		name: 'MailComposeTemplateApplyDialog',
		components: {
			HeadlineSm: ui_system_typography_vue.HeadlineSm,
			Popup: ui_vue3_components_popup.Popup,
			TextMd: ui_system_typography_vue.TextMd,
			UiButton: ui_vue3_components_button.Button
		},
		props: {
			popupId: {
				type: String,
				default: () => `mail-compose-template-apply-${main_core.Text.getRandom()}`
			},
			formId: {
				type: String,
				required: true
			},
			template: {
				type: Object,
				required: true
			}
		},
		emits: ['insert', 'replace', 'cancel', 'applied', 'close'],
		setup() {
			return {
				state: useComposeState(),
				editor: useComposeEditor(),
				cancelStyle: ui_vue3_components_button.AirButtonStyle.PLAIN,
				insertStyle: ui_vue3_components_button.AirButtonStyle.OUTLINE,
				replaceStyle: ui_vue3_components_button.AirButtonStyle.FILLED,
				buttonSize: ui_vue3_components_button.ButtonSize.MEDIUM,
				testId: TestId$4
			};
		},
		data() {
			return {
				isPending: false,
				isCompleted: false,
				hasError: false
			};
		},
		computed: {
			options() {
				return {
					targetContainer: document.body,
					overlay: true,
					closeIcon: true,
					closeByEsc: true,
					padding: DialogPadding,
					focusTrap: true,
					ariaLabelledBy: this.titleId
				};
			},
			titleId() {
				return `${this.popupId}-title`;
			},
			title() {
				return loc(Phrase.TemplateApplyTitle);
			},
			errorText() {
				return loc(Phrase.TemplateApplyError);
			},
			labels() {
				return {
					cancel: loc(Phrase.TemplateApplyCancel),
					insert: loc(Phrase.TemplateApplyInsert),
					replace: loc(Phrase.TemplateApplyReplace)
				};
			}
		},
		methods: {
			restoreEditorFocus() {
				try {
					return this.editor.focus();
				} catch {
					return false;
				}
			},
			handleInsert() {
				this.apply('insert');
			},
			handleReplace() {
				this.apply('replace');
			},
			handleCancel() {
				if (this.isPending || this.isCompleted) {
					return;
				}
				this.isPending = true;
				this.$emit('cancel');
				void completeSelectedTemplate({
					editor: this.editor,
					state: this.state,
					formId: this.formId
				}, 'cancel').then(() => {
					this.isCompleted = true;
					this.restoreEditorFocus();
					this.$emit('close');
				});
			},
			apply(decision) {
				const prepared = this.state.templates.prepared;
				const isSelected = prepared?.reference.source === this.template.reference.source && prepared.reference.id === this.template.reference.id;
				if (this.isPending || this.isCompleted || !isSelected) {
					return;
				}
				this.isPending = true;
				this.hasError = false;
				this.$emit(decision);
				void completeSelectedTemplate({
					editor: this.editor,
					state: this.state,
					formId: this.formId
				}, decision).then(result => {
					this.isPending = false;
					if (result.status !== 'applied') {
						this.hasError = true;
						return;
					}
					this.isCompleted = true;
					this.restoreEditorFocus();
					this.$emit('applied');
					this.$emit('close');
				}, () => {
					this.isPending = false;
					this.hasError = true;
				});
			}
		},
		template: `
		<Popup :id="popupId" :options="options" @close="handleCancel">
			<div class="mail-compose-template-apply" :data-testid="testId.dialog">
				<HeadlineSm :id="titleId">{{ title }}</HeadlineSm>
				<TextMd v-if="hasError" className="mail-compose-template-apply__error">{{ errorText }}</TextMd>
				<div class="mail-compose-template-apply__actions">
					<UiButton
						:text="labels.cancel"
						:style="cancelStyle"
						:size="buttonSize"
						:disabled="isPending"
						:dataset="{ testid: testId.cancel }"
						@click="handleCancel"
					/>
					<UiButton
						:text="labels.insert"
						:style="insertStyle"
						:size="buttonSize"
						:loading="isPending"
						:disabled="isPending"
						:dataset="{ testid: testId.insert }"
						@click="handleInsert"
					/>
					<UiButton
						:text="labels.replace"
						:style="replaceStyle"
						:size="buttonSize"
						:loading="isPending"
						:disabled="isPending"
						:dataset="{ testid: testId.replace }"
						@click="handleReplace"
					/>
				</div>
			</div>
		</Popup>
	`
	});

	const TestId$3 = Object.freeze({
		picker: 'mail-compose-template-picker',
		control: 'mail-compose-templates-action',
		newLabel: 'mail-compose-templates-new',
		retry: 'mail-compose-templates-retry',
		applyRetry: 'mail-compose-templates-apply-retry',
		toggle: 'mail-compose-templates-remember',
		allControl: 'mail-compose-templates-all-action',
		configureControl: 'mail-compose-templates-configure-action'
	});
	const MenuWidth$2 = 360;
	const MenuWindowGap = 16;
	const MenuMinHeight = 120;
	const MenuSection$1 = Object.freeze({
		Templates: 'templates',
		Options: 'options',
		Actions: 'actions'
	});
	const TemplatePicker = ui_vue3.defineComponent({
		name: 'MailComposeTemplatePicker',
		components: {
			BMenu: ui_system_menu_vue.BMenu,
			TemplateAll,
			TemplateApplyDialog,
			UiButton: ui_vue3_components_button.Button,
			UiLabel: ui_system_label_vue.Label
		},
		props: {
			menuId: {
				type: String,
				default: () => `mail-compose-templates-menu-${main_core.Text.getRandom()}`
			}
		},
		emits: ['decision-required'],
		setup() {
			return {
				state: useComposeState(),
				editor: useComposeEditor(),
				controlStyle: ui_vue3_components_button.AirButtonStyle.PLAIN_NO_ACCENT,
				controlSize: ui_vue3_components_button.ButtonSize.SMALL,
				controlIcon: ui_iconSet_api_vue.Outline.O_TEMPLATE_TASK,
				labelStyle: ui_system_label.LabelStyle.TINTED_SUCCESS,
				labelSize: ui_system_label.LabelSize.XS,
				testId: TestId$3
			};
		},
		data() {
			return {
				isMenuShown: false,
				isAllShown: false,
				isApplyShown: false,
				selectionError: false,
				isSelectionPending: false,
				selectionController: null
			};
		},
		computed: {
			controlText() {
				return loc(Phrase.TemplatesButton);
			},
			newLabel() {
				return loc(Phrase.TemplatesNewLabel);
			},
			templates() {
				return this.state.templates.recent;
			},
			managePath() {
				return this.state.paths.templatesManage;
			},
			menuItems() {
				const items = this.templates.map(template => ({
					id: `template-${template.reference.source}-${template.reference.id}`,
					sectionCode: MenuSection$1.Templates,
					title: template.title,
					subtitle: this.subtitle(template),
					isLocked: !template.canApply,
					testId: this.templateTestId(template.reference),
					onClick: () => {
						if (template.canApply) {
							this.handleTemplateClick(template.reference);
						}
					}
				}));
				if (this.state.templates.isLoading) {
					items.push({
						sectionCode: MenuSection$1.Templates,
						title: loc(Phrase.TemplatesLoading)
					});
				} else if (this.state.templates.error) {
					items.push({
						sectionCode: MenuSection$1.Templates,
						title: loc(Phrase.TemplatesRetry),
						subtitle: loc(Phrase.TemplatesLoadError),
						testId: TestId$3.retry,
						onClick: () => {
							this.handleRetry();
						}
					});
				} else if (this.state.templates.isLoaded && this.templates.length === 0) {
					items.push({
						sectionCode: MenuSection$1.Templates,
						title: loc(Phrase.TemplatesEmpty)
					});
				}
				if (this.selectionError) {
					items.push({
						sectionCode: MenuSection$1.Templates,
						title: loc(Phrase.TemplatesRetry),
						subtitle: loc(Phrase.TemplateApplyError),
						testId: TestId$3.applyRetry,
						onClick: () => {
							this.selectionController?.retry();
						}
					});
				}
				items.push({
					sectionCode: MenuSection$1.Options,
					id: 'remember-last',
					title: loc(Phrase.TemplatesRemember),
					isSelected: this.state.templates.rememberLast,
					testId: TestId$3.toggle,
					onClick: () => {
						this.handleRememberToggle();
					}
				}, {
					sectionCode: MenuSection$1.Actions,
					uiButtonOptions: {
						useAirDesign: true,
						text: loc(Phrase.TemplatesAllButton),
						style: ui_buttons.AirButtonStyle.OUTLINE,
						size: ui_buttons.ButtonSize.SMALL,
						icon: ui_iconSet_api_vue.Outline.O_TEMPLATE_TASK,
						dataset: {
							testid: TestId$3.allControl
						},
						onclick: () => {
							this.handleAllClick();
							return {};
						}
					}
				});
				if (this.managePath !== '') {
					items.push({
						sectionCode: MenuSection$1.Actions,
						uiButtonOptions: {
							useAirDesign: true,
							text: loc(Phrase.TemplatesConfigureButton),
							style: ui_buttons.AirButtonStyle.OUTLINE,
							size: ui_buttons.ButtonSize.SMALL,
							icon: ui_iconSet_api_vue.Outline.SETTINGS,
							dataset: {
								testid: TestId$3.configureControl
							},
							onclick: () => {
								this.handleConfigureClick();
								return {};
							}
						}
					});
				}
				return items;
			},
			menuOptions() {
				return {
					bindElement: this.getControlNode(),
					width: MenuWidth$2,
					closeOnItemClick: false,
					bindOptions: {
						forceBindPosition: true
					},
					sections: [{
						code: MenuSection$1.Templates,
						title: loc(Phrase.TemplatesMenuTitle)
					}, {
						code: MenuSection$1.Options
					}, {
						code: MenuSection$1.Actions
					}],
					items: this.menuItems
				};
			}
		},
		watch: {
			menuItems() {
				this.fitMenuToWindow();
			}
		},
		mounted() {
			this.markControlAria();
		},
		beforeUnmount() {
			this.selectionController?.destroy();
		},
		methods: {
			markControlAria() {
				const control = this.getControlNode();
				control?.setAttribute('aria-haspopup', 'menu');
				control?.setAttribute('aria-expanded', 'false');
			},
			subtitle(template) {
				if (template.canApply) {
					return template.subject;
				}
				return template.disabledReason === 'CRM_CONTEXT_REQUIRED' ? loc(Phrase.TemplateUnavailableCrmContext) : loc(Phrase.TemplateUnavailable);
			},
			handleControlClick() {
				this.isMenuShown = true;
				this.fitMenuToWindow();
				void loadRecentTemplates(this.state).then(this.markMenuItems);
			},
			fitMenuToWindow() {
				void ui_vue3.nextTick(() => {
					const control = this.getControlNode();
					const popup = main_popup.PopupManager.getPopupById(this.menuId);
					if (!control || !popup?.isShown()) {
						return;
					}
					const {
						top,
						bottom
					} = control.getBoundingClientRect();
					const room = Math.max(top, window.innerHeight - bottom) - MenuWindowGap;
					popup.setMaxHeight(Math.max(room, MenuMinHeight));
					popup.adjustPosition();
				});
			},
			handleTemplateClick(reference) {
				this.selectionError = false;
				this.getSelectionController().select(reference);
			},
			handleRetry() {
				void loadRecentTemplates(this.state, true).then(this.markMenuItems);
			},
			handleRememberToggle() {
				void updateRememberLast(this.state, !this.state.templates.rememberLast).then(this.markMenuItems);
			},
			handleAllClick() {
				this.isMenuShown = false;
				this.isAllShown = true;
			},
			handleAllSelect() {
				this.handlePreparedTemplate();
			},
			handleConfigureClick() {
				this.isMenuShown = false;
				main_sidepanel.SidePanel.Instance.open(this.managePath, {
					cacheable: false,
					events: {
						onCloseComplete: this.handleConfigureClosed
					}
				});
			},
			handleConfigureClosed() {
				void loadRecentTemplates(this.state, true).then(this.markMenuItems);
			},
			handlePreparedTemplate() {
				const template = this.state.templates.prepared;
				if (!template) {
					return;
				}
				this.isMenuShown = false;
				this.isAllShown = false;
				this.isApplyShown = true;
				this.$emit('decision-required', template);
			},
			handleApplicationClose() {
				this.isMenuShown = false;
				this.isAllShown = false;
				this.isApplyShown = false;
			},
			getFormId() {
				return this.getControlNode()?.closest('form')?.id ?? '';
			},
			templateTestId(reference) {
				return `mail-compose-template-item-${reference.source}-${reference.id}`;
			},
			markMenuItems() {
				void ui_vue3.nextTick(() => {
					const menu = document.getElementById(this.menuId);
					const actions = menu?.querySelectorAll('.ui-popup-menu-item-action') ?? [];
					this.menuItems.forEach((item, index) => {
						if (item.testId && actions[index]) {
							actions[index].dataset.testid = item.testId;
						}
					});
				});
			},
			getSelectionController() {
				this.selectionController ??= createTemplatePreparationController({
					state: this.state,
					editor: this.editor,
					formId: this.getFormId(),
					onPendingChange: isPending => {
						this.isSelectionPending = isPending;
						if (isPending) {
							this.selectionError = false;
						}
					},
					onResult: result => {
						this.selectionError = false;
						if (result.status === 'needsDecision') {
							this.handlePreparedTemplate();
						} else if (result.status === 'applied') {
							this.isMenuShown = false;
						}
					},
					onError: () => {
						this.selectionError = true;
						this.isMenuShown = true;
						this.markMenuItems();
					}
				});
				return this.selectionController;
			},
			getControlNode() {
				const row = this.$refs.row;
				return row?.querySelector(`[data-testid="${TestId$3.control}"]`) ?? null;
			}
		},
		template: `
		<div ref="row" class="mail-compose-template-picker" :data-testid="testId.picker">
			<UiButton
				:text="controlText"
				:style="controlStyle"
				:size="controlSize"
				:leftIcon="controlIcon"
				:dataset="{ testid: testId.control }"
				@click="handleControlClick"
			/>
			<UiLabel
				:value="newLabel"
				:style="labelStyle"
				:size="labelSize"
				:data-testid="testId.newLabel"
			/>
			<BMenu
				v-if="isMenuShown"
				:id="menuId"
				:options="menuOptions"
				@close="isMenuShown = false"
			/>
			<TemplateAll
				v-if="isAllShown"
				:formId="getFormId()"
				@select="handleAllSelect"
				@close="isAllShown = false"
			/>
			<TemplateApplyDialog
				v-if="isApplyShown && state.templates.prepared"
				:formId="getFormId()"
				:template="state.templates.prepared"
				@close="handleApplicationClose"
			/>
		</div>
	`
	});

	const TestId$2 = Object.freeze({
		actions: 'mail-compose-action-bar',
		copilot: 'mail-compose-copilot-action',
		attach: 'mail-compose-attach-action',
		createDocument: 'mail-compose-create-document-action',
		signature: 'mail-compose-signature-action',
		slots: SlotsControlTestId,
		sendRow: 'mail-compose-send-row',
		send: SendControlTestId,
		cancel: 'mail-compose-cancel'
	});
	const ActionBar = ui_vue3.defineComponent({
		name: 'MailComposeActionBar',
		components: {
			SendSplitButton,
			TemplatePicker,
			UiButton: ui_vue3_components_button.Button
		},
		emits: ['signature', 'send', 'cancel'],
		setup() {
			return {
				state: useComposeState(),
				editor: useComposeEditor(),
				actionStyle: ui_vue3_components_button.AirButtonStyle.PLAIN_NO_ACCENT,
				actionSize: ui_vue3_components_button.ButtonSize.SMALL,
				sendStyle: ui_vue3_components_button.AirButtonStyle.FILLED,
				cancelStyle: ui_vue3_components_button.AirButtonStyle.PLAIN,
				sendSize: ui_vue3_components_button.ButtonSize.MEDIUM,
				copilotIcon: ui_iconSet_api_vue.Outline.COPILOT,
				attachIcon: ui_iconSet_api_vue.Outline.ATTACH,
				createDocumentIcon: ui_iconSet_api_vue.Outline.CREATE_FILE,
				signatureIcon: ui_iconSet_api_vue.Outline.DOCUMENT_SIGN,
				slotsIcon: ui_iconSet_api_vue.Outline.CALENDAR_WITH_SLOTS,
				testId: TestId$2
			};
		},
		data() {
			return {
				isSlotsPending: false
			};
		},
		computed: {
			labels() {
				return {
					copilot: loc(Phrase.CopilotButton),
					attach: loc(Phrase.AttachButton),
					createDocument: loc(Phrase.CreateDocumentButton),
					signature: loc(Phrase.SignatureButton),
					slots: loc(Phrase.SlotsButton),
					send: loc(Phrase.SendButton),
					cancel: loc(Phrase.CancelButton)
				};
			},
			isUnfinishedShown() {
				return this.state.features.unfinishedElements;
			},
			isTemplatesShown() {
				return this.state.features.templates;
			},
			isCopilotShown() {
				return this.state.copilot.isCopilotEnabled === true;
			},
			isSending() {
				return this.state.isSending;
			},
			isSendDisabled() {
				return this.isSending || isSelectedSenderMigrationActive(this.state) || isRecipientsTotalLimitExceeded(this.state);
			},
			sendUnavailableHint() {
				return isSelectedSenderMigrationActive(this.state) ? loc('MAIL_MIGRATION_SEND_UNAVAILABLE') : '';
			}
		},
		methods: {
			handleCopilot() {
				this.editor.showCopilot();
			},
			handleAttach() {
				this.editor.showUploader();
			},
			handleSignature() {
				this.$emit('signature');
			},
			handleSlots() {
				if (this.isSlotsPending) {
					return;
				}
				this.isSlotsPending = true;
				const stopWaiting = () => {
					this.isSlotsPending = false;
				};
				void insertCalendarSlots({
					editor: this.editor,
					state: this.state,
					getControlNode: this.getSlotsControlNode
				}).then(stopWaiting, stopWaiting);
			},
			handleCreateDocument() {
				this.editor.showCreateDocument();
			},
			handleSend() {
				if (this.isSendDisabled) {
					return;
				}
				this.$emit('send');
			},
			handleCancel() {
				this.$emit('cancel');
			},
			getSlotsControlNode() {
				const row = this.$refs.actions;
				return row?.querySelector(`[data-testid="${TestId$2.slots}"]`) ?? null;
			}
		},
		template: `
		<div ref="actions" class="mail-compose-action-bar" :data-testid="testId.actions">
			<UiButton
				v-if="isCopilotShown"
				:text="labels.copilot"
				:style="actionStyle"
				:size="actionSize"
				:leftIcon="copilotIcon"
				:dataset="{ testid: testId.copilot }"
				@click="handleCopilot"
			/>
			<UiButton
				:text="labels.attach"
				:style="actionStyle"
				:size="actionSize"
				:leftIcon="attachIcon"
				:dataset="{ testid: testId.attach }"
				@click="handleAttach"
			/>
			<UiButton
				v-if="isUnfinishedShown"
				:text="labels.createDocument"
				:style="actionStyle"
				:size="actionSize"
				:leftIcon="createDocumentIcon"
				:dataset="{ testid: testId.createDocument }"
				@click="handleCreateDocument"
			/>
			<UiButton
				:text="labels.signature"
				:style="actionStyle"
				:size="actionSize"
				:leftIcon="signatureIcon"
				:dataset="{ testid: testId.signature }"
				@click="handleSignature"
			/>
			<UiButton
				:text="labels.slots"
				:style="actionStyle"
				:size="actionSize"
				:leftIcon="slotsIcon"
				:loading="isSlotsPending"
				:dataset="{ testid: testId.slots }"
				@click="handleSlots"
			/>
			<TemplatePicker v-if="isTemplatesShown"/>
		</div>
		<div class="mail-compose-send-row" :data-testid="testId.sendRow">
			<SendSplitButton v-if="isUnfinishedShown" @send="handleSend"/>
			<UiButton
				v-else
				:text="labels.send"
				:style="sendStyle"
				:size="sendSize"
				:loading="isSending"
				:disabled="isSendDisabled"
				:title="sendUnavailableHint"
				:dataset="{ testid: testId.send }"
				@click="handleSend"
			/>
			<UiButton
				:text="labels.cancel"
				:style="cancelStyle"
				:size="sendSize"
				:dataset="{ testid: testId.cancel }"
				@click="handleCancel"
			/>
		</div>
	`
	});

	const titlePhrase = {
		[Scenario.New]: Phrase.TitleNew,
		[Scenario.Reply]: Phrase.TitleReply,
		[Scenario.ReplyAll]: Phrase.TitleReply,
		[Scenario.Forward]: Phrase.TitleForward
	};
	const ComposeHeader = ui_vue3.defineComponent({
		name: 'MailComposeHeader',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			HeadlineLg: ui_system_typography_vue.HeadlineLg
		},
		setup() {
			return {
				state: useComposeState(),
				iconName: ui_iconSet_api_vue.Outline.MAIL_SEND
			};
		},
		computed: {
			title() {
				return this.state.title || loc(titlePhrase[this.state.scenario]);
			}
		},
		template: `
		<div class="mail-compose-header" data-testid="mail-compose-header">
			<BIcon
				class="mail-compose-header__icon"
				:name="iconName"
				:size="24"
				data-testid="mail-compose-header-icon"
			/>
			<HeadlineLg data-testid="mail-compose-header-title">{{ title }}</HeadlineLg>
		</div>
	`
	});

	const EmptyLine = '<br>';
	function renderQuoteNode(editor, body) {
		return `<div id="${editor.bodyNodes.quote}">${body.quote === '' ? EmptyLine : body.quote}</div>`;
	}
	function buildInitialBody(editor, body) {
		if (body.quoteFolded || body.quote === '') {
			return '';
		}
		return renderQuoteNode(editor, body);
	}
	function buildUnfoldedBody(editor, body) {
		return editor.getBody() + renderQuoteNode(editor, body);
	}
	function buildMessageBody(editor, body) {
		const content = editor.getBody();
		if (!body.quoteFolded) {
			return content;
		}
		const quote = editor.parseQuote(renderQuoteNode(editor, body));
		return quote === null ? null : content + quote;
	}

	const EditorHost = ui_vue3.defineComponent({
		name: 'MailComposeEditorHost',
		setup() {
			const editor = useComposeEditor();
			editor.setInitialBody(buildInitialBody(editor, useComposeState().body));
			return {
				editor,
				subscriptions: []
			};
		},
		data() {
			return {
				isEditorShown: false,
				editorNode: null,
				editorHome: null
			};
		},
		mounted() {
			this.attachEditor();
			this.subscriptions.push(this.editor.subscribeBodyPlaceholder(loc(Phrase.BodyPlaceholder)));
		},
		beforeUnmount() {
			this.detachEditor();
			this.subscriptions.forEach(unsubscribe => {
				unsubscribe();
			});
			this.subscriptions.length = 0;
		},
		methods: {
			attachEditor() {
				const node = this.editor.getHostNode();
				if (!node) {
					return;
				}
				this.editorNode = node;
				this.editorHome = node.parentElement;
				this.subscriptions.push(this.editor.subscribeVisibilityChange(this.handleVisibilityChange));
				main_core.Dom.append(node, this.$refs.editorSlot);
				this.editor.show();
			},
			detachEditor() {
				const node = this.editorNode;
				if (!node) {
					return;
				}
				main_core.Dom.append(node, this.editorHome);
				this.editorNode = null;
				this.editorHome = null;
			},
			handleVisibilityChange(isShown) {
				this.isEditorShown = isShown;
			}
		},
		template: `
		<div class="mail-compose-editor-host">
			<div
				v-if="!isEditorShown"
				class="mail-compose-editor-host__placeholder"
				data-testid="mail-compose-editor-placeholder"
			></div>
			<div
				ref="editorSlot"
				class="mail-compose-editor-host__slot"
				data-testid="mail-compose-editor-slot"
			></div>
		</div>
	`
	});

	const Step = 1024;
	const Decimals = 10;
	function formatSize(bytes, units) {
		let size = bytes;
		let step = 0;
		while (size >= Step && step < units.length - 1) {
			size /= Step;
			step += 1;
		}
		const value = Math.round(size * Decimals) / Decimals;
		return `${value} ${units[step] ?? ''}`.trim();
	}

	const ValidationError = Object.freeze({
		RecipientsLimit: 'recipientsLimit',
		RecipientsTotalLimit: 'recipientsTotalLimit',
		RecipientsEmpty: 'recipientsEmpty',
		AttachmentsUploading: 'attachmentsUploading',
		AttachmentsSize: 'attachmentsSize'
	});
	function validateMessage(params) {
		const checks = [checkRecipientsLimit(params), getRecipientsTotalLimitError(params.state), checkRecipientsFilled(params), checkUploadFinished(params), checkAttachmentsSize(params)];
		return checks.filter(error => error !== null);
	}
	function checkRecipientsLimit(params) {
		const limit = params.state.limits.recipientsPerField;
		if (limit === RecipientsPerFieldUnlimited) {
			return null;
		}
		const counts = Object.values(getRecipientCounts(params.state));
		if (!counts.some(count => count > limit)) {
			return null;
		}
		return {
			code: ValidationError.RecipientsLimit,
			message: loc(Phrase.ErrorRecipientsLimit, {
				'#COUNT#': String(limit)
			})
		};
	}
	function getRecipientsTotalLimitError(state) {
		if (!isRecipientsTotalLimitExceeded(state)) {
			return null;
		}
		const message = loc(Phrase.ErrorRecipientsTotalLimit, {
			'#COUNT#': String(state.limits.recipientsTotal)
		});
		return {
			code: ValidationError.RecipientsTotalLimit,
			message: message || `${getRecipientsTotalCount(state)} / ${state.limits.recipientsTotal}`
		};
	}
	function checkRecipientsFilled(params) {
		if (getRecipientCounts(params.state).to > 0) {
			return null;
		}
		return {
			code: ValidationError.RecipientsEmpty,
			message: loc(Phrase.ErrorRecipientsEmpty)
		};
	}
	function checkUploadFinished(params) {
		if (!params.files.some(file => file.id === null)) {
			return null;
		}
		return {
			code: ValidationError.AttachmentsUploading,
			message: loc(Phrase.ErrorAttachmentsUploading)
		};
	}
	function checkAttachmentsSize(params) {
		const {
			limits
		} = params.state;
		if (isLargeAttachmentEnabled(params.state) || limits.maxAttachmentsSize <= 0) {
			return null;
		}
		const totalSize = params.files.reduce((sum, file) => sum + file.size, 0);
		if (limits.maxAttachmentsSize > encodedSize(totalSize)) {
			return null;
		}
		return {
			code: ValidationError.AttachmentsSize,
			message: loc(Phrase.ErrorAttachmentsSize, {
				'#SIZE#': formatSize(limits.maxAttachmentsSizeAfterEncoding, loc(Phrase.SizeUnits).split('|'))
			})
		};
	}
	function encodedSize(totalSize) {
		return Math.ceil(totalSize / 3) * 4;
	}

	const TestId$1 = 'mail-compose-error-alert';
	const ErrorAlert = ui_vue3.defineComponent({
		name: 'MailComposeErrorAlert',
		components: {
			Alert: ui_system_alert_vue.Alert
		},
		setup() {
			return {
				state: useComposeState(),
				design: ui_system_alert.AlertDesign.tintedAlert,
				testId: TestId$1
			};
		},
		computed: {
			errors() {
				const totalLimitError = getRecipientsTotalLimitError(this.state);
				if (!totalLimitError) {
					return this.state.errors;
				}
				const storedErrors = this.state.errors.filter(error => {
					return error.code !== ValidationError.RecipientsTotalLimit;
				});
				return [totalLimitError, ...storedErrors];
			},
			messages() {
				return this.errors.map(error => error.message);
			},
			isShown() {
				return this.messages.length > 0;
			}
		},
		watch: {
			messages() {
				void this.$nextTick(this.announce);
			}
		},
		methods: {
			announce() {
				const block = this.$refs.block;
				if (!block) {
					return;
				}
				block.focus();
				block.scrollIntoView({
					block: 'nearest'
				});
			},
			handleClose() {
				this.state.errors = [];
			}
		},
		template: `
		<div
			v-if="isShown"
			ref="block"
			class="mail-compose-error-alert"
			:data-testid="testId"
			role="alert"
			tabindex="-1"
		>
			<Alert :design="design" hasCloseButton @closeButtonClick="handleClose">
				<span
					v-for="(message, index) in messages"
					:key="index"
					class="mail-compose-error-alert__message"
				>{{ message }}</span>
			</Alert>
		</div>
	`
	});

	const ControlTestId$1 = 'mail-compose-quote-show';
	const QuoteToggle = ui_vue3.defineComponent({
		name: 'MailComposeQuoteToggle',
		components: {
			UiButton: ui_vue3_components_button.Button
		},
		setup() {
			return {
				state: useComposeState(),
				editor: useComposeEditor(),
				subscriptions: [],
				controlStyle: ui_vue3_components_button.AirButtonStyle.PLAIN,
				controlSize: ui_vue3_components_button.ButtonSize.SMALL,
				controlTestId: ControlTestId$1
			};
		},
		computed: {
			isShown() {
				return this.state.body.quoteFolded;
			},
			text() {
				return loc(Phrase.QuoteShow);
			}
		},
		mounted() {
			this.subscriptions.push(this.editor.subscribeViewModeChange(this.handleViewModeChange));
		},
		beforeUnmount() {
			this.subscriptions.forEach(unsubscribe => {
				unsubscribe();
			});
			this.subscriptions.length = 0;
		},
		methods: {
			handleClick() {
				this.unfold();
			},
			handleViewModeChange(mode) {
				if (mode !== EditorViewMode.Visual) {
					this.unfold();
				}
			},
			unfold() {
				if (!this.state.body.quoteFolded) {
					return;
				}
				if (!this.editor.setBody(buildUnfoldedBody(this.editor, this.state.body))) {
					return;
				}
				this.state.body.quoteFolded = false;
				this.editor.focus();
				this.editor.updateCopilotContext({
					isAddedQuote: true
				});
			}
		},
		template: `
		<div
			v-if="isShown"
			class="mail-compose-quote-toggle"
			data-testid="mail-compose-quote-toggle"
		>
			<UiButton
				:text="text"
				:style="controlStyle"
				:size="controlSize"
				:dataset="{ testid: controlTestId }"
				@click="handleClick"
			/>
		</div>
	`
	});

	const transport = main_core.ajax;
	function loadContactDialog() {
		const host = getContactDialogHost();
		return host.runtime.loadExtension('mail.dialogeditcontact').then(extension => ({
			dialog: extension.DialogEditContact,
			eventEmitter: host.eventEmitter
		}));
	}
	function getContactDialogHost() {
		const localHost = {
			runtime: main_core.Runtime,
			eventEmitter: main_core_events.EventEmitter
		};
		try {
			const topBx = window.top?.BX;
			if (main_core.Type.isFunction(topBx?.Runtime?.loadExtension) && topBx.Event?.EventEmitter) {
				return {
					runtime: topBx.Runtime,
					eventEmitter: topBx.Event.EventEmitter
				};
			}
		} catch {
			return localHost;
		}
		return localHost;
	}
	const NoContact$1 = 0;
	const NewContact = 'new';
	function getContactIdByEmail(email) {
		return transport.runAction('mail.addressbook.getContactIdByEmail', {
			data: {
				email
			}
		}).then(response => Number(response.data) || NoContact$1);
	}
	function saveContact(name, email) {
		return loadContactDialog().then(host => host.dialog.saveContact(name, email, NewContact)).then(response => response.data ?? []);
	}

	const AddressBookEntityId = 'address_book';
	const NoContact = 0;
	const AddedItemSort = 1;
	const LoaderSize = 29;
	const LoaderOffset = Object.freeze({
		left: 'calc(-50% - 19px)',
		top: '-2px'
	});
	const StubIconOpacity = 85;
	const SearchTabId = 'search';
	const ContactSavedEvent = 'BX.DialogEditContact:onSaveContact';
	const SliderClosedEvent = 'SidePanel.Slider:onCloseComplete';
	const SliderTookOver = 'The contact is filled in the slider of the address book.';
	let sliderSequence = 0;
	class AddressBookFooter extends ui_entitySelector.DefaultFooter {
		#loader = null;
		getContent() {
			return this.cache.remember('content', () => {
				return main_core.Tag.render`
				<button
					type="button"
					class="ui-selector-footer-link ui-selector-footer-link-add"
					data-testid="mail-compose-address-book-add"
					onclick="${this.handleClick.bind(this)}"
				>${loc(Phrase.AddressBookAdd)}</button>
			`;
			});
		}
		getLoader() {
			if (this.#loader === null) {
				this.#loader = new main_loader.Loader({
					target: this.getContent(),
					size: LoaderSize,
					offset: LoaderOffset
				});
			}
			return this.#loader;
		}
		showLoader() {
			void this.getLoader().show();
		}
		hideLoader() {
			void this.getLoader().hide();
		}
		handleClick() {
			if (this.getLoader().isShown()) {
				return;
			}
			const dialog = this.getDialog();
			this.showLoader();
			void createContact(dialog, dialog.getTagSelectorQuery()).then(() => {
				this.hideLoader();
			}, () => {
				this.hideLoader();
			});
		}
	}
	function getAddressBookDialogOptions() {
		return {
			footer: AddressBookFooter,
			searchTabOptions: {
				id: SearchTabId,
				stub: true,
				stubOptions: {
					title: loc(Phrase.AddressBookEmptyTitle),
					subtitle: renderEmptySearchText(),
					icon: AddressBookIcon,
					iconOpacity: StubIconOpacity,
					arrow: true
				}
			},
			searchOptions: {
				allowCreateItem: true,
				footerOptions: {
					label: loc(Phrase.AddressBookAddFromSearch)
				}
			}
		};
	}
	function createContact(dialog, typedLine) {
		const line = typedLine.trim();
		if (!main_core.Validation.isEmail(line)) {
			openContactForm(dialog, toContactDraft(line));
			return Promise.reject(new Error(SliderTookOver));
		}
		return saveContact(line, line).then(items => {
			addItemsToField(dialog, items);
		}, error => {
			openContactForm(dialog, {
				email: line,
				name: '',
				showEmailError: false
			}, error);
			throw new Error(SliderTookOver);
		});
	}
	function openContactOfTag(dialog, tagItem) {
		const selector = dialog.getTagSelector();
		if (!selector || selector.isLocked() || tagItem.getEntityId() !== AddressBookEntityId) {
			return;
		}
		const contact = getTagContact(dialog, tagItem);
		if (!contact) {
			return;
		}
		const unlock = () => {
			selector.unlock();
		};
		selector.lock();
		resolveContactId(contact).then(contactId => {
			if (contactId <= NoContact) {
				unlock();
				return;
			}
			openContact(dialog, {
				...contact,
				contactId
			}, unlock);
		}).catch(unlock);
	}
	function getTagContact(dialog, tagItem) {
		const item = dialog.getItem([tagItem.getEntityId(), tagItem.getId()]);
		if (!item) {
			return null;
		}
		const customData = item.getCustomData();
		return {
			contactId: Number(customData.get('id')) || NoContact,
			email: String(customData.get('email') ?? ''),
			name: String(customData.get('name') ?? '')
		};
	}
	function resolveContactId(contact) {
		if (contact.contactId > NoContact) {
			return Promise.resolve(contact.contactId);
		}
		return getContactIdByEmail(contact.email);
	}
	function toContactDraft(line) {
		return line.includes('@') ? {
			email: line,
			name: '',
			showEmailError: true
		} : {
			email: '',
			name: line,
			showEmailError: false
		};
	}
	function openContactForm(dialog, draft, error) {
		const pendingLifecycle = bindDialogLifecycle(dialog);
		if (!pendingLifecycle) {
			return;
		}
		void loadContactDialog().then(host => {
			if (!pendingLifecycle.isAlive()) {
				return;
			}
			const prefixId = nextSliderPrefix();
			const contactId = host.dialog.openCreateDialog({
				prefixId,
				showEmailError: draft.showEmailError,
				responseError: toResponseError(error),
				contactData: {
					email: draft.email,
					name: draft.name
				}
			});
			if (!pendingLifecycle.isAlive()) {
				return;
			}
			pendingLifecycle.release();
			bindContactSlider(dialog, {
				contactId,
				prefixId
			}, host.eventEmitter);
		}).catch(() => {
			pendingLifecycle.release();
		});
	}
	function openContact(dialog, contact, onClose) {
		const pendingLifecycle = bindDialogLifecycle(dialog, onClose);
		if (!pendingLifecycle) {
			onClose();
			return;
		}
		void loadContactDialog().then(host => {
			if (!pendingLifecycle.isAlive()) {
				return;
			}
			const prefixId = nextSliderPrefix();
			const contactId = host.dialog.openEditDialog({
				contactID: contact.contactId,
				prefixId,
				contactData: {
					email: contact.email,
					name: contact.name
				}
			});
			if (!pendingLifecycle.isAlive()) {
				return;
			}
			pendingLifecycle.release();
			bindContactSlider(dialog, {
				contactId,
				prefixId
			}, host.eventEmitter, onClose);
		})
		.catch(() => {
			if (pendingLifecycle.isAlive()) {
				onClose();
			}
			pendingLifecycle.release();
		});
	}
	function toResponseError(error) {
		return main_core.Type.isPlainObject(error) && main_core.Type.isArray(error.errors) ? error : undefined;
	}
	function bindContactSlider(dialog, slider, eventEmitter, onClose) {
		const sliderUrl = `dialogEditContact_${slider.contactId}_${slider.prefixId}`;
		let isReleased = false;
		let lifecycle = null;
		lifecycle = bindDialogLifecycle(dialog, release);
		if (!lifecycle) {
			onClose?.();
			return;
		}
		function handleContactSaved(event) {
			const saved = event.getData();
			if (saved.prefixId === slider.prefixId && main_core.Type.isArray(saved.items)) {
				addItemsToField(dialog, saved.items);
			}
		}
		function handleSliderClosed(event) {
			if (event.getSlider()?.getUrl() === sliderUrl) {
				release();
			}
		}
		function release() {
			if (isReleased) {
				return;
			}
			isReleased = true;
			eventEmitter.unsubscribe(ContactSavedEvent, handleContactSaved);
			eventEmitter.unsubscribe(SliderClosedEvent, handleSliderClosed);
			lifecycle?.release();
			onClose?.();
		}
		eventEmitter.subscribe(ContactSavedEvent, handleContactSaved);
		eventEmitter.subscribe(SliderClosedEvent, handleSliderClosed, {
			compatMode: true
		});
	}
	function bindDialogLifecycle(dialog, onDestroy) {
		if (!isDialogAlive(dialog)) {
			return null;
		}
		let isReleased = false;
		let isDestroyed = false;
		function handleDestroy() {
			isDestroyed = true;
			release();
			onDestroy?.();
		}
		function release() {
			if (isReleased) {
				return;
			}
			isReleased = true;
			if (isDialogSubscribable(dialog)) {
				dialog.unsubscribe('onDestroy', handleDestroy);
			}
		}
		dialog.subscribe('onDestroy', handleDestroy);
		return {
			isAlive() {
				return !isDestroyed && isDialogAlive(dialog);
			},
			release
		};
	}
	function isDialogAlive(dialog) {
		return dialog.destroyed !== true && isDialogSubscribable(dialog);
	}
	function isDialogSubscribable(dialog) {
		return main_core.Type.isFunction(dialog.subscribe) && main_core.Type.isFunction(dialog.unsubscribe);
	}
	function addItemsToField(dialog, items) {
		let isAdded = false;
		items.forEach(savedItem => {
			if (Object.keys(savedItem).length === 0) {
				return;
			}
			const tabs = main_core.Type.isArray(savedItem.tabs) ? savedItem.tabs : [];
			const options = {
				...savedItem,
				sort: AddedItemSort,
				tabs: [...tabs, dialog.getRecentTab().getId()]
			};
			dialog.removeItem(options);
			const item = dialog.addItem(options);
			if (item) {
				item.select();
				isAdded = true;
			}
		});
		if (isAdded) {
			dialog.clearSearch();
		}
	}
	function renderEmptySearchText() {
		const help = main_core.Tag.render`
		<button
			type="button"
			class="mail-compose-address-book-help"
			data-testid="mail-compose-address-book-help"
			aria-label="${loc(Phrase.AddressBookEmptyHelpLabel)}"
			onclick="${showHelpArticle}"
		>${loc(Phrase.AddressBookEmptyHelp)}</button>
	`;
		return main_core.Tag.render`<span>${loc(Phrase.AddressBookEmptyText)}<br>${help}</span>`;
	}
	function showHelpArticle() {
		const helper = window.top?.BX?.Helper;
		helper?.show(`redirect=detail&code=${AddressBookHelpArticle}`);
	}
	function nextSliderPrefix() {
		sliderSequence += 1;
		return sliderSequence;
	}

	const RecipientDialogContext = 'MAIN_MAIL_FROM';
	const CrmAppearanceFilter = 'mail.mailCrmRecipientAppearanceFilter';
	const UserAppearanceFilter = 'mail.mailUserRecipientAppearanceFilter';
	const CrmEntity = Object.freeze(['contact', 'company', 'lead']);
	function toRecipientElement(item) {
		const avatar = item.getAvatar();
		return {
			id: item.getId(),
			entityId: item.getEntityId(),
			...(avatar ? {
				avatar
			} : {}),
			customData: Object.fromEntries(item.getCustomData())
		};
	}
	function toRecipientElements(items) {
		const elements = [];
		const known = new Set();
		items.forEach(item => {
			const element = toRecipientElement(item);
			const key = `${element.entityId}:${String(element.id)}`;
			if (!known.has(key)) {
				known.add(key);
				elements.push(element);
			}
		});
		return elements;
	}
	function getCrmEntities() {
		return CrmEntity.map(entityId => {
			return {
				id: entityId,
				dynamicLoad: true,
				dynamicSearch: true,
				filters: [{
					id: CrmAppearanceFilter
				}],
				options: {
					onlyWithEmail: true
				}
			};
		});
	}
	function getRecipientEntities() {
		return [{
			id: 'address_book',
			dynamicLoad: true
		}, ...getCrmEntities(), {
			id: 'mail_crm_recipient',
			dynamicLoad: true
		}, {
			id: 'user',
			filters: [{
				id: UserAppearanceFilter
			}],
			options: {
				showInvitationFooter: false,
				onlyWithEmail: true
			}
		}];
	}

	const TextBoxWidth = 220;
	const TagMaxWidth = 400;
	const RecipientFieldPhrase = {
		to: Phrase.FieldTo,
		cc: Phrase.FieldCc,
		bcc: Phrase.FieldBcc
	};
	const RecipientField = ui_vue3.defineComponent({
		name: 'MailComposeRecipientField',
		props: {
			field: {
				type: String,
				required: true
			}
		},
		emits: ['pickerClose'],
		setup() {
			return {
				state: useComposeState()
			};
		},
		data() {
			return {
				selector: null,
				isPickerOpen: false,
				restoreFocusAfterDraft: false
			};
		},
		computed: {
			isRequired() {
				return this.field === 'to';
			},
			hasRecipients() {
				return this.state.recipients[this.field].length > 0;
			}
		},
		watch: {
			'state.draft.isLoading': {
				handler(loading, wasLoading) {
					if (loading) {
						this.restoreFocusAfterDraft = this.$refs.field.contains(document.activeElement);
						return;
					}
					if (wasLoading && !loading) {
						const field = this.$refs.field;
						this.destroySelector();
						this.createSelector();
						if (this.restoreFocusAfterDraft) {
							this.selector?.showTextBox();
							this.selector?.focusTextBox();
							window.requestAnimationFrame(() => {
								window.requestAnimationFrame(() => {
									field.querySelector('[data-testid="ui-tag-selector-input"]')?.focus();
								});
							});
						}
						this.restoreFocusAfterDraft = false;
					}
				}
			}
		},
		mounted() {
			this.createSelector();
		},
		beforeUnmount() {
			this.destroySelector();
		},
		methods: {
			createSelector() {
				const container = this.$refs.field;
				const selector = ui_vue3.markRaw(new ui_entitySelector.TagSelector({
					id: this.selectorId(),
					textBoxWidth: TextBoxWidth,
					tagMaxWidth: TagMaxWidth,
					tagClickable: true,
					showAddButton: false,
					dialogOptions: {
						targetNode: container,
						id: this.selectorId(),
						context: RecipientDialogContext,
						entities: getRecipientEntities(),
						selectedItems: ui_vue3.toRaw(this.state.recipients[this.field]),
						...getAddressBookDialogOptions(),
						events: {
							'Search:onItemCreateAsync': event => this.handleContactCreate(event)
						}
					},
					events: {
						onAfterTagAdd: () => this.syncRecipients(),
						onAfterTagRemove: () => this.syncRecipients(),
						'TagItem:onClick': event => this.handleTagClick(event)
					}
				}));
				const dialog = selector.getDialog();
				dialog?.subscribe('onHide', this.handlePickerHide);
				this.selector = selector;
				selector.renderTo(container);
				if (this.isRequired) {
					main_core.Dom.attr(selector.getTextBox(), 'aria-required', 'true');
				}
			},
			destroySelector() {
				this.selector?.getDialog()?.destroy();
				this.selector = null;
				main_core.Dom.clean(this.$refs.field);
			},
			selectorId() {
				return `mail-compose-form-recipient-${this.field}`;
			},
			syncRecipients() {
				const dialog = this.selector?.getDialog();
				if (!dialog) {
					return;
				}
				this.state.recipients[this.field] = toRecipientElements(dialog.getSelectedItems());
				this.$el.dispatchEvent(new window.Event('input', {
					bubbles: true
				}));
			},
			openPicker() {
				const {
					$el,
					selector
				} = this;
				const dialog = selector?.getDialog();
				if (!selector || !dialog) {
					return;
				}
				this.isPickerOpen = true;
				main_core.Dom.addClass($el, '--editing');
				selector.showTextBox();
				selector.focusTextBox();
				dialog.show();
			},
			handlePickerHide() {
				const {
					$el,
					selector
				} = this;
				if (!selector) {
					return;
				}
				this.isPickerOpen = false;
				main_core.Dom.removeClass($el, '--editing');
				selector.hideAddButton();
				const field = $el;
				if (ui_a11y.FocusNavigator.isFocusLost() || field.contains(ui_a11y.FocusNavigator.getActiveElement())) {
					this.$emit('pickerClose');
				}
			},
			handleContactCreate(event) {
				const dialog = this.selector?.getDialog();
				if (!dialog) {
					return Promise.reject(new Error('Recipient field selector dialog is not available.'));
				}
				const {
					searchQuery
				} = event.getData();
				return createContact(dialog, searchQuery?.getQuery() ?? '');
			},
			handleTagClick(event) {
				const dialog = this.selector?.getDialog();
				const {
					item
				} = event.getData();
				if (dialog && item) {
					openContactOfTag(dialog, item);
				}
			}
		},
		template: `
		<div
			ref="field"
			class="mail-compose-recipient-field"
			:class="{
				'--empty': !hasRecipients,
				'--editing': isPickerOpen,
			}"
			role="group"
			:data-testid="'mail-compose-recipient-field-' + field"
		></div>
	`
	});

	const FieldOrder = ['to', 'cc', 'bcc'];
	function addTestId(field) {
		return `mail-compose-recipient-add-${field}`;
	}
	const RecipientRows = ui_vue3.defineComponent({
		name: 'MailComposeRecipientRows',
		components: {
			RecipientField,
			TextSm: ui_system_typography_vue.TextSm,
			UiButton: ui_vue3_components_button.Button
		},
		setup() {
			return {
				state: useComposeState(),
				addStyle: ui_vue3_components_button.AirButtonStyle.PLAIN_ACCENT,
				addSize: ui_vue3_components_button.ButtonSize.SMALL,
				addIcon: ui_iconSet_api_vue.Outline.PLUS_M,
				fields: {}
			};
		},
		computed: {
			rows() {
				return FieldOrder.filter(field => field !== 'bcc' || this.isBccExpanded).map(field => {
					return {
						field,
						label: loc(RecipientFieldPhrase[field]),
						labelId: `mail-compose-form-recipient-label-${field}`,
						addTestId: addTestId(field)
					};
				});
			},
			isBccExpanded() {
				return this.state.bccExpanded;
			},
			addText() {
				return loc(Phrase.FieldAdd);
			}
		},
		watch: {
			isBccExpanded(isExpanded) {
				if (isExpanded) {
					void this.$nextTick(() => {
						this.focusAddControl('bcc');
					});
				}
			}
		},
		methods: {
			setFieldRef(field, instance) {
				this.fields[field] = instance;
			},
			openPicker(field) {
				this.fields[field]?.openPicker();
			},
			focusAddControl(field) {
				const rows = this.$el;
				rows.querySelector(`[data-testid="${addTestId(field)}"]`)?.focus();
			}
		},
		template: `
		<div class="mail-compose-recipient-rows" data-testid="mail-compose-recipient-rows">
			<div
				v-for="row in rows"
				:key="row.field"
				class="mail-compose-recipient-rows__row"
				:data-testid="'mail-compose-recipient-row-' + row.field"
			>
				<TextSm
					:id="row.labelId"
					class-name="mail-compose-recipient-rows__label"
				>{{ row.label }}:</TextSm>
				<RecipientField
					:ref="(instance) => setFieldRef(row.field, instance)"
					:field="row.field"
					:aria-labelledby="row.labelId"
					@picker-close="focusAddControl(row.field)"
				/>
				<UiButton
					:text="addText"
					:style="addStyle"
					:size="addSize"
					:left-icon="addIcon"
					:dataset="{ testid: row.addTestId }"
					@click="openPicker(row.field)"
				/>
			</div>
		</div>
	`
	});

	const MenuWidth$1 = 300;
	const SenderSectionCode = 'sender';
	const MenuId$1 = 'mail-compose-sender-menu';
	function senderTitle(sender) {
		return sender.name === '' ? sender.email : sender.name;
	}
	const SenderChip = ui_vue3.defineComponent({
		name: 'MailComposeSenderChip',
		components: {
			BMenu: ui_system_menu_vue.BMenu,
			Chip: ui_system_chip_vue.Chip,
			TextSm: ui_system_typography_vue.TextSm
		},
		setup() {
			return {
				state: useComposeState(),
				chipDesign: ui_system_chip_vue.ChipDesign.Tinted,
				chipSize: ui_system_chip_vue.ChipSize.Md,
				menuWidth: MenuWidth$1,
				menuId: MenuId$1
			};
		},
		data() {
			return {
				isMenuShown: false
			};
		},
		computed: {
			sender() {
				return getSelectedSender(this.state);
			},
			chipText() {
				const {
					sender
				} = this;
				if (!sender) {
					return '';
				}
				return sender.name === '' ? sender.email : `${sender.name} (${sender.email})`;
			},
			label() {
				return loc(Phrase.SenderLabel);
			},
			chipImage() {
				const avatar = this.sender?.avatar;
				return avatar ? {
					src: avatar,
					alt: ''
				} : null;
			},
			menuItems() {
				return this.state.senders.map(sender => {
					return {
						sectionCode: SenderSectionCode,
						title: senderTitle(sender),
						subtitle: sender.email,
						isSelected: sender.formated === this.state.selectedSender,
						onClick: () => {
							this.handleSelect(sender);
						}
					};
				});
			},
			menuOptions() {
				return {
					bindElement: this.$refs.chip.$el,
					width: this.menuWidth,
					focusTrap: {
						initialFocus: true
					},
					sections: [{
						code: SenderSectionCode,
						title: loc(Phrase.SenderMenuTitle)
					}],
					items: this.menuItems
				};
			}
		},
		methods: {
			handleChipClick() {
				this.isMenuShown = true;
			},
			handleChipKeydown(event) {
				if (event.key === ' ') {
					event.preventDefault();
					this.isMenuShown = true;
				}
			},
			handleSelect(sender) {
				this.state.selectedSender = sender.formated;
				this.isMenuShown = false;
				void ui_vue3.nextTick(() => {
					this.$el?.dispatchEvent(new window.Event('input', {
						bubbles: true
					}));
				});
			}
		},
		template: `
		<div v-if="sender" class="mail-compose-sender-chip">
			<TextSm class-name="mail-compose-sender-chip__label">{{ label }}:</TextSm>
			<Chip
				ref="chip"
				class="mail-compose-sender-chip__control"
				role="button"
				:design="chipDesign"
				:size="chipSize"
				:text="chipText"
				:image="chipImage"
				rounded
				dropdown
				data-testid="mail-compose-sender-chip"
				@click="handleChipClick"
				@keydown="handleChipKeydown"
			/>
			<BMenu
				v-if="isMenuShown"
				:id="menuId"
				:options="menuOptions"
				@close="isMenuShown = false"
			/>
		</div>
	`
	});

	const TestId = Object.freeze({
		dialog: 'mail-compose-attachment-reminder',
		attach: 'mail-compose-attachment-reminder-attach',
		send: 'mail-compose-attachment-reminder-send'
	});
	const MaxAnalyzedLength = 100_000;
	const Proximity = 50;
	const RelationalTail = /^\s+to(\s|$)/;
	const RelationalTailLength = 5;
	const InlineImageSelector = 'img[src*="bxacid:"], img[src*="__bxacid="]';
	const RegExpMetaCharacter = /[$()*+.?[\\\]^{|}]/g;
	function hasAttachmentMention(text) {
		if (!main_core.Type.isStringFilled(text)) {
			return false;
		}
		const normalized = normalize(text);
		return hasStrongMarker(normalized) || hasVerbNearObject(normalized);
	}
	function createAttachmentReminder(params) {
		let isSkipped = false;
		return {
			check() {
				if (isSkipped) {
					isSkipped = false;
					return false;
				}
				if (!params.state.attachmentReminder.enabled) {
					return false;
				}
				const message = readNewMessage(params.editor);
				if (hasAttachment(params.editor, message) || !hasAttachmentMention(message.text)) {
					return false;
				}
				showReminder(() => {
					isSkipped = true;
					params.sendAnyway();
				});
				return true;
			}
		};
	}
	function readNewMessage(editor) {
		const bodyDocument = new DOMParser().parseFromString(editor.getBody(), 'text/html');
		Object.values(editor.bodyNodes).forEach(nodeId => {
			const node = bodyDocument.getElementById(nodeId);
			if (node) {
				main_core.Dom.remove(node);
			}
		});
		return {
			text: bodyDocument.body.textContent ?? '',
			hasInlineImage: bodyDocument.body.querySelector(InlineImageSelector) !== null
		};
	}
	function hasAttachment(editor, message) {
		return editor.getFiles().length > 0 || message.hasInlineImage;
	}
	function showReminder(sendAnyway) {
		const box = ui_dialogs_messagebox.MessageBox.create({
			title: loc(Phrase.AttachmentReminderTitle),
			message: loc(Phrase.AttachmentReminderText),
			buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
			okCaption: loc(Phrase.AttachmentReminderAttach),
			cancelCaption: loc(Phrase.AttachmentReminderSend),
			popupOptions: {
				closeByEsc: true
			},
			onOk: () => true,
			onCancel: () => {
				sendAnyway();
				return true;
			}
		});
		markMessageBox(box, {
			dialog: TestId.dialog,
			ok: TestId.attach,
			cancel: TestId.send
		});
		box.show();
	}
	function normalize(text) {
		return text.slice(0, MaxAnalyzedLength).toLowerCase().replaceAll('ё', 'е').replaceAll(/-\s*[\n\r]+\s*/g, '').replaceAll(/\s+/g, ' ');
	}
	function toRegExp(phraseCode) {
		const roots = loc(phraseCode).split('|').map(root => root.trim()).filter(root => root !== '').map(root => root.replaceAll(RegExpMetaCharacter, '\\$&'));
		return roots.length === 0 ? null : new RegExp(roots.join('|'), 'gi');
	}
	function findSpans(text, regExp) {
		if (!regExp) {
			return [];
		}
		return [...text.matchAll(regExp)].map(match => {
			const start = match.index ?? 0;
			return {
				start,
				end: start + match[0].length
			};
		});
	}
	function hasStrongMarker(text) {
		const markers = toRegExp(Phrase.AttachmentMentionPatterns);
		if (!markers) {
			return false;
		}
		return [...text.matchAll(markers)].some(match => {
			const end = (match.index ?? 0) + match[0].length;
			return !RelationalTail.test(text.slice(end, end + RelationalTailLength));
		});
	}
	function hasVerbNearObject(text) {
		const verbs = findSpans(text, toRegExp(Phrase.AttachmentMentionVerbs));
		if (verbs.length === 0) {
			return false;
		}
		const objects = findSpans(text, toRegExp(Phrase.AttachmentMentionObjects));
		if (objects.length === 0) {
			return false;
		}
		let verbIndex = 0;
		let objectIndex = 0;
		while (verbIndex < verbs.length && objectIndex < objects.length) {
			const verb = verbs[verbIndex];
			const object = objects[objectIndex];
			const isVerbFirst = verb.start < object.start;
			const gap = isVerbFirst ? object.start - verb.end : verb.start - object.end;
			if (gap <= Proximity) {
				return true;
			}
			if (isVerbFirst) {
				verbIndex += 1;
			} else {
				objectIndex += 1;
			}
		}
		return false;
	}

	const StrictParam = Object.freeze({
		strict: 'N'
	});
	const closeComposeFormKey = Symbol('mail-compose-form-close');
	const noop$1 = () => {};
	function useCloseComposeForm() {
		return ui_vue3.inject(closeComposeFormKey, noop$1);
	}
	function releaseComposeForm(destroyForm) {
		try {
			destroyForm();
		} finally {
			main_sidepanel.SidePanel.Instance.getSliderByWindow(window)?.setCacheable(false);
		}
	}
	function closeComposeForm(params) {
		try {
			releaseComposeForm(params.destroyForm);
		} finally {
			const slider = main_sidepanel.SidePanel.Instance.getSliderByWindow(window);
			if (slider) {
				slider.close();
			} else {
				leaveToList(params.paths);
			}
		}
	}
	function leaveToList(paths) {
		const path = paths.messageList ?? paths.home;
		if (path === '') {
			return;
		}
		main_core.Page.redirect(main_core.Uri.addParam(path, StrictParam));
	}

	const AutoHideDelay = 2000;
	function getPortalNotificationCenter() {
		const portalWindow = main_core.Page.getRootWindow();
		return portalWindow.BX?.UI?.Notification?.Center ?? null;
	}
	function notifyPortal(text) {
		getPortalNotificationCenter()?.notify({
			content: text,
			autoHideDelay: AutoHideDelay
		});
	}

	const DraftBodyNodeClass = Object.freeze({
		Signature: 'mail-compose-draft-signature',
		Quote: 'mail-compose-draft-quote'
	});
	const DraftSignatureSelectionClassPrefix = 'mail-compose-draft-signature-selection-';
	const AddressBookEntity = 'address_book';
	const AddressBookAvatar = '/bitrix/images/mail/entity_provider_icons/addressbook.svg';
	const LegacyChangedEvent = 'MailForm:compose:changed';
	const LegacyDestroyEvent = 'MailForm:destroy';
	const LegacyBeforeCloseEvent = 'MailForm:beforeClose';
	const LegacyBeforeSubmitEvent = 'MailForm:beforeSubmit';
	const LegacySubmitSuccessEvent = 'MailForm:submit:ajaxSuccess';
	const DraftBridgeEvent = Object.freeze({
		BeforeClose: 'BX.Mail.Client.ComposeForm:beforeClose',
		BeforeSubmit: 'BX.Mail.Client.ComposeForm:beforeSubmit',
		SubmitAjaxSuccess: 'BX.Mail.Client.ComposeForm:submitAjaxSuccess'
	});
	class DraftComposeAdapter {
		#params;
		#restored = false;
		#active = true;
		#subscriptions = new Map();
		#ready;
		#resolveReady = () => {};
		#unsubscribeReady = () => {};
		#attachmentSources = new Map();
		#largeAttachments = [];
		#draftLoadingHeld = false;
		#draftEnabled;
		#draftLoadingEnabled;
		#restoredSignatureId;
		constructor(params) {
			this.#params = params;
			this.#draftEnabled = main_core.Type.isStringFilled(params.state.draft.clientId);
			this.#draftLoadingEnabled = this.#draftEnabled && params.state.draft.id > 0;
			this.#ready = new Promise(resolve => {
				this.#resolveReady = resolve;
				this.#unsubscribeReady = params.editor.subscribeReady(resolve);
			});
		}
		get restored() {
			return this.#restored;
		}
		get largeAttachments() {
			return this.#largeAttachments;
		}
		getComposeSnapshot() {
			const {
				editor,
				state
			} = this.#params;
			const sender = getSelectedSender(state);
			const liveLargeAttachments = this.#params.getLargeAttachments?.();
			return {
				clientId: state.draft.clientId,
				sender: sender ? {
					name: sender.name,
					email: sender.email
				} : null,
				to: state.recipients.to.map(item => toDraftRecipient(item)),
				cc: state.recipients.cc.map(item => toDraftRecipient(item)),
				bcc: state.recipients.bcc.map(item => toDraftRecipient(item)),
				subject: state.subject,
				body: this.#getMarkedDraftBody(),
				bodyFormat: 'html',
				mode: state.scenario === 'replyAll' ? 'reply' : state.scenario,
				parentMessageId: state.parentMessageId,
				attachments: editor.getFiles().map(file => this.#attachmentSources.get(file.fileId) ?? {
					source: file.id === null ? 'upload' : 'disk',
					id: file.id === null ? file.fileId : String(file.id)
				}),
				largeAttachments: liveLargeAttachments ?? this.#largeAttachments
			};
		}
		waitForDraftReady() {
			return this.#ready;
		}
		async applyComposeSnapshot(snapshot, attachments = []) {
			await this.#ready;
			if (!this.#active) {
				return;
			}
			const selectedSender = resolveSender(this.#params.state, snapshot.sender);
			if (snapshot.sender && !selectedSender) {
				throw new Error('Draft sender is unavailable.');
			}
			if (!(await this.#params.editor.replaceFiles(attachments))) {
				throw new Error('Draft attachments cannot be restored.');
			}
			const state = this.#params.state;
			state.selectedSender = selectedSender;
			state.recipients.to = snapshot.to.map(recipient => toRecipientItem(recipient));
			state.recipients.cc = snapshot.cc.map(recipient => toRecipientItem(recipient));
			state.recipients.bcc = snapshot.bcc.map(recipient => toRecipientItem(recipient));
			state.bccExpanded = state.recipients.bcc.length > 0;
			state.subject = snapshot.subject;
			state.scenario = snapshot.mode;
			state.parentMessageId = snapshot.parentMessageId;
			state.attachments.folded = false;
			this.#largeAttachments = snapshot.largeAttachments ?? [];
			await ui_vue3.nextTick();
			if (!this.#active) {
				return;
			}
			if (!this.#params.editor.setBody(this.#adoptDraftBodyNodes(snapshot.body))) {
				throw new Error('Draft body cannot be restored.');
			}
			if (this.#params.editor.getBodyNode(this.#params.editor.bodyNodes.quote)) {
				state.body.quoteFolded = false;
			}
			const signatureNode = this.#params.editor.getBodyNode(this.#params.editor.bodyNodes.signature);
			if (!signatureNode) {
				state.selectedSignatureId = null;
			} else if (!main_core.Type.isUndefined(this.#restoredSignatureId)) {
				state.selectedSignatureId = this.#restoredSignatureId;
			}
			this.syncDraftAttachmentSources(snapshot.attachments, attachments);
			this.#restored = true;
		}
		#adoptDraftBodyNodes(html) {
			const template = document.createElement('template');
			template.innerHTML = html;
			this.#restoredSignatureId = undefined;
			const signatureNode = this.#adoptDraftBodyNode(template.content, BodyNodePrefix.Signature, this.#params.editor.bodyNodes.signature, DraftBodyNodeClass.Signature);
			if (signatureNode) {
				const selectionClass = [...signatureNode.classList].find(className => className.startsWith(DraftSignatureSelectionClassPrefix));
				if (selectionClass) {
					const value = selectionClass.slice(DraftSignatureSelectionClassPrefix.length);
					const signatureId = Number(value);
					if (value === 'none') {
						this.#restoredSignatureId = null;
					} else if (Number.isInteger(signatureId) && signatureId > 0) {
						this.#restoredSignatureId = signatureId;
					}
					main_core.Dom.removeClass(signatureNode, selectionClass);
					if ((signatureNode.getAttribute('class') ?? '').trim() === '') {
						signatureNode.removeAttribute('class');
					}
				}
			}
			this.#adoptDraftBodyNode(template.content, BodyNodePrefix.Quote, this.#params.editor.bodyNodes.quote, DraftBodyNodeClass.Quote);
			return template.innerHTML;
		}
		#adoptDraftBodyNode(body, prefix, currentId, markerClass) {
			const nodes = [...body.children].filter(node => main_core.Dom.hasClass(node, markerClass) || node.id === prefix || node.id.startsWith(`${prefix}-`));
			const [node, ...duplicates] = nodes;
			if (node) {
				node.id = currentId;
				main_core.Dom.removeClass(node, markerClass);
				if ((node.getAttribute('class') ?? '').trim() === '') {
					node.removeAttribute('class');
				}
			}
			duplicates.forEach(duplicate => duplicate.remove());
			return node ?? null;
		}
		#getMarkedDraftBody() {
			const markedNodes = [[this.#params.editor.bodyNodes.signature, DraftBodyNodeClass.Signature], [this.#params.editor.bodyNodes.quote, DraftBodyNodeClass.Quote]].map(([nodeId, markerClass]) => {
				const node = this.#params.editor.getBodyNode(nodeId);
				if (node) {
					main_core.Dom.addClass(node, markerClass);
				}
				return [node, markerClass];
			});
			const signatureNode = this.#params.editor.getBodyNode(this.#params.editor.bodyNodes.signature);
			const signatureSelectionClass = `${DraftSignatureSelectionClassPrefix}${this.#params.state.selectedSignatureId ?? 'none'}`;
			if (signatureNode) {
				main_core.Dom.addClass(signatureNode, signatureSelectionClass);
			}
			try {
				return this.#params.editor.getBody();
			} finally {
				if (signatureNode) {
					main_core.Dom.removeClass(signatureNode, signatureSelectionClass);
				}
				markedNodes.forEach(([node, markerClass]) => {
					if (node) {
						main_core.Dom.removeClass(node, markerClass);
					}
				});
			}
		}
		syncDraftAttachmentSources(canonicalSources, attachments, submittedSources = []) {
			const files = this.#params.editor.getFiles();
			const currentSources = files.map(file => this.#attachmentSources.get(file.fileId) ?? {
				source: file.id === null ? 'upload' : 'disk',
				id: file.id === null ? file.fileId : String(file.id)
			});
			const previousSources = new Map(this.#attachmentSources);
			this.#attachmentSources.clear();
			if (submittedSources.length > 0) {
				files.forEach((file, fileIndex) => {
					const source = currentSources[fileIndex];
					const submittedIndex = submittedSources.findIndex(submittedSource => submittedSource.source === source.source && submittedSource.id === source.id);
					const canonicalSource = canonicalSources[submittedIndex];
					if (canonicalSource) {
						this.#attachmentSources.set(file.fileId, canonicalSource);
					} else {
						const previousSource = previousSources.get(file.fileId);
						if (previousSource) {
							this.#attachmentSources.set(file.fileId, previousSource);
						}
					}
				});
				return;
			}
			attachments.forEach((attachment, index) => {
				const source = canonicalSources[index];
				if (source) {
					this.#attachmentSources.set(`n${attachment.id}`, source);
				}
			});
		}
		setDraftLoading(loading) {
			if (!this.#draftLoadingEnabled) {
				return;
			}
			if (!loading && this.#draftLoadingHeld) {
				return;
			}
			this.#applyDraftLoading(loading);
		}
		holdDraftLoading() {
			if (!this.#draftLoadingEnabled) {
				return;
			}
			this.#draftLoadingHeld = true;
			this.#applyDraftLoading(true);
		}
		releaseDraftLoading() {
			if (!this.#draftLoadingEnabled) {
				return;
			}
			this.#draftLoadingHeld = false;
			this.#applyDraftLoading(false);
		}
		#applyDraftLoading(loading) {
			this.#params.state.draft.isLoading = loading;
			this.#params.onLoadingChange?.(loading);
		}
		setDraftRestoreFailed(failed) {
			this.#params.state.draft.restoreFailed = failed;
		}
		showError(message) {
			this.#params.state.errors = [{
				message,
				code: null
			}];
		}
		getDraftLifecycleToken() {
			return this.#active ? 0 : 1;
		}
		isDraftLifecycleActive(token) {
			return this.#active && token === 0;
		}
		subscribe(eventName, handler) {
			const composeEvent = resolveComposeEvent(eventName);
			if (!composeEvent) {
				return;
			}
			const listener = event => {
				if (event.getData()?.formId === this.#params.formId) {
					handler(event.getData()?.data);
				}
			};
			this.#subscriptions.set(handler, {
				eventName: composeEvent,
				listener
			});
			main_core_events.EventEmitter.subscribe(composeEvent, listener);
		}
		unsubscribe(eventName, handler) {
			const subscription = this.#subscriptions.get(handler);
			if (subscription) {
				main_core_events.EventEmitter.unsubscribe(subscription.eventName, subscription.listener);
				this.#subscriptions.delete(handler);
			}
		}
		destroy() {
			this.#active = false;
			this.#unsubscribeReady();
			this.#resolveReady();
			this.#subscriptions.forEach(({
				eventName,
				listener
			}) => {
				main_core_events.EventEmitter.unsubscribe(eventName, listener);
			});
			this.#subscriptions.clear();
		}
	}
	function resolveComposeEvent(eventName) {
		if (eventName === LegacyChangedEvent) {
			return ComposeFormEvent.Changed;
		}
		if (eventName === LegacyDestroyEvent) {
			return ComposeFormEvent.Destroy;
		}
		if (eventName === LegacyBeforeCloseEvent) {
			return DraftBridgeEvent.BeforeClose;
		}
		if (eventName === LegacyBeforeSubmitEvent) {
			return DraftBridgeEvent.BeforeSubmit;
		}
		if (eventName === LegacySubmitSuccessEvent) {
			return DraftBridgeEvent.SubmitAjaxSuccess;
		}
		return null;
	}
	function toDraftRecipient(item) {
		const customData = item.customData;
		const entityId = Number(customData?.entityId ?? item.id);
		const title = item.title;
		const name = customData?.name ?? customData?.title ?? (main_core.Type.isString(title) ? title : title?.text);
		return {
			name: String(name ?? ''),
			email: String(customData?.email ?? item.id),
			entityType: item.entityId,
			...(entityId > 0 ? {
				entityId
			} : {}),
			...(item.entityId !== AddressBookEntity && main_core.Type.isStringFilled(item.avatar) ? {
				avatar: item.avatar
			} : {})
		};
	}
	function toRecipientItem(recipient) {
		const title = recipient.name || recipient.email;
		return {
			id: recipient.email,
			entityId: recipient.entityType ?? AddressBookEntity,
			title,
			...(recipient.avatar ? {
				avatar: recipient.avatar
			} : {}),
			...(!recipient.avatar && (recipient.entityType === AddressBookEntity || !recipient.entityType) ? {
				avatar: AddressBookAvatar
			} : {}),
			customData: {
				name: title,
				email: recipient.email,
				entityType: recipient.entityType ?? AddressBookEntity,
				entityId: recipient.entityId
			}
		};
	}
	function resolveSender(state, sender) {
		if (!sender) {
			return null;
		}
		const email = sender.email.trim().toLowerCase();
		return state.senders.find(item => item.email.trim().toLowerCase() === email)?.formated ?? null;
	}

	const SuccessStatus = 'success';
	async function sendMessage(params) {
		const {
			state,
			editor,
			largeAttachment,
			writeFields,
			formId
		} = params;
		if (state.isSending) {
			return;
		}
		if (isSelectedSenderMigrationActive(state)) {
			return;
		}
		if (!passesChecks(params)) {
			return;
		}
		if (largeAttachment && !largeAttachment.prepareSend()) {
			return;
		}
		const body = buildMessageBody(editor, state.body);
		if (body === null) {
			state.errors = [{
				message: loc(Phrase.ErrorQuoteLost),
				code: null
			}];
			return;
		}
		state.isSending = true;
		try {
			const draftWait = getDraftWait(DraftBridgeEvent.BeforeSubmit, formId);
			if (draftWait) {
				try {
					await draftWait;
				} catch {
					state.errors = [{
						message: loc(Phrase.ErrorSendFailed),
						code: null
					}];
					emitFormEvent(ComposeFormEvent.SendError, formId);
					return;
				}
			}
			const form = writeFields(body);
			if (!form) {
				state.errors = [{
					message: loc(Phrase.ErrorSendFailed),
					code: null
				}];
				return;
			}
			const submitted = {
				formId,
				body
			};
			main_core_events.EventEmitter.emit(ComposeFormEvent.Submit, submitted);
			await deliver(params, form);
		} finally {
			state.isSending = false;
		}
	}
	function passesChecks(params) {
		const {
			state,
			editor,
			reminder
		} = params;
		state.errors = validateMessage({
			state,
			files: editor.getFiles()
		});
		if (state.errors.length > 0) {
			return false;
		}
		return !reminder.check();
	}
	async function deliver(params, form) {
		const {
			state,
			formId
		} = params;
		const errors = await send(form);
		if (errors === null) {
			main_core_events.EventEmitter.emit(DraftBridgeEvent.SubmitAjaxSuccess, {
				formId,
				data: {}
			});
			emitFormEvent(ComposeFormEvent.SendSuccess, formId);
			finishSuccessfulSend(params);
			return;
		}
		state.errors = errors;
		emitFormEvent(ComposeFormEvent.SendError, formId);
	}
	function getDraftWait(eventName, formId) {
		const pending = [];
		main_core_events.EventEmitter.emit(eventName, {
			formId,
			data: {
				waitUntil: promise => {
					pending.push(promise);
				}
			}
		});
		return pending.length > 0 ? Promise.all(pending).then(() => {}) : null;
	}
	function finishSuccessfulSend(params) {
		main_sidepanel.SidePanel.Instance.postMessage(window, SliderMessage.MessageCreated, {});
		notifyPortal(loc(Phrase.SendSuccess));
		params.closeForm();
	}
	async function send(form) {
		try {
			const response = await Api.sendMessage(form);
			return response.status === SuccessStatus ? null : toComposeErrors(response.errors);
		} catch {
			return toComposeErrors();
		}
	}
	function toComposeErrors(errors) {
		const known = (errors ?? []).map(error => {
			const code = String(error.code ?? '');
			return {
				message: error.message,
				code: code === '' ? null : code
			};
		});
		return known.length > 0 ? known : [{
			message: loc(Phrase.ErrorSendFailed),
			code: null
		}];
	}
	function emitFormEvent(eventName, formId) {
		const payload = {
			formId
		};
		main_core_events.EventEmitter.emit(eventName, payload);
	}

	const CorePhrase = Object.freeze({
		IndicatorLabel: 'MAIL_LARGE_ATTACHMENT_INDICATOR_LABEL',
		AhaText: 'MAIL_LARGE_ATTACHMENT_AHA_TEXT',
		UploadError: 'MAIL_LARGE_ATTACHMENT_UPLOAD_ERROR',
		NoSpaceText: 'MAIL_LARGE_ATTACHMENT_NO_SPACE_TEXT',
		Retry: 'MAIL_LARGE_ATTACHMENT_RETRY'
	});
	const IndicatorTestId = 'mail-large-attachment-indicator';
	const RetryTestId = 'mail-large-attachment-retry-button';
	const AhaTestId = 'mail-large-attachment-aha-guide';
	const ErrorTestId = 'mail-compose-large-attachment-error';
	const UploaderEvent = Object.freeze({
		ItemAdd: 'BX.Disk.Uploader.Integration:Item:onAdd',
		ItemComplete: 'BX.Disk.Uploader.Integration:Item:onComplete',
		ItemRemove: 'BX.Disk.Uploader.Integration:Item:onRemove'
	});
	const ContractField = 'data[__largeAttachments]';
	const LimitSliderCode = 'limit_v2_mail_large_attachment_disk_upload';
	const UserOptionCategory = 'mail.guide';
	const AhaPopupId = 'mail-compose-form-large-attachment-aha';
	const AhaPopupWidth = 320;
	const AhaAutoDismissDelay = 12000;
	const noop = () => {};
	const coreLoc = phraseCode => main_core.Loc.getMessage(phraseCode) ?? '';
	const largeAttachmentGateKey = Symbol('mail-compose-form-large-attachment-gate');
	const resolveNoGate = () => null;
	function useLargeAttachmentGate() {
		return ui_vue3.inject(largeAttachmentGateKey, resolveNoGate);
	}
	const LargeAttachmentNotice = ui_vue3.defineComponent({
		name: 'MailComposeLargeAttachmentNotice',
		components: {
			Alert: ui_system_alert_vue.Alert,
			UiButton: ui_vue3_components_button.Button
		},
		props: {
			design: {
				type: String,
				required: true
			},
			text: {
				type: String,
				required: true
			},
			testId: {
				type: String,
				required: true
			},
			liveRole: {
				type: String,
				required: true
			},
			actionText: {
				type: String,
				default: ''
			},
			hasCloseButton: {
				type: Boolean,
				default: false
			}
		},
		emits: ['action', 'close'],
		setup() {
			return {
				retryTestId: RetryTestId,
				actionStyle: ui_vue3_components_button.AirButtonStyle.PLAIN,
				actionSize: ui_vue3_components_button.ButtonSize.SMALL
			};
		},
		template: `
		<div
			class="mail-compose-large-attachment-notice"
			:data-testid="testId"
			:role="liveRole"
		>
			<Alert :design="design" :hasCloseButton="hasCloseButton" @closeButtonClick="$emit('close')">
				{{ text }}
				<span v-if="actionText !== ''" class="mail-compose-large-attachment-notice__action">
					<UiButton
						:text="actionText"
						:style="actionStyle"
						:size="actionSize"
						:dataset="{ testid: retryTestId }"
						@click="$emit('action')"
					/>
				</span>
			</Alert>
		</div>
	`
	});
	function parseInsertedNode(html) {
		const parsed = new DOMParser().parseFromString(html, 'text/html').body.firstElementChild;
		return parsed instanceof HTMLElement ? document.importNode(parsed, true) : null;
	}
	class LargeAttachmentAdapter {
		formId;
		#containerId;
		#editor;
		#core = null;
		#showAhaHint;
		#ahaOptionName;
		#hintQueue;
		#ahaPopup = null;
		#ahaTimer = null;
		#isAhaShown = false;
		#indicator = null;
		#error = null;
		#teardown = new Set();
		#isDestroyed = false;
		constructor(params) {
			this.formId = params.formId;
			this.#containerId = params.containerId;
			this.#editor = params.editor;
			this.#showAhaHint = params.showAha;
			this.#ahaOptionName = params.ahaOptionName;
			this.#hintQueue = params.hintQueue ?? (show => {
				ui_bannerDispatcher.BannerDispatcher.normal.toQueue(show);
			});
		}
		setCore(core) {
			this.#core = core;
		}
		prepareSend() {
			const state = this.#core?.prepareSubmit() ?? 'ready';
			if (state === 'pending') {
				this.#showError(loc(Phrase.LargeAttachmentUploading));
				return false;
			}
			if (state === 'error') {
				this.#showError(loc(Phrase.LargeAttachmentLinkLost));
				return false;
			}
			return true;
		}
		getDraftState() {
			return this.#core?.getDraftState() ?? [];
		}
		getFiles() {
			return this.#editor.getFiles().map(file => ({
				id: file.id,
				size: file.size
			}));
		}
		getBody() {
			return this.#editor.getBody();
		}
		insertBody(text, html) {
			const node = parseInsertedNode(html);
			if (!node) {
				return false;
			}
			const positions = [{
				at: 'caret'
			}, {
				at: 'end'
			}];
			const inserted = positions.some(position => this.#editor.insertNode(node, position));
			if (inserted) {
				this.#notifyChanged();
			}
			return inserted;
		}
		setBody(html) {
			const changed = this.#editor.setBody(html);
			if (changed) {
				this.#notifyChanged();
			}
			return changed;
		}
		serializeSendContracts(contracts) {
			const form = document.getElementById(this.formId);
			if (!(form instanceof HTMLFormElement)) {
				return false;
			}
			form.querySelectorAll(`input[name^="${ContractField}"]`).forEach(input => {
				main_core.Dom.remove(input);
			});
			contracts.forEach((contract, index) => {
				main_core.Dom.append(renderContractField(`${ContractField}[${index}][token]`, contract.token), form);
				contract.fileIds.forEach(fileId => {
					main_core.Dom.append(renderContractField(`${ContractField}[${index}][fileIds][]`, String(fileId)), form);
				});
			});
			return true;
		}
		syncIndicator(fileIds) {
			if (fileIds.length === 0) {
				this.#indicator = unmountNotice(this.#indicator);
				return;
			}
			if (this.#indicator || this.#isDestroyed) {
				return;
			}
			this.#indicator = this.#mountNotice({
				design: ui_system_alert.AlertDesign.tinted,
				text: coreLoc(CorePhrase.IndicatorLabel),
				testId: IndicatorTestId,
				liveRole: 'status'
			});
		}
		showUploadError(onRetry) {
			this.#showError(coreLoc(CorePhrase.UploadError), onRetry);
		}
		showNoSpaceError(onRetry) {
			this.#showError(coreLoc(CorePhrase.NoSpaceText), onRetry);
		}
		showTariffUnavailable() {
			ui_infoHelper.FeaturePromotersRegistry.getPromoter({
				code: LimitSliderCode
			}).show();
		}
		showAha() {
			const anchor = this.#resolveAhaAnchor();
			if (this.#isDestroyed || this.#isAhaShown || !this.#showAhaHint || !anchor) {
				return;
			}
			this.#isAhaShown = true;
			this.#hintQueue(onDone => {
				this.#ahaPopup = this.#createAhaPopup(anchor, onDone);
				this.#ahaPopup.show();
				this.#saveShownMark();
				this.#ahaTimer = window.setTimeout(() => {
					this.#ahaPopup?.close();
				}, AhaAutoDismissDelay);
				return this.#ahaPopup;
			});
		}
		subscribeFileChange(handler) {
			const unsubscribes = [this.#subscribeGlobal(UploaderEvent.ItemAdd, () => handler('add')), this.#subscribeGlobal(UploaderEvent.ItemComplete, () => handler('complete')), this.#subscribeGlobal(UploaderEvent.ItemRemove, () => handler('remove'))];
			return () => {
				unsubscribes.forEach(unsubscribe => {
					unsubscribe();
				});
			};
		}
		subscribeSubmit(handler) {
			return this.#subscribeFormEvent(ComposeFormEvent.Submit, payload => {
				handler(payload.body);
			});
		}
		subscribeSendSuccess(handler) {
			return this.#subscribeFormEvent(ComposeFormEvent.SendSuccess, handler);
		}
		subscribeSendError(handler) {
			return this.#subscribeFormEvent(ComposeFormEvent.SendError, handler);
		}
		subscribeDestroy(handler) {
			return this.#subscribeFormEvent(ComposeFormEvent.Destroy, handler);
		}
		destroy() {
			if (this.#isDestroyed) {
				return;
			}
			this.#isDestroyed = true;
			this.#teardown.forEach(unsubscribe => {
				unsubscribe();
			});
			this.#teardown.clear();
			this.#closeAha();
			this.#error = unmountNotice(this.#error);
			this.#indicator = unmountNotice(this.#indicator);
			this.#core = null;
		}
		#notifyChanged() {
			main_core_events.EventEmitter.emit(ComposeFormEvent.Changed, {
				formId: this.formId,
				reason: 'user'
			});
		}
		#showError(text, onRetry) {
			if (this.#isDestroyed) {
				return;
			}
			this.#error = unmountNotice(this.#error);
			this.#error = this.#mountNotice({
				design: ui_system_alert.AlertDesign.tintedAlert,
				text,
				testId: ErrorTestId,
				liveRole: 'alert',
				hasCloseButton: true,
				actionText: onRetry ? coreLoc(CorePhrase.Retry) : '',
				onAction: () => {
					this.#hideError();
					onRetry?.();
				},
				onClose: () => {
					this.#hideError();
				}
			});
		}
		#hideError() {
			this.#error = unmountNotice(this.#error);
		}
		#mountNotice(props) {
			const container = this.#resolveNoticeContainer();
			if (!container) {
				return null;
			}
			const host = main_core.Dom.create('div', {
				props: {
					className: 'mail-compose-form__notice'
				}
			});
			main_core.Dom.append(host, container);
			const app = ui_vue3.BitrixVue.createApp(LargeAttachmentNotice, props);
			app.mount(host);
			return {
				app,
				host
			};
		}
		#resolveNoticeContainer() {
			return this.#resolveFormNode(NoticesTestId);
		}
		#resolveAhaAnchor() {
			return this.#resolveFormNode(AttachmentAnchorTestId);
		}
		#resolveFormNode(testId) {
			return document.getElementById(this.#containerId)?.querySelector(`[data-testid="${testId}"]`) ?? null;
		}
		#createAhaPopup(anchor, onDone) {
			const content = main_core.Dom.create('div', {
				props: {
					className: 'mail-compose-large-attachment-aha'
				},
				attrs: {
					'data-testid': AhaTestId
				},
				text: coreLoc(CorePhrase.AhaText)
			});
			return main_popup.PopupManager.create({
				id: AhaPopupId,
				bindElement: anchor,
				content,
				width: AhaPopupWidth,
				closeIcon: true,
				autoHide: true,
				closeByEsc: true,
				cacheable: false,
				angle: {
					offset: 40,
					position: 'top'
				},
				events: {
					onClose: () => {
						onDone();
					}
				}
			});
		}
		#closeAha() {
			if (this.#ahaTimer !== null) {
				window.clearTimeout(this.#ahaTimer);
				this.#ahaTimer = null;
			}
			this.#ahaPopup?.close();
			this.#ahaPopup = null;
		}
		#saveShownMark() {
			if (!main_core.Type.isStringFilled(this.#ahaOptionName)) {
				return;
			}
			BX.userOptions?.save(UserOptionCategory, this.#ahaOptionName, null, 'Y');
		}
		#subscribeFormEvent(eventName, handler) {
			return this.#subscribeGlobal(eventName, event => {
				const payload = event.getData();
				if (payload?.formId === this.formId) {
					handler(payload);
				}
			});
		}
		#subscribeGlobal(eventName, listener) {
			if (this.#isDestroyed) {
				return noop;
			}
			main_core_events.EventEmitter.subscribe(eventName, listener);
			return this.#track(() => {
				main_core_events.EventEmitter.unsubscribe(eventName, listener);
			});
		}
		#track(unsubscribe) {
			this.#teardown.add(unsubscribe);
			return () => {
				this.#teardown.delete(unsubscribe);
				unsubscribe();
			};
		}
	}
	function renderContractField(name, value) {
		return main_core.Dom.create('input', {
			props: {
				type: 'hidden',
				name,
				value
			}
		});
	}
	function unmountNotice(notice) {
		if (notice) {
			notice.app.unmount();
			main_core.Dom.remove(notice.host);
		}
		return null;
	}

	const FieldsTestId = 'mail-compose-send-fields';
	const Field = Object.freeze({
		From: 'data[from]',
		Subject: 'data[subject]',
		Message: 'data[message]',
		InReplyTo: 'data[IN_REPLY_TO]',
		MailboxId: 'data[MAILBOX_ID]',
		DraftId: 'data[draftId]',
		DraftRevision: 'data[draftRevision]'
	});
	const RecipientFields = [{
		kind: 'to',
		name: 'data[to][]'
	}, {
		kind: 'cc',
		name: 'data[cc][]'
	}, {
		kind: 'bcc',
		name: 'data[bcc][]'
	}];
	function renderField(field) {
		return main_core.Dom.create('input', {
			props: {
				type: 'hidden',
				name: field.name,
				value: field.value
			}
		});
	}
	function getRecipientFields(state) {
		const fields = [];
		RecipientFields.forEach(field => {
			state.recipients[field.kind].forEach(item => {
				fields.push({
					name: field.name,
					value: JSON.stringify(item.customData ?? {})
				});
			});
		});
		return fields;
	}
	function getReplyFields(state) {
		const reply = getReplySendFields(state);
		if (!reply) {
			return [];
		}
		return [{
			name: Field.InReplyTo,
			value: reply.inReplyTo
		}, {
			name: Field.MailboxId,
			value: String(reply.mailboxId)
		}];
	}
	function getMessageFields(state, body) {
		const fields = [{
			name: Field.From,
			value: state.selectedSender ?? ''
		}, ...getRecipientFields(state), {
			name: Field.Subject,
			value: state.subject
		}, {
			name: Field.Message,
			value: body
		}, ...getReplyFields(state)];
		if (state.draft.id > 0 && state.draft.revision > 0) {
			fields.push({
				name: Field.DraftId,
				value: String(state.draft.id)
			}, {
				name: Field.DraftRevision,
				value: String(state.draft.revision)
			});
		}
		return fields;
	}
	const SendForm = ui_vue3.defineComponent({
		name: 'MailComposeSendForm',
		props: {
			formId: {
				type: String,
				required: true
			}
		},
		setup() {
			return {
				state: useComposeState(),
				editor: useComposeEditor(),
				resolveLargeAttachmentGate: useLargeAttachmentGate(),
				closeForm: useCloseComposeForm(),
				reminder: null,
				fieldsTestId: FieldsTestId
			};
		},
		methods: {
			submit() {
				void sendMessage({
					formId: this.formId,
					state: this.state,
					editor: this.editor,
					writeFields: this.writeFields,
					reminder: this.getReminder(),
					largeAttachment: this.resolveLargeAttachmentGate(),
					closeForm: this.closeForm
				});
			},
			getReminder() {
				const reminder = this.reminder ?? createAttachmentReminder({
					editor: this.editor,
					state: this.state,
					sendAnyway: this.submit
				});
				this.reminder = reminder;
				return reminder;
			},
			writeFields(body) {
				const host = this.$refs.fields;
				const form = host?.closest('form');
				if (!host || !form) {
					return null;
				}
				main_core.Dom.clean(host);
				getMessageFields(this.state, body).forEach(field => {
					main_core.Dom.append(renderField(field), host);
				});
				return form;
			}
		},
		template: `
		<div ref="fields" hidden :data-testid="fieldsTestId"></div>
	`
	});

	const ShowBccButton = ui_vue3.defineComponent({
		name: 'MailComposeShowBccButton',
		components: {
			UiButton: ui_vue3_components_button.Button
		},
		setup() {
			return {
				state: useComposeState(),
				buttonStyle: ui_vue3_components_button.AirButtonStyle.PLAIN_NO_ACCENT,
				buttonSize: ui_vue3_components_button.ButtonSize.SMALL
			};
		},
		computed: {
			isShown() {
				return !this.state.bccExpanded;
			},
			text() {
				return loc(Phrase.FieldBcc);
			}
		},
		methods: {
			handleClick() {
				this.state.bccExpanded = true;
			}
		},
		template: `
		<UiButton
			v-if="isShown"
			:text="text"
			:style="buttonStyle"
			:size="buttonSize"
			:dataset="{ testid: 'mail-compose-show-bcc' }"
			@click="handleClick"
		/>
	`
	});

	const ChoiceOption = Object.freeze({
		category: 'mail',
		name: 'signature_choice'
	});
	function normalizeSenderKey(value) {
		return main_core.Type.isStringFilled(value) ? value.replace(/ +$/, '').toLowerCase() : '';
	}
	function collectSignatures(bySender, sender) {
		const byKey = {};
		Object.keys(bySender).forEach(rawKey => {
			const key = normalizeSenderKey(rawKey);
			byKey[key] = [...(byKey[key] ?? []), ...(bySender[rawKey] ?? [])];
		});
		return [normalizeSenderKey(sender.formated), normalizeSenderKey(sender.email), ''].filter((key, index, keys) => keys.indexOf(key) === index).flatMap(key => byKey[key] ?? []);
	}
	function resolveDefaultSignature(list, choices, sender) {
		const signatures = list.filter(item => item.full !== '');
		const shared = signatures.find(item => item.isShared) ?? null;
		const own = signatures.find(item => !item.isShared) ?? null;
		const choice = parseChoice(choices[normalizeSenderKey(sender.formated)] ?? choices[normalizeSenderKey(sender.email)]);
		const assignedAt = shared?.assignedAt ?? 0;
		if (choice && signatures.some(item => item.signatureId === choice.id) && (!shared || assignedAt > 0 && choice.time > assignedAt)) {
			return choice.id;
		}
		return shared?.signatureId ?? own?.signatureId ?? null;
	}
	function rememberSignatureChoice(sender, signatureId) {
		const senderKey = buildChoiceKey(sender);
		if (signatureId <= 0 || senderKey === '') {
			return null;
		}
		const value = `${signatureId}:${Math.floor(Date.now() / 1000)}`;
		BX.userOptions.save(ChoiceOption.category, ChoiceOption.name, senderKey, value);
		return {
			senderKey,
			value
		};
	}
	function loadSignatures(settingsPath) {
		return Api.getSignatures().then(response => buildSignatures({
			bySender: response.data?.bySender,
			choices: response.data?.choices,
			settingsPath
		}));
	}
	function buildChoiceKey(sender) {
		const email = sender.email.trim();
		const name = sender.name.trim();
		return normalizeSenderKey(name !== '' && email !== '' ? `${name} <${email}>` : email);
	}
	function parseChoice(raw) {
		if (!main_core.Type.isStringFilled(raw)) {
			return null;
		}
		const [rawId, rawTime] = raw.split(':');
		const id = main_core.Text.toInteger(rawId);
		const time = main_core.Text.toInteger(rawTime);
		return id > 0 ? {
			id,
			time: time > 0 ? time : 0
		} : null;
	}

	const MenuWidth = 300;
	const MenuId = 'mail-compose-signature-menu';
	const MenuSection = Object.freeze({
		Signatures: 'signatures',
		Actions: 'actions'
	});
	const KindColor = Object.freeze({
		Shared: 'var(--ui-color-accent-main-primary)',
		Own: 'var(--ui-color-base-3)'
	});
	const ControlTestId = 'mail-compose-signature-name';
	const SignatureControlSpace = 68;
	const NameMaxLength = 40;
	const SignatureMark = '--<br>';
	const GraphemeExtendPattern = /^[\p{M}\p{Emoji_Modifier}\u{0E33}\u{0EB3}]$/u;
	const RegionalIndicatorPattern = /^\p{Regional_Indicator}$/u;
	const ExtendedPictographicPattern = /^\p{Extended_Pictographic}$/u;
	const DevanagariConsonantPattern = /^[\u{0915}-\u{0939}]$/u;
	const EmojiTagPattern = /^[\u{E0020}-\u{E007F}]$/u;
	const DevanagariVirama = '\u{094D}';
	const ZeroWidthJoiner = '\u{200D}';
	function isEmojiZwjContinuation(grapheme, current) {
		if (!ExtendedPictographicPattern.test(current)) {
			return false;
		}
		const symbols = [...grapheme];
		for (let index = symbols.length - 2; index >= 0; index--) {
			const symbol = symbols[index];
			if (GraphemeExtendPattern.test(symbol) || EmojiTagPattern.test(symbol)) {
				continue;
			}
			return ExtendedPictographicPattern.test(symbol);
		}
		return false;
	}
	function isViramaContinuation(grapheme, previous, current) {
		if (previous !== DevanagariVirama || !DevanagariConsonantPattern.test(current)) {
			return false;
		}
		const symbols = [...grapheme];
		for (let index = symbols.length - 2; index >= 0; index--) {
			const symbol = symbols[index];
			if (GraphemeExtendPattern.test(symbol) || EmojiTagPattern.test(symbol) || symbol === ZeroWidthJoiner) {
				continue;
			}
			return DevanagariConsonantPattern.test(symbol);
		}
		return false;
	}
	function isHangulL(codePoint) {
		return codePoint >= 0x1100 && codePoint <= 0x115F || codePoint >= 0xA960 && codePoint <= 0xA97C;
	}
	function isHangulV(codePoint) {
		return codePoint >= 0x1160 && codePoint <= 0x11A7 || codePoint >= 0xD7B0 && codePoint <= 0xD7C6;
	}
	function isHangulT(codePoint) {
		return codePoint >= 0x11A8 && codePoint <= 0x11FF || codePoint >= 0xD7CB && codePoint <= 0xD7FB;
	}
	function isHangulSyllable(codePoint) {
		return codePoint >= 0xAC00 && codePoint <= 0xD7A3;
	}
	function isHangulContinuation(previous, current) {
		const previousCodePoint = previous.codePointAt(0) ?? 0;
		const currentCodePoint = current.codePointAt(0) ?? 0;
		const isPreviousSyllable = isHangulSyllable(previousCodePoint);
		const isPreviousLv = isPreviousSyllable && (previousCodePoint - 0xAC00) % 28 === 0;
		const isPreviousLvt = isPreviousSyllable && !isPreviousLv;
		return isHangulL(previousCodePoint) && (isHangulL(currentCodePoint) || isHangulV(currentCodePoint) || isHangulSyllable(currentCodePoint)) || (isPreviousLv || isHangulV(previousCodePoint)) && (isHangulV(currentCodePoint) || isHangulT(currentCodePoint)) || (isPreviousLvt || isHangulT(previousCodePoint)) && isHangulT(currentCodePoint);
	}
	function splitFallbackGraphemes(value) {
		const graphemes = [];
		let previous = '';
		let regionalIndicatorCount = 0;
		for (const symbol of value) {
			const isRegionalIndicator = RegionalIndicatorPattern.test(symbol);
			const currentGrapheme = graphemes.at(-1) ?? '';
			const shouldJoinPrevious = graphemes.length > 0 && (GraphemeExtendPattern.test(symbol) || EmojiTagPattern.test(symbol) || symbol === ZeroWidthJoiner || previous === ZeroWidthJoiner && isEmojiZwjContinuation(currentGrapheme, symbol) || isViramaContinuation(currentGrapheme, previous, symbol) || isHangulContinuation(previous, symbol) || isRegionalIndicator && regionalIndicatorCount % 2 === 1);
			if (shouldJoinPrevious) {
				graphemes[graphemes.length - 1] += symbol;
			} else {
				graphemes.push(symbol);
			}
			regionalIndicatorCount = isRegionalIndicator ? regionalIndicatorCount + 1 : 0;
			previous = symbol;
		}
		return graphemes;
	}
	function createGraphemeSegmenter() {
		const Segmenter = Reflect.get(Intl, 'Segmenter');
		return main_core.Type.isFunction(Segmenter) ? new Segmenter(undefined, {
			granularity: 'grapheme'
		}) : null;
	}
	const graphemeSegmenter = createGraphemeSegmenter();
	function shortenName(name, segmenter = graphemeSegmenter) {
		const graphemes = segmenter ? [...segmenter.segment(name)].map(({
			segment
		}) => segment) : splitFallbackGraphemes(name);
		return graphemes.length > NameMaxLength ? `${graphemes.slice(0, NameMaxLength).join('').trim()}...` : name;
	}
	function signatureName(item) {
		const name = item.preview.split('\n').map(line => line.trim()).find(line => line !== '' && !/^-+$/.test(line)) ?? '';
		return shortenName(name);
	}
	function signatureMenuTitle(item) {
		return item.menuPreview === undefined ? signatureName(item) : shortenName(item.menuPreview.trim());
	}
	function applySignatureLayout(node, nodeId) {
		const editorDocument = node.ownerDocument;
		if (editorDocument.head.querySelector('[data-mail-compose-signature-layout]')) {
			return;
		}
		const style = editorDocument.createElement('style');
		style.dataset.mailComposeSignatureLayout = '';
		style.textContent = `#${nodeId} { margin-top: ${SignatureControlSpace}px; }`;
		main_core.Dom.append(style, editorDocument.head);
	}
	const SignatureBlock = ui_vue3.defineComponent({
		name: 'MailComposeSignatureBlock',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			BMenu: ui_system_menu_vue.BMenu,
			TextSm: ui_system_typography_vue.TextSm,
			UiButton: ui_vue3_components_button.Button,
			UiLabel: ui_system_label_vue.Label
		},
		setup() {
			return {
				state: useComposeState(),
				editor: useComposeEditor(),
				subscriptions: [],
				iconName: ui_iconSet_api_vue.Outline.DOCUMENT_SIGN,
				controlStyle: ui_vue3_components_button.AirButtonStyle.PLAIN,
				controlSize: ui_vue3_components_button.ButtonSize.SMALL,
				controlTestId: ControlTestId,
				menuId: MenuId,
				labelStyle: ui_system_label.LabelStyle.TINTED,
				labelSize: ui_system_label.LabelSize.SM
			};
		},
		data() {
			return {
				isMenuShown: false,
				rowTop: null,
				rowLeft: 0,
				rowWidth: 0,
				editorBody: null,
				editorWindow: null,
				contentScroll: null,
				positionFrame: null
			};
		},
		computed: {
			sender() {
				return getSelectedSender(this.state);
			},
			senderKey() {
				return this.state.selectedSender ?? '';
			},
			signatures() {
				return this.sender ? collectSignatures(this.state.signatures.bySender, this.sender) : [];
			},
			selectedSignatureId() {
				return this.state.selectedSignatureId;
			},
			draftLoading() {
				return this.state.draft.isLoading;
			},
			selectedSignature() {
				const id = this.state.selectedSignatureId;
				return this.signatures.find(item => item.signatureId === id) ?? null;
			},
			isShown() {
				return this.signatures.length > 0 || this.settingsPath !== '';
			},
			settingsPath() {
				return this.state.signatures.settingsPath;
			},
			controlText() {
				const name = this.selectedSignature ? signatureName(this.selectedSignature) : '';
				return name === '' ? loc(Phrase.SignatureNone) : name;
			},
			signatureLabel() {
				return loc(Phrase.SignatureButton);
			},
			kindLabel() {
				return this.selectedSignature?.isShared === true ? loc(Phrase.SignatureShared) : '';
			},
			rowPosition() {
				return this.rowTop === null ? {} : {
					top: `${this.rowTop}px`,
					left: `${this.rowLeft}px`,
					width: `${this.rowWidth}px`
				};
			},
			menuItems() {
				const items = this.signatures.filter(item => item.full !== '').map(item => this.buildSignatureItem(item));
				items.push({
					title: loc(Phrase.SignatureNone),
					sectionCode: MenuSection.Actions,
					isSelected: this.state.selectedSignatureId === null,
					onClick: () => {
						this.handleSelect(null);
					}
				});
				if (this.settingsPath !== '') {
					items.push({
						title: loc(Phrase.SignatureConfigure),
						sectionCode: MenuSection.Actions,
						onClick: () => {
							this.openSettings();
						}
					});
				}
				return items;
			},
			menuOptions() {
				return {
					bindElement: this.getControlNode(),
					width: MenuWidth,
					sections: [{
						code: MenuSection.Signatures,
						title: loc(Phrase.SignatureMenuTitle)
					}, {
						code: MenuSection.Actions
					}],
					items: this.menuItems
				};
			}
		},
		watch: {
			senderKey() {
				this.applyDefaultSignature();
				this.syncSignatureNode();
			},
			selectedSignatureId() {
				this.syncSignatureNode();
			},
			draftLoading(loading) {
				if (!loading) {
					void this.$nextTick(this.schedulePositionControl);
				}
			}
		},
		mounted() {
			this.applyDefaultSignature();
			this.subscriptions.push(this.editor.subscribeReady(this.handleEditorReady));
			main_core.Event.bind(window, 'resize', this.schedulePositionControl);
		},
		beforeUnmount() {
			main_core.Event.unbind(window, 'resize', this.schedulePositionControl);
			this.cancelPositionControl();
			this.unbindPositionListeners();
			this.subscriptions.forEach(unsubscribe => {
				unsubscribe();
			});
			this.subscriptions.length = 0;
		},
		methods: {
			handleEditorReady() {
				this.syncSignatureNode();
				this.unbindPositionListeners();
				const signature = this.editor.getBodyNode(this.editor.bodyNodes.signature);
				const editorFrame = this.editor.getHostNode()?.querySelector('iframe');
				this.editorBody = signature?.ownerDocument.body ?? editorFrame?.contentDocument?.body ?? null;
				this.editorWindow = this.editorBody?.ownerDocument.defaultView ?? null;
				this.contentScroll = this.$refs.row?.closest('.mail-compose-form__content') ?? null;
				if (this.editorBody) {
					main_core.Event.bind(this.editorBody, 'input', this.schedulePositionControl);
					main_core.Event.bind(this.editorBody, 'scroll', this.schedulePositionControl);
				}
				if (this.editorWindow) {
					main_core.Event.bind(this.editorWindow, 'scroll', this.schedulePositionControl);
					main_core.Event.bind(this.editorWindow, 'resize', this.schedulePositionControl);
				}
				if (this.contentScroll) {
					main_core.Event.bind(this.contentScroll, 'scroll', this.schedulePositionControl);
				}
				this.positionControl();
			},
			unbindPositionListeners() {
				if (this.editorBody) {
					main_core.Event.unbind(this.editorBody, 'input', this.schedulePositionControl);
					main_core.Event.unbind(this.editorBody, 'scroll', this.schedulePositionControl);
				}
				if (this.editorWindow) {
					main_core.Event.unbind(this.editorWindow, 'scroll', this.schedulePositionControl);
					main_core.Event.unbind(this.editorWindow, 'resize', this.schedulePositionControl);
				}
				if (this.contentScroll) {
					main_core.Event.unbind(this.contentScroll, 'scroll', this.schedulePositionControl);
				}
				this.editorBody = null;
				this.editorWindow = null;
				this.contentScroll = null;
			},
			schedulePositionControl() {
				if (this.positionFrame !== null) {
					return;
				}
				this.positionFrame = window.requestAnimationFrame(() => {
					this.positionFrame = null;
					this.positionControl();
				});
			},
			cancelPositionControl() {
				if (this.positionFrame !== null) {
					window.cancelAnimationFrame(this.positionFrame);
					this.positionFrame = null;
				}
			},
			positionControl() {
				const signature = this.editor.getBodyNode(this.editor.bodyNodes.signature);
				const row = this.$refs.row;
				const content = row?.closest('.mail-compose-form__content');
				const editorDocument = signature?.ownerDocument ?? this.editorBody?.ownerDocument;
				const frame = editorDocument?.defaultView?.frameElement;
				if (!row || !content || !frame || !this.editorBody) {
					this.rowTop = null;
					return;
				}
				const frameRect = frame.getBoundingClientRect();
				const contentRect = content.getBoundingClientRect();
				if (signature) {
					const signatureRect = signature.getBoundingClientRect();
					this.rowTop = content.scrollTop + frameRect.top + signatureRect.top - contentRect.top - row.offsetHeight - parseFloat(getComputedStyle(row).gap || '0');
				} else {
					const bodyRect = this.editorBody.getBoundingClientRect();
					const lastContent = [...this.editorBody.children].findLast(node => node.id !== this.editor.bodyNodes.quote);
					const contentBottom = Math.max(lastContent?.getBoundingClientRect().bottom ?? bodyRect.top, bodyRect.top + 24);
					this.rowTop = content.scrollTop + frameRect.top + contentBottom - contentRect.top + 24;
				}
				this.rowLeft = frameRect.left - contentRect.left;
				this.rowWidth = frameRect.width;
			},
			buildSignatureItem(item) {
				return {
					title: signatureMenuTitle(item) || loc(Phrase.SignatureButton),
					sectionCode: MenuSection.Signatures,
					badgeText: {
						title: loc(item.isShared ? Phrase.SignatureShared : Phrase.SignaturePersonal),
						color: item.isShared ? KindColor.Shared : KindColor.Own
					},
					isSelected: item.signatureId === this.state.selectedSignatureId,
					onClick: () => {
						this.handleSelect(item);
					}
				};
			},
			applyDefaultSignature() {
				this.state.selectedSignatureId = this.sender ? resolveDefaultSignature(this.signatures, this.state.signatures.choices, this.sender) : null;
			},
			handleSelect(item) {
				this.isMenuShown = false;
				this.state.selectedSignatureId = item?.signatureId ?? null;
				this.notifyBodyChanged();
				if (!item || !this.sender) {
					return;
				}
				const record = rememberSignatureChoice(this.sender, item.signatureId);
				if (record) {
					this.state.signatures.choices[record.senderKey] = record.value;
				}
			},
			handleControlClick() {
				if (this.signatures.length === 0) {
					this.openSettings();
					return;
				}
				this.isMenuShown = true;
			},
			openSettings() {
				if (this.settingsPath === '') {
					return;
				}
				this.isMenuShown = false;
				main_sidepanel.SidePanel.Instance.open(this.settingsPath, {
					cacheable: false,
					events: {
						onCloseComplete: this.handleSettingsClosed
					}
				});
			},
			handleSettingsClosed() {
				void loadSignatures(this.settingsPath).then(signatures => {
					this.state.signatures = signatures;
					this.applyDefaultSignature();
					this.syncSignatureNode();
					this.notifyBodyChanged();
				}, () => {
					this.syncSignatureNode();
					this.notifyBodyChanged();
				});
			},
			notifyBodyChanged() {
				void ui_vue3.nextTick(() => {
					this.$el?.dispatchEvent(new window.Event('input', {
						bubbles: true
					}));
				});
			},
			syncSignatureNode() {
				const node = this.editor.getBodyNode(this.editor.bodyNodes.signature);
				if (!this.selectedSignature) {
					this.removeSignatureNode(node);
					this.positionControl();
					return;
				}
				const html = SignatureMark + this.selectedSignature.full;
				if (node) {
					node.innerHTML = html;
					applySignatureLayout(node, this.editor.bodyNodes.signature);
					this.positionControl();
					return;
				}
				this.insertSignatureNode(html);
			},
			insertSignatureNode(html) {
				const node = main_core.Tag.render`<div id="${this.editor.bodyNodes.signature}"></div>`;
				node.innerHTML = html;
				const quote = this.editor.getBodyNode(this.editor.bodyNodes.quote);
				const position = quote ? {
					at: 'before',
					anchor: quote
				} : {
					at: 'end'
				};
				if (this.editor.insertNode(node, position)) {
					this.editor.insertNode(main_core.Tag.render`<br>`, {
						at: 'before',
						anchor: node
					});
					applySignatureLayout(node, this.editor.bodyNodes.signature);
					this.positionControl();
				}
			},
			removeSignatureNode(node) {
				main_core.Dom.remove(node);
				const quote = this.editor.getBodyNode(this.editor.bodyNodes.quote);
				if (quote && !quote.previousSibling) {
					this.editor.insertNode(main_core.Tag.render`<br>`, {
						at: 'before',
						anchor: quote
					});
				}
			},
			getControlNode() {
				const row = this.$refs.row;
				return row?.querySelector(`[data-testid="${ControlTestId}"]`) ?? null;
			}
		},
		template: `
		<div
			v-if="isShown"
			ref="row"
			class="mail-compose-signature-block"
			:class="{ '--unplaced': rowTop === null }"
			:style="rowPosition"
			data-testid="mail-compose-signature-block"
		>
			<BIcon
				class="mail-compose-signature-block__icon"
				:name="iconName"
				:size="20"
				data-testid="mail-compose-signature-icon"
			/>
			<TextSm class-name="mail-compose-signature-block__label">{{ signatureLabel }}:</TextSm>
			<UiButton
				:text="controlText"
				:style="controlStyle"
				:size="controlSize"
				dropdown
				:dataset="{ testid: controlTestId }"
				@click="handleControlClick"
			/>
			<UiLabel
				v-if="kindLabel !== ''"
				:value="kindLabel"
				:style="labelStyle"
				:size="labelSize"
				data-testid="mail-compose-signature-kind"
			/>
			<BMenu
				v-if="isMenuShown"
				:id="menuId"
				:options="menuOptions"
				@close="isMenuShown = false"
			/>
		</div>
	`
	});

	const SubjectField = ui_vue3.defineComponent({
		name: 'MailComposeSubjectField',
		components: {
			BInput: ui_system_input_vue.BInput,
			TextSm: ui_system_typography_vue.TextSm
		},
		setup() {
			return {
				state: useComposeState(),
				design: ui_system_input_vue.InputDesign.Naked,
				size: ui_system_input_vue.InputSize.Md
			};
		},
		computed: {
			subject: {
				get() {
					return this.state.subject;
				},
				set(value) {
					this.state.subject = value;
				}
			},
			label() {
				return loc(Phrase.SubjectLabel);
			},
			placeholder() {
				return loc(Phrase.SubjectPlaceholder);
			}
		},
		mounted() {
			this.denyAutofill();
		},
		methods: {
			denyAutofill() {
				const field = this.$refs.input.$el;
				main_core.Dom.attr(field.querySelector('input'), 'autocomplete', 'off');
			}
		},
		template: `
		<TextSm class-name="mail-compose-subject-field__label">{{ label }}:</TextSm>
		<BInput
			ref="input"
			v-model="subject"
			class="mail-compose-subject-field"
			:design="design"
			:size="size"
			:placeholder="placeholder"
			:aria-label="label"
			stretched
			data-testid="mail-compose-subject-field"
		/>
	`
	});

	const SendEvent = Object.freeze({
		tool: 'mail',
		event: 'mail_send',
		category: 'mail_operations',
		type: 'mail'
	});
	function sendComposeSendAnalytics(source) {
		const payload = {
			...SendEvent,
			c_section: source.section,
			c_element: source.element
		};
		ui_analytics.sendData(payload);
	}

	const App = ui_vue3.defineComponent({
		name: 'MailComposeApp',
		components: {
			ActionBar,
			ComposeHeader,
			EditorHost,
			ErrorAlert,
			QuoteToggle,
			RecipientRows,
			SenderChip,
			SendForm,
			ShowBccButton,
			SignatureBlock,
			SubjectField
		},
		props: {
			editorId: {
				type: String,
				required: true
			},
			formId: {
				type: String,
				required: true
			},
			uploaderControlId: {
				type: String,
				required: true
			}
		},
		setup(props) {
			const closeForm = useCloseComposeForm();
			const editor = new EditorAdapter({
				editorId: props.editorId,
				uploaderControlId: props.uploaderControlId,
				closeForm
			});
			ui_vue3.provide(composeEditorKey, editor);
			return {
				editor,
				state: useComposeState(),
				closeForm,
				subscriptions: [],
				noticesTestId: NoticesTestId,
				attachmentAnchorTestId: AttachmentAnchorTestId
			};
		},
		mounted() {
			this.subscriptions.push(showCalendarSlotsTour({
				editor: this.editor,
				state: this.state,
				getControlNode: this.getSlotsControlNode
			}));
		},
		beforeUnmount() {
			this.subscriptions.forEach(unsubscribe => {
				unsubscribe();
			});
			this.subscriptions.length = 0;
			this.editor.destroy();
		},
		methods: {
			getSlotsControlNode() {
				const footer = this.$refs.footer;
				return footer?.querySelector(`[data-testid="${SlotsControlTestId}"]`) ?? null;
			},
			openSignatureMenu() {
				const signature = this.$refs.signature;
				signature?.handleControlClick();
			},
			submitMessage() {
				sendComposeSendAnalytics(this.state.analytics);
				const sendForm = this.$refs.sendForm;
				sendForm?.submit();
			}
		},
		template: `
		<div
			class="mail-compose-form"
			:class="{ '--draft-loading': state.draft.isLoading }"
			data-testid="mail-compose-form"
			:aria-busy="state.draft.isLoading ? 'true' : 'false'"
			:inert="state.draft.isLoading || state.draft.restoreFailed || state.isSending || undefined"
		>
			<ComposeHeader/>
			<div class="mail-compose-form__content" data-testid="mail-compose-form-content">
				<div class="mail-compose-form__fields" data-testid="mail-compose-form-fields">
					<SenderChip/>
					<RecipientRows/>
					<div class="mail-compose-form__subject-row" data-testid="mail-compose-form-subject-row">
						<SubjectField/>
						<ShowBccButton/>
					</div>
				</div>
				<EditorHost/>
				<SignatureBlock ref="signature"/>
				<QuoteToggle/>
				<div class="mail-compose-form__notices" :data-testid="noticesTestId"></div>
				<div :data-testid="attachmentAnchorTestId"></div>
			</div>
			<div ref="footer" class="mail-compose-form__footer" data-testid="mail-compose-form-footer">
				<ErrorAlert/>
				<ActionBar @signature="openSignatureMenu" @send="submitMessage" @cancel="closeForm"/>
			</div>
			<SendForm ref="sendForm" :formId="formId"/>
		</div>
	`
	});

	class AutoApplyTemplate {
		#params;
		#active = true;
		#unsubscribeReady = () => {};
		#unsubscribeInput = () => {};
		#userInput = false;
		constructor(params) {
			this.#params = {
				...params,
				api: params.api ?? TemplateApi
			};
		}
		async start() {
			const {
				api,
				editor,
				loadRecent,
				state
			} = this.#params;
			if (state.scenario !== Scenario.New || !state.features.templates) {
				this.#finish('skipped');
				return;
			}
			const inputSubscriptions = [editor.subscribeContentChange(this.markUserInput), editor.subscribeFileAdd(this.markUserInput), editor.subscribeFileRemove(this.markUserInput)];
			this.#unsubscribeInput = () => {
				inputSubscriptions.forEach(unsubscribe => unsubscribe());
			};
			state.templates.autoApply.status = 'pending';
			const [draftRestore] = await Promise.all([this.#params.draftRestore, this.#waitForEditor(editor)]);
			if (!this.#active || draftRestore.restored) {
				this.#finish('skipped');
				return;
			}
			await (loadRecent ?? loadRecentTemplates)(state);
			const candidate = state.templates.autoApply.candidate;
			if (!this.#active || !state.templates.rememberLast || !candidate || this.#userInput || !this.#isComposeClean()) {
				this.#finish('skipped');
				return;
			}
			try {
				const {
					template
				} = await api.prepare(candidate);
				if (!this.#active || !state.templates.rememberLast || this.#userInput || !this.#isComposeClean()) {
					this.#finish('skipped');
					return;
				}
				state.templates.prepared = template;
				const result = await completeTemplateApplication(this.#params, 'replace');
				this.#finish(this.#active && result.status === 'applied' ? 'applied' : 'skipped');
			} catch {
				this.#finish(this.#active ? 'failed' : 'skipped');
			}
		}
		destroy() {
			this.#active = false;
			this.#unsubscribeReady();
			this.#unsubscribeInput();
		}
		markUserInput = () => {
			this.#userInput = true;
		};
		#finish(status) {
			this.#params.state.templates.autoApply.status = status;
			this.#unsubscribeReady();
			this.#unsubscribeReady = () => {};
			this.#unsubscribeInput();
			this.#unsubscribeInput = () => {};
		}
		#isComposeClean() {
			return this.#params.state.subject.trim() === '' && !this.#params.editor.hasUserContent();
		}
		#waitForEditor(editor) {
			return new Promise(resolve => {
				this.#unsubscribeReady = editor.subscribeReady(() => {
					this.#unsubscribeReady();
					this.#unsubscribeReady = () => {};
					resolve();
				});
			});
		}
	}

	class DraftIntegration {
		#params;
		#adapter;
		#coordinator = null;
		#resolveRestore = () => {};
		#restore;
		#destroyed = false;
		#changedBeforeCoordinator = false;
		constructor(params) {
			this.#params = params;
			this.#adapter = new DraftComposeAdapter(params);
			this.#adapter.subscribe('MailForm:compose:changed', () => {
				if (!this.#coordinator) {
					this.#changedBeforeCoordinator = true;
				}
			});
			this.#restore = new Promise(resolve => {
				this.#resolveRestore = resolve;
			});
		}
		get restore() {
			return this.#restore;
		}
		async start() {
			if (!main_core.Type.isStringFilled(this.#params.state.draft.clientId)) {
				await this.#completeRestore({
					restored: false
				});
				this.#adapter.releaseDraftLoading();
				return;
			}
			this.#adapter.holdDraftLoading();
			try {
				const extension = await main_core.Runtime.loadExtension('mail.draft');
				if (this.#destroyed) {
					this.#resolveRestore({
						restored: false
					});
					return;
				}
				if (!main_core.Type.isFunction(extension.bootstrapMailDraft)) {
					await this.#completeRestore({
						restored: false
					});
					return;
				}
				const coordinator = await extension.bootstrapMailDraft({
					form: this.#adapter,
					clientId: this.#params.state.draft.clientId,
					draftId: this.#params.state.draft.id || null,
					onDraftIdChange: (draftId, revision) => {
						this.#params.state.draft.id = draftId;
						this.#params.state.draft.revision = revision;
					}
				});
				if (this.#destroyed) {
					coordinator?.destroy();
					return;
				}
				this.#coordinator = coordinator;
				if (coordinator && this.#changedBeforeCoordinator) {
					coordinator.markChanged();
					this.#changedBeforeCoordinator = false;
				}
				const result = {
					restored: this.#adapter.restored,
					largeAttachments: this.#adapter.largeAttachments
				};
				await this.#completeRestore(result);
			} catch {
				await this.#completeRestore({
					restored: false
				});
			} finally {
				this.#adapter.releaseDraftLoading();
			}
		}
		async #completeRestore(result) {
			try {
				await this.#params.completeRestore?.(result);
			} catch {
			}
			this.#resolveRestore(result);
		}
		destroy() {
			this.#destroyed = true;
			this.#adapter.destroy();
			this.#coordinator?.destroy();
			this.#coordinator = null;
			this.#resolveRestore({
				restored: false
			});
		}
	}

	const FrameClass = 'mail-compose-form-frame';
	const ShellClass = 'mail-compose-form-shell';
	const SliderMessageEvent = 'SidePanel.Slider:onMessage';
	const SliderCanCloseEvent = 'SidePanel.Slider:onClose';
	const SliderCloseEvent = 'SidePanel.Slider:onCloseStart';
	const RelayedSliderMessages = new Set(['mail-mailbox-config-success', 'mail-mailbox-config-delete']);
	class ComposeForm {
		#options;
		#app = null;
		#state = null;
		#shellNodes = [];
		#largeAttachment = null;
		#slider = null;
		#draft = null;
		#autoApply = null;
		#formNode = null;
		#editorSubscriptions = [];
		#draftLoader = null;
		#draftLoaderTarget = null;
		#panelClosePending = false;
		#panelCloseApproved = false;
		#migrationStateUnsubscribes = [];
		constructor(options) {
			this.#options = options;
		}
		start() {
			if (this.#app) {
				return;
			}
			const container = document.getElementById(this.#options.containerId);
			if (!container) {
				return;
			}
			this.#markLayout(container);
			this.#formNode = document.getElementById(this.#options.formId);
			if (this.#formNode) {
				main_core.Event.bind(this.#formNode, 'input', this.#handleUserInput);
			}
			this.#state = createComposeState(this.#options.initialData);
			this.#subscribeToMigrationState(this.#state);
			this.#state.draft.isLoading = main_core.Type.isStringFilled(this.#state.draft.clientId) && this.#state.draft.id > 0;
			this.#draftLoaderTarget = this.#formNode ?? container.parentElement ?? container;
			if (this.#state.draft.isLoading) {
				this.#showDraftLoader();
			}
			this.#app = ui_vue3.BitrixVue.createApp(App, {
				editorId: this.#options.editorId,
				formId: this.#options.formId,
				uploaderControlId: this.#options.editorFormId
			});
			this.#app.config.globalProperties.loc = loc;
			this.#app.provide(composeStateKey, this.#state);
			this.#app.provide(largeAttachmentGateKey, this.#resolveLargeAttachmentGate);
			this.#app.provide(closeComposeFormKey, this.#closeForm);
			const root = this.#app.mount(container);
			this.#editorSubscriptions = [root.editor.subscribeContentChange(this.#handleUserInput), root.editor.subscribeFileAdd(this.#handleUserInput), root.editor.subscribeFileRemove(this.#handleUserInput)];
			main_core_events.EventEmitter.subscribe(SliderMessageEvent, this.#relaySliderMessage, {
				compatMode: true
			});
			this.#watchPanelClose();
			this.#startDraftAndAutoApply(root, this.#state);
		}
		destroy() {
			this.#autoApply?.destroy();
			this.#autoApply = null;
			if (this.#formNode) {
				main_core.Event.unbind(this.#formNode, 'input', this.#handleUserInput);
			}
			this.#formNode = null;
			this.#editorSubscriptions.forEach(unsubscribe => unsubscribe());
			this.#editorSubscriptions = [];
			main_core_events.EventEmitter.unsubscribe(SliderMessageEvent, this.#relaySliderMessage);
			this.#unwatchPanelClose();
			main_core_events.EventEmitter.emit(ComposeFormEvent.Destroy, {
				formId: this.#options.formId
			});
			this.#draft?.destroy();
			this.#draft = null;
			this.#hideDraftLoader();
			this.#draftLoaderTarget = null;
			this.#largeAttachment = null;
			this.#app?.unmount();
			this.#app = null;
			this.#migrationStateUnsubscribes.forEach(unsubscribe => unsubscribe());
			this.#migrationStateUnsubscribes = [];
			this.#state = null;
			this.#unmarkLayout();
		}
		#subscribeToMigrationState(state) {
			const migrationActiveByMailboxId = state.migrationActiveByMailboxId;
			const mailboxIds = new Set([Number(state.mailbox.id ?? 0), Number(state.send.mailboxId ?? 0), ...state.senders.map(sender => Number(sender.mailboxId ?? 0))].filter(mailboxId => Number.isInteger(mailboxId) && mailboxId > 0));
			mailboxIds.forEach(mailboxId => {
				const migrationState = mail_migrationState.getMigrationState(mailboxId);
				migrationActiveByMailboxId[mailboxId] = migrationState.isActive();
				this.#migrationStateUnsubscribes.push(migrationState.subscribe(change => {
					migrationActiveByMailboxId[mailboxId] = change.active;
				}));
				void migrationState.initialize();
			});
		}
		#startDraftAndAutoApply(root, state) {
			const draft = new DraftIntegration({
				formId: this.#options.formId,
				state,
				editor: root.editor,
				getLargeAttachments: () => this.#largeAttachment?.getDraftState() ?? null,
				onLoadingChange: this.#handleDraftLoadingChange,
				completeRestore: async result => {
					await this.#startLargeAttachments(root, state, result.largeAttachments ?? []);
				}
			});
			this.#draft = draft;
			const autoApply = new AutoApplyTemplate({
				editor: root.editor,
				state,
				formId: this.#options.formId,
				draftRestore: draft.restore
			});
			this.#autoApply = autoApply;
			void draft.start();
			void autoApply.start();
		}
		#handleDraftLoadingChange = loading => {
			if (loading) {
				this.#showDraftLoader();
				return;
			}
			this.#hideDraftLoader();
		};
		#showDraftLoader() {
			if (!this.#draftLoaderTarget || this.#draftLoader) {
				return;
			}
			this.#draftLoader = new main_loader.Loader({
				target: this.#draftLoaderTarget
			});
			main_core.Dom.attr(this.#draftLoader.layout, 'aria-hidden', 'true');
			void this.#draftLoader.show();
		}
		#hideDraftLoader() {
			this.#draftLoader?.destroy();
			this.#draftLoader = null;
		}
		#handleUserInput = () => {
			this.#autoApply?.markUserInput();
			if (!this.#state?.draft.isLoading) {
				main_core_events.EventEmitter.emit(ComposeFormEvent.Changed, {
					formId: this.#options.formId,
					reason: 'user'
				});
			}
		};
		async #startLargeAttachments(root, state, draftLargeAttachments = []) {
			if (!isLargeAttachmentEnabled(state)) {
				return;
			}
			const {
				largeAttachment,
				limits,
				mailbox,
				messageId
			} = state;
			const adapter = new LargeAttachmentAdapter({
				formId: this.#options.formId,
				containerId: this.#options.containerId,
				editor: root.editor,
				showAha: largeAttachment.showAha,
				ahaOptionName: largeAttachment.ahaOptionName
			});
			this.#largeAttachment = adapter;
			try {
				const extension = await main_core.Runtime.loadExtension('mail.client.large-attachment');
				if (this.#largeAttachment !== adapter) {
					return;
				}
				adapter.setCore(extension.LargeAttachment.init({
					formId: this.#options.formId,
					uploaderControlId: this.#options.editorFormId,
					messageId,
					featureAvailable: largeAttachment.featureAvailable,
					folderName: largeAttachment.folderName,
					maxSize: limits.maxAttachmentsSize,
					mailboxId: mailbox.id,
					postSendPromptSuppressed: largeAttachment.postSendPromptSuppressed,
					postSendPromptOptionName: largeAttachment.postSendPromptOptionName,
					draftLargeAttachments
				}, adapter));
			} catch {
			}
		}
		#closeForm = async () => {
			const state = this.#state;
			if (!state) {
				return;
			}
			if (!(await this.#flushBeforeClose())) {
				return;
			}
			closeComposeForm({
				destroyForm: () => {
					this.destroy();
				},
				paths: state.paths
			});
		};
		async #flushBeforeClose() {
			const pending = [];
			let prevented = false;
			main_core_events.EventEmitter.emit(DraftBridgeEvent.BeforeClose, {
				formId: this.#options.formId,
				data: {
					waitUntil: promise => {
						pending.push(promise);
					},
					preventDefault: () => {
						prevented = true;
					}
				}
			});
			await Promise.all(pending);
			return !prevented;
		}
		#watchPanelClose() {
			this.#slider = main_sidepanel.SidePanel.Instance.getSliderByWindow(window);
			if (this.#slider) {
				main_core_events.EventEmitter.subscribe(this.#slider, SliderCanCloseEvent, this.#handlePanelCanClose, {
					compatMode: true
				});
				main_core_events.EventEmitter.subscribe(this.#slider, SliderCloseEvent, this.#handlePanelClose);
			}
		}
		#unwatchPanelClose() {
			if (this.#slider) {
				main_core_events.EventEmitter.unsubscribe(this.#slider, SliderCanCloseEvent, this.#handlePanelCanClose);
				main_core_events.EventEmitter.unsubscribe(this.#slider, SliderCloseEvent, this.#handlePanelClose);
				this.#slider = null;
			}
			this.#panelClosePending = false;
			this.#panelCloseApproved = false;
		}
		#handlePanelCanClose = sliderEvent => {
			if (!sliderEvent || this.#panelCloseApproved || !this.#state) {
				this.#panelCloseApproved = false;
				return;
			}
			sliderEvent.denyAction();
			if (this.#panelClosePending) {
				return;
			}
			this.#panelClosePending = true;
			const slider = this.#slider;
			void this.#flushBeforeClose().then(allowed => {
				this.#panelClosePending = false;
				if (allowed && slider && slider === this.#slider && this.#state) {
					this.#panelCloseApproved = true;
					slider.close();
				}
			}).catch(() => {
				this.#panelClosePending = false;
			});
		};
		#handlePanelClose = () => {
			if (!this.#state) {
				return;
			}
			releaseComposeForm(() => {
				this.destroy();
			});
		};
		#resolveLargeAttachmentGate = () => this.#largeAttachment;
		#relaySliderMessage = event => {
			const eventId = event.getEventId();
			if (eventId !== null && RelayedSliderMessages.has(eventId)) {
				main_sidepanel.SidePanel.Instance.postMessage(window, eventId, event.getData() ?? {});
			}
		};
		#markLayout(container) {
			const form = document.getElementById(this.#options.formId);
			this.#shellNodes = form ? [form, container] : [container];
			main_core.Dom.addClass(document.body, FrameClass);
			this.#shellNodes.forEach(node => {
				main_core.Dom.addClass(node, ShellClass);
			});
		}
		#unmarkLayout() {
			main_core.Dom.removeClass(document.body, FrameClass);
			this.#shellNodes.forEach(node => {
				main_core.Dom.removeClass(node, ShellClass);
			});
			this.#shellNodes = [];
		}
	}

	exports.ComposeForm = ComposeForm;

})(this.BX.Mail.Client.ComposeForm = this.BX.Mail.Client.ComposeForm || {}, BX, BX.Event, BX, BX.SidePanel, BX.Vue3, BX.Mail, BX.UI.IconSet, window, BX.Vue3.Components, BX.UI.Dialogs, BX.UI, BX.UI, BX.UI.Vue3.Components, BX.Main, BX.UI.System.Label, BX.UI.System.Label.Vue, BX.UI.System.Menu, BX.UI.System.Input.Vue, BX.UI.System.Typography.Vue, BX.UI.System.Alert, BX.UI.System.Alert.Vue, BX.UI.Accessibility, BX.UI.EntitySelector, BX.UI.System.Chip.Vue, BX.UI, BX.UI.Analytics);
//# sourceMappingURL=compose-form.bundle.js.map
