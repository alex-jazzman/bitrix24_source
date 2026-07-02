import { Dom, Event, Type } from 'main.core';
import { Popup } from 'main.popup';
import './style.css';

export class AhaMoment
{
	constructor(options = {})
	{
		this.canShow = options.canShow === true;
		this.id = options.id ?? `biconnector-aha-moment-${Math.random().toString(16).slice(2)}`;
		this.title = options.title ?? '';
		this.description = options.description ?? '';
		this.imageSrc = options.imageSrc ?? '/bitrix/js/biconnector/aha-moment/images/aha-moment-icon.png';
		this.backgroundImageSrc = '/bitrix/js/biconnector/aha-moment/images/aha-moment-icon-background.svg';
		this.popupAlignment = options.popupAlignment === 'start' ? 'start' : 'center';
		this.popupOffsetLeftAdjustment = Type.isNumber(options.popupOffsetLeftAdjustment)
			? options.popupOffsetLeftAdjustment
			: 0
		;
		this.showDelaySeconds = Type.isNumber(options.showDelaySeconds) && options.showDelaySeconds > 0
			? options.showDelaySeconds
			: 0
		;
		this.bindElement = this.resolveBindElement(options.bindElement);
		this.actions = this.normalizeActions(options.actions);
		this.popup = null;
		this.spotlight = null;
		this.content = null;
		this.isShown = false;
		this.isViewed = false;
		this.showTimeoutId = null;
	}

	resolveBindElement(bindElement)
	{
		if (Type.isDomNode(bindElement))
		{
			return bindElement;
		}

		if (Type.isStringFilled(bindElement))
		{
			return document.querySelector(bindElement);
		}

		return null;
	}

	setBindElement(bindElement)
	{
		this.bindElement = this.resolveBindElement(bindElement);

		if (this.popup)
		{
			this.popup.setBindElement(this.bindElement);
		}

		if (this.spotlight && this.bindElement)
		{
			this.spotlight.setTargetElement(this.bindElement);
		}
	}

	setActions(actions = [])
	{
		this.actions = this.normalizeActions(actions);
		this.content = null;

		if (this.popup)
		{
			this.popup.setContent(this.getContent());
			this.popup.adjustPosition();
		}
	}

	show()
	{
		if (
			!this.canShow
			|| this.isShown
			|| this.showTimeoutId !== null
			|| !Type.isDomNode(this.bindElement)
			|| !BX.SpotLight
		)
		{
			return;
		}

		if (this.showDelaySeconds > 0)
		{
			this.showTimeoutId = window.setTimeout(() => {
				this.showTimeoutId = null;
				this.showNow();
			}, this.showDelaySeconds * 1000);

			return;
		}

		this.showNow();
	}

	close()
	{
		this.cancelScheduledShow();
		this.markAsViewed();
		this.isShown = false;
		this.popup?.close();
		this.closeSpotlight();
	}

	markAsViewed()
	{
		if (!this.spotlight && this.canShow && Type.isDomNode(this.bindElement) && BX.SpotLight)
		{
			this.createSpotlight();
		}

		if (this.isViewed || !this.spotlight || !Type.isFunction(this.spotlight.save))
		{
			return;
		}

		this.spotlight.save();
		this.isViewed = true;
		this.canShow = false;
	}

	showNow()
	{
		if (!this.canShow || this.isShown || !Type.isDomNode(this.bindElement) || !BX.SpotLight)
		{
			return;
		}

		this.createSpotlight();
		this.createPopup();

		this.spotlight.show();
		this.popup.show();
		this.isShown = true;
	}

	createSpotlight()
	{
		if (this.spotlight)
		{
			return;
		}

		this.spotlight = new BX.SpotLight({
			id: this.id,
			targetElement: this.bindElement,
			targetVertex: 'middle-center',
			lightMode: true,
			autoSave: false,
			zIndex: 1500,
		});
	}

	createPopup()
	{
		if (this.popup)
		{
			return;
		}

		const popupContent = this.getContent();
		const popupWidth = this.getPopupWidth();
		const offsetLeft = this.getPopupOffsetLeft(popupWidth);
		const angleOffset = this.getPopupAngleOffset(popupWidth);

		this.popup = new Popup({
			id: `${this.id}-popup`,
			className: 'biconnector-aha-moment-popup',
			bindElement: this.bindElement,
			content: popupContent,
			padding: 0,
			contentPadding: 0,
			bindOptions: {
				position: 'bottom',
				forceBindPosition: true,
			},
			angle: {
				position: 'top',
				offset: angleOffset,
			},
			offsetLeft,
			offsetTop: 8,
			autoHide: true,
			closeByEsc: true,
			closeIcon: true,
			cacheable: false,
			animation: 'fading-slide',
			events: {
				onPopupClose: () => {
					this.markAsViewed();
					this.isShown = false;
					this.closeSpotlight();
				},
				onPopupDestroy: () => {
					this.popup = null;
					this.content = null;
				},
			},
		});
	}

	getPopupWidth()
	{
		return Math.min(400, Math.max(0, window.innerWidth - 32));
	}

	getPopupOffsetLeft(popupWidth)
	{
		if (!Type.isDomNode(this.bindElement))
		{
			return 0;
		}

		if (this.popupAlignment === 'start')
		{
			return Popup.getOption('angleLeftOffset') + this.popupOffsetLeftAdjustment;
		}

		return Math.round(
			((this.bindElement.offsetWidth - popupWidth) / 2) + Popup.getOption('angleLeftOffset')
		) + this.popupOffsetLeftAdjustment;
	}

	getPopupAngleOffset(popupWidth)
	{
		if (this.popupAlignment === 'start' && Type.isDomNode(this.bindElement))
		{
			return Math.round(
				(this.bindElement.offsetWidth / 2)
				+ Popup.getOption('angleMinTop')
				- Popup.getOption('angleLeftOffset')
			) - this.popupOffsetLeftAdjustment;
		}

		return Math.round(
			(popupWidth / 2) + Popup.getOption('angleMinTop') - Popup.getOption('angleLeftOffset')
		) - this.popupOffsetLeftAdjustment;
	}

	getContent()
	{
		if (this.content)
		{
			return this.content;
		}

		const children = [
			Dom.create('div', {
				props: {
					className: 'biconnector-aha-moment__inner',
				},
				children: [
					Dom.create('div', {
						props: {
							className: 'biconnector-aha-moment__visual',
						},
						children: [
							Dom.create('div', {
								props: {
									className: 'biconnector-aha-moment__ellipse',
								},
							}),
							Dom.create('img', {
								props: {
									className: 'biconnector-aha-moment__img_background',
									src: this.backgroundImageSrc,
									alt: '',
								},
							}),
						],
					}),
					Dom.create('div', {
						props: {
							className: 'biconnector-aha-moment__logo-block',
						},
						children: [
							Dom.create('img', {
								props: {
									className: 'biconnector-aha-moment__image',
									src: this.imageSrc,
									alt: '',
								},
							}),
						],
					}),
					Dom.create('div', {
						props: {
							className: 'biconnector-aha-moment__content',
						},
						children: [
							Dom.create('div', {
								props: {
									className: 'biconnector-aha-moment__title',
								},
								text: this.title,
							}),
							Dom.create('div', {
								props: {
									className: 'biconnector-aha-moment__description',
								},
								text: this.description,
							}),
						],
					}),
				],
			}),
		];

		const actionsContainer = this.getActionsContainer();
		if (actionsContainer)
		{
			children.push(actionsContainer);
		}

		this.content = Dom.create('div', {
			props: {
				className: 'biconnector-aha-moment',
			},
			children,
		});

		return this.content;
	}

	getActionsContainer()
	{
		if (this.actions.length === 0)
		{
			return null;
		}

		return Dom.create('div', {
			props: {
				className: 'biconnector-aha-moment__actions',
			},
			children: this.actions.map((action) => this.createActionButton(action)),
		});
	}

	createActionButton(action)
	{
		const button = Dom.create('button', {
			props: {
				className: `biconnector-aha-moment__action biconnector-aha-moment__action--${action.style}`,
				type: 'button',
			},
			text: action.text,
		});

		Event.bind(button, 'click', () => {
			if (action.markAsViewed)
			{
				this.markAsViewed();
			}

			this.popup?.close();

			if (Type.isFunction(action.onclick))
			{
				action.onclick(this, action);
			}
		});

		return button;
	}

	normalizeActions(actions = [])
	{
		if (!Type.isArray(actions))
		{
			return [];
		}

		return actions
			.filter((action) => Type.isPlainObject(action) && Type.isStringFilled(action.text))
			.map((action) => ({
				text: action.text,
				style: action.style === 'primary' ? 'primary' : 'secondary',
				markAsViewed: action.markAsViewed !== false,
				onclick: Type.isFunction(action.onclick) ? action.onclick : null,
			}))
		;
	}

	closeSpotlight()
	{
		if (!this.spotlight)
		{
			return;
		}

		this.spotlight.close();
	}

	cancelScheduledShow()
	{
		if (this.showTimeoutId === null)
		{
			return;
		}

		window.clearTimeout(this.showTimeoutId);
		this.showTimeoutId = null;
	}
}
