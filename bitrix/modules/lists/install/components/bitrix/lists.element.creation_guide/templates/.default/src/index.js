import { Dom, Loc, Reflection, Tag, Text, Type, ajax, Runtime, Uri, Event } from 'main.core';
import { DateTimeFormat } from 'main.date';
import { Button, ButtonSize, ButtonColor } from 'ui.buttons';
import { MessageBox } from 'ui.dialogs.messagebox';
import 'ui.tooltip';
import 'ui.icons.b24';

import {
	type StepInvalidField,
	StepFormsA11y,
	addStepHeading,
	announceStartResult,
	clearStepInvalidControls,
	focusStepError,
	focusStepHeading,
	hasFocusAboveFrame,
	hasFocusedElement,
	isolateInactiveSteps,
	makeActivatable,
	nameSliderDialog,
	visuallyHidden,
} from './a11y';

import './css/style.css';

const namespace = Reflection.namespace('BX.Lists.Component');

const HTML_ELEMENT_ID = 'lists-element-creation-guide';
const BP_STATE_FORM_NAME = 'lists_element_creation_guide_bp';
const BP_STATE_CONSTANTS_FORM_NAME = 'lists_element_creation_guide_bp_constants';
const AJAX_COMPONENT = 'bitrix:lists.element.creation_guide';

const CLOSE_SLIDER_AFTER_SECONDS = 1;
const MIN_STEPS_COUNT = 2;

// The focus takes the heading of the first step with a delay on purpose: the slider applies its own
// initial focus once the frame of the wizard has loaded and would take the focus straight back. The
// pause also keeps the heading out of the speech of the slider that has just opened.
const FIRST_STEP_FOCUS_DELAY = 1000;
// how long the wizard keeps waiting for the frame of the slider to get the focus after that pause
const FIRST_STEP_FOCUS_RETRY_DELAY = 200;
const FIRST_STEP_FOCUS_ATTEMPTS = 20;

const STEPS = Object.freeze({
	DESCRIPTION: 'description',
	CONSTANTS: 'constants',
	FIELDS: 'fields',
	STATUS: 'status',
});

const STEP_TITLE_MESSAGES = Object.freeze({
	[STEPS.DESCRIPTION]: 'LISTS_ELEMENT_CREATION_GUIDE_CMP_STEP_RECOMMENDATION',
	[STEPS.CONSTANTS]: 'LISTS_ELEMENT_CREATION_GUIDE_CMP_STEP_CONSTANTS',
	[STEPS.FIELDS]: 'LISTS_ELEMENT_CREATION_GUIDE_CMP_STEP_FIELDS',
	[STEPS.STATUS]: 'LISTS_ELEMENT_CREATION_GUIDE_CMP_STEP_STATUS',
});

const ERRORS = Object.freeze({
	NETWORK_ERROR: 'LISTS_ELEMENT_CREATION_GUIDE_CMP_NETWORK_ERROR',
});

const ERROR_MESSAGE_ID_PREFIX = `${HTML_ELEMENT_ID}-error`;
const ERROR_REGION_TEST_ID = `${HTML_ELEMENT_ID}-error-alert`;

// ui.button.panel marks a button by its type, and two of the three buttons here share one type:
// the wizard puts its own marks on them, by the ids it passes to the panel
const NAVIGATION_BUTTON_TEST_IDS = Object.freeze({
	[`${HTML_ELEMENT_ID}-back-button`]: `${HTML_ELEMENT_ID}-back-btn`,
	[`${HTML_ELEMENT_ID}-next-button`]: `${HTML_ELEMENT_ID}-next-btn`,
	[`${HTML_ELEMENT_ID}-create-button`]: `${HTML_ELEMENT_ID}-create-btn`,
});

function getStepTitle(step: string): string
{
	return Loc.getMessage(STEP_TITLE_MESSAGES[step]);
}

/**
 * The role lives on this node and not on the permanent container: a region that is always there
 * announces itself on every redraw of a step. The name of the region is a hidden text inside it
 * rather than an attribute on it, because some screen readers voice such a name instead of the content.
 * The node takes the focus of a rejected save when no control of the step can, hence the Tab-less stop.
 *
 * The mark comes from the outside: one region stands in every container that got a message, so a mark
 * of its own is the only way to address a single one of them.
 */
function renderErrorRegion(messageNodes: Array<HTMLElement>, testId: string): HTMLElement
{
	return Tag.render`
		<div role="alert" tabindex="-1" data-testid="${testId}">
			${visuallyHidden(Loc.getMessage('LISTS_ELEMENT_CREATION_GUIDE_CMP_ERRORS_LABEL'))}
			<div class="ui-alert ui-alert-danger">
				<span class="ui-alert-message">${separateWithLineBreaks(messageNodes)}</span>
			</div>
		</div>
	`;
}

function separateWithLineBreaks(nodes: Array<HTMLElement>): Array<HTMLElement>
{
	return nodes.flatMap((node, index) => (index === 0 ? [node] : [Tag.render`<br>`, node]));
}

type ComponentData = {
	name: string,
	description: string,
	duration: ?number,
	signedParameters: string,
	bpTemplateIds: [],
	hasFieldsToShow: boolean,
	hasStatesToTuning: boolean,
	canUserTuningStates: boolean,
	iBlockId: ?number,
};

type Step = {
	step: string,
	contentNode: HTMLElement,
	progressBarNode: HTMLElement,
	// the heading of the step, added for a screen reader only: the focus target of the step
	headingNode: ?HTMLElement,
};

type ComponentError = {
	code: string,
	message: string,
	// present on a validation error of a process parameter or constant only
	customData: ?{ parameter: string, templateId: number },
};

type ShownError = {
	error: ComponentError,
	messageId: string,
};

// the container a message goes to, together with the mark of the alert region of that container
type ErrorTarget = {
	container: HTMLElement,
	regionTestId: string,
};

type ErrorGroup = {
	container: HTMLElement,
	messageNodes: Array<HTMLElement>,
};

type RenderedErrors = {
	shownErrors: Array<ShownError>,
	// the first of the inserted alert nodes: the focus target of a rejected save with no control to take it
	errorRegion: ?HTMLElement,
};

class ElementCreationGuide
{
	#steps: Array<Step> = [];
	// every step container the markup renders, including the ones the active configuration skips
	#stepContainers: Array<HTMLElement> = [];

	#name: string;
	#description: string;
	#duration: ?number = null;
	#signedParameters: string;
	#templateIds: [] = [];
	#iBlockId: ?number = null;

	#currentStep: ?string;
	#startTime: number;
	#descriptionNode: HTMLElement;
	#durationNode: HTMLElement;
	#difference: number;
	#canUserTuningStates: boolean;
	#isAdminLoaded: boolean = false;
	#isLoading: boolean = false;
	#stepsEnterTime: Map<string, number> = new Map();
	#formData: FormData;
	#messageBox: MessageBox;
	#canClose: boolean = false;
	#formsA11y: StepFormsA11y = new StepFormsA11y({
		calendarButtonLabel: Loc.getMessage('LISTS_ELEMENT_CREATION_GUIDE_CMP_CALENDAR_BUTTON'),
		calendarButtonTestIdPrefix: `${HTML_ELEMENT_ID}-calendar-btn`,
	});

	constructor(props: ComponentData)
	{
		if (!Type.isStringFilled(props.signedParameters))
		{
			throw new TypeError('signedParameters must be filled string');
		}
		this.#signedParameters = props.signedParameters;
		this.#iBlockId = props.iBlockId;

		this.#name = Type.isString(props.name) ? props.name : '';
		this.#description = Type.isString(props.description) ? props.description : '';

		if (Type.isInteger(props.duration) && props.duration >= 0)
		{
			this.#duration = props.duration;
		}

		if (Type.isArrayFilled(props.bpTemplateIds))
		{
			this.#templateIds = props.bpTemplateIds;
		}

		this.#canUserTuningStates = Type.isBoolean(props.canUserTuningStates) ? props.canUserTuningStates : false;

		this.#startTime = Math.round(Date.now() / 1000);

		this.#setCurrentStep(STEPS.DESCRIPTION);
		this.#fillSteps(props);
		this.#markNavigationButtons();
		this.#toggleButtons();
		this.#renderProgressBar();
		this.#renderFirstStep();
		this.#initStepA11y();
		nameSliderDialog(Loc.getMessage('LISTS_ELEMENT_CREATION_GUIDE_CMP_DIALOG_LABEL'));

		Event.EventEmitter.subscribe('SidePanel.Slider:onClose', (event) => {
			if (event.target.getWindow() === window && this.#isChangedFormData() && !this.#canClose)
			{
				event.getCompatData()[0].denyAction();
				if (!this.#messageBox?.getPopupWindow().isShown())
				{
					this.#showConfirmDialog(event.target);
				}
			}
		});
	}

	#setCurrentStep(step: ?string): void
	{
		this.#currentStep = step;

		if (this.#currentStep === STEPS.DESCRIPTION)
		{
			this.#stepsEnterTime.set(STEPS.DESCRIPTION, Date.now());
		}
		else
		{
			if (this.#stepsEnterTime.has(STEPS.DESCRIPTION))
			{
				const diffTime = Date.now() - this.#stepsEnterTime.get(STEPS.DESCRIPTION);

				Runtime.loadExtension('ui.analytics')
					.then(({ sendData }) => {
						sendData({
							tool: 'automation',
							category: 'bizproc_operations',
							event: 'process_instructions_read',
							p1: this.#name,
							p4: Math.round(diffTime / 1000),
						});
					})
					.catch(() => {})
				;
			}

			this.#stepsEnterTime.delete(STEPS.DESCRIPTION);
		}

		if (this.#currentStep === STEPS.STATUS)
		{
			this.#renderStatusStep();
		}
	}

	#getCurrentStep(): Step
	{
		return this.#steps[this.#currentStepIndex];
	}

	get #currentStepIndex(): number
	{
		return this.#steps.findIndex((step) => step.step === this.#currentStep);
	}

	/**
	 * The step the wizard opens on gets its heading focused too: a change of step is not the only
	 * moment a user of a screen reader needs to know where the wizard stands.
	 */
	#initStepA11y(): void
	{
		const firstStep = this.#steps[0];

		this.#steps.forEach((step) => {
			step.headingNode = addStepHeading(step.contentNode, this.#getStepHeadingTitle(step));
		});

		isolateInactiveSteps(this.#stepContainers, firstStep.contentNode);
		this.#formsA11y.observeStepForms(firstStep.contentNode);

		setTimeout(
			() => this.#focusFirstStepHeading(firstStep, FIRST_STEP_FOCUS_ATTEMPTS),
			FIRST_STEP_FOCUS_DELAY,
		);
	}

	/**
	 * A focus() call on a document that holds no focus of its own does nothing, and the frame of the
	 * slider gets the focus later than the pause above (in Firefox by another half a second). So the
	 * attempt is judged by its result and repeated until it takes, instead of being made once by a timer.
	 */
	#focusFirstStepHeading(firstStep: Step, attemptsLeft: number): void
	{
		// a move to the next step takes over, and so does a user who has already put the focus on
		// something in the wizard on their own: until then no element of this document holds the focus.
		// The focus a user has taken above the frame of the wizard is left alone as well: the attempt is
		// repeated for almost five seconds, and any of those repeats would pull such a focus into the frame
		if (this.#currentStep !== firstStep.step || hasFocusedElement() || hasFocusAboveFrame())
		{
			return;
		}

		this.#focusStepHeading(firstStep);

		if (document.activeElement !== firstStep.headingNode && attemptsLeft > 1)
		{
			setTimeout(
				() => this.#focusFirstStepHeading(firstStep, attemptsLeft - 1),
				FIRST_STEP_FOCUS_RETRY_DELAY,
			);
		}
	}

	/**
	 * Isolation goes together with the visibility switch, while the focus waits for the fade-in
	 * (opacity transition, src/css/style.css). A cancelled fade means a newer step change took over.
	 */
	#switchStepA11y(previousStep: Step, nextStep: Step): void
	{
		this.#formsA11y.leaveStep(previousStep.contentNode);
		this.#formsA11y.observeStepForms(nextStep.contentNode);
		isolateInactiveSteps(this.#stepContainers, nextStep.contentNode);

		const fadeIn = nextStep.contentNode.getAnimations().map((animation) => animation.finished);
		Promise.all(fadeIn).then(
			() => {
				this.#focusStepHeading(nextStep);
			},
			() => {},
		);
	}

	#focusStepHeading(step: Step): void
	{
		// the status step closes the slider before any speech, and the start result is announced separately
		if (step.step === STEPS.STATUS)
		{
			return;
		}

		focusStepHeading(step.headingNode);
	}

	// the position of the step is part of its name: the step strip conveys it visually, and without it
	// a user of a screen reader loses the only bearing on how far the wizard has gone
	#getStepHeadingTitle(step: Step): string
	{
		return Loc.getMessage('LISTS_ELEMENT_CREATION_GUIDE_CMP_STEP_ANNOUNCEMENT', {
			'#CURRENT#': String(this.#steps.indexOf(step) + 1),
			'#TOTAL#': String(this.#steps.length),
			'#NAME#': getStepTitle(step.step),
		});
	}

	#fillSteps(props)
	{
		const contentNode = document.querySelectorAll('.list-el-cg__content >.list-el-cg__content-body');
		this.#stepContainers = [...contentNode];

		const showBPConstantsStep = Type.isBoolean(props.hasStatesToTuning) ? props.hasStatesToTuning : false;
		const showFieldsStep = Type.isBoolean(props.hasFieldsToShow) ? props.hasFieldsToShow : false;

		this.#steps.push({
			step: STEPS.DESCRIPTION,
			contentNode: contentNode.item(0),
			progressBarNode: null,
			headingNode: null,
		});

		if (showBPConstantsStep)
		{
			this.#steps.push({
				step: STEPS.CONSTANTS,
				contentNode: contentNode.item(1),
				progressBarNode: null,
				headingNode: null,
			});
		}

		if (showFieldsStep)
		{
			this.#steps.push({
				step: STEPS.FIELDS,
				contentNode: contentNode.item(2),
				progressBarNode: null,
				headingNode: null,
			});
		}

		this.#steps.push({
			step: STEPS.STATUS,
			contentNode: contentNode.item(3),
			progressBarNode: null,
			headingNode: null,
		});
	}

	#markNavigationButtons(): void
	{
		Object.entries(NAVIGATION_BUTTON_TEST_IDS).forEach(([buttonId, testId]) => {
			Dom.attr(document.getElementById(buttonId), 'data-testid', testId);
		});
	}

	#toggleButtons()
	{
		const backButton = document.getElementById(`${HTML_ELEMENT_ID}-back-button`);
		const nextButton = document.getElementById(`${HTML_ELEMENT_ID}-next-button`);
		const createButton = document.getElementById(`${HTML_ELEMENT_ID}-create-button`);

		this.#removeNotTunedConstantsHint(createButton);
		this.#removeNotTunedConstantsHint(nextButton);

		if (this.#isFirstStep())
		{
			const showNextStep = this.#steps.length > MIN_STEPS_COUNT;
			this.#hideButton(showNextStep ? createButton : nextButton);
			this.#showButton(showNextStep ? nextButton : createButton);
		}
		else if (this.#isLastStep())
		{
			this.#hideButton(nextButton);
			this.#showButton(createButton);
		}
		else
		{
			this.#hideButton(createButton);
			this.#showButton(nextButton);
		}

		if (this.#currentStep === STEPS.CONSTANTS && !this.#canUserTuningStates)
		{
			this.#disableButton(createButton);
			this.#disableButton(nextButton);
			this.#addNotTunedConstantsHint(createButton);
			this.#addNotTunedConstantsHint(nextButton);
		}

		if (this.#currentStep === STEPS.STATUS)
		{
			Dom.remove(backButton);
			Dom.remove(nextButton);
			Dom.remove(createButton);
		}

		setTimeout(() => {
			this.#removeWaitFromButton(backButton);
			this.#removeWaitFromButton(nextButton);
			this.#removeWaitFromButton(createButton);
		}, 100);
	}

	#isFirstStep(): boolean
	{
		return this.#currentStep === STEPS.DESCRIPTION;
	}

	#isLastStep(): boolean
	{
		return (
			(this.#currentStep === STEPS.DESCRIPTION && this.#steps.length === MIN_STEPS_COUNT)
			|| (this.#currentStep === STEPS.CONSTANTS && this.#steps.length === MIN_STEPS_COUNT + 1)
			|| (this.#currentStep === STEPS.FIELDS)
		);
	}

	#hideButton(button)
	{
		if (Type.isDomNode(button))
		{
			Dom.addClass(button, ['--hidden']);
			this.#disableButton(button);
		}
	}

	#disableButton(button)
	{
		if (Type.isDomNode(button))
		{
			Dom.addClass(button, ['ui-btn-disabled']);
			Dom.attr(button, 'disabled', 'disabled');
		}
	}

	#removeWaitFromButton(button)
	{
		if (Type.isDomNode(button))
		{
			Dom.removeClass(button, 'ui-btn-wait');
		}
	}

	#setWaitToButton(button)
	{
		if (Type.isDomNode(button))
		{
			Dom.addClass(button, 'ui-btn-wait');
		}
	}

	#showButton(button)
	{
		if (Type.isDomNode(button))
		{
			Dom.removeClass(button, ['--hidden']);
			this.#enableButton(button);
		}
	}

	#enableButton(button)
	{
		if (Type.isDomNode(button))
		{
			Dom.removeClass(button, ['ui-btn-disabled']);
			Dom.attr(button, 'disabled', null);
		}
	}

	#renderProgressBar(): void
	{
		const container = document.getElementById(`${HTML_ELEMENT_ID}-breadcrumbs`);
		if (!container)
		{
			return;
		}

		const { step0, step1, step2, step3 } = Tag.render`
			<div>
				<div
					class="list-el-cg__breadcrumbs-item --active"
					ref="step0"
					data-testid="${HTML_ELEMENT_ID}-steps-item-${STEPS.DESCRIPTION}"
				>
					<span>${Text.encode(getStepTitle(STEPS.DESCRIPTION))}</span>
					<span class="ui-icon-set --chevron-right"></span>
				</div>
				<div
					class="list-el-cg__breadcrumbs-item"
					ref="step1"
					data-testid="${HTML_ELEMENT_ID}-steps-item-${STEPS.CONSTANTS}"
				>
					<span>${Text.encode(getStepTitle(STEPS.CONSTANTS))}</span>
					<span class="ui-icon-set --chevron-right"></span>
				</div>
				<div
					class="list-el-cg__breadcrumbs-item"
					ref="step2"
					data-testid="${HTML_ELEMENT_ID}-steps-item-${STEPS.FIELDS}"
				>
					<span>${Text.encode(getStepTitle(STEPS.FIELDS))}</span>
					<span class="ui-icon-set --chevron-right"></span>
				</div>
				<div
					class="list-el-cg__breadcrumbs-item"
					ref="step3"
					data-testid="${HTML_ELEMENT_ID}-steps-item-${STEPS.STATUS}"
				>
					<span>${Text.encode(getStepTitle(STEPS.STATUS))}</span>
					<span class="ui-icon-set --chevron-right"></span>
				</div>
			</div>
		`;

		this.#steps[0].progressBarNode = step0;
		Dom.append(step0, container);

		const constantsStep = this.#steps.find((step) => step.step === STEPS.CONSTANTS);
		if (constantsStep)
		{
			constantsStep.progressBarNode = step1;
			Dom.append(step1, container);
		}

		const fieldsStep = this.#steps.find((step) => step.step === STEPS.FIELDS);
		if (fieldsStep)
		{
			fieldsStep.progressBarNode = step2;
			Dom.append(step2, container);
		}

		const statusStep = this.#steps.find((step) => step.step === STEPS.STATUS);
		if (statusStep)
		{
			statusStep.progressBarNode = step3;
			Dom.append(step3, container);
		}
	}

	#renderFirstStep()
	{
		const container = document.getElementById(`${HTML_ELEMENT_ID}-container`);
		const contentNode = this.#steps[0].contentNode;
		if (container && contentNode)
		{
			const description = this.#renderDescription();
			this.#descriptionNode = description;
			Dom.append(description, contentNode);

			let expandNode = null;
			if (this.#hasDescription())
			{
				expandNode = this.#renderExpandDescriptionNode();
				Dom.append(expandNode, contentNode);
			}

			this.#durationNode = this.#renderDuration();
			Dom.append(this.#durationNode, container);

			if (expandNode)
			{
				const slider = document.querySelector('.ui-page-slider-workarea-content-padding');
				const difference = slider ? (slider.offsetHeight - window.innerHeight) : 0;
				this.#difference = difference;
				if (difference > 0)
				{
					this.#toggleDescription({ target: expandNode });
				}
				else
				{
					Dom.remove(expandNode);
				}
			}
		}
	}

	#renderDescription(): HTMLElement
	{
		if (this.#hasDescription())
		{
			return Tag.render`
				<div class="list-el-cg__content-wrapper">
					${BX.util.nl2br(this.#description)}
				</div>
			`;
		}

		return Tag.render`
			<div class="list-el-cg__content-wrapper">
				<div class="list-el-cg__content-wrapper__empty-recommendation">
					<svg width="172" height="172" viewBox="0 0 172 172" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path opacity="0.5" d="M137.617 121.056C137.617 123.661 135.505 125.773 132.899 125.773C130.294 125.773 128.182 123.661 128.182 121.056C128.182 118.45 130.294 116.338 132.899 116.338C135.505 116.338 137.617 118.45 137.617 121.056Z" fill="#2FC6F6"/>
					<path opacity="0.2" fill-rule="evenodd" clip-rule="evenodd" d="M152.713 121.056C152.713 132 143.842 140.871 132.899 140.871C123.946 140.871 116.38 134.933 113.924 126.78H117.91C120.215 132.812 126.057 137.096 132.899 137.096C141.758 137.096 148.939 129.915 148.939 121.056C148.939 112.198 141.758 105.016 132.899 105.016C126.057 105.016 120.215 109.3 117.91 115.333H113.924C116.38 107.18 123.946 101.242 132.899 101.242C143.842 101.242 152.713 110.113 152.713 121.056Z" fill="#2FC6F6"/>
					<path opacity="0.3" fill-rule="evenodd" clip-rule="evenodd" d="M145.164 121.057C145.164 127.831 139.673 133.323 132.898 133.323C128.191 133.323 124.103 130.672 122.047 126.781H126.626C128.178 128.482 130.414 129.549 132.898 129.549C137.588 129.549 141.39 125.747 141.39 121.057C141.39 116.367 137.588 112.565 132.898 112.565C130.414 112.565 128.178 113.632 126.625 115.333H122.047C124.104 111.442 128.191 108.791 132.898 108.791C139.673 108.791 145.164 114.283 145.164 121.057Z" fill="#2FC6F6"/>
					<g opacity="0.3">
						<path fill-rule="evenodd" clip-rule="evenodd" d="M135.652 51.1387L133.678 51.1387V49.6387L135.652 49.6387C136.431 49.6387 137.175 49.7937 137.854 50.0753L137.279 51.4609C136.779 51.2535 136.23 51.1387 135.652 51.1387ZM129.73 51.1387L125.781 51.1387V49.6387L129.73 49.6387V51.1387ZM121.833 51.1387L117.884 51.1387V49.6387L121.833 49.6387V51.1387ZM113.936 51.1387L109.988 51.1387V49.6387L113.936 49.6387V51.1387ZM106.039 51.1387L102.091 51.1387L102.091 49.6387L106.039 49.6387L106.039 51.1387ZM98.1422 51.1387L96.168 51.1387C95.7538 51.1387 95.418 50.8029 95.418 50.3887C95.418 49.9745 95.7538 49.6387 96.168 49.6387L98.1422 49.6387L98.1422 51.1387ZM139.902 55.3887C139.902 54.811 139.788 54.2621 139.58 53.762L140.966 53.1874C141.247 53.8665 141.402 54.6104 141.402 55.3887V57.2499H139.902V55.3887ZM139.902 64.6948V60.9724H141.402V64.6948H139.902ZM139.902 72.1397V68.4173H141.402V72.1397H139.902ZM139.902 77.7234V75.8622H141.402V77.7234C141.402 78.3068 141.345 78.8776 141.236 79.4303L139.764 79.1392C139.855 78.6819 139.902 78.2086 139.902 77.7234ZM136.68 83.7527C137.471 83.2232 138.152 82.542 138.682 81.7511L139.928 82.5856C139.29 83.5395 138.469 84.3606 137.515 84.9992L136.68 83.7527ZM132.652 84.9734C133.138 84.9734 133.611 84.9259 134.068 84.8354L134.359 86.3069C133.807 86.4162 133.236 86.4734 132.652 86.4734H131.026V84.9734H132.652ZM119.64 84.9734H121.267V86.4734H119.64V84.9734ZM124.52 84.9734H127.773V86.4734H124.52V84.9734Z" fill="#2FC6F6"/>
						<path d="M98.1719 50.3926C98.1719 51.4971 97.2764 52.3926 96.1719 52.3926C95.0673 52.3926 94.1719 51.4971 94.1719 50.3926C94.1719 49.288 95.0673 48.3926 96.1719 48.3926C97.2764 48.3926 98.1719 49.288 98.1719 50.3926Z" fill="#2FC6F6"/>
						<path fill-rule="evenodd" clip-rule="evenodd" d="M24.7566 108.84V106.95H26.2566V108.84H24.7566ZM24.7566 103.171V99.3921H26.2566V103.171H24.7566ZM24.7566 95.613V93.7235C24.7566 93.14 24.8138 92.5692 24.9232 92.0166L26.3947 92.3077C26.3042 92.765 26.2566 93.2383 26.2566 93.7235V95.613H24.7566ZM26.2309 88.8613C26.8695 87.9074 27.6906 87.0863 28.6445 86.4477L29.479 87.6942C28.688 88.2237 28.0069 88.9048 27.4773 89.6958L26.2309 88.8613ZM31.7998 85.14C32.3524 85.0307 32.9232 84.9735 33.5066 84.9735H36.0597V86.4735H33.5066C33.0215 86.4735 32.5482 86.521 32.0909 86.6115L31.7998 85.14ZM41.1657 84.9735H43.7188V86.4735H41.1657V84.9735Z" fill="#2FC6F6"/>
						<path d="M41.8867 85.7227C41.8867 86.8272 40.9913 87.7227 39.8867 87.7227C38.7821 87.7227 37.8867 86.8272 37.8867 85.7227C37.8867 84.6181 38.7821 83.7227 39.8867 83.7227C40.9913 83.7227 41.8867 84.6181 41.8867 85.7227Z" fill="#2FC6F6"/>
						<path d="M126.154 83.1855C126.154 82.347 125.184 81.8808 124.53 82.4046L121.357 84.9425C120.857 85.3428 120.857 86.1039 121.357 86.5042L124.53 89.0421C125.184 89.566 126.154 89.0998 126.154 88.2613V83.1855Z" fill="#2FC6F6"/>
						<path d="M28.0841 104.461C28.9226 104.461 29.3887 105.431 28.8649 106.086L26.327 109.258C25.9267 109.758 25.1656 109.758 24.7653 109.258L22.2274 106.086C21.7036 105.431 22.1697 104.461 23.0083 104.461L28.0841 104.461Z" fill="#2FC6F6"/>
					</g>
					<path fill-rule="evenodd" clip-rule="evenodd" d="M121.136 123.595C121.136 124.434 122.105 124.9 122.76 124.376L125.933 121.838C126.433 121.438 126.433 120.677 125.933 120.276L122.76 117.739C122.105 117.215 121.136 117.681 121.136 118.519V120.307L119.401 120.307L119.401 121.807L121.136 121.807V123.595ZM115.499 121.807L111.596 121.807L111.596 120.307L115.499 120.307V121.807ZM107.694 121.807L103.792 121.807L103.792 120.307L107.694 120.307L107.694 121.807ZM98.0226 120.307C97.726 119.574 97.0073 119.057 96.168 119.057C95.0634 119.057 94.168 119.953 94.168 121.057C94.168 122.162 95.0634 123.057 96.168 123.057C97.0073 123.057 97.7258 122.54 98.0226 121.807L99.8894 121.807L99.8894 120.307L98.0226 120.307Z" fill="url(#paint0_linear_5779_78783)"/>
					<g filter="url(#filter0_d_5779_78783)">
						<path d="M18.8066 44.6914C18.8066 41.3777 21.4929 38.6914 24.8066 38.6914H90.167C93.4807 38.6914 96.167 41.3777 96.167 44.6914V56.7393C96.167 60.053 93.4807 62.7393 90.167 62.7393H24.8066C21.4929 62.7393 18.8066 60.053 18.8066 56.7393V44.6914Z" fill="white"/>
					</g>
					<path fill-rule="evenodd" clip-rule="evenodd" d="M90.167 39.6914H24.8066C22.0452 39.6914 19.8066 41.93 19.8066 44.6914V56.7393C19.8066 59.5007 22.0452 61.7393 24.8066 61.7393H90.167C92.9284 61.7393 95.167 59.5007 95.167 56.7393V44.6914C95.167 41.93 92.9284 39.6914 90.167 39.6914ZM24.8066 38.6914C21.4929 38.6914 18.8066 41.3777 18.8066 44.6914V56.7393C18.8066 60.053 21.4929 62.7393 24.8066 62.7393H90.167C93.4807 62.7393 96.167 60.053 96.167 56.7393V44.6914C96.167 41.3777 93.4807 38.6914 90.167 38.6914H24.8066Z" fill="#1EC6FA"/>
					<path opacity="0.3" d="M44.293 50.8101C44.293 49.8535 45.0684 49.0781 46.0249 49.0781H76.0454C77.0019 49.0781 77.7773 49.8535 77.7773 50.8101C77.7773 51.7666 77.0019 52.542 76.0454 52.542H46.0249C45.0684 52.542 44.293 51.7666 44.293 50.8101Z" fill="#2FC6F6"/>
					<path opacity="0.56" fill-rule="evenodd" clip-rule="evenodd" d="M33.1615 56.9988C36.5795 56.9988 39.3503 54.2279 39.3503 50.8099C39.3503 47.3919 36.5795 44.6211 33.1615 44.6211C29.7435 44.6211 26.9727 47.3919 26.9727 50.8099C26.9727 54.2279 29.7435 56.9988 33.1615 56.9988ZM36.2499 48.4132C35.9788 48.1421 35.5392 48.1421 35.2681 48.4132L32.2547 51.4267L31.0536 50.2256C30.7827 49.9547 30.3435 49.9547 30.0726 50.2256C29.8017 50.4965 29.8017 50.9357 30.0726 51.2066L31.7648 52.8987C32.0357 53.1696 32.4749 53.1696 32.7458 52.8987L36.2499 49.395C36.521 49.1239 36.521 48.6843 36.2499 48.4132Z" fill="#2FC6F6"/>
					<g filter="url(#filter1_d_5779_78783)">
						<path d="M45.3302 74.8923C46.2308 73.3741 47.8652 72.4434 49.6304 72.4434H111.547C113.328 72.4434 114.975 73.3907 115.87 74.9304L120.39 82.7061C121.474 84.5704 121.474 86.8729 120.39 88.7372L115.87 96.5129C114.975 98.0526 113.328 98.9999 111.547 98.9999H49.6542C47.8762 98.9999 46.232 98.0557 45.3358 96.5202L40.1566 87.6458C39.4244 86.3912 39.43 84.8382 40.1711 83.5888L45.3302 74.8923Z" fill="white"/>
					</g>
					<path fill-rule="evenodd" clip-rule="evenodd" d="M111.547 73.4434H49.6304C48.2183 73.4434 46.9107 74.188 46.1902 75.4025L41.0312 84.099C40.4753 85.036 40.4711 86.2008 41.0203 87.1418L46.1995 96.0161C46.9164 97.2446 48.2318 97.9999 49.6542 97.9999H111.547C112.972 97.9999 114.289 97.242 115.005 96.0103L119.526 88.2346C120.429 86.681 120.429 84.7622 119.526 83.2086L115.005 75.433C114.289 74.2012 112.972 73.4434 111.547 73.4434ZM49.6304 72.4434C47.8652 72.4434 46.2308 73.3741 45.3302 74.8923L40.1711 83.5888C39.43 84.8382 39.4244 86.3912 40.1566 87.6458L45.3358 96.5202C46.232 98.0557 47.8762 98.9999 49.6542 98.9999H111.547C113.328 98.9999 114.975 98.0526 115.87 96.5129L120.39 88.7372C121.474 86.8729 121.474 84.5704 120.39 82.7061L115.87 74.9304C114.975 73.3907 113.328 72.4434 111.547 72.4434H49.6304Z" fill="#1EC6FA"/>
					<path opacity="0.3" d="M69.0293 85.7222C69.0293 84.7657 69.8047 83.9902 70.7612 83.9902H100.782C101.738 83.9902 102.514 84.7657 102.514 85.7222C102.514 86.6787 101.738 87.4541 100.782 87.4541H70.7612C69.8047 87.4541 69.0293 86.6787 69.0293 85.7222Z" fill="#2FC6F6"/>
					<path opacity="0.56" fill-rule="evenodd" clip-rule="evenodd" d="M57.8998 91.9109C61.3178 91.9109 64.0886 89.14 64.0886 85.722C64.0886 82.304 61.3178 79.5332 57.8998 79.5332C54.4818 79.5332 51.7109 82.304 51.7109 85.722C51.7109 89.14 54.4818 91.9109 57.8998 91.9109ZM60.9882 83.3253C60.7171 83.0542 60.2775 83.0542 60.0064 83.3253L56.993 86.3388L55.7919 85.1377C55.521 84.8668 55.0818 84.8668 54.8109 85.1377C54.54 85.4086 54.54 85.8478 54.8109 86.1187L56.5031 87.8109C56.774 88.0817 57.2132 88.0817 57.4841 87.8109L60.9882 84.3071C61.2593 84.036 61.2593 83.5965 60.9882 83.3253Z" fill="#2FC6F6"/>
					<g filter="url(#filter2_d_5779_78783)">
						<path d="M18.8066 114.807C18.8066 111.493 21.4929 108.807 24.8066 108.807H90.167C93.4807 108.807 96.167 111.493 96.167 114.807V127.306C96.167 130.62 93.4807 133.306 90.167 133.306H24.8066C21.4929 133.306 18.8066 130.62 18.8066 127.306V114.807Z" fill="white"/>
					</g>
					<path fill-rule="evenodd" clip-rule="evenodd" d="M90.167 109.807H24.8066C22.0452 109.807 19.8066 112.045 19.8066 114.807V127.306C19.8066 130.067 22.0452 132.306 24.8066 132.306H90.167C92.9284 132.306 95.167 130.067 95.167 127.306V114.807C95.167 112.045 92.9284 109.807 90.167 109.807ZM24.8066 108.807C21.4929 108.807 18.8066 111.493 18.8066 114.807V127.306C18.8066 130.62 21.4929 133.306 24.8066 133.306H90.167C93.4807 133.306 96.167 130.62 96.167 127.306V114.807C96.167 111.493 93.4807 108.807 90.167 108.807H24.8066Z" fill="#1EC6FA"/>
					<path opacity="0.3" d="M44.209 121.056C44.209 120.1 44.9844 119.324 45.9409 119.324H75.9614C76.9179 119.324 77.6933 120.1 77.6933 121.056C77.6933 122.013 76.9179 122.788 75.9614 122.788H45.9409C44.9844 122.788 44.209 122.013 44.209 121.056Z" fill="#2FC6F6"/>
					<path opacity="0.56" fill-rule="evenodd" clip-rule="evenodd" d="M33.0775 127.245C36.4955 127.245 39.2663 124.474 39.2663 121.056C39.2663 117.638 36.4955 114.867 33.0775 114.867C29.6595 114.867 26.8887 117.638 26.8887 121.056C26.8887 124.474 29.6595 127.245 33.0775 127.245ZM36.1659 118.659C35.8948 118.388 35.4553 118.388 35.1841 118.659L32.1707 121.673L30.9696 120.472C30.6987 120.201 30.2595 120.201 29.9886 120.472C29.7178 120.743 29.7178 121.182 29.9886 121.453L31.6808 123.145C31.9517 123.416 32.3909 123.416 32.6618 123.145L36.1659 119.641C36.4371 119.37 36.4371 118.93 36.1659 118.659Z" fill="#2FC6F6"/>
					<path d="M114.498 51.8009C113.717 51.0199 113.717 49.7536 114.498 48.9725L120.728 42.7429C121.509 41.9619 122.775 41.9619 123.556 42.7429L129.786 48.9725C130.567 49.7536 130.567 51.0199 129.786 51.8009L123.556 58.0305C122.775 58.8115 121.509 58.8115 120.728 58.0305L114.498 51.8009Z" fill="#2FC6F6"/>
					<defs>
						<filter id="filter0_d_5779_78783" x="15.8066" y="36.6914" width="83.3613" height="30.0469" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
							<feFlood flood-opacity="0" result="BackgroundImageFix"/>
							<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
							<feOffset dy="1"/>
							<feGaussianBlur stdDeviation="1.5"/>
							<feComposite in2="hardAlpha" operator="out"/>
							<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0.294033 0 0 0 0 0.3875 0 0 0 0.09 0"/>
							<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_5779_78783"/>
							<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_5779_78783" result="shape"/>
						</filter>
						<filter id="filter1_d_5779_78783" x="36.6113" y="70.4434" width="87.5918" height="32.5566" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
							<feFlood flood-opacity="0" result="BackgroundImageFix"/>
							<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
							<feOffset dy="1"/>
							<feGaussianBlur stdDeviation="1.5"/>
							<feComposite in2="hardAlpha" operator="out"/>
							<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0.294033 0 0 0 0 0.3875 0 0 0 0.09 0"/>
							<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_5779_78783"/>
							<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_5779_78783" result="shape"/>
						</filter>
						<filter id="filter2_d_5779_78783" x="15.8066" y="106.807" width="83.3613" height="30.5" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
							<feFlood flood-opacity="0" result="BackgroundImageFix"/>
							<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
							<feOffset dy="1"/>
							<feGaussianBlur stdDeviation="1.5"/>
							<feComposite in2="hardAlpha" operator="out"/>
							<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0.294033 0 0 0 0 0.3875 0 0 0 0.09 0"/>
							<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_5779_78783"/>
							<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_5779_78783" result="shape"/>
						</filter>
						<linearGradient id="paint0_linear_5779_78783" x1="93.418" y1="121.057" x2="129.388" y2="121.057" gradientUnits="userSpaceOnUse">
							<stop stop-color="#2FC6F6" stop-opacity="0.3"/>
							<stop offset="1" stop-color="#2FC6F6"/>
						</linearGradient>
					</defs>
				</svg>
					<span class="list-el-cg__text-empty">${Loc.getMessage('LISTS_ELEMENT_CREATION_GUIDE_CMP_EMPTY_DESCRIPTION_1')}</span>
				</div>
			</div>
		`;
	}

	#hasDescription(): boolean
	{
		return Type.isStringFilled(this.#description);
	}

	#renderExpandDescriptionNode(): HTMLElement
	{
		const node = Tag.render`
			<div
				class="list-el-cg__content-open"
				data-testid="${HTML_ELEMENT_ID}-description-toggle-btn"
			>
				${Loc.getMessage('LISTS_ELEMENT_CREATION_GUIDE_CMP_EXPAND_DESCRIPTION')}
			</div>
		`;

		makeActivatable(node, this.#toggleDescription.bind(this));

		return node;
	}

	#toggleDescription(event)
	{
		const target = event.target;
		if (target && this.#difference > 0)
		{
			Dom.clean(target);
			if (Dom.hasClass(this.#descriptionNode, '--hide'))
			{
				target.innerText = Loc.getMessage('LISTS_ELEMENT_CREATION_GUIDE_CMP_COLLAPSE_DESCRIPTION');
				Dom.style(this.#descriptionNode, 'height', `${this.#descriptionNode.scrollHeight}px`);
			}
			else
			{
				target.innerText = Loc.getMessage('LISTS_ELEMENT_CREATION_GUIDE_CMP_EXPAND_DESCRIPTION');
				Dom.style(
					this.#descriptionNode,
					'height',
					`${this.#descriptionNode.offsetHeight - this.#difference}px`,
				);
			}

			Dom.toggleClass(this.#descriptionNode, ['--hide']);
			Dom.attr(target, 'aria-expanded', String(!Dom.hasClass(this.#descriptionNode, '--hide')));
		}
	}

	#renderDuration(): HTMLElement
	{
		if (Type.isNil(this.#duration))
		{
			return Tag.render`
				<div class="list-el-cg__informer" data-testid="${HTML_ELEMENT_ID}-duration">
					<div class="list-el-cg__informer-header">
						<div class="list-el-cg__informer-title">
							${Text.encode(Loc.getMessage('LISTS_ELEMENT_CREATION_GUIDE_CMP_AVERAGE_DURATION_TITLE'))}
						</div>
						<div class="list-el-cg__informer-time">
							<span class="list-el-cg__text-empty">${Text.encode(Loc.getMessage('LISTS_ELEMENT_CREATION_GUIDE_CMP_EMPTY_DURATION'))}</span>
						</div>
					</div>
					<div class="list-el-cg__informer-message">${Loc.getMessage('LISTS_ELEMENT_CREATION_GUIDE_CMP_AVERAGE_DURATION_UNDEFINED_DESCRIPTION')}</div>
					<div class="list-el-cg__informer-bottom"></div>
				</div>
			`;
		}

		let formattedDuration = Loc.getMessage('LISTS_ELEMENT_CREATION_GUIDE_CMP_ZERO_DURATION');

		if (this.#duration > 0)
		{
			formattedDuration = DateTimeFormat.format(
				[['s', 'sdiff'], ['i', 'idiff'], ['H', 'Hdiff'], ['d', 'ddiff'], ['m', 'mdiff'], ['Y', 'Ydiff']],
				0,
				this.#duration,
			);
		}

		return Tag.render`
			<div class="list-el-cg__informer" data-testid="${HTML_ELEMENT_ID}-duration">
				<div class="list-el-cg__informer-header">
					<div class="list-el-cg__informer-title">
						${Text.encode(Loc.getMessage('LISTS_ELEMENT_CREATION_GUIDE_CMP_AVERAGE_DURATION_TITLE'))}
					</div>
					<div class="list-el-cg__informer-time">
						<span>${Text.encode(formattedDuration)}</span>
						<div class="ui-icon-set --time-picker"></div>
					</div>
				</div>
				<div class="list-el-cg__informer-message">${Loc.getMessage('LISTS_ELEMENT_CREATION_GUIDE_CMP_AVERAGE_DURATION_DESCRIPTION')}</div>
				<div class="list-el-cg__informer-bottom">
					<a
						class="list-el-cg__link" href="#"
						onclick="${this.#handleDurationHintClick}"
						data-testid="${HTML_ELEMENT_ID}-duration-hint-link"
					>${Loc.getMessage('LISTS_ELEMENT_CREATION_GUIDE_CMP_AVERAGE_DURATION_HINT')}
					</a>
				</div>
			</div>
		`;
	}

	#handleDurationHintClick(event)
	{
		event.preventDefault();

		const ARTICLE_ID = '18783714';

		const helper = Reflection.getClass('top.BX.Helper');

		if (helper)
		{
			helper.show(`redirect=detail&code=${ARTICLE_ID}`);
		}
	}

	#renderStatusStep()
	{
		const currentStepIndex = this.#steps.findIndex((step) => step.step === this.#currentStep);
		const currentStep = this.#steps[currentStepIndex];

		Dom.append(
			Tag.render`
				<div>
					<div class="list-el-cg__status">
						<div class="list-el-cg__status-logo">
							<div class="list-el-cg__status-logo-animated"></div>
						</div>
						<div class="list-el-cg__status-content">
							<div class="list-el-cg__status-text">
								${Loc.getMessage('LISTS_ELEMENT_CREATION_GUIDE_CMP_SUCCESS_START')}
							</div>
						</div>
					</div>
				</div>
			`,
			currentStep.contentNode,
		);
	}

	next()
	{
		if (this.#isLoading || this.#isLastStep())
		{
			return;
		}

		if (!this.#formData)
		{
			const form = document.forms.form_lists_element_creation_guide_element;
			this.#formData = form ? new FormData(form) : new FormData();
			this.#appendSectionFormData(this.#formData);
			this.#appendBPFormData(this.#formData);
		}

		const currentStep = this.#getCurrentStep();
		const nextStep = this.#steps[this.#currentStepIndex + 1];

		if (currentStep.step === STEPS.CONSTANTS && this.#canUserTuningStates)
		{
			this.#startLoading();
			this.#setAllConstants()
				.then(() => {
					this.#changeStep();
				})
				.catch(() => {
					this.#toggleButtons();
				})
				.finally(this.#finishLoading.bind(this))
			;

			return;
		}

		if (nextStep.step === STEPS.CONSTANTS && !this.#canUserTuningStates && !this.#isAdminLoaded)
		{
			this.#startLoading();
			this.#loadAdminList()
				.then(() => {})
				.catch(() => {})
				.finally(() => {
					this.#isAdminLoaded = true;
					this.#finishLoading();
					this.#changeStep();
				})
			;

			return;
		}

		this.#changeStep();
	}

	#changeStep()
	{
		const currentStep = this.#getCurrentStep();
		const nextStep = this.#steps[this.#currentStepIndex + 1];

		Dom.toggleClass(currentStep.progressBarNode, ['--active', '--complete']);
		Dom.addClass(nextStep.progressBarNode, '--active');

		this.#cleanErrors();

		Dom.addClass(currentStep.contentNode, '--hidden');
		Dom.removeClass(nextStep.contentNode, '--hidden');

		this.#switchStepA11y(currentStep, nextStep);

		if (currentStep.step === STEPS.DESCRIPTION)
		{
			Dom.addClass(this.#durationNode, '--hidden');
		}

		if (nextStep.step === STEPS.STATUS)
		{
			Dom.addClass(document.querySelector('.list-el-cg__content-head'), '--hidden');
		}

		this.#setCurrentStep(nextStep.step);
		this.#toggleButtons();
	}

	#loadAdminList(): Promise
	{
		return new Promise((resolve, reject) => {
			const constantStep = this.#steps.find((step) => step.step === STEPS.CONSTANTS);
			ajax.runComponentAction(
				AJAX_COMPONENT,
				'getListAdmin',
				{ json: { signedParameters: this.#signedParameters } },
			)
				.then(({ data }) => {
					if (Type.isArrayFilled(data?.admins))
					{
						Dom.append(this.#renderAdminList(data.admins, data.canNotify), constantStep.contentNode);
					}

					resolve();
				})
				.catch(reject)
			;
		});
	}

	#renderAdminList(admins: [], canNotify: boolean = false): HTMLElement
	{
		return Tag.render`
			<div data-testid="${HTML_ELEMENT_ID}-admin-list">
				<div class="list-el-cg__const-desc">
					${Text.encode(Loc.getMessage('LISTS_ELEMENT_CREATION_GUIDE_CMP_NOT_TUNING_CONSTANTS_NOTIFY_ADMIN'))}
				</div>
				<div class="list-el-cg__const-title">
					${Text.encode(Loc.getMessage('LISTS_ELEMENT_CREATION_GUIDE_CMP_NOT_TUNING_CONSTANTS_NOTIFY'))}
				</div>
				${admins.map((admin) => {
					let button = null;
					if (canNotify)
					{
						button = new Button({
							text: Loc.getMessage('LISTS_ELEMENT_CREATION_GUIDE_CMP_NOT_TUNING_CONSTANTS_NOTIFY_BUTTON'),
							size: ButtonSize.MEDIUM,
							color: ButtonColor.PRIMARY,
							onclick: this.#notifyAdmin.bind(this, admin),
							dataset: { testid: `${HTML_ELEMENT_ID}-notify-admin-btn-${admin.id}` },
						});
					}

					return Tag.render`
						<div class="list-el-cg__const-box">
							<div class="list-el-cg__const-user">
								<div
									class="ui-icon ui-icon-common-user list-el-cg__const-icon"
									bx-tooltip-user-id="${admin.id}"
								>
									<i style="background-image: url('${admin.img ? encodeURI(Text.encode(admin.img)) : '/bitrix/js/ui/icons/b24/images/ui-user.svg?v2'}');"></i>
								</div>
								<span class="list-el-cg__const-name">${Text.encode(admin.name)}</span>
							</div>
							<div>
								${button?.render()}
							</div>
						</div>
					`;
					})
				}
			</div>
		`;
	}

	#notifyAdmin(admin: {}, button: Button)
	{
		button.setWaiting(true);

		ajax.runComponentAction(
			AJAX_COMPONENT,
			'notifyAdmin',
			{
				json: {
					signedParameters: this.#signedParameters,
					adminId: admin.id,
				},
			},
		)
			.then(({ data }) => {
				if (data.success === true)
				{
					Dom.replace(
						button.getContainer(),
						Tag.render`
							<span class="list-el-cg__const-success-text">
								${Text.encode(Loc.getMessage('LISTS_ELEMENT_CREATION_GUIDE_CMP_NOT_TUNING_CONSTANTS_NOTIFY_SUCCESS'))}
							</span>
						`,
					);
				}

				button.setWaiting(false);
			})
			.catch(() => {
				button.setWaiting(false);
			})
		;
	}

	#setAllConstants(): Promise
	{
		return new Promise((resolve, reject) => {
			const formData = new FormData();
			this.#appendBPFormData(formData, true);

			this.#setConstants(formData)
				.then(resolve)
				.catch(({ errors }) => {
					if (Array.isArray(errors))
					{
						this.#showErrors(errors);
					}

					reject();
				})
			;
		});
	}

	#setConstants(formData: FormData): Promise
	{
		return new Promise((resolve, reject) => {
			formData.set('signedParameters', this.#signedParameters);

			ajax.runComponentAction(AJAX_COMPONENT, 'setConstants', { data: formData })
				.then(resolve)
				.catch(reject)
			;
		});
	}

	back()
	{
		if (this.#isFirstStep())
		{
			if (Reflection.getClass('BX.SidePanel') && BX.SidePanel.Instance.getSliderByWindow(window))
			{
				BX.SidePanel.Instance.getSliderByWindow(window).close(false);

				return;
			}

			this.#setCurrentStep();

			return;
		}

		const currentStepIndex = this.#steps.findIndex((step) => step.step === this.#currentStep);
		const currentStep = this.#steps[currentStepIndex];
		const previousStep = this.#steps[currentStepIndex - 1];

		Dom.removeClass(currentStep.progressBarNode, '--active');
		Dom.toggleClass(previousStep.progressBarNode, ['--active', '--complete']);

		this.#cleanErrors();

		Dom.addClass(currentStep.contentNode, '--hidden');
		Dom.removeClass(previousStep.contentNode, '--hidden');

		this.#switchStepA11y(currentStep, previousStep);

		if (previousStep.step === STEPS.DESCRIPTION)
		{
			Dom.removeClass(this.#durationNode, '--hidden');
		}

		this.#setCurrentStep(previousStep.step);
		this.#toggleButtons();
	}

	async create()
	{
		if (
			this.#isLoading
			|| !this.#isLastStep()
			|| (this.#currentStep === STEPS.CONSTANTS && !this.#canUserTuningStates)
		)
		{
			return;
		}

		if (this.#currentStep === STEPS.CONSTANTS)
		{
			this.#startLoading();

			let hasErrors = false;
			await this.#setAllConstants()
				.catch(() => {
					this.#toggleButtons();
					hasErrors = true;
				})
			;

			this.#finishLoading();
			if (hasErrors)
			{
				return;
			}
		}

		this.#startLoading();
		this.#createElement()
			.then(() => {
				this.#sendCreationAnalytics();
				// the status step draws static text and the slider closes over it, so the result is
				// announced before the closing and from the live region of the top window
				announceStartResult(Loc.getMessage('LISTS_ELEMENT_CREATION_GUIDE_CMP_SUCCESS_START'));
				if (Reflection.getClass('BX.SidePanel') && BX.SidePanel.Instance.getSliderByWindow(window))
				{
					this.#canClose = true;
					// the focus is not touched here: the closing slider restores it to the element
					// that owned it before the opening (focus trap, deactivate -> restoreFocus)
					setTimeout(
						() => {
							BX.SidePanel.Instance.getSliderByWindow(window).close(false);
						},
						CLOSE_SLIDER_AFTER_SECONDS * 1000,
					);
					BX.SidePanel.Instance.getSliderByWindow(window).close(false);
					BX.SidePanel.Instance.postMessage(window, 'BX.Lists.Element.CreationGuide:onElementCreated', { iBlockId: this.#iBlockId });
				}
				this.#changeStep();
			})
			.catch((error) => {
				this.#toggleButtons();
				this.#sendCreationAnalytics(error);
			})
			.finally(this.#finishLoading.bind(this))
		;
	}

	#createElement(): Promise
	{
		return new Promise((resolve, reject) => {
			const form: HTMLFormElement = document.forms.form_lists_element_creation_guide_element;
			const formData: FormData = form ? new FormData(form) : new FormData();

			this.#appendSectionFormData(formData);
			this.#appendBPFormData(formData);

			formData.set('signedParameters', this.#signedParameters);
			formData.set('time', Math.round(Date.now() / 1000) - this.#startTime);

			ajax.runComponentAction(
				AJAX_COMPONENT,
				'create',
				{ data: formData },
			)
				.then(resolve)
				.catch(({ errors }) => {
					if (Array.isArray(errors))
					{
						this.#showErrors(errors);
					}

					reject(new Error(errors[0].message));
				})
			;
		});
	}

	#appendSectionFormData(formData: FormData)
	{
		const form: HTMLFormElement = document.forms.form_lists_element_creation_guide_section;
		if (form)
		{
			formData.set('IBLOCK_SECTION_ID', new FormData(form).get('IBLOCK_SECTION_ID'));
		}
	}

	#appendBPFormData(formData: FormData, isConstantsForms: boolean = false)
	{
		this.#templateIds.forEach((id) => {
			const formId = `form_${isConstantsForms ? BP_STATE_CONSTANTS_FORM_NAME : BP_STATE_FORM_NAME}_${id}`;
			if (document.forms[formId])
			{
				this.#appendStateFormData(formData, formId);
				formData.append('templateIds[]', id);
			}
		});
	}

	#appendStateFormData(formData: FormData, formId: number)
	{
		const form = document.forms[formId];
		if (form)
		{
			for (const [key, value] of (new FormData(form)).entries())
			{
				if (key !== 'sessid')
				{
					formData.append(key, value);
				}
			}
		}
	}

	#showErrors(errors: Array<ComponentError>)
	{
		this.#cleanErrors();

		const { shownErrors, errorRegion } = this.#renderErrors(errors);
		if (errorRegion)
		{
			this.#focusErrorControl(shownErrors, errorRegion);
		}
	}

	/**
	 * Each message gets a node of its own so that a control can be bound to the message about it.
	 * An error of a process template goes to the container of that template, the rest to the common one.
	 * The messages are grouped by the mark of the region they go to, one region per container.
	 */
	#renderErrors(errors: Array<ComponentError>): RenderedErrors
	{
		const shownErrors = [];
		const groups: Map<string, ErrorGroup> = new Map();
		let errorRegion = null;

		errors.forEach((error, index) => {
			const message = this.#getErrorByCode(error.code) ?? error.message;
			const target = this.#getErrorTarget(error);
			if (!message || !target)
			{
				return;
			}

			const messageId = `${ERROR_MESSAGE_ID_PREFIX}-${index}`;
			const messageNode = Tag.render`<span>${Text.encode(message)}</span>`;
			Dom.attr(messageNode, { id: messageId, 'data-testid': messageId });

			const group = groups.get(target.regionTestId) ?? { container: target.container, messageNodes: [] };
			group.messageNodes.push(messageNode);
			groups.set(target.regionTestId, group);

			shownErrors.push({ error, messageId });
		});

		if (groups.size === 0 && errors.length > 0)
		{
			this.#addUnknownErrorMessage(groups);
		}

		groups.forEach(({ container, messageNodes }, regionTestId) => {
			const region = renderErrorRegion(messageNodes, regionTestId);
			Dom.append(region, container);
			errorRegion ??= region;
		});

		const [firstGroup] = groups.values();
		if (firstGroup)
		{
			BX.scrollToNode(firstGroup.container);
		}

		return { shownErrors, errorRegion };
	}

	/**
	 * A message of the wizard for a refusal that arrived without a text of its own: the server allows
	 * such an error, and a refusal shown nowhere leaves the buttons switched back on as its only sign.
	 */
	#addUnknownErrorMessage(groups: Map<string, ErrorGroup>): void
	{
		const container = this.#getCommonErrorsContainer();
		if (!container)
		{
			return;
		}

		const messageNode = Tag.render`<span>${Text.encode(Loc.getMessage(ERRORS.NETWORK_ERROR))}</span>`;
		// the mark alone, without an id: this message describes no control of the step
		Dom.attr(messageNode, 'data-testid', `${ERROR_MESSAGE_ID_PREFIX}-unknown`);

		groups.set(ERROR_REGION_TEST_ID, { container, messageNodes: [messageNode] });
	}

	/**
	 * A container of a process template belongs to the constants step, and an error of a launch parameter
	 * carries the very same templateId: on the launch step that container is hidden and inert by then,
	 * so a message routed there would be neither seen nor announced. Hence the container of the current
	 * step and nothing else, the common container of the wizard otherwise.
	 */
	#getErrorTarget(error: ComponentError): ?ErrorTarget
	{
		const templateId = error.customData?.templateId;
		const templateContainer = (
			templateId
				? document.getElementById(`${HTML_ELEMENT_ID}-constants-${templateId}-errors`)
				: null
		);

		if (templateContainer && this.#getCurrentStep()?.contentNode?.contains(templateContainer))
		{
			return { container: templateContainer, regionTestId: `${ERROR_REGION_TEST_ID}-${templateId}` };
		}

		const container = this.#getCommonErrorsContainer();

		return container ? { container, regionTestId: ERROR_REGION_TEST_ID } : null;
	}

	#getCommonErrorsContainer(): ?HTMLElement
	{
		return document.getElementById(`${HTML_ELEMENT_ID}-errors`);
	}

	#focusErrorControl(shownErrors: Array<ShownError>, errorRegion: ?HTMLElement): void
	{
		const currentStep = this.#getCurrentStep();
		const fields: Array<StepInvalidField> = [];

		shownErrors.forEach(({ error, messageId }) => {
			const { parameter, templateId } = error.customData ?? {};
			const formRoot = templateId ? this.#getTemplateForm(templateId) : null;
			if (parameter && formRoot)
			{
				fields.push({ formRoot, name: `bizproc${templateId}_${parameter}`, messageId });
			}
		});

		focusStepError(currentStep.contentNode, fields, errorRegion, currentStep.headingNode);
	}

	// constants and parameters of a template are two different forms naming their controls alike
	#getTemplateForm(templateId: number): ?HTMLFormElement
	{
		const formName = (
			this.#currentStep === STEPS.CONSTANTS ? BP_STATE_CONSTANTS_FORM_NAME : BP_STATE_FORM_NAME
		);

		return document.forms[`form_${formName}_${templateId}`] ?? null;
	}

	#getErrorByCode(code: string): string
	{
		return Loc.getMessage(ERRORS[code]);
	}

	#cleanErrors()
	{
		this.#getErrorsContainers().forEach((container) => Dom.clean(container));
		clearStepInvalidControls(this.#getCurrentStep()?.contentNode);
	}

	#getErrorsContainers(): Array<HTMLElement>
	{
		const ids = [
			`${HTML_ELEMENT_ID}-errors`,
			...this.#templateIds.map((templateId) => `${HTML_ELEMENT_ID}-constants-${templateId}-errors`),
		];

		return ids.map((id) => document.getElementById(id)).filter((node) => node !== null);
	}

	#startLoading()
	{
		this.#isLoading = true;
		this.#disableAllButtons();
	}

	#disableAllButtons()
	{
		for (const button of document.getElementsByClassName('ui-btn'))
		{
			this.#disableButton(button);
		}
	}

	#finishLoading()
	{
		this.#isLoading = false;
		this.#enableAllButtons();
	}

	#enableAllButtons()
	{
		for (const button of document.getElementsByClassName('ui-btn'))
		{
			this.#enableButton(button);
		}
	}

	#addNotTunedConstantsHint(button: HTMLElement)
	{
		if (Type.isDomNode(button))
		{
			Dom.attr(button, 'title', Loc.getMessage('LISTS_ELEMENT_CREATION_GUIDE_CMP_NOT_TUNING_CONSTANTS_HINT'));
		}
	}

	#removeNotTunedConstantsHint(button: HTMLElement)
	{
		if (Type.isDomNode(button))
		{
			Dom.attr(button, 'title', null);
		}
	}

	#sendCreationAnalytics(error?: Error)
	{
		Runtime.loadExtension('ui.analytics')
			.then(({ sendData }) => {
				sendData({
					tool: 'automation',
					category: 'bizproc_operations',
					event: 'process_run',
					type: 'run',
					c_section: this.#getAnalyticsSection(),
					p1: this.#name,
					status: error ? 'error' : 'success',
				});
			})
			.catch(() => {})
		;
	}

	#getAnalyticsSection(): string
	{
		return ((new Uri(window.location.href)).getQueryParam('analyticsSection')) || 'bizproc';
	}

	#isChangedFormData(): boolean
	{
		if (!this.#formData)
		{
			return false;
		}

		const form: HTMLFormElement = document.forms.form_lists_element_creation_guide_element;
		const formData = form ? new FormData(form) : new FormData();
		this.#appendSectionFormData(formData);
		this.#appendBPFormData(formData);

		const originFormData = Object.fromEntries(this.#formData.entries());
		for (const [key, value] of formData.entries())
		{
			if (Type.isFile(value))
			{
				if (!this.checkEqualFileField(value, originFormData[key]))
				{
					return true;
				}
			}
			else if (value !== originFormData[key])
			{
				return true;
			}
		}

		return false;
	}

	checkEqualFileField(fileFieldA: File, fileFieldB: File): boolean
	{
		if (!fileFieldB)
		{
			return false;
		}

		return fileFieldA.name === fileFieldB.name;
	}

	#showConfirmDialog(slider)
	{
		this.#messageBox = MessageBox.confirm(
			Loc.getMessage('LISTS_ELEMENT_CREATION_GUIDE_CMP_EXIT_DIALOG_DESCRIPTION'),
			Loc.getMessage('LISTS_ELEMENT_CREATION_GUIDE_CMP_EXIT_DIALOG_TITLE'),
			() => {
				this.#canClose = true;
				slider.close();
			},
			Loc.getMessage('LISTS_ELEMENT_CREATION_GUIDE_CMP_EXIT_DIALOG_CONFIRM'),
			() => {
				this.#messageBox.close();
				this.#messageBox = null;
			},
			Loc.getMessage('LISTS_ELEMENT_CREATION_GUIDE_CMP_EXIT_DIALOG_CANCEL'),
		);
	}
}

namespace.ElementCreationGuide = ElementCreationGuide;
