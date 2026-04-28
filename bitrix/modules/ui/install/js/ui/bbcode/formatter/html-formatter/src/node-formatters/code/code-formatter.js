import { Dom, Tag, Loc } from 'main.core';
import {
	NodeFormatter,
	type NodeFormatterOptions,
	type BeforeConvertCallbackOptions,
	type ConvertCallbackOptions,
} from 'ui.bbcode.formatter';

import { type BBCodeNode } from 'ui.bbcode.model';
import { CodeParser, type CodeToken } from 'ui.code-parser';
import { normalizeLineBreaks } from '../../helpers/normalize-line-breaks';

export class CodeNodeFormatter extends NodeFormatter
{
	#codeParser: CodeParser = new CodeParser();

	constructor(options: NodeFormatterOptions = {})
	{
		super({
			name: 'code',
			before({ node }: BeforeConvertCallbackOptions): BBCodeNode {
				return normalizeLineBreaks(node);
			},
			convert({ node }: ConvertCallbackOptions): HTMLElement {
				const content = node.getTextContent();

				const code = Dom.create({
					tag: 'code',
					attrs: {
						className: 'ui-typography-code',
					},
					events: {
						mouseenter: () => {
							Dom.removeClass(button, ['--copied']);
							Dom.addClass(button, '--visible');
						},
						mouseleave: () => {
							Dom.removeClass(button, ['--visible']);
						},
					},
					dataset: {
						decorator: true,
					},
					children: getCodeTokenNodes(this.#codeParser.parse(content)),
				});

				const button = Tag.render`
					<button type="button" 
						class="ui-typography-code-copy-button" 
						onclick="${this.#handleCopyButtonClick.bind(this)}" 
						title="${Loc.getMessage('HTML_FORMATTER_COPY_TO_CLIPBOARD')}"
						aria-label="${Loc.getMessage('HTML_FORMATTER_COPY_TO_CLIPBOARD')}"
					>
						<span class="ui-typography-code-copy-icon ui-icon-set --o-copy"></span>
						<span class="ui-typography-code-copy-icon ui-icon-set --o-copied"></span>
					</button>
				`;

				code.append(button);

				return code;
			},
			...options,
		});
	}

	#handleCopyButtonClick(event: MouseEvent): void
	{
		const button: HTMLButtonElement = event.currentTarget;
		const codeElement = button.parentElement;
		const text = codeElement.innerText;

		event.stopPropagation();

		if (navigator.clipboard && window.isSecureContext)
		{
			void navigator.clipboard.writeText(text);
		}
		else
		{
			const textarea = document.createElement('textarea');
			textarea.value = text;

			Dom.style(textarea, {
				position: 'fixed',
				left: '-9999px',
			});

			Dom.attr(textarea, 'aria-hidden', 'true');

			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand('copy');
			document.body.removeChild(textarea);
		}

		Dom.addClass(button, '--copied');
	}
}

function getCodeTokenNodes(tokens: Array<CodeToken>): Array<Text | HTMLElement>
{
	const nodes: Array<Text | HTMLElement>[] = [];
	tokens.forEach((token: CodeToken): void => {
		const partials: string[] = token.content.split(/([\t\n])/);
		const partialsLength: number = partials.length;
		for (let i = 0; i < partialsLength; i++)
		{
			const part: string = partials[i];
			if (part === '\n' || part === '\r\n')
			{
				nodes.push(document.createElement('br'));
			}
			else if (part === '\t')
			{
				nodes.push(document.createTextNode('\t'));
			}
			else if (part.length > 0)
			{
				const span = document.createElement('span');
				span.className = `ui-typography-token-${token.type}`;
				span.textContent = part;
				nodes.push(span);
			}
		}
	});

	return nodes;
}
