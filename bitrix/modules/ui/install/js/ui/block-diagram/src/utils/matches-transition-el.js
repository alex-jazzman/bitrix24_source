// Чистая проверка: соответствует ли DOM-элемент завершившегося перехода текущему
// элементу очереди. Точное сопоставление по data-id (MoveableBlock и Connection
// кладут его на корень своего элемента). Вынесено из *-queue-transition, чтобы
// логику можно было покрыть unit-тестами без Vue и DOM.
//
// Правила:
//  - item отсутствует → false (переход относится к уже завершённой очереди);
//  - у элемента нет data-id → true (грубая деградация к тип-фильтру и резервному
//    таймеру контроллера, сохраняем прежнее поведение);
//  - иначе сравниваем строковые представления data-id и item.id.
export function matchesTransitionEl(el: ?HTMLElement, item: ?{ id: string | number }): boolean
{
	if (!item)
	{
		return false;
	}

	const elId = el?.getAttribute?.('data-id');
	if (elId === null || elId === undefined)
	{
		return true;
	}

	return String(elId) === String(item.id);
}
