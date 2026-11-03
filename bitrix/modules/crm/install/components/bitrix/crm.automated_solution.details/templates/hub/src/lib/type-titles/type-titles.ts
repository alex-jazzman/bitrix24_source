export type TypeTitles = { [key: string]: string };

// Названия типов для заголовков строк. Своя карта, а не store.state.dynamicTypesTitles напрямую:
// setState после успешного сохранения приходит без этого ключа и обнуляет его в сторе
// (store/actions.ts -> store/mutations.ts:34). Карта засевается из стора один раз и дополняется
// названиями, приезжающими с выбранным элементом диалога.
export function seedTypeTitles(titles: unknown): TypeTitles
{
	const result: TypeTitles = {};
	if (titles === null || typeof titles !== 'object')
	{
		return result;
	}

	Object.entries(titles as Record<string, unknown>).forEach(([key, value]) => {
		const typeId = Number(key);
		if (Number.isInteger(typeId) && typeId > 0 && typeof value === 'string' && value !== '')
		{
			result[String(typeId)] = value;
		}
	});

	return result;
}

// Пустое название ничего не добавляет: строка с пустым заголовком лучше, чем потерянная строка,
// но затирать уже известное имя пустотой незачем.
export function withTypeTitle(titles: TypeTitles, typeId: number, title: string): TypeTitles
{
	if (title === '')
	{
		return titles;
	}

	return { ...titles, [String(typeId)]: title };
}
