const CARD_TAB_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'Home', 'End']);

// Следующий таб карточки по клавише роли tablist: стрелки ходят по кругу, Home и End — к краям.
// null — клавиша табы не двигает. Неизвестный текущий ключ читается как позиция -1.
export function nextRelationCardKey<K extends string>(keys: K[], current: K | string, key: string): K | null
{
	if (!CARD_TAB_KEYS.has(key))
	{
		return null;
	}

	const index = keys.indexOf(current as K);
	const shift = key === 'ArrowLeft' ? -1 : 1;
	let next = (index + shift + keys.length) % keys.length;
	if (key === 'Home')
	{
		next = 0;
	}
	else if (key === 'End')
	{
		next = keys.length - 1;
	}

	return keys[next];
}
