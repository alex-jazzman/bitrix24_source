import { type TypeTitles } from '../type-titles/type-titles';

// Снимок клиентского состояния раздела «Смарт-процессы» — того, чего стор не знает: какие строки
// показаны и как они называются. Привязки в снимок не входят: их полностью восстанавливает
// setState из общего снимка Vuex (см. revert-form).
//
// Прежняя версия снимала распределение тегов по трём TagSelector'ам — селекторов больше нет.
export type TypesControlSnapshot = {
	revealedTypeIds: number[],
	titles: TypeTitles,
};

// Копии, а не ссылки: снимок — базовая линия, и правки после его снятия не должны в него протекать.
export function captureTypesSnapshot(revealedTypeIds: number[], titles: TypeTitles): TypesControlSnapshot
{
	return {
		revealedTypeIds: [...revealedTypeIds],
		titles: { ...titles },
	};
}

// «Отменить» возвращает ЗАХВАЧЕННЫЙ набор строк, а не пересобирает его от восстановленных typeIds:
// на момент снятия базовой линии (монтаж и каждое успешное сохранение) набор строк и есть состояние
// экрана, поэтому восстановление снимка точнее и не теряет строк, выключенных до сохранения.
// Отдаёт копию по той же причине, по какой её делает capture: базовая линия переживает откат
// и должна годиться для следующего.
export function applyTypesSnapshot(snapshot: TypesControlSnapshot | null): TypesControlSnapshot
{
	return {
		revealedTypeIds: [...(snapshot?.revealedTypeIds ?? [])],
		titles: { ...(snapshot?.titles ?? {}) },
	};
}

// The rows of the baseline after a partial save: the rows of the previous baseline plus the types the server has
// bound, with the titles the control knows. Rows picked after that baseline and not stored stay out of it.
export function rebaseTypesSnapshot(
	previous: TypesControlSnapshot | null,
	serverTypeIds: number[],
	knownTitles: TypeTitles,
): TypesControlSnapshot
{
	const rebased = applyTypesSnapshot(previous);

	for (const typeId of serverTypeIds)
	{
		const key = String(typeId);
		if (!rebased.revealedTypeIds.includes(typeId))
		{
			rebased.revealedTypeIds.push(typeId);
		}

		if (!Object.hasOwn(rebased.titles, key) && Object.hasOwn(knownTitles, key))
		{
			rebased.titles[key] = knownTitles[key];
		}
	}

	return rebased;
}
