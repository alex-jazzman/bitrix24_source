import { Loc, Tag } from 'main.core';
import { PopupManager, type Popup } from 'main.popup';
import { Dialog, type DialogEvents, type DialogOptions } from 'ui.system.dialog';
import { defineComponent, markRaw } from 'ui.vue3';

// Dialog reads width and applies it as min/max width of the popup, but leaves it out of its type;
// its event map is declared with every handler required, while subscribing to a single one is enough
type AirDialogOptions = Omit<DialogOptions, 'events'> & {
	width?: number,
	events?: Partial<DialogEvents>,
};

type AirPopupData = {
	dialog: Dialog | null,
	contentContainer: HTMLElement | null,
	sizeObserver: ResizeObserver | null,
};

const CONTENT_ID_PREFIX = 'im-air-popup-content-';
const TITLE_ID_PREFIX = 'im-air-popup-title-';
const CONTENT_WRAPPER_SELECTOR = '.ui-system-dialog__content-wrapper';
const HEADER_LEFT_SELECTOR = '.ui-system-dialog__header-left';
const CLOSE_BUTTON_SELECTOR = '.ui-system-dialog__header-close-btn';
const POPUP_CONTAINER_SELECTOR = '.popup-window';
const MESSENGER_SCOPE_CLASS = 'bx-im-messenger__scope';

// @vue/component
export const MessengerAirPopup = defineComponent({
	name: 'MessengerAirPopup',
	props: {
		id: {
			type: String,
			required: true,
		},
		// a stable anchor for autotests: the dialog id may carry a per-instance suffix
		testId: {
			type: String,
			default: '',
		},
		title: {
			type: String,
			default: '',
		},
		width: {
			type: Number,
			default: 0,
		},
		className: {
			type: String,
			default: '',
		},
		hasOverlay: {
			type: Boolean,
			default: false,
		},
		hasHorizontalPadding: {
			type: Boolean,
			default: true,
		},
		hasVerticalPadding: {
			type: Boolean,
			default: true,
		},
		closeByEsc: {
			type: Boolean,
			default: true,
		},
		closeByClickOutside: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['close'],
	data(): AirPopupData
	{
		return {
			dialog: null,
			contentContainer: null,
			sizeObserver: null,
		};
	},
	computed: {
		contentSelector(): string
		{
			return `#${CONTENT_ID_PREFIX}${this.id}`;
		},
		// the dialog id carries a per-instance suffix, so the anchors are built from testId when it is given
		testAnchor(): string
		{
			return this.testId || this.id;
		},
	},
	watch: {
		title(): void
		{
			this.updateTitle();
		},
	},
	created(): void
	{
		// a DOM node and a class with private fields: Vue's reactive proxy would break both
		const contentContainer = this.createContentContainer();
		this.contentContainer = markRaw(contentContainer);
		this.dialog = markRaw(new Dialog(this.getDialogOptions(contentContainer) as DialogOptions));
		this.dialog.show();
		this.pinPopupToViewport();
		this.setAccessibleNames();
		this.markTestAnchors();
	},
	mounted(): void
	{
		// the dialog places the popup on show, when the teleported content is not in it yet
		this.adjustPopupPosition();
		this.observePopupSize();
	},
	beforeUnmount(): void
	{
		this.sizeObserver?.disconnect();
		this.sizeObserver = null;

		const dialog = this.dialog;
		this.dialog = null;
		dialog?.hide();
	},
	methods: {
		createContentContainer(): HTMLElement
		{
			const classes = [MESSENGER_SCOPE_CLASS, this.className].filter(Boolean).join(' ');

			const contentId = `${CONTENT_ID_PREFIX}${this.id}`;
			const contentTestId = `${this.testAnchor}-content`;

			return Tag.render`<div id="${contentId}" class="${classes}" data-testid="${contentTestId}"></div>`;
		},
		getDialogOptions(content: HTMLElement): AirDialogOptions
		{
			return {
				title: this.title,
				content,
				width: this.width || undefined,
				hasOverlay: this.hasOverlay,
				hasHorizontalPadding: this.hasHorizontalPadding,
				hasVerticalPadding: this.hasVerticalPadding,
				closeByEsc: this.closeByEsc,
				closeByClickOutside: this.closeByClickOutside,
				events: {
					onHide: this.onDialogHide,
				},
			};
		},
		// fixed positioning keeps the page scroll out of the popup coordinates
		pinPopupToViewport(): void
		{
			this.getPopup()?.setFixed(true);
		},
		observePopupSize(): void
		{
			const popupContainer = this.getPopup()?.getPopupContainer();
			if (!popupContainer)
			{
				return;
			}

			// the dialog reacts to its own events only, while the content keeps resizing on its own
			this.sizeObserver = markRaw(new ResizeObserver(this.adjustPopupPosition));
			this.sizeObserver.observe(popupContainer);
		},
		adjustPopupPosition(): void
		{
			const popup = this.getPopup();
			if (popup?.isShown())
			{
				// only the popup coordinates change, so this never resizes the observed container back
				popup.adjustPosition();
			}
		},
		getPopup(): Popup | null
		{
			const popupContainer = this.contentContainer?.closest(POPUP_CONTAINER_SELECTOR);

			return popupContainer ? PopupManager.getPopupById(popupContainer.id) : null;
		},
		onDialogHide(): void
		{
			if (!this.dialog)
			{
				return;
			}

			// the dialog is not cacheable and destroys itself on close, so unmount has nothing left to hide
			this.dialog = null;
			this.$emit('close');
		},
		updateTitle(): void
		{
			const titleNode = this.getTitleNode();
			if (!titleNode)
			{
				this.dialog?.setTitle(this.title);
				this.setAccessibleNames();
				this.markTestAnchors();

				return;
			}

			// Dialog.setTitle rerenders the whole content wrapper and re-parents the mounted content
			// with it, which drops focus, scroll position and media state of the slot
			titleNode.textContent = this.title;
		},
		getTitleNode(): Element | null
		{
			const headerLeft = this.contentContainer
				?.closest(CONTENT_WRAPPER_SELECTOR)
				?.querySelector(HEADER_LEFT_SELECTOR);

			return headerLeft?.firstElementChild ?? null;
		},
		// the dialog renders its close button unnamed and leaves the popup container nameless,
		// so the names are set here and restored after every header rerender
		setAccessibleNames(): void
		{
			this.nameCloseButton();
			this.nameDialog();
		},
		nameCloseButton(): void
		{
			const closeButton = this.getCloseButtonNode();
			if (!closeButton)
			{
				return;
			}

			closeButton.type = 'button';

			const label = Loc.getMessage('IM_ELEMENTS_AIR_POPUP_CLOSE_ARIA');
			if (label)
			{
				closeButton.setAttribute('aria-label', label);
			}
		},
		nameDialog(): void
		{
			const titleNode = this.getTitleNode();
			const popupContainer = this.getPopup()?.getPopupContainer();
			if (!titleNode || !popupContainer)
			{
				return;
			}

			// the title node keeps its id while its text changes, so the name needs no syncing
			titleNode.id = `${TITLE_ID_PREFIX}${this.id}`;
			popupContainer.setAttribute('aria-labelledby', titleNode.id);
		},
		// the header of the dialog belongs to ui.system.dialog and carries no anchors of its own, so the
		// title with its counter and the close button get theirs here, next to the accessible names
		markTestAnchors(): void
		{
			this.getTitleNode()?.setAttribute('data-testid', `${this.testAnchor}-title`);
			this.getCloseButtonNode()?.setAttribute('data-testid', `${this.testAnchor}-close-btn`);
		},
		getCloseButtonNode(): HTMLButtonElement | null
		{
			const contentWrapper = this.contentContainer?.closest(CONTENT_WRAPPER_SELECTOR);

			return contentWrapper?.querySelector<HTMLButtonElement>(CLOSE_BUTTON_SELECTOR) ?? null;
		},
	},
	template: `
		<Teleport :to="contentSelector">
			<slot></slot>
		</Teleport>
	`,
});
