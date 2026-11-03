import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { Text2Xs } from 'ui.system.typography.vue';
import { defineComponent } from 'ui.vue3';

import { useLoc } from '../../../../shared/composables';

import './note-marker.css';

const ICON_SIZE = 16;
const MARKER_TEST_ID = 'bizprocdesigner-note-marker';
const COUNT_TEST_ID = 'bizprocdesigner-note-marker-count';

/**
 * The marker of one note on the schema: a control of its own, so the keyboard reaches it in order,
 * sees where it is and opens the thread from it.
 */
export const NoteMarker = defineComponent({
	name: 'BizprocdesignerNoteMarker',
	components: { BIcon, Text2Xs },
	props: {
		note: {
			/** @type TemplateNote */
			type: Object,
			required: true,
		},
		x: {
			type: Number,
			required: true,
		},
		y: {
			type: Number,
			required: true,
		},
		isOpened: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['toggle'],
	setup(): Object
	{
		const { getMessage } = useLoc();

		return {
			getMessage,
			iconName: Outline.MESSAGE,
			iconSize: ICON_SIZE,
		};
	},
	computed: {
		// A translation rather than left/top: the camera moves every marker of the layer at once, and a
		// translated marker costs the layer no reflow.
		markerStyle(): { transform: string }
		{
			return { transform: `translate(${this.x}px, ${this.y}px)` };
		},
		messageCount(): string
		{
			return String(this.note.messageCount);
		},
		// The count belongs to the name as well: read out, the marker has to say how much of a
		// discussion it stands for and not just that it is a note.
		accessibleName(): string
		{
			return this.getMessage('BIZPROCDESIGNER_EDITOR_NOTE_MARKER_ARIA_LABEL', {
				'#COUNT#': this.messageCount,
			});
		},
		markerTestId(): string
		{
			return this.$testId(MARKER_TEST_ID, String(this.note.id));
		},
		// The count is asserted on its own: how much of a discussion a marker stands for is what a
		// reply and a deletion change about it, and the name of the marker holds the same number.
		countTestId(): string
		{
			return this.$testId(COUNT_TEST_ID, String(this.note.id));
		},
	},
	methods: {
		handleClick(): void
		{
			this.$emit('toggle');
		},
	},
	template: `
		<button
			type="button"
			class="editor-chart-note-marker"
			:class="{ '--opened': isOpened }"
			:style="markerStyle"
			:aria-label="accessibleName"
			:aria-expanded="isOpened"
			aria-haspopup="dialog"
			:data-testid="markerTestId"
			@click="handleClick"
		>
			<BIcon :name="iconName" :size="iconSize"/>
			<Text2Xs
				class="editor-chart-note-marker__count"
				:data-testid="countTestId"
			>{{ messageCount }}</Text2Xs>
		</button>
	`,
});
