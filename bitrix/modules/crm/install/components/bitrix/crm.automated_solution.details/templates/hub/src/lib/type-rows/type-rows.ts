import { type TypeTitles } from '../type-titles/type-titles';

export type TypeRow = {
	typeId: number,
	title: string,
	checked: boolean,
};

// Строки раздела: по одной на каждый показанный тип. `checked` — это и есть привязка
// (automatedSolution.typeIds), поэтому выключенный тумблер и отсутствие типа в списке привязок —
// одно и то же состояние. Набор строк живёт отдельно, чтобы выключение оставляло строку на экране.
// Тип без названия в карте строку НЕ теряет — заголовок просто пуст: потерять строку хуже, чем
// показать её без имени (то же правило, что у эталона для иконки и описания).
export function buildTypeRows(
	revealedTypeIds: number[],
	boundTypeIds: Array<number | string>,
	titles: TypeTitles,
): TypeRow[]
{
	const bound = new Set<number>((boundTypeIds ?? []).map((id) => Number(id)));

	return revealedTypeIds.map((typeId) => ({
		typeId,
		title: titles[String(typeId)] ?? '',
		checked: bound.has(typeId),
	}));
}
