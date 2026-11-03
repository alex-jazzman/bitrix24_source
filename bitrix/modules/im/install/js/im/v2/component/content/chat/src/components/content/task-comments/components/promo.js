import { Event } from 'main.core';
import { PopupManager, type PopupOptions } from 'main.popup';

import { FocusNavigator, InteractivityChecker } from 'ui.a11y';

import { HeaderControlKey } from 'im.v2.component.content.elements';
import { MessengerPopup } from 'im.v2.component.elements.popup';
import { PopupType } from 'im.v2.const';
import {
	CHAT_DETAIL_FOCUS_CONTEXT,
	type ChatDetailFocusContext,
	type HeaderControlSnapshotEntry,
} from 'im.v2.lib.a11y';

import '../css/task-card-promo.css';

const POPUP_CLASSNAME = 'bx-im-task-card-promo-popup__container --line-clamp-3 --ui-context-content-dark';

/**
 * `main.popup` draws the close icon itself, and draws it as a native button with a tabindex of its own -
 * so it is reachable in every engine. The promo names that very node and hands it to the header as a
 * logical stop, instead of putting a second close button of its own beside it.
 */
const CLOSE_BUTTON_SELECTOR = '.popup-window-close-icon';

const TAB_KEY = 'Tab';

// One promo shows at a time, so the text it describes the task button with carries one stable id.
export const TASK_CARD_PROMO_DESCRIPTION_ID = 'bx-im-task-card-promo-description';

// @vue/component
export const TaskCardPromo = {
	name: 'TaskCardPromo',
	components: { MessengerPopup },
	inject:
	{
		chatDetailFocusContext: {
			from: CHAT_DETAIL_FOCUS_CONTEXT,
			default: null,
		},
	},
	props: {
		bindElement: {
			type: Object,
			required: true,
		},
	},
	emits: ['close'],
	computed: {
		PopupType: () => PopupType,
		TASK_CARD_PROMO_DESCRIPTION_ID: () => TASK_CARD_PROMO_DESCRIPTION_ID,
		popupConfig(): PopupOptions
		{
			return {
				bindElement: this.bindElement,
				targetContainer: document.body,
				className: POPUP_CLASSNAME,
				width: 460,
				padding: 0,
				overlay: false,
				offsetTop: 8,
				offsetLeft: 17,
				bindOptions: { position: 'bottom' },
				closeIcon: true,
				/**
				 * A hint takes no focus of its own and holds none: its close button is an ordinary stop
				 * of the walk, right behind the task button the promo belongs to. Without a trap nobody
				 * puts the focus back either, which is what `returnFocusToOpener` is here for.
				 */
				focusTrap: false,
				angle: { position: 'top' },
				animation: 'fading',
			};
		},
	},
	created()
	{
		// Not in data(): neither the nodes of somebody else's popup nor the spent close reach the template.
		this.promoSurface = null;
		this.closeButton = null;
		this.isClosed = false;
	},
	mounted()
	{
		this.registerCloseButton();
	},
	beforeUnmount()
	{
		// A promo taken away by its owner - the chat changing under it - is no close by the user: the
		// popup tears itself down together with this component, and that teardown reports nothing.
		this.isClosed = true;
		this.unregisterCloseButton();
	},
	methods: {
		// Teleported out of the header, so the walk gets the close button by the key it logically follows.
		registerCloseButton(): void
		{
			const surface = PopupManager.getPopupById(PopupType.taskSideCardPromo)?.getPopupContainer() ?? null;
			const closeButton = surface?.querySelector(CLOSE_BUTTON_SELECTOR) ?? null;
			if (closeButton === null)
			{
				return;
			}

			this.promoSurface = surface;
			this.closeButton = closeButton;
			closeButton.setAttribute('aria-label', this.loc('IM_CONTENT_TASK_SIDE_CARD_PROMO_CLOSE_ARIA'));

			this.getFocusContext()?.registerHeaderControl({
				key: HeaderControlKey.promoClose,
				element: closeButton,
				after: HeaderControlKey.taskCard,
			});

			// The listener of somebody else's node lives exactly as long as the branch of the walk does,
			// so the popup keeps its own keyboard model everywhere outside these two steps.
			Event.bind(closeButton, 'keydown', this.onCloseButtonKeydown);
		},
		unregisterCloseButton(): void
		{
			if (this.closeButton === null)
			{
				return;
			}

			Event.unbind(this.closeButton, 'keydown', this.onCloseButtonKeydown);
			this.getFocusContext()?.unregisterHeaderControl(HeaderControlKey.promoClose, this.closeButton);
			// `PopupManager` keeps its instances by id, so the name of the promo goes with the promo:
			// the next owner of the very same container would inherit it otherwise.
			this.closeButton.removeAttribute('aria-label');
			this.closeButton = null;
			this.promoSurface = null;
		},
		/**
		 * Enter, Space, Escape and the mouse all arrive here through the close of the popup itself: the
		 * close icon is a native button, and `main.popup` owns Escape for the surface it draws. That
		 * ownership is also what counts the key as handled - the shared `EscManager` stops before its own
		 * chain while a popup is shown - so the chat behind the promo does not close along with it.
		 *
		 * The popup reports its close twice, on the close and on the destroy that follows it, so the
		 * gesture is spent the first time: one activation takes the promo away exactly once.
		 */
		onPopupClose(): void
		{
			if (this.isClosed)
			{
				return;
			}
			this.isClosed = true;

			this.returnFocusToOpener();
			this.$emit('close');
		},
		/**
		 * The close button is drawn at the end of the document, and the walk owes it the place right
		 * behind the task button - a place no document order can give it. So `Tab` is the one key taken
		 * here: forward it steps on to whatever follows the promo in the header, back it returns to the
		 * task button the promo belongs to. Everything else stays with `main.popup`, Escape and the
		 * activation of the close included.
		 */
		onCloseButtonKeydown(event: KeyboardEvent): void
		{
			if (event.key !== TAB_KEY || this.isClosed)
			{
				return;
			}

			const target = this.findWalkStop(event.shiftKey);
			if (target === null)
			{
				return;
			}

			event.preventDefault();
			FocusNavigator.focusTarget(target, { preventScroll: true });
		},
		/**
		 * The nearest live stop beside the close button in the walk the header itself declares: the
		 * snapshot already carries the logical place of the teleported control, so the branch spells no
		 * order out a second time. Nothing to step on to leaves the ordinary walk alone.
		 */
		findWalkStop(isBackwards: boolean): HTMLElement | null
		{
			const context = this.getFocusContext();
			if (context === null)
			{
				return null;
			}

			const snapshot = context.getHeaderSnapshot();
			const ownIndex = snapshot.findIndex((entry: HeaderControlSnapshotEntry) => {
				return entry.key === HeaderControlKey.promoClose;
			});
			if (ownIndex === -1)
			{
				return null;
			}

			const side = isBackwards
				? snapshot.slice(0, ownIndex).reverse()
				: snapshot.slice(ownIndex + 1);
			const stop = side.find((entry: HeaderControlSnapshotEntry) => entry.enabled);

			return stop === undefined ? null : context.getHeaderControlElement(stop.key);
		},
		returnFocusToOpener(): void
		{
			const opener = this.getFocusContext()?.getHeaderControlElement(HeaderControlKey.taskCard) ?? null;
			if (!this.holdsFocus() || !this.canTakeFocus(opener))
			{
				return;
			}

			FocusNavigator.focusTarget(opener, { preventScroll: true });
		},
		// Only a promo that holds the focus gives it back: closed by a click outside or by the chat
		// changing, it leaves the focus with whoever holds it.
		holdsFocus(): boolean
		{
			const activeElement = FocusNavigator.getActiveElement();

			return activeElement !== null && this.promoSurface?.contains(activeElement) === true;
		},
		canTakeFocus(element: HTMLElement | null): boolean
		{
			if (element === null || !element.isConnected)
			{
				return false;
			}

			return InteractivityChecker.isFocusable(element) && !InteractivityChecker.isDisabled(element);
		},
		getFocusContext(): ChatDetailFocusContext | null
		{
			return this.chatDetailFocusContext;
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<MessengerPopup
			:config="popupConfig"
			:id="PopupType.taskSideCardPromo"
			@close="onPopupClose"
		>
			<div class="bx-im-task-card-promo-popup__image"></div>
			<div :id="TASK_CARD_PROMO_DESCRIPTION_ID" class="bx-im-task-card-promo-popup__info">
				<div class="bx-im-task-card-promo-popup__title">
					{{ loc('IM_CONTENT_TASK_SIDE_CARD_PROMO_TITLE') }}
				</div>
				<div class="bx-im-task-card-promo-popup__text">
					{{ loc('IM_CONTENT_TASK_SIDE_CARD_PROMO_TEXT') }}
				</div>
			</div>
		</MessengerPopup>
	`,
};
