import { Editor } from '@tiptap/core';
import { editorExtensions } from '../../src/extensions/registry';
import { safeParseMarkdown } from '../../src/utils/safe-parse-markdown';

// Outline exports separate blocks with standalone `\` spacer lines. The parser (marked) treats a
// raw `\` line as an escape and leaks a literal backslash into the text, so normalize() rewrites
// such a line to a blank line — that blank line is what actually separates the blocks. This is
// load-bearing: dropping the strip merges blocks and surfaces literal `\` characters.
describe('safeParseMarkdown — standalone backslash separates blocks', () => {

	const makeEditor = () => {
		const el = document.createElement('div');
		document.body.appendChild(el);

		return new Editor({ element: el, extensions: editorExtensions, content: '' });
	};

	const topTypes = (doc) => (doc?.content || []).map((b) => b.type).join(',');
	const flatText = (node) => {
		let t = node?.type === 'text' ? (node.text || '') : '';
		for (const child of node?.content || [])
		{
			t += flatText(child);
		}

		return t;
	};

	it('promotes an asset to top level when a backslash line precedes it', () => {
		const editor = makeEditor();
		const { doc } = safeParseMarkdown(editor, '* Пункт списка:\n\\\n[[image fileId=18852]]\n');
		// `\` -> blank line -> the image escapes the list item and becomes a sibling block.
		assert(topTypes(doc) === 'bulletList,imageAttachment');
		editor.destroy();
	});

	it('does not leak a literal backslash into block-separated paragraphs', () => {
		const editor = makeEditor();
		const { doc } = safeParseMarkdown(editor, 'Абзац один.\n\\\nАбзац два.\n');
		assert(!flatText(doc).includes('\\'));
		editor.destroy();
	});
});
