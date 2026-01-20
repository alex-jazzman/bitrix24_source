import { Tag, Type } from 'main.core';
import { BaseCache, MemoryCache } from 'main.core.cache';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { Popup } from 'main.popup';
import { BaseView } from './view/base-view';
import './popup.css';

export class ConnectPopup extends EventEmitter
{
	#cache: BaseCache = new MemoryCache();
	#view: BaseView;
	#viewCollection: Array = [];

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
				const viewCode = event.getData()?.viewCode;
				const options = event.getData()?.options;
				Type.isStringFilled(viewCode, this.getViewByCode(viewCode))
					? this.changeView(this.getViewByCode(viewCode), options)
					: this.nextView(options);
			});
			view.subscribe('onPreviousView', (event) => {
				const viewCode = event.getData()?.viewCode;
				const options = event.getData()?.options;
				Type.isStringFilled(viewCode, this.getViewByCode(viewCode))
					? this.changeView(this.getViewByCode(viewCode), options)
					: this.previousView(options);
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
		return new Popup({
			content: this.#renderContent(),
			width: 700,
			closeByEsc: true,
			contentColor: 'white',
			autoHide: true,
			closeIcon: true,
			events: {
				onPopupShow: () => {
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
