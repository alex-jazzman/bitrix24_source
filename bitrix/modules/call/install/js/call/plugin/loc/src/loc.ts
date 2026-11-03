import { Type } from 'main.core';
import type { App, Plugin } from 'ui.vue3';

export type LocFunction = (messageId: string, replacements?: Record<string, string>) => string;

type LocPluginOptions = {
	getMessage: LocFunction;
	languageId?: string;
};

export const LocPlugin: Plugin<LocPluginOptions> = {
	install(app: App, options: LocPluginOptions): void
	{
		if (!Type.isFunction(options.getMessage))
		{
			throw new TypeError('LocPlugin: options.getMessage must be a function');
		}

		const $loc: LocFunction = (messageId: string, replacements?: Record<string, string>): string => {
			try
			{
				return options.getMessage(messageId, replacements) ?? messageId;
			}
			catch
			{
				return messageId;
			}
		};

		// eslint-disable-next-line no-param-reassign
		app.config.globalProperties.$loc = $loc;
		app.provide('loc', $loc);

		if (Type.isString(options.languageId) && options.languageId !== '')
		{
			app.provide('languageId', options.languageId);
			// eslint-disable-next-line no-param-reassign
			app.config.globalProperties.$languageId = options.languageId;
		}
	},
};
