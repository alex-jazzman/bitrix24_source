import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { hint, type HintParams } from 'ui.vue3.directives.hint';

import { useLoc, type GetMessage } from '../../../../shared/composables';

import './style.css';

type OutputUnreachableMarkSetup = {
	getMessage: GetMessage,
	Outline: typeof Outline,
	ICON_COLOR: string,
	ICON_SIZE: number,
};

const ICON_COLOR = 'var(--ui-color-accent-main-warning)';
const ICON_SIZE = 14;

// @vue/component
export const OutputUnreachableMark = {
	name: 'OutputUnreachableMark',
	components: {
		BIcon,
	},
	directives: {
		hint,
	},
	props: {
		portTitle: {
			type: String,
			required: true,
		},
		unreachable: {
			type: Boolean,
			default: false,
		},
	},
	setup(): OutputUnreachableMarkSetup
	{
		const { getMessage } = useLoc();

		return {
			getMessage,
			Outline,
			ICON_COLOR,
			ICON_SIZE,
		};
	},
	computed: {
		hintText(): string
		{
			return this.getMessage('BIZPROCDESIGNER_EDITOR_COMPLEX_NODE_OUTPUT_UNREACHABLE_HINT') ?? '';
		},
		hintOptions(): HintParams
		{
			return {
				text: this.hintText,
				popupOptions: {
					maxWidth: 320,
					offsetTop: 4,
				},
			};
		},
		// The mark precedes the port title in the accessibility tree, so its name has to open with the output.
		labelText(): string
		{
			return this.getMessage(
				'BIZPROCDESIGNER_EDITOR_COMPLEX_NODE_OUTPUT_UNREACHABLE_LABEL',
				{ '#OUTPUT#': this.portTitle },
			) ?? '';
		},
	},
	template: `
		<div
			v-if="unreachable"
			v-hint="hintOptions"
			class="editor-chart-output-unreachable-mark"
			role="img"
			:aria-label="labelText"
			:data-testid="'bizprocdesigner-output-unreachable-mark-' + portTitle"
		>
			<BIcon
				:name="Outline.ALERT_ACCENT"
				:size="ICON_SIZE"
				:color="ICON_COLOR"
			/>
		</div>
	`,
};
