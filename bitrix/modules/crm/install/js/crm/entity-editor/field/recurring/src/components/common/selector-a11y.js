let uid = 0;

/**
 * The lists of this field are plain divs with the click on an inner one: no tabindex, no role,
 * no focusable child, so they were unreachable from the keyboard (2.1.1, #255182). They are
 * declared buttons the same way the editor's own list field is.
 *
 * The name is assembled by aria-labelledby out of the already translated FieldTitle and the
 * control's own text, rather than a phrase per selector: "#TITLE#: #VALUE#" over two translatable
 * phrases is what rule 2 of the localization checklist forbids.
 *
 * Selectors are addressed by name because one component can own several (DateFields has two).
 */
export const selectorA11yMixin = {
	data(): Object
	{
		uid++;

		return {
			a11yUid: uid,
			expandedSelectors: {},
		};
	},

	methods: {
		a11yId(name: string): string
		{
			return `crm-recurring-${name}-${this.a11yUid}`;
		},

		selectorLabelledBy(name: string): string
		{
			return `${this.a11yId(`${name}-title`)} ${this.a11yId(`${name}-value`)}`;
		},

		isSelectorExpanded(name: string): string
		{
			return this.expandedSelectors[name] ? 'true' : 'false';
		},

		markSelectorOpened(name: string): void
		{
			this.expandedSelectors[name] = true;
		},

		/*
			The menu also closes on a click past it, which the opening handler never learns about,
			so the flag is driven by the popup's own close event — otherwise aria-expanded would
			stay true after the first dismissal.
		*/
		markSelectorClosed(name: string): void
		{
			this.expandedSelectors[name] = false;
		},
	},
};
