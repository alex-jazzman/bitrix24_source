import { Type } from 'main.core';
import { BBCodeEncoder } from 'ui.bbcode.encoder';
import { BBCodeNode, BBCodeScheme } from 'ui.bbcode.model';
import { BBCodeParser } from 'ui.bbcode.parser';

import { CheckListBbCodeScheme, createCheckListBbCodeTagSchemes } from '../const';
import { CheckListUrl } from '../link/url';

const encoder = new BBCodeEncoder();

const EditorExportScheme = new BBCodeScheme({
	tagSchemes: createCheckListBbCodeTagSchemes({ paragraph: true }),
	outputTagCase: BBCodeScheme.Case.LOWER,
});

const createUnknownTagHandler = (node, scheme): void => {
	if (node.getType() !== BBCodeNode.ELEMENT_NODE)
	{
		return;
	}

	const content = node.getChildren()
		.map((child) => child.toString({ encode: false }))
		.join('')
	;
	const closingTag = node.isVoid() ? '' : node.getClosingTag();
	const literal = `${node.getOpeningTag()}${content}${closingTag}`;

	node.replace(scheme.createText(literal));
};

const sourceParser = new BBCodeParser({
	scheme: CheckListBbCodeScheme,
	encoder,
	linkify: false,
	normalize: false,
	onUnknown: createUnknownTagHandler,
});

const editorExportParser = new BBCodeParser({
	scheme: EditorExportScheme,
	encoder,
	linkify: false,
	normalize: false,
	onUnknown: createUnknownTagHandler,
});

export class CheckListEditorBbCode
{
	static prepare(source: string, malformed: boolean): { originalSource: string, editorSource: string }
	{
		const originalSource = Type.isString(source) ? source : '';

		return {
			originalSource,
			editorSource: this.prepareSource(originalSource, malformed),
		};
	}

	static serialize(editorSource: string, originalSource: string, dirty: boolean, malformed: boolean): string
	{
		if (dirty !== true)
		{
			return Type.isString(originalSource) ? originalSource : '';
		}

		return this.serializeSource(Type.isString(editorSource) ? editorSource : '', malformed);
	}

	static prepareSource(source: string, malformed: boolean): string
	{
		if (malformed)
		{
			return encoder.encodeText(source);
		}

		const ast = sourceParser.parse(source);
		this.sanitizeUrls(ast);

		return ast.toString();
	}

	static serializeSource(source: string, malformed: boolean): string
	{
		if (malformed)
		{
			return encoder.encodeText(source);
		}

		const ast = editorExportParser.parse(source);
		this.unwrapParagraphs(ast);
		this.sanitizeUrls(ast);

		return ast.toString();
	}

	static unwrapParagraphs(ast): void
	{
		BBCodeNode.flattenAst(ast).forEach((node): void => {
			if (node.getName() === 'p')
			{
				node.replace(...node.getChildren());
			}
		});
	}

	static sanitizeUrls(ast): void
	{
		BBCodeNode.flattenAst(ast).forEach((node): void => {
			if (node.getName() !== 'url')
			{
				return;
			}

			const sourceUrl = Type.isStringFilled(node.getValue()) ? node.getValue() : node.toPlainText();
			const safeUrl = CheckListUrl.sanitize(sourceUrl);
			if (safeUrl)
			{
				node.setValue(safeUrl);

				return;
			}

			const literal = node.toString({ encode: false });
			node.replace(node.getScheme().createText(literal));
		});
	}
}
