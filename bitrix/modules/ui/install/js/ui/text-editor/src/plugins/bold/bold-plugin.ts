import { Outline } from 'ui.icon-set.api.core';

import { TextFormatPlugin, type TextFormatConfig } from '../text-format-plugin';

export class BoldPlugin extends TextFormatPlugin
{
	static getFormatConfig(): TextFormatConfig
	{
		return {
			name: 'Bold',
			format: 'bold',
			icon: Outline.BOLD,
			tooltipMessage: 'TEXT_EDITOR_BTN_BOLD',
			keystroke: { mac: '⌘B', other: 'Ctrl+B' },
			// color, background and size carry no format of their own in this editor: the text
			// inside them is imported bold, which is how the legacy editor rendered them
			importTags: ['b', 'color', 'background', 'size'],
			exportTag: 'b',
		};
	}
}
