import { PopupManager } from 'main.popup';

import { Utils } from 'im.v2.lib.utils';
import { MessengerPopup } from 'im.v2.component.elements.popup';

import './css/menu.css';

const ID_PREFIX = 'im-v2-menu';

// Match ui.system.menu: each item is its own Tab stop, so the menu navigates with Tab
// (no arrow-key roving). This selector locates the first item to seed focus on open.
const FOCUSABLE_ITEM_SELECTOR = 'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

// @vue/component
export const MessengerMenu = {
	name: 'MessengerMenu',
	components: { MessengerPopup },
	props:
	{
		config: {
			type: Object,
			required: true,
		},
		className: {
			type: String,
			required: false,
			default: '',
		},
	},
	emits: ['close'],
	data(): { id: string }
	{
		return {
			id: '',
		};
	},
	created()
	{
		this.id = this.config.id ?? `${ID_PREFIX}-${Utils.text.getUuidV4()}`;

		// Non-reactive handles: DOM/popup references must not live in reactive state.
		this.openerElement = null;
		this.onPopupAfterShow = null;
	},
	mounted()
	{
		// The popup (child) mounts first, so the container is already in the DOM here.
		// Capture the opener before moving focus inside, then seed focus on the first item.
		this.openerElement = document.activeElement;

		// The popup show animation keeps items at opacity 0 for a frame. A direct focus()
		// still lands there, but if the container is not focusable yet, retry once shown.
		if (!this.focusFirstItem())
		{
			this.subscribeOnPopupShown();
		}
	},
	beforeUnmount()
	{
		// Runs before the child popup unmounts, so the container DOM is still present.
		const popup = PopupManager.getPopupById(this.id);
		if (popup && this.onPopupAfterShow)
		{
			popup.unsubscribe('onAfterShow', this.onPopupAfterShow);
		}

		this.returnFocusToOpener();
	},
	methods: {
		focusFirstItem(): boolean
		{
			const container = this.$refs.container;
			const firstItem = container?.querySelector(FOCUSABLE_ITEM_SELECTOR) ?? null;
			firstItem?.focus({ preventScroll: true });

			// Confirm focus actually moved inside (it will not while the popup stays hidden).
			return Boolean(container?.contains(document.activeElement));
		},
		subscribeOnPopupShown(): void
		{
			const popup = PopupManager.getPopupById(this.id);
			if (!popup)
			{
				return;
			}

			this.onPopupAfterShow = () => {
				this.focusFirstItem();
			};
			popup.subscribe('onAfterShow', this.onPopupAfterShow);
		},
		returnFocusToOpener(): void
		{
			// With an active focus trap the popup restores focus to the opener itself on close,
			// so restoring here as well would move focus twice. The trap is opt-in
			// (useFocusTrapInDialogs) and off by default in production, where we restore it.
			const focusTrap = PopupManager.getPopupById(this.id)?.getFocusTrap() ?? null;
			if (focusTrap !== null)
			{
				return;
			}

			// Only restore when focus still lives inside the menu (it would be lost on unmount).
			// If the user moved focus elsewhere - clicked outside, or activated an item that
			// navigated away - leave it where it is.
			const container = this.$refs.container;
			if (container?.contains(document.activeElement) && this.openerElement)
			{
				this.openerElement.focus({ preventScroll: true });
			}
		},
	},
	template: `
		<MessengerPopup
			:config="config"
			@close="$emit('close')"
			:id="id"
		>
			<div class="bx-im-menu__container" :class="className" ref="container">
				<slot name="header"></slot>
				<slot></slot>
				<slot name="footer"></slot>
			</div>
		</MessengerPopup>
	`,
};
