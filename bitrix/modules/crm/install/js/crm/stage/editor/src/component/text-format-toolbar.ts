import { Dom, Event as CoreEvent, Loc, Tag, Text, Type } from 'main.core';
import { Popup } from 'main.popup';
import { FocusNavigator } from 'ui.a11y';
import { Icon, IconHoverMode, Outline } from 'ui.icon-set.api.core';
import { Input, InputDesign, InputSize } from 'ui.system.input';

import {
	normalizeStageDescriptionUrl,
	type StageDescriptionFormat,
	toggleStageDescriptionFormat,
	wrapStageDescriptionLink,
} from '../lib/text-format';
import {
	STAGE_DESCRIPTION_TOOLBAR_ITEMS,
	type StageDescriptionToolbarFormatItem,
} from '../lib/text-format-toolbar-items';

import './text-format-toolbar.css';

type TextFormatToolbarOptions = {
	textarea: HTMLTextAreaElement,
};

type BindPosition = {
	left: number,
	top: number,
};

const FORMAT_ICONS = {
	bold: Outline.BOLD,
	italic: Outline.ITALIC,
	underline: Outline.UNDERLINE,
	strikethrough: Outline.STRIKETHROUGH,
};

export class TextFormatToolbar
{
	#textarea: HTMLTextAreaElement;
	#popup: Popup | null = null;
	#animationFrameId: number | null = null;
	#linkInput: Input | null = null;
	#linkInputElement: HTMLInputElement | null = null;
	#linkApplyButton: HTMLButtonElement | null = null;
	#linkButton: HTMLButtonElement | null = null;
	#toolbarElement: HTMLElement | null = null;
	#selectionStart = 0;
	#selectionEnd = 0;
	#restoreFocusOnClose = false;

	constructor(options: TextFormatToolbarOptions)
	{
		this.#textarea = options.textarea;
		CoreEvent.bind(this.#textarea, 'mouseup', this.#handleMouseUp);
		CoreEvent.bind(this.#textarea, 'keydown', this.#handleTextareaKeyDown);
	}

	destroy(): void
	{
		CoreEvent.unbind(this.#textarea, 'mouseup', this.#handleMouseUp);
		CoreEvent.unbind(this.#textarea, 'keydown', this.#handleTextareaKeyDown);
		this.#cancelAnimationFrame();
		this.#destroyPopup(false);
	}

	#handleTextareaKeyDown = (event: KeyboardEvent): void => {
		if (event.key !== 'Tab' || event.shiftKey || !this.#hasSelection())
		{
			return;
		}

		event.preventDefault();
		this.#selectionStart = this.#textarea.selectionStart;
		this.#selectionEnd = this.#textarea.selectionEnd;
		const textareaRect = this.#textarea.getBoundingClientRect();
		this.#show({
			left: textareaRect.left + window.scrollX + textareaRect.width / 2,
			top: textareaRect.top + window.scrollY,
		}, true);
	};

	#handleToolbarKeyDown = (event: KeyboardEvent): void => {
		if (event.key !== 'Escape')
		{
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		this.#destroyPopup();
	};

	#handleMouseUp = (event: MouseEvent): void => {
		this.#cancelAnimationFrame();

		const bindPosition = {
			left: event.pageX,
			top: event.pageY,
		};
		this.#animationFrameId = window.requestAnimationFrame(() => {
			this.#animationFrameId = null;
			if (!this.#hasSelection())
			{
				this.#destroyPopup();

				return;
			}

			this.#selectionStart = this.#textarea.selectionStart;
			this.#selectionEnd = this.#textarea.selectionEnd;
			this.#show(bindPosition);
		});
	};

	#hasSelection(): boolean
	{
		return this.#textarea.selectionStart !== this.#textarea.selectionEnd;
	}

	#show(bindPosition: BindPosition, focusToolbar: boolean = false): void
	{
		this.#destroyPopup(false);

		this.#popup = new Popup({
			bindElement: bindPosition,
			bindOptions: {
				forceBindPosition: true,
				position: 'top',
			},
			content: this.#renderToolbar(),
			className: 'crm-stage-editor-format-toolbar-popup',
			autoHide: true,
			closeByEsc: true,
			cacheable: false,
			padding: 0,
			contentBorderRadius: '12px',
			events: {
				onPopupDestroy: this.#handlePopupDestroy,
			},
		});
		this.#restoreFocusOnClose = focusToolbar;
		this.#popup.show();
		if (focusToolbar && this.#toolbarElement)
		{
			FocusNavigator.focusFirst(this.#toolbarElement, { focusVisible: true });
		}
	}

	#renderToolbar(): HTMLElement
	{
		this.#destroyLinkEditor();

		const items: HTMLElement[] = [];
		this.#linkButton = null;
		STAGE_DESCRIPTION_TOOLBAR_ITEMS.forEach((item) => {
			if (item.name === 'link')
			{
				items.push(this.#renderSeparator());
				this.#linkButton = this.#renderIconButton(
					item.name,
					Outline.LINK,
					this.#getMessage(item.messageCode),
					this.#showLinkEditor,
				);
				items.push(this.#linkButton);

				return;
			}

			items.push(this.#renderFormatButton(item));
		});

		const toolbarElement = Tag.render`
			<div
				class="crm-stage-editor-format-toolbar"
				data-testid="crm-stage-editor-format-toolbar"
			>${items}</div>
		`;
		if (toolbarElement === null)
		{
			throw new TypeError('Failed to render the stage description format toolbar');
		}

		this.#toolbarElement = toolbarElement;
		CoreEvent.bind(toolbarElement, 'keydown', this.#handleToolbarKeyDown);

		return toolbarElement;
	}

	#renderFormatButton(item: StageDescriptionToolbarFormatItem): HTMLButtonElement
	{
		return this.#renderIconButton(
			item.name,
			FORMAT_ICONS[item.name],
			this.#getMessage(item.messageCode),
			() => this.#applyFormat(item.tag),
		);
	}

	#renderIconButton(
		name: string,
		iconName: string,
		title: string,
		handler: () => void,
	): HTMLButtonElement
	{
		const button = Tag.render`
			<button
				class="crm-stage-editor-format-toolbar__button"
				type="button"
				title="${Text.encode(title)}"
				aria-label="${Text.encode(title)}"
				data-testid="crm-stage-editor-format-${name}"
			></button>
		` as HTMLButtonElement;
		new Icon({
			icon: iconName,
			size: 20,
			hoverMode: IconHoverMode.DEFAULT,
		}).renderTo(button);
		CoreEvent.bind(button, 'mousedown', (event: MouseEvent) => {
			event.preventDefault();
		});
		CoreEvent.bind(button, 'click', handler);

		return button;
	}

	#renderSeparator(): HTMLElement
	{
		return Tag.render`
			<div
				class="crm-stage-editor-format-toolbar__separator"
				role="separator"
				aria-orientation="vertical"
			></div>
		`;
	}

	#applyFormat(tag: StageDescriptionFormat): void
	{
		this.#restoreSelection();
		toggleStageDescriptionFormat(this.#textarea, tag);
		this.#saveSelection();
	}

	#showLinkEditor = (): void => {
		if (!this.#popup)
		{
			return;
		}

		this.#saveSelection();
		this.#popup.setContent(this.#renderLinkEditor());
		this.#popup.adjustPosition();
		this.#cancelAnimationFrame();
		this.#animationFrameId = window.requestAnimationFrame(() => {
			this.#animationFrameId = null;
			this.#linkInputElement?.focus();
		});
	};

	#renderLinkEditor(): HTMLElement
	{
		this.#destroyLinkEditor();

		this.#linkInput = new Input({
			value: '',
			size: InputSize.Md,
			design: InputDesign.Primary,
			active: true,
			placeholder: this.#getMessage('CRM_STAGE_EDITOR_FORMAT_LINK_PLACEHOLDER'),
			ariaLabel: this.#getMessage('CRM_STAGE_EDITOR_FORMAT_LINK'),
			onInput: this.#syncLinkApplyButton,
		});
		const inputContainer = this.#linkInput.render();
		Dom.addClass(inputContainer, 'crm-stage-editor-format-toolbar__link-input');
		this.#linkInputElement = inputContainer.querySelector<HTMLInputElement>('input');
		if (this.#linkInputElement)
		{
			this.#linkInputElement.dataset.testid = 'crm-stage-editor-format-link-input';
			CoreEvent.bind(this.#linkInputElement, 'keydown', this.#handleLinkKeyDown);
		}

		this.#linkApplyButton = this.#renderIconButton(
			'link-apply',
			Outline.CHECK_S,
			this.#getMessage('CRM_STAGE_EDITOR_FORMAT_LINK_APPLY'),
			this.#applyLink,
		);
		this.#linkApplyButton.disabled = true;
		const cancelButton = this.#renderIconButton(
			'link-cancel',
			Outline.CROSS_S,
			this.#getMessage('CRM_STAGE_EDITOR_FORMAT_LINK_CANCEL'),
			this.#showToolbarContent,
		);

		return Tag.render`
			<div
				class="crm-stage-editor-format-toolbar crm-stage-editor-format-toolbar__link"
				data-testid="crm-stage-editor-format-link-editor"
			>
				${inputContainer}
				${this.#linkApplyButton}
				${cancelButton}
			</div>
		`;
	}

	#handleLinkKeyDown = (event: KeyboardEvent): void => {
		if (event.key === 'Enter')
		{
			event.preventDefault();
			this.#applyLink();
		}
		else if (event.key === 'Escape')
		{
			event.preventDefault();
			event.stopPropagation();
			this.#showToolbarContent(true);
		}
	};

	#syncLinkApplyButton = (): void => {
		if (this.#linkApplyButton)
		{
			this.#linkApplyButton.disabled = !normalizeStageDescriptionUrl(this.#linkInput?.getValue() ?? '');
		}
	};

	#applyLink = (): void => {
		const url = this.#linkInput?.getValue() ?? '';
		if (!normalizeStageDescriptionUrl(url))
		{
			return;
		}

		this.#restoreSelection();
		wrapStageDescriptionLink(this.#textarea, url);
		this.#destroyPopup();
	};

	#showToolbarContent = (focusLinkButton: boolean = false): void => {
		if (!this.#popup)
		{
			return;
		}

		this.#popup.setContent(this.#renderToolbar());
		this.#popup.adjustPosition();
		if (focusLinkButton)
		{
			FocusNavigator.focusTarget(this.#linkButton, { focusVisible: true });
		}
	};

	#saveSelection(): void
	{
		this.#selectionStart = this.#textarea.selectionStart;
		this.#selectionEnd = this.#textarea.selectionEnd;
	}

	#restoreSelection(): void
	{
		this.#textarea.selectionStart = this.#selectionStart;
		this.#textarea.selectionEnd = this.#selectionEnd;
	}

	#destroyLinkEditor(): void
	{
		if (this.#linkInputElement)
		{
			CoreEvent.unbind(this.#linkInputElement, 'keydown', this.#handleLinkKeyDown);
		}
		this.#linkInput?.destroy();
		this.#linkInput = null;
		this.#linkInputElement = null;
		this.#linkApplyButton = null;
	}

	#destroyPopup(restoreFocus: boolean = true): void
	{
		const shouldRestoreFocus = restoreFocus && this.#restoreFocusOnClose;
		this.#restoreFocusOnClose = false;
		const popup = this.#popup;
		this.#popup = null;
		popup?.destroy();
		this.#destroyLinkEditor();
		this.#toolbarElement = null;
		this.#linkButton = null;
		if (shouldRestoreFocus)
		{
			FocusNavigator.restoreFocus(this.#textarea, { focusVisible: true });
		}
	}

	#handlePopupDestroy = (): void => {
		const shouldRestoreFocus = this.#restoreFocusOnClose;
		this.#restoreFocusOnClose = false;
		this.#popup = null;
		this.#destroyLinkEditor();
		this.#toolbarElement = null;
		this.#linkButton = null;
		if (shouldRestoreFocus)
		{
			FocusNavigator.restoreFocus(this.#textarea, { focusVisible: true });
		}
	};

	#cancelAnimationFrame(): void
	{
		if (Type.isNumber(this.#animationFrameId))
		{
			window.cancelAnimationFrame(this.#animationFrameId);
			this.#animationFrameId = null;
		}
	}

	#getMessage(code: string): string
	{
		return Loc.getMessage(code) ?? '';
	}
}
