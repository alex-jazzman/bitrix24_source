import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { safeParseMarkdown } from '../utils/safe-parse-markdown';

const MARKDOWN_PASTE_KEY = new PluginKey('noteMarkdownPaste');

const MD_PATTERN = /^#{1,6}\s+\S|^\*{2}\S|^\*\s+\S|^-\s+\S|^\+\s+\S|^\d+\.\s+\S|^-\s+\[[ Xx]]\s|^```|^>\s|^\|.+\||^:::/m;

function looksLikeMarkdown(text: string): boolean
{
	return MD_PATTERN.test(text.trimStart());
}

export const MarkdownPasteExtension = Extension.create({
	name: 'markdownPaste',

	addProseMirrorPlugins(): any
	{
		const { editor } = this;

		return [
			new Plugin({
				key: MARKDOWN_PASTE_KEY,
				props: {
					handlePaste(view, event): boolean
					{
						const text = event.clipboardData?.getData('text/plain') ?? '';

						if (!text || !looksLikeMarkdown(text))
						{
							return false;
						}

						const { doc } = safeParseMarkdown(editor, text);
						if (!doc.content || doc.content.length === 0)
						{
							return false;
						}

						try
						{
							editor.commands.insertContent(doc.content);
						}
						catch
						{
							return false;
						}

						return true;
					},
				},
			}),
		];
	},
});
