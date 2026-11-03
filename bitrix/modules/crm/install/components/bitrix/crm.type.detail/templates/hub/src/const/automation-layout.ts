import { type CardsSectionLayout, type FeatureCardLayout } from './cards-section';
import { BIZ_PROC_DESIGNER_ACTION } from './action-keys';

// "Автоматизация" of the recomposed tree: everything that acts on an item without a human.
//
// sp-recurring arrives from "Основное", where it sat among the card fields and read as one. It adds
// no field: it makes the process create copies of an item on a schedule, which is a robot. Its copy
// stays in the descriptor (no `description` here), the way the four UXGEN cards of "Основное" have
// it — the record wins, D-17.
export const AUTOMATION_SECTION_CARDS: FeatureCardLayout[] = [
	{
		recordId: 'sp-automation',
		icon: 'o-robot',
		title: 'CRM_TYPE_DETAIL_HUB_FEATURE_AUTOMATION_TITLE',
		description: 'CRM_TYPE_DETAIL_HUB_FEATURE_AUTOMATION_DESCRIPTION',
	},
	{
		recordId: 'sp-biz-proc',
		icon: 'o-business-process',
		title: 'CRM_TYPE_DETAIL_HUB_FEATURE_BIZ_PROC_TITLE',
		description: 'CRM_TYPE_DETAIL_HUB_FEATURE_BIZ_PROC_DESCRIPTION',
		// A row that turns a workspace on offers the way into it once it is on.
		action: {
			text: 'CRM_TYPE_DETAIL_HUB_FEATURES_BIZ_PROC_ACTION',
			actionKey: BIZ_PROC_DESIGNER_ACTION,
			icon: 'go-to-l',
		},
	},
	{
		recordId: 'sp-recurring',
		icon: 'process',
	},
];

// 'o-magic-wand' verified in the Outline set; 'o-robot' is taken by the first tile of this very
// grid, so the card header needs a glyph of its own.
export const AUTOMATION_SECTION_ICON = 'o-magic-wand';

export const AUTOMATION_SECTION_LAYOUT: CardsSectionLayout = {
	sectionId: 'automation',
	rootClass: 'crm-type-hub-cards-section',
	cardId: 'automation',
	title: 'CRM_TYPE_DETAIL_HUB_SECTION_AUTOMATION',
	icon: AUTOMATION_SECTION_ICON,
	intro: { text: 'CRM_TYPE_DETAIL_HUB_CARD_AUTOMATION_INTRO' },
	cards: AUTOMATION_SECTION_CARDS,
	layoutRecordIds: AUTOMATION_SECTION_CARDS.map((card) => card.recordId),
};
