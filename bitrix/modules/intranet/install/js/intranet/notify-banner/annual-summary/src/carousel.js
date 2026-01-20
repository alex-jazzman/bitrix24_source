import { Dom, Event, Tag, Type } from 'main.core';
import { Popup } from 'main.popup';
import { AirButtonStyle, Button } from 'ui.buttons';
import { AvatarRound } from 'ui.avatar';
import type { Analytic } from './analytic';

export class Carousel
{
	#position = {
		left: 1,
		right: -1,
	};

	#popup: Popup;
	#container: HTMLElement;
	#leftControl: HTMLElement;
	#rightControl: HTMLElement;
	#navigation: Navigation;
	#canClose: boolean;
	#userpicPath: string;
	#showOverlay: boolean;
	#analytic: ?Analytic;

	constructor(options = {})
	{
		this.#container = Tag.render`<div class="intranet-year-results-popup__slide-wrapper"></div>`;
		this.#canClose = options.canClose !== false;
		this.#showOverlay = options.showOverlay ?? true;
		this.#leftControl = Tag.render`<div class="intranet-year-results-popup__sidepanel-wrapper"></div>`;
		this.#rightControl = Tag.render`<div class="intranet-year-results-popup__sidepanel-wrapper"></div>`;
		this.#userpicPath = options.userpicPath;
		this.#popup = this.#createPopup();
		this.#navigation = options.navigation;
		this.#analytic = options.analytic;

		if (options?.isUseArrowNavigation !== false)
		{
			Event.bind(document, 'keydown', (event) => {
				if (this.#popup.isShown() && event.key === 'ArrowLeft')
				{
					this.left();
					event.preventDefault();
				}
				else if (this.#popup.isShown() && event.key === 'ArrowRight')
				{
					this.right();
					event.preventDefault();
				}
			});
		}

		this.subscribe('onShow', () => {
			this.#analytic?.show(this.#navigation.position().index(), this.#navigation.position().featureType());
		});
		this.subscribe('onClose', () => {
			this.#analytic?.close(this.#navigation.position().index(), this.#navigation.position().featureType());
		});
	}

	hasLeft(): boolean
	{
		return !Type.isNil(this.#navigation.position(-1));
	}

	hasRight(): boolean
	{
		return !Type.isNil(this.#navigation.position(1));
	}

	left(): void
	{
		if (!this.hasLeft())
		{
			return;
		}
		this.#middleCardTo(this.#position.left);
		this.#showCard(this.#position.right);
		this.#addCardToLeft();
		this.#navigation.previous();
		this.#updateControls();
		this.#analytic?.prev(this.#navigation.position().index(), this.#navigation.position().featureType());
	}

	right(): void
	{
		if (!this.hasRight())
		{
			return;
		}
		this.#middleCardTo(this.#position.right);
		this.#showCard(this.#position.left);
		this.#addCardToRight();
		this.#navigation.next();
		this.#updateControls();
		this.#analytic?.next(this.#navigation.position().index(), this.#navigation.position().featureType());
	}

	show(): void
	{
		this.#popup.show();
		this.#navigation.position(-1)?.addClassToContent('intranet-year-results-popup__slide--slide-out-left');
		Dom.append(this.#navigation.position(-1)?.cachedContent(), this.#container);

		Dom.append(this.#navigation.position()?.cachedContent(), this.#container);

		this.#navigation.position(1)?.addClassToContent('intranet-year-results-popup__slide--slide-out-right');
		Dom.append(this.#navigation.position(1)?.cachedContent(), this.#container);
		this.#updateControls();
	}

	close(): void
	{
		this.#popup.close();
	}

	subscribe(eventName, callback): void
	{
		this.#popup.subscribe(eventName, callback);
	}

	#showCard(position: number): void
	{
		this.#navigation.position(position)?.removeClassFromContent([
			'intranet-year-results-popup__slide--slide-out-left',
			'intranet-year-results-popup__slide--slide-out-right',
		]);
	}

	#middleCardTo(side: number): void
	{
		this.#navigation.position(side)?.destroy();
		if (side === this.#position.left)
		{
			this.#navigation.position()?.addClassToContent('intranet-year-results-popup__slide--slide-out-right');
		}
		else if (side === this.#position.right)
		{
			this.#navigation.position()?.addClassToContent('intranet-year-results-popup__slide--slide-out-left');
		}
	}

	#addCardToRight(): void
	{
		this.#navigation.position(2)?.addClassToContent('intranet-year-results-popup__slide--slide-out-right');
		Dom.append(this.#navigation.position(2)?.cachedContent(), this.#container);
	}

	#addCardToLeft(): void
	{
		this.#navigation.position(-2)?.addClassToContent('intranet-year-results-popup__slide--slide-out-left');
		Dom.prepend(this.#navigation.position(-2)?.cachedContent(), this.#container);
	}

	#createWrapper(): HTMLElement
	{
		return Tag.render`
			<div id="popup-content-base">
				<div class="intranet-year-results-popup__content">
					<div class="intranet-year-results-popup__header">
						<div class="intranet-year-results-popup__user">
							${this.#createAvatar()}
						</div>
						<div class="intranet-year-results-popup__header-wrapper">
							${this.#canClose ? this.closeButton() : ''}
						</div>
					</div>
					${this.#leftControl}
					${this.#container}
					${this.#rightControl}
				</div>
			</div>
		`;
	}

	#createPopup(): Popup
	{
		const popup = new Popup({
			closeByEsc: this.#canClose,
			content: this.#createWrapper(),
			padding: 0,
			className: 'intranet-year-results-popup',
			fixed: true,
			overlay: this.#showOverlay
				? {
					opacity: 100,
					backgroundColor: 'rgba(0, 32, 78, 0.46)',
				}
				: false,
			animation: {
				showClassName: 'intranet-year-results-popup__show-animation',
				closeAnimationType: 'transition',
			},
		});

		Event.bindOnce(popup.getPopupContainer(), 'animationend', () => {
			Dom.addClass(popup.getPopupContainer(), 'intranet-year-results-popup__show-animation-end');
		});

		return popup;
	}

	closeButton(): HTMLElement
	{
		const button = new Button({
			size: Button.Size.SMALL,
			style: AirButtonStyle.OUTLINE,
			useAirDesign: true,
			icon: BX.UI.IconSet.Outline.CROSS_L,
			className: '--ui-context-edge-dark intranet-year-results-popup__navigation-button',
			onclick: () => this.close(),
		});

		return button.render();
	}

	#createAvatar(): HTMLElement
	{
		if (Type.isStringFilled(this.#userpicPath))
		{
			const avatar = new AvatarRound({
				size: 84,
				userpicPath: this.#userpicPath,
			});

			return avatar.getContainer();
		}

		return '';
	}

	#createRightControl(): HTMLElement
	{
		const button = new Button({
			size: Button.Size.LARGE,
			style: AirButtonStyle.OUTLINE,
			useAirDesign: true,
			icon: BX.UI.IconSet.Outline.ARROW_RIGHT_M,
			className: '--ui-context-edge-dark intranet-year-results-popup__navigation-button',
			onclick: () => this.right(),
		});

		return button.render();
	}

	#createLeftControl(): HTMLElement
	{
		const button = new Button({
			size: Button.Size.LARGE,
			style: AirButtonStyle.OUTLINE,
			useAirDesign: true,
			icon: BX.UI.IconSet.Outline.ARROW_LEFT_M,
			className: '--ui-context-edge-dark intranet-year-results-popup__navigation-button',
			onclick: () => this.left(),
		});

		return button.render();
	}

	#updateControls(): void
	{
		Dom.clean(this.#leftControl);
		Dom.clean(this.#rightControl);
		if (this.#navigation.position(-1))
		{
			Dom.append(this.#createLeftControl(), this.#leftControl);
		}

		if (this.#navigation.position(1))
		{
			Dom.append(this.#createRightControl(), this.#rightControl);
		}
	}
}
