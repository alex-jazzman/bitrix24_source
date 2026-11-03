import { Outline } from 'ui.icon-set.api.core';

import { TextFormatPlugin, type TextFormatConfig } from '../text-format-plugin';

export class ItalicPlugin extends TextFormatPlugin
{
	static getFormatConfig(): TextFormatConfig
	{
		return {
			name: 'Italic',
			format: 'italic',
			icon: Outline.ITALIC,
			tooltipMessage: 'TEXT_EDITOR_BTN_ITALIC',
			keystroke: { mac: '⌘I', other: 'Ctrl+I' },
			importTags: ['i'],
			exportTag: 'i',
		};
	}
}
