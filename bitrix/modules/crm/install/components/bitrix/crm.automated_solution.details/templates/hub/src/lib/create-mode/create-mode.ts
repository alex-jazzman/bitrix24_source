// Предикаты режима создания ЦРМ. Чистые и без кита: шаблон hub — не экстеншн, config.php с rel у
// него нет, поэтому тест-раннер не грузит crm.settings-hub, и импорт рантайм-значения отсюда повалил
// бы весь прогон, а не один тест (D-10, тот же комментарий в src/component/passport.ts:12-16).
// Поэтому всё решаемое живёт здесь и покрывается юнитами, а композиция проверяется живым прогоном.

// Начальное состояние в том виде, в каком его читают при монтировании: либо стор после первого
// setState (id — число или null), либо сырой params.state с сервера (id может прийти строкой).
export type CreateModeState = {
	automatedSolution?: { id?: unknown } | null,
} | null | undefined;

// «На момент монтирования у записи не было положительного id».
//
// Это НЕ предикат от реактивного геттера isNew, а функция от НАЧАЛЬНОГО состояния: вызвать её
// полагается ровно один раз в setup() корневого компонента и защёлкнуть результат в обычную
// неизменяемую константу (ни computed, ни ref). Реактивный признак дал бы два регресса:
// - после сохранения экшен save кладёт в стор новый id (actions.ts:60-62) ещё ДО навигации, которая
//   живёт в setTimeout, — пользователь увидел бы вспышку полностью активного хаба;
// - после удаления экшен delete делает setState({}) (actions.ts:98), id обнуляется, и на экране
//   настройки /details/1/ на закрывающемся слайдере вспыхнул бы режим создания.
// Функция честно вернёт true и на обнулённом после удаления состоянии — защёлку держит вызывающий.
export function isCreateMode(state: CreateModeState): boolean
{
	return !(Number(state?.automatedSolution?.id ?? 0) > 0);
}

// Имя — единственное обязательное поле рабочего места: у AutomatedSolution из настраиваемого есть
// только TITLE и набор привязок. Пробелы именем не считаются — бэк такое примет, а в левом меню
// появится пустая строка.
export function canSubmitCreate(title: unknown): boolean
{
	return String(title ?? '').trim() !== '';
}

// Второй замок кнопки «Создать новый смарт-процесс», независимый от CSS. На форме создания её ветка
// ведёт в то же сохранение (isSaved на создании всегда ложно -> MessageBox.confirm ->
// runInternalSave, types-control.ts:244-253), то есть кнопка молча создаёт рабочее место в обход
// кнопки героя. Гашение разделов делает inert, но там, где inert не поддержан, экран лишь выглядит
// погашённым — поэтому запрет продублирован предикатом. На экране настройки замка нет и не было.
export function isCreateTypeLocked(isCreateMode: boolean): boolean
{
	return isCreateMode;
}

export type SaveFailureState = CreateModeState & {
	recovery?: { status?: unknown, solutionId?: unknown } | null,
};

// The only way out of the latched creation mode, called by the save flow after a failure: the add has created the
// solution and the read-back has accepted its id, so the form edits it from now on. A successful add or delete never
// calls it and keeps the screen until the navigation.
export function shouldLeaveCreateMode(isCreateModeLatched: boolean, state: SaveFailureState): boolean
{
	if (!isCreateModeLatched || isCreateMode(state))
	{
		return false;
	}

	const solutionId = Number(state?.automatedSolution?.id);

	return state?.recovery?.status !== 'idle' && Number(state?.recovery?.solutionId ?? 0) === solutionId;
}

// "Cancel" of the creation screen leaves the screen; of the settings screen it only rolls the form back.
export function shouldCloseOnCancel(isCreateModeLatched: boolean): boolean
{
	return isCreateModeLatched;
}

export type RecoveryControls = {
	isLoading: boolean,
	isFailed: boolean,
	// Save and revert wait for the server baseline; editing and the confirmed close stay available.
	isBaselinePending: boolean,
};

// The read-back of a failed save as the form shows it, apart from the save waiting.
export function resolveRecoveryControls(status: unknown): RecoveryControls
{
	const isLoading = status === 'loading';
	const isFailed = status === 'failed';

	return {
		isLoading,
		isFailed,
		isBaselinePending: isLoading || isFailed,
	};
}

export type HubSaveDeps = {
	isBlocked: () => boolean,
	setWaiting: (waiting: boolean) => void,
	dispatchSave: () => Promise<void>,
	onSuccess: () => void,
	onFailure: () => void,
};

// The panel save: the waiting ends with the save request, a read-back that follows a failure has its own loading.
export function runHubSave(deps: HubSaveDeps): Promise<void>
{
	if (deps.isBlocked())
	{
		return Promise.resolve();
	}

	deps.setWaiting(true);

	return deps.dispatchSave()
		.then(() => deps.onSuccess())
		.catch(() => deps.onFailure())
		.finally(() => deps.setWaiting(false));
}
