import { Loc, Runtime, Type } from 'main.core';
import { LiveAnnouncer } from 'ui.a11y';

import { Coachmark } from './component/coachmark/coachmark';
import {
	AUTO_START_DELAY_MS,
	CardIllustration,
	CardSide,
	EmbedTargetBand,
	OnboardingMode,
	StepId,
	StepTargetSelector,
} from './const';
import { onboardingFlagService } from './infrastructure/service/onboarding-flag/onboarding-flag';
import { buildStepQueue } from './lib/step-queue/step-queue';
import { EmbedTarget } from './lib/embed-target/embed-target';
import {
	type CoachmarkLabels,
	type CoachmarkOptions,
	type DashboardOnboardingConfig,
	type DashboardOnboardingOptions,
	type TourStep,
} from './types';

import './style.css';

/**
 * Walks a first time visitor of a BI report through its abilities. The steps of the report
 * header are portal nodes; the steps living inside the embedded report are covered by a band
 * of the frame, and a step with no band described drops out of the queue.
 */
export class DashboardOnboarding
{
	#config: DashboardOnboardingConfig;
	#embedTarget: EmbedTarget;
	#isEmbedReady: () => boolean;
	#onEditRequested: () => void;
	#coachmark: Coachmark | null = null;
	#steps: TourStep[] = [];
	#currentIndex: number = 0;
	#isManualRun: boolean = false;
	#hasStarted: boolean = false;
	#isTourRunning: boolean = false;
	#autoStartTimer: number | null = null;

	constructor(options: DashboardOnboardingOptions)
	{
		this.#config = options.config;
		this.#onEditRequested = options.onEditRequested;
		this.#embedTarget = new EmbedTarget(options.frameNode);
		this.#isEmbedReady = options.isEmbedReady;
	}

	canRestart(): boolean
	{
		return this.#config.canRestart === true;
	}

	/**
	 * The report page reinitializes the embed when another report is picked in the header
	 * selector; the onboarding is decided per page load and does not start a second time.
	 */
	async start(): Promise<void>
	{
		if (this.#hasStarted)
		{
			return;
		}

		if (this.#config.mode === OnboardingMode.EmptyDashboardCta)
		{
			this.#hasStarted = true;
			void this.#showEmptyDashboardCta();

			return;
		}

		// A silent Superset gets no tour at all: the steps inside the frame have no targets, and
		// the passage flag has to stay unspent so the newcomer still meets the tour once the
		// embed loads - on a later attempt of this page load, or on the next one.
		if (this.#config.mode === OnboardingMode.Tour && this.#isEmbedReady())
		{
			this.#hasStarted = true;
			this.#autoStartTimer = setTimeout(() => {
				this.#autoStartTimer = null;
				if (this.#isEmbedReady())
				{
					void this.#runTour(false);

					return;
				}

				this.#hasStarted = false;
			}, AUTO_START_DELAY_MS);
		}
	}

	/**
	 * A manual run records nothing, so an automatic one it replaces has to be closed off first -
	 * otherwise the tour would greet the visitor again on the next visit.
	 */
	async restart(): Promise<void>
	{
		if (this.#autoStartTimer !== null)
		{
			this.#cancelAutoStart();
			void onboardingFlagService.completeTour();
		}
		else if (this.#isTourRunning && !this.#isManualRun)
		{
			this.#finishTour(false);
		}

		await this.#runTour(true);
	}

	destroy(): void
	{
		this.#cancelAutoStart();
		this.#isTourRunning = false;
		this.#closeCoachmark();
		this.#embedTarget.destroy();
	}

	#cancelAutoStart(): void
	{
		if (this.#autoStartTimer !== null)
		{
			clearTimeout(this.#autoStartTimer);
			this.#autoStartTimer = null;
		}
	}

	async #runTour(isManual: boolean): Promise<void>
	{
		this.#closeCoachmark();
		this.#isManualRun = isManual;

		const stepIds = this.#config.steps;
		// The bands are measured from the frame box, and an embed that never loaded has one all
		// the same - so a step would point at an empty area. Only a loaded embed has targets.
		const embedTargets = this.#isEmbedReady() ? this.#embedTarget.resolve(stepIds) : new Map();
		this.#steps = buildStepQueue(stepIds, (stepId) => this.#resolveTarget(stepId, embedTargets));

		if (this.#steps.length === 0)
		{
			this.#embedTarget.destroy();

			if (!isManual)
			{
				void onboardingFlagService.completeTour();
			}

			return;
		}

		this.#isTourRunning = true;
		this.#showStep(0);
	}

	/**
	 * A step of the tour replaces the contents of the card that is already open instead of
	 * building a new one: the card keeps the focus it holds, and the accessibility tree is
	 * never left with two cards of the tour at once.
	 */
	#showStep(index: number): void
	{
		const step = this.#steps[index];
		if (!step)
		{
			return;
		}

		this.#currentIndex = index;
		const options = this.#getStepOptions(step, index);

		if (this.#coachmark)
		{
			this.#coachmark.update(options);
			this.#announceStep(step, index);

			return;
		}

		this.#coachmark = new Coachmark(options);
		this.#coachmark.show();
	}

	#getStepOptions(step: TourStep, index: number): CoachmarkOptions
	{
		const isLastStep = index === this.#steps.length - 1;

		return {
			...this.#getCommonLabels(),
			id: `tour-${step.id}`,
			target: step.target,
			side: step.side,
			title: step.title,
			text: step.text,
			image: step.image,
			pagination: {
				current: index + 1,
				total: this.#steps.length,
				onPrev: () => this.#showStep(Math.max(0, index - 1)),
				onNext: () => this.#goForward(isLastStep),
			},
			actions: [
				{
					text: isLastStep
						? Loc.getMessage('BICONNECTOR_DASHBOARD_ONBOARDING_DONE_BUTTON') ?? ''
						: Loc.getMessage('BICONNECTOR_DASHBOARD_ONBOARDING_NEXT_BUTTON') ?? '',
					primary: true,
					onClick: () => this.#goForward(isLastStep),
				},
			],
			onClose: () => {
				this.#coachmark = null;
				this.#finishTour(true);
			},
		};
	}

	/**
	 * The card stays the same node from step to step, so nothing in it tells a screen reader
	 * that the tour has moved on - the new step is spoken instead.
	 */
	#announceStep(step: TourStep, index: number): void
	{
		const message = Loc.getMessage('BICONNECTOR_DASHBOARD_ONBOARDING_STEP_ANNOUNCEMENT', {
			'#CURRENT#': String(index + 1),
			'#TOTAL#': String(this.#steps.length),
			'#TITLE#': step.title,
		});

		if (Type.isStringFilled(message))
		{
			LiveAnnouncer.announce(message);
		}
	}

	#goForward(isLastStep: boolean): void
	{
		if (isLastStep)
		{
			this.#closeCoachmark();
			this.#finishTour(false);

			return;
		}

		this.#showStep(this.#currentIndex + 1);
	}

	#finishTour(isSkipped: boolean): void
	{
		this.#isTourRunning = false;
		this.#embedTarget.destroy();

		if (this.#isManualRun)
		{
			return;
		}

		void onboardingFlagService.completeTour();

		// A manual run has already returned above, so reaching here means the automatic tour
		// has just recorded itself passed - the moment the restart is worth explaining once.
		if (isSkipped)
		{
			void this.#showRestartHint();
		}
	}

	// Two rare cards use a design system illustration; the six tour steps render an <img>.
	// Loading it here keeps ui.system.illustration out of the card bundle dependencies.
	async #loadIllustration(name: string): Promise<HTMLElement | null>
	{
		try
		{
			const { Illustration } = await Runtime.loadExtension('ui.system.illustration') as unknown as {
				Illustration: new (options: { name: string, size: number }) => { render: () => HTMLElement },
			};

			return new Illustration({ name, size: 98 }).render();
		}
		catch
		{
			return null;
		}
	}

	async #showEmptyDashboardCta(): Promise<void>
	{
		const target: HTMLElement | null = document.querySelector(StepTargetSelector[StepId.Edit]);
		if (!Type.isDomNode(target))
		{
			return;
		}

		const illustrationNode = await this.#loadIllustration(CardIllustration.CreateNew);
		if (!target.isConnected)
		{
			return;
		}

		this.#coachmark = new Coachmark({
			...this.#getCommonLabels(),
			id: 'empty-dashboard-cta',
			target,
			side: CardSide.Top,
			title: Loc.getMessage('BICONNECTOR_DASHBOARD_ONBOARDING_EMPTY_DASHBOARD_CTA_TITLE') ?? '',
			text: Loc.getMessage('BICONNECTOR_DASHBOARD_ONBOARDING_EMPTY_DASHBOARD_CTA_TEXT') ?? '',
			illustrationNode,
			actions: [
				{
					text: Loc.getMessage('BICONNECTOR_DASHBOARD_ONBOARDING_CLOSE_BUTTON') ?? '',
					onClick: () => {
						this.#closeCoachmark();
						void onboardingFlagService.dismissEmptyDashboardCta();
					},
				},
				{
					text: Loc.getMessage('BICONNECTOR_DASHBOARD_ONBOARDING_EMPTY_DASHBOARD_CTA_EDIT_BUTTON') ?? '',
					primary: true,
					onClick: () => {
						this.#closeCoachmark();
						void onboardingFlagService.dismissEmptyDashboardCta();
						this.#onEditRequested();
					},
				},
			],
			onClose: () => {
				this.#coachmark = null;
				void onboardingFlagService.dismissEmptyDashboardCta();
			},
		});

		this.#coachmark.show();
	}

	async #showRestartHint(): Promise<void>
	{
		const target: HTMLElement | null = document.querySelector(StepTargetSelector[StepId.Edit]);
		if (!Type.isDomNode(target))
		{
			return;
		}

		const illustrationNode = await this.#loadIllustration(CardIllustration.Help);
		if (!target.isConnected)
		{
			return;
		}

		this.#coachmark = new Coachmark({
			...this.#getCommonLabels(),
			id: 'restart-hint',
			target,
			side: CardSide.Top,
			title: Loc.getMessage('BICONNECTOR_DASHBOARD_ONBOARDING_RESTART_HINT_TITLE') ?? '',
			text: Loc.getMessage('BICONNECTOR_DASHBOARD_ONBOARDING_RESTART_HINT_TEXT') ?? '',
			illustrationNode,
			actions: [
				{
					text: Loc.getMessage('BICONNECTOR_DASHBOARD_ONBOARDING_GOT_IT_BUTTON') ?? '',
					primary: true,
					onClick: () => this.#closeCoachmark(),
				},
			],
			onClose: () => {
				this.#coachmark = null;
			},
		});

		this.#coachmark.show();
	}

	#getCommonLabels(): CoachmarkLabels
	{
		return {
			// A name of its own: the close icon and the visible dismiss action of the empty card
			// would otherwise answer a screen reader with the very same word.
			closeLabel: Loc.getMessage('BICONNECTOR_DASHBOARD_ONBOARDING_CLOSE_HINT') ?? '',
			previousLabel: Loc.getMessage('BICONNECTOR_DASHBOARD_ONBOARDING_PREVIOUS_STEP') ?? '',
			nextLabel: Loc.getMessage('BICONNECTOR_DASHBOARD_ONBOARDING_NEXT_STEP') ?? '',
		};
	}

	#closeCoachmark(): void
	{
		this.#coachmark?.close();
		this.#coachmark = null;
	}

	#resolveTarget(stepId: string, embedTargets: Map<string, HTMLElement>): HTMLElement | null
	{
		if (EmbedTargetBand[stepId])
		{
			return embedTargets.get(stepId) ?? null;
		}

		const selector = StepTargetSelector[stepId];

		return Type.isStringFilled(selector) ? document.querySelector<HTMLElement>(selector) : null;
	}
}
