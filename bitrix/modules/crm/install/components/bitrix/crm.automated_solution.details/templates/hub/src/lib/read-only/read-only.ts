import { isPickerAvailable, type PickerPermissions } from '../type-picker-options/type-picker-options';

export type Permissions = PickerPermissions;

export type TypesLocks = {
	rowsLocked: boolean;
	pickerLocked: boolean;
	showCreateButton: boolean;
};

// Замки раздела «Смарт-процессы». Строки гасит только read-only: выключение тумблера — это отвязка,
// а она и сегодня не требует прав переноса (делается из поля привязок, у которого замка по правам
// нет). Пикер гасится, если нет ни одного права переноса, — иначе провайдер отдал бы пустой диалог.
// Pure так, что тестируется без Vue.
export function computeTypesLocks(readOnly: boolean, permissions: Permissions): TypesLocks
{
	return {
		rowsLocked: readOnly,
		pickerLocked: readOnly || !isPickerAvailable(permissions),
		showCreateButton: !readOnly,
	};
}

// The delete button is shown only for an existing solution outside read-only.
export function shouldShowDeleteButton(isNew: boolean, readOnly: boolean): boolean
{
	return !isNew && !readOnly;
}

// Полоса действий закреплена у дна слайдера независимо от состояния формы — как в СП-хабе
// (коммит 46bb928b6b19): в покое в ней «Удалить», после первого изменения — ещё «Сохранить» и
// «Отменить». На создании — нет: там полосы нет в DOM, и `--panel-fixed` нарисовал бы пустую белую
// полосу с бордюром (регресс H6 из T1). В read-only — тоже нет: в полосе нечего показать.
export function isSavePanelFixed(isCreateMode: boolean, readOnly: boolean): boolean
{
	return !isCreateMode && !readOnly;
}

// Паспорт блокируется на время сохранения: запрос уже скопировал название, и правка, внесённая во
// время ожидания, пропала бы при перезагрузке после ответа.
export function isPassportReadOnly(readOnly: boolean, isCreateMode: boolean, isWaiting: boolean): boolean
{
	return readOnly || isWaiting;
}

type PassportReadOnlyTransition = {
	isCreateMode: boolean;
	readOnly: boolean;
	stopEdit: () => void;
	waitForRender: () => Promise<void>;
	focusTitle: () => void;
};

export async function applyPassportReadOnlyTransition(transition: PassportReadOnlyTransition): Promise<void>
{
	if (transition.readOnly)
	{
		transition.stopEdit();

		return;
	}

	if (!transition.isCreateMode)
	{
		return;
	}

	await transition.waitForRender();
	transition.focusTitle();
}

// Режим правки героя закреплён только на создании и не в read-only — иначе открытое название
// осталось бы contenteditable, ведь readOnly кита запрещает лишь открыть редактор.
export function isCreateEditPinned(isCreateMode: boolean, readOnly: boolean): boolean
{
	return isCreateMode && !readOnly;
}
