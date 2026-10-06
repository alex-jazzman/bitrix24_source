/* eslint-disable */
this.BX = this.BX || {};
this.BX.Note = this.BX.Note || {};
(function (exports, ui_progressbar, main_core, ui_buttons, ui_system_dialog, ui_notification, note_ui_themeContext, ui_system_checkbox, ui_iconSet_api_core, ui_iconSet_outline, note_ui_loader, ui_vue3, ui_system_input_vue, ui_system_menu, ui_system_alert_vue, ui_system_alert) {
	'use strict';

	const SOURCE_TYPE_OUTLINE = 'outline';
	const SOURCE_TYPE_WIKI = 'wiki';
	const IMPORT_POLL_INTERVAL_MS = 5000;
	const SOURCE_TYPES = Object.freeze([Object.freeze({
		id: SOURCE_TYPE_OUTLINE,
		label: main_core.Loc.getMessage('NOTE_IMPORT_SOURCE_OUTLINE'),
		enabled: true
	}), Object.freeze({
		id: SOURCE_TYPE_WIKI,
		label: main_core.Loc.getMessage('NOTE_IMPORT_SOURCE_WIKI'),
		enabled: true
	})]);
	const IMPORT_SCREEN = Object.freeze({
		LOADING: 'loading',
		CONNECTION: 'connection',
		COLLECTIONS: 'collections',
		OVERWRITE_CONFIRM: 'overwriteConfirm',
		PROGRESS: 'progress'
	});
	const IMPORT_PROGRESS_STATUS = Object.freeze({
		IN_PROGRESS: 'in_progress',
		DONE: 'done',
		ERROR: 'error',
		CANCELLED: 'cancelled'
	});
	function createDefaultImportCollection() {
		return {
			id: '',
			name: ''
		};
	}
	function createDefaultImportTreeNode() {
		return {
			id: '',
			title: '',
			parentId: null,
			children: []
		};
	}
	function createDefaultConnectionFormState() {
		return {
			sourceType: SOURCE_TYPE_OUTLINE,
			url: '',
			token: '',
			errorMessage: '',
			isSubmitting: false,
			touched: {
				sourceType: false,
				url: false,
				token: false
			},
			errors: {
				sourceType: '',
				url: '',
				token: ''
			}
		};
	}
	function createDefaultCollectionsScreenState() {
		return {
			isLoading: false,
			errorMessage: '',
			collections: [],
			selectedCollectionIds: new Set(),
			expandedCollectionIds: new Set(),
			treeByCollectionId: new Map()
		};
	}
	function createDefaultOverwriteState() {
		return {
			collections: [],
			expandedCollectionIds: new Set(),
			treeByCollectionId: new Map()
		};
	}
	function createDefaultProgressScreenState() {
		return {
			isImporting: false,
			isCancelling: false,
			errorMessage: '',
			progress: null
		};
	}
	function resolveProgressScreenStatus(state) {
		if (state.errorMessage) {
			return 'error';
		}
		const progress = state.progress;
		if (!progress) {
			return 'preparing';
		}
		if (progress.status === IMPORT_PROGRESS_STATUS.CANCELLED) {
			return 'cancelled';
		}
		if (progress.status === IMPORT_PROGRESS_STATUS.ERROR) {
			return 'error';
		}
		if (progress.status === IMPORT_PROGRESS_STATUS.DONE) {
			return (progress.error ?? 0) > 0 ? 'done_error' : 'done_ok';
		}
		if (progress.step === 'downloadAttachments' || progress.step === 'retryAttachments') {
			return 'attachments';
		}
		if (progress.step === 'createStructure' || progress.step === 'fillContent') {
			return 'documents';
		}
		return 'preparing';
	}
	function buildCheckConnectionPayload(sourceType, url, token) {
		return {
			sourceType,
			url,
			token
		};
	}
	function buildGetCollectionsPayload(sourceType, url, token) {
		return {
			sourceType,
			url,
			token
		};
	}
	function buildGetDocumentTreePayload(sourceType, url, token, collectionId) {
		return {
			sourceType,
			url,
			token,
			collectionId
		};
	}
	function buildCheckOverlapPayload(sourceType, collectionIds) {
		return {
			sourceType,
			collectionIds
		};
	}
	function buildStartPayload(sourceType, url, token, collectionIds, overwrite = false) {
		return {
			sourceType,
			url,
			token,
			collectionIds,
			overwrite
		};
	}
	function buildGetStatusPayload(sessionId) {
		return {
			sessionId
		};
	}
	function buildCancelPayload(sessionId) {
		return {
			sessionId
		};
	}
	function buildAcknowledgeFinishPayload(sessionId) {
		return {
			sessionId
		};
	}

	const ALLOWED_PROGRESS_STATUS = new Set(Object.values(IMPORT_PROGRESS_STATUS));
	function normalizeCheckConnectionResponse(rawResponse) {
		if (!main_core.Type.isPlainObject(rawResponse)) {
			throw new TypeError('Invalid checkConnection response');
		}
		return {
			instanceName: String(rawResponse.instanceName ?? '')
		};
	}
	function normalizeGetCollectionsResponse(rawResponse) {
		if (!main_core.Type.isPlainObject(rawResponse) || !Array.isArray(rawResponse.collections)) {
			throw new TypeError('Invalid getCollections response');
		}
		return {
			collections: rawResponse.collections.map(collection => normalizeImportCollection(collection))
		};
	}
	function normalizeGetDocumentTreeResponse(rawResponse) {
		if (!main_core.Type.isPlainObject(rawResponse) || !Array.isArray(rawResponse.documents)) {
			throw new TypeError('Invalid getDocumentTree response');
		}
		return {
			documents: rawResponse.documents.map(document => normalizeImportDocumentTreeNode(document))
		};
	}
	function normalizeStartResponse(rawResponse) {
		if (!main_core.Type.isPlainObject(rawResponse)) {
			throw new TypeError('Invalid start response');
		}
		const sessionId = toPositiveInt(rawResponse.sessionId);
		if (sessionId === null) {
			throw new TypeError('Invalid start sessionId');
		}
		return {
			sessionId,
			progress: normalizeImportProgress(rawResponse.progress)
		};
	}
	function normalizeGetStatusResponse(rawResponse) {
		if (!main_core.Type.isPlainObject(rawResponse)) {
			throw new TypeError('Invalid getStatus response');
		}
		return {
			progress: normalizeImportProgress(rawResponse.progress)
		};
	}
	function normalizeImportCollection(rawCollection) {
		const defaultCollection = createDefaultImportCollection();
		if (!main_core.Type.isPlainObject(rawCollection)) {
			return defaultCollection;
		}
		return {
			id: String(rawCollection.id ?? defaultCollection.id),
			name: String(rawCollection.name ?? defaultCollection.name)
		};
	}
	function normalizeImportDocumentTreeNode(rawNode) {
		const defaultNode = createDefaultImportTreeNode();
		if (!main_core.Type.isPlainObject(rawNode)) {
			return defaultNode;
		}
		return {
			id: String(rawNode.id ?? defaultNode.id),
			title: String(rawNode.title ?? defaultNode.title),
			parentId: toNullableString(rawNode.parentId),
			children: Array.isArray(rawNode.children) ? rawNode.children.map(child => normalizeImportDocumentTreeNode(child)) : defaultNode.children
		};
	}
	function normalizeImportProgress(rawProgress) {
		if (!main_core.Type.isPlainObject(rawProgress)) {
			throw new TypeError('Invalid import progress');
		}
		const rawStatus = String(rawProgress.status ?? IMPORT_PROGRESS_STATUS.IN_PROGRESS);
		const status = ALLOWED_PROGRESS_STATUS.has(rawStatus) ? rawStatus : IMPORT_PROGRESS_STATUS.IN_PROGRESS;
		return {
			status,
			step: String(rawProgress.step ?? ''),
			total: toNonNegativeInt(rawProgress.total) ?? 0,
			done: toNonNegativeInt(rawProgress.done) ?? 0,
			error: toNonNegativeInt(rawProgress.error) ?? 0,
			totalAttachments: toNonNegativeInt(rawProgress.totalAttachments) ?? 0,
			doneAttachments: toNonNegativeInt(rawProgress.doneAttachments) ?? 0,
			collectionName: String(rawProgress.collectionName ?? ''),
			collectionIndex: toNonNegativeInt(rawProgress.collectionIndex) ?? 0,
			collectionCount: toNonNegativeInt(rawProgress.collectionCount) ?? 0,
			errorDetails: normalizeErrorDetails(rawProgress.errorDetails)
		};
	}
	function normalizeErrorDetails(raw) {
		if (!Array.isArray(raw)) {
			return [];
		}
		return raw.filter(item => main_core.Type.isPlainObject(item)).map(item => ({
			title: String(item.title ?? ''),
			reason: String(item.reason ?? '')
		}));
	}
	function toPositiveInt(value) {
		const parsed = Number(value);
		if (!Number.isInteger(parsed) || parsed <= 0) {
			return null;
		}
		return parsed;
	}
	function toNonNegativeInt(value) {
		const parsed = Number(value);
		if (!Number.isInteger(parsed) || parsed < 0) {
			return null;
		}
		return parsed;
	}
	function toNullableString(value) {
		if (value === null || value === undefined || value === '') {
			return null;
		}
		return String(value);
	}

	class ImportApi {
		#controller;
		constructor(controller = 'note.infrastructure.ImportController') {
			this.#controller = controller;
		}
		async getActiveSession() {
			return this.#call('getActiveSession', {});
		}
		async checkOverlap(payload) {
			return this.#call('checkOverlap', payload);
		}
		async checkConnection(payload) {
			const response = await this.#call('checkConnection', payload);
			return normalizeCheckConnectionResponse(response);
		}
		async getCollections(payload) {
			const response = await this.#call('getCollections', payload);
			return normalizeGetCollectionsResponse(response);
		}
		async getDocumentTree(payload) {
			const response = await this.#call('getDocumentTree', payload);
			return normalizeGetDocumentTreeResponse(response);
		}
		async start(payload) {
			const response = await this.#call('start', payload);
			return normalizeStartResponse(response);
		}
		async getStatus(payload) {
			const response = await this.#call('getStatus', payload);
			return normalizeGetStatusResponse(response);
		}
		async cancel(payload) {
			const response = await this.#call('cancel', payload);
			return response === true;
		}
		async acknowledgeFinish(payload) {
			const response = await this.#call('acknowledgeFinish', payload);
			return response === true;
		}
		#call(action, data) {
			return main_core.ajax.runAction(`${this.#controller}.${action}`, {
				data
			}).then(response => response?.data).catch(error => {
				const wrapped = new Error(this.#extractErrorMessage(error));
				const code = this.#extractErrorCode(error);
				if (code !== '') {
					wrapped.code = code;
				}
				throw wrapped;
			});
		}
		#extractErrorMessage(error) {
			if (main_core.Type.isPlainObject(error)) {
				const firstError = error?.errors?.[0]?.message;
				if (main_core.Type.isStringFilled(firstError)) {
					return firstError;
				}
				if (main_core.Type.isStringFilled(error.message)) {
					return error.message;
				}
			}
			return 'Request failed';
		}
		#extractErrorCode(error) {
			if (main_core.Type.isPlainObject(error)) {
				const code = error?.errors?.[0]?.code;
				if (main_core.Type.isStringFilled(code)) {
					return code;
				}
			}
			return '';
		}
	}

	function renderCollectionCard(collection, state, handlers, options = {}) {
		const hasCheckbox = options.hasCheckbox !== false;
		const isSelected = state.selectedCollectionIds?.has(collection.id) ?? false;
		const isExpanded = state.expandedCollectionIds.has(collection.id);
		const wrapper = main_core.Tag.render`<div class="note-import-collection"></div>`;
		const row = main_core.Tag.render`<div class="note-import-collection-row"></div>`;
		const disclosure = renderDisclosure(isExpanded);
		const title = main_core.Tag.render`<div class="note-import-collection-title">${main_core.Text.encode(collection.name)}</div>`;
		if (hasCheckbox) {
			const checkbox = new ui_system_checkbox.Checkbox({
				size: ui_system_checkbox.CheckboxSize.Md,
				checked: isSelected,
				onChange: () => handlers.onToggleCollectionSelection?.(collection.id)
			});
			row.append(checkbox.render());
		}
		main_core.Event.bind(disclosure, 'click', () => handlers.onToggleCollectionExpanded(collection.id));
		row.append(disclosure, title);
		wrapper.append(row);
		if (isExpanded) {
			wrapper.append(renderTree(state.treeByCollectionId.get(collection.id), collection.id, handlers.onRetryTreeLoad));
		}
		return wrapper;
	}
	function renderChevronIcon(isExpanded) {
		return new ui_iconSet_api_core.Icon({
			icon: isExpanded ? ui_iconSet_api_core.Outline.CHEVRON_DOWN_L : ui_iconSet_api_core.Outline.CHEVRON_RIGHT_L,
			size: 20
		}).render();
	}
	function renderDisclosure(isExpanded) {
		const button = main_core.Tag.render`<button type="button" class="note-import-disclosure"></button>`;
		button.append(renderChevronIcon(isExpanded));
		return button;
	}
	function renderTreePlaceholder() {
		return main_core.Tag.render`<span class="note-import-disclosure-placeholder"></span>`;
	}
	function renderTree(treeState, collectionId, onRetryTreeLoad) {
		if (!treeState || treeState.isLoading) {
			return main_core.Tag.render`
			<div class="note-import-tree note-import-tree-loading">
				${renderBulletLoader()}
			</div>
		`;
		}
		if (treeState.errorMessage) {
			const container = main_core.Tag.render`<div class="note-import-tree"></div>`;
			container.append(createErrorBlock(treeState.errorMessage, () => onRetryTreeLoad(collectionId)));
			return container;
		}
		if (treeState.documents.length === 0) {
			return main_core.Tag.render`
			<ul class="note-import-tree">
				<li class="note-import-tree-item">
					<div class="note-import-tree-row">
						${renderTreePlaceholder()}
						<div class="note-import-tree-title note-import-muted">${main_core.Loc.getMessage('NOTE_IMPORT_PREVIEW_EMPTY')}</div>
					</div>
				</li>
			</ul>
		`;
		}
		const list = main_core.Tag.render`<ul class="note-import-tree"></ul>`;
		for (const document of treeState.documents) {
			list.append(renderTreeBranch(document));
		}
		return list;
	}
	function renderTreeBranch(node) {
		const item = main_core.Tag.render`<li class="note-import-tree-item"></li>`;
		const hasChildren = node.children.length > 0;
		const row = main_core.Tag.render`<div class="note-import-tree-row"></div>`;
		const rawTitle = typeof node.title === 'string' ? node.title.trim() : '';
		const title = rawTitle === '' ? main_core.Tag.render`<div class="note-import-tree-title note-import-muted">${main_core.Loc.getMessage('NOTE_IMPORT_DOCUMENT_UNTITLED')}</div>` : main_core.Tag.render`<div class="note-import-tree-title">${main_core.Text.encode(rawTitle)}</div>`;
		if (hasChildren) {
			const disclosure = renderDisclosure(false);
			const childrenList = main_core.Tag.render`<ul class="note-import-tree-children"></ul>`;
			main_core.Dom.style(childrenList, 'display', 'none');
			for (const child of node.children) {
				childrenList.append(renderTreeBranch(child));
			}
			let isExpanded = false;
			main_core.Event.bind(disclosure, 'click', () => {
				isExpanded = !isExpanded;
				main_core.Dom.style(childrenList, 'display', isExpanded ? '' : 'none');
				disclosure.replaceChildren(renderChevronIcon(isExpanded));
			});
			row.append(disclosure, title);
			item.append(row, childrenList);
		} else {
			row.append(renderTreePlaceholder(), title);
			item.append(row);
		}
		return item;
	}
	function renderBulletLoader() {
		return main_core.Tag.render`
		<div class="ui-loader__bullet" role="status" aria-live="polite">
			<div class="ui-loader__bullet_item"></div>
			<div class="ui-loader__bullet_item"></div>
			<div class="ui-loader__bullet_item"></div>
			<div class="ui-loader__bullet_item"></div>
			<div class="ui-loader__bullet_item"></div>
		</div>
	`;
	}
	function createErrorBlock(message, onRetry) {
		const container = main_core.Tag.render`<div class="note-import-error-block"></div>`;
		const retryButton = main_core.Tag.render`
		<button type="button" class="note-import-link-button" data-testid="note-import-retry">${main_core.Loc.getMessage('NOTE_IMPORT_RETRY')}</button>
	`;
		main_core.Event.bind(retryButton, 'click', () => onRetry());
		container.append(main_core.Tag.render`<div class="note-import-error">${main_core.Text.encode(message)}</div>`, retryButton);
		return container;
	}

	function renderCollectionsScreen(state, handlers) {
		const container = main_core.Tag.render`<div class="note-import-screen note-import-screen-collections"></div>`;
		container.append(main_core.Tag.render`
		<div class="note-import-subtitle">${main_core.Loc.getMessage('NOTE_IMPORT_COLLECTIONS_HINT')}</div>
	`);
		if (state.isLoading) {
			container.append(main_core.Tag.render`
			<div class="note-import-screen-loading">${renderBulletLoader()}</div>
		`);
			return container;
		}
		if (state.errorMessage) {
			container.append(createErrorBlock(state.errorMessage, handlers.onRetryCollectionsLoad));
			return container;
		}
		if (state.collections.length === 0) {
			container.append(main_core.Tag.render`<div class="note-import-muted">${main_core.Loc.getMessage('NOTE_IMPORT_EMPTY_COLLECTIONS')}</div>`);
			return container;
		}
		const list = main_core.Tag.render`<div class="note-import-collection-list"></div>`;
		for (const collection of state.collections) {
			list.append(renderCollectionCard(collection, state, handlers, {
				hasCheckbox: true
			}));
		}
		container.append(list);
		return container;
	}

	function createConnectionScreen(handlers, sources) {
		const element = document.createElement('div');
		element.className = 'note-import-screen note-import-screen-connection';
		let sourceMenu = null;
		const ConnectionForm = {
			name: 'NoteImportConnectionForm',
			components: {
				BInput: ui_system_input_vue.BInput,
				Alert: ui_system_alert_vue.Alert
			},
			data() {
				return {
					sourceType: '',
					sourceLabel: '',
					url: '',
					token: '',
					sourceError: '',
					urlError: '',
					tokenError: '',
					isWiki: false,
					noticeDesign: ui_system_alert.AlertDesign.tintedWarning,
					labels: {
						source: main_core.Loc.getMessage('NOTE_IMPORT_SOURCE_LABEL'),
						sourcePlaceholder: main_core.Loc.getMessage('NOTE_IMPORT_SOURCE_PLACEHOLDER'),
						url: main_core.Loc.getMessage('NOTE_IMPORT_URL_LABEL'),
						urlPlaceholder: main_core.Loc.getMessage('NOTE_IMPORT_CONNECTION_PLACEHOLDER'),
						token: main_core.Loc.getMessage('NOTE_IMPORT_TOKEN_LABEL'),
						tokenPlaceholder: main_core.Loc.getMessage('NOTE_IMPORT_TOKEN_PLACEHOLDER'),
						wikiNotice: main_core.Loc.getMessage('NOTE_IMPORT_WIKI_LOSS_NOTICE')
					},
					inputSize: ui_system_input_vue.InputSize.Lg,
					inputDesign: ui_system_input_vue.InputDesign.Grey
				};
			},
			methods: {
				handleUrlUpdate(value) {
					this.url = value;
					handlers.onUrlInput(value);
				},
				handleUrlBlur() {
					handlers.onUrlBlur();
				},
				handleTokenUpdate(value) {
					this.token = value;
					handlers.onTokenInput(value);
				},
				handleTokenBlur() {
					handlers.onTokenBlur();
				},
				handleSourceClick() {
					const enabled = sources.filter(source => source.enabled);
					if (enabled.length === 0) {
						return;
					}
					const bindElement = this.$refs.sourceInput?.$el ?? this.$el;
					const width = bindElement?.offsetWidth ?? 0;
					sourceMenu?.destroy();
					sourceMenu = new ui_system_menu.Menu({
						minWidth: width,
						width,
						designSystemContext: note_ui_themeContext.NoteThemeContext.getDesignSystemContext(),
						className: 'note-import-source-menu',
						items: enabled.map(source => ({
							id: source.id,
							title: source.label,
							isSelected: source.id === this.sourceType,
							onClick: () => {
								handlers.onSourceChange(source.id);
								sourceMenu?.close();
							}
						}))
					});
					sourceMenu.show(bindElement);
				}
			},
			mounted() {
				const bindEnter = refName => {
					const inputEl = this.$refs[refName]?.$el?.querySelector('input');
					if (inputEl) {
						main_core.Event.bind(inputEl, 'keydown', event => {
							if (event.key === 'Enter') {
								handlers.onSubmit();
							}
						});
					}
				};
				bindEnter('urlInput');
				bindEnter('tokenInput');
			},
			template: `
			<div class="note-import-connection-form">
				<BInput
					ref="sourceInput"
					:modelValue="sourceLabel"
					:label="labels.source"
					:placeholder="labels.sourcePlaceholder"
					:error="sourceError"
					:size="inputSize"
					:design="inputDesign"
					required
					stretched
					clickable
					dropdown
					readonly
					@click="handleSourceClick"
				/>
				<Alert v-if="isWiki" :design="noticeDesign">
					{{ labels.wikiNotice }}
				</Alert>
				<BInput
					v-if="!isWiki"
					ref="urlInput"
					:modelValue="url"
					@update:modelValue="handleUrlUpdate"
					:label="labels.url"
					:placeholder="labels.urlPlaceholder"
					:error="urlError"
					:size="inputSize"
					:design="inputDesign"
					required
					stretched
					type="text"
					@blur="handleUrlBlur"
				/>
				<BInput
					v-if="!isWiki"
					ref="tokenInput"
					:modelValue="token"
					@update:modelValue="handleTokenUpdate"
					:label="labels.token"
					:placeholder="labels.tokenPlaceholder"
					:error="tokenError"
					:size="inputSize"
					:design="inputDesign"
					required
					stretched
					type="password"
					@blur="handleTokenBlur"
				/>
			</div>
		`
		};
		const app = ui_vue3.BitrixVue.createApp(ConnectionForm);
		const vm = app.mount(element);
		function applyState(state) {
			const sourceType = state.sourceType ?? '';
			const source = sources.find(item => item.id === sourceType);
			vm.sourceType = sourceType;
			vm.sourceLabel = source ? source.label : '';
			vm.isWiki = sourceType === SOURCE_TYPE_WIKI;
			const nextUrl = String(state.url ?? '');
			if (vm.url !== nextUrl) {
				vm.url = nextUrl;
			}
			const nextToken = String(state.token ?? '');
			if (vm.token !== nextToken) {
				vm.token = nextToken;
			}
			syncErrors(state);
		}
		function syncErrors(state) {
			const errors = state.errors ?? {
				sourceType: '',
				url: '',
				token: ''
			};
			const touched = state.touched ?? {
				sourceType: false,
				url: false,
				token: false
			};
			vm.sourceError = touched.sourceType ? errors.sourceType ?? '' : '';
			vm.urlError = touched.url ? errors.url ?? '' : '';
			vm.tokenError = touched.token ? errors.token ?? '' : '';
		}
		function focusField(field) {
			const refName = field === 'url' ? 'urlInput' : field === 'token' ? 'tokenInput' : null;
			if (refName) {
				vm.$refs[refName]?.focus?.();
				return;
			}
			if (field === 'sourceType') {
				vm.handleSourceClick();
			}
		}
		function destroy() {
			sourceMenu?.destroy();
			sourceMenu = null;
			app.unmount();
		}
		return {
			element,
			applyState,
			syncErrors,
			focusField,
			destroy
		};
	}

	function renderOverwriteConfirmScreen(state, handlers) {
		const container = main_core.Tag.render`<div class="note-import-screen note-import-screen-overwrite-confirm"></div>`;
		container.append(main_core.Tag.render`<div class="note-import-overwrite-message">${main_core.Loc.getMessage('NOTE_IMPORT_OVERWRITE_WARNING')}</div>`);
		const list = main_core.Tag.render`<div class="note-import-collection-list"></div>`;
		for (const collection of state.collections) {
			list.append(renderCollectionCard(collection, state, handlers, {
				hasCheckbox: false
			}));
		}
		container.append(list);
		return container;
	}

	const STATUS_TO_MASCOT = {
		preparing: 'working',
		documents: 'working',
		attachments: 'working',
		done_ok: 'done',
		done_error: 'error',
		cancelled: 'error',
		error: 'error'
	};
	function renderProgressScreen(state) {
		const status = resolveProgressScreenStatus(state);
		const container = main_core.Tag.render`<div class="note-import-screen note-import-screen-progress"></div>`;
		container.append(renderTitle(status));
		container.append(renderBar(state, status));
		const body = main_core.Tag.render`<div class="note-import-progress__body"></div>`;
		body.append(renderSummary(state, status));
		body.append(renderMascot(status));
		container.append(body);
		return container;
	}
	function renderTitle(status) {
		const variant = (() => {
			switch (status) {
				case 'done_ok':
					return 'success';
				case 'done_error':
				case 'cancelled':
				case 'error':
					return 'alert';
				default:
					return 'muted';
			}
		})();
		const text = main_core.Loc.getMessage(resolveTitleKey(status));
		return main_core.Tag.render`
		<div class="note-import-progress__title note-import-progress__title--${variant}">
			${main_core.Text.encode(text)}
		</div>
	`;
	}
	function resolveTitleKey(status) {
		switch (status) {
			case 'documents':
				return 'NOTE_IMPORT_PROGRESS_TITLE_DOCUMENTS';
			case 'attachments':
				return 'NOTE_IMPORT_PROGRESS_TITLE_ATTACHMENTS';
			case 'done_ok':
				return 'NOTE_IMPORT_PROGRESS_TITLE_DONE_OK';
			case 'done_error':
				return 'NOTE_IMPORT_PROGRESS_TITLE_DONE_ERROR';
			case 'cancelled':
				return 'NOTE_IMPORT_PROGRESS_TITLE_CANCELLED';
			case 'error':
				return 'NOTE_IMPORT_PROGRESS_TITLE_ERROR';
			case 'preparing':
			default:
				return 'NOTE_IMPORT_PROGRESS_TITLE_PREPARING';
		}
	}
	function renderBar(state, status) {
		const wrapper = main_core.Tag.render`<div class="note-import-progress__bar"></div>`;
		if (status === 'error') {
			// no bar for system-level error
			return wrapper;
		}
		const progress = state.progress;
		const {
			value,
			maxValue,
			indeterminate
		} = resolveBarValues(progress, status);
		const bar = new ui_progressbar.ProgressBar({
			value,
			maxValue,
			size: ui_progressbar.ProgressBar.Size.LARGE,
			color: ui_progressbar.ProgressBar.Color.PRIMARY,
			statusType: ui_progressbar.ProgressBar.Status.NONE,
			infiniteLoading: indeterminate
		});
		bar.renderTo(wrapper);
		if (!indeterminate) {
			wrapper.append(main_core.Tag.render`
			<div class="note-import-progress__counter">${Math.round(value)} / ${Math.round(maxValue)}</div>
		`);
		}
		return wrapper;
	}
	function resolveBarValues(progress, status) {
		if (status === 'preparing' || !progress) {
			return {
				value: 0,
				maxValue: 100,
				indeterminate: true
			};
		}
		if (status === 'attachments') {
			const total = Math.max(0, progress.totalAttachments ?? 0);
			const done = Math.max(0, progress.doneAttachments ?? 0);
			if (total <= 0) {
				return {
					value: 0,
					maxValue: 100,
					indeterminate: true
				};
			}
			return {
				value: Math.min(done, total),
				maxValue: total,
				indeterminate: false
			};
		}
		if (status === 'documents') {
			const total = Math.max(0, progress.total ?? 0);
			const done = Math.max(0, progress.done ?? 0);
			if (total <= 0) {
				return {
					value: 0,
					maxValue: 100,
					indeterminate: true
				};
			}
			return {
				value: Math.min(done, total),
				maxValue: total,
				indeterminate: false
			};
		}

		// done_ok / done_error / cancelled — backend reports global counts on finish,
		// but `progress.total` stays at the last collection's totalItems (not a global sum).
		// Reconstruct a sensible denominator from done + error.
		const done = Math.max(0, progress.done ?? 0);
		const error = Math.max(0, progress.error ?? 0);
		const total = done + error;
		if (total <= 0) {
			return {
				value: 1,
				maxValue: 1,
				indeterminate: false
			};
		}
		return {
			value: Math.min(done, total),
			maxValue: total,
			indeterminate: false
		};
	}
	function renderSummary(state, status) {
		const container = main_core.Tag.render`<div class="note-import-progress__summary"></div>`;
		const progress = state.progress;
		if (status === 'error') {
			const text = state.errorMessage || main_core.Loc.getMessage('NOTE_IMPORT_STATUS_ERROR');
			container.append(main_core.Tag.render`
			<div class="note-import-progress__summary-line note-import-progress__summary-line--alert">
				${main_core.Text.encode(text)}
			</div>
		`);
			return container;
		}
		if (status === 'cancelled') {
			return container;
		}
		if (status === 'done_ok' || status === 'done_error') {
			const importedClass = status === 'done_error' ? 'note-import-progress__summary-line--alert' : '';
			const importedText = main_core.Loc.getMessage('NOTE_IMPORT_IMPORTED_COUNT').replace('#COUNT#', String(progress?.done ?? 0));
			container.append(main_core.Tag.render`
			<div class="note-import-progress__summary-line ${importedClass}">${main_core.Text.encode(importedText)}</div>
		`);
			const errorCount = progress?.error ?? 0;
			const errorClass = status === 'done_error' ? 'note-import-progress__summary-line--alert' : 'note-import-progress__summary-line--muted';
			const errorText = main_core.Loc.getMessage('NOTE_IMPORT_ERROR_COUNT').replace('#COUNT#', String(errorCount));
			container.append(main_core.Tag.render`
			<div class="note-import-progress__summary-line ${errorClass}">${main_core.Text.encode(errorText)}</div>
		`);
			const details = progress?.errorDetails ?? [];
			if (details.length > 0) {
				container.append(renderErrorDetails(details, errorCount));
			}
			return container;
		}

		// active phases (preparing, documents, attachments) — show current collection caption
		const caption = resolveCollectionCaption(progress);
		if (caption !== '') {
			container.append(main_core.Tag.render`
			<div class="note-import-progress__summary-line note-import-progress__summary-line--muted">
				${main_core.Text.encode(caption)}
			</div>
		`);
		}
		return container;
	}
	function resolveCollectionCaption(progress) {
		if (!progress || !progress.collectionName) {
			return '';
		}
		const name = progress.collectionName;
		const count = progress.collectionCount ?? 0;
		if (count > 1) {
			return main_core.Loc.getMessage('NOTE_IMPORT_COLLECTION_PROGRESS_LABEL').replace('#NAME#', name).replace('#INDEX#', String((progress.collectionIndex ?? 0) + 1)).replace('#COUNT#', String(count));
		}
		return name;
	}
	function renderErrorDetails(details, totalErrors) {
		const container = main_core.Tag.render`<div class="note-import-progress__errors"></div>`;
		for (const detail of details) {
			const title = main_core.Text.encode(detail.title);
			const reason = main_core.Text.encode(detail.reason);
			container.append(main_core.Tag.render`
			<div class="note-import-progress__errors-item">
				<span class="note-import-progress__errors-title">${title}</span>
				<span class="note-import-progress__errors-reason">${reason}</span>
			</div>
		`);
		}
		if (totalErrors > details.length) {
			const more = main_core.Loc.getMessage('NOTE_IMPORT_ERROR_DETAILS_MORE').replace('#COUNT#', String(totalErrors - details.length));
			container.append(main_core.Tag.render`
			<div class="note-import-progress__errors-more">${main_core.Text.encode(more)}</div>
		`);
		}
		return container;
	}
	function renderMascot(status) {
		const variant = STATUS_TO_MASCOT[status] ?? 'working';
		return main_core.Tag.render`
		<div class="note-import-progress__mascot note-import-progress__mascot--${variant}"></div>
	`;
	}

	class ImportDialog {
		#dialog;
		#api;
		#screen;
		#sourceType;
		#sourceUrl;
		#sourceToken;
		#sessionId;
		#instanceName;
		#connectionForm;
		#connectionScreen;
		#connectionConnectButton;
		#collectionsImportButton;
		#collectionsState;
		#overwriteState;
		#progressState;
		#destroyed;
		#requestId;
		#onComplete;
		#availableSources;
		constructor(options = {}) {
			this.#dialog = null;
			this.#api = new ImportApi();
			this.#screen = IMPORT_SCREEN.LOADING;
			this.#sourceType = SOURCE_TYPE_OUTLINE;
			this.#sourceUrl = '';
			this.#sourceToken = '';
			this.#sessionId = null;
			this.#instanceName = '';
			this.#connectionForm = createDefaultConnectionFormState();
			this.#connectionScreen = null;
			this.#connectionConnectButton = null;
			this.#collectionsImportButton = null;
			this.#sourceType = this.#connectionForm.sourceType ?? SOURCE_TYPE_OUTLINE;
			this.#collectionsState = createDefaultCollectionsScreenState();
			this.#overwriteState = createDefaultOverwriteState();
			this.#progressState = createDefaultProgressScreenState();
			this.#destroyed = false;
			this.#requestId = 0;
			this.#onComplete = main_core.Type.isFunction(options.onComplete) ? options.onComplete : null;
			const wikiImportEnabled = options.wikiImportEnabled === true;
			this.#availableSources = SOURCE_TYPES.filter(source => source.id !== SOURCE_TYPE_WIKI || wikiImportEnabled);
		}
		show() {
			if (this.#dialog) {
				this.#dialog.show();
				this.#resumeIfNeeded();
				return;
			}
			this.#destroyed = false;
			const content = this.#resolveContent();
			this.#dialog = new ui_system_dialog.Dialog({
				title: this.#resolveTitle(),
				content,
				centerButtons: this.#resolveButtons(),
				width: 700,
				hasOverlay: true,
				closeByEsc: true,
				closeByClickOutside: true,
				events: {
					onHide: () => {
						this.#destroyed = true;
						this.#dialog = null;
						this.#destroyConnectionScreen();
					}
				}
			});
			note_ui_themeContext.NoteThemeContext.themeDialog(this.#dialog, content, {
				extraClass: 'note-import-dialog'
			});
			this.#dialog.show();
			this.#checkActiveSession();
		}
		async #onConnect() {
			this.#touchAllConnectionFields();
			this.#validateAllConnectionFields();
			if (!this.#canSubmitConnection()) {
				this.#render();
				this.#focusFirstInvalidConnectionField();
				return;
			}
			this.#connectionForm.isSubmitting = true;
			this.#connectionForm.errorMessage = '';
			this.#render();
			try {
				const url = String(this.#connectionForm.url || '').trim();
				const token = String(this.#connectionForm.token || '').trim();
				const sourceType = String(this.#connectionForm.sourceType || this.#sourceType || '').trim();
				const response = await this.#api.checkConnection(buildCheckConnectionPayload(sourceType, url, token));
				if (this.#destroyed) {
					return;
				}
				this.#sourceType = sourceType;
				this.#sourceUrl = url;
				this.#sourceToken = token;
				this.#instanceName = response.instanceName || url;
				this.#screen = IMPORT_SCREEN.COLLECTIONS;
				this.#collectionsState = createDefaultCollectionsScreenState();
				this.#destroyConnectionScreen();
				await this.#loadCollections();
			} catch (error) {
				// Server error from checkConnection — route to the field hinted by the error code.
				const message = String(error?.message || main_core.Loc.getMessage('NOTE_IMPORT_URL_INVALID'));
				const targetField = error?.code === 'IMPORT_INVALID_TOKEN' ? 'token' : 'url';
				this.#connectionForm.errors[targetField] = message;
				this.#connectionForm.touched[targetField] = true;
			} finally {
				this.#connectionForm.isSubmitting = false;
				this.#render();
			}
		}
		#validateConnectionField(field) {
			const errors = this.#connectionForm.errors;
			if (field === 'sourceType') {
				const value = String(this.#connectionForm.sourceType || '').trim();
				errors.sourceType = value === '' ? main_core.Loc.getMessage('NOTE_IMPORT_SOURCE_REQUIRED') : '';
				return;
			}
			if (field === 'url') {
				// Wiki reads local bases — no URL/token needed.
				if (this.#isWikiSource()) {
					errors.url = '';
					return;
				}
				const value = String(this.#connectionForm.url || '').trim();
				if (value === '') {
					errors.url = main_core.Loc.getMessage('NOTE_IMPORT_URL_REQUIRED');
					return;
				}
				if (!/^https?:\/\//i.test(value)) {
					errors.url = main_core.Loc.getMessage('NOTE_IMPORT_URL_INVALID');
					return;
				}
				errors.url = '';
				return;
			}
			if (field === 'token') {
				if (this.#isWikiSource()) {
					errors.token = '';
					return;
				}
				const value = String(this.#connectionForm.token || '').trim();
				errors.token = value === '' ? main_core.Loc.getMessage('NOTE_IMPORT_TOKEN_REQUIRED') : '';
			}
		}
		#isWikiSource() {
			return String(this.#connectionForm.sourceType || this.#sourceType || '').trim() === SOURCE_TYPE_WIKI;
		}
		#validateAllConnectionFields() {
			this.#validateConnectionField('sourceType');
			this.#validateConnectionField('url');
			this.#validateConnectionField('token');
		}
		#touchAllConnectionFields() {
			this.#connectionForm.touched.sourceType = true;
			this.#connectionForm.touched.url = true;
			this.#connectionForm.touched.token = true;
		}
		#hasConnectionErrors() {
			const {
				errors
			} = this.#connectionForm;
			return Boolean(errors.sourceType || errors.url || errors.token);
		}
		#onConnectionFieldInput(field, value) {
			if (field === 'sourceType') {
				this.#connectionForm.sourceType = value;
				this.#connectionForm.touched.sourceType = true;
				this.#validateConnectionField('sourceType');
				// Source change comes from menu, not from input — full sync is safe.
				this.#connectionScreen?.applyState(this.#connectionForm);
				this.#renderButtons();
				return;
			}
			if (field === 'url') {
				this.#connectionForm.url = value;
				// Drop server error stuck to URL field as soon as user edits the URL itself.
				// Re-validation below will repopulate it if the new value is still invalid.
				this.#connectionForm.errors.url = '';
			} else if (field === 'token') {
				this.#connectionForm.token = value;
				// Same idea for the token field — drop a server-side 401/403 hint on the next keystroke.
				this.#connectionForm.errors.token = '';
			}
			if (this.#connectionForm.touched[field]) {
				this.#validateConnectionField(field);
			}

			// Don't re-apply value back to Vue while user is typing — only sync errors.
			// Also avoid full setCenterButtons re-render: it rebuilds popup content
			// and detaches the focused input. Update button disabled state in place.
			this.#connectionScreen?.syncErrors(this.#connectionForm);
			this.#refreshConnectButtonState();
		}
		#onConnectionFieldBlur(field) {
			this.#connectionForm.touched[field] = true;
			this.#validateConnectionField(field);
			this.#connectionScreen?.syncErrors(this.#connectionForm);
			this.#refreshConnectButtonState();
		}
		#destroyConnectionScreen() {
			this.#connectionScreen?.destroy();
			this.#connectionScreen = null;
			this.#connectionConnectButton = null;
		}
		#refreshConnectButtonState() {
			this.#connectionConnectButton?.setDisabled(!this.#canSubmitConnection());
		}
		#refreshImportButtonState() {
			this.#collectionsImportButton?.setDisabled(this.#collectionsState.selectedCollectionIds.size === 0);
		}
		#focusFirstInvalidConnectionField() {
			const order = ['sourceType', 'url', 'token'];
			const errors = this.#connectionForm.errors;
			const firstInvalid = order.find(field => errors[field]);
			if (!firstInvalid) {
				return;
			}
			this.#connectionScreen?.focusField(firstInvalid);
		}
		async #loadCollections() {
			this.#collectionsState.isLoading = true;
			this.#collectionsState.errorMessage = '';
			this.#render();
			try {
				const response = await this.#api.getCollections(buildGetCollectionsPayload(this.#sourceType, this.#sourceUrl, this.#sourceToken));
				this.#collectionsState.collections = response.collections;
				// Pre-select every base by default: importing all of them is the common
				// case, so the user only has to deselect what they don't want instead of
				// ticking each base manually.
				this.#collectionsState.selectedCollectionIds = new Set(response.collections.map(collection => collection.id));
			} catch (error) {
				this.#collectionsState.errorMessage = String(error?.message || main_core.Loc.getMessage('NOTE_IMPORT_COLLECTIONS_LOAD_ERROR'));
			} finally {
				this.#collectionsState.isLoading = false;
				this.#render();
			}
		}
		async #toggleCollectionExpanded(collectionId) {
			if (this.#collectionsState.expandedCollectionIds.has(collectionId)) {
				this.#collectionsState.expandedCollectionIds.delete(collectionId);
				this.#render();
				return;
			}
			this.#collectionsState.expandedCollectionIds.add(collectionId);
			const treeState = this.#collectionsState.treeByCollectionId.get(collectionId);
			if (treeState?.isLoaded || treeState?.isLoading) {
				this.#render();
				return;
			}
			await this.#loadTree(collectionId);
		}
		async #loadTree(collectionId) {
			this.#collectionsState.treeByCollectionId.set(collectionId, {
				isLoading: true,
				isLoaded: false,
				errorMessage: '',
				documents: []
			});
			this.#render();
			try {
				const response = await this.#api.getDocumentTree(buildGetDocumentTreePayload(this.#sourceType, this.#sourceUrl, this.#sourceToken, collectionId));
				this.#collectionsState.treeByCollectionId.set(collectionId, {
					isLoading: false,
					isLoaded: true,
					errorMessage: '',
					documents: response.documents
				});
			} catch (error) {
				this.#collectionsState.treeByCollectionId.set(collectionId, {
					isLoading: false,
					isLoaded: false,
					errorMessage: String(error?.message || main_core.Loc.getMessage('NOTE_IMPORT_TREE_LOAD_ERROR')),
					documents: []
				});
			}
			this.#render();
		}
		async #toggleOverwriteCollectionExpanded(collectionId) {
			if (this.#overwriteState.expandedCollectionIds.has(collectionId)) {
				this.#overwriteState.expandedCollectionIds.delete(collectionId);
				this.#render();
				return;
			}
			this.#overwriteState.expandedCollectionIds.add(collectionId);
			const treeState = this.#overwriteState.treeByCollectionId.get(collectionId);
			if (treeState?.isLoaded || treeState?.isLoading) {
				this.#render();
				return;
			}
			await this.#loadOverwriteTree(collectionId);
		}
		async #loadOverwriteTree(collectionId) {
			this.#overwriteState.treeByCollectionId.set(collectionId, {
				isLoading: true,
				isLoaded: false,
				errorMessage: '',
				documents: []
			});
			this.#render();
			try {
				const response = await this.#api.getDocumentTree(buildGetDocumentTreePayload(this.#sourceType, this.#sourceUrl, this.#sourceToken, collectionId));
				this.#overwriteState.treeByCollectionId.set(collectionId, {
					isLoading: false,
					isLoaded: true,
					errorMessage: '',
					documents: response.documents
				});
			} catch (error) {
				this.#overwriteState.treeByCollectionId.set(collectionId, {
					isLoading: false,
					isLoaded: false,
					errorMessage: String(error?.message || main_core.Loc.getMessage('NOTE_IMPORT_TREE_LOAD_ERROR')),
					documents: []
				});
			}
			this.#render();
		}
		async #onStartImport() {
			const collectionIds = [...this.#collectionsState.selectedCollectionIds];
			if (collectionIds.length === 0) {
				return;
			}
			try {
				const overlapResult = await this.#api.checkOverlap(buildCheckOverlapPayload(this.#sourceType, collectionIds));
				if (this.#destroyed) {
					return;
				}
				const existingIds = overlapResult?.existingCollectionIds ?? [];
				if (existingIds.length > 0) {
					const nextOverwriteState = createDefaultOverwriteState();
					nextOverwriteState.collections = existingIds.map(id => {
						const collection = this.#collectionsState.collections.find(c => c.id === id);
						return {
							id,
							name: collection ? collection.name : id
						};
					});

					// Warm tree cache with already-loaded trees from the collections screen.
					for (const id of existingIds) {
						const cached = this.#collectionsState.treeByCollectionId.get(id);
						if (cached?.isLoaded) {
							nextOverwriteState.treeByCollectionId.set(id, cached);
						}
					}
					this.#overwriteState = nextOverwriteState;
					this.#screen = IMPORT_SCREEN.OVERWRITE_CONFIRM;
					this.#render();
					return;
				}
			} catch (error) {
				this.#collectionsState.errorMessage = String(error?.message || main_core.Loc.getMessage('NOTE_IMPORT_START_ERROR'));
				this.#render();
				return;
			}
			await this.#runStart(false);
		}
		async #onConfirmOverwrite() {
			await this.#runStart(true);
		}
		async #runStart(overwrite) {
			const collectionIds = [...this.#collectionsState.selectedCollectionIds];
			try {
				const response = await this.#api.start(buildStartPayload(this.#sourceType, this.#sourceUrl, this.#sourceToken, collectionIds, overwrite));
				this.#sessionId = response.sessionId;
				this.#screen = IMPORT_SCREEN.PROGRESS;
				this.#progressState.progress = response.progress;
				this.#progressState.errorMessage = '';
				this.#progressState.isImporting = true;
				this.#progressState.isCancelling = false;
				this.#render();
				this.#scheduleNextTick();
			} catch (error) {
				this.#collectionsState.errorMessage = String(error?.message || main_core.Loc.getMessage('NOTE_IMPORT_START_ERROR'));
				this.#screen = IMPORT_SCREEN.COLLECTIONS;
				this.#render();
			}
		}
		async #runImportLoop() {
			const requestId = ++this.#requestId;
			if (!this.#progressState.isImporting || this.#destroyed || !this.#sessionId) {
				return;
			}
			try {
				const response = await this.#api.getStatus(buildGetStatusPayload(this.#sessionId));
				if (this.#destroyed || requestId !== this.#requestId) {
					return;
				}
				this.#progressState.progress = response.progress;
				if (response.progress.status !== IMPORT_PROGRESS_STATUS.IN_PROGRESS) {
					this.#progressState.isImporting = false;
					this.#render();
					return;
				}
				this.#progressState.errorMessage = '';
				this.#render();
				this.#scheduleNextTick();
			} catch (error) {
				if (this.#destroyed || requestId !== this.#requestId) {
					return;
				}
				this.#progressState.errorMessage = String(error?.message || main_core.Loc.getMessage('NOTE_IMPORT_STATUS_ERROR'));
				this.#progressState.isImporting = false;
				this.#render();
			}
		}
		async #onCancel() {
			if (!this.#sessionId || this.#progressState.isCancelling) {
				return;
			}
			this.#progressState.isCancelling = true;
			this.#render();
			try {
				await this.#api.cancel(buildCancelPayload(this.#sessionId));
			} catch (error) {
				this.#progressState.errorMessage = String(error?.message || main_core.Loc.getMessage('NOTE_IMPORT_CANCEL_ERROR'));
			} finally {
				this.#progressState.isImporting = false;
				this.#progressState.isCancelling = false;
				if (this.#progressState.progress) {
					this.#progressState.progress.status = IMPORT_PROGRESS_STATUS.CANCELLED;
				}
				this.#render();
			}
		}
		async #onDone() {
			await this.#acknowledgeFinishedSession();
			try {
				await this.#onComplete?.();
			} catch (error) {
				BX.UI.Notification.Center.notify({
					content: String(error?.message || ''),
					position: 'top-right'
				});
			}
			this.#dialog?.hide();
		}
		#render() {
			if (!this.#dialog || this.#destroyed) {
				return;
			}

			// setContent rebuilds the popup DOM, which resets scroll on the collection list.
			// Capture scrollTop of any scrollable inner container before re-render and reapply after.
			const scrollSnapshots = [];
			const popupContent = this.#dialog.getContainer?.() ?? document;
			for (const selector of ['.note-import-collection-list', '.note-import-screen']) {
				const node = popupContent.querySelector?.(selector);
				if (node && node.scrollTop > 0) {
					scrollSnapshots.push([selector, node.scrollTop]);
				}
			}
			this.#dialog.setTitle(this.#resolveTitle());
			this.#dialog.setContent(this.#resolveContent());
			this.#renderButtons();
			if (scrollSnapshots.length > 0) {
				const root = this.#dialog.getContainer?.() ?? document;
				for (const [selector, top] of scrollSnapshots) {
					const node = root.querySelector?.(selector);
					if (node) {
						node.scrollTop = top;
					}
				}
			}
		}
		#renderButtons() {
			if (!this.#dialog || this.#destroyed) {
				return;
			}
			this.#dialog.setCenterButtons(this.#resolveButtons());
		}
		#resolveTitle() {
			if (this.#screen === IMPORT_SCREEN.PROGRESS) {
				return main_core.Loc.getMessage('NOTE_IMPORT_DIALOG_TITLE');
			}
			if (this.#instanceName) {
				return main_core.Loc.getMessage('NOTE_IMPORT_DIALOG_TITLE_SOURCE').replace('#SOURCE#', main_core.Text.encode(this.#instanceName));
			}
			return main_core.Loc.getMessage('NOTE_IMPORT_DIALOG_TITLE');
		}
		#resolveContent() {
			if (this.#screen === IMPORT_SCREEN.LOADING) {
				return this.#renderLoadingScreen();
			}
			if (this.#screen === IMPORT_SCREEN.COLLECTIONS) {
				return renderCollectionsScreen(this.#collectionsState, {
					onToggleCollectionSelection: collectionId => {
						if (this.#collectionsState.selectedCollectionIds.has(collectionId)) {
							this.#collectionsState.selectedCollectionIds.delete(collectionId);
						} else {
							this.#collectionsState.selectedCollectionIds.add(collectionId);
						}

						// Avoid full #render(): setContent rebuilds popup DOM and resets per-card local state
						// (sub-folder expansion, scroll). Just sync the import button's disabled flag in-place.
						this.#refreshImportButtonState();
					},
					onToggleCollectionExpanded: collectionId => {
						this.#toggleCollectionExpanded(collectionId);
					},
					onRetryCollectionsLoad: () => {
						this.#loadCollections();
					},
					onRetryTreeLoad: collectionId => {
						this.#loadTree(collectionId);
					}
				});
			}
			if (this.#screen === IMPORT_SCREEN.OVERWRITE_CONFIRM) {
				return renderOverwriteConfirmScreen(this.#overwriteState, {
					onToggleCollectionExpanded: collectionId => {
						this.#toggleOverwriteCollectionExpanded(collectionId);
					},
					onRetryTreeLoad: collectionId => {
						this.#loadOverwriteTree(collectionId);
					}
				});
			}
			if (this.#screen === IMPORT_SCREEN.PROGRESS) {
				return renderProgressScreen(this.#progressState);
			}
			if (!this.#connectionScreen) {
				this.#connectionScreen = createConnectionScreen({
					onSourceChange: value => {
						this.#onConnectionFieldInput('sourceType', value);
						this.#onConnectionFieldBlur('sourceType');
					},
					onUrlInput: value => {
						this.#onConnectionFieldInput('url', value);
					},
					onUrlBlur: () => {
						this.#onConnectionFieldBlur('url');
					},
					onTokenInput: value => {
						this.#onConnectionFieldInput('token', value);
					},
					onTokenBlur: () => {
						this.#onConnectionFieldBlur('token');
					},
					onSubmit: () => {
						this.#onConnect();
					}
				}, this.#availableSources);
			}
			this.#connectionScreen.applyState(this.#connectionForm);
			return this.#connectionScreen.element;
		}
		#resolveButtons() {
			if (this.#screen === IMPORT_SCREEN.LOADING) {
				return [];
			}
			if (this.#screen === IMPORT_SCREEN.CONNECTION) {
				const connectButton = new ui_buttons.Button({
					size: ui_buttons.ButtonSize.LARGE,
					style: ui_buttons.AirButtonStyle.FILLED,
					useAirDesign: true,
					// Wiki has no connection step — the action just reveals the bases to pick.
					text: this.#isWikiSource() ? main_core.Loc.getMessage('NOTE_IMPORT_SELECT') : main_core.Loc.getMessage('NOTE_IMPORT_CONNECT'),
					dataset: {
						testid: 'note-import-connect'
					},
					onclick: () => {
						this.#onConnect();
					}
				});
				// Sync via setDisabled so internal state is wired to the disabled CSS class.
				// Passing { disabled: true } in options sets the class but leaves this.state = null,
				// which makes the first setDisabled(false) a visual no-op.
				connectButton.setDisabled(!this.#canSubmitConnection());
				this.#connectionConnectButton = connectButton;
				return [connectButton, new ui_buttons.Button({
					size: ui_buttons.ButtonSize.LARGE,
					style: ui_buttons.AirButtonStyle.PLAIN,
					useAirDesign: true,
					text: main_core.Loc.getMessage('NOTE_IMPORT_DIALOG_CANCEL_BUTTON'),
					dataset: {
						testid: 'note-import-close'
					},
					onclick: () => {
						this.#dialog?.hide();
					}
				})];
			}
			if (this.#screen === IMPORT_SCREEN.COLLECTIONS) {
				const importButton = new ui_buttons.Button({
					size: ui_buttons.ButtonSize.LARGE,
					style: ui_buttons.AirButtonStyle.FILLED,
					useAirDesign: true,
					text: main_core.Loc.getMessage('NOTE_IMPORT_START'),
					dataset: {
						testid: 'note-import-start'
					},
					onclick: () => {
						this.#onStartImport();
					}
				});
				// See connect button comment: { disabled: true } option doesn't drive ButtonState,
				// so the first setDisabled(false) leaves --disabled class on the container.
				importButton.setDisabled(this.#collectionsState.selectedCollectionIds.size === 0);
				this.#collectionsImportButton = importButton;
				return [importButton, new ui_buttons.Button({
					size: ui_buttons.ButtonSize.LARGE,
					style: ui_buttons.AirButtonStyle.PLAIN,
					useAirDesign: true,
					text: main_core.Loc.getMessage('NOTE_IMPORT_BACK'),
					dataset: {
						testid: 'note-import-back'
					},
					onclick: () => {
						this.#screen = IMPORT_SCREEN.CONNECTION;
						this.#render();
					}
				})];
			}
			this.#collectionsImportButton = null;
			if (this.#screen === IMPORT_SCREEN.OVERWRITE_CONFIRM) {
				return [new ui_buttons.Button({
					size: ui_buttons.ButtonSize.LARGE,
					style: ui_buttons.AirButtonStyle.FILLED,
					useAirDesign: true,
					text: main_core.Loc.getMessage('NOTE_IMPORT_OVERWRITE_CONFIRM'),
					dataset: {
						testid: 'note-import-overwrite-confirm'
					},
					onclick: () => {
						this.#onConfirmOverwrite();
					}
				}), new ui_buttons.Button({
					size: ui_buttons.ButtonSize.LARGE,
					style: ui_buttons.AirButtonStyle.PLAIN,
					useAirDesign: true,
					text: main_core.Loc.getMessage('NOTE_IMPORT_BACK'),
					dataset: {
						testid: 'note-import-back'
					},
					onclick: () => {
						this.#screen = IMPORT_SCREEN.COLLECTIONS;
						this.#render();
					}
				})];
			}
			if (this.#progressState.isImporting) {
				const cancelButton = new ui_buttons.Button({
					size: ui_buttons.ButtonSize.LARGE,
					style: ui_buttons.AirButtonStyle.PLAIN,
					useAirDesign: true,
					text: main_core.Loc.getMessage('NOTE_IMPORT_CANCEL'),
					dataset: {
						testid: 'note-import-cancel'
					},
					onclick: () => {
						this.#onCancel();
					}
				});
				cancelButton.setDisabled(this.#progressState.isCancelling);
				return [cancelButton];
			}
			return [new ui_buttons.Button({
				size: ui_buttons.ButtonSize.LARGE,
				style: ui_buttons.AirButtonStyle.FILLED,
				useAirDesign: true,
				text: main_core.Loc.getMessage('NOTE_IMPORT_DONE'),
				dataset: {
					testid: 'note-import-done'
				},
				onclick: () => {
					this.#onDone();
				}
			})];
		}
		async #checkActiveSession() {
			try {
				const result = await this.#api.getActiveSession();
				if (this.#destroyed) {
					return;
				}
				if (result?.active) {
					this.#sessionId = result.sessionId;
					this.#screen = IMPORT_SCREEN.PROGRESS;
					this.#progressState.progress = result.progress;
					this.#progressState.errorMessage = '';
					const isInProgress = result.progress?.status === IMPORT_PROGRESS_STATUS.IN_PROGRESS;
					this.#progressState.isImporting = isInProgress;

					// Restore source URL + collection selection from finished session so that
					// Retry can prefill the connection form and pre-select the same collections.
					if (result.progress?.sourceUrl) {
						this.#sourceUrl = result.progress.sourceUrl;
						this.#connectionForm.url = result.progress.sourceUrl;
					}
					if (Array.isArray(result.progress?.collectionIds)) {
						this.#collectionsState.selectedCollectionIds = new Set(result.progress.collectionIds);
					}
					this.#render();
					if (isInProgress) {
						this.#scheduleNextTick();
					}
					return;
				}
			} catch {
				// Request failed — fall through to connection screen.
			}
			if (!this.#destroyed && this.#screen === IMPORT_SCREEN.LOADING) {
				this.#screen = IMPORT_SCREEN.CONNECTION;
				this.#render();
			}
		}
		async #acknowledgeFinishedSession() {
			if (!this.#sessionId) {
				return;
			}
			try {
				await this.#api.acknowledgeFinish(buildAcknowledgeFinishPayload(this.#sessionId));
			} catch (error) {
				// Acknowledgement is best-effort: we don't want to block the UI on it.
				// Stale records will be cleaned up by checkConnection on the next attempt.
				console.warn('[note import] acknowledgeFinish failed', error);
			}
			this.#sessionId = null;
		}
		#renderLoadingScreen() {
			const container = document.createElement('div');
			container.className = 'note-import-screen note-import-loading';
			container.innerHTML = '<div class="note-import-loading-spinner"></div>';
			return container;
		}
		#resumeIfNeeded() {
			if (this.#sessionId && this.#screen === IMPORT_SCREEN.PROGRESS && this.#progressState.progress?.status === IMPORT_PROGRESS_STATUS.IN_PROGRESS) {
				this.#progressState.isImporting = true;
				this.#render();
				this.#runImportLoop();
			}
		}
		#scheduleNextTick() {
			setTimeout(() => {
				this.#runImportLoop();
			}, IMPORT_POLL_INTERVAL_MS);
		}
		#canSubmitConnection() {
			if (this.#connectionForm.isSubmitting) {
				return false;
			}
			const sourceType = String(this.#connectionForm.sourceType || this.#sourceType || '').trim();
			if (sourceType === '') {
				return false;
			}

			// Wiki needs no URL/token — selecting the source is enough to connect.
			if (sourceType === SOURCE_TYPE_WIKI) {
				return true;
			}
			const url = String(this.#connectionForm.url || '').trim();
			const token = String(this.#connectionForm.token || '').trim();
			if (url === '' || token === '') {
				return false;
			}

			// Only client-side validation gates submit. errors.url may carry a
			// server-side message after a failed checkConnection — that shouldn't
			// keep the button disabled, the user should be able to retry.
			return /^https?:\/\//i.test(url);
		}
	}

	exports.ImportDialog = ImportDialog;

})(this.BX.Note.Import = this.BX.Note.Import || {}, BX.UI, BX, BX.UI, BX.UI.System, BX.UI.Notification, BX.Note.Ui, BX.UI.System.Checkbox, BX.UI.IconSet, window, BX.Note.Ui, BX.Vue3, BX.UI.System.Input.Vue, BX.UI.System, BX.UI.System.Alert.Vue, BX.UI.System.Alert);
//# sourceMappingURL=import.bundle.js.map
