import { MemoryCache } from 'main.core.cache';
import type { BaseCache } from 'main.core.cache';
import { ajax, Event, Runtime, Type, Loc, Dom } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { InvitationWidgetCounter } from 'intranet.invitation-widget-counter';
import { WidgetLoader } from 'intranet.widget-loader';
import { InvitationWidget } from 'intranet.invitation-widget';

type SkeletonItemConfig = {
	type: 'item' | 'split',
	height: number,
};

type SkeletonConfig = {
	header: boolean,
	footer: boolean,
	items: SkeletonItemConfig[],
};

type InvitationButtonOptions = {
	skeleton: SkeletonConfig,
	counterId: string,
	invitationCounter: number,
	shouldShowStructureCounter: boolean,
	invitationLabel: string,
	loadingStatusText: string,
};

export class InvitationButton
{
	static #buttonWrapper: HTMLElement;
	static #button: HTMLElement;
	static #cache: BaseCache<any> = new MemoryCache();
	static #options: InvitationButtonOptions;
	static #loadAttemptCounter: number = 0;
	static #currentLoadAttempt: ?number = null;

	static init(options: InvitationButtonOptions): void
	{
		this.#options = options;
		this.#buttonWrapper = document.querySelector('[data-id="invitationButton"]');
		this.#button = this.#buttonWrapper.querySelector('button');

		this.#bindInitialClickHandler();
		this.#getInvitationCounter().setOptions({
			button: this.#buttonWrapper,
			counterId: this.#options.counterId,
			invitationCounter: this.#options.invitationCounter,
			shouldShowStructureCounter: this.#options.shouldShowStructureCounter,
			useAirDesign: true,
		});

		if (this.#options.invitationCounter > 0)
		{
			this.#getInvitationCounter().show();
		}

		this.#setEventHandlers();
	}

	static #bindInitialClickHandler(): void
	{
		Event.bind(this.#button, 'click', this.#getInitialClickHandler());
	}

	static #onInitialClick(): void
	{
		this.#unbindInitialClickHandler();
		const attempt = ++this.#loadAttemptCounter;
		this.#currentLoadAttempt = attempt;
		this.#setAriaExpanded(true);
		this.#getWidgetLoader()
			.createSkeletonFromConfig(this.#options.skeleton)
			.show();

		Runtime.loadExtension(['intranet.invitation-widget'])
			.then(() => this.#showWidget(attempt))
			.catch(() => this.#handleLoadingError(attempt))
		;
	}

	static #showWidget(attempt: number): Promise
	{
		if (!this.#isCurrentLoadAttempt(attempt))
		{
			return Promise.resolve();
		}

		return this.#getContent().then((response) => {
			if (!this.#isCurrentLoadAttempt(attempt))
			{
				return;
			}

			this.#currentLoadAttempt = null;
			this.#getWidgetLoader().clearBeforeInsertContent();
			InvitationWidget.getInstance().setOptions({
				button: this.#button,
				target: this.#buttonWrapper,
				loader: this.#getWidgetLoader().getPopup(),
				...response.data,
			}).show();
		});
	}

	static #handleLoadingError(attempt: number): void
	{
		if (!this.#isCurrentLoadAttempt(attempt))
		{
			return;
		}

		this.#currentLoadAttempt = null;
		const loader = this.#getWidgetLoader();
		loader.clearLoadingState();
		loader.getPopup().close();
		this.#cache.delete('content');
		this.#bindInitialClickHandler();
	}

	static #isCurrentLoadAttempt(attempt: number): boolean
	{
		return this.#currentLoadAttempt === attempt;
	}

	static #cancelCurrentLoadAttempt(): void
	{
		if (this.#currentLoadAttempt === null)
		{
			return;
		}

		this.#currentLoadAttempt = null;
		this.#getWidgetLoader().clearLoadingState();
		this.#cache.delete('content');
		this.#bindInitialClickHandler();
	}

	static #unbindInitialClickHandler(): void
	{
		Event.unbind(this.#button, 'click', this.#getInitialClickHandler());
	}

	static #getInitialClickHandler(): Function
	{
		return this.#cache.remember('initial-click-handler', () => this.#onInitialClick.bind(this));
	}

	static #getWidgetLoader(): WidgetLoader
	{
		return this.#cache.remember('widgetLoader', () => {
			const loader = new WidgetLoader({
				bindElement: this.#buttonWrapper,
				bindOnClick: false,
				width: 350,
				id: 'bx-invitation-header-popup',
				ariaLabel: this.#options.invitationLabel,
				loadingStatusText: this.#options.loadingStatusText,
				focusTrap: {
					initialFocus: false,
				},
			});

			const popup = loader.getPopup();
			popup.subscribe('onShow', () => {
				this.#setAriaExpanded(true);
			});
			popup.subscribe('onClose', () => {
				this.#setAriaExpanded(false);
				this.#cancelCurrentLoadAttempt();
			});

			return loader;
		});
	}

	static #setAriaExpanded(expanded: boolean): void
	{
		Dom.attr(this.#button, 'aria-expanded', expanded);
	}

	static #getContent(): Promise
	{
		return this.#cache.remember('content', () => {
			return new Promise((resolve, reject) => {
				ajax.runAction('intranet.invitationwidget.getData', {
					data: {},
					analyticsLabel: {
						headerPopup: 'Y',
					},
				})
					.then((response) => resolve(response))
					.catch((response) => reject(response))
				;
			});
		});
	}

	static #setEventHandlers(): void
	{
		EventEmitter.subscribe('onPullEvent-main', (event) => {
			const [command, params] = event.getCompatData();

			if (command === 'user_counter' && params[Loc.getMessage('SITE_ID')])
			{
				const value = params[Loc.getMessage('SITE_ID')][this.#options.counterId];

				if (Type.isNumber(value))
				{
					this.#getInvitationCounter().onReceiveCounterValue(value);
				}
			}
		});
	}

	static #getInvitationCounter(): InvitationWidgetCounter
	{
		return this.#cache.remember('invitation-counter', () => {
			return InvitationWidgetCounter.getInstance();
		});
	}
}
