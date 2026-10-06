import { Dom, Type, Loc } from 'main.core';
import { Button, ButtonSize, AirButtonStyle } from 'ui.buttons';
import { Dialog } from 'ui.system.dialog';

export class NotificationDialog
{
	static items = {};

	static get(id)
	{
		return this.items[id] ?? null;
	}

	static create(id, settings)
	{
		const self = new NotificationDialog();
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
	}

	getId()
	{
		return this._id;
	}

	open()
	{
		const closeButton = new Button({
			text: Loc.getMessage('JS_CORE_WINDOW_CLOSE'),
			size: ButtonSize.LARGE,
			style: AirButtonStyle.OUTLINE,
			useAirDesign: true,
			onclick: () => this.onClose(),
		});

		this._dialog = new Dialog({
			title: this._settings.title ?? 'untitled',
			content: this._renderContent(this._settings.content ?? '-'),
			centerButtons: [closeButton],
			hasCloseButton: true,
			closeByEsc: true,
			hasOverlay: true,
			width: 480, // applied as min/max width by ui.system.dialog
			events: {
				onHide: () => {
					if (this._promise)
					{
						this._promise.fulfill({});
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

	onClose()
	{
		if (this._promise)
		{
			this._promise.fulfill({});
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
