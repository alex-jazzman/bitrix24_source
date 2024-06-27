import { ajax as Ajax, clone, Dom, Reflection, Runtime, Tag, Type } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { Popup, PopupManager } from 'main.popup';
import { Button } from 'ui.buttons';

const namespaceCrmWhatsNew = Reflection.namespace('BX.Crm.WhatsNew');

type SlideConfig = {
	title: string,
	innerImage: string,
	innerTitle: string,
	innerDescription: string,
	buttons: Array<ButtonConfig>,
};

type ButtonConfig = {
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

type StepConfig = {
	id: string,
	title: string,
	text: string,
	position: ?StepPosition,
	target: ?string,
	useDynamicTarget: ?boolean,
	eventName: ?string,
	article: ?number,
}

type Step = {
	id: string,
	title: string,
	text: string,
	position: ?StepPosition,
	target: ?string,
}

type Option = {
	showOverlayFromFirstStep?: boolean,
	hideTourOnMissClick?: boolean,
	numberOfViewsLimit:	number,
	isNumberOfViewsExceeded?: boolean,
	...
}

class ActionViewMode
{
	#slides: Array<Slide>;
	#steps: Array<Step>;
	#options: Option;

	#popup: ?Popup;

	#closeOptionName: string;
	#closeOptionCategory: string;

	#isViewHappened: boolean = false;

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
		if (stepsConfig.length > 0)
		{
			this.tourPromise = Runtime.loadExtension('ui.tour');
		}

		this.#steps = stepsConfig.map((stepConfig: StepConfig) => {
			const step = {
				id: stepConfig.id,
				title: stepConfig.title,
				text: stepConfig.text,
				position: stepConfig.position,
				article: stepConfig.article,
			};

			if (stepConfig.useDynamicTarget)
			{
				const eventName = (stepConfig.eventName ?? this.#getDefaultStepEventName(step.id));
				EventEmitter.subscribeOnce(eventName, this.#showStepByEvent.bind(this));
			}
			else
			{
				step.target = stepConfig.target;
			}

			return step;
		});
	}

	#showStepByEvent(event: BaseEvent): void
	{
		// eslint-disable-next-line promise/catch-or-return
		this.tourPromise.then((exports) => {
			const { stepId, target, delay } = event.data;
			// eslint-disable-next-line no-shadow
			const step = this.#steps.find((step) => step.id === stepId);
			if (!step)
			{
				console.error('step not found');

				return;
			}

			setTimeout(() => {
				step.target = target;
				const { Guide } = exports;
				const guide = this.createGuideInstance(Guide, [step], true);

				this.setStepPopupOptions(guide.getPopup());
				guide.showNextStep();
				this.save();
			}, delay || 0);
		});
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
		if (PopupManager && PopupManager.isAnyPopupShown())
		{
			return;
		}

		// eslint-disable-next-line promise/catch-or-return
		this.whatNewPromise.then((exports) => {
			const { WhatsNew } = exports;
			this.#popup = new WhatsNew({
				slides: this.#slides,
				popupOptions: {
					height: 440,
				},
				events: {
					onDestroy: () => {
						this.save();
						this.#executeGuide();
					},
				},
			});

			this.#popup.show();

			ActionViewMode.whatsNewInstances.push(this.#popup);
		}, this);
	}

	#executeGuide(): void
	{
		let steps = clone(this.#steps);

		steps = steps.filter((step) => Boolean(step.target));

		if (steps.length === 0)
		{
			return;
		}

		// eslint-disable-next-line promise/catch-or-return
		this.tourPromise.then((exports) => {
			if (PopupManager && PopupManager.isAnyPopupShown())
			{
				return;
			}

			const { Guide } = exports;
			const guide = this.createGuideInstance(Guide, steps, (this.#steps.length <= 1));

			if (ActionViewMode.tourInstances.find((existedGuide) => existedGuide.getPopup()?.isShown()))
			{
				return; // do not allow many guides at the same time
			}
			ActionViewMode.tourInstances.push(guide);

			this.setStepPopupOptions(guide.getPopup());

			if (guide.steps.length > 1 || this.#options.showOverlayFromFirstStep)
			{
				guide.start();
			}
			else
			{
				guide.showNextStep();
			}
			this.save();
		});
	}

	createGuideInstance(Guide, steps: Array<Step>, onEvents: boolean): Object
	{
		return new Guide({
			onEvents,
			steps,
			events: {
				onFinish: () => {
					if (this.#slides.length === 0)
					{
						this.save();
					}
				},
			},
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
