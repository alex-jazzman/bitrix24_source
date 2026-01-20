import './style.css';

import { AiAssistantWidgetSettings } from 'bizprocdesigner.editor.ai-assistant-widget-settings';

// @vue/component
export const AiAssistantWidget = {
	name: 'AiAssistantWidget',
	emits: ['connected'],
	mounted(): void
	{
		this.tryInitWidget();
	},
	methods:
	{
		tryInitWidget(): void
		{
			const params = AiAssistantWidgetSettings.getParams();
			if (!params || !BX?.AiAssistant?.Marta)
			{
				return;
			}

			this.instance = new BX.AiAssistant.Marta({ ...params, target: this.$refs.container });
			this.instance.init();
			this.$emit('connected');
		},
	},
	template: `
		<div
			class="bizprocdesigner-editor-ai-assistant-widget"
			ref="container"
		></div>
	`,
};
