import { DatetimeConverter } from 'crm.timeline.tools';
import { DateTimeFormat } from 'main.date';
import { PopupMenu } from 'main.popup';
import { DatePicker } from 'ui.date-picker';

export function showPopupMenu(id: string, target: HTMLElement, menu: Array, onClose: ?Function = null, event: ?Event = null): void
{
	/*
		MenuManager.create() hands back an already created menu untouched, so focusTrap never
		reaches it on the second and later calls. The gear avoids this by destroying its menu on
		close; here it lives until beforeUnmount, so "open with the mouse, close, open from the
		keyboard" would reuse a menu built without a trap: focus stays on the selector and the
		arrows never walk the items. Only a closed menu is dropped - destroy() emits onDestroy,
		not onClose, and would swallow the handler that puts aria-expanded back to false.
	*/
	const existingMenu = PopupMenu.getMenuById(id);
	if (existingMenu && !existingMenu.getPopupWindow().isShown())
	{
		destroyPopupMenu(id);
	}

	/*
		Opening from the keyboard would throw the card to the top: MenuNavigation focuses the
		first item on the menu's own onShow, before the popup has been positioned - measured,
		the item still sits at document 0,0 at that moment - and MenuItem.focus() passes
		preventScroll: false, so the browser scrolls that far-away item into view while the menu
		stays anchored to its button, off screen. The jump is synchronous inside show() and the
		popup is positioned in document coordinates, so putting the scroll back the moment show()
		returns leaves the menu exactly where it belongs. The cause itself is in main.popup
		(menu-navigation.ts, menu-item.ts) and is out of this ticket's reach.
	*/
	const scroller = document.scrollingElement;
	const scrollTop = scroller ? scroller.scrollTop : 0;

	PopupMenu.show(
		id,
		target,
		menu,
		{
			angle: false,
			width: target.offsetWidth + 'px',
			/*
				Without a focus trap the menu opens with focus left behind on the selector:
				MenuNavigation moves focus onto the first item only while Menu.getFocusTrap()
				is not null, items keep tabindex="-1", and the arrow keys scroll the card
				instead of walking the menu. The portal-wide ui.a11y "useFocusTrapInDialogs"
				switch is on for dev clones and off for client portals, so it is passed here
				explicitly - with the very value Menu itself uses when that switch is on.

				Only for keyboard activation: passing an object bypasses the whole of
				Popup.shouldUseFocusTrapByDefault(), including its exception for text inputs,
				so on the mouse path the decision is left to the popup itself.
			*/
			...(event?.type === 'keydown' ? { focusTrap: { initialFocus: 'container' } } : {}),
		},
	);

	if (scroller)
	{
		scroller.scrollTop = scrollTop;
	}

	const popup = PopupMenu.currentItem.popupWindow;
	popup.setWidth(BX.pos(target).width);

	/*
		Re-armed on every open rather than bound once at creation: PopupMenu.show reuses an already
		created menu, so params passed on the second and later calls never reach it.

		The event is 'onClose', not the legacy 'onPopupClose': the latter is emitted through
		BX.onCustomEvent only, and subscribe() never sees it — measured on the stand, the listener
		stayed silent and aria-expanded kept saying true after the menu had closed.
	*/
	if (onClose)
	{
		popup.subscribeOnce('onClose', onClose);
	}
}

export function destroyPopupMenu(id: string): void
{
	PopupMenu.destroy(id);
}

export function createDatePickerInstance(date: Number, callback: Function): DatePicker
{
	return new DatePicker({
		selectedDates: [new Date(date)],
		events: {
			onSelectChange: (event) => {
				callback(event);
			},
		},
	});
}

export function getFormattedDate(date: Number): string
{
	return DateTimeFormat.format(DatetimeConverter.getSiteDateFormat(), date);
}

export function resolveEntityTypeName(entityTypeId: number): string
{
	if (BX.CrmEntityType.isDynamicTypeByTypeId(entityTypeId))
	{
		return 'DYNAMIC';
	}

	return (
		entityTypeId === BX.CrmEntityType.enumeration.dealrecurring
			? BX.CrmEntityType.names.deal
			: BX.CrmEntityType.resolveName(entityTypeId)
	);
}
