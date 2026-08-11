import { Extension, Runtime, Type } from 'main.core';
import { logger } from './service/logger';
import { placeholderService } from './service/placeholder-service';

export function openContactCenter(): Promise<void>
{
	const settings = Extension.getSettings('messageservice.message.editor');

	const url = settings.get('contactCenterUrl');
	if (!Type.isStringFilled(url))
	{
		logger.error('no contact center url in extension settings');

		return Promise.resolve();
	}

	return Runtime.loadExtension('main.sidepanel').then(({ SidePanel }) => {
		return new Promise((resolve) => {
			SidePanel.Instance.open(url, {
				cacheable: false,
				allowChangeHistory: true,
				events: {
					onClose: resolve,
				},
			});
		});
	});
}

export function replaceCustomMessagePlaceholders(
	template: string,
	replacer: (value: string, customData: { [key: string]: string }) => string | null,
): string
{
	return placeholderService.replace(template, replacer);
}
