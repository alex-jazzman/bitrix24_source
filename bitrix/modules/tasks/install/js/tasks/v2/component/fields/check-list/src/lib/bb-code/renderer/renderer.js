import { Text, Type } from 'main.core';
import { BBCodeParser } from 'ui.bbcode.parser';

import { CheckListBbCodeScheme } from '../const';
import { CheckListFormattingTag } from '../formatting/formatting-tag';
import { CheckListSelection } from '../selection/selection';
import { CheckListUrl } from '../link/url';

const HtmlTagByBbCodeTag = Object.freeze({
	b: 'b',
	i: 'i',
	u: 'u',
	s: 's',
});

const CheckListBbCodeParser = new BBCodeParser({
	scheme: CheckListBbCodeScheme,
	linkify: true,
	normalize: false,
});

export class CheckListBbCodeRenderer
{
	static formatHtml(source: string, linkColor: string = ''): string
	{
		const normalizedSource = CheckListSelection.normalizeSource(source);

		if (this.hasMalformedFormattingTags(normalizedSource))
		{
			return this.formatMalformedSource(normalizedSource);
		}

		return this.renderNodeToHtml(CheckListBbCodeParser.parse(normalizedSource), linkColor);
	}

	static hasMalformedFormattingTags(source: string): boolean
	{
		const openedTags = [];

		const formattingTagRegExp = CheckListFormattingTag.createRegExp();
		let match = formattingTagRegExp.exec(source);
		while (match)
		{
			const tagName = match[2].toUpperCase();
			if (match[1] === '/')
			{
				if (openedTags.pop() !== tagName)
				{
					return true;
				}
			}
			else
			{
				openedTags.push(tagName);
			}

			match = formattingTagRegExp.exec(source);
		}

		return openedTags.length > 0;
	}

	static formatMalformedSource(source: string): string
	{
		return Text.encode(
			source.replace(
				CheckListFormattingTag.createRegExp(),
				(tag: string, closing: string, tagName: string) => {
					return tag.replace(`${closing}${tagName}`, `${closing}${tagName.toLowerCase()}`);
				},
			),
		);
	}

	static renderChildrenToHtml(node: Object, linkColor: string = ''): string
	{
		return node.getChildren()
			.map((child) => this.renderNodeToHtml(child, linkColor))
			.join('')
		;
	}

	static renderUrlNodeToHtml(node: Object, linkColor: string = ''): string
	{
		const sourceUrl = Type.isStringFilled(node.getValue()) ? node.getValue() : node.toPlainText();
		const safeUrl = CheckListUrl.sanitize(sourceUrl);

		if (!safeUrl)
		{
			return Text.encode(node.toString({ encode: false }));
		}

		const content = this.renderChildrenToHtml(node, linkColor);
		const href = Text.encode(safeUrl);
		const style = Type.isStringFilled(linkColor) ? ` style="color: ${Text.encode(linkColor)};"` : '';

		return [
			`<a class="tasks-check-list-formatting-layer-link" href="${href}"${style}`,
			'target="_blank" rel="noopener noreferrer"',
			`data-testid="tasks-check-list-formatting-link">${content}</a>`,
		].join(' ');
	}

	static renderNodeToHtml(node: Object, linkColor: string = ''): string
	{
		const name = node.getName();
		if (name === '#root' || name === '#fragment')
		{
			return this.renderChildrenToHtml(node, linkColor);
		}

		if (name === '#text' || name === '#linebreak')
		{
			return Text.encode(node.toPlainText());
		}

		const htmlTag = HtmlTagByBbCodeTag[name];
		if (htmlTag)
		{
			return `<${htmlTag}>${this.renderChildrenToHtml(node, linkColor)}</${htmlTag}>`;
		}

		if (name === 'url')
		{
			return this.renderUrlNodeToHtml(node, linkColor);
		}

		return Text.encode(node.toString({ encode: false }));
	}
}
