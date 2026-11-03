import { Loc } from 'main.core';
import { type BBCodeNode } from 'ui.bbcode.model';
import {
	COMMAND_PRIORITY_NORMAL,
	FORMAT_TEXT_COMMAND,
	isExactShortcutMatch,
	KEY_DOWN_COMMAND,
	type TextFormatType,
	type TextNode,
} from 'ui.lexical.core';

import {
	convertTextFormatElement,
	wrapNodeWith,
	type BBCodeConversion,
	type BBCodeExportConversion,
	type BBCodeImportConversion,
} from '../bbcode';
import { getKeystrokeCaption, hasCommandModifier, type PlatformKeystroke } from '../helpers/platform-shortcut';
import { type TextEditor } from '../text-editor';
import { Button } from '../toolbar/button';
import { BasePlugin } from './base-plugin';

export type TextFormatConfig = {
	/** the plugin name, as `plugins` and `removePlugins` spell it */
	name: string,
	/** the Lexical format, which is also the toolbar item name and the export type suffix */
	format: TextFormatType,
	icon: string,
	tooltipMessage: string,
	keystroke: PlatformKeystroke,
	/** BBCode tags this format claims on import */
	importTags: string[],
	/** the tag it writes on export */
	exportTag: string,
	/**
	 * A shortcut of its own, on top of what Lexical handles natively.
	 *
	 * Bold, italic and underline come from the browser and from Lexical for free; strikethrough
	 * has none, so it registers Ctrl/Cmd+Shift+X itself.
	 */
	shortcut?: { key: string, shiftKey: boolean },
};

/**
 * A character format driven by FORMAT_TEXT_COMMAND: bold, italic, underline, strikethrough.
 *
 * The four were four copies of one file, differing in the format string, the icon, the
 * localization key and the BBCode tags. Each subclass now says only that, in getFormatConfig().
 */
export class TextFormatPlugin extends BasePlugin
{
	constructor(editor: TextEditor)
	{
		super(editor);

		this.#registerComponents();
		this.#registerShortcut();
	}

	static getFormatConfig(): TextFormatConfig
	{
		throw new Error('getFormatConfig must be implemented in a child class');
	}

	static getName(): string
	{
		return this.getFormatConfig().name;
	}

	getFormatConfig(): TextFormatConfig
	{
		return (this.constructor as typeof TextFormatPlugin).getFormatConfig();
	}

	importBBCode(): BBCodeImportConversion
	{
		const conversion = (): BBCodeConversion => ({
			conversion: convertTextFormatElement,
			priority: 0,
		});

		return Object.fromEntries(
			this.getFormatConfig().importTags.map((tag: string) => [tag, conversion]),
		);
	}

	exportBBCode(): BBCodeExportConversion
	{
		const { format, exportTag } = this.getFormatConfig();

		return {
			[`text:${format}`]: (lexicalNode: TextNode, node: BBCodeNode): BBCodeNode | null => {
				if (lexicalNode.hasFormat(format))
				{
					return wrapNodeWith(node, exportTag, this.getEditor());
				}

				return null;
			},
		};
	}

	#registerComponents(): void
	{
		const { format, icon, tooltipMessage, keystroke } = this.getFormatConfig();

		this.getEditor()
			.getComponentRegistry()
			.register(format, (): Button => {
				const button: Button = new Button();
				button.setIcon(icon);
				button.setFormat(format);
				button.disableInsideUnformatted();
				button.setTooltip(Loc.getMessage(tooltipMessage, {
					'#keystroke#': getKeystrokeCaption(keystroke),
				}) as string);
				button.subscribe('onClick', (): void => {
					this.getEditor().focus();
					this.getEditor().update((): void => {
						this.getEditor().dispatchCommand(FORMAT_TEXT_COMMAND, format);
					});
				});

				return button;
			});
	}

	#registerShortcut(): void
	{
		const { format, shortcut } = this.getFormatConfig();
		if (shortcut === undefined)
		{
			return;
		}

		this.cleanUpRegister(
			this.getEditor().registerCommand(
				KEY_DOWN_COMMAND,
				(event: KeyboardEvent) => {
					// every shortcut here carries Ctrl or Cmd, so plain typing skips the matchers
					if (!hasCommandModifier(event))
					{
						return false;
					}

					if (
						isExactShortcutMatch(event, shortcut.key, { ctrlKey: true, shiftKey: shortcut.shiftKey })
						|| isExactShortcutMatch(event, shortcut.key, { metaKey: true, shiftKey: shortcut.shiftKey })
					)
					{
						event.preventDefault();
						this.getEditor().dispatchCommand(FORMAT_TEXT_COMMAND, format);

						return true;
					}

					return false;
				},
				COMMAND_PRIORITY_NORMAL,
			),
		);
	}
}
