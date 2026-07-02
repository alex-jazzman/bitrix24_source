import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { lowlight, DEFAULT_LANGUAGE } from '../lowlight-languages';
import { CodeBlockNodeView } from './node-view';

export const CodeBlock = CodeBlockLowlight.extend({
	addNodeView()
	{
		return ({ node, editor, getPos }) => new CodeBlockNodeView({ node, editor, getPos });
	},
}).configure({
	lowlight,
	defaultLanguage: DEFAULT_LANGUAGE,
	enableTabIndentation: true,
	tabSize: 4,
});
