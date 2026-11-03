import { Tag, Dom } from 'main.core';
import { BaseCache, MemoryCache } from 'main.core.cache';
import { EventEmitter } from 'main.core.events';
import { Popup, PopupManager, type PopupTargetOptions } from 'main.popup';
import { BitrixVue, VueCreateAppResult } from 'ui.vue3';

import { UserMiniProfileComponent } from './components/app';
import { MiniProfileDirection } from './type';
import type { UserMiniProfileOptions } from './type';
import { resolveViewportDirection } from './lib/resolve-popup-direction';
import type { PopupVerticalPosition } from './lib/resolve-popup-direction';
import { Tracking } from './utils/tracking';

import 'ui.design-tokens';
import './style.css';

export const PopupPrefixId = 'intranet-user-mini-profile-';
const FixedAngleOffset = 23;

export class UserMiniProfile
{
	#options: UserMiniProfileOptions;

	#cache: BaseCache = new MemoryCache();
	#tracking: Tracking;

	#app: VueCreateAppResult | null = null;
	#popupDirection: ?PopupVerticalPosition = null;

	#closeHandler: () => void = null;

	constructor(options: UserMiniProfileOptions)
	{
		this.#options = options;

		this.#tracking = new Tracking({
			popup: this.#getPopup(),
			bindElement: options.bindElement,
		});
		this.#closeHandler = () => this.close();

		this.#bindEvents();
	}

	destroy(): void
	{
		this.#tracking.unbindTracking();
		this.#getPopup().destroy();
		this.#app?.unmount();

		EventEmitter.unsubscribe('SidePanel.Slider:onOpen', this.#closeHandler);
		EventEmitter.unsubscribe('Intranet.User.MiniProfile:close', this.#closeHandler);
	}

	show(): void
	{
		this.#createAppIfNeed();

		const popup = this.#getPopup();
		if (!popup.isShown())
		{
			this.#popupDirection = null;
		}

		popup.show();
	}

	close(): void
	{
		this.#popupDirection = null;
		this.#getPopup().close();

		PopupManager.getPopups()
			.filter((popup) => popup.isShown() && popup.getId().includes(PopupPrefixId))
			.forEach((popup) => {
				popup.close();
			})
		;
	}

	setBindElement(element: ?HTMLElement): void
	{
		if (this.#options.bindElement === element)
		{
			return;
		}

		const popup = this.#getPopup();
		this.#popupDirection = null;
		popup.close();
		popup.setBindElement(element);
		this.#tracking.setBindElement(element);

		this.#options.bindElement = element;
	}

	setDirection(direction: ?string): void
	{
		if (this.#options.direction === direction)
		{
			return;
		}

		this.#options.direction = direction;
		this.#popupDirection = null;

		const popup = this.#getPopup();
		if (popup.isShown())
		{
			popup.adjustPosition();
		}
	}

	getBindElement(): ?HTMLElement
	{
		return this.#options.bindElement;
	}

	#getPopup(): Popup
	{
		return this.#cache.remember('popup', () => {
			const popup = new Popup({
				className: 'intranet-user-mini-profile-popup',
				content: this.#getContainer(),
				targetContainer: document.body,
				bindElement: this.#options.bindElement,
				maxWidth: 643,
				maxHeight: 517,
				padding: 0,
				contentNoPaddings: true,
				angle: {
					offset: Dom.getPosition(this.#options.bindElement).width / 2 + FixedAngleOffset,
				},
				animation: 'fading',
				bindOptions: this.#getBindOptions(),
			});

			this.#interceptAdjustPosition(popup);

			return popup;
		});
	}

	// the direction is read on every call: an anchor may ask for another one after the popup has been created
	#interceptAdjustPosition(popup: Popup): void
	{
		const adjustPosition = popup.adjustPosition.bind(popup);
		popup.adjustPosition = (targetOptions?: PopupTargetOptions) => {
			if (this.#options.direction !== MiniProfileDirection.Viewport)
			{
				// own bind options, otherwise the popup keeps the side the viewport branch has left in them
				adjustPosition(targetOptions ?? this.#getBindOptions());

				return;
			}

			const bindOptions = this.#getBindOptions();
			bindOptions.position = this.#popupDirection ?? bindOptions.position;

			adjustPosition(bindOptions);

			if (popup.isShown() && this.#popupDirection === null)
			{
				this.#popupDirection = popup.isBottomAngle() ? 'top' : 'bottom';
			}
		};
	}

	#getBindOptions(): Object
	{
		const defaultOptions = {
			forceBindPosition: true,
			forceTop: true,
			position: 'top',
		};

		const { bindElement, direction } = this.#options;
		if (direction !== MiniProfileDirection.Viewport || !bindElement)
		{
			return defaultOptions;
		}

		const rect = bindElement.getBoundingClientRect();
		const anchorCenterY = rect.top + rect.height / 2;

		return {
			...defaultOptions,
			position: resolveViewportDirection(anchorCenterY, window.innerHeight),
		};
	}

	#getContainer(): HTMLElement
	{
		return this.#cache.remember('container', () => {
			return Tag.render`
				<div class="intranet-user-mini-profile --ui-context-content-light"></div>
			`;
		});
	}

	#createAppIfNeed(): void
	{
		if (this.#app)
		{
			return;
		}

		const { userId } = this.#options;
		const popup = this.#getPopup();

		this.#app = BitrixVue.createApp(UserMiniProfileComponent, {
			userId,
			popup,
		});

		this.#app.mount(this.#getContainer());
	}

	#bindEvents(): void
	{
		this.#tracking.setupTracking();
		this.#tracking.subscribe('close', () => this.close());
		this.#tracking.subscribe('show', () => this.show());

		EventEmitter.subscribe('SidePanel.Slider:onOpen', this.#closeHandler);
		EventEmitter.subscribe('Intranet.User.MiniProfile:close', this.#closeHandler);
	}
}
