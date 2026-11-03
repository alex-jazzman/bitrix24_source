import { Dom, Loc, Tag, Text } from 'main.core';
import { SidePanel, type Slider } from 'main.sidepanel';
import { createPinia, type Pinia, setActivePinia } from 'ui.vue3.pinia';
import { Wizard } from 'ui.wizard';

import { EmployeesStep } from './steps/employees-step';
import { type FormError, hasFieldErrors } from './steps/parameters-form';
import { ParametersStep } from './steps/parameters-step';
import { type ProcessEntry, RunProcessStepId, type RunProcessStore, useRunProcessStore } from './store';

import './style.css';

const SLIDER_WIDTH = 900;
const SLIDER_URL_PREFIX = 'sign-b2e-run-process-';

/**
 * Page of the catalog of the processes as the section addresses it - route `b2e_process_catalog`.
 */
const CATALOG_PATH = 'b2e/processes/catalog/';

const PRIMARY_BUTTON_CLASS = 'ui-btn-primary';
const SECONDARY_BUTTON_CLASS = 'ui-btn-light-border';

const STEP_TITLE_MESSAGE = Object.freeze({
	[RunProcessStepId.Parameters]: 'SIGN_B2E_RUN_PROCESS_STEP_PARAMETERS',
	[RunProcessStepId.Employees]: 'SIGN_B2E_RUN_PROCESS_STEP_EMPLOYEES',
});

/**
 * What one step tells the engine of the wizard. Declared here and not imported: `ui.wizard` carries no
 * types for TypeScript.
 */
type WizardStep = {
	get content(): HTMLElement,
	title: string,
	beforeCompletion?: () => Promise<boolean>,
};

type WizardMetadata = { [stepId: string]: WizardStep };

/**
 * One step of the slider as this extension writes it. Kept apart from `WizardStep`: the engine reads
 * `beforeCompletion` off the object and calls it having lost the receiver, so a step reaches it only
 * through an adapter.
 */
type RunProcessStep = {
	get content(): HTMLElement,
	title: string,
	beforeCompletion: () => Promise<boolean>,
};

export type RunProcessOptions = {
	onLaunched?: (launchId: number) => void,
};

/**
 * Slider of the launch of a process (TPL-10) - the single point both surfaces of the choice open. The
 * process comes from the outside, so there is no step of the choice inside: the breadcrumb is
 * "parameters - employees", and a process without start fields opens straight on the employees (AC-003).
 */
export class RunProcess
{
	static open(process: ProcessEntry, options: RunProcessOptions = {}): void
	{
		new RunProcess(process, options).#open();
	}

	#process: ProcessEntry;
	#options: RunProcessOptions;
	#pinia: Pinia = createPinia();
	#slider: Slider | null = null;
	#wizard: Wizard | null = null;
	#unsubscribeStore: (() => void) | null = null;
	#parametersStep: ParametersStep | null = null;
	#employeesStep: EmployeesStep | null = null;
	#launchButton: HTMLElement | null = null;

	private constructor(process: ProcessEntry, options: RunProcessOptions)
	{
		this.#process = process;
		this.#options = options;
	}

	/**
	 * The slider opens over the surface it was called from and closes nothing under itself (Q-5). Its url
	 * is virtual: the content is built here and the page of the launch does not exist on the server.
	 */
	#open(): void
	{
		SidePanel.Instance.open(`${SLIDER_URL_PREFIX}${this.#process.id}`, {
			width: SLIDER_WIDTH,
			cacheable: false,
			title: this.#process.name,
			contentCallback: (slider: Slider): HTMLElement => this.#render(slider),
			events: {
				onDestroy: (): void => this.#destroy(),
			},
		});
	}

	#render(slider: Slider): HTMLElement
	{
		this.#slider = slider;

		const store = this.#getStore();
		store.setProcess(this.#process);

		// the process may end without sending a document, so the button promises a launch and not a
		// sending (AC-004)
		const launchTitle = Loc.getMessage('SIGN_B2E_RUN_PROCESS_LAUNCH') ?? '';

		this.#wizard = new Wizard(this.#getStepsMetadata(store.steps), {
			back: { className: SECONDARY_BUTTON_CLASS },
			next: { className: PRIMARY_BUTTON_CLASS },
			complete: {
				className: PRIMARY_BUTTON_CLASS,
				title: launchTitle,
				onComplete: (): void => this.#complete(),
			},
			cancel: {
				className: SECONDARY_BUTTON_CLASS,
				onCancel: (): void => this.#closeSlider(),
			},
			swapButtons: true,
		});

		const wizardLayout = this.#wizard.getLayout();
		this.#launchButton = findLaunchButton(wizardLayout, launchTitle);

		// the title is drawn a second time on purpose and read once: the header of the slider carries the
		// same name already
		const layout = Tag.render`
			<div class="sign-b2e-run-process" data-testid="sign-b2e-run-process">
				<span class="sign-b2e-run-process__title" aria-hidden="true">${Text.encode(this.#process.name)}</span>
				${wizardLayout}
			</div>
		`;

		if (!store.hasBreadcrumbs)
		{
			Dom.addClass(layout, '--single-step');
		}

		this.#wizard.moveOnStep(0);
		this.#subscribeStore();

		return layout;
	}

	#getStepsMetadata(steps: RunProcessStepId[]): WizardMetadata
	{
		return Object.fromEntries(
			steps.map((stepId: RunProcessStepId) => [stepId, this.#getStepMetadata(stepId)]),
		);
	}

	/**
	 * Content and validation of one step. A step brings its own layout into the container and its own
	 * `beforeCompletion`; the composition, the titles and the buttons stay with the slider.
	 */
	#getStepMetadata(stepId: RunProcessStepId): WizardStep
	{
		const title = Loc.getMessage(STEP_TITLE_MESSAGE[stepId]) ?? '';

		if (stepId === RunProcessStepId.Parameters)
		{
			this.#parametersStep = new ParametersStep({ title, store: this.#getStore() });

			return toWizardStep(this.#parametersStep);
		}

		this.#employeesStep = new EmployeesStep({
			title,
			store: this.#getStore(),
			onLaunchRefused: (errors: FormError[]): boolean => this.#returnToParameters(errors),
		});

		return toWizardStep(this.#employeesStep);
	}

	/**
	 * A launch the server refused over the start fields belongs back on the form of them: the officer is
	 * shown which field was not taken and the wizard walks back to it (ERR-003). A refusal about anything
	 * else is left to the step it happened on.
	 */
	#returnToParameters(errors: FormError[]): boolean
	{
		if (!hasFieldErrors(errors))
		{
			return false;
		}

		// the step goes back on the screen before the messages are put on it: the form returns the focus
		// to the refused control, and a control outside the document has nothing to take
		this.#wizard?.moveOnStep(0);

		return this.#parametersStep?.showParameterErrors(errors) ?? false;
	}

	/**
	 * The last step is over. Only a launch that happened takes the catalog under the slider down with it
	 * (Q-5): a wizard left with nothing started keeps the choice of the process where it was.
	 */
	#complete(): void
	{
		const { launchId } = this.#getStore();
		if (launchId === null)
		{
			this.#closeSlider();

			return;
		}

		this.#closeCatalogSlider();
		this.#closeSlider();
		this.#options.onLaunched?.(launchId);
	}

	#closeCatalogSlider(): void
	{
		const previousSlider = SidePanel.Instance.getPreviousSlider(this.#slider);
		if (previousSlider !== null && isProcessCatalogUrl(previousSlider.getUrl()))
		{
			previousSlider.close();
		}
	}

	#closeSlider(): void
	{
		this.#slider?.close();
	}

	#subscribeStore(): void
	{
		this.#unsubscribeStore = this.#getStore().$subscribe(() => this.#syncLaunchButton());
		this.#syncLaunchButton();
	}

	/**
	 * `ui.wizard` paints an unavailable button by a class alone, so the button is left in the tab order with
	 * the same name and the press it refuses is reached anyway. The step answers the press; the state of the
	 * button is said here.
	 */
	#syncLaunchButton(): void
	{
		const shouldDisable = !this.#getStore().canLaunch;

		this.#wizard?.toggleBtnActiveState('complete', shouldDisable);
		Dom.attr(this.#launchButton, 'aria-disabled', shouldDisable ? 'true' : null);
	}

	#destroy(): void
	{
		this.#unsubscribeStore?.();
		this.#unsubscribeStore = null;
		this.#parametersStep?.destroy();
		this.#parametersStep = null;
		this.#employeesStep?.destroy();
		this.#employeesStep = null;
		this.#launchButton = null;
	}

	/**
	 * The state belongs to this slider alone: its own pinia is made active before every read, so a second
	 * open slider never answers for this one.
	 */
	#getStore(): RunProcessStore
	{
		setActivePinia(this.#pinia);

		return useRunProcessStore();
	}
}

/**
 * The step as `ui.wizard` takes it. The engine destructures `beforeCompletion` out of the metadata and
 * calls it on its own (`const { beforeCompletion } = this.#metadata[stepName]`), so a method handed over
 * as it is would run without its object and reach none of the private state of the step.
 */
function toWizardStep(step: RunProcessStep): WizardStep
{
	return {
		get content(): HTMLElement
		{
			return step.content;
		},
		title: step.title,
		beforeCompletion: (): Promise<boolean> => step.beforeCompletion(),
	};
}

/**
 * The button of the launch as its own wizard holds it: `ui.wizard` keeps the nodes of its buttons private,
 * so the button is taken off the layout of that wizard alone and by the title this slider itself gave it.
 * Called before the first step is rendered, while the footer is all the layout has of buttons.
 */
function findLaunchButton(wizardLayout: HTMLElement, title: string): HTMLElement | null
{
	if (title === '')
	{
		return null;
	}

	const buttons = [...wizardLayout.querySelectorAll<HTMLButtonElement>('button')];

	return buttons.find((button: HTMLButtonElement) => button.title === title) ?? null;
}

/**
 * The slider under this one is closed only when it really is the catalog of the processes. The check is
 * strict on purpose: `indexOf(...)` in a boolean context answers backwards - -1 for a miss and 0 for a hit
 * at the start of the string (Q-5).
 */
function isProcessCatalogUrl(url: string): boolean
{
	const [path] = url.split(/[#?]/);

	return path.endsWith(CATALOG_PATH);
}
