import { Runtime, Type, Dom, Tag, Loc, Event } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { LiveAnnouncer } from 'ui.a11y';
import { Outline } from 'ui.icon-set.api.core';
import {
	$getSelection,
	$isRangeSelection,
	$isRootNode,
	$isTextNode,
	$insertNodes,
	createCommand,
	$getRoot,
	$isParagraphNode,
	$createParagraphNode,
	COMMAND_PRIORITY_EDITOR,
	COMMAND_PRIORITY_LOW,
	type LexicalCommand,
	type LexicalNode,
	type PointType,
	type TextNode,
	type ElementNode,
	type RangeSelection,
} from 'ui.lexical.core';
import { $generateNodesFromDOM } from 'ui.lexical.html';

import { type Copilot, type CopilotOptions } from 'ai.copilot';

import { DIALOG_VISIBILITY_COMMAND, HIDE_DIALOG_COMMAND } from '../../commands';
import { getAriaMessage } from '../../helpers/aria-message';
import { $createNodesFromText } from '../../helpers/create-nodes-from-text';
import { getPopupOffsetLeft } from '../../helpers/get-popup-offset-left';
import { $getSelectionPosition } from '../../helpers/get-selection-position';
import { RememberedSelection } from '../../helpers/remembered-selection';
import { TextEditor } from '../../text-editor';
import { Button } from '../../toolbar/button';
import { type TextEditorOptions } from '../../types/text-editor-options';
import { BasePlugin } from '../base-plugin';
import { CustomParagraphNode } from '../paragraph/custom-paragraph-node';

import './copilot.css';

type CopilotDialogOptions = {
	onShow?: () => void,
	onError?: () => void,
};

export const INSERT_COPILOT_DIALOG_COMMAND: LexicalCommand<CopilotDialogOptions> = createCommand(
	'INSERT_COPILOT_DIALOG_COMMAND',
);

const CopilotStatus = {
	INIT: 'init',
	LOADING: 'loading',
	LOADED: 'loaded',
};

export class CopilotPlugin extends BasePlugin
{
	#copilot: Copilot | null = null;
	#copilotStatus: string = CopilotStatus.INIT;
	#copilotOptions: CopilotOptions | null = null;
	#targetParagraph: HTMLParagraphElement | null = null;
	#lastSelection: RememberedSelection = new RememberedSelection();
	#onEditorScroll: EventListener = this.#handleEditorScroll.bind(this);
	#triggerBySpace: boolean = false;

	constructor(editor: TextEditor)
	{
		super(editor);

		this.#copilotOptions = editor.getOption('copilot.copilotOptions');
		if (Type.isPlainObject(this.#copilotOptions))
		{
			this.#registerListeners();
			this.#registerComponents();
		}
	}

	static getName(): string
	{
		return 'Copilot';
	}

	static getDefaultOptions(): TextEditorOptions
	{
		return { copilot: { triggerBySpace: false } } as TextEditorOptions;
	}

	#registerListeners(): void
	{
		this.#triggerBySpace = this.getEditor().getOption<boolean>('copilot.triggerBySpace') === true;

		this.cleanUpRegister(
			this.getEditor().registerCommand(
				INSERT_COPILOT_DIALOG_COMMAND,
				(payload): boolean => {
					const options = Type.isPlainObject(payload) ? payload : {};
					this.show(options);

					return true;
				},
				COMMAND_PRIORITY_EDITOR,
			),
			this.getEditor().registerCommand(
				HIDE_DIALOG_COMMAND,
				(payload): boolean => {
					if (payload?.sender === 'copilot')
					{
						return false;
					}

					this.#lastSelection.forget();

					this.#hide();

					return false;
				},
				COMMAND_PRIORITY_LOW,
			),
			this.getEditor().registerCommand(
				DIALOG_VISIBILITY_COMMAND,
				(): boolean => {
					return this.isCopilotShown();
				},
				COMMAND_PRIORITY_LOW,
			),
			this.#triggerBySpace ? this.#registerParagraphNodeTransform() : () => {},
		);
	}

	#registerParagraphNodeTransform(): () => void
	{
		return this.getEditor().registerNodeTransform(CustomParagraphNode, (node: CustomParagraphNode) => {
			if (node.getChildrenSize() !== 1 || !$isRootNode(node.getParent()))
			{
				return;
			}

			if (!$isTextNode(node.getFirstChild()) || node.getFirstChild()!.getTextContent() !== ' ')
			{
				this.#resetLoader();

				return;
			}

			const selection = $getSelection();
			if (!$isRangeSelection(selection) || !selection.isCollapsed())
			{
				return;
			}

			const anchorNode = selection.anchor.getNode();
			if (anchorNode !== node.getFirstChild())
			{
				return;
			}

			if (!this.isCopilotLoaded() && !this.isCopilotLoading())
			{
				this.#resetLoader();
				this.#targetParagraph = this.getEditor().getElementByKey(node.getKey()) as HTMLParagraphElement | null;
				if (this.#targetParagraph)
				{
					Dom.addClass(this.#targetParagraph, 'ui-text-editor-loading-ellipsis');
				}
			}

			node.getFirstChild()!.remove();
			node.select();
			this.show({
				onShow: () => this.#resetLoader(),
				onError: () => this.#resetLoader(),
			});
		});
	}

	#registerComponents(): void
	{
		this.getEditor()
			.getComponentRegistry()
			.register('copilot', (): Button => {
				const button: Button = new Button();
				const copilotIconClass = `--${Outline.COPILOT}`;
				const refreshIconClass = `--${Outline.REFRESH} ui-text-editor-copilot-loading`;
				const icon = Tag.render`
					<span
						class="ui-icon-set ${copilotIconClass}"
						style="--ui-icon-set__icon-color: var(--ui-color-copilot-primary)"
					></span>
				`;
				button.setContent(icon);
				button.setTooltip(this.getCopilotName());
				button.subscribe('onClick', (): void => {
					this.getEditor().focus();

					if (this.isCopilotLoading())
					{
						return;
					}

					const resetRefresh = () => {
						if (!Dom.hasClass(icon, copilotIconClass))
						{
							Dom.removeClass(icon, refreshIconClass);
							Dom.addClass(icon, copilotIconClass);
						}
					};

					this.getEditor().dispatchCommand(INSERT_COPILOT_DIALOG_COMMAND, {
						onShow: resetRefresh,
						onError: resetRefresh,
					});

					if (!this.isCopilotLoaded())
					{
						this.registerTimeout((): void => {
							if (!this.isCopilotLoaded())
							{
								Dom.removeClass(icon, copilotIconClass);
								Dom.addClass(icon, refreshIconClass);
							}
						}, 500);
					}
				});

				return button;
			});
	}

	shouldTriggerBySpace(): boolean
	{
		return this.#triggerBySpace;
	}

	isCopilotLoaded(): boolean
	{
		return this.#copilotStatus === CopilotStatus.LOADED;
	}

	isCopilotLoading(): boolean
	{
		return this.#copilotStatus === CopilotStatus.LOADING;
	}

	isCopilotShown(): boolean
	{
		return this.#copilot !== null && this.#copilot.isShown();
	}

	getCopilotName(): string
	{
		return TextEditor.getGlobalOption<string>('copilot.name', Loc.getMessage('TEXT_EDITOR_BTN_COPILOT') ?? '');
	}

	show({ onShow, onError }: CopilotDialogOptions = {}): void
	{
		if (this.isCopilotLoaded())
		{
			this.#show({ onShow });
		}
		else if (!this.isCopilotLoading())
		{
			// loading is silent and can take seconds: without aria-busy and an announcement a screen
			// reader user cannot tell whether pressing the button did anything at all
			this.#setBusy(true);
			this.#createCopilot()
				.then(() => {
					this.#setBusy(false);
					this.#show({ onShow });
				})
				.catch(() => {
					// the extension can load after the editor is gone: #createCopilot() then rejects because
					// the plugin is destroyed, and #setBusy() would reach an editor whose prototype destroy()
					// has already dropped
					if (this.isDestroyed())
					{
						return;
					}

					this.#setBusy(false);

					const failureMessage: string | null = getAriaMessage('TEXT_EDITOR_COPILOT_ERROR');
					if (failureMessage !== null)
					{
						LiveAnnouncer.announce(failureMessage, 'assertive');
					}

					if (Type.isFunction(onError))
					{
						onError();
					}
				});
		}
	}

	#setBusy(busy: boolean): void
	{
		Dom.attr(this.getEditor().getEditableContainer(), 'aria-busy', busy ? 'true' : null);
	}

	#show({ onShow }: { onShow?: () => void } = {}): void
	{
		this.getEditor().update(() => {
			const selection = $getSelection();
			if (!$isRangeSelection(selection) || !this.getEditor().isEditable())
			{
				return;
			}

			this.getEditor().dispatchCommand(HIDE_DIALOG_COMMAND, { sender: 'copilot' });

			const selectionText = selection.getTextContent();
			const editorPosition = Dom.getPosition(this.getEditor().getScrollerContainer());
			const width = Math.min(editorPosition.width, 600);

			this.#lastSelection.remember(selection);

			const selectedText = selectionText.trim();
			if (selectedText.length > 0)
			{
				this.#copilot!.setSelectedText(selectedText);
			}
			else
			{
				const wholeText = $getRoot().getTextContent().trim();
				if (wholeText.length > 0)
				{
					this.#copilot!.setContext(wholeText);
				}
			}

			this.#copilot!.show({ width });

			this.#adjustDialogPosition();

			Event.bind(this.getEditor().getScrollerContainer(), 'scroll', this.#onEditorScroll, {
				signal: this.getAbortSignal(),
			});

			if (!selection.isCollapsed())
			{
				this.getEditor().highlightSelection();
			}

			if (Type.isFunction(onShow))
			{
				onShow();
			}
		});
	}

	#hide(): void
	{
		if (this.isCopilotLoaded() && this.#copilot!.isShown())
		{
			this.#copilot!.hide();
		}
	}

	#createCopilot(): Promise<void>
	{
		if (this.isDestroyed())
		{
			return Promise.reject(new Error('Copilot plugin was destroyed.'));
		}

		this.#copilotStatus = CopilotStatus.LOADING;

		return new Promise<void>((resolve, reject) => {
			(Runtime.loadExtension('ai.copilot') as unknown as Promise<{
				Copilot: new (options: Partial<CopilotOptions>) => Copilot,
				CopilotEvents: { [key: string]: string },
			}>)
				.then(({ Copilot, CopilotEvents }) => {
					if (this.isDestroyed())
					{
						reject(new Error('Copilot plugin was destroyed.'));

						return;
					}

					this.#copilot = new Copilot({
						showResultInCopilot: true,
						...this.#copilotOptions,
						autoHide: true,
					});

					this.#copilot!.subscribe(CopilotEvents.FINISH_INIT, () => {
						if (this.isDestroyed())
						{
							reject(new Error('Copilot plugin was destroyed.'));

							return;
						}

						this.#copilotStatus = CopilotStatus.LOADED;
						resolve();
					});

					this.#copilot!.subscribe(CopilotEvents.TEXT_SAVE, this.#handleCopilotSave.bind(this));
					this.#copilot!.subscribe(CopilotEvents.TEXT_PLACE_BELOW, this.#handleCopilotAddBelow.bind(this));
					this.#copilot!.subscribe(CopilotEvents.HIDE, this.#handleCopilotHide.bind(this));

					this.#copilot!.init();
				})
				.catch(() => {
					// without the reset the status stays LOADING for good, and the next show() reaches
					// neither a second load nor onError -- the plugin simply goes quiet
					this.#copilotStatus = CopilotStatus.INIT;

					reject();
				});
		});
	}

	#resetLoader(): void
	{
		if (this.#targetParagraph)
		{
			Dom.removeClass(this.#targetParagraph, 'ui-text-editor-loading-ellipsis');
		}
	}

	#adjustDialogPosition(): void
	{
		this.getEditor().update(() => {
			this.#restoreSelection();

			const selection = $getSelection();
			if (!$isRangeSelection(selection))
			{
				return;
			}

			// Positioning only measures the caret, so it must hand it back before every exit.
			// The early return below is reached on any scroll that pushes the caret out of the
			// measurable area, and leaving it consumed there loses the caret Copilot was invoked
			// on: the result would then be inserted wherever the editor happens to point.
			this.#lastSelection.remember(selection);

			const selectionPosition = $getSelectionPosition(this.getEditor(), selection, document.body);
			if (selectionPosition === null)
			{
				return;
			}

			const { top, left, bottom } = selectionPosition;
			const scrollerRect: DOMRect = Dom.getPosition(this.getEditor().getScrollerContainer());
			const popupWidth = Math.min(scrollerRect.width, 600);
			const offsetLeft = getPopupOffsetLeft(this.getEditor(), scrollerRect, left, popupWidth);

			if (bottom < scrollerRect.top || top > scrollerRect.bottom)
			{
				this.#copilot!.adjust({ hide: true });
			}
			else
			{
				this.#copilot!.adjust({
					hide: false,
					position: { left: left - offsetLeft, top: bottom },
				});
			}
		});
	}

	#handleEditorScroll(): void
	{
		this.#adjustDialogPosition();
	}

	#restoreSelection(): boolean
	{
		return this.#lastSelection.restore();
	}

	#handleCopilotSave(event: BaseEvent): void
	{
		const { result } = event.getData();
		this.getEditor().update(() => {
			this.#restoreSelection();

			const selection = $getSelection();
			if ($isRangeSelection(selection))
			{
				if (this.#isHtmlResponseFormat())
				{
					selection.removeText();
					const nodes = this.#createNodesFromHtml(result);
					$insertNodes(nodes);
				}
				else
				{
					selection.insertRawText(result);
				}
			}

			this.#hide();
		});
	}

	#handleCopilotAddBelow(event: BaseEvent): void
	{
		const { result } = event.getData();
		this.getEditor().update(() => {
			this.#restoreSelection();

			const selection = $getSelection();
			if ($isRangeSelection(selection))
			{
				const focus: PointType = selection.focus;
				const focusNode: TextNode | ElementNode = focus.getNode();
				if (!selection.isCollapsed())
				{
					focusNode.selectEnd();
				}

				const parentNode = focusNode.getParent();
				if ($isParagraphNode(parentNode))
				{
					if (this.#isHtmlResponseFormat())
					{
						const nodes = this.#createNodesFromHtml(result);
						const wrapper = $createParagraphNode();
						wrapper.append(...nodes);
						parentNode.insertAfter(wrapper);
					}
					else
					{
						const paragraph = $createParagraphNode();
						paragraph.append(...$createNodesFromText(result));
						parentNode.insertAfter(paragraph);
					}
				}
				else
				{
					selection.insertLineBreak();
					if (this.#isHtmlResponseFormat())
					{
						const nodes = this.#createNodesFromHtml(result);
						$insertNodes(nodes);
					}
					else
					{
						selection.insertRawText(result);
					}
				}
			}

			this.#hide();
		});
	}

	#handleCopilotHide(): void
	{
		Event.unbind(this.getEditor().getScrollerContainer(), 'scroll', this.#onEditorScroll);
		this.getEditor().resetHighlightSelection();
		this.getEditor().update(() => {
			this.#restoreSelection();
		});
	}

	#isHtmlResponseFormat(): boolean
	{
		return this.#copilotOptions?.responseFormat === 'html';
	}

	#createNodesFromHtml(html: string): Array<LexicalNode>
	{
		const parser = new DOMParser();
		const dom = parser.parseFromString(html, 'text/html');

		return $generateNodesFromDOM(this.getLexicalEditor(), dom);
	}

	destroy(): void
	{
		super.destroy();

		if (this.#copilot !== null)
		{
			this.#copilot.hide();
			this.#copilot = null;
		}
	}
}
