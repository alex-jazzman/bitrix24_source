/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, main_core, tasks_v2_core) {
	'use strict';

	// SC-005 (the deadlineless-row hover hint) is not a banner scenario — it has no promotion,
	// shouldShow() or setViewed() — but it shares the single «one onboarding at a time» slot
	// (ALG-01) so the hint and the SC-001/002/003 banners never overlap. The slot owner is thus
	// a banner scenario OR the SC-005 hint key.

	const PromotionMap = Object.freeze({
		deadline: 'tasks_deadline_banner',
		responsible: 'tasks_responsible_banner',
		deadlineAha: 'tasks_deadline_aha'
	});
	class OnboardingBanners {
		// ALG-01: mutual exclusion — at most one onboarding element (SC-001/002/003 banner or the
		// SC-005 hover hint) is shown at a time. Owners call acquireSlot() before showing and
		// releaseSlot() on close/destroy.
		#activeScenario = null;

		// Session-local overrides layered on top of the frozen params DTO. Core.getParams() returns
		// Extension.getSettings('tasks.v2.core'), which runs the object through deepFreeze(), so the
		// server-fed closeCount / isViewed can be read but never mutated. We keep the «closed/viewed
		// in this session» delta here instead (cf. AhaMoments.#shownPopups) so a dismissed banner does
		// not re-arm on the same page before reload without ever writing into the frozen DTO.
		#localCloseCount = {
			deadline: 0,
			responsible: 0
		};
		#deadlineAhaViewedLocally = false;
		#getParams() {
			const params = tasks_v2_core.Core.getParams();
			if (!params || !params.onboardingBanners) {
				return null;
			}
			return params.onboardingBanners;
		}
		get isNewUser() {
			return this.#getParams()?.isNewUser === true;
		}
		get noDeadlineCount() {
			return this.#getParams()?.counters?.noDeadlineCount ?? 0;
		}
		get selfAssignStreak() {
			return this.#getParams()?.counters?.selfAssignStreak ?? 0;
		}
		get daysWithoutManualDeadline() {
			return this.#getParams()?.counters?.daysWithoutManualDeadline ?? 0;
		}
		shouldShow(scenario) {
			const params = this.#getParams();
			if (!params || !params.isNewUser) {
				return false;
			}
			if (scenario === 'deadline') {
				// AC-001: show to a new user when the deadline is removed (event — in the P2 adapter)
				// AC-003: no longer show after 2 dismissals via the close button
				// AC-004: auto-hide after 3 tasks without a deadline (exact logic on the front end from the raw DTO-01 counters)
				return this.#effectiveCloseCount(params, 'deadline') < 2 && (params.counters?.noDeadlineCount ?? 0) < 3;
			}
			if (scenario === 'responsible') {
				// AC-007: show after 3 tasks in a row assigned "to self"
				// AC-010: no longer show after 2 dismissals via the close button
				return this.#effectiveCloseCount(params, 'responsible') < 2 && (params.counters?.selfAssignStreak ?? 0) >= 3;
			}
			if (scenario === 'deadlineAha') {
				// AC-013/AC-014: show once, never again after it has been shown
				return this.#isDeadlineAhaViewed(params) === false && (params.counters?.daysWithoutManualDeadline ?? 0) >= 3;
			}
			return false;
		}

		// Effective close count = server value (frozen DTO) + closes recorded in this session.
		#effectiveCloseCount(params, scenario) {
			const serverCloseCount = scenario === 'deadline' ? params.deadlineBanner?.closeCount ?? 0 : params.responsibleBanner?.closeCount ?? 0;
			return serverCloseCount + this.#localCloseCount[scenario];
		}

		// deadlineAha counts as viewed once the server says so OR it was shown in this session.
		#isDeadlineAhaViewed(params) {
			return (params.deadlineAha?.isViewed ?? false) || this.#deadlineAhaViewedLocally;
		}

		/**
		 * ALG-01 mutual exclusion (AC-005/AC-009/AC-016): acquire the global «one active
		 * onboarding» slot before showing SC-001/002/003 or the SC-005 hint. Returns true if the
		 * slot was free and is now owned by this owner; false if another owner is active.
		 * The caller MUST call releaseSlot(owner) when the popup closes or is destroyed.
		 */
		acquireSlot(owner) {
			if (this.#activeScenario !== null) {
				return false;
			}
			this.#activeScenario = owner;
			return true;
		}

		/**
		 * Release the slot acquired by acquireSlot(). Idempotent: safe to call multiple
		 * times (e.g. from both onClose and onDestroy).
		 */
		releaseSlot(owner) {
			if (this.#activeScenario === owner) {
				this.#activeScenario = null;
			}
		}
		setViewed(scenario) {
			const promotion = PromotionMap[scenario];
			if (!promotion) {
				return;
			}

			// Apply the new state to the local DTO synchronously: shouldShow() reads it,
			// so a dismissed banner must not re-arm on the same page before reload.
			this.#applyViewedLocally(scenario);

			// Best-effort: on a network error the server state simply stays behind and
			// the banner may show again in the next session; no logging needed.
			// ajax comes from main.core (its includes bundle BX.ajax.runAction), so this
			// lib — sitting in the rel graph of the hot deadline/responsible fields and
			// the task list — pulls no extra extension for its single network call.
			main_core.ajax.runAction('tasks.promotion.setViewed', {
				data: {
					promotion
				}
			}).catch(() => {});
		}
		#applyViewedLocally(scenario) {
			// Record the dismissal in session-local state only — the params DTO is frozen (see
			// #localCloseCount). shouldShow() reads server + local, so the banner does not re-arm on
			// the same page before reload.
			if (scenario === 'deadline' || scenario === 'responsible') {
				this.#localCloseCount[scenario] += 1;
			} else if (scenario === 'deadlineAha') {
				this.#deadlineAhaViewedLocally = true;
			}
		}

		/**
		 * Reset the session-local overrides. For test isolation only: the exported singleton is
		 * shared across the unit suite and this state otherwise accumulates between tests.
		 * Production code never calls this.
		 * @internal
		 */
		resetLocalStateForTests() {
			this.#localCloseCount = {
				deadline: 0,
				responsible: 0
			};
			this.#deadlineAhaViewedLocally = false;
		}
	}
	const onboardingBanners = new OnboardingBanners();

	exports.onboardingBanners = onboardingBanners;

})(this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}, BX, BX.Tasks.V2);
//# sourceMappingURL=onboarding-banners.bundle.js.map
