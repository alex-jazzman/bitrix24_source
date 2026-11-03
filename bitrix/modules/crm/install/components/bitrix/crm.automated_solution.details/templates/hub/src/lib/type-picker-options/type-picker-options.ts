export type PickerPermissions = {
	canMoveSmartProcessFromCrm?: boolean,
	canMoveSmartProcessFromAnotherAutomatedSolution?: boolean,
};

export type PickerEntityOptions = {
	showAutomatedSolutionBadge: boolean,
	isOnlyCrmTypes?: boolean,
	isOnlyExternalTypes?: boolean,
};

// Пикер доступен, если есть хотя бы одно право переноса — иначе кнопка гасится и диалог не строится.
export function isPickerAvailable(permissions: PickerPermissions): boolean
{
	return Boolean(permissions?.canMoveSmartProcessFromCrm)
		|| Boolean(permissions?.canMoveSmartProcessFromAnotherAutomatedSolution);
}

// Опции провайдера dynamic_type для одного диалога вместо двух прежних полей.
// Замер 2026-09-11 на стенде: «без флагов» отдаёт ТОЧНЫЙ union двух прежних каталогов
// (свободные CRM-типы + типы, привязанные к рабочим местам), причём привязанные приезжают
// с бейджем — названием своего рабочего места (showAutomatedSolutionBadge). Заголовков групп
// в ui.entity-selector нет вовсе, поэтому различие несёт бейдж, а не рубрика.
//
// Флаги нельзя просто не передавать всегда: isAvailable() провайдера при обоих выключённых флагах
// требует ОБА права сразу, и пользователь с одним правом получил бы пустой диалог вместо
// сегодняшнего рабочего поля. Поэтому набор опций выбирается по правам.
export function buildPickerEntityOptions(permissions: PickerPermissions): PickerEntityOptions
{
	const canCrm = Boolean(permissions?.canMoveSmartProcessFromCrm);
	const canExternal = Boolean(permissions?.canMoveSmartProcessFromAnotherAutomatedSolution);

	if (canCrm && !canExternal)
	{
		return { showAutomatedSolutionBadge: true, isOnlyCrmTypes: true };
	}

	if (canExternal && !canCrm)
	{
		return { showAutomatedSolutionBadge: true, isOnlyExternalTypes: true };
	}

	return { showAutomatedSolutionBadge: true };
}
