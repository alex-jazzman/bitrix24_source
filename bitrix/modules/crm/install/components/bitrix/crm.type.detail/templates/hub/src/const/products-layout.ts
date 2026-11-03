import { type CardsSectionLayout, type FeatureCardLayout } from './cards-section';
import { DOCUMENT_TEMPLATES_ACTION, REQUISITES_ACTION } from './action-keys';

// Header icon of the section card. 'o-invoice' verified in the Outline set: the section is about
// sums, requisites and printed documents (contracts, acts, invoices), so it reads wider than the
// 'o-box' of the "Товары и суммы" card inside it.
export const PRODUCTS_CARD_ICON = 'o-invoice';

// Three feature cards in the two-column grid. title/description are the short card copy, overriding
// the descriptor's own full-sentence production strings (see FeatureCardLayout.description).
//
// The prototype names ('box', 'file', 'company') are missing the 'o-' prefix the Outline set
// actually uses: 'o-box', 'o-file' and 'o-company' all exist verbatim once prefixed, so no glyph
// substitution was needed here.
export const PRODUCTS_FEATURE_CARDS: FeatureCardLayout[] = [
	{
		recordId: 'sp-link-with-products',
		icon: 'o-box',
		title: 'CRM_TYPE_DETAIL_HUB_FEATURE_LINK_WITH_PRODUCTS_TITLE',
		description: 'CRM_TYPE_DETAIL_HUB_FEATURE_LINK_WITH_PRODUCTS_DESCRIPTION',
	},
	{
		recordId: 'sp-documents',
		icon: 'o-file',
		title: 'CRM_TYPE_DETAIL_HUB_FEATURE_DOCUMENTS_TITLE',
		description: 'CRM_TYPE_DETAIL_HUB_FEATURE_DOCUMENTS_DESCRIPTION',
		action: {
			text: 'CRM_TYPE_DETAIL_HUB_PRODUCTS_TEMPLATES_ACTION',
			actionKey: DOCUMENT_TEMPLATES_ACTION,
			icon: 'go-to-l',
		},
	},
	{
		recordId: 'sp-mycompany',
		icon: 'o-company',
		title: 'CRM_TYPE_DETAIL_HUB_FEATURE_MYCOMPANY_TITLE',
		description: 'CRM_TYPE_DETAIL_HUB_FEATURE_MYCOMPANY_DESCRIPTION',
		action: {
			text: 'CRM_TYPE_DETAIL_HUB_PRODUCTS_REQUISITES_ACTION',
			actionKey: REQUISITES_ACTION,
			icon: 'go-to-l',
		},
	},
];

// The mockup gates "Печать документов" on "Реквизиты компании" and confirms every switch-off;
// production has neither dependency and this layout does not add one — all three toggles are
// independent, with no `disabled` state and no confirm dialogs (deliberate deviation, D-18).
export const PRODUCTS_SECTION_LAYOUT: CardsSectionLayout = {
	sectionId: 'products',
	rootClass: 'crm-type-hub-products',
	cardId: 'products',
	title: 'CRM_TYPE_DETAIL_HUB_PRODUCTS_TITLE',
	icon: PRODUCTS_CARD_ICON,
	intro: { text: 'CRM_TYPE_DETAIL_HUB_PRODUCTS_INTRO' },
	cards: PRODUCTS_FEATURE_CARDS,
	layoutRecordIds: PRODUCTS_FEATURE_CARDS.map((card) => card.recordId),
};
