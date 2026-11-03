import { AUTOMATION_SECTION_LAYOUT } from './automation-layout';
import { CARD_SECTION_LAYOUT } from './card-layout';
import { type CardsSectionLayout } from './cards-section';
import { PROCESS_SECTION_LAYOUT } from './process-layout';
import { PRODUCTS_SECTION_LAYOUT } from './products-layout';

// Cards-sections of the hub, in menu order. Sections of another shape ("Связи" with its relation
// rows, "Права доступа" with its single button) keep their own components and are not here.
export function resolveCardsLayouts(): CardsSectionLayout[]
{
	return [
		CARD_SECTION_LAYOUT,
		PROCESS_SECTION_LAYOUT,
		AUTOMATION_SECTION_LAYOUT,
		PRODUCTS_SECTION_LAYOUT,
	];
}
