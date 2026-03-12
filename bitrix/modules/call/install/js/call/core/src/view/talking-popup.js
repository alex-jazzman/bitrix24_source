import { Utils } from 'im.v2.lib.utils';
import { Dom, Loc, Type } from 'main.core';
import { Popup } from 'main.popup';
import '../css/talking-popup.css';

export class TalkingPopup
{
	constructor(options)
	{
		this.popup = null;
		this.customClassName = BX.prop.getString(options, 'customClassName', '');
		this.bindElement = BX.prop.getElementNode(options, 'bindElement', null);
		this.targetContainer = BX.prop.getElementNode(options, 'targetContainer', null);

		this.content = options.content;

		this.closingDelay = 1500;
		this.closingDuration = 500;
		this.closingTimeout = null;

		this.callbacks = {
			onClose: BX.prop.getFunction(options, 'onClose', BX.DoNothing),
		};
	}

	show()
	{
		if (Type.isNumber(this.closingTimeout) || Dom.hasClass(this.popup?.getPopupContainer(), 'closing'))
		{
			this.clearClosingTimeout();
			if (Dom.hasClass(this.popup?.getPopupContainer(), 'closing'))
			{
				Dom.removeClass(this.popup?.getPopupContainer(), 'closing');
			}
		}
		else
		{
			window.requestAnimationFrame(() => {
				if (!Dom.hasClass(this.popup?.getPopupContainer(), 'opening'))
				{
					Dom.addClass(this.popup?.getPopupContainer(), 'opening');
				}

				window.requestAnimationFrame(() => {
					Dom.removeClass(this.popup?.getPopupContainer(), 'opening');
				});
			});
		}

		if (!this.popup)
		{
			this.popup = new Popup({
				bindElement: this.bindElement,
				targetContainer: this.targetContainer,
				content: this.render(),
				padding: 0,
				contentPadding: 0,
				className: (`bx-call-view-popup-talking ${this.customClassName} opening`),
				zIndexOptions: { alwaysOnTop: true },
				background: '#085DC1',
				contentBackground: '#085DC1',
				darkMode: true,
				contentBorderRadius: '18px',
				borderRadius: '18px',
				angle: false,
				events: {
					onClose: () => {
						this.destroy();
					},
					onDestroy: () => this.popup = null,
				},
			});
		}
		this.popup.show();
	}

	render()
	{
		const avatarText = Utils.text.getFirstLetters(this.content.name).toUpperCase();

		return Dom.create('div', {
			props: { className: 'bx-call-view-popup-talking-body' },
			children: [
				Dom.create('div', {
					props: {
						className: `bx-call-view-popup-talking-avatar ${this.content.avatar ? '' : 'no-photo'}`,

					},
					style: { 'background-image': `url("${this.content.avatar}")` },
					children: [
						Dom.create('div', {
							props: {
								className: 'bx-call-view-popup-talking-avatar-text',

							},
							text: this.content.avatar ? '' : avatarText,
						}),
					],
				}),
				Dom.create('div', {
					props: { className: 'bx-call-view-popup-talking-text' },
					text: Loc.getMessage('CALL_TALKING_POPUP_TEXT', {
						'#NAME#': this.content.name,
					}),
				}),

			],
		});
	}

	setContent(content)
	{
		this.content = content;
		if (!this.popup)
		{
			return;
		}
		this.popup.setContent(this.render());
	}

	close(callback) {
		this.clearClosingTimeout();

		if (this.popup)
		{
			this.popup.close();
			this.callbacks.onClose();
		}

		if (callback)
		{
			callback();
		}
		this.destroy();
	}

	animatedClose(callback)
	{
		this.clearClosingTimeout();
		if (!Dom.hasClass(this.popup?.getPopupContainer(), 'closing'))
		{
			Dom.addClass(this.popup?.getPopupContainer(), 'closing');
		}

		this.closingTimeout = setTimeout(() => {
			this.close(callback);
		}, this.closingDuration);
	}

	clearClosingTimeout() {
		clearTimeout(this.closingTimeout);
		this.closingTimeout = null;
	}

	closeWithDelay(isForce, callback)
	{
		if (isForce)
		{
			this.close(callback);
		}
		else
		{
			this.clearClosingTimeout();
			if (Dom.hasClass(this.popup?.getPopupContainer(), 'closing'))
			{
				Dom.removeClass(this.popup?.getPopupContainer(), 'closing');
			}
			this.closingTimeout = setTimeout(() => {
				this.animatedClose(callback);
			}, this.closingDelay);
		}
	}

	destroy()
	{
		this.clearClosingTimeout();
		if (this.popup)
		{
			this.popup.destroy();
		}
	}
}
