import { Tag, Loc, Event, Reflection } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Popup } from 'main.popup';

import { Launcher } from 'ui.auto-launch';

import { EventName } from 'tasks.v2.const';

// Provides the shared «one onboarding at a time» slot (acquireSlot/releaseSlot) that SC-005
// joins below (T2); its lang files also hold the TASKS_V2_ONBOARDING_BANNERS_DEADLINELESS_HINT_* phrases.
import { onboardingBanners } from 'tasks.v2.lib.onboarding-banners';

import './deadlineless-hint.css';

// Hover-intent close delay, aligned with the kanban/grid SC-005 surfaces.
const closeDelay = 300;

// SC-005 shares the single «one onboarding at a time» slot (ALG-01) with SC-001/002/003.
// It is not a banner scenario (no promotion / shouldShow / setViewed), only a slot owner.
const DeadlinelessScenario = 'deadlineless';

// T2 coordination across all task-list lines (each line owns its own DeadlinelessHint):
//   1. at most one SC-005 hover popup is visible at a time, and
//   2. SC-005 never overlaps an active SC-001/002/003 banner (and vice versa).
// The shared onboarding slot is held on behalf of SC-005 as a whole while any hint is
// visible. Handing the hint from one line to another (a fast row-to-row move before the
// 300 ms close fires) keeps the slot, so the handover neither churns acquire/release nor
// depends on the previous popup's async onClose to free the slot before the next show.
let activeHint: ?DeadlinelessHint = null;

// Make `hint` the single active SC-005 popup. Returns false only when a banner already holds
// the shared slot, in which case SC-005 stands down (no overlap). On a takeover it closes the
// previously active hint but keeps the slot owned by SC-005.
function activateHint(hint: DeadlinelessHint): boolean
{
	if (activeHint === hint)
	{
		return true;
	}

	if (activeHint === null)
	{
		if (!onboardingBanners.acquireSlot(DeadlinelessScenario))
		{
			return false;
		}

		activeHint = hint;

		return true;
	}

	// Takeover: reassign first so the previous popup's onClose (which may fire async) sees it
	// is no longer the active hint and does NOT release the shared slot — SC-005 keeps it.
	const previous = activeHint;
	activeHint = hint;
	previous.close();

	return true;
}

// Release the shared slot when `hint` stops being the active one. Idempotent and safe from
// every close/destroy path (× button, CTA, Esc, autoHide, hover-intent timeout, onDestroy).
// No-ops if the hint already handed the slot over to another line (takeover).
function deactivateHint(hint: DeadlinelessHint): void
{
	if (activeHint === hint)
	{
		activeHint = null;
		onboardingBanners.releaseSlot(DeadlinelessScenario);
	}
}

/**
 * SC-005 onboarding hover popup: shown on a highlighted task-list line that has no
 * deadline and is owned by the current new user (predicate ALG-02 lives in the line).
 *
 * Q-2 (resolved): standalone hover popup with a manual `Launcher.canShowOnTop()`
 * guard before showing (AC-024) — NOT queued through a banner-dispatcher, because a
 * transient hover popup does not fit an event-driven queue. It does, however, join the
 * shared ALG-01 «one onboarding at a time» slot (module-scoped coordinator below) so it
 * never overlaps the SC-001/002/003 banners, and a module-scoped registry keeps at most one
 * SC-005 popup open across all lines (T2).
 *
 * No closed state is persisted (AC-023): visibility is purely derived from row data,
 * and the highlight disappears naturally once a deadline is set (the line predicate
 * turns false). The CTA reuses the field's own inline date picker through the
 * OpenDeadlinePicker event — the card is never opened.
 */
export class DeadlinelessHint
{
	#taskId: number | string;
	#getBindElement: () => ?HTMLElement;
	#onCta: ?() => void;
	#onClose: ?() => void;
	#popup: ?Popup = null;
	#closeTimer: ?number = null;

	// `onCta` / `onClose` are the analytics hooks for events 1-2 (click / close). They fire
	// only on the two explicit user interactions — the CTA button and the × close button —
	// not on hover-out / Esc / autoHide, which are incidental dismissals of a hover popup and
	// must not be counted as a user close. This matches the legacy list and kanban surfaces,
	// which instrument the same two buttons.
	constructor(
		taskId: number | string,
		getBindElement: () => ?HTMLElement,
		onCta: ?() => void,
		onClose: ?() => void,
	)
	{
		this.#taskId = taskId;
		this.#getBindElement = getBindElement;
		this.#onCta = onCta;
		this.#onClose = onClose;
	}

	/**
	 * Called on `mouseenter` of a highlighted line. Shows the popup only if it is not
	 * already shown and nothing covers the page (slider / overlay / viewer) — AC-024.
	 */
	tryShow(): void
	{
		this.#cancelScheduledClose();

		if (this.#popup)
		{
			return;
		}

		// AC-024: suppress under an overlay dialog / viewer / blocking popup. The line
		// with the hint lives inside the V2 card, which itself is an open slider, so the
		// current top slider is passed as the hint's own context — only surfaces opened
		// above it must suppress the hint.
		if (!Launcher.canShowOnTop({ slider: this.#getTopSlider() }))
		{
			return;
		}

		const bindElement = this.#getBindElement();
		if (!bindElement)
		{
			return;
		}

		// T2: enforce a single active SC-005 across all lines and no overlap with the
		// SC-001/002/003 banner. Stands down if a banner holds the shared slot; a takeover
		// from another line closes that line's popup here.
		if (!activateHint(this))
		{
			return;
		}

		this.#popup = this.#createPopup(bindElement);
		this.#popup.show();
	}

	/**
	 * Called on `mouseleave` of the line. Closes with a hover-intent delay so the
	 * cursor can travel from the line into the popup (same UX as kanban/grid).
	 */
	scheduleClose(): void
	{
		this.#cancelScheduledClose();

		if (!this.#popup)
		{
			return;
		}

		this.#closeTimer = setTimeout(() => this.close(), closeDelay);
	}

	#cancelScheduledClose(): void
	{
		if (this.#closeTimer !== null)
		{
			clearTimeout(this.#closeTimer);
			this.#closeTimer = null;
		}
	}

	#getTopSlider(): ?Object
	{
		return Reflection.getClass('BX.SidePanel.Instance')?.getTopSlider() ?? null;
	}

	#createPopup(bindElement: HTMLElement): Popup
	{
		const popup = new Popup({
			bindElement,
			content: this.#getContent(),
			targetContainer: document.body,
			width: 390,
			padding: 0,
			angle: true,
			background: 'var(--ui-color-bg-content-inapp, #0056bf)',
			borderRadius: 16,
			offsetLeft: 40,
			// Optional hover hint (not a user-invoked dialog): announce as a live status
			// region so it never steals focus and needs no focus-trap. Setting the role on
			// the popup itself avoids both a duplicate dialog role and a nameless dialog.
			role: 'status',
			ariaLabel: Loc.getMessage('TASKS_V2_ONBOARDING_BANNERS_DEADLINELESS_HINT_TITLE'),
			closeByEsc: true,
			autoHide: true,
			// The reference is dropped in onClose, so a cacheable popup would leak a new
			// hidden container into document.body on every hover.
			cacheable: false,
			className: 'tasks-onboarding-deadlineless-hint-popup',
		});

		const onClose = () => {
			this.#cancelScheduledClose();
			this.#popup = null;
			// T2: free the shared onboarding slot on every close path (× button, CTA, Esc,
			// autoHide, hover-intent timeout, onDestroy). No-ops if this hint already handed
			// the slot over to another line (takeover).
			deactivateHint(this);
		};

		popup.subscribe('onClose', onClose);
		popup.subscribe('onDestroy', onClose);

		// Hover-intent: keep the popup open while the cursor is inside it.
		const popupContainer = popup.getPopupContainer();
		if (popupContainer)
		{
			Event.bind(popupContainer, 'mouseenter', () => this.#cancelScheduledClose());
			Event.bind(popupContainer, 'mouseleave', () => this.scheduleClose());
		}

		return popup;
	}

	#getContent(): HTMLElement
	{
		const ctaButton = Tag.render`
			<button
				type="button"
				class="tasks-onboarding-deadlineless-hint__cta"
				data-testid="task-deadlineless-hint-cta"
			>
				${Loc.getMessage('TASKS_V2_ONBOARDING_BANNERS_DEADLINELESS_HINT_CTA')}
			</button>
		`;

		Event.bind(ctaButton, 'click', () => {
			this.#handleCta();
		});

		const closeButton = Tag.render`
			<button
				type="button"
				class="tasks-onboarding-deadlineless-hint__close"
				data-testid="task-deadlineless-hint-close"
				aria-label="${Loc.getMessage('TASKS_V2_ONBOARDING_BANNERS_DEADLINELESS_HINT_CLOSE')}"
			>&times;</button>
		`;

		Event.bind(closeButton, 'click', () => {
			// Event 1 (close_suggest_banner): explicit dismissal via the × button.
			this.#onClose?.();
			this.close();
		});

		return Tag.render`
			<div class="tasks-onboarding-deadlineless-hint">
				<div class="tasks-onboarding-deadlineless-hint__avatar"></div>
				<div class="tasks-onboarding-deadlineless-hint__body">
					<div class="tasks-onboarding-deadlineless-hint__title">
						${Loc.getMessage('TASKS_V2_ONBOARDING_BANNERS_DEADLINELESS_HINT_TITLE')}
					</div>
					<div class="tasks-onboarding-deadlineless-hint__text">
						${Loc.getMessage('TASKS_V2_ONBOARDING_BANNERS_DEADLINELESS_HINT_TEXT')}
					</div>
					${ctaButton}
				</div>
				${closeButton}
			</div>
		`;
	}

	#handleCta(): void
	{
		// Event 2 (click_suggest_banner): sent before opening the picker (ALG-02) so it is
		// not lost if the interaction navigates away.
		this.#onCta?.();

		// CTA: open the field's inline date picker on this task (the card stays closed).
		// Saving a deadline makes the line predicate false → the highlight/popup go away
		// naturally (AC-023), since the hint is derived from task.deadlineTs.
		EventEmitter.emit(EventName.OpenDeadlinePicker, { taskId: this.#taskId });

		this.close();
	}

	close(): void
	{
		this.#popup?.close();
	}

	destroy(): void
	{
		this.#cancelScheduledClose();
		this.#popup?.destroy();
		this.#popup = null;
		// T2: ensure the shared slot is freed even if the popup was never shown or onDestroy
		// did not fire. Idempotent — no-ops when this hint is not the active one.
		deactivateHint(this);
	}
}
