import { Dom, Loc, Runtime, Type, userOptions } from 'main.core';

import { FILTER_HINT_STATE, FILTER_SEARCH_CONTAINER_ID_SUFFIX } from '../constants';
import { type FilterHintState } from '../types';

// The hint extensions are loaded on demand: it is shown at most once per user, so a static import
// (which would add them to the grid dependencies for everyone) is avoided. ui.auto-launch is asked
// for explicitly - loadExtension returns the exports of the requested extensions only, and
// BannerDispatcher cannot enable the launcher itself. ui.banner-dispatcher publishes into the
// shared BX.UI namespace, hence it goes first: the merged exports of the narrower namespaces win.
const HINT_EXTENSIONS = ['ui.banner-dispatcher', 'ui.auto-launch', 'ui.tour'];
const GUIDE_ID = 'bizproc-ai-agents-filter-hint';
const GUIDE_FINISH_EVENT = 'UI.Tour.Guide:onFinish';
const OPTION_CATEGORY = 'bizproc';
const OPTION_NAME = 'aiAgentsFilterHint';
const OPTION_VALUE_NAME = 'state';

const TEST_ID = {
	HINT: 'bizproc-ai-agents-grid-filter-hint',
	DISMISS: 'bizproc-ai-agents-grid-filter-hint-dismiss',
};

/**
 * One-off onboarding hint pointing at the grid filter (ALG-04).
 *
 * The intent to show it is persisted BEFORE the attempt and the "shown" state only after the hint
 * has actually been closed: the banner queue delays the show by seconds, and a user who leaves the
 * page in the meantime must not lose the single hint. The state is a personal server option rather
 * than localStorage, so the hint does not come back on another device (AC-025).
 */
export class FilterHint
{
	#gridId: string;
	#state: FilterHintState;
	#attempt: ?Promise<void> = null;

	constructor(gridId: string, state: ?string)
	{
		this.#gridId = gridId;
		this.#state = Object.values(FILTER_HINT_STATE).includes(state)
			? state
			: FILTER_HINT_STATE.NONE
		;
	}

	/**
	 * Entry from the confirmed "view launched" transition: the only condition that schedules the
	 * hint (AC-023).
	 */
	async request(): Promise<void>
	{
		if (this.#state === FILTER_HINT_STATE.SHOWN)
		{
			return;
		}

		if (this.#state !== FILTER_HINT_STATE.PENDING)
		{
			this.#saveState(FILTER_HINT_STATE.PENDING);
		}

		await this.#tryShow();
	}

	/**
	 * Entry from the page render: finishes an intent that was scheduled earlier but never reached
	 * the screen. It does not widen the condition of the hint and loads nothing while the state is
	 * not pending.
	 */
	async retryOnLoad(): Promise<void>
	{
		if (this.#state !== FILTER_HINT_STATE.PENDING)
		{
			return;
		}

		await this.#tryShow();
	}

	#tryShow(): Promise<void>
	{
		this.#attempt ??= this.#queue();

		return this.#attempt;
	}

	async #queue(): Promise<void>
	{
		try
		{
			const { Guide, BannerDispatcher, AutoLauncher } = await Runtime.loadExtension(HINT_EXTENSIONS);

			// Once the page has played its own banners the queue empties and the launcher turns
			// itself off - any later registration would never start.
			if (!AutoLauncher.isEnabled())
			{
				AutoLauncher.enable();
			}

			// The priority queue, not the normal one: there every item after the first is marked as
			// not launchable after others and is dropped silently, without the callback being run.
			BannerDispatcher.high.toQueue((onDone: () => void) => {
				this.#show(Guide, onDone);
			});
		}
		catch
		{
			// Onboarding is optional: a failure must not affect the grid and must stay silent. The
			// state remains pending, so the next page load tries again.
			this.#attempt = null;
		}
	}

	#show(Guide: Function, onDone: () => void): void
	{
		// The queue stays blocked until the item reports back, so every branch below ends in finish(),
		// which releases the queue exactly once, even if the hint is closed twice.
		let isFinished = false;
		const finish = (isShown: boolean): void => {
			if (isFinished)
			{
				return;
			}

			isFinished = true;

			if (isShown)
			{
				this.#saveState(FILTER_HINT_STATE.SHOWN);
			}

			onDone();
		};

		try
		{
			// The target is resolved now and not when the hint was requested: the filter repaints
			// its search container between the two moments.
			if (!Dom.isShownRecursive(this.#resolveSearchContainer()))
			{
				// The intent stays pending, so a later visit tries again.
				finish(false);

				return;
			}

			const guide = new Guide({
				id: GUIDE_ID,
				overlay: false,
				simpleMode: true,
				// The only mode in which a guide without an overlay can be bound to a target: the
				// offset of a top/bottom step is otherwise measured against the overlay element,
				// which ui.tour creates for overlay: true only, and start() throws right after the
				// popup is on screen. This mode drops the built-in footer, so the dismiss button is
				// declared on the step - its phrase is the one the footer button uses.
				onEvents: true,
				steps: [
					{
						target: (): ?HTMLElement => this.#resolveSearchContainer(),
						text: Loc.getMessage('BIZPROC_AI_AGENTS_GRID_FILTER_HINT_TEXT'),
						position: 'bottom',
						buttons: [
							{
								text: Loc.getMessage('JS_UI_TOUR_BUTTON_SIMPLE'),
								event: (): void => guide.close(),
							},
						],
					},
				],
			});

			// The hint counts as shown only here: close() runs on the dismiss button, on Esc, on a
			// click outside the popup and on a click on the filter itself.
			guide.subscribe(GUIDE_FINISH_EVENT, () => finish(true));

			// Guide builds its popup options internally, so the dismissal options are set afterwards:
			// this mode keeps the popup open on an outside click, and the hint has to be closeable
			// without a mouse as well.
			const popup = guide.getPopup();
			popup.setAutoHide(true);
			popup.setClosingByEsc(true);
			this.#namePopup(popup.getPopupContainer());
			this.#markPopup(popup);

			guide.start();
		}
		catch
		{
			finish(false);
		}
	}

	/**
	 * main.popup gives every popup the dialog role, and ui.tour passes it no name - so the hint would
	 * be announced as a nameless dialog. An existing name is left alone: naming the popup belongs to
	 * ui.tour, and once it does so its own label must win.
	 */
	#namePopup(container: ?HTMLElement): void
	{
		if (!container || Type.isStringFilled(Dom.attr(container, 'aria-label')))
		{
			return;
		}

		Dom.attr(container, 'aria-label', Loc.getMessage('BIZPROC_AI_AGENTS_GRID_FILTER_HINT_LABEL'));
	}

	/**
	 * The hint is drawn by ui.tour, so both of its nodes are marked for e2e from the outside. The
	 * dismiss button is a popup button and not a node inside the hint content: this mode renders no
	 * footer of its own, and the guide turns every step button into a popup one.
	 */
	#markPopup(popup: Object): void
	{
		const container = popup.getPopupContainer();

		if (container)
		{
			Dom.attr(container, 'data-test-id', TEST_ID.HINT);
		}

		const [dismissButton] = popup.getButtons();

		if (dismissButton)
		{
			Dom.attr(dismissButton.getContainer(), 'data-test-id', TEST_ID.DISMISS);
		}
	}

	#resolveSearchContainer(): ?HTMLElement
	{
		return document.getElementById(`${this.#gridId}${FILTER_SEARCH_CONTAINER_ID_SUFFIX}`);
	}

	/**
	 * The client owns the state: save() keeps it in the BX.userOptions cookie, which the next hit
	 * replays, and send() clears that cookie before firing the request - so the immediate send trades
	 * the fallback for not waiting out the default delay.
	 */
	#saveState(state: FilterHintState): void
	{
		this.#state = state;
		userOptions.save(OPTION_CATEGORY, OPTION_NAME, OPTION_VALUE_NAME, state);
		userOptions.send(null);
	}
}
