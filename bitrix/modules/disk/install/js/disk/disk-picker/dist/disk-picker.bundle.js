/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_popup) {
	'use strict';

	const POPUP_WIDTH = 980;
	const POPUP_HEIGHT = 538;
	const DEFAULT_MAX_ITEMS = 100;
	const FILTER_HOST_SELECTOR = '[data-disk-picker-filter-host]';
	const INTERNAL_EXTENSION = 'disk.disk-picker.internal';
	const NOTIFICATION_EXTENSION = 'ui.notification';
	const FILE_TYPE_ALIASES = Object.freeze(['document', 'spreadsheet', 'presentation', 'board', 'image', 'audio', 'video', 'other']);
	const SELECTION_MODES = Object.freeze(['single', 'multiple']);
	const INITIAL_STAGE_TYPES = Object.freeze(['recent', 'folder', 'sources']);
	const INITIAL_STAGE_KEYS = Object.freeze(['type', 'storageId', 'folderId']);
	let sharedState = 'idle';
	let activeInstance = null;
	let bootstrapPromise = null;
	let bootstrapResult = null;
	let internalPromise = null;
	let internalApi = null;
	let filterInitializedForPage = false;
	function ensureInternal() {
		if (internalApi) {
			return Promise.resolve(internalApi);
		}
		if (!internalPromise) {
			internalPromise = main_core.Runtime.loadExtension(INTERNAL_EXTENSION).then(exports => {
				if (!exports || !main_core.Type.isFunction(exports.mountPickerApp) || !main_core.Type.isFunction(exports.readInitialFilterValues) || !main_core.Type.isFunction(exports.resetInitialFilterValues)) {
					throw new Error('DiskPicker: internal extension is missing its API');
				}
				internalApi = exports;
				return internalApi;
			}).catch(error => {
				internalPromise = null;
				throw error;
			});
		}
		return internalPromise;
	}
	function getFilterManager() {
		const manager = main_core.Reflection.getClass('BX.Main.filterManager');
		return manager ?? null;
	}
	function notify(content) {
		main_core.Runtime.loadExtension(NOTIFICATION_EXTENSION).then(() => {
			const center = main_core.Reflection.getClass('BX.UI.Notification.Center');
			if (center && main_core.Type.isFunction(center.notify)) {
				center.notify({
					content
				});
			}
		}).catch(() => {
		});
	}
	function message(code, replacements) {
		return main_core.Loc.getMessage(code, replacements) ?? '';
	}
	function guard(name, callback, argument) {
		if (!main_core.Type.isFunction(callback)) {
			return;
		}
		try {
			callback(argument);
		} catch (error) {
			console.error(`DiskPicker: "${name}" callback threw`, error);
		}
	}
	function callbackFrom(value) {
		return main_core.Type.isFunction(value) ? value : null;
	}
	function isValidAllowedFileTypes(value) {
		if (main_core.Type.isUndefined(value)) {
			return true;
		}
		if (!main_core.Type.isArray(value)) {
			return false;
		}
		return value.every(alias => main_core.Type.isStringFilled(alias) && FILE_TYPE_ALIASES.includes(alias));
	}
	function isPositiveInteger(value) {
		return main_core.Type.isNumber(value) && Number.isInteger(value) && value > 0;
	}
	function isValidInitialStage(value) {
		if (main_core.Type.isNil(value)) {
			return true;
		}
		if (!main_core.Type.isPlainObject(value) || !main_core.Type.isStringFilled(value.type) || !INITIAL_STAGE_TYPES.includes(value.type) || Object.keys(value).some(key => !INITIAL_STAGE_KEYS.includes(key))) {
			return false;
		}
		if (value.type === 'folder') {
			return isPositiveInteger(value.storageId) && isPositiveInteger(value.folderId);
		}
		return main_core.Type.isNil(value.storageId) && main_core.Type.isNil(value.folderId);
	}
	function isValidUnsignedParams(params) {
		const selectionModeValid = main_core.Type.isUndefined(params.selectionMode) || main_core.Type.isString(params.selectionMode) && SELECTION_MODES.includes(params.selectionMode);
		const maxItemsValid = main_core.Type.isNil(params.maxItems) || isPositiveInteger(params.maxItems) && params.maxItems <= DEFAULT_MAX_ITEMS;
		return selectionModeValid && maxItemsValid && isValidAllowedFileTypes(params.allowedFileTypes) && isValidInitialStage(params.initialStage);
	}
	function deepClone(value) {
		if (main_core.Type.isArray(value)) {
			return value.map(entry => deepClone(entry));
		}
		if (main_core.Type.isPlainObject(value)) {
			const result = {};
			Object.keys(value).forEach(key => {
				result[key] = deepClone(value[key]);
			});
			return result;
		}
		return value;
	}
	function deepFreeze(value) {
		if (main_core.Type.isArray(value)) {
			value.forEach(entry => deepFreeze(entry));
			return Object.freeze(value);
		}
		if (main_core.Type.isPlainObject(value)) {
			Object.keys(value).forEach(key => deepFreeze(value[key]));
			return Object.freeze(value);
		}
		return value;
	}
	function normalizeInitialStage(stage) {
		if (!main_core.Type.isPlainObject(stage)) {
			return null;
		}
		return Object.freeze({
			type: stage.type,
			storageId: main_core.Type.isNil(stage.storageId) ? null : stage.storageId,
			folderId: main_core.Type.isNil(stage.folderId) ? null : stage.folderId
		});
	}
	function copyAllowedFileTypes(value) {
		return main_core.Type.isArray(value) ? [...value] : [];
	}
	function normalizeSelection(selectionModeRaw, maxItemsRaw) {
		const selectionMode = selectionModeRaw === 'multiple' ? 'multiple' : 'single';
		const rawMaxItems = main_core.Type.isNumber(maxItemsRaw) ? maxItemsRaw : null;
		const boundedMaxItems = Math.min(rawMaxItems ?? DEFAULT_MAX_ITEMS, DEFAULT_MAX_ITEMS);
		const effectiveMaxItems = selectionMode === 'single' ? 1 : boundedMaxItems;
		return {
			selectionMode,
			maxItems: rawMaxItems,
			effectiveMaxItems
		};
	}
	function buildConstraints(params, hasSignedConfig) {
		if (hasSignedConfig) {
			const signed = deepFreeze(deepClone(params.signedConfig));
			const descriptor = main_core.Type.isPlainObject(signed) ? signed : {};
			const selection = normalizeSelection(descriptor.selectionMode, descriptor.maxItems);
			return {
				signed,
				...selection,
				allowedFileTypes: copyAllowedFileTypes(descriptor.allowedFileTypes),
				initialStage: normalizeInitialStage(descriptor.initialStage)
			};
		}
		const selection = normalizeSelection(params.selectionMode, params.maxItems);
		return {
			signed: null,
			...selection,
			allowedFileTypes: copyAllowedFileTypes(params.allowedFileTypes),
			initialStage: normalizeInitialStage(params.initialStage)
		};
	}
	function captureCallbacks(params) {
		return {
			onOpen: callbackFrom(params.onOpen),
			onSelect: callbackFrom(params.onSelect),
			onCancel: callbackFrom(params.onCancel),
			onClose: callbackFrom(params.onClose),
			onError: callbackFrom(params.onError)
		};
	}
	function getFocusableInitiator() {
		const active = document.activeElement;
		if (main_core.Type.isDomNode(active) && active !== document.body) {
			return active;
		}
		return null;
	}
	async function requestBootstrap() {
		let holder = null;
		try {
			const response = await main_core.ajax.runComponentAction('bitrix:disk.file.picker', 'getBootstrap', {
				mode: 'class'
			});
			const data = response?.data ?? {};
			if (!main_core.Type.isStringFilled(data.html) || !main_core.Type.isStringFilled(data.filterId)) {
				throw new Error('DiskPicker: empty bootstrap response');
			}
			const node = main_core.Tag.render`<div class="disk-picker__filter-holder" style="display: none;"></div>`;
			holder = node;
			main_core.Dom.append(node, document.body);
			await main_core.Runtime.html(node, data.html);
			const filter = getFilterManager()?.getById(data.filterId);
			if (!filter) {
				throw new Error('DiskPicker: filter instance is not registered');
			}
			const result = {
				filterId: data.filterId,
				holder: node
			};
			bootstrapResult = result;
			return result;
		} catch (error) {
			if (holder) {
				main_core.Dom.remove(holder);
			}
			bootstrapPromise = null;
			throw error;
		}
	}
	function ensureBootstrap() {
		if (bootstrapResult) {
			return Promise.resolve(bootstrapResult);
		}
		if (!bootstrapPromise) {
			bootstrapPromise = requestBootstrap();
		}
		return bootstrapPromise;
	}
	class DiskPicker {
		static isEnabled() {
			return main_core.Extension.getSettings('disk.disk-picker').get('enabled', false) === true;
		}
		#constraints = null;
		#restoredFilter = null;
		#filterId = null;
		#callbacks = null;
		#popup = null;
		#appHandle = null;
		#container = null;
		#filterHost = null;
		#filterHolder = null;
		#initiator = null;
		#pendingResult = null;
		#tearingDown = false;
		#outsideClickHandler = null;
		#internal = null;
		#sessionId = 0;
		open(params) {
			const options = main_core.Type.isPlainObject(params) ? params : {};
			if (sharedState !== 'idle') {
				guard('onError', callbackFrom(options.onError), {
					code: 'already_open'
				});
				return;
			}
			const hasSignedConfig = main_core.Type.isPlainObject(options.signedConfig);
			if (!hasSignedConfig && !isValidUnsignedParams(options)) {
				notify(message('DISK_PICKER_NOTIFY_INVALID_PARAMS'));
				guard('onError', callbackFrom(options.onError), {
					code: 'invalid_params'
				});
				return;
			}
			this.#initiator = getFocusableInitiator();
			this.#constraints = buildConstraints(options, hasSignedConfig);
			this.#callbacks = captureCallbacks(options);
			this.#pendingResult = null;
			this.#tearingDown = false;
			sharedState = 'bootstrapping';
			activeInstance = this;
			const sessionId = ++this.#sessionId;
			Promise.all([ensureBootstrap(), ensureInternal()]).then(([result, internal]) => this.#handleBootstrapReady(sessionId, result, internal)).catch(() => this.#handleBootstrapFailed(sessionId));
		}
		containsEvent(event) {
			return activeInstance === this && sharedState === 'open' && this.#isInsideSession(event);
		}
		close() {
			if (activeInstance !== this || !['bootstrapping', 'open'].includes(sharedState)) {
				return;
			}
			this.#runClose('cancel');
		}
		#handleBootstrapReady(sessionId, result, internal) {
			if (!this.#isCurrentSession(sessionId, 'bootstrapping')) {
				return;
			}
			this.#internal = internal;
			this.#filterId = result.filterId;
			this.#resetInitialFilterValues(result.filterId);
			const container = main_core.Tag.render`<div class="disk-picker" tabindex="-1" data-testid="universal-disk-picker-root"></div>`;
			this.#container = container;
			this.#popup = this.#createPopup(container);
			this.#appHandle = internal.mountPickerApp(container, {});
			this.#relocateFilterIntoPopup(result, container);
			this.#popup.show();
			this.#focusContainer(container);
			this.#bindOutsideClick();
			this.#readInitialFilterValues(result.filterId);
			this.#startSession(result.filterId, sessionId);
			sharedState = 'open';
			guard('onOpen', this.#callbacks?.onOpen ?? null, {
				container
			});
		}
		#resetInitialFilterValues(filterId) {
			if (filterInitializedForPage) {
				return;
			}
			const filter = getFilterManager()?.getById(filterId);
			if (!filter || !this.#internal?.resetInitialFilterValues(filter)) {
				throw new Error('DiskPicker: failed to reset initial filter values');
			}
			filterInitializedForPage = true;
		}
		#startSession(filterId, sessionId) {
			const restoredFilter = this.#restoredFilter ?? {
				find: '',
				objectTypeFilter: 'all',
				fileTypeFilters: []
			};
			this.#appHandle?.start({
				constraints: this.#toPickerConstraints(),
				restoredFilter,
				filterId,
				callbacks: {
					suppressFilterFind: () => {},
					resetFilters: () => {},
					onContextInvalid: () => this.#handleContextInvalid(sessionId),
					notify: (code, replacements) => notify(message(code, replacements)),
					emitSelection: result => this.#handleSelection(result),
					requestCancel: () => this.#runClose('cancel')
				}
			});
		}
		#handleSelection(result) {
			this.#pendingResult = {
				items: result.items.map(item => ({
					objectId: item.objectId,
					name: item.name,
					size: item.size,
					extension: item.extension,
					fileType: item.fileType,
					previewUrl: item.previewUrl,
					sourceTitle: item.sourceTitle,
					parentFolderName: item.parentFolderName,
					editorFileType: item.editorFileType
				}))
			};
			this.#runClose('select');
		}
		#toPickerConstraints() {
			const constraints = this.#constraints;
			const stage = constraints?.initialStage ?? null;
			return {
				signedConfig: constraints?.signed ?? null,
				allowedFileTypes: constraints ? [...constraints.allowedFileTypes] : [],
				initialStage: stage === null ? null : {
					type: stage.type,
					storageId: stage.storageId ?? null,
					folderId: stage.folderId ?? null
				},
				selectionMode: constraints?.selectionMode ?? 'single',
				maxItems: constraints?.effectiveMaxItems ?? 1
			};
		}
		#handleContextInvalid(sessionId) {
			if (!this.#isCurrentSession(sessionId)) {
				return;
			}
			this.#runClose('context_invalid');
		}
		#handleBootstrapFailed(sessionId) {
			if (!this.#isCurrentSession(sessionId)) {
				return;
			}
			const onError = this.#callbacks?.onError ?? null;
			this.#tearingDown = true;
			sharedState = 'closing';
			try {
				this.#teardownResources();
				this.#restoreFocus();
			} finally {
				this.#resetSession();
				activeInstance = null;
				sharedState = 'idle';
			}
			notify(message('DISK_PICKER_NOTIFY_BOOTSTRAP_FAILED'));
			guard('onError', onError, {
				code: 'bootstrap_failed'
			});
		}
		#isCurrentSession(sessionId, expectedState) {
			return activeInstance === this && sessionId === this.#sessionId && (expectedState === undefined || sharedState === expectedState);
		}
		#createPopup(container) {
			return new main_popup.Popup({
				className: 'disk-picker-popup',
				ariaLabel: message('DISK_PICKER_DIALOG_LABEL'),
				content: container,
				width: POPUP_WIDTH,
				height: POPUP_HEIGHT,
				minWidth: POPUP_WIDTH,
				minHeight: POPUP_HEIGHT,
				padding: 0,
				contentPadding: 0,
				closeIcon: false,
				closeByEsc: true,
				autoHide: false,
				overlay: true,
				cacheable: false,
				angle: false,
				events: {
					onPopupClose: () => this.#handlePopupClose()
				}
			});
		}
		#relocateFilterIntoPopup(result, container) {
			this.#filterHolder = result.holder;
			this.#filterHost = container.querySelector(FILTER_HOST_SELECTOR);
			if (!this.#filterHost) {
				return;
			}
			while (result.holder.firstChild) {
				main_core.Dom.append(result.holder.firstChild, this.#filterHost);
			}
		}
		#closeFilterPopups() {
			if (!this.#filterId) {
				return;
			}
			try {
				const filter = getFilterManager()?.getById(this.#filterId);
				if (filter && main_core.Type.isFunction(filter.closePopup)) {
					filter.closePopup();
				}
			} catch (error) {
				console.error('DiskPicker: failed to close the filter popup', error);
			}
		}
		#returnFilterToHolder() {
			const host = this.#filterHost;
			const holder = this.#filterHolder;
			if (!host || !holder) {
				return;
			}
			while (host.firstChild) {
				main_core.Dom.append(host.firstChild, holder);
			}
		}
		#readInitialFilterValues(filterId) {
			try {
				const filter = getFilterManager()?.getById(filterId);
				if (filter && this.#internal) {
					this.#restoredFilter = this.#internal.readInitialFilterValues(filter);
				}
			} catch (error) {
				this.#restoredFilter = null;
				console.error('DiskPicker: failed to read initial filter values', error);
			}
		}
		#focusContainer(container) {
			try {
				container.focus();
			} catch {
			}
		}
		#bindOutsideClick() {
			const handler = event => {
				if (this.containsEvent(event)) {
					return;
				}
				this.#runClose('cancel');
			};
			this.#outsideClickHandler = handler;
			setTimeout(() => {
				if (this.#outsideClickHandler === handler) {
					main_core.Event.bind(document, 'click', handler);
				}
			}, 0);
		}
		#unbindOutsideClick() {
			if (this.#outsideClickHandler) {
				main_core.Event.unbind(document, 'click', this.#outsideClickHandler);
				this.#outsideClickHandler = null;
			}
		}
		#isInsideSession(event) {
			return this.#eventPath(event).some(node => {
				if (this.#container && node === this.#container) {
					return true;
				}
				return main_core.Type.isDomNode(node) && main_core.Type.isFunction(node.matches) && node.matches('.popup-window, .main-ui-filter-popup, .menu-popup');
			});
		}
		#eventPath(event) {
			if (main_core.Type.isFunction(event.composedPath)) {
				const path = event.composedPath();
				if (path.length > 0) {
					return path;
				}
			}
			return event.target ? [event.target] : [];
		}
		#handlePopupClose() {
			if (this.#tearingDown) {
				return;
			}
			this.#runClose('cancel');
		}
		#runClose(outcome) {
			if (this.#tearingDown || sharedState === 'closing' || sharedState === 'idle') {
				return;
			}
			this.#tearingDown = true;
			sharedState = 'closing';
			this.#sessionId++;
			this.#fireOutcome(outcome);
			const onClose = this.#callbacks?.onClose ?? null;
			try {
				this.#teardownResources();
				this.#restoreFocus();
			} finally {
				this.#resetSession();
				activeInstance = null;
				sharedState = 'idle';
			}
			guard('onClose', onClose);
		}
		#teardownResources() {
			const steps = [() => this.#unbindOutsideClick(), () => this.#appHandle?.notifyClosing(), () => this.#closeFilterPopups(), () => this.#returnFilterToHolder(), () => this.#appHandle?.unmount(), () => this.#destroyPopup()];
			steps.forEach(step => {
				try {
					step();
				} catch (error) {
					console.error('DiskPicker: teardown step failed', error);
				}
			});
		}
		#fireOutcome(outcome) {
			switch (outcome) {
				case 'select':
					guard('onSelect', this.#callbacks?.onSelect ?? null, this.#pendingResult);
					break;
				case 'cancel':
					guard('onCancel', this.#callbacks?.onCancel ?? null);
					break;
				case 'context_invalid':
					guard('onError', this.#callbacks?.onError ?? null, {
						code: 'context_invalid'
					});
					break;
			}
		}
		#destroyPopup() {
			this.#popup?.destroy();
		}
		#restoreFocus() {
			const initiator = this.#initiator;
			if (main_core.Type.isDomNode(initiator) && document.body.contains(initiator) && main_core.Type.isFunction(initiator.focus)) {
				try {
					initiator.focus();
				} catch {
				}
			}
		}
		#resetSession() {
			this.#unbindOutsideClick();
			this.#constraints = null;
			this.#restoredFilter = null;
			this.#filterId = null;
			this.#callbacks = null;
			this.#popup = null;
			this.#appHandle = null;
			this.#container = null;
			this.#filterHost = null;
			this.#filterHolder = null;
			this.#initiator = null;
			this.#pendingResult = null;
			this.#tearingDown = false;
			this.#internal = null;
		}
	}

	exports.DiskPicker = DiskPicker;

})(this.BX.Disk = this.BX.Disk || {}, BX, BX.Main);
//# sourceMappingURL=disk-picker.bundle.js.map
