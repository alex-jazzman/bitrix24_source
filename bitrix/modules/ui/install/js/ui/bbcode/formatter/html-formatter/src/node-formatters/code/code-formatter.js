import { Dom, Tag, Loc } from 'main.core';
import {
	NodeFormatter,
	type NodeFormatterOptions,
	type BeforeConvertCallbackOptions,
	type ConvertCallbackOptions,
} from 'ui.bbcode.formatter';

import { type BBCodeNode } from 'ui.bbcode.model';
import { CodeParser, type CodeToken } from 'ui.code-parser';

export class CodeNodeFormatter extends NodeFormatter
{
	#codeParser: CodeParser = new CodeParser();

	constructor(options: NodeFormatterOptions = {})
	{
		super({
			name: 'code',
			before({ node }: BeforeConvertCallbackOptions): BBCodeNode {
				return node.clone({ deep: true });
			},
			convert({ node }: ConvertCallbackOptions): HTMLElement {
				const content = node.getTextContent();
				// Keep the final empty line visible without adding it to the copied text.
				const layoutLineBreak = document.createElement('br');

				const code = Dom.create({
					tag: 'code',
					attrs: {
						className: 'ui-typography-code',
					},
					dataset: {
						decorator: true,
					},
					children: [...getCodeTokenNodes(this.#codeParser.parse(content)), layoutLineBreak],
				});

				const button = Tag.render`
					<button type="button"
						class="ui-typography-code-copy-button"
						onclick="${this.#handleCopyButtonClick.bind(this, code, layoutLineBreak)}"
						title="${Loc.getMessage('HTML_FORMATTER_COPY_TO_CLIPBOARD')}"
						aria-label="${Loc.getMessage('HTML_FORMATTER_COPY_TO_CLIPBOARD')}"
					>
						<span class="ui-typography-code-copy-icon ui-icon-set --o-copy"></span>
						<span class="ui-typography-code-copy-icon ui-icon-set --o-copied"></span>
					</button>
				`;
				const buttonOverlay = Dom.create({
					tag: 'div',
					attrs: {
						className: 'ui-typography-code-copy-button-overlay',
					},
					children: [button],
				});

				return Dom.create({
					tag: 'div',
					attrs: {
						className: 'ui-typography-code-container',
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
					children: [code, buttonOverlay],
				});
			},
			...options,
		});
	}

	#handleCopyButtonClick(code: HTMLElement, layoutLineBreak: HTMLBRElement, event: MouseEvent): void
	{
		const button: HTMLButtonElement = event.currentTarget;
		let text = code.innerText;
		if (code.lastChild === layoutLineBreak && text.endsWith('\n'))
		{
			text = text.slice(0, -1);
		}

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

			Dom.append(textarea, document.body);
			textarea.select();
			document.execCommand('copy');
			Dom.remove(textarea);
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
