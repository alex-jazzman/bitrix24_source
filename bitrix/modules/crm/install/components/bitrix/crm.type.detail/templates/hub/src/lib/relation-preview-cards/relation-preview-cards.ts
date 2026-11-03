import { RELATION_GROUP_KEY } from '../../const/relations-layout';
import { groupRelationOptions } from '../relation-option-groups/relation-option-groups';
import { type RelationOption } from '../relation-rows/relation-rows';

// Карточка миниатюры: одна из двух сторон связи, показанная так, как её увидят в CRM (D-63).
export type RelationPreviewCardKey = 'process' | 'entity';

export type RelationPreviewCard = {
	key: RelationPreviewCardKey;
	// Место в теле карточки. null — сущность не бывает в этой роли (D-58), и тогда места нет вовсе:
	// на его месте рисуется обычный скелетон, а не погашенная опция. Не предлагать невозможного —
	// решение D-63.
	field: RelationOption | null;
	// Место в ряду табов карточки, с той же оговоркой про null.
	tab: RelationOption | null;
};

const CARD_KEY_BY_GROUP: Record<string, RelationPreviewCardKey> = Object.freeze({
	[RELATION_GROUP_KEY.Process]: 'process',
	[RELATION_GROUP_KEY.Entity]: 'entity',
});

// Порядок карточек ЗАДАН здесь, а не взят из опций: табы всегда читаются «процесс, потом сущность
// CRM», а groupRelationOptions сохраняет порядок первого появления — у контакта первой приходит
// опция карточки CRM (child-field), и его табы встали бы наоборот.
const CARD_ORDER: RelationPreviewCardKey[] = ['process', 'entity'];

// Раскладывает опции строки по двум карточкам и двум местам внутри каждой.
//
// Ничего нового про связь не придумывает: карточку называет та же группировка, что раньше рисовала
// заголовки («В лиде» / «В „Заявки на закупку 24“»), а место внутри карточки — собственный kind
// опции: field живёт в теле, children-list — в ряду табов. Четыре опции ложатся на две карточки без
// остатка, и это же проверка семантики RELATION_OPTION_GROUP.
export function buildRelationPreviewCards(options: RelationOption[]): RelationPreviewCard[]
{
	const cards: RelationPreviewCard[] = CARD_ORDER.map(
		(key) => ({ key, field: null, tab: null }),
	);

	groupRelationOptions(options).forEach((group) => {
		const card = cards.find((item) => item.key === CARD_KEY_BY_GROUP[group.key]);
		if (!card)
		{
			return;
		}

		group.options.forEach((option) => {
			// Первая опция на место, а не последняя: на строку каталог отдаёт по одной опции каждого
			// вида, и второй здесь взяться неоткуда — но строка «Клиент» когда-то складывала под одну
			// группу контакт и компанию, и молча затирать одно место другим не стоит.
			if (option.kind === 'field')
			{
				card.field ??= option;
			}
			else
			{
				card.tab ??= option;
			}
		});
	});

	return cards;
}
