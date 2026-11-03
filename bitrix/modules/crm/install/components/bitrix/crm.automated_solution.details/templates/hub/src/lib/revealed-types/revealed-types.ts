// Набор строк раздела «Смарт-процессы»: какие СП показаны на экране. Стор этого не знает —
// выключенная строка это тип, которого в automatedSolution.typeIds уже нет. Порядок набора и есть
// порядок строк на экране: засев идёт в порядке typeIds, выбранное в пикере дописывается в хвост,
// а выключение тумблера набор не трогает вовсе — строка остаётся на месте (эталон relations-sp).
export function seedRevealedTypeIds(typeIds: Array<number | string>): number[]
{
	const seen = new Set<number>();
	const result: number[] = [];

	(typeIds ?? []).forEach((rawId) => {
		const typeId = Number(rawId);
		if (Number.isInteger(typeId) && typeId > 0 && !seen.has(typeId))
		{
			seen.add(typeId);
			result.push(typeId);
		}
	});

	return result;
}

export function withRevealedTypeId(ids: number[], typeId: number): number[]
{
	return ids.includes(typeId) ? ids : [...ids, typeId];
}
