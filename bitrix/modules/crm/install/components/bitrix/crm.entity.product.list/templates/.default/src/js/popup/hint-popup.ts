import {Popup} from 'main.popup';
import {Tag, Text} from 'main.core';
import type {Editor} from '../editor/product-list-editor';

export default class HintPopup
{
	private readonly editor: Editor;
	private hintPopup: Popup | null = null;

	constructor(editor: Editor)
	{
		this.editor = editor;
	}

	public load(node: HTMLElement, text: string): Popup
	{
		if (!this.hintPopup)
		{
			this.hintPopup = new Popup({
				id: 'ui-hint-popup-' + this.editor.getId(),
				darkMode: true,
				closeIcon: true,
				animation: 'fading-slide',
				autoHide: true,
			});
		}

		this.hintPopup.setBindElement(node);
		this.hintPopup.adjustPosition();
		this.hintPopup.setContent(Tag.render`
			<div class='ui-hint-content'>${Text.encode(text)}</div>
		`);

		return this.hintPopup;
	}

	public show(): void
	{
		if (this.hintPopup)
		{
			this.hintPopup.show();
		}
	}

	public close(): void
	{
		if (this.hintPopup)
		{
			this.hintPopup.close();
		}
	}
}
