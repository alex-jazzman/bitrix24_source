import { Loc } from 'main.core';
import { BannerDispatcher } from 'ui.banner-dispatcher';
import { Guide } from 'ui.tour';
import { nextTick } from 'ui.vue3';

import { usePublishMenuStore } from '../blocks/stores/publish-menu';
import { isOnboardingDismissed, markOnboardingDismissed } from './dismissed-flag';

const BANNER_ID = 'bizprocdesigner_pilot_publication_onboarding';

const PILOT_OPTION_SELECTOR = '[data-testid="bizprocdesigner-editor-publish-user-option"]';
const PILOT_BADGE_SELECTOR = '[data-testid="bizprocdesigner-pilot-badge"]';

/**
 * The hold of the publish menu the tour needs. The pair comes from the caller: the store behind it
 * belongs to the application of the editor, and the callback of the queue runs long after the moment
 * that application can be told from another one on the page.
 */
export type PublishMenuHold = {
	hold: () => void,
	release: () => void,
};

/**
 * Every step remembers itself. The mark of the step about the publication is the key the whole onboarding
 * used to be marked by: whoever has seen the one-step tour does not see it again, and the step about the
 * running pilot still awaits its turn.
 */
const STEPS = [
	{
		dismissedKey: 'bizprocdesigner_pilot_publication_onboarding_dismissed',
		selector: PILOT_OPTION_SELECTOR,
		needsPublishMenu: true,
		title: 'BIZPROCDESIGNER_EDITOR_PILOT_ONBOARDING_PUBLISH_TITLE',
		text: 'BIZPROCDESIGNER_EDITOR_PILOT_ONBOARDING_PUBLISH_TEXT',
	},
	{
		dismissedKey: 'bizprocdesigner_pilot_publication_badge_onboarding_dismissed',
		selector: PILOT_BADGE_SELECTOR,
		needsPublishMenu: false,
		title: 'BIZPROCDESIGNER_EDITOR_PILOT_ONBOARDING_BADGE_TITLE',
		text: 'BIZPROCDESIGNER_EDITOR_PILOT_ONBOARDING_BADGE_TEXT',
	},
];

function findVisibleNode(selector: string): ?HTMLElement
{
	const node: ?HTMLElement = document.querySelector(selector);

	return node?.offsetWidth > 0 ? node : null;
}

/**
 * Tells the publisher about the pilot publication: where a scheme is published for chosen employees and
 * where the running pilot is seen afterwards. The first step points at the item of the publish menu, so
 * the menu is opened for it and held open until the tour is over. The mark of the pilot appears in the
 * toolbar only after the first pilot publication, so the step about it waits for the opening of the
 * editor where it is there to point at.
 */
export class PilotPublicationOnboarding
{
	#publishMenu: PublishMenuHold;
	// The menu is given back exactly once, whichever way the tour ends: a release the tour never took
	// would close the menu of the publication that is running behind it.
	#isMenuHeld: boolean = false;

	// The store is read here, in the call of the component that starts the tour, and not in the
	// callback of the queue below: a store resolved there lands in whatever Pinia is active by then.
	static show(publishMenu: PublishMenuHold = usePublishMenuStore()): void
	{
		new PilotPublicationOnboarding(publishMenu).showOnboarding();
	}

	constructor(publishMenu: PublishMenuHold)
	{
		this.#publishMenu = publishMenu;
	}

	showOnboarding(): void
	{
		const pending = STEPS.filter((step: Object) => !isOnboardingDismissed(step.dismissedKey));
		if (pending.length === 0)
		{
			return;
		}

		// The queue is shared with the other onboardings of the editor, so the steps are collected at
		// the moment the turn comes: by then the toolbar may look different.
		BannerDispatcher.normal.toQueue(async (onDone) => {
			let closed = false;
			const finish = () => {
				if (closed)
				{
					return;
				}

				closed = true;
				this.#releasePublishMenu();
				onDone();
			};

			// The menu is taken while the steps are collected, and both the collecting and the start of
			// the tour can fail. Only a tour that really started gives the menu back by itself, so every
			// other outcome ends here: otherwise the editor keeps a menu nothing can close and the shared
			// queue of the banners never moves on.
			let isTourStarted = false;

			try
			{
				const steps = await this.#buildSteps(pending);
				if (steps.length === 0)
				{
					return;
				}

				new Guide({
					id: BANNER_ID,
					// A single step has nothing to count and nowhere to go back to.
					simpleMode: steps.length === 1,
					steps,
					events: { onFinish: finish },
				}).start();

				isTourStarted = true;
			}
			finally
			{
				if (!isTourStarted)
				{
					finish();
				}
			}
		}, { id: BANNER_ID });
	}

	async #buildSteps(pending: Array<Object>): Promise<Array<Object>>
	{
		if (pending.some((step: Object) => step.needsPublishMenu))
		{
			this.#holdPublishMenu();
			await nextTick();
		}

		const shown = pending
			.map((step: Object) => ({ ...step, target: findVisibleNode(step.selector) }))
			.filter((step: Object) => step.target !== null)
		;

		// The menu was opened for a step that has nothing to point at - a publication to an audience is
		// not offered here - so it goes back to how the publisher left it.
		if (!shown.some((step: Object) => step.needsPublishMenu))
		{
			this.#releasePublishMenu();
		}

		return shown.map((step: Object) => ({
			target: step.target,
			title: Loc.getMessage(step.title),
			text: Loc.getMessage(step.text),
			position: 'bottom',
			// A step counts as told the moment it is on the screen: the tour left halfway keeps the steps
			// that were never reached for the next opening of the editor.
			events: { onShow: () => markOnboardingDismissed(step.dismissedKey) },
		}));
	}

	#holdPublishMenu(): void
	{
		if (this.#isMenuHeld)
		{
			return;
		}

		this.#isMenuHeld = true;
		this.#publishMenu.hold();
	}

	#releasePublishMenu(): void
	{
		if (!this.#isMenuHeld)
		{
			return;
		}

		this.#isMenuHeld = false;
		this.#publishMenu.release();
	}
}
