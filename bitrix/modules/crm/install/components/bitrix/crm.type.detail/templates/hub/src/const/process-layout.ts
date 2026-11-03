import { type CardsSectionLayout, type FeatureCardLayout } from './cards-section';
import { CATEGORY_LIST_ACTION, RECYCLE_BIN_ACTION } from './action-keys';

// "Движение процесса" of the recomposed tree: how items move — stages, funnels, the recycle bin, and
// the rule that decides who gets access to a newly created funnel.
//
// Row order is the mockup's, not production's: stages come first there and funnels second, which is
// also the order that reads — stages exist without funnels, a funnel is a set of stages. Production
// draws them the other way round, and so did this layout until the mockup was read.
//
// All four rows carry their own description again. D-28 had handed these two back to the descriptor
// because the mockup shows the production paragraph there; the copy pass of 2026-09-01 reversed that
// (PM). The paragraphs are the only text of the hub written in another voice — "вы сможете" / "у вас
// появится возможность", a full stop at the end — and the short lines they replace had already gone
// through UXGEN (05-final.md) and were sitting unused in the lang file. The inversion of D-18
// ("layout beats record") is the mechanism that makes this a two-line change and keeps descriptor.ts
// untouched.
//
// sp-set-open-permissions is a row here, not a line of a grey block. Two reasons, both from the
// design doc: production draws it and the funnels switch as independent controls, so gating it on
// funnels would be a dependency invented by the mockup (D-18, criterion 5); and its subject is the
// creation of a funnel, not a permission of the process, which is what lets the "Права доступа"
// section stay untouched.
export const PROCESS_SECTION_CARDS: FeatureCardLayout[] = [
	{
		recordId: 'sp-stages',
		icon: 'o-kanban',
		title: 'CRM_TYPE_DETAIL_HUB_FEATURE_STAGES_TITLE',
		description: 'CRM_TYPE_DETAIL_HUB_FEATURE_STAGES_DESCRIPTION',
	},
	{
		recordId: 'sp-categories',
		icon: 'o-change-funnel',
		title: 'CRM_TYPE_DETAIL_HUB_FEATURE_CATEGORIES_TITLE',
		description: 'CRM_TYPE_DETAIL_HUB_FEATURE_CATEGORIES_DESCRIPTION',
		action: {
			text: 'CRM_TYPE_DETAIL_HUB_FEATURES_FUNNELS_EDITOR_TITLE',
			actionKey: CATEGORY_LIST_ACTION,
			icon: 'go-to-l',
		},
	},
	{
		recordId: 'sp-set-open-permissions',
		icon: 'o-three-persons-check',
		title: 'CRM_TYPE_DETAIL_HUB_FEATURE_OPEN_PERMISSIONS_TITLE',
		description: 'CRM_TYPE_DETAIL_HUB_FEATURE_OPEN_PERMISSIONS_DESCRIPTION',
	},
	{
		recordId: 'sp-recyclebin',
		icon: 'o-trashcan',
		title: 'CRM_TYPE_DETAIL_HUB_FEATURE_RECYCLEBIN_TITLE',
		description: 'CRM_TYPE_DETAIL_HUB_FEATURE_RECYCLEBIN_DESCRIPTION',
		action: {
			text: 'CRM_TYPE_DETAIL_HUB_FEATURES_BIN_ACTION',
			actionKey: RECYCLE_BIN_ACTION,
			icon: 'go-to-l',
		},
	},
];

// 'o-busines-process-stages' verified verbatim in the Outline set (the typo is the icon's real
// name). No collision with the four row glyphs of this section.
export const PROCESS_SECTION_ICON = 'o-busines-process-stages';

export const PROCESS_SECTION_LAYOUT: CardsSectionLayout = {
	sectionId: 'process',
	rootClass: 'crm-type-hub-cards-section',
	cardId: 'process',
	title: 'CRM_TYPE_DETAIL_HUB_CARD_PROCESS_MOVEMENT',
	icon: PROCESS_SECTION_ICON,
	intro: { text: 'CRM_TYPE_DETAIL_HUB_CARD_PROCESS_MOVEMENT_INTRO' },
	cards: PROCESS_SECTION_CARDS,
	layoutRecordIds: PROCESS_SECTION_CARDS.map((card) => card.recordId),
};
