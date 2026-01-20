import { Extension, Type } from 'main.core';

import './style.css';

// @vue/component
export const AiAssistantWidget = {
	name: 'AiAssistantWidget',
	emits: ['ready'],
	mounted(): void
	{
		this.tryInitWidget();
	},
	methods: {
		getSettings(): SettingsType | null
		{
			return Extension.getSettings('bizprocdesigner.editor.components.ai-assistant-widget') ?? null;
		},
		getParams(): Object | null
		{
			const settings = this.getSettings().params;
			if (!Type.isPlainObject(settings))
			{
				return null;
			}

			return {
				target: this.$refs.container,
				currentUrl: settings.currentUrl,
				botAvatarUrl: settings.botAvatarUrl,
				botId: settings.botId,
				params: settings.params ?? {},
				moduleName: settings.moduleName,
			};
		},
		tryInitWidget(): void
		{
			const params = this.getParams();
			if (!params)
			{
				return;
			}

			if (!BX?.AiAssistant?.Marta)
			{
				return;
			}

			this.instance = new BX.AiAssistant.Marta(params);
			this.instance.init();

			this.$emit('ready');
		},
	},

	template: `
		<div 
			class="bizprocdesigner-editor-ai-assistant-widget"
			ref="container"
		></div>
	`,
};

type SettingsType = {
	botId: string,
	botAvatarUrl: string,
	hint: string,
	currentUrl: string,
	moduleName: string,
};
