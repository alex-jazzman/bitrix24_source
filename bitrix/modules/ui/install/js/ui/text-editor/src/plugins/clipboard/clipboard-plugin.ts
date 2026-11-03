import { type LexicalNodeConfig } from 'ui.lexical.core';
import { type TextEditor } from 'ui.text-editor';

import { BasePlugin, type PluginConstructor } from '../base-plugin';
import { ClipboardPlainTableNode } from './clipboard-plain-table-node';

export class ClipboardPlugin extends BasePlugin
{
	static getName(): string
	{
		return 'Clipboard';
	}

	static getNodes(editor: TextEditor): Array<LexicalNodeConfig>
	{
		const nodes = [];

		const tablePluginExists = editor
			.getPlugins()
			.getConstructors()
			.some((plugin: PluginConstructor): boolean => {
				return plugin.getName() === 'Table';
			});

		if (!tablePluginExists)
		{
			nodes.push(ClipboardPlainTableNode);
		}

		return nodes;
	}
}
