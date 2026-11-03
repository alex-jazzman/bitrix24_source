import { Loc, Tag, Type } from 'main.core';
import { BaseCache, MemoryCache } from 'main.core.cache';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { Popup } from 'main.popup';
import { BaseView } from './view/base-view';
import './popup.css';

const POPUP_MAX_WIDTH = 700;
const POPUP_SIDE_MARGIN = 16;

export const getPopupWidth = (viewWidth, viewportWidth) => {
	const popupMaxWidth = viewWidth ?? POPUP_MAX_WIDTH;
	const availableViewportWidth = Math.max(1, viewportWidth - POPUP_SIDE_MARGIN * 2);

	return Math.min(popupMaxWidth, availableViewportWidth);
};

export const isMobilePopup = (viewWidth) => Type.isNumber(viewWidth);

export class ConnectPopup extends EventEmitter
{
	#cache: BaseCache = new MemoryCache();
	#view: BaseView;
	#viewCollection: Array = [];
	#isClosed: boolean = false;

	constructor(options)
	{
		super();
		(Type.isArray(options.viewList) ? options.viewList : []).forEach((view) => {
			if (view instanceof BaseView)
			{
				this.#viewCollection.push(view);
			}
		});
		this.#view = Type.isStringFilled(options.viewCode)
			? this.getViewByCode(options.viewCode)
			: this.#getFirstView();

		this.#updateStepInfo();

		this.setEventNamespace('BX.Intranet.PushOtp.ConnectPopup');

		this.#viewCollection.forEach((view) => {
			view.subscribe('onNextView', (event) => {
				if (this.#isClosed)
				{
					return;
				}

				const viewCode = event.getData()?.viewCode;
				const fallbackViewCode = event.getData()?.fallbackViewCode;
				const options = event.getData()?.options;
				const targetView = Type.isStringFilled(viewCode) ? this.getViewByCode(viewCode) : null;
				const fallbackView = Type.isStringFilled(fallbackViewCode) ? this.getViewByCode(fallbackViewCode) : null;
				if (targetView)
				{
					this.changeView(targetView, options);
				}
				else if (fallbackView)
				{
					this.changeView(fallbackView, options);
				}
				else
				{
					this.nextView(options);
				}
			});
			view.subscribe('onPreviousView', (event) => {
				const viewCode = event.getData()?.viewCode;
				const options = event.getData()?.options;
				const targetView = Type.isStringFilled(viewCode) ? this.getViewByCode(viewCode) : null;
				targetView
					? this.changeView(targetView, options)
					: this.previousView(options);
			});
			view.subscribe('onParentClose', () => {
				this.close();
			});
		});
	}

	#updateStepInfo(): void
	{
		const viewsWithSteps = this.#viewCollection.filter((view) => !view.isExcludedFromSteps());
		const totalSteps = viewsWithSteps.length;

		let stepIndex = 0;
		this.#viewCollection.forEach((view) => {
			if (!view.isExcludedFromSteps())
			{
				stepIndex++;
				view.setStepInfo(stepIndex, totalSteps);
			}
		});
	}

	show(): void
	{
		this.#getPopup().show();
	}

	close(): void
	{
		this.#getPopup().close();
	}

	getView(): BaseView
	{
		return this.#view;
	}

	getViewByCode(viewCode: string): ?BaseView
	{
		for (const view of this.#viewCollection)
		{
			if (view.getId() === viewCode)
			{
				return view;
			}
		}

		return null;
	}

	#getPopup(): Popup
	{
		return this.#cache.remember('popup', () => {
			return this.#createPopup();
		});
	}

	#getNextView(): ?string
	{
		let result = null;
		this.#viewCollection.forEach((view, index) => {
			if (view.getId() === this.#view.getId())
			{
				const nextView = this.#viewCollection[index + 1];
				if (nextView)
				{
					result = nextView;
				}
			}
		});

		return result;
	}

	#getPreviousView(): ?string
	{
		let result = null;
		this.#viewCollection.forEach((view, index) => {
			if (view.getId() === this.#view.getId())
			{
				const previousView = this.#viewCollection[index - 1];
				if (previousView)
				{
					result = previousView;
				}
			}
		});

		return result;
	}

	#getFirstView(): ?BaseView
	{
		return this.#viewCollection[0];
	}

	changeView(view: BaseView, options: Object = {}): void
	{
		if (!(view instanceof BaseView))
		{
			return;
		}
		const prevView = this.#view;
		this.#view.beforeDismiss(options);
		this.#view = view;
		this.#view.beforeShow(options);
		this.reload();
		this.#view.afterShow(options);
		prevView.afterDismiss(options);
	}

	nextView(options: Object = {}): void
	{
		const view = this.#getNextView();
		if (view)
		{
			this.changeView(view, options);
		}
		else if (options.closeIfLast)
		{
			this.close();
		}
	}

	previousView(options: Object = {}): void
	{
		const view = this.#getPreviousView();
		if (view)
		{
			this.changeView(view, options);
		}
	}

	reload(): void
	{
		this.#getPopup().setContent(this.#renderContent());
	}

	#createPopup(): Popup
	{
		const viewWidth = this.#view.getPopupWidth();

		return new Popup({
			ariaLabel: Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_CONNECT_TITLE_MSGVER_1'),
			content: this.#renderContent(),
			width: getPopupWidth(viewWidth, window.innerWidth),
			closeByEsc: true,
			contentColor: 'white',
			autoHide: true,
			closeIcon: true,
			fixed: true,
			overlay: true,
			disableScroll: true,
			className: isMobilePopup(viewWidth) ? 'intranet-push-otp-connect-popup--mobile' : '',
			events: {
				onPopupShow: () => {
					this.#isClosed = false;
					this.emit(
						'onShow',
						{
							context: this,
							parent: this.#getPopup(),
						},
					);
					this.#view.afterShow();
				},
				onPopupClose: () => {
					this.#isClosed = true;
					this.#view.beforeDismiss();
					this.emit(
						'onClose',
						{
							context: this,
							parent: this.#getPopup(),
						},
					);
				},
			},
		});
	}

	#renderContent(): HTMLElement
	{
		return Tag.render`
			<div class="intranet-push-otp-connect-popup__popup-content">${this.#view.render()}</div>
		`;
	}
}
