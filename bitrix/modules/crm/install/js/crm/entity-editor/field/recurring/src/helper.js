import { DatetimeConverter } from 'crm.timeline.tools';
import { DateTimeFormat } from 'main.date';
import { PopupMenu } from 'main.popup';
import { DatePicker } from 'ui.date-picker';

export function showPopupMenu(id: string, target: HTMLElement, menu: Array): void
{
	PopupMenu.show(
		id,
		target,
		menu,
		{
			angle: false,
			width: target.offsetWidth + 'px',
		},
	);

	PopupMenu.currentItem.popupWindow.setWidth(BX.pos(target).width);
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
