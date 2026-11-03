/* eslint-disable @bitrix24/bitrix24-rules/no-native-dom-methods */
import { BBCodeElementNode, BBCodeNode, type BBCodeContentNode, type BBCodeNodeOptions } from 'ui.bbcode.model';
import { type TextEditor } from '../text-editor';

export function wrapNodeWith(node: BBCodeNode, tag: string, editor: TextEditor): BBCodeElementNode
{
	const scheme = editor.getBBCodeScheme();
	// scheme is set by createElement itself
	const elementNode = scheme.createElement({ name: tag } as BBCodeNodeOptions);
	elementNode.appendChild(node as BBCodeContentNode);

	return elementNode;
}
