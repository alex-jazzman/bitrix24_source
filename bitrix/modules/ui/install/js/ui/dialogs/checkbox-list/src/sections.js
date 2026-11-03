import { Loc } from 'main.core';

export const CheckboxListSections = {
	props: [
		'sections',
	],

	methods: {
		handleClick(key)
		{
			this.$emit('sectionToggled', key);
		},
		getSectionsItemClassName(sectionValue)
		{
			return [
				'ui-checkbox-list__sections-item',
				{ '--checked': sectionValue },
			];
		},
	},

	computed: {
		// See the note in content.js: an empty phrase must not turn into an empty aria-label.
		sectionsLabel(): ?string
		{
			return Loc.getMessage('UI_CHECKBOX_LIST_SECTIONS_LABEL') || null;
		},
	},

	template: `
		<div
			class="ui-checkbox-list__sections"
			role="group"
			:aria-label="sectionsLabel"
		>
			<button
				v-for="section in sections"
				type="button"
				data-testid="ui-checkbox-list-section"
				:key="section.key"
				:title="section.title"
				:class="getSectionsItemClassName(section.value)"
				:aria-pressed="section.value ? 'true' : 'false'"
				@click="handleClick(section.key)"
			>
				<span class="ui-checkbox-list__check-box" aria-hidden="true"></span>
				<span class="ui-checkbox-list__section_title">{{ section.title }}</span>
			</button>
		</div>
	`,
};
