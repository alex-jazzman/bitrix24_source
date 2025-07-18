import { Dom, Loc, Tag, Type } from 'main.core';
import 'ui.hint';
import './style.css';

export type Metadata = {
	[key: string]: {
		get content(): HTMLElement;
		title: string;
		beforeCompletion?: () => Promise<boolean>;
	};
};

export type WizardOptions = {
	back?: {
		className?: string;
		titles?: {
			[$Keys<Metadata>]: string;
		};
	};
	next?: {
		className?: string;
		titles?: {
			[$Keys<Metadata>]: string;
		};
	};
	complete?: {
		className?: string;
		title?: string;
		onComplete?: Function;
	};
	cancel?: {
		title?: string;
		className?: string;
		onCancel?: () => void;
	};
	swapButtons: boolean;
};

export class Wizard
{
	#metadata: Metadata;
	#order: Array<$Keys<Metadata>>;
	#options: WizardOptions;
	#stepIndex: number;
	#stepNode: HTMLElement;
	#stages: Map<string, HTMLElement>;
	#navigationButtons: { [key: string]: HTMLElement };

	constructor(metadata: Metadata = {}, options: ?WizardOptions = {})
	{
		this.#metadata = metadata;
		this.#options = options;
		this.#order = Object.keys(metadata);
		this.#stepIndex = 0;
		this.#stepNode = Tag.render`<div class="sign-wizard__step"></div>`;
		this.#stages = new Map();
		this.#navigationButtons = this.#createNavigationButtons();
	}

	#createNavigationButtons(): { [key: string]: HTMLElement }
	{
		const classList = [
			'ui-btn',
			'ui-btn-lg',
			'ui-btn-round',
			'sign-wizard__footer_button',
		];

		const {
			back = {},
			next = {},
			complete = {},
			cancel = {},
			swapButtons = false,
		} = this.#options ?? {};

		const { title: completeTitle, onComplete, className: completeClassName } = complete;
		const { title: cancelTitle, onCancel, className: cancelClassName } = cancel;

		const backClassList = (back.className ?? '').split(' ');
		const nextClassList = (next.className ?? '').split(' ');
		const completeClassList = (completeClassName ?? '').split(' ');
		const cancelClassList = (cancelClassName ?? '').split(' ');

		const backButton = {
			id: 'back',
			title: Loc.getMessage('SIGN_WIZARD_FOOTER_BUTTON_BACK'),
			method: () => this.#onPrevStep(),
			buttonClassList: [...classList, ...backClassList],
		};
		const cancelButton = {
			id: 'cancel',
			title: cancelTitle ?? Loc.getMessage('SIGN_WIZARD_FOOTER_BUTTON_CANCEL'),
			method: async () => {
				const canceled = await this.#tryCompleteStep('cancel');
				if (canceled && onCancel)
				{
					onCancel();
				}
			},
			buttonClassList: [...classList, ...cancelClassList],
		};

		const buttons = [
			{
				id: 'next',
				title: Loc.getMessage('SIGN_WIZARD_FOOTER_BUTTON_NEXT'),
				method: () => this.#onNextStep(),
				buttonClassList: [...classList, ...nextClassList],
			},
			{
				id: 'complete',
				title: completeTitle ?? Loc.getMessage('SIGN_WIZARD_FOOTER_BUTTON_COMPLETE'),
				method: async () => {
					const completed = await this.#tryCompleteStep('complete');
					if (completed && onComplete)
					{
						onComplete();
					}
				},
				buttonClassList: [...classList, ...completeClassList],
			},
		];

		if (Object.keys(cancel).length > 0)
		{
			buttons.push(cancelButton);
		}

		if (swapButtons)
		{
			buttons.push(backButton);
		}
		else
		{
			buttons.unshift(backButton);
		}

		return buttons.reduce((acc, button) => {
			const {
				title,
				method,
				buttonClassList = classList,
				id,
			} = button;

			const node = Tag.render`
				<button
					class="${buttonClassList.join(' ')}"
					title="${title}"
					onclick="${method}"
				>
					${title}
				</button>
			`;
			acc[id] = node;

			return acc;
		}, {});
	}

	#createStages(): Map<String, HTMLElement>
	{
		const entries = Object.entries(this.#metadata);
		const stages = new Map();
		entries.forEach(([stepName, step]) => {
			const stage = Tag.render`
				<span class="sign-wizard__stages_item">
					${step.title}
				</span>
			`;
			stages.set(stepName, stage);
		});

		return stages;
	}

	#onPrevStep()
	{
		this.#stepIndex -= 1;
		this.moveOnStep(this.#stepIndex);
	}

	async #tryCompleteStep(buttonId: string = 'next'): Promise<boolean>
	{
		const stepName = this.#order[this.#stepIndex];
		const { beforeCompletion } = this.#metadata[stepName] ?? {};

		if (buttonId === 'cancel')
		{
			return true;
		}

		this.toggleBtnLoadingState(buttonId, true);
		const shouldComplete = await beforeCompletion?.() ?? true;
		this.toggleBtnLoadingState(buttonId, false);

		return shouldComplete;
	}

	async #onNextStep()
	{
		const completed = await this.#tryCompleteStep();
		if (completed)
		{
			this.#stepIndex += 1;
			this.moveOnStep(this.#stepIndex);
		}
	}

	#getButtonsTitle(): { [key: string]: string; }
	{
		const { back = {}, next = {} } = this.#options ?? {};
		const stepName = this.#order[this.#stepIndex];
		const backTitle = back.titles?.[stepName] ?? Loc.getMessage('SIGN_WIZARD_FOOTER_BUTTON_BACK');
		const nextTitle = next.titles?.[stepName] ?? Loc.getMessage('SIGN_WIZARD_FOOTER_BUTTON_NEXT');

		return {
			backTitle,
			nextTitle,
		};
	}

	#renderNavigationButtons()
	{
		const {
			back: backButton,
			next: nextButton,
			complete: completeButton,
			cancel: cancelButton,
		} = this.#navigationButtons;
		const isFirstStep = this.#stepIndex === 0;
		const isLastStep = this.#stepIndex + 1 === this.#order.length;
		Dom.removeClass(backButton, '--hide');
		Dom.removeClass(nextButton, '--hide');
		Dom.addClass(completeButton, '--hide');
		const { nextTitle, backTitle } = this.#getButtonsTitle(backButton, nextButton);
		backButton.textContent = backTitle;
		nextButton.textContent = nextTitle;
		if (isFirstStep)
		{
			Dom.addClass(backButton, '--hide');
		}

		if (isLastStep)
		{
			Dom.addClass(nextButton, '--hide');
			Dom.removeClass(completeButton, '--hide');
		}

		if (cancelButton)
		{
			if (isFirstStep)
			{
				Dom.removeClass(cancelButton, '--hide');
			}
			else
			{
				Dom.addClass(cancelButton, '--hide');
			}
		}
	}

	#renderActiveStage()
	{
		this.#stages.forEach((stageNode) => {
			Dom.removeClass(stageNode, '--active');
		});
		const stepName = this.#order[this.#stepIndex];
		const stageNode = this.#stages.get(stepName);
		Dom.addClass(stageNode, '--active');
	}

	#renderStep()
	{
		const stepName = this.#order[this.#stepIndex];
		const stepMetaData = this.#metadata[stepName];
		const { content, events: stepEvents } = stepMetaData ?? {};
		if (!content)
		{
			return;
		}

		if (Type.isFunction(stepEvents?.onBeforeRenderStep))
		{
			try
			{
				stepEvents.onBeforeRenderStep();
			}
			catch (e)
			{
				console.error('Error onBeforeRenderStep', e);
			}
		}

		Dom.clean(this.#stepNode);
		if (Type.isArrayFilled(content))
		{
			content.forEach((node) => Dom.append(node, this.#stepNode));
		}
		else
		{
			Dom.append(content, this.#stepNode);
		}
	}

	getLayout(): HTMLElement
	{
		this.#stages = this.#createStages();
		const content = Tag.render`
			<div class="sign-wizard__content">
				<div class="sign-wizard__stages">
					${[...this.#stages.values()]}
				</div>
				${this.#stepNode}
			</div>
		`;
		const footer = Tag.render`
			<div class="sign-wizard__footer">
				${Object.values(this.#navigationButtons)}
			</div>
		`;

		return Tag.render`
			<div class="sign-wizard__scope sign-wizard">
				${content}
				${footer}
			</div>
		`;
	}

	moveOnStep(step: number)
	{
		this.#stepIndex = step;
		this.#renderActiveStage();
		this.#renderNavigationButtons();
		this.#renderStep();
	}

	toggleBtnLoadingState(buttonId: string, loading: boolean)
	{
		const button = this.#navigationButtons[buttonId];
		if (loading)
		{
			Dom.addClass(button, 'ui-btn-wait');
		}
		else
		{
			Dom.removeClass(button, 'ui-btn-wait');
		}
	}

	toggleBtnActiveState(buttonId: string, shouldDisable: boolean)
	{
		const button = this.#navigationButtons[buttonId];
		if (shouldDisable)
		{
			Dom.addClass(button, 'ui-btn-disabled');
		}
		else
		{
			Dom.removeClass(button, 'ui-btn-disabled');
		}
	}
}
