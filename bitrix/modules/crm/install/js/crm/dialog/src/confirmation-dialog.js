import { Dom, Type, Loc } from 'main.core';
import { Button, ButtonSize, AirButtonStyle } from 'ui.buttons';
import { Dialog } from 'ui.system.dialog';

export class ConfirmationDialog
{
	static items = {};

	static get(id)
	{
		return this.items[id] ?? null;
	}

	static create(id, settings)
	{
		const self = new ConfirmationDialog();
		self.initialize(id, settings);
		this.items[id] = self;
		return self;
	}

	initialize(id, settings)
	{
		this._id = id;
		this._settings = settings ?? {};
		this._dialog = null;
		this._promise = null;
		this._isOpened = false;
	}

	getId()
	{
		return this._id;
	}

	isOpened()
	{
		return this._isOpened;
	}

	open()
	{
		if (this._isOpened)
		{
			return this._promise;
		}

		const acceptButton = new Button({
			text: this._settings.acceptButtonTitle ?? Loc.getMessage('JS_CORE_WINDOW_CONTINUE'),
			size: ButtonSize.LARGE,
			style: AirButtonStyle.FILLED,
			useAirDesign: true,
			onclick: () => this.onConfirm(),
		});

		const cancelButton = new Button({
			text: this._settings.cancelButtonTitle ?? Loc.getMessage('JS_CORE_WINDOW_CANCEL'),
			size: ButtonSize.LARGE,
			style: AirButtonStyle.OUTLINE,
			useAirDesign: true,
			onclick: () => this.onCancel(),
		});

		this._dialog = new Dialog({
			title: this._settings.title ?? 'untitled',
			content: this._renderContent(this._settings.content ?? '-'),
			centerButtons: [acceptButton, cancelButton],
			hasCloseButton: true,
			closeByEsc: true,
			hasOverlay: true,
			width: 480,
			background: this._settings.background,
			events: {
				onShow: () => {
					this._isOpened = true;
				},
				onHide: () => {
					this._isOpened = false;
					if (this._promise)
					{
						this._promise.fulfill({ cancel: true });
						this._promise = null;
					}
				},
			},
		});

		this._promise = new BX.Promise();
		this._dialog.show();

		return this._promise;
	}

	close()
	{
		this._dialog?.hide();
	}

	onConfirm()
	{
		if (this._promise)
		{
			this._promise.fulfill({ cancel: false });
			this._promise = null;
		}
		this.close();
	}

	onCancel()
	{
		if (this._promise)
		{
			this._promise.fulfill({ cancel: true });
			this._promise = null;
		}
		this.close();
	}

	_renderContent(content)
	{
		if (Type.isDomNode(content))
		{
			return content;
		}

		return Dom.create('div', { html: content });
	}
}
