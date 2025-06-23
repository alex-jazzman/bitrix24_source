import { Loader } from './loader';

import '../../../../css/content-blocks/internal/copilot/header-text.css';

export default {
	components: {
		Loader,
	},
	props: {
		text: {
			type: String,
			required: true,
		},
		animated: {
			type: Boolean,
			required: false,
			default: false,
		},
	},

	computed: {
		className(): Array
		{
			return [
				'crm-timeline-block-internal-copilot-header',
				{
					'--animated': this.animated,
				},
			];
		},
	},

	template: `
		<div :class="className">
			<div class="crm-timeline-block-internal-copilot-header-icon">
				<Loader v-if="animated"></Loader>
			</div>
			{{ text }}
		</div>
	`,
};
