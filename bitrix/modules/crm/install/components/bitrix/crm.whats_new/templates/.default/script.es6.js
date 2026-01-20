import { BannerDispatcher } from 'crm.integration.ui.banner-dispatcher';
import { ajax as Ajax, clone, Dom, Reflection, Runtime, Tag, Type } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { Popup, PopupManager } from 'main.popup';
import { Button } from 'ui.buttons';
import { Guide as UIGuide } from 'ui.tour';

const namespaceCrmWhatsNew = Reflection.namespace('BX.Crm.WhatsNew');

type SlideConfig = {
	title: string,
	innerImage: string,
	innerTitle: string,
	innerDescription: string,
	buttons: Array<SlideButtonConfig>,
};

type SlideButtonConfig = {
	text: string,
	className: string,
	onClickClose: ?boolean,
	helpDeskCode: ?string,
}

type Slide = {
	title: string,
	className: ?string,
	html: string,
}

type StepPosition = 'left' | 'right'; // it's bottom by default

type Highlighter = {
	target: string;
	radius?: number;
}

type ScrollBehavior = 'auto' | 'smooth';
type ScrollPosition = 'top' | 'center' | 'bottom' | 'nearest';
type Autoscroll = {
	behavior?: ScrollBehavior,
	position: ScrollPosition, // top|center|bottom|nearest,
}

type StepConfig = {
	id: string,
	title: string,
	text: string,
	position: ?StepPosition,
	target: ?string,
	reserveTargets: ?string[],
	useDynamicTarget: ?boolean,
	eventName: ?string,
	article: ?number,
	articleAnchor?: string,
	infoHelperCode: ?string,
	ignoreIfTargetNotFound: ?boolean,
	buttons: ?Array<StepButtonConfig>,
	highlighter?: Highlighter,
	autoscroll?: Autoscroll,
	iconSrc?: string,
}

type StepButtonConfig = {
	text: string,
	onclick: {
		code: ?string,
		closeAfterClick: ?boolean,
	},
};

type Step = {
	id: string,
	title: string,
	text: string,
	position: ?StepPosition,
	target: ?string,
	highlighter?: Highlighter,
	autoscroll?: Autoscroll,
}

type Option = {
	showOverlayFromFirstStep?: boolean,
	skipShownPopupCheck?: boolean,
	hideTourOnMissClick?: boolean,
	numberOfViewsLimit:	number,
	isNumberOfViewsExceeded?: boolean,
	disableBannerDispatcher?: boolean,
	additionalTourIdsForDisable?: Array<string>,
	canShowWithoutTarget?: boolean,
	...
}

class ActionViewMode
{
	#slides: Array<Slide>;
	#steps: Array<Step>;
	#options: Option;

	#popup: ?Popup;
	#bannerDispatcher: ?BannerDispatcher = null;

	#closeOptionName: string;
	#closeOptionCategory: string;

	#isViewHappened: boolean = false;
	#autoscroll: ?Autoscroll = null;

	constructor({ slides, steps, options, closeOptionCategory, closeOptionName })
	{
		this.#slides = [];
		this.#steps = [];

		this.#options = options;
		this.#popup = null;
		this.slideClassName = 'crm-whats-new-slides-wrapper';
		this.#closeOptionCategory = Type.isString(closeOptionCategory) ? closeOptionCategory : '';
		this.#closeOptionName = Type.isString(closeOptionName) ? closeOptionName : '';
		this.onClickClose = this.onClickCloseHandler.bind(this);

		this.whatNewPromise = null;
		this.tourPromise = null;

		this.#prepareSlides(slides);
		this.#prepareSteps(steps);
	}

	show(): void
	{
		if (this.#options.isNumberOfViewsExceeded)
		{
			// eslint-disable-next-line no-console
			console.warn('Number of views exceeded');

			return;
		}

		if (this.#slides.length > 0)
		{
			this.#executeWhatsNew();
		}
		else if (this.#steps.length > 0)
		{
			this.#executeGuide();
		}
	}

	#prepareSlides(slideConfigs: Array<SlideConfig>): void
	{
		if (slideConfigs.length > 0)
		{
			this.whatNewPromise = Runtime.loadExtension('ui.dialogs.whats-new');
		}

		this.#slides = slideConfigs.map((slideConfig: SlideConfig) => {
			return {
				className: this.slideClassName,
				title: slideConfig.title,
				html: this.#getPreparedSlideHtml(slideConfig),
			};
		});
	}

	#getPreparedSlideHtml(slideConfig: SlideConfig): HTMLElement
	{
		const slide = Tag.render`
			<div class="crm-whats-new-slide">
				<img src="${slideConfig.innerImage}" alt="">
				<div class="crm-whats-new-slide-inner-title"> ${slideConfig.innerTitle} </div>
				<p>${slideConfig.innerDescription}</p>
			</div>
		`;

		const buttons = this.#getPrepareSlideButtons(slideConfig);
		if (buttons.length > 0)
		{
			const buttonsContainer = Tag.render`<div class="crm-whats-new-slide-buttons"></div>`;
			Dom.append(buttonsContainer, slide);

			buttons.forEach((button) => {
				Dom.append(button.getContainer(), buttonsContainer);
			});
		}

		return slide;
	}

	async #getBannerDispatcher(): Promise<BannerDispatcher>
	{
		if (this.#bannerDispatcher)
		{
			return this.#bannerDispatcher;
		}

		const { BannerDispatcher: Dispatcher } = await Runtime.loadExtension('crm.integration.ui.banner-dispatcher');
		this.#bannerDispatcher = new Dispatcher();

		return this.#bannerDispatcher;
	}

	#getPrepareSlideButtons(slideConfig: SlideConfig): Button[]
	{
		let buttons = [];
		if (slideConfig.buttons)
		{
			const className = 'ui-btn ui-btn-primary ui-btn-hover ui-btn-round ';

			buttons = slideConfig.buttons.map((buttonConfig) => {
				const config = {
					className: className + (buttonConfig.className ?? ''),
					text: buttonConfig.text,
				};

				if (buttonConfig.onClickClose)
				{
					config.onclick = () => this.onClickClose();
				}
				else if (buttonConfig.helpDeskCode)
				{
					config.onclick = () => this.#showHelpDesk(buttonConfig.helpDeskCode);
				}

				return new Button(config);
			});
		}

		return buttons;
	}

	#prepareSteps(stepsConfig): void
	{
		this.#steps = stepsConfig.map((stepConfig: StepConfig) => {
			const step = {
				id: stepConfig.id,
				title: stepConfig.title,
				text: stepConfig.text,
				position: stepConfig.position,
				article: stepConfig.article,
				articleAnchor: stepConfig.articleAnchor ?? null,
				infoHelperCode: stepConfig.infoHelperCode,
				buttons: stepConfig.buttons,
				highlighter: stepConfig.highlighter ?? null,
				autoscroll: stepConfig.autoscroll ?? null,
				iconSrc: stepConfig.iconSrc ?? null,
			};

			if (stepConfig.useDynamicTarget)
			{
				const eventName = (stepConfig.eventName ?? this.#getDefaultStepEventName(step.id));
				EventEmitter.subscribeOnce(eventName, this.#showStepByEvent.bind(this));
			}
			else
			{
				const target = this.#getAvailableTarget(stepConfig.target);
				if (target && Dom.style(target, 'display') !== 'none')
				{
					step.target = stepConfig.target;
				}
				else if (Type.isArrayFilled(stepConfig.reserveTargets))
				{
					const isFound = stepConfig.reserveTargets.some((reserveTarget) => {
						const reserveTargetElement = this.#getAvailableTarget(reserveTarget);
						if (reserveTargetElement && Dom.style(reserveTargetElement, 'display') !== 'none')
						{
							step.target = reserveTarget;

							return true;
						}

						return false;
					});

					if (!isFound && stepConfig.ignoreIfTargetNotFound)
					{
						return null;
					}
				}
				else if (stepConfig.ignoreIfTargetNotFound)
				{
					return null;
				}
				else
				{
					step.target = stepConfig.target;
				}
			}

			return step;
		});

		this.#steps = this.#steps.filter((step: ?Object) => step !== null);
		if (this.#steps.length > 0)
		{
			this.tourPromise = Runtime.loadExtension('ui.tour');
		}
	}

	#showStepByEvent(event: BaseEvent): void
	{
		const { disableBannerDispatcher = false } = this.#options;

		void this.tourPromise.then((exports) => {
			const { stepId, target } = event.data;
			// eslint-disable-next-line no-shadow
			const step = this.#steps.find((step) => step.id === stepId);
			if (!step)
			{
				console.error('step not found');

				return;
			}

			step.target = target;
			const { Guide } = exports;
			const guide = this.createGuideInstance(Guide, [step], true);

			this.setStepPopupOptions(guide.getPopup());

			if (disableBannerDispatcher === false)
			{
				this.#runGuideWithBannerDispatcher(guide);
			}
			else
			{
				this.#runGuide(guide);
			}
		});
	}

	#runGuideWithBannerDispatcher(guide: Object): void
	{
		void this.#getBannerDispatcher().then((dispatcher: BannerDispatcher) => {
			dispatcher.toQueue((onDone: Function) => {
				this.#runGuide(guide, onDone);
			});
		});
	}

	#onGuideFinish(guide: Object, onDone: Function = null): void
	{
		guide.subscribe('UI.Tour.Guide:onFinish', () => {
			this.save();
			if (onDone)
			{
				onDone();
			}
		});
	}

	#runGuide(guide: Object, onDone: Function = null): void
	{
		let canShowGuide = !this.#isAnyPopupShown();
		const { target } = guide.steps[0];

		if (canShowGuide && Type.isStringFilled(target))
		{
			canShowGuide = this.#getAvailableTarget(target) !== null;
		}

		if (canShowGuide)
		{
			this.#onGuideFinish(guide, onDone);

			void this.#onBeforeShow(guide)
				.then(() => {
					guide.showNextStep();
				})
			;
		}
		else
		{
			onDone();
		}
	}

	#getAvailableTarget(target: ?string): HTMLElement
	{
		if (!Type.isStringFilled(target))
		{
			return null;
		}

		const targetNode = document.querySelector(target);

		return Type.isDomNode(targetNode) ? targetNode : null;
	}

	#getDefaultStepEventName(stepId: string): string
	{
		return `Crm.WhatsNew::onTargetSetted::${stepId}`;
	}

	#isMultipleViewsAllowed(): boolean
	{
		return this.#options.numberOfViewsLimit > 1;
	}

	onClickCloseHandler(): void
	{
		const lastPosition = this.#popup.getLastPosition();
		const currentPosition = this.#popup.getPositionBySlide(this.#popup.getCurrentSlide());
		if (currentPosition >= lastPosition)
		{
			this.#popup.destroy();
		}
		else
		{
			this.#popup.selectNextSlide();
		}
	}

	#showHelpDesk(code: string): void
	{
		if (top.BX.Helper)
		{
			top.BX.Helper.show(`redirect=detail&code=${code}`);
			event.preventDefault();
		}
	}

	#executeWhatsNew(): void
	{
		const { disableBannerDispatcher = false } = this.#options;

		if (this.#isAnyPopupShown())
		{
			return;
		}

		void this.whatNewPromise.then((exports) => {
			const { WhatsNew } = exports;
			this.#popup = new WhatsNew({
				slides: this.#slides,
				popupOptions: {
					height: 440,
				},
				events: {
					onDestroy: () => {
						this.save();
						this.#executeGuide(false);
					},
				},
			});

			if (disableBannerDispatcher === false)
			{
				// eslint-disable-next-line promise/no-nesting
				void this.#getBannerDispatcher().then((dispatcher: BannerDispatcher) => {
					dispatcher.toQueue((onDone: Function) => {
						this.#popup.subscribe('onDestroy', onDone);
						this.#popup.show();
					});
				});
			}
			else
			{
				this.#popup.show();
			}

			ActionViewMode.whatsNewInstances.push(this.#popup);
		}, this);
	}

	#executeGuide(isAddToQueue: boolean = true): void
	{
		const { disableBannerDispatcher = false } = this.#options;
		let steps = clone(this.#steps);

		steps = steps.filter((step) => Boolean(step.target));

		if (steps.length === 0)
		{
			return;
		}

		void this.tourPromise.then((exports) => {
			if (ActionViewMode.tourInstances.some((existedGuide) => existedGuide.getPopup()?.isShown()))
			{
				return; // do not allow many guides at the same time
			}

			if (this.#isAnyPopupShown())
			{
				return;
			}

			const { Guide } = exports;
			const guide = this.createGuideInstance(Guide, steps, (this.#steps.length <= 1));
			ActionViewMode.tourInstances.push(guide);

			this.setStepPopupOptions(guide.getPopup());

			if (isAddToQueue)
			{
				if (disableBannerDispatcher === false)
				{
					this.#runGuideWithBannerDispatcher(guide);
				}
				else
				{
					this.#runGuide(guide);
				}

				return;
			}

			this.#showGuide(guide);
		});
	}

	#isAnyPopupShown(): boolean
	{
		return PopupManager?.isAnyPopupShown();
	}

	#showGuide(guide: UIGuide): void
	{
		if (guide.steps.length > 1 || this.#options.showOverlayFromFirstStep)
		{
			guide.start();
		}
		else
		{
			guide.showNextStep();
		}
	}

	createGuideInstance(Guide, steps: Array<Step>, onEvents: boolean): Object
	{
		const guide = new Guide({
			onEvents,
			canShowWithoutTarget: this.#options.canShowWithoutTarget ?? false,
			steps: steps.map((step) => {
				let highlighter = null;
				if (Type.isPlainObject(step.highlighter))
				{
					highlighter = step.highlighter;
					// eslint-disable-next-line no-param-reassign
					delete step.highlighter;
				}

				if (Type.isPlainObject(step.autoscroll))
				{
					this.#autoscroll = step.autoscroll;
					// eslint-disable-next-line no-param-reassign
					delete step.autoscroll;
				}

				return {
					...step,
					// why here and not in prepareSteps?
					// we need a guide instance reference
					buttons: step.buttons?.map((button) => {
						return {
							text: button.text,
							event: () => {
								if (Type.isStringFilled(button.onclick?.code))
								{
									// eslint-disable-next-line no-eval
									eval(button.onclick.code);
								}

								if (button.onclick?.closeAfterClick)
								{
									guide.close();
								}
							},
						};
					}),
					events: {
						onShow: (event) => {
							const { data } = event;
							if (!data)
							{
								return;
							}

							// custom air design for single step tours. Remove after ui implemented
							if (data.guide.steps.length === 1)
							{
								let airClassList = 'crm-whats-new-slide-air';
								if (Type.isArrayFilled(data.guide.steps[0].buttons))
								{
									airClassList += ' --with-buttons';
								}

								if (Type.isStringFilled(data.guide.steps[0].iconSrc))
								{
									airClassList += ' --with-icon';
								}

								Dom.addClass(data.guide.getPopup().getPopupContainer(), airClassList);
							}

							if (!highlighter)
							{
								return;
							}

							void BX.Runtime.loadExtension('ui.system.highlighter').then(() => {
								document.querySelectorAll(highlighter.target).forEach((item) => {
									const element = Tag.render`<span class="ui-highlighter"></span>`;

									if (Type.isNumber(highlighter.radius))
									{
										Dom.style(element, '--ui-highlighter-radius', `${highlighter.radius}px`);
									}

									Dom.append(element, item);
								});
							});
						},
						onClose: () => {
							if (!highlighter)
							{
								return;
							}

							document.querySelectorAll(highlighter.target).forEach((item) => {
								Dom.remove(item.querySelector('.ui-highlighter'));
							});
						},
					},
				};
			}),
			events: {
				onFinish: () => {
					if (this.#slides.length === 0)
					{
						this.save();
					}
				},
			},
		});

		return guide;
	}

	#onBeforeShow(guide: UIGuide): Promise<void>
	{
		if (!Type.isPlainObject(this.#autoscroll))
		{
			return Promise.resolve();
		}

		const step = guide.steps[0];
		const targetNode = this.#getAvailableTarget(step.target);
		if (targetNode === null || this.#isVisibleTargetNode(targetNode))
		{
			return Promise.resolve();
		}

		let parentScrolledContainer = window;
		let parent = targetNode.parentElement;

		while (parent)
		{
			const style = window.getComputedStyle(parent);
			const overflowY = style.overflowY;

			if (
				(overflowY === 'auto' || overflowY === 'scroll')
				&& parent.scrollHeight >= parent.clientHeight
			)
			{
				parentScrolledContainer = parent;
				break;
			}

			parent = parent.parentElement;
		}

		return new Promise((resolve) => {
			const scrollTop = this.#getTargetNodeScrollTop(targetNode, parentScrolledContainer);

			if (this.#autoscroll.behavior === 'smooth' && 'scrollTo' in parentScrolledContainer)
			{
				void this
					.#scrollToWithPromise(parentScrolledContainer, { top: scrollTop, behavior: 'smooth' })
					.then(() => {
						resolve();
					})
				;
			}
			else
			{
				parent.scrollTop = scrollTop;
				guide.getPopup().adjustPosition({ forceBindPosition: true });
				resolve();
			}
		});
	}

	#isVisibleTargetNode(targetNode: HTMLElement): boolean
	{
		const rect = targetNode.getBoundingClientRect();

		return rect.top >= 0
			&& rect.left >= 0
			&& rect.bottom >= 0
			&& rect.bottom <= ((window.innerHeight || document.documentElement.clientHeight) - 200)
			&& rect.right <= ((window.innerWidth || document.documentElement.clientWidth) - 200)
		;
	}

	#getTargetNodeScrollTop(targetNode: HTMLElement, parentScrolledContainer: HTMLElement): number
	{
		const elementTop = targetNode.offsetTop;
		const elementHeight = targetNode.offsetHeight;
		const containerHeight = parentScrolledContainer.clientHeight;

		const block = this.#autoscroll.position ?? 'auto';

		const getMaxScrollTop = (scrollTop: number) => {
			return Math.max(0, Math.min(scrollTop, parentScrolledContainer.scrollHeight - containerHeight));
		};

		let scrollTop = parentScrolledContainer.scrollTop;

		if (block === 'start')
		{
			return getMaxScrollTop(elementTop);
		}

		if (block === 'center')
		{
			return getMaxScrollTop(elementTop + elementHeight / 2 - containerHeight / 2);
		}

		if (block === 'end')
		{
			return getMaxScrollTop(elementTop + elementHeight - containerHeight);
		}

		const currentViewTop = parentScrolledContainer.scrollTop;
		const currentViewBottom = currentViewTop + containerHeight;

		if (elementTop < currentViewTop)
		{
			scrollTop = elementTop;
		}
		else if (elementTop + elementHeight > currentViewBottom)
		{
			scrollTop = elementTop + elementHeight - containerHeight;
		}

		return getMaxScrollTop(scrollTop);
	}

	#scrollToWithPromise(element: HTMLElement, options: Object): Promise<void>
	{
		return new Promise((resolve) => {
			const targetTop = options.top ?? element.scrollTop;
			const targetLeft = options.left ?? element.scrollLeft;
			const behavior = options.behavior ?? 'auto';
			const tolerance = 1;

			if (behavior === 'auto')
			{
				element.scrollTo(options);
				resolve();

				return;
			}

			let lastTop = element.scrollTop;
			let lastLeft = element.scrollLeft;
			let stationaryFrames = 0;

			const isClose = (a: number, b: number): boolean => Math.abs(a - b) <= tolerance;

			const checkScrollEnd = () => {
				const currentTop = element.scrollTop;
				const currentLeft = element.scrollLeft;

				const reachedTarget = isClose(currentTop, targetTop) && isClose(currentLeft, targetLeft);
				const stoppedMoving = isClose(currentTop, lastTop) && isClose(currentLeft, lastLeft);

				if (reachedTarget && stoppedMoving)
				{
					stationaryFrames++;
					if (stationaryFrames >= 2)
					{
						resolve();

						return;
					}
				}
				else
				{
					stationaryFrames = 0;
				}

				lastTop = currentTop;
				lastLeft = currentLeft;

				requestAnimationFrame(checkScrollEnd);
			};

			element.scrollTo(options);

			requestAnimationFrame(checkScrollEnd);
		});
	}

	setStepPopupOptions(popup: Popup): void
	{
		const { steps, hideTourOnMissClick = false } = this.#options;

		popup.setAutoHide(hideTourOnMissClick);

		if (steps?.popup?.width)
		{
			popup.setWidth(steps.popup.width);
		}
	}

	save(): void
	{
		Ajax.runAction('crm.settings.tour.updateOption', {
			json: {
				category: this.#closeOptionCategory,
				name: this.#closeOptionName,
				options: {
					isMultipleViewsAllowed: !this.#isViewHappened && this.#isMultipleViewsAllowed(),
					numberOfViewsLimit: this.#options.numberOfViewsLimit ?? 1,
					additionalTourIdsForDisable: this.#options.additionalTourIdsForDisable ?? null,
				},
			},
		}).then(({ data }) => {
			this.#options.isNumberOfViewsExceeded = data.isNumberOfViewsExceeded;
			this.#isViewHappened = true;
		}).catch((errors) => {
			console.error('Could not save tour settings', errors);
		});
	}

	static tourInstances = [];
	static whatsNewInstances = [];
}

namespaceCrmWhatsNew.ActionViewMode = ActionViewMode;
