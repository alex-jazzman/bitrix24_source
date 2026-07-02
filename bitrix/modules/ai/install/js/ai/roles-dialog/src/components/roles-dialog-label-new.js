import { Label, LabelColor, LabelSize } from 'ui.label';

import '../css/roles-dialog-label-new.css';

export const RolesDialogLabelNew = {
	props: {
		inverted: {
			type: Boolean,
			required: false,
			default: false,
		},
		useRedesign: {
			type: Boolean,
			required: false,
			default: false,
		},
	},
	computed: {
		labelHTML(): string {
			const labelColor = this.inverted ? LabelColor.COPILOT_LIGHT_REVERSE : LabelColor.COPILOT_LIGHT;

			const label = new Label({
				color: labelColor,
				size: LabelSize.SM,
				text: 'NEW',
				fill: true,
			});

			return label.render().outerHTML;
		},
		className(): Object {
			return {
				'ai__roles-dialog_label-new': true,
				'--inverted': this.inverted,
			};
		},
	},
	template: `
		<div v-if="useRedesign" :class="className">
			<span class="ai__roles-dialog_label-new-text">New</span>
		</div>
		<div v-else ref="label" class="ai__roles-dialog_label" v-html="labelHTML"></div>
	`,
};
