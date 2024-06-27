import { Summary as FacesSummary } from 'bizproc.workflow.faces.summary';
import { Dom } from 'main.core';

export const Summary = {
	name: 'bp-workflow-faces-column-timeline',
	props: {
		workflowId: {
			type: String,
			required: true,
		},
		isFinalState: {
			type: Boolean,
			default: false,
		},
		time: Number,
		showArrow: {
			type: Boolean,
			default: true,
		},
		showContent: {
			type: Boolean,
			default: true,
		},
	},
	mounted()
	{
		this.renderSummary();
	},
	updated()
	{
		this.renderSummary();
	},
	unmounted()
	{
		if (this.$refs.content)
		{
			Dom.clean(this.$refs.content);
		}
	},
	methods: {
		renderSummary()
		{
			if (this.$refs.content)
			{
				Dom.clean(this.$refs.content);
				Dom.append(
					(new FacesSummary({
						workflowId: this.workflowId,
						time: this.time,
						workflowIsCompleted: this.isFinalState,
						showArrow: this.showArrow,
						showContent: this.showContent,
					})).render(),
					this.$refs.content,
				);
			}
		},
	},
	template: `
		<div class="bp-workflow-faces__steps-summary-item" ref="content"></div>
	`,
};
