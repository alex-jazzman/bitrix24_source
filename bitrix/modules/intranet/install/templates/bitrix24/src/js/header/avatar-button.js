import { Event, Runtime, Type, ajax, Dom, Loc } from 'main.core';
import { BaseCache, MemoryCache } from 'main.core.cache';
import { EventEmitter } from 'main.core.events';
import { Counter, CounterStyle } from 'ui.cnt';
import { LiveAnnouncer } from 'ui.a11y';
import { WidgetLoader } from 'intranet.widget-loader';
import { AvatarWidget } from 'intranet.avatar-widget';
import { PULL } from 'pull.client';
import { WorkTimeStateIcon } from 'timeman.work-time-state-icon';

type AvatarButtonOptions = {
	messages: { [string]: string },
	userId: number,
	skeleton: Object,
	signDocumentsCounter: number,
	signDocumentsPullEventName: string,
	verifyPhoneCounter: boolean,
	verifyPhonePullEventName: string,
	workTimeAvailable: boolean,
	workTimeState: string,
	workTimeAction: string,
}

export class AvatarButton
{
	static #avatarWrapper: HTMLElement;
	static #cache: BaseCache<any> = new MemoryCache();
	static #options: AvatarButtonOptions;

	static init(options: AvatarButtonOptions): void
	{
		Loc.setMessage(options.messages);
		this.#options = options;
		this.#avatarWrapper = document.querySelector('[data-id="bx-avatar-widget"]');
		Dom.attr(this.#avatarWrapper, 'aria-haspopup', 'dialog');
		Dom.attr(this.#avatarWrapper, 'aria-expanded', 'false');
		this.#updateAccessibleName();
		this.#setEventHandlerForChangeAvatar();

		if (this.#calculateCounterValue() > 0)
		{
			this.#showCounter();
		}

		this.#setEventHandlersForUpdateCounter();

		if (this.#options.workTimeAvailable)
		{
			this.#showWorkTimeState();
		}

		this.#setInitialClickHandler();
	}

	static #setInitialClickHandler(): void
	{
		Event.bind(this.#avatarWrapper, 'click', (event: MouseEvent) => {
			const focusFirst = event.detail === 0;
			Event.unbindAll(this.#avatarWrapper);
			this.#getWidgetLoader().getPopup().setFixed(true);
			this.#getWidgetLoader()
				.createSkeletonFromConfig(this.#options.skeleton)
				.show();
			this.#setLoadingState(true);
			this.#setHiddenAvatar();
			Runtime.loadExtension(['intranet.avatar-widget']).then(() => {
				this.#showWidget(focusFirst);
			}).catch(() => {
				this.#showLoadingError();
			});
		});
	}

	static #showWidget(focusFirst: boolean): void
	{
		this.#getContent().then((response) => {
			this.#getWidgetLoader().clearBeforeInsertContent();
			this.#setLoadingState(false);
			AvatarWidget.getInstance().setOptions({
				buttonWrapper: this.#avatarWrapper,
				loader: this.#getWidgetLoader().getPopup(),
				data: response.data,
			});
			this.#showAvatarWidget(focusFirst);
			Event.bind(this.#avatarWrapper, 'click', (event: MouseEvent) => {
				this.#showAvatarWidget(event.detail === 0);
			});
		}).catch((error) => {
			console.error(error);
			this.#showLoadingError();
		});
	}

	static #showAvatarWidget(focusFirst: boolean): void
	{
		AvatarWidget.getInstance().show({ focusFirst });
	}

	static #getWidgetLoader(): WidgetLoader
	{
		return this.#cache.remember('widgetLoader', () => {
			const loader = new WidgetLoader({
				id: 'bx-avatar-header-popup',
				bindElement: this.#avatarWrapper,
				className: 'intranet-avatar-widget-base-popup',
				width: 390,
				useAngle: false,
				fixed: true,
				offsetTop: -50,
				offsetLeft: 0,
				ariaLabel: Loc.getMessage('INTRANET_AVATAR_WIDGET_POPUP'),
				focusTrap: {
					initialFocus: false,
					isolateOutside: true,
				},
			});
			const popup = loader.getPopup();
			popup.subscribe('onClose', () => {
				this.#setVisibleAvatar();
				Dom.attr(this.#avatarWrapper, 'aria-expanded', 'false');
			});
			popup.subscribe('onShow', () => {
				this.#setHiddenAvatar();
				Dom.attr(this.#avatarWrapper, 'aria-expanded', 'true');
			});

			return loader;
		});
	}

	static #getContent(): Promise
	{
		return this.#cache.remember('content', () => {
			return new Promise((resolve, reject) => {
				ajax.runAction('intranet.user.widget.getContent')
					.then((response) => resolve(response))
					.catch((response) => reject(response))
				;
			});
		});
	}

	static #showCounter(): void
	{
		this.#getCounter().renderTo(this.#getCounterWrapper());
	}

	static #updateCounter(): void
	{
		if (this.#calculateCounterValue() > 0)
		{
			if (this.#cache.has('counter'))
			{
				this.#getCounter().update(this.#calculateCounterValue());
			}
			else
			{
				this.#showCounter();
			}
		}
		else if (this.#cache.has('counter'))
		{
			this.#getCounter().destroy();
			this.#cache.delete('counter');
		}

		this.#updateAccessibleName();
	}

	static #updateAccessibleName(): void
	{
		const label = [Loc.getMessage('INTRANET_AVATAR_WIDGET_OPEN_PROFILE')];
		const signDocumentsCounter = this.#options.signDocumentsCounter;

		if (signDocumentsCounter > 0)
		{
			label.push(Loc.getMessagePlural('INTRANET_AVATAR_WIDGET_SIGN_DOCUMENTS', signDocumentsCounter, {
				'#COUNT#': signDocumentsCounter,
			}));
		}

		if (this.#options.verifyPhoneCounter)
		{
			label.push(Loc.getMessage('INTRANET_AVATAR_WIDGET_VERIFY_PHONE'));
		}

		Dom.attr(this.#avatarWrapper, 'aria-label', label.filter(Boolean).join('. '));
	}

	static #setLoadingState(isLoading: boolean): void
	{
		const widgetLoader = this.#getWidgetLoader();
		const popupContainer = widgetLoader.getPopup().getPopupContainer();
		widgetLoader.setLoadingState(isLoading);
		Dom.attr(
			popupContainer,
			'aria-label',
			isLoading ? Loc.getMessage('INTRANET_AVATAR_WIDGET_LOADING') : Loc.getMessage('INTRANET_AVATAR_WIDGET_POPUP'),
		);
	}

	static #showLoadingError(): void
	{
		this.#cache.delete('content');
		this.#getWidgetLoader().clearSkeleton();
		this.#setLoadingState(false);
		this.#getWidgetLoader().getPopup().close();
		this.#setInitialClickHandler();
		LiveAnnouncer.announce(Loc.getMessage('INTRANET_AVATAR_WIDGET_LOAD_ERROR'), 'assertive');
	}

	static #setHiddenAvatar(): void
	{
		Dom.style(this.#avatarWrapper, 'opacity', '0');
	}

	static #setVisibleAvatar(): void
	{
		Dom.style(this.#avatarWrapper, 'opacity', '1');
	}

	static #showWorkTimeState(): void
	{
		this.#getWorkTimeState().renderTo(this.#getShortWorkTimeStateWrapper());
		this.#getWorkTimeState().subscribe('onUpdateState', (event) => {
			this.#updateStateButton(event.data);
		});
	}

	static #updateStateButton(config: { action: string, state: string }): void
	{
		let className = '';
		const stateClasses = [
			'--worktime-not-started',
			'--worktime-finished',
			'--worktime-not-finished',
			'--worktime-paused',
		];

		stateClasses.forEach((stateClass) => {
			Dom.removeClass(this.#avatarWrapper, stateClass);
		});

		switch (config.state)
		{
			case 'CLOSED':
				className = config.action === 'OPEN'
					? '--worktime-not-started'
					: '--worktime-finished';
				break;
			case 'EXPIRED':
				className = '--worktime-not-finished';
				break;
			case 'PAUSED':
				className = '--worktime-paused';
				break;
			default:
				className = '';
				break;
		}

		if (className)
		{
			Dom.addClass(this.#avatarWrapper, className);
		}
	}

	static #getCounterWrapper(): HTMLElement
	{
		return this.#cache.remember('counterWrapper', () => {
			return this.#avatarWrapper.querySelector('.air-user-profile-avatar__counter');
		});
	}

	static #getShortWorkTimeStateWrapper(): HTMLElement
	{
		return this.#cache.remember('workTimeStateWrapper', () => {
			return this.#avatarWrapper.querySelector('.air-user-profile-avatar__work-time-state-short');
		});
	}

	static #getCounter(): Counter
	{
		return this.#cache.remember('counter', () => {
			return new Counter({
				color: Counter.Color.DANGER,
				size: Counter.Size.MEDIUM,
				value: this.#calculateCounterValue(),
				useAirDesign: true,
				style: CounterStyle.FILLED_ALERT,
			});
		});
	}

	static #calculateCounterValue(): number
	{
		return this.#options.signDocumentsCounter + (this.#options.verifyPhoneCounter ? 1 : 0);
	}

	static #getWorkTimeState(): WorkTimeStateIcon
	{
		return this.#cache.remember('workTimeState', () => {
			return new WorkTimeStateIcon({
				state: this.#options.workTimeState,
				action: this.#options.workTimeAction,
			});
		});
	}

	static #setEventHandlersForUpdateCounter(): void
	{
		if (Type.isStringFilled(this.#options.signDocumentsPullEventName))
		{
			PULL.subscribe({
				moduleId: 'sign',
				command: this.#options.signDocumentsPullEventName,
				callback: (params) => {
					if (!Type.isNumber(params?.needActionCount))
					{
						return;
					}

					this.#options.signDocumentsCounter = params.needActionCount;
					this.#updateCounter();
				},
			});
		}

		if (Type.isStringFilled(this.#options.verifyPhonePullEventName))
		{
			PULL.subscribe({
				moduleId: 'intranet',
				command: this.#options.verifyPhonePullEventName,
				callback: () => {
					this.#options.verifyPhoneCounter = false;
					this.#updateCounter();
				},
			});
		}
	}

	static #setEventHandlerForChangeAvatar(): void
	{
		const avatar = this.#avatarWrapper.querySelector('.air-user-profile__avatar i');

		EventEmitter.subscribe(
			'BX.Intranet.UserProfile:Avatar:changed',
			(event) => {
				const data = event.getData()[0];
				const url = data && data.url ? data.url : '';
				const eventUserId = data && data.userId ? data.userId : 0;

				if (this.#options.userId === eventUserId && avatar)
				{
					avatar.style = Type.isStringFilled(url)
						? `background-size: cover; background-image: url('${encodeURI(url)}')`
						: ''
					;
				}
			},
		);
	}
}
