import { ajax, Dom, Event, Extension, Loc, Reflection, Runtime, Tag, Type } from 'main.core';
import { Popup } from 'main.popup';
// Type-only: the internal Vue stack is loaded lazily on the first open() so the
// public entry stays small; see ensureInternal below. No runtime import here.
import {
	type NormalizedFilterValues,
	type PickerAppHandle,
	type PickerConstraints,
} from 'disk.disk-picker.internal';

import {
	type DiskPickerParams,
	type InitialStageParam,
	type PickerResult,
	type SelectionMode,
} from '../types';

type PickerState = 'idle' | 'bootstrapping' | 'open' | 'closing';
type Outcome = 'select' | 'cancel' | 'context_invalid';

type BootstrapResult = {
	filterId: string,
	holder: HTMLElement,
};

type Constraints = {
	signed: Object | null,
	selectionMode: SelectionMode,
	maxItems: number | null,
	effectiveMaxItems: number,
	allowedFileTypes: string[],
	initialStage: InitialStageParam | null,
};

type Callbacks = {
	onOpen: Function | null,
	onSelect: Function | null,
	onCancel: Function | null,
	onClose: Function | null,
	onError: Function | null,
};

type FilterManager = {
	getById: (id: string) => Object | null,
};

type NotificationCenter = {
	notify: (options: { content: string }) => void,
};

const POPUP_HEIGHT = 590;
const POPUP_VIEWPORT_MARGIN = 16;
const VIEWPORT_RESIZE_DELAY = 100;
// The dialog asks only for what the sidebar, the list and the preview need, so a collapsed
// sidebar shrinks the dialog instead of stretching the list. Sidebar and preview widths and
// the collapse threshold are the ones picker-layout.css uses; LIST_WIDTH is the preferred
// list width, which CSS keeps elastic. Both sides must change together.
const SIDEBAR_WIDTH = 210;
const SIDEBAR_COLLAPSED_WIDTH = 80;
const SIDEBAR_COLLAPSE_VIEWPORT = 1000;
const LIST_WIDTH = 488;
const PREVIEW_WIDTH = 282;
const DEFAULT_MAX_ITEMS = 100;
const FILTER_HOST_SELECTOR = '[data-disk-picker-filter-host]';
// The layers that belong to an open picker session while living outside its popup: the
// standard filter dropdowns and menus.
const SESSION_LAYER_SELECTOR = '.popup-window, .main-ui-filter-popup, .menu-popup';
const INTERNAL_EXTENSION = 'disk.disk-picker.internal';
const NOTIFICATION_EXTENSION = 'ui.notification';

// Wire values mirror the internal FileTypeFilter. Kept local so the synchronous
// invalid_params validation runs before the internal bundle is loaded.
const FILE_TYPE_ALIASES: readonly string[] = Object.freeze([
	'document', 'spreadsheet', 'presentation', 'board', 'image', 'audio', 'video', 'other',
]);
const SELECTION_MODES: readonly string[] = Object.freeze(['single', 'multiple']);
const INITIAL_STAGE_TYPES: readonly string[] = Object.freeze(['recent', 'folder', 'sources']);
const INITIAL_STAGE_KEYS: readonly string[] = Object.freeze(['type', 'storageId', 'folderId']);

// The subset of the internal extension the facade calls after a lazy load.
type InternalApi = {
	mountPickerApp: (container: HTMLElement, props?: { [key: string]: any }) => PickerAppHandle,
	readInitialFilterValues: (filter: Object) => NormalizedFilterValues,
	resetInitialFilterValues: (filter: Object) => boolean,
};

// The state machine is shared across every DiskPicker instance on the page:
// only one picker session may exist at a time.
let sharedState: PickerState = 'idle';
let activeInstance: DiskPicker | null = null;

// The standard filter bootstrap is prepared once and reused by every session.
let bootstrapPromise: Promise<BootstrapResult> | null = null;
let bootstrapResult: BootstrapResult | null = null;

// The internal Vue app is loaded once per page and reused; a failed load is not
// cached, so the next open() retries and reports bootstrap_failed cleanly.
let internalPromise: Promise<InternalApi> | null = null;
let internalApi: InternalApi | null = null;

// A full page load creates a new JavaScript context. Within one page, keep the
// user's filter changes across repeated picker sessions.
let filterInitializedForPage: boolean = false;

// Test-only: drops the page-level singleton caches so each unit test starts from a
// clean machine. Not re-exported from the package entry, so it stays off the public
// surface. Never call it from production code.
export function resetDiskPickerStateForTests(): void
{
	sharedState = 'idle';
	activeInstance = null;
	bootstrapPromise = null;
	bootstrapResult = null;
	internalPromise = null;
	internalApi = null;
	filterInitializedForPage = false;
}

function ensureInternal(): Promise<InternalApi>
{
	if (internalApi)
	{
		return Promise.resolve(internalApi);
	}

	if (!internalPromise)
	{
		internalPromise = Runtime.loadExtension(INTERNAL_EXTENSION)
			.then((exports: any) => {
				if (
					!exports
					|| !Type.isFunction(exports.mountPickerApp)
					|| !Type.isFunction(exports.readInitialFilterValues)
					|| !Type.isFunction(exports.resetInitialFilterValues)
				)
				{
					throw new Error('DiskPicker: internal extension is missing its API');
				}

				internalApi = exports as InternalApi;

				return internalApi;
			})
			.catch((error) => {
				internalPromise = null;

				throw error;
			});
	}

	return internalPromise;
}

function getFilterManager(): FilterManager | null
{
	const manager = Reflection.getClass('BX.Main.filterManager');

	return (manager as FilterManager | null) ?? null;
}

// The notification center is not in the facade's rel: the facade stays thin, and
// the invalid_params branch runs before the internal bundle (which does depend on
// it) is loaded. Pulling it in on demand keeps that branch's notification visible
// on a page where the picker has never been opened.
function notify(content: string): void
{
	Runtime.loadExtension(NOTIFICATION_EXTENSION)
		.then(() => {
			const center = Reflection.getClass('BX.UI.Notification.Center') as NotificationCenter | null;
			if (center && Type.isFunction(center.notify))
			{
				center.notify({ content });
			}
		})
		.catch(() => {
			// An unavailable notification center must not break the picker flow.
		});
}

function message(code: string, replacements?: { [key: string]: string }): string
{
	return Loc.getMessage(code, replacements) ?? '';
}

function guard(name: string, callback: Function | null | undefined, argument?: any): void
{
	if (!Type.isFunction(callback))
	{
		return;
	}

	try
	{
		callback(argument);
	}
	catch (error)
	{
		// Never serialize the container, selection or other arguments into the log.
		console.error(`DiskPicker: "${name}" callback threw`, error);
	}
}

function callbackFrom(value: any): Function | null
{
	return Type.isFunction(value) ? value : null;
}

function isValidAllowedFileTypes(value: any): boolean
{
	if (Type.isUndefined(value))
	{
		return true;
	}

	if (!Type.isArray(value))
	{
		return false;
	}

	return value.every((alias) => Type.isStringFilled(alias) && FILE_TYPE_ALIASES.includes(alias));
}

function isPositiveInteger(value: any): boolean
{
	return Type.isNumber(value) && Number.isInteger(value) && value > 0;
}

function isValidInitialStage(value: any): boolean
{
	if (Type.isNil(value))
	{
		return true;
	}

	if (
		!Type.isPlainObject(value)
		|| !Type.isStringFilled(value.type)
		|| !INITIAL_STAGE_TYPES.includes(value.type)
		|| Object.keys(value).some((key) => !INITIAL_STAGE_KEYS.includes(key))
	)
	{
		return false;
	}

	if (value.type === 'folder')
	{
		return isPositiveInteger(value.storageId) && isPositiveInteger(value.folderId);
	}

	return Type.isNil(value.storageId) && Type.isNil(value.folderId);
}

function isValidUnsignedParams(params: DiskPickerParams): boolean
{
	const selectionModeValid = Type.isUndefined(params.selectionMode)
		|| (Type.isString(params.selectionMode) && SELECTION_MODES.includes(params.selectionMode));
	const maxItemsValid = Type.isNil(params.maxItems)
		|| (
			isPositiveInteger(params.maxItems)
			&& params.maxItems <= DEFAULT_MAX_ITEMS
		);

	return selectionModeValid
		&& maxItemsValid
		&& isValidAllowedFileTypes(params.allowedFileTypes)
		&& isValidInitialStage(params.initialStage);
}

function deepClone(value: any): any
{
	if (Type.isArray(value))
	{
		return value.map((entry) => deepClone(entry));
	}

	if (Type.isPlainObject(value))
	{
		const result: { [key: string]: any } = {};
		Object.keys(value).forEach((key) => {
			result[key] = deepClone(value[key]);
		});

		return result;
	}

	return value;
}

function deepFreeze(value: any): any
{
	if (Type.isArray(value))
	{
		value.forEach((entry) => deepFreeze(entry));

		return Object.freeze(value);
	}

	if (Type.isPlainObject(value))
	{
		Object.keys(value).forEach((key) => deepFreeze(value[key]));

		return Object.freeze(value);
	}

	return value;
}

function normalizeInitialStage(stage: InitialStageParam | null | undefined): InitialStageParam | null
{
	if (!Type.isPlainObject(stage))
	{
		return null;
	}

	return Object.freeze({
		type: stage.type,
		storageId: Type.isNil(stage.storageId) ? null : stage.storageId,
		folderId: Type.isNil(stage.folderId) ? null : stage.folderId,
	});
}

function copyAllowedFileTypes(value: unknown): string[]
{
	return Type.isArray(value) ? [...(value as string[])] : [];
}

function normalizeSelection(selectionModeRaw: unknown, maxItemsRaw: unknown): {
	selectionMode: SelectionMode,
	maxItems: number | null,
	effectiveMaxItems: number,
}
{
	const selectionMode: SelectionMode = selectionModeRaw === 'multiple' ? 'multiple' : 'single';
	const rawMaxItems = Type.isNumber(maxItemsRaw) ? maxItemsRaw : null;
	const boundedMaxItems = Math.min(rawMaxItems ?? DEFAULT_MAX_ITEMS, DEFAULT_MAX_ITEMS);
	const effectiveMaxItems = selectionMode === 'single' ? 1 : boundedMaxItems;

	return { selectionMode, maxItems: rawMaxItems, effectiveMaxItems };
}

function buildConstraints(params: DiskPickerParams, hasSignedConfig: boolean): Constraints
{
	if (hasSignedConfig)
	{
		// The signed descriptor is the stronger source: selectionMode, maxItems,
		// allowedFileTypes and initialStage are read from it (not the call params),
		// so a signed multiple/maxItems/folder actually drives the UI. The descriptor
		// stays opaque - it is not client-validated; the backend verifies the
		// signature and re-applies every constraint.
		const signed = deepFreeze(deepClone(params.signedConfig));
		const descriptor = (Type.isPlainObject(signed) ? signed : {}) as { [key: string]: any };
		const selection = normalizeSelection(descriptor.selectionMode, descriptor.maxItems);

		return {
			signed,
			...selection,
			allowedFileTypes: copyAllowedFileTypes(descriptor.allowedFileTypes),
			initialStage: normalizeInitialStage(descriptor.initialStage),
		};
	}

	const selection = normalizeSelection(params.selectionMode, params.maxItems);

	return {
		signed: null,
		...selection,
		allowedFileTypes: copyAllowedFileTypes(params.allowedFileTypes),
		initialStage: normalizeInitialStage(params.initialStage),
	};
}

function captureCallbacks(params: DiskPickerParams): Callbacks
{
	return {
		onOpen: callbackFrom(params.onOpen),
		onSelect: callbackFrom(params.onSelect),
		onCancel: callbackFrom(params.onCancel),
		onClose: callbackFrom(params.onClose),
		onError: callbackFrom(params.onError),
	};
}

function getFocusableInitiator(): HTMLElement | null
{
	const active = document.activeElement;
	if (Type.isDomNode(active) && active !== document.body)
	{
		return active as HTMLElement;
	}

	return null;
}

async function requestBootstrap(): Promise<BootstrapResult>
{
	let holder: HTMLElement | null = null;

	try
	{
		const response = await ajax.runComponentAction('bitrix:disk.file.picker', 'getBootstrap', {
			mode: 'class',
		});
		const data = response?.data ?? {};

		if (!Type.isStringFilled(data.html) || !Type.isStringFilled(data.filterId))
		{
			throw new Error('DiskPicker: empty bootstrap response');
		}

		const node = Tag.render`<div class="disk-picker__filter-holder" style="display: none;"></div>` as HTMLElement;
		holder = node;
		Dom.append(node, document.body);

		await Runtime.html(node, data.html);

		const filter = getFilterManager()?.getById(data.filterId);
		if (!filter)
		{
			throw new Error('DiskPicker: filter instance is not registered');
		}

		const result: BootstrapResult = { filterId: data.filterId, holder: node };
		bootstrapResult = result;

		return result;
	}
	catch (error)
	{
		if (holder)
		{
			Dom.remove(holder);
		}
		bootstrapPromise = null;

		throw error;
	}
}

function ensureBootstrap(): Promise<BootstrapResult>
{
	if (bootstrapResult)
	{
		return Promise.resolve(bootstrapResult);
	}

	if (!bootstrapPromise)
	{
		bootstrapPromise = requestBootstrap();
	}

	return bootstrapPromise;
}

export class DiskPicker
{
	static isEnabled(): boolean
	{
		return Extension.getSettings('disk.disk-picker').get('enabled', false) === true;
	}

	// Frozen snapshot of the session constraints; the single source of request
	// constraints for the data layer.
	#constraints: Constraints | null = null;
	#restoredFilter: NormalizedFilterValues | null = null;
	#filterId: string | null = null;
	#callbacks: Callbacks | null = null;
	#popup: Popup | null = null;
	#viewportResizeHandler: ((event: UIEvent) => void) | null = null;
	#appHandle: PickerAppHandle | null = null;
	#container: HTMLElement | null = null;
	#filterHost: HTMLElement | null = null;
	#filterHolder: HTMLElement | null = null;
	#initiator: HTMLElement | null = null;
	#pendingResult: PickerResult | null = null;
	#tearingDown: boolean = false;
	#outsideClickHandler: ((event: MouseEvent) => void) | null = null;
	#internal: InternalApi | null = null;
	#sessionId: number = 0;
	// The window reports a shown preview: the viewer covers the page from the body, so
	// every click of that overlay lands outside the popup without leaving the session.
	#previewShown: boolean = false;
	#previewShownTimer: ReturnType<typeof setTimeout> | null = null;

	open(params: DiskPickerParams): void
	{
		const options = Type.isPlainObject(params) ? params : {};

		if (sharedState !== 'idle')
		{
			guard('onError', callbackFrom(options.onError), { code: 'already_open' });

			return;
		}

		const hasSignedConfig = Type.isPlainObject(options.signedConfig);

		if (!hasSignedConfig && !isValidUnsignedParams(options))
		{
			notify(message('DISK_PICKER_NOTIFY_INVALID_PARAMS'));
			guard('onError', callbackFrom(options.onError), { code: 'invalid_params' });

			return;
		}

		this.#initiator = getFocusableInitiator();
		this.#constraints = buildConstraints(options, hasSignedConfig);
		this.#callbacks = captureCallbacks(options);
		this.#pendingResult = null;
		this.#tearingDown = false;

		sharedState = 'bootstrapping';
		// eslint-disable-next-line unicorn/no-this-assignment -- the shared state machine tracks the active session
		activeInstance = this;
		const sessionId = ++this.#sessionId;

		// Load the filter bootstrap and the internal Vue app in parallel. A failure of
		// either is a bootstrap failure: not cached, no onOpen/onCancel/onClose.
		Promise.all([ensureBootstrap(), ensureInternal()])
			.then(([result, internal]) => this.#handleBootstrapReady(sessionId, result, internal))
			.catch(() => this.#handleBootstrapFailed(sessionId));
	}

	containsEvent(event: MouseEvent): boolean
	{
		return activeInstance === this
			&& sharedState === 'open'
			&& (this.#previewShown || this.#isInsideSession(event));
	}

	close(): void
	{
		if (activeInstance !== this || !['bootstrapping', 'open'].includes(sharedState))
		{
			return;
		}

		this.#runClose('cancel');
	}

	#handleBootstrapReady(sessionId: number, result: BootstrapResult, internal: InternalApi): void
	{
		if (!this.#isCurrentSession(sessionId, 'bootstrapping'))
		{
			return;
		}

		this.#internal = internal;
		this.#filterId = result.filterId;
		this.#resetInitialFilterValues(result.filterId);
		const container = Tag.render`<div class="disk-picker" tabindex="-1" data-testid="universal-disk-picker-root"></div>`;
		this.#container = container;
		this.#popup = this.#createPopup(container);
		this.#appHandle = internal.mountPickerApp(container, {});
		this.#relocateFilterIntoPopup(result, container);

		this.#popup.show();

		this.#focusContainer(container);
		this.#bindOutsideClick();
		this.#bindViewportResize();
		this.#readInitialFilterValues(result.filterId);
		this.#startSession(result.filterId, sessionId);

		sharedState = 'open';
		guard('onOpen', this.#callbacks?.onOpen ?? null, { container });
	}

	#resetInitialFilterValues(filterId: string): void
	{
		if (filterInitializedForPage)
		{
			return;
		}

		const filter = getFilterManager()?.getById(filterId);
		if (!filter || !this.#internal?.resetInitialFilterValues(filter))
		{
			throw new Error('DiskPicker: failed to reset initial filter values');
		}

		filterInitializedForPage = true;
	}

	#startSession(filterId: string, sessionId: number): void
	{
		const restoredFilter = this.#restoredFilter ?? {
			find: '',
			objectTypeFilter: 'all',
			fileTypeFilters: [],
		};

		this.#appHandle?.start({
			constraints: this.#toPickerConstraints(),
			restoredFilter,
			filterId,
			callbacks: {
				// FIND clearing and the filter reset are owned by the internal filter
				// adapter, which suppresses the apply events they generate; the mount
				// handle replaces these placeholders with the adapter's own methods.
				suppressFilterFind: () => {},
				resetFilters: () => {},
				onContextInvalid: () => this.#handleContextInvalid(sessionId),
				notify: (code: string, replacements?: { [key: string]: string }) => notify(message(code, replacements)),
				emitSelection: (result: PickerResult) => this.#handleSelection(result),
				requestCancel: () => this.#runClose('cancel'),
				setPreviewShown: (shown: boolean) => this.#setPreviewShown(shown),
			},
		});
	}

	#handleSelection(result: PickerResult): void
	{
		// The internal result item is structurally the public DTO-04 item; copy it
		// into a fresh public result rather than leaking the internal reference.
		this.#pendingResult = {
			items: result.items.map((item) => ({
				objectId: item.objectId,
				name: item.name,
				size: item.size,
				extension: item.extension,
				fileType: item.fileType,
				previewUrl: item.previewUrl,
				sourceTitle: item.sourceTitle,
				parentFolderName: item.parentFolderName,
				editorFileType: item.editorFileType,
			})),
		};
		this.#runClose('select');
	}

	#toPickerConstraints(): PickerConstraints
	{
		const constraints = this.#constraints;
		const stage = constraints?.initialStage ?? null;

		return {
			signedConfig: constraints?.signed ?? null,
			allowedFileTypes: constraints ? [...constraints.allowedFileTypes] : [],
			initialStage: stage === null ? null : {
				type: stage.type,
				storageId: stage.storageId ?? null,
				folderId: stage.folderId ?? null,
			},
			selectionMode: constraints?.selectionMode ?? 'single',
			maxItems: constraints?.effectiveMaxItems ?? 1,
		};
	}

	#handleContextInvalid(sessionId: number): void
	{
		if (!this.#isCurrentSession(sessionId))
		{
			return;
		}

		this.#runClose('context_invalid');
	}

	#handleBootstrapFailed(sessionId: number): void
	{
		if (!this.#isCurrentSession(sessionId))
		{
			return;
		}

		const onError = this.#callbacks?.onError ?? null;

		this.#tearingDown = true;
		sharedState = 'closing';
		try
		{
			this.#teardownResources();
			this.#restoreFocus();
		}
		finally
		{
			this.#resetSession();
			activeInstance = null;
			sharedState = 'idle';
		}

		notify(message('DISK_PICKER_NOTIFY_BOOTSTRAP_FAILED'));
		guard('onError', onError, { code: 'bootstrap_failed' });
	}

	#isCurrentSession(sessionId: number, expectedState?: PickerState): boolean
	{
		return activeInstance === this
			&& sessionId === this.#sessionId
			&& (expectedState === undefined || sharedState === expectedState);
	}

	#createPopup(container: HTMLElement): Popup
	{
		const { width, height } = this.#resolveSize();

		return new Popup({
			// The dialog is glass over the portal wallpaper, so it lives in the edge token
			// context: inside it every base colour and surface flips to its light-on-dark
			// value, which is what the whole picker is coloured against.
			className: 'disk-picker-popup --ui-context-edge-dark',
			// The dialog has no visible title (no title bar or close icon by design),
			// so give role="dialog" an accessible name for screen readers.
			ariaLabel: message('DISK_PICKER_DIALOG_LABEL'),
			content: container,
			width,
			height,
			minWidth: width,
			minHeight: height,
			padding: 0,
			contentPadding: 0,
			closeIcon: false,
			closeByEsc: true,
			autoHide: false,
			overlay: {
				// No token carries this dim yet, so the values come from the layout as is.
				// Keep the viewport layer to a flat tint: a live backdrop filter here can drop
				// the complete nested popup stack for one compositor frame during fast scroll.
				backgroundColor: 'rgba(0, 32, 78, 0.46)',
				// The stylesheet keeps the overlay at opacity .5, which would halve the alpha
				// above; a full opacity hands the fill its own alpha unchanged.
				opacity: 100,
			},
			cacheable: false,
			angle: false,
			events: {
				onPopupClose: () => this.#handlePopupClose(),
			},
		});
	}

	// The preferred size yields to the viewport: a hard minimum pushed the dialog
	// off-screen on narrow windows and short viewports.
	#resolveSize(): { width: number, height: number }
	{
		const sidebarWidth = window.innerWidth < SIDEBAR_COLLAPSE_VIEWPORT
			? SIDEBAR_COLLAPSED_WIDTH
			: SIDEBAR_WIDTH;
		const preferredWidth = sidebarWidth + LIST_WIDTH + PREVIEW_WIDTH;

		return {
			width: Math.min(preferredWidth, Math.max(0, window.innerWidth - POPUP_VIEWPORT_MARGIN * 2)),
			height: Math.min(POPUP_HEIGHT, Math.max(0, window.innerHeight - POPUP_VIEWPORT_MARGIN * 2)),
		};
	}

	// A resize while the dialog is open must reach the popup itself: the collapsed sidebar
	// is pure CSS, but the popup keeps the size it got when it opened.
	#applyPopupSize(): void
	{
		const popup = this.#popup;
		if (!popup)
		{
			return;
		}

		const { width, height } = this.#resolveSize();
		popup.setMinWidth(width);
		popup.setMinHeight(height);
		popup.setWidth(width);
		popup.setHeight(height);
		popup.adjustPosition();
	}

	#bindViewportResize(): void
	{
		const debounced = Runtime.debounce(() => this.#applyPopupSize(), VIEWPORT_RESIZE_DELAY);
		this.#viewportResizeHandler = (): void => {
			debounced();
		};
		Event.bind(window, 'resize', this.#viewportResizeHandler);
	}

	#unbindViewportResize(): void
	{
		if (!this.#viewportResizeHandler)
		{
			return;
		}

		Event.unbind(window, 'resize', this.#viewportResizeHandler);
		this.#viewportResizeHandler = null;
	}

	#relocateFilterIntoPopup(result: BootstrapResult, container: HTMLElement): void
	{
		this.#filterHolder = result.holder;
		this.#filterHost = container.querySelector<HTMLElement>(FILTER_HOST_SELECTOR);

		if (!this.#filterHost)
		{
			return;
		}

		while (result.holder.firstChild)
		{
			Dom.append(result.holder.firstChild as HTMLElement, this.#filterHost);
		}
	}

	#closeFilterPopups(): void
	{
		if (!this.#filterId)
		{
			return;
		}

		try
		{
			const filter = getFilterManager()?.getById(this.#filterId) as { closePopup?: () => void } | null;
			if (filter && Type.isFunction(filter.closePopup))
			{
				filter.closePopup();
			}
		}
		catch (error)
		{
			console.error('DiskPicker: failed to close the filter popup', error);
		}
	}

	#returnFilterToHolder(): void
	{
		const host = this.#filterHost;
		const holder = this.#filterHolder;
		if (!host || !holder)
		{
			return;
		}

		while (host.firstChild)
		{
			Dom.append(host.firstChild as HTMLElement, holder);
		}
	}

	#readInitialFilterValues(filterId: string): void
	{
		try
		{
			const filter = getFilterManager()?.getById(filterId);
			if (filter && this.#internal)
			{
				this.#restoredFilter = this.#internal.readInitialFilterValues(filter);
			}
		}
		catch (error)
		{
			this.#restoredFilter = null;
			console.error('DiskPicker: failed to read initial filter values', error);
		}
	}

	#focusContainer(container: HTMLElement): void
	{
		try
		{
			container.focus();
		}
		catch
		{
			// A non-focusable container is not fatal.
		}
	}

	// The click that closes the viewer ends the preview session on the way up, while the
	// same click is still being dispatched: the outside-click handler below sees it after
	// the overlay is already gone. The report of a closed preview is taken once that event
	// is over, so the window does not close on the click of the viewer's own close button.
	#setPreviewShown(shown: boolean): void
	{
		if (this.#previewShownTimer !== null)
		{
			clearTimeout(this.#previewShownTimer);
			this.#previewShownTimer = null;
		}

		if (shown)
		{
			this.#previewShown = true;

			return;
		}

		this.#previewShownTimer = setTimeout(() => {
			this.#previewShownTimer = null;
			this.#previewShown = false;
		}, 0);
	}

	#bindOutsideClick(): void
	{
		const handler = (event: MouseEvent): void => {
			if (this.containsEvent(event))
			{
				return;
			}

			this.#runClose('cancel');
		};
		this.#outsideClickHandler = handler;

		// Defer so the click that opened the picker does not immediately close it.
		setTimeout(() => {
			if (this.#outsideClickHandler === handler)
			{
				Event.bind(document, 'click', handler);
			}
		}, 0);
	}

	#unbindOutsideClick(): void
	{
		if (this.#outsideClickHandler)
		{
			Event.unbind(document, 'click', this.#outsideClickHandler);
			this.#outsideClickHandler = null;
		}
	}

	// The clicked node can be detached from the DOM before this bubble-phase handler
	// runs: navigating into a folder re-renders the list and removes the clicked row,
	// so `container.contains(target)` would misread an inside click as outside and
	// close the window. `composedPath()` is captured when the event is dispatched and
	// still holds the container and every ancestor after the re-render; it also covers
	// the layers that render outside the popup DOM but belong to the session all the same.
	#isInsideSession(event: MouseEvent): boolean
	{
		return this.#eventPath(event).some((node) => {
			if (this.#container && node === this.#container)
			{
				return true;
			}

			return Type.isDomNode(node)
				&& Type.isFunction((node as Element).matches)
				&& (node as Element).matches(SESSION_LAYER_SELECTOR);
		});
	}

	#eventPath(event: MouseEvent): EventTarget[]
	{
		if (Type.isFunction(event.composedPath))
		{
			const path = event.composedPath();
			if (path.length > 0)
			{
				return path;
			}
		}

		return event.target ? [event.target] : [];
	}

	#handlePopupClose(): void
	{
		if (this.#tearingDown)
		{
			return;
		}

		this.#runClose('cancel');
	}

	#runClose(outcome: Outcome): void
	{
		if (this.#tearingDown || sharedState === 'closing' || sharedState === 'idle')
		{
			return;
		}

		this.#tearingDown = true;
		sharedState = 'closing';
		this.#sessionId++;

		this.#fireOutcome(outcome);

		const onClose = this.#callbacks?.onClose ?? null;
		try
		{
			this.#teardownResources();
			this.#restoreFocus();
		}
		finally
		{
			this.#resetSession();
			activeInstance = null;
			sharedState = 'idle';
		}

		guard('onClose', onClose);
	}

	#teardownResources(): void
	{
		const steps = [
			() => this.#unbindOutsideClick(),
			() => this.#unbindViewportResize(),
			() => this.#appHandle?.notifyClosing(),
			() => this.#closeFilterPopups(),
			() => this.#returnFilterToHolder(),
			() => this.#appHandle?.unmount(),
			() => this.#destroyPopup(),
		];

		steps.forEach((step) => {
			try
			{
				step();
			}
			catch (error)
			{
				console.error('DiskPicker: teardown step failed', error);
			}
		});
	}

	#fireOutcome(outcome: Outcome): void
	{
		switch (outcome)
		{
			case 'select':
				guard('onSelect', this.#callbacks?.onSelect ?? null, this.#pendingResult);
				break;
			case 'cancel':
				guard('onCancel', this.#callbacks?.onCancel ?? null);
				break;
			case 'context_invalid':
				guard('onError', this.#callbacks?.onError ?? null, { code: 'context_invalid' });
				break;
			// no default
		}
	}

	#destroyPopup(): void
	{
		this.#popup?.destroy();
	}

	#restoreFocus(): void
	{
		const initiator = this.#initiator;
		if (
			Type.isDomNode(initiator)
			&& document.body.contains(initiator)
			&& Type.isFunction(initiator.focus)
		)
		{
			try
			{
				initiator.focus();
			}
			catch
			{
				// A disconnected or non-focusable initiator is ignored without fallback.
			}
		}
	}

	#resetSession(): void
	{
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
		if (this.#previewShownTimer !== null)
		{
			clearTimeout(this.#previewShownTimer);
			this.#previewShownTimer = null;
		}
		this.#previewShown = false;
	}
}
