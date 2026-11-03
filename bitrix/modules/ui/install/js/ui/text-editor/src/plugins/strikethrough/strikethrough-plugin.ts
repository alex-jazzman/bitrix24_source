import { Outline } from 'ui.icon-set.api.core';

import { TextFormatPlugin, type TextFormatConfig } from '../text-format-plugin';

export class StrikethroughPlugin extends TextFormatPlugin
{
	static getFormatConfig(): TextFormatConfig
	{
		return {
			name: 'Strikethrough',
			format: 'strikethrough',
			icon: Outline.STRIKETHROUGH,
			tooltipMessage: 'TEXT_EDITOR_BTN_STRIKETHROUGH',
			keystroke: { mac: '⌘⇧X', other: 'Ctrl+Shift+X' },
			importTags: ['s', 'del'],
			exportTag: 's',
			// the only one of the four without a native shortcut
			shortcut: { key: 'x', shiftKey: true },
		};
	}
}
