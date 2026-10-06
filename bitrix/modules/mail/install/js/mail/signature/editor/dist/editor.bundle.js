/* eslint-disable */
this.BX = this.BX || {};
this.BX.Mail = this.BX.Mail || {};
this.BX.Mail.Signature = this.BX.Mail.Signature || {};
(function (exports, main_core, ui_alerts, ui_notification, ui_buttons, ui_entitySelector, ui_system_radiobutton, ui_switcher, mail_lib_entitySelector) {
	'use strict';

	const ASSIGNMENTS_PROVIDED = 'Y';
	function pickPanelData(panels) {
		if (panels.scopeCard?.isSharedScope() === true) {
			return panels.scopeCard.getSaveData();
		}
		return panels.panel ? panels.panel.getSaveData() : null;
	}
	function buildUserSignatureSaveRequest(payload) {
		const fields = {
			signature: payload.signature
		};
		if (payload.signatureId <= 0 || payload.panelData?.preserveAssignment !== true) {
			fields.sender = payload.panelData?.sender ?? '';
			if (payload.signatureId > 0 && payload.panelData?.senderChanged === true) {
				fields.senderBindingChanged = 'Y';
			}
		}
		if (payload.signatureId > 0) {
			return {
				action: 'mail.api.usersignature.update',
				data: {
					userSignatureId: payload.signatureId,
					fields
				}
			};
		}
		return {
			action: 'mail.api.usersignature.add',
			data: {
				fields
			}
		};
	}
	function buildSharedSignatureSaveRequest(payload) {
		const assignments = payload.panelData?.assignments;
		const data = payload.signatureId > 0 ? {
			id: payload.signatureId,
			signature: payload.signature
		} : {
			signature: payload.signature
		};
		if (assignments) {
			data.assignments = assignments;
			data.assignmentsProvided = ASSIGNMENTS_PROVIDED;
		}
		return {
			action: payload.signatureId > 0 ? 'mail.api.sharedsignature.update' : 'mail.api.sharedsignature.add',
			data
		};
	}
	function buildUnifiedSignatureUpdateRequest(payload) {
		const shared = payload.panelData?.kind === 'shared';
		const preserveAssignment = !shared && (payload.panelData?.preserveAssignment === true || payload.scopeChanged !== true && payload.panelData?.senderChanged !== true);
		const sender = payload.panelData?.sender ?? '';
		const assignments = shared ? payload.panelData?.assignments ?? [] : sender === '' ? [] : [{
			targetType: 'sender',
			targetId: 0,
			targetValue: sender,
			isFlat: false
		}];
		const data = {
			id: payload.signatureId,
			signature: payload.signature,
			scope: shared ? 'shared' : 'owner'
		};
		if (!preserveAssignment) {
			data.assignments = assignments;
			data.assignmentsProvided = ASSIGNMENTS_PROVIDED;
		}
		return {
			action: 'mail.api.signature.update',
			data
		};
	}
	function extractUserSignatureId(responseData) {
		return Number(responseData?.userSignature?.id ?? 0);
	}
	function extractSharedSignatureId(responseData) {
		return Number(responseData?.item?.id ?? 0);
	}

	class HtmlEditorAdapter {
		#editorInstanceId;
		constructor(editorInstanceId) {
			this.#editorInstanceId = editorInstanceId;
		}
		getContent() {
			return this.#requireEditor().GetContent();
		}
		insertHtml(html) {
			this.#requireEditor().InsertHtml(html);
		}
		focus() {
			this.#requireEditor().Focus();
		}
		syncToolbar() {
			const editor = this.#getEditor();
			if (!editor) {
				return;
			}
			editor.toolbar.DisableWysiwygButtons(editor.GetViewMode() === 'code');
		}
		subscribeToViewModeChanges() {
			const editor = this.#getEditor();
			if (editor) {
				main_core.addCustomEvent(editor, 'OnSetViewAfter', () => this.syncToolbar());
			}
		}
		#getEditor() {
			const manager = main_core.Reflection.getClass('BXHtmlEditor');
			return manager?.Get(this.#editorInstanceId) ?? null;
		}
		#requireEditor() {
			const editor = this.#getEditor();
			if (!editor) {
				throw new Error(`HTML editor ${this.#editorInstanceId} is not initialized`);
			}
			return editor;
		}
	}

	class SignatureEditor {
		#options;
		#editor;
		#connectedCapabilities = [];
		#saveInProgress = false;
		#destroyed = false;
		constructor(options) {
			this.#options = options;
			this.#editor = new HtmlEditorAdapter(options.editorInstanceId);
			this.#editor.syncToolbar();
			this.#editor.subscribeToViewModeChanges();
			main_core.Dom.attr(options.alertContainer, {
				role: 'alert',
				'aria-live': 'assertive',
				'aria-atomic': 'true'
			});
			if (options.panel && options.panelContainer) {
				options.panel.renderTo(options.panelContainer);
			}
			if (options.scopeCard && options.scopeCardContainer) {
				options.scopeCard.subscribeToScope(shared => {
					this.#applyScope(shared);
				});
				options.scopeCard.renderTo(options.scopeCardContainer);
				this.#applyScope(options.scopeCard.isSharedScope());
			}
			for (const capability of options.capabilities ?? []) {
				capability.connect({
					editor: this.#editor,
					showError: text => this.showError(text),
					clearError: () => this.clearError()
				});
				this.#connectedCapabilities.push(capability);
			}
		}
		save(closeAfter = false) {
			void this.#save(closeAfter);
		}
		destroy() {
			if (this.#destroyed) {
				return;
			}
			this.#destroyed = true;
			for (const capability of this.#connectedCapabilities) {
				capability.disconnect?.();
			}
			this.#connectedCapabilities = [];
		}
		async #save(closeAfter) {
			if (this.#saveInProgress || this.#destroyed) {
				return;
			}
			const {
				signatureId,
				scopeCard,
				transport
			} = this.#options;
			if (scopeCard && !scopeCard.validate()) {
				return;
			}
			this.#saveInProgress = true;
			const isNew = signatureId <= 0;
			try {
				if (this.#connectedCapabilities.length > 0 && !(await this.#runBeforeSave())) {
					return;
				}
				const savedId = await transport.save({
					signatureId,
					signature: this.#editor.getContent(),
					panelData: pickPanelData(this.#options)
				});
				if (isNew || closeAfter) {
					this.closeSlider(savedId);
				} else {
					ui_notification.Center.notify({
						content: transport.getUpdateSuccessText()
					});
				}
			} catch (response) {
				this.showError(this.#getErrorMessage(response));
			} finally {
				this.#saveInProgress = false;
			}
		}
		showError(text) {
			const alert = new ui_alerts.Alert({
				color: ui_alerts.AlertColor.DANGER,
				icon: ui_alerts.AlertIcon.DANGER,
				text
			});
			main_core.Dom.clean(this.#options.alertContainer);
			main_core.Dom.append(alert.getContainer(), this.#options.alertContainer);
		}
		clearError() {
			main_core.Dom.clean(this.#options.alertContainer);
		}
		closeSlider(signatureId) {
			const {
				eventId,
				idKey
			} = this.#options.sliderMessage;
			const sidePanel = main_core.Reflection.getClass('BX.SidePanel');
			if (sidePanel) {
				const slider = sidePanel.Instance.getTopSlider();
				if (slider) {
					sidePanel.Instance.postMessage(slider, eventId, {
						[idKey]: signatureId
					});
				}
			}
			document.getElementById('ui-button-panel-close')?.click();
		}
		#applyScope(shared) {
			const {
				panelContainer
			} = this.#options;
			if (panelContainer) {
				main_core.Dom.style(panelContainer, 'display', shared ? 'none' : '');
			}
		}
		#getErrorMessage(response) {
			if (response instanceof Error) {
				return response.message;
			}
			const ajaxResponse = response;
			const errors = ajaxResponse.errors ?? [];
			return errors[errors.length - 1]?.message ?? '';
		}
		async #runBeforeSave(index = 0) {
			const capability = this.#connectedCapabilities[index];
			if (!capability) {
				return true;
			}
			if (!(await capability.beforeSave())) {
				return false;
			}
			if (this.#destroyed) {
				return false;
			}
			return this.#runBeforeSave(index + 1);
		}
	}

	const SUPPORTED_VERSION = 1;
	class SignatureMacroCatalog {
		#groups;
		#tokens;
		constructor(groups) {
			this.#groups = groups;
			this.#tokens = new Set(groups.flatMap(group => {
				return group.items.map(item => item.token);
			}));
		}
		static fromDto(dto) {
			if (!main_core.Type.isPlainObject(dto)) {
				return null;
			}
			const catalogDto = dto;
			if (String(catalogDto.version) !== String(SUPPORTED_VERSION) || !main_core.Type.isArrayFilled(catalogDto.groups)) {
				return null;
			}
			const tokens = new Set();
			const groups = [];
			for (const groupDto of catalogDto.groups) {
				if (!main_core.Type.isPlainObject(groupDto) || !main_core.Type.isStringFilled(groupDto.id) || !main_core.Type.isArrayFilled(groupDto.items)) {
					return null;
				}
				const items = [];
				for (const itemDto of groupDto.items) {
					if (!main_core.Type.isPlainObject(itemDto) || !main_core.Type.isStringFilled(itemDto.id) || !main_core.Type.isStringFilled(itemDto.token) || !main_core.Type.isStringFilled(itemDto.labelKey) || tokens.has(itemDto.token)) {
						return null;
					}
					tokens.add(itemDto.token);
					items.push({
						id: itemDto.id,
						token: itemDto.token,
						labelKey: itemDto.labelKey,
						label: main_core.Loc.getMessage(itemDto.labelKey) ?? ''
					});
				}
				groups.push({
					id: groupDto.id,
					label: main_core.Loc.getMessage(`MAIL_SIGNATURE_MACRO_GROUP_${groupDto.id.toUpperCase()}`) ?? '',
					items
				});
			}
			return new SignatureMacroCatalog(groups);
		}
		getGroups() {
			return this.#groups;
		}
		getTokens() {
			return new Set(this.#tokens);
		}
	}

	function buildSignatureMacroMenuOptions(groups, onSelect) {
		return {
			sections: groups.map(group => ({
				code: group.id,
				title: group.label
			})),
			items: groups.flatMap(group => {
				return group.items.map(item => ({
					id: item.id,
					title: item.label,
					sectionCode: group.id,
					onClick: () => onSelect(item)
				}));
			}),
			closeOnItemClick: true
		};
	}
	function findFirstUnknownMacro(template, knownTokens) {
		let offset = 0;
		while (offset < template.length) {
			const start = template.indexOf('{{', offset);
			if (start === -1) {
				return null;
			}
			const end = template.indexOf('}}', start + 2);
			if (end === -1) {
				return template.slice(start);
			}
			const construction = template.slice(start, end + 2);
			if (!knownTokens.has(construction)) {
				return construction;
			}
			offset = end + 2;
		}
		return null;
	}
	class SignatureMacroCapability {
		#options;
		#context = null;
		#button = null;
		constructor(options) {
			this.#options = options;
		}
		connect(context) {
			this.disconnect();
			this.#context = context;
			this.#button = new ui_buttons.Button({
				text: main_core.Loc.getMessage('MAIL_SIGNATURE_MACRO_ADD') ?? '',
				color: ui_buttons.ButtonColor.LIGHT_BORDER,
				noCaps: true,
				systemMenu: buildSignatureMacroMenuOptions(this.#options.catalog.getGroups(), item => this.#insert(item))
			});
			this.#button.renderTo(this.#options.actionContainer);
		}
		beforeSave() {
			if (!this.#context) {
				return true;
			}
			const unknown = findFirstUnknownMacro(this.#context.editor.getContent(), this.#options.catalog.getTokens());
			if (unknown !== null) {
				this.#context.showError(main_core.Loc.getMessage('MAIL_SIGNATURE_MACRO_UNKNOWN', {
					'#TOKEN#': main_core.Text.encode(unknown)
				}) ?? '');
				return false;
			}
			this.#context.clearError();
			return true;
		}
		disconnect() {
			if (this.#button) {
				this.#button.setSystemMenu(false);
				main_core.Dom.remove(this.#button.getContainer());
			}
			this.#button = null;
			this.#context = null;
		}
		#insert(item) {
			if (!this.#context) {
				return;
			}
			this.#context.editor.insertHtml(item.token);
			this.#context.editor.focus();
		}
	}

	const SENDER_OPTION_ENTITY_ID = 'mail-signature-sender';
	const SENDER_OPTION_TAB_ID = 'recents';
	function getInitialSenderOptionId(options) {
		const selected = options.find(option => option.selected === true);
		return (selected ?? options[0])?.id ?? null;
	}
	function buildSenderSelectorItems(options) {
		const initialId = getInitialSenderOptionId(options);
		return options.map((option, index) => ({
			id: option.id,
			entityId: SENDER_OPTION_ENTITY_ID,
			title: option.title,
			tabs: SENDER_OPTION_TAB_ID,
			sort: index,
			selected: option.id === initialId,
			deselectable: false
		}));
	}
	function getSenderValueById(options, id) {
		return options.find(option => option.id === id)?.value ?? '';
	}

	class SenderBindingPanel {
		#senderOptions;
		#initialOptionId;
		#selector = null;
		constructor(options) {
			this.#senderOptions = options.senderOptions ?? [];
			this.#initialOptionId = getInitialSenderOptionId(this.#senderOptions);
		}
		renderTo(container) {
			const selectorContainer = main_core.Tag.render`
			<div
				class="mail-signature-sender-binding__selector"
				data-role="sender-selector"
				data-testid="mail-signature-sender-selector"
			></div>
		`;
			const block = main_core.Tag.render`
			<div class="mail-signature-sender-binding" data-testid="mail-signature-sender-binding">
				<div class="mail-signature-sender-binding__label">
					${main_core.Loc.getMessage('MAIL_SIGNATURE_EDITOR_SENDER_BINDING_LABEL') ?? ''}
				</div>
				${selectorContainer}
			</div>
		`;
			main_core.Dom.append(block, container);
			const caption = main_core.Loc.getMessage('MAIL_SIGNATURE_EDITOR_SENDER_BINDING_CHANGE') ?? '';
			this.#selector = new ui_entitySelector.TagSelector({
				multiple: false,
				addButtonCaption: caption,
				addButtonCaptionMore: caption,
				dialogOptions: {
					targetNode: selectorContainer,
					context: 'MAIL_SIGNATURE_SENDER_BINDING',
					items: buildSenderSelectorItems(this.#senderOptions),
					dropdownMode: true,
					enableSearch: false,
					showAvatars: false,
					compactView: true
				}
			});
			this.#selector.renderTo(selectorContainer);
		}
		getSaveData() {
			const selectedOptionId = this.#getSelectedOptionId();
			const selectedOption = this.#senderOptions.find(option => option.id === selectedOptionId);
			return {
				kind: 'user',
				sender: getSenderValueById(this.#senderOptions, selectedOptionId),
				preserveAssignment: selectedOption?.preserveAssignment === true,
				senderChanged: selectedOptionId !== this.#initialOptionId
			};
		}
		#getSelectedOptionId() {
			const tag = this.#selector?.getTags()[0];
			return tag ? String(tag.getId()) : this.#initialOptionId;
		}
	}

	function needsUnifiedTransport(condition) {
		return (condition.unifiedSignatureId ?? 0) > 0 || condition.hasSharedScopeCard === true;
	}
	class CompositeTransport {
		#userTransport;
		#sharedTransport;
		#unifiedTransport;
		#sharedSignatureId;
		#unifiedSignatureId;
		#initialKind;
		#continueInUnifiedModel = false;
		constructor(userTransport, sharedTransport, options = {}) {
			this.#userTransport = userTransport;
			this.#sharedTransport = sharedTransport;
			this.#unifiedTransport = options.unifiedTransport ?? sharedTransport;
			this.#sharedSignatureId = options.sharedSignatureId ?? 0;
			this.#unifiedSignatureId = options.unifiedSignatureId ?? 0;
			this.#initialKind = options.initialKind ?? 'user';
		}
		save(payload) {
			const kind = payload.panelData?.kind ?? 'user';
			if (this.#unifiedSignatureId > 0 && (this.#continueInUnifiedModel || kind !== this.#initialKind || kind === 'user' && payload.signatureId <= 0)) {
				return this.#unifiedTransport.save({
					...payload,
					signatureId: this.#unifiedSignatureId,
					scopeChanged: kind !== this.#initialKind
				}).then(savedId => {
					this.#unifiedSignatureId = savedId;
					this.#sharedSignatureId = kind === 'shared' ? savedId : 0;
					this.#initialKind = kind;
					this.#continueInUnifiedModel = true;
					return savedId;
				});
			}
			if (kind === 'shared') {
				return this.#sharedTransport.save({
					...payload,
					signatureId: this.#sharedSignatureId
				});
			}
			return this.#userTransport.save(payload);
		}
		getUpdateSuccessText() {
			return this.#userTransport.getUpdateSuccessText();
		}
	}

	const ASSIGNMENT_MODES = ['all', 'mailbox', 'department', 'draft'];
	const MODES_WITH_TARGETS = new Set(['mailbox', 'department']);
	const DEFAULT_ASSIGNMENT_MODE = 'draft';
	function detectAssignmentMode(assignments) {
		if (!assignments || assignments.length === 0) {
			return 'draft';
		}
		if (assignments.some(assignment => assignment.targetType === 'all')) {
			return 'all';
		}
		const byDepartment = assignments.some(assignment => assignment.targetType === 'department' || assignment.targetType === 'user');
		if (byDepartment) {
			return 'department';
		}
		return assignments.every(assignment => assignment.targetType === 'mailbox') ? 'mailbox' : DEFAULT_ASSIGNMENT_MODE;
	}
	function modeRequiresTargets(mode) {
		return MODES_WITH_TARGETS.has(mode);
	}

	class AssignmentBlock {
		#content = null;
		#mode = DEFAULT_ASSIGNMENT_MODE;
		#mailboxSelector = null;
		#departmentSelector = null;
		#initialAssignments;
		#onTargetAdd;
		constructor(options = {}) {
			this.#initialAssignments = options.assignments ?? [];
			this.#onTargetAdd = options.onTargetAdd ?? (() => {});
		}
		renderTo(container) {
			if (!container) {
				return;
			}
			this.#content = main_core.Tag.render`
			<div
				class="mail-signature-assignment-block"
				data-testid="mail-signature-assignment-container"
			></div>
		`;
			main_core.Dom.append(this.#content, container);
		}
		getSaveData() {
			return {
				kind: 'shared',
				assignments: this.getAssignments()
			};
		}
		getAssignments() {
			if (this.#mode === 'all') {
				return [{
					targetType: 'all',
					targetId: 0,
					isFlat: false
				}];
			}
			if (this.#mode === 'mailbox') {
				return this.#getMailboxAssignments();
			}
			if (this.#mode === 'department') {
				return this.#getDepartmentAssignments();
			}
			return [];
		}
		setMode(mode) {
			if (!ASSIGNMENT_MODES.includes(mode)) {
				return;
			}
			this.#mode = mode;
			if (!this.#content) {
				return;
			}
			main_core.Dom.clean(this.#content);
			if (mode === 'mailbox') {
				this.#renderMailboxSelector(this.#content);
			} else if (mode === 'department') {
				this.#renderDepartmentSelector(this.#content);
			}
		}
		#renderMailboxSelector(content) {
			const selectorContainer = main_core.Tag.render`
			<div
				class="mail-signature-assignment-block__selector"
				data-role="mailbox-selector"
				data-testid="mail-signature-mailbox-selector"
			></div>
		`;
			main_core.Dom.append(selectorContainer, content);
			this.#mailboxSelector = new ui_entitySelector.TagSelector({
				multiple: true,
				events: {
					onAfterTagAdd: () => {
						this.#onTargetAdd();
					}
				},
				dialogOptions: {
					targetNode: selectorContainer,
					context: 'MAIL_CORP_SIGNATURE_MAILBOXES',
					selectedItems: this.#getMailboxSelectorItems(),
					preselectedItems: this.#getMailboxSelectorPreselected(),
					entities: [{
						id: 'mail_mailbox',
						dynamicLoad: true,
						dynamicSearch: true
					}]
				}
			});
			this.#mailboxSelector.renderTo(selectorContainer);
		}
		#getMailboxAssignments() {
			if (!this.#mailboxSelector) {
				return [];
			}
			const result = [];
			this.#mailboxSelector.getTags().forEach(tag => {
				const parsed = mail_lib_entitySelector.parseSelectorTag(tag);
				if (parsed && parsed.entity === 'mail_mailbox') {
					result.push({
						targetType: 'mailbox',
						targetId: parsed.id,
						isFlat: false
					});
				}
			});
			return result;
		}
		#getMailboxSelectorPreselected() {
			return this.#initialAssignments.filter(assignment => assignment.targetType === 'mailbox' && assignment.targetId > 0).map(assignment => ['mail_mailbox', Number(assignment.targetId)]);
		}
		#getMailboxSelectorItems() {
			const items = [];
			this.#initialAssignments.forEach(assignment => {
				const title = assignment.title ?? '';
				if (assignment.targetType === 'mailbox' && assignment.targetId > 0 && title !== '') {
					items.push({
						entityId: 'mail_mailbox',
						id: Number(assignment.targetId),
						title
					});
				}
			});
			return items;
		}
		#renderDepartmentSelector(content) {
			const selectorContainer = main_core.Tag.render`
			<div
				class="mail-signature-assignment-block__selector"
				data-role="dept-selector"
				data-testid="mail-signature-department-selector"
			></div>
		`;
			main_core.Dom.append(selectorContainer, content);
			this.#departmentSelector = new ui_entitySelector.TagSelector({
				multiple: true,
				events: {
					onAfterTagAdd: () => {
						this.#onTargetAdd();
					}
				},
				dialogOptions: {
					targetNode: selectorContainer,
					context: 'MAIL_CORP_SIGNATURE_ASSIGNMENT',
					selectedItems: this.#getDepartmentSelectorItems(),
					preselectedItems: this.#getDepartmentSelectorPreselected(),
					entities: mail_lib_entitySelector.getUserDepartmentEntities(),
					preload: true,
					events: {
						onLoad: event => {
							const dialog = event.getTarget();
							if (dialog && !dialog.getRecentTab().getRootNode().hasChildren()) {
								dialog.selectTab('departments');
							}
						}
					}
				}
			});
			this.#departmentSelector.renderTo(selectorContainer);
		}
		#getDepartmentAssignments() {
			if (!this.#departmentSelector) {
				return [];
			}
			const result = [];
			this.#departmentSelector.getTags().forEach(tag => {
				const parsed = mail_lib_entitySelector.parseSelectorTag(tag);
				if (!parsed) {
					return;
				}
				if (parsed.entity === 'department') {
					result.push({
						targetType: 'department',
						targetId: parsed.id,
						isFlat: parsed.isFlat
					});
				} else if (parsed.entity === 'user') {
					result.push({
						targetType: 'user',
						targetId: parsed.id,
						isFlat: false
					});
				}
			});
			return result;
		}
		#getDepartmentSelectorPreselected() {
			const items = [];
			this.#initialAssignments.forEach(assignment => {
				if (assignment.targetType === 'department') {
					items.push(['department', mail_lib_entitySelector.buildDepartmentItemId(assignment.targetId, assignment.isFlat)]);
				} else if (assignment.targetType === 'user' && assignment.targetId > 0) {
					items.push(['user', assignment.targetId]);
				}
			});
			return items;
		}
		#getDepartmentSelectorItems() {
			const items = [];
			this.#initialAssignments.forEach(assignment => {
				const title = assignment.title ?? '';
				if (title === '') {
					return;
				}
				if (assignment.targetType === 'department') {
					items.push({
						entityId: 'department',
						id: mail_lib_entitySelector.buildDepartmentItemId(assignment.targetId, assignment.isFlat),
						title
					});
				} else if (assignment.targetType === 'user' && assignment.targetId > 0) {
					items.push({
						entityId: 'user',
						id: assignment.targetId,
						title
					});
				}
			});
			return items;
		}
	}

	const RADIO_GROUP = 'mail-signature-assignment-type';
	class AssignmentTypeSelector {
		#shared;
		#mode;
		#assignmentBlock;
		#switcher = null;
		#contentContainer = null;
		#errorContainer = null;
		#radios = new Map();
		#scopeHandlers = [];
		constructor(options = {}) {
			const assignments = options.assignments ?? [];
			this.#shared = options.shared === true;
			this.#mode = options.mode ?? detectAssignmentMode(assignments);
			this.#assignmentBlock = new AssignmentBlock({
				assignments,
				onTargetAdd: () => {
					this.#hideError();
				}
			});
		}
		renderTo(container) {
			const label = main_core.Loc.getMessage('MAIL_SIGNATURE_EDITOR_ASSIGN_TYPE_LABEL') ?? '';
			const switcherNode = main_core.Tag.render`
			<button
				type="button"
				class="mail-signature-shared-scope__switcher"
				data-testid="mail-signature-shared-switcher"
				role="switch"
				aria-checked="${this.#shared}"
				aria-label="${main_core.Loc.getMessage('MAIL_SIGNATURE_EDITOR_SHARED_SCOPE_TITLE') ?? ''}"
			></button>
		`;
			const card = main_core.Tag.render`
			<div class="mail-signature-shared-scope" data-testid="mail-signature-shared-scope">
				<div class="mail-signature-shared-scope__header">
					<div class="mail-signature-shared-scope__title-block">
						<div class="mail-signature-shared-scope__title">
							${main_core.Loc.getMessage('MAIL_SIGNATURE_EDITOR_SHARED_SCOPE_TITLE') ?? ''}
						</div>
						<div class="mail-signature-shared-scope__subtitle">
							${main_core.Loc.getMessage('MAIL_SIGNATURE_EDITOR_SHARED_SCOPE_HINT') ?? ''}
						</div>
					</div>
					${switcherNode}
				</div>
				<div class="mail-signature-shared-scope__content" data-role="shared-scope-content">
					<div class="mail-signature-assignment-type__label">${label}</div>
					<div
						class="mail-signature-assignment-type__options"
						role="radiogroup"
						aria-label="${label}"
					>
						${ASSIGNMENT_MODES.map(mode => this.#renderOption(mode))}
					</div>
					<div class="mail-signature-assignment-type__panel" data-role="shared-panel"></div>
					<div
						class="mail-signature-assignment-type__error"
						data-role="shared-error"
						data-testid="mail-signature-assignment-error"
						role="status"
						aria-live="polite"
					></div>
				</div>
			</div>
		`;
			main_core.Dom.append(card, container);
			this.#switcher = new ui_switcher.Switcher({
				node: switcherNode,
				size: ui_switcher.SwitcherSize.large,
				useAirDesign: true,
				showStateTitle: false,
				checked: this.#shared,
				handlers: {
					toggled: () => {
						const shared = this.#switcher?.isChecked() === true;
						switcherNode.setAttribute('aria-checked', String(shared));
						this.#setShared(shared);
					}
				}
			});
			this.#contentContainer = card.querySelector('[data-role="shared-scope-content"]');
			this.#errorContainer = card.querySelector('[data-role="shared-error"]');
			const panelContainer = card.querySelector('[data-role="shared-panel"]');
			if (panelContainer) {
				this.#assignmentBlock.renderTo(panelContainer);
				this.#assignmentBlock.setMode(this.#mode);
			}
			this.#updateVisibility();
		}
		isSharedScope() {
			return this.#shared;
		}
		subscribeToScope(handler) {
			this.#scopeHandlers.push(handler);
		}
		getSaveData() {
			const data = this.#assignmentBlock.getSaveData();
			return {
				...data,
				kind: 'shared',
				assignments: data.assignments?.length ? data.assignments : this.#fallbackAssignments()
			};
		}
		validate() {
			if (this.#shared && modeRequiresTargets(this.#mode) && this.#assignmentBlock.getAssignments().length === 0) {
				this.#showError();
				return false;
			}
			this.#hideError();
			return true;
		}
		#showError() {
			if (this.#errorContainer) {
				this.#errorContainer.textContent = main_core.Loc.getMessage('MAIL_SIGNATURE_EDITOR_ASSIGN_TARGETS_REQUIRED') ?? '';
			}
		}
		#hideError() {
			if (this.#errorContainer) {
				this.#errorContainer.textContent = '';
			}
		}
		#renderOption(mode) {
			const title = main_core.Loc.getMessage(`MAIL_SIGNATURE_EDITOR_ASSIGN_TYPE_${mode.toUpperCase()}`) ?? mode;
			const radio = new ui_system_radiobutton.RadioButton({
				group: RADIO_GROUP,
				size: ui_system_radiobutton.RadioButtonSize.Md,
				checked: mode === this.#mode,
				attributes: {
					value: mode,
					'aria-label': title,
					'data-testid': `mail-signature-assignment-${mode}`
				},
				onChange: ({
					checked
				}) => {
					if (checked) {
						this.#selectMode(mode);
					}
				}
			});
			this.#radios.set(mode, radio);
			const option = main_core.Tag.render`
			<div class="mail-signature-assignment-type__option">
				${radio.render()}
				<span class="mail-signature-assignment-type__option-text">${title}</span>
			</div>
		`;
			main_core.Event.bind(option, 'click', event => {
				if (event.target instanceof HTMLElement && event.target.closest('label')) {
					return;
				}
				this.#selectMode(mode);
			});
			return option;
		}
		#selectMode(mode) {
			this.#mode = mode;
			this.#hideError();
			this.#syncRadios();
			this.#assignmentBlock.setMode(mode);
		}
		#syncRadios() {
			this.#radios.forEach((radio, mode) => {
				radio.setChecked(mode === this.#mode);
			});
		}
		#setShared(shared) {
			if (shared === this.#shared) {
				return;
			}
			this.#shared = shared;
			this.#updateVisibility();
			this.#scopeHandlers.forEach(handler => {
				handler(shared);
			});
		}
		#updateVisibility() {
			if (this.#contentContainer) {
				main_core.Dom.style(this.#contentContainer, 'display', this.#shared ? '' : 'none');
			}
		}
		#fallbackAssignments() {
			if (this.#mode === 'all') {
				return [{
					targetType: 'all',
					targetId: 0,
					isFlat: false
				}];
			}
			return [];
		}
	}

	class UserSignatureTransport {
		save(payload) {
			const {
				action,
				data
			} = buildUserSignatureSaveRequest(payload);
			return main_core.ajax.runAction(action, {
				data
			}).then(response => payload.signatureId > 0 ? payload.signatureId : extractUserSignatureId(response.data));
		}
		getUpdateSuccessText() {
			return main_core.Loc.getMessage('MAIL_SIGNATURE_EDITOR_UPDATE_SUCCESS') ?? '';
		}
	}

	class SharedSignatureTransport {
		save(payload) {
			const {
				action,
				data
			} = buildSharedSignatureSaveRequest(payload);
			return main_core.ajax.runAction(action, {
				data
			}).then(response => payload.signatureId > 0 ? payload.signatureId : extractSharedSignatureId(response.data));
		}
		getUpdateSuccessText() {
			return main_core.Loc.getMessage('MAIL_SIGNATURE_EDITOR_SHARED_UPDATE_SUCCESS') ?? '';
		}
	}

	class UnifiedSignatureTransport {
		save(payload) {
			const {
				action,
				data
			} = buildUnifiedSignatureUpdateRequest(payload);
			return main_core.ajax.runAction(action, {
				data
			}).then(() => payload.signatureId);
		}
		getUpdateSuccessText() {
			return main_core.Loc.getMessage('MAIL_SIGNATURE_EDITOR_UPDATE_SUCCESS') ?? '';
		}
	}

	exports.ASSIGNMENTS_PROVIDED = ASSIGNMENTS_PROVIDED;
	exports.ASSIGNMENT_MODES = ASSIGNMENT_MODES;
	exports.AssignmentBlock = AssignmentBlock;
	exports.AssignmentTypeSelector = AssignmentTypeSelector;
	exports.CompositeTransport = CompositeTransport;
	exports.DEFAULT_ASSIGNMENT_MODE = DEFAULT_ASSIGNMENT_MODE;
	exports.SENDER_OPTION_ENTITY_ID = SENDER_OPTION_ENTITY_ID;
	exports.SenderBindingPanel = SenderBindingPanel;
	exports.SharedSignatureTransport = SharedSignatureTransport;
	exports.SignatureEditor = SignatureEditor;
	exports.SignatureMacroCapability = SignatureMacroCapability;
	exports.SignatureMacroCatalog = SignatureMacroCatalog;
	exports.UnifiedSignatureTransport = UnifiedSignatureTransport;
	exports.UserSignatureTransport = UserSignatureTransport;
	exports.buildSenderSelectorItems = buildSenderSelectorItems;
	exports.buildSharedSignatureSaveRequest = buildSharedSignatureSaveRequest;
	exports.buildSignatureMacroMenuOptions = buildSignatureMacroMenuOptions;
	exports.buildUnifiedSignatureUpdateRequest = buildUnifiedSignatureUpdateRequest;
	exports.buildUserSignatureSaveRequest = buildUserSignatureSaveRequest;
	exports.detectAssignmentMode = detectAssignmentMode;
	exports.extractSharedSignatureId = extractSharedSignatureId;
	exports.extractUserSignatureId = extractUserSignatureId;
	exports.findFirstUnknownMacro = findFirstUnknownMacro;
	exports.getInitialSenderOptionId = getInitialSenderOptionId;
	exports.getSenderValueById = getSenderValueById;
	exports.modeRequiresTargets = modeRequiresTargets;
	exports.needsUnifiedTransport = needsUnifiedTransport;
	exports.pickPanelData = pickPanelData;

})(this.BX.Mail.Signature.Editor = this.BX.Mail.Signature.Editor || {}, BX, BX.UI, BX.UI.Notification, BX.UI, BX.UI.EntitySelector, BX.UI.System.RadioButton, BX.UI, BX.Mail.Lib.EntitySelector);
//# sourceMappingURL=editor.bundle.js.map
