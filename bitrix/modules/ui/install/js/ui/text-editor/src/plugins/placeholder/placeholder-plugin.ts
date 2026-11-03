import { Type, Dom, Tag, Text, Loc } from 'main.core';
import {
	$getSelection,
	$isRangeSelection,
	$isRootNode,
	$isParagraphNode,
	SELECTION_CHANGE_COMMAND,
	COMMAND_PRIORITY_CRITICAL,
	BLUR_COMMAND,
	PASTE_COMMAND,
	type BaseSelection,
	type ParagraphNode,
} from 'ui.lexical.core';
import { $canShowPlaceholder } from 'ui.lexical.text';

import { BasePlugin } from '../base-plugin';
import { type CopilotPlugin } from '../copilot';
import { type MentionPlugin } from '../mention';

import './placeholder.css';

export class PlaceholderPlugin extends BasePlugin
{
	#placeholder: string | null = null;
	#placeholderNode: HTMLElement | null = null;
	#paragraphPlaceholder: string | null = null;

	afterInit()
	{
		const placeholder = this.getEditor().getOption<string>('placeholder');
		if (Type.isStringFilled(placeholder))
		{
			this.#placeholder = placeholder;
			// the node is purely visual: it sits next to the field rather than inside it, and
			// without aria-hidden a screen reader would read the hint twice — once as stray text
			// and once as aria-placeholder
			this.#placeholderNode = Tag.render`
				<div class="ui-text-editor-placeholder" aria-hidden="true">${Text.encode(this.#placeholder)}</div>
			`;

			Dom.append(this.#placeholderNode, this.getEditor().getScrollerContainer());
			Dom.attr(this.getEditor().getEditableContainer(), 'aria-placeholder', this.#placeholder);

			this.#registerPlaceholderListeners();
		}

		// Loc.getMessage() answers undefined for a phrase the portal does not carry, and the
		// branches below reassign from it
		let paragraphPlaceholder: string | null | undefined = this.getEditor()
			.getOption<string>('paragraphPlaceholder');
		if (Type.isStringFilled(paragraphPlaceholder))
		{
			if (paragraphPlaceholder === 'auto')
			{
				const copilotPlugin: CopilotPlugin | null = this.getEditor().getPlugin<CopilotPlugin>('Copilot');
				const copilotEnabled = copilotPlugin !== null && copilotPlugin.shouldTriggerBySpace();
				const mentionPlugin: MentionPlugin | null = this.getEditor().getPlugin<MentionPlugin>('Mention');
				const mentionEnabled = mentionPlugin !== null && mentionPlugin.shouldTriggerByAtSign();
				if (copilotEnabled && mentionEnabled)
				{
					paragraphPlaceholder = Loc.getMessage('TEXT_EDITOR_PLACEHOLDER_MENTION_BITRIX_GPT', {
						'#COPILOT_NAME#': copilotPlugin.getCopilotName(),
					});
				}
				else if (copilotEnabled)
				{
					paragraphPlaceholder = Loc.getMessage('TEXT_EDITOR_PLACEHOLDER_BITRIX_GPT', {
						'#COPILOT_NAME#': copilotPlugin.getCopilotName(),
					});
				}
				else if (mentionEnabled)
				{
					paragraphPlaceholder = Loc.getMessage('TEXT_EDITOR_PLACEHOLDER_MENTION');
				}
			}

			// the auto branches above read their text out of the portal, and a phrase the portal
			// does not carry comes back as undefined -- which used to reach data-placeholder as
			// the literal word, since nothing between here and there rejects it
			if (Type.isStringFilled(paragraphPlaceholder) && paragraphPlaceholder !== 'auto')
			{
				this.#paragraphPlaceholder = paragraphPlaceholder;
				this.#registerParagraphListeners();
			}
		}
	}

	static getName(): string
	{
		return 'Placeholder';
	}

	// both plugins are optional: without them the automatic placeholder leaves their hints out
	static getPeerDependencies(): string[]
	{
		return ['Copilot', 'Mention'];
	}

	#registerPlaceholderListeners(): void
	{
		this.cleanUpRegister(
			this.getEditor().registerUpdateListener(() => {
				this.getEditor()
					.getEditorState()
					.read(() => {
						this.#togglePlaceholder();
					});
			}),
		);
	}

	#togglePlaceholder(): void
	{
		if (this.#placeholder === null)
		{
			return;
		}

		let canShowPlaceholder = $canShowPlaceholder(this.getLexicalEditor().isComposing());
		if (canShowPlaceholder && this.#paragraphPlaceholder !== null && this.#hasFocus())
		{
			canShowPlaceholder = false;
		}

		if (canShowPlaceholder)
		{
			Dom.addClass(this.#placeholderNode, '--shown');
		}
		else
		{
			Dom.removeClass(this.#placeholderNode, '--shown');
		}
	}

	#hasFocus(): boolean
	{
		const activeElement = document.activeElement;
		const rootElement = this.getEditor().getRootElement();

		return rootElement !== null && activeElement !== null && rootElement.contains(activeElement);
	}

	#hidePlaceholder(): void
	{
		if (this.#placeholderNode !== null)
		{
			Dom.removeClass(this.#placeholderNode, '--shown');
		}
	}

	#registerParagraphListeners(): void
	{
		let lastEmptyParagraph: ParagraphNode | null = null;
		const resetParagraphPlaceholder = () => {
			if (lastEmptyParagraph)
			{
				const htmlElement = this.getEditor()
					.getElementByKey(lastEmptyParagraph.getKey()) as HTMLParagraphElement | null;
				if (htmlElement)
				{
					delete htmlElement.dataset.placeholder;
				}
			}
		};

		this.cleanUpRegister(
			this.getEditor().registerCommand(
				SELECTION_CHANGE_COMMAND,
				() => {
					if (!this.getEditor().isEditable())
					{
						return false;
					}

					const selection: BaseSelection | null = $getSelection();
					let currentParagraph: ParagraphNode | null = null;
					if ($isRangeSelection(selection) && selection.isCollapsed())
					{
						const node = selection.anchor.getNode();
						if ($isParagraphNode(node) && $isRootNode(node.getParent()) && node.isEmpty())
						{
							const htmlElement = this.getEditor()
								.getElementByKey(node.getKey()) as HTMLParagraphElement | null;
							if (htmlElement && this.#hasFocus())
							{
								htmlElement.dataset.placeholder = this.#paragraphPlaceholder!;
								currentParagraph = node;
								this.#hidePlaceholder();
							}
						}
					}

					if (lastEmptyParagraph && lastEmptyParagraph !== currentParagraph)
					{
						resetParagraphPlaceholder();
					}

					lastEmptyParagraph = currentParagraph;

					return false;
				},
				COMMAND_PRIORITY_CRITICAL,
			),
			this.getEditor().registerCommand(
				PASTE_COMMAND,
				(): boolean => {
					resetParagraphPlaceholder();

					return false;
				},
				COMMAND_PRIORITY_CRITICAL,
			),
			this.getEditor().registerCommand(
				BLUR_COMMAND,
				(): boolean => {
					resetParagraphPlaceholder();
					this.#togglePlaceholder();

					return false;
				},
				COMMAND_PRIORITY_CRITICAL,
			),
		);
	}
}
