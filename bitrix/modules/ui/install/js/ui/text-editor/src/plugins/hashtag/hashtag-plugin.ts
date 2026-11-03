import { type BBCodeNode } from 'ui.bbcode.model';
import { type LexicalNode, type LexicalNodeConfig, type TextNode } from 'ui.lexical.core';
import { registerLexicalTextEntity } from 'ui.lexical.text';

import { type BBCodeImportConversion, type BBCodeExportConversion, type BBCodeExportOutput } from '../../bbcode';
import { type TextEditor } from '../../text-editor';
import { type SchemeValidationOptions } from '../../types/scheme-validation-options';
import { BasePlugin } from '../base-plugin';
import { HashtagNode, $createHashtagNode } from './hashtag-node';

export class HashtagPlugin extends BasePlugin
{
	constructor(editor: TextEditor)
	{
		super(editor);

		this.#registerListeners();
	}

	static getName(): string
	{
		return 'Hashtag';
	}

	static getNodes(editor: TextEditor): Array<LexicalNodeConfig>
	{
		return [HashtagNode];
	}

	importBBCode(): BBCodeImportConversion | null
	{
		return null;
	}

	exportBBCode(): BBCodeExportConversion
	{
		return {
			hashtag: (lexicalNode: LexicalNode): BBCodeExportOutput => {
				const scheme = this.getEditor().getBBCodeScheme();

				return {
					node: scheme.createText(lexicalNode.getTextContent()) as unknown as BBCodeNode,
				};
			},
		};
	}

	validateScheme(): SchemeValidationOptions | null
	{
		return {
			bbcodeMap: {
				hashtag: '#text',
			},
		};
	}

	#registerListeners(): void
	{
		const createHashtagNode = (textNode: TextNode): HashtagNode => {
			return $createHashtagNode(textNode.getTextContent());
		};

		const getHashtagMatch = (text: string) => {
			const match: RegExpExecArray | null = /(?<=\s+|^)#([^\s,.<>[\]]+)/is.exec(text);
			if (match === null)
			{
				return null;
			}

			const hashtagLength = match[0].length;
			const startOffset = match.index;
			const endOffset = startOffset + hashtagLength;

			return {
				end: endOffset,
				start: startOffset,
			};
		};

		this.cleanUpRegister(
			...registerLexicalTextEntity(this.getLexicalEditor(), getHashtagMatch, HashtagNode, createHashtagNode),
		);
	}
}
