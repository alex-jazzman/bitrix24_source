import { Loc } from 'main.core';
import { BIcon, Set } from 'ui.icon-set.api.vue';

// Presentational only: owns the collapsed flag and nothing else. The label, the content
// and the decision to render the section at all belong to the host.
export const DocumentSection = {
	name: 'NoteDocumentSection',
	components: {
		BIcon,
	},
	props: {
		label: {
			type: String,
			default: '',
		},
		testId: {
			type: String,
			default: '',
		},
		// Heading level of the label. The outline belongs to the page and the two hosts sit at
		// different depths, so the level is theirs to name; 0 leaves the label a plain span.
		headingLevel: {
			type: Number,
			default: 0,
		},
	},
	emits: ['toggle'],
	data(): Object
	{
		return {
			collapsed: false,
		};
	},
	computed: {
		toggleIcon(): string
		{
			return this.collapsed ? Set.CHEVRON_DOWN : Set.CHEVRON_UP;
		},
		// Derived from the host's id so an e2e locator for the section reads as its own family:
		// note-workspace-about-documents / note-workspace-about-documents-toggle.
		toggleTestId(): ?string
		{
			return this.testId ? `${this.testId}-toggle` : null;
		},
		labelTag(): string
		{
			const level = Math.trunc(this.headingLevel);

			return level >= 1 && level <= 6 ? `h${level}` : 'span';
		},
		// Names the action and stays the same in both states: the state is what aria-expanded
		// carries, and a name that flips with it would be announced twice.
		toggleLabel(): string
		{
			return Loc.getMessage('NOTE_DOCUMENT_LIST_SECTION_TOGGLE_ARIA') || '';
		},
	},
	methods: {
		toggle(): void
		{
			this.collapsed = !this.collapsed;
			this.$emit('toggle', this.collapsed);
		},
	},
	// language=Vue
	template: `
		<div class="note-document-section" :data-testid="testId || null">
			<div class="note-document-section__header" @click="toggle">
				<component :is="labelTag" class="note-document-section__label">{{ label }}</component>
				<button
					class="note-document-section__toggle"
					type="button"
					:data-testid="toggleTestId"
					:aria-label="toggleLabel"
					:aria-expanded="!collapsed"
				>
					<BIcon :name="toggleIcon" :size="16" />
				</button>
			</div>
			<slot v-if="!collapsed"/>
		</div>
	`,
};
