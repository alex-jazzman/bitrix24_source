import { Text, Type } from 'main.core';

import { Action } from '../../../action';

import 'ui.hint';

export const CopilotLaunchButton = {
	props: {
		title: {
			type: String,
			default: '',
		},
		tooltip: {
			type: String,
			default: '',
		},
		action: Object | null,
	},

	data(): Object
	{
		return {
			hintText: Type.isStringFilled(this.tooltip) ? Text.encode(this.tooltip) : '',
		};
	},

	methods: {
		executeAction(): void
		{
			if (this.action)
			{
				const action = new Action(this.action);

				void action.execute(this);
			}
		},

		showTooltip(): void
		{
			if (this.hintText === '')
			{
				return;
			}

			BX.UI.Hint.show(
				this.$el,
				this.hintText,
				true,
			);
		},

		hideTooltip(): void
		{
			if (this.hintText === '')
			{
				return;
			}

			BX.UI.Hint.hide(this.$el);
		},
	},

	template: `
		<button 
			class="crm-timeline__copilot-launch-button"
			@click="executeAction"
			@mouseover="showTooltip"
			@mouseleave="hideTooltip"
		>
			<div class="crm-timeline__copilot-launch-button-icon"></div>
			{{ title }}
		</button>
	`,
};
