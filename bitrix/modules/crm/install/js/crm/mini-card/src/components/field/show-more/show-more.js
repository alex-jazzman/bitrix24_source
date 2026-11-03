import { type BitrixVueComponentProps } from 'ui.vue3';

import './show-more.css';

export const ShowMore: BitrixVueComponentProps = {
	name: 'ShowMore',

	props: {
		count: {
			type: Number,
			required: true,
		},
		href: {
			type: String,
			default: '',
		},
		hasPopup: {
			/** @type {'menu'|'dialog'|'listbox'|'tree'|'grid'|'true'|''} */
			type: String,
			default: '',
		},
		expanded: {
			type: Boolean,
			default: false,
		},
	},

	computed: {
		showMoreTitle(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_MINI_CARD_SHOW_MORE', {
				'#COUNT#': this.count,
			});
		},
		isLink(): boolean
		{
			return this.href !== '';
		},
		popupType(): ?string
		{
			// A link navigates instead of revealing content, so it is never a disclosure.
			if (this.isLink || this.hasPopup === '')
			{
				return null;
			}

			return this.hasPopup;
		},
		ariaExpanded(): ?string
		{
			return this.popupType === null ? null : String(this.expanded);
		},
	},

	// Interactive element: a real link when it navigates, a real button when it
	// triggers an action (e.g. the "show more" menu). Both are natively
	// keyboard-operable and take the visible text as their accessible name.
	// Single root node so attribute fallthrough (e.g. @click) keeps working.
	// When the button reveals a popup, it also carries the popup type and its
	// open/closed state, which the owner component keeps in sync.
	template: `
		<component
			:is="isLink ? 'a' : 'button'"
			class="crm-mini-card__show-more"
			:href="isLink ? href : null"
			:type="isLink ? null : 'button'"
			:aria-haspopup="popupType"
			:aria-expanded="ariaExpanded"
		>{{ showMoreTitle }}</component>
	`,
};
