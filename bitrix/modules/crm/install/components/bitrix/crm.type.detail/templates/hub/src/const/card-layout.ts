import { type CardsSectionLayout, type FeatureCardLayout } from './cards-section';
import { DAYS_RECORD_ID } from './main-layout';

// "Карточка процесса" of the recomposed tree: what an item's card carries. Five rows today —
// sp-card-view is availableFromStep: 2 and is not on screen at all until SUPPLY_STEP rises.
//
// Order (PM, 2026-09-29): what the item is about comes first — where it came from, whose it is, what
// is overdue on it — and the deadline setting closes the list: Источник, Клиент, Счётчики,
// Наблюдатели, Сроки. The days field travels with the Сроки tile by record id, not by position.
//
// Сроки, Наблюдатели and Источник keep their icons and copy from the old "Основное" (no `description`
// here on purpose — the descriptor's own UXGEN copy wins, D-17). "Счётчики" arrives from
// "Возможности" with the copy written for it there.
export const CARD_SECTION_CARDS: FeatureCardLayout[] = [
	{
		recordId: 'sp-source',
		icon: 'o-cloud-time',
	},
	{
		// Приехал из «Связей» (?-04): тумблер включает поле «Клиент» в карточке элемента.
		// У Сроков, Наблюдателей и Источника описание пишет дескриптор (D-17), а у sp-client
		// в дескрипторе его нет — строка стояла пустой. Поэтому описание задано здесь: раскладка
		// главнее записи.
		recordId: 'sp-client',
		icon: 'o-person',
		description: 'CRM_TYPE_DETAIL_HUB_FEATURE_CLIENT_DESCRIPTION',
	},
	{
		recordId: 'sp-counters',
		icon: 'statistics-arrow',
		title: 'CRM_TYPE_DETAIL_HUB_FEATURE_COUNTERS_TITLE',
		description: 'CRM_TYPE_DETAIL_HUB_FEATURE_COUNTERS_DESCRIPTION',
	},
	{
		recordId: 'sp-observers',
		icon: 'o-observer',
	},
	{
		recordId: 'sp-begin-close-dates',
		icon: 'o-calendar-with-slots',
		title: 'CRM_TYPE_DETAIL_HUB_FEATURE_DATES_TITLE',
	},
];

// 'o-card' verified in ui/install/js/ui/icon-set/api/core/src/sets/outline.ts. It collides with none
// of the four tile glyphs of this section.
export const CARD_SECTION_ICON = 'o-card';

export const CARD_SECTION_LAYOUT: CardsSectionLayout = {
	sectionId: 'card',
	rootClass: 'crm-type-hub-cards-section',
	cardId: 'card-fields',
	title: 'CRM_TYPE_DETAIL_HUB_CARD_CARD_OPTIONS',
	icon: CARD_SECTION_ICON,
	intro: { text: 'CRM_TYPE_DETAIL_HUB_CARD_CARD_OPTIONS_INTRO' },
	cards: CARD_SECTION_CARDS,
	// sp-card-view is NOT listed. The "Вид карточки" block was a mock — one hard-coded preset and two
	// buttons nobody handles — and the PM removed it (2026-09-01): the presets are a feature that does
	// not exist in production, and the record behind them is still availableFromStep: 2. Leaving the
	// record out of this list is what makes the removal safe rather than final: the day SUPPLY_STEP
	// rises, CrmHubControlRenderer draws it as the navigation row the descriptor already describes
	// (D-17), instead of it vanishing.
	layoutRecordIds: [
		...CARD_SECTION_CARDS.map((card) => card.recordId),
		DAYS_RECORD_ID,
	],
};
