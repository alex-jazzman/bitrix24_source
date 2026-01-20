import { Extension, Type } from 'main.core';

type WidgetParams = {
	currentUrl: string,
	botAvatarUrl: string,
	botId: string,
	params: { url: string } | null,
	moduleName: string
};

export const AiAssistantWidgetSettings = {
	getParams(): WidgetParams | null
	{
		const params = Extension.getSettings('bizprocdesigner.editor.ai-assistant-widget-settings')?.params;
		if (!Type.isPlainObject(params))
		{
			return null;
		}

		return {
			currentUrl: params.currentUrl,
			botAvatarUrl: params.botAvatarUrl,
			botId: params.botId,
			params: params.params ?? {},
			moduleName: params.moduleName,
		};
	},
};
