import { Outline } from 'ui.icon-set.api.core';

import { TextFormatPlugin, type TextFormatConfig } from '../text-format-plugin';

export class UnderlinePlugin extends TextFormatPlugin
{
	static getFormatConfig(): TextFormatConfig
	{
		return {
			name: 'Underline',
			format: 'underline',
			icon: Outline.UNDERLINE,
			tooltipMessage: 'TEXT_EDITOR_BTN_UNDERLINE',
			keystroke: { mac: '⌘U', other: 'Ctrl+U' },
			importTags: ['u'],
			exportTag: 'u',
		};
	}
}
