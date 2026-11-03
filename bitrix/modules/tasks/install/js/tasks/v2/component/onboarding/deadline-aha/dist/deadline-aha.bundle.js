/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports, main_core, main_core_events, main_popup, ui_iconSet_api_core, ui_iconSet_outline, tasks_v2_lib_onboardingBanners) {
	'use strict';

	/**
	 * SC-003 deadline aha-moment — imperative class that shows a main.popup anchored
	 * to the deadline field element and placed in document.body.
	 *
	 * Usage:
	 *   const aha = new DeadlineAha(taskId, () => hintBindElement, () => openPicker(), () => onClose(), defaultDeadlineDays);
	 *   aha.tryShow();   // respects ALG-01 gates
	 *   aha.destroy();   // on component unmount
	 *
	 * Slot balance (ALG-01):
	 *   acquire  → tryShow (once, guards with re-check)
	 *   release  → onClose / onDestroy of the popup (single path via #onPopupClose)
	 *              + #handleDragStart (calls popup.close() → same path)
	 *              + destroy() (calls popup.close() → same path)
	 *
	 * Analytics (close_suggest_banner) fires ONLY on an explicit user close of the hint
	 * (× button, Esc). Programmatic / service closes — destroy() from the parent's
	 * beforeUnmount (navigation / card close) and #handleDragStart (another popup starting
	 * to drag) — set #programmaticClose before calling popup.close() and are excluded, so
	 * a lifecycle teardown is never mis-reported as a user dismissal.
	 */
	class DeadlineAha {
		#getTarget;
		#onCta;
		#onClose;
		#popup = null;
		#dragHandler = null;
		#slotAcquired = false;
		#ctaTriggered = false;
		#programmaticClose = false;
		#defaultDeadlineDays = 0;
		constructor(taskId, getTarget, onCta, onClose, defaultDeadlineDays = 0) {
			this.#getTarget = getTarget;
			this.#onCta = onCta;
			this.#onClose = onClose;
			this.#defaultDeadlineDays = defaultDeadlineDays;
		}

		/**
		 * AC-013/AC-016: check gates, acquire slot, show popup.
		 */
		tryShow() {
			if (!tasks_v2_lib_onboardingBanners.onboardingBanners.shouldShow('deadlineAha')) {
				return;
			}

			// AC-016: yield to SC-002 (responsible banner) via the slot mutex. The
			// responsible field acquires the slot synchronously in mounted(), while
			// tryShow() always runs later (after the async extension load), so when
			// SC-002 actually shows this acquire fails. Checking the server-side
			// shouldShow('responsible') predicate here instead would starve SC-003
			// whenever SC-002 is eligible but blocked by its client-side gates
			// (non-self responsible, flow auto-assignee, new-user label, no edit rights).
			if (!tasks_v2_lib_onboardingBanners.onboardingBanners.acquireSlot('deadlineAha')) {
				return;
			}

			// Re-check after acquire (race guard)
			if (!tasks_v2_lib_onboardingBanners.onboardingBanners.shouldShow('deadlineAha')) {
				tasks_v2_lib_onboardingBanners.onboardingBanners.releaseSlot('deadlineAha');
				return;
			}
			this.#slotAcquired = true;
			const bindElement = this.#getTarget();
			if (!bindElement) {
				tasks_v2_lib_onboardingBanners.onboardingBanners.releaseSlot('deadlineAha');
				this.#slotAcquired = false;
				return;
			}
			this.#popup = this.#createPopup(bindElement);
			this.#popup.show();
			this.#dragHandler = this.#handleDragStart.bind(this);
			main_core_events.EventEmitter.subscribe('BX.Main.Popup:onDragStart', this.#dragHandler);
		}

		/**
		 * @private
		 */
		#createPopup(bindElement) {
			const content = main_core.Tag.render`
			<div class="tasks-onboarding-deadline-aha">
				<div class="tasks-onboarding-deadline-aha__graphics">
					<div class="tasks-onboarding-deadline-aha__calendar"></div>
					<div class="tasks-onboarding-deadline-aha__zefir"></div>
				</div>
				<div class="tasks-onboarding-deadline-aha__body">
					<div class="tasks-onboarding-deadline-aha__title">
						${main_core.Loc.getMessage('TASKS_V2_ONBOARDING_BANNERS_DEADLINE_AHA_TITLE')}
					</div>
					<div class="tasks-onboarding-deadline-aha__text">
						${main_core.Loc.getMessagePlural('TASKS_V2_ONBOARDING_BANNERS_DEADLINE_AHA_TEXT', this.#defaultDeadlineDays, {
			'#DAYS#': this.#defaultDeadlineDays
		})}
					</div>
					<button
						type="button"
						class="tasks-onboarding-deadline-aha__cta"
						data-testid="task-deadline-aha-cta"
					>${main_core.Loc.getMessage('TASKS_V2_ONBOARDING_BANNERS_DEADLINE_AHA_CTA')}</button>
				</div>
				<button
					type="button"
					class="tasks-onboarding-deadline-aha__close"
					data-testid="task-deadline-aha-close"
					aria-label="${main_core.Loc.getMessage('TASKS_V2_ONBOARDING_BANNERS_DEADLINE_AHA_CLOSE') || 'Закрыть'}"
				>${new ui_iconSet_api_core.Icon({
			icon: ui_iconSet_api_core.Outline.CROSS_L
		}).render()}</button>
			</div>
		`;
			const ctaButton = content.querySelector('.tasks-onboarding-deadline-aha__cta');
			main_core.Event.bind(ctaButton, 'click', () => this.#handleCta());
			const closeButton = content.querySelector('.tasks-onboarding-deadline-aha__close');
			main_core.Event.bind(closeButton, 'click', () => this.#popup?.close());
			return new main_popup.Popup({
				bindElement,
				content,
				targetContainer: document.body,
				width: 540,
				offsetLeft: 5,
				padding: 0,
				angle: {
					position: 'top',
					offset: 30
				},
				background: '#0056bf',
				borderRadius: 16,
				// Auto-shown hint (not a user-invoked dialog): announce as a live status
				// region so it never steals focus and needs no focus-trap (WCAG 2.4.3).
				role: 'status',
				closeByEsc: true,
				autoHide: false,
				// The reference is dropped in onClose, so a cacheable popup would leak a
				// hidden container into document.body on every create-form open.
				cacheable: false,
				className: 'tasks-onboarding-deadline-aha-popup',
				events: {
					onClose: () => this.#onPopupClose(),
					onDestroy: () => this.#onPopupClose()
				}
			});
		}

		/**
		 * @private — CTA click: mark the CTA path, run the CTA callback, close the popup.
		 * setViewed is handled once in #onPopupClose (fired by close()), so it must not be
		 * called here — avoids a duplicate network request on the CTA path. #ctaTriggered
		 * tells #onPopupClose the click already sent its own event (click_suggest_banner via
		 * #onCta), so the ensuing close() must NOT also emit close_suggest_banner — one
		 * interaction, one event.
		 */
		#handleCta() {
			this.#ctaTriggered = true;
			this.#onCta?.();
			this.#popup?.close();
		}

		/**
		 * @private — drag-start on any main.popup: close our aha popup. This is a service
		 * close (not a user dismissal), so it must not emit close_suggest_banner.
		 */
		#handleDragStart(event) {
			// Only close if the dragged popup is NOT our own aha popup
			const draggedPopup = event.getCompatData?.()?.[0];
			if (draggedPopup && draggedPopup === this.#popup) {
				return;
			}
			this.#programmaticClose = true;
			this.#popup?.close();
		}

		/**
		 * @private — single release path for all close scenarios.
		 */
		#onPopupClose() {
			this.#unsubscribeDrag();
			if (this.#slotAcquired) {
				tasks_v2_lib_onboardingBanners.onboardingBanners.setViewed('deadlineAha');
				tasks_v2_lib_onboardingBanners.onboardingBanners.releaseSlot('deadlineAha');
				this.#slotAcquired = false;

				// close_suggest_banner fires ONLY on an explicit user close (× button / Esc).
				// The CTA path (#ctaTriggered) already emitted click_suggest_banner via #onCta,
				// and programmatic / service closes (#programmaticClose: destroy() lifecycle
				// teardown, drag-start of another popup) are not user dismissals — both are
				// excluded so a teardown or navigation is never mis-reported as a close (one
				// interaction, one event). Guarded by the one-shot #slotAcquired flag so a
				// close+destroy double fire cannot emit the close event twice.
				if (!this.#ctaTriggered && !this.#programmaticClose) {
					this.#onClose?.();
				}
			}
			this.#popup = null;
		}

		/**
		 * @private
		 */
		#unsubscribeDrag() {
			if (this.#dragHandler) {
				main_core_events.EventEmitter.unsubscribe('BX.Main.Popup:onDragStart', this.#dragHandler);
				this.#dragHandler = null;
			}
		}

		/**
		 * Called from beforeUnmount() of the parent Vue component. This is a programmatic
		 * lifecycle teardown (navigation / card close), not a user dismissal, so it must not
		 * emit close_suggest_banner — mark it before closing the popup.
		 */
		destroy() {
			this.#programmaticClose = true;
			this.#popup?.close();
			// If popup is already null (was closed), ensure cleanup
			this.#unsubscribeDrag();
			if (this.#slotAcquired) {
				tasks_v2_lib_onboardingBanners.onboardingBanners.releaseSlot('deadlineAha');
				this.#slotAcquired = false;
			}
		}
	}

	exports.DeadlineAha = DeadlineAha;

})(this.BX.Tasks.V2.Component.Onboarding = this.BX.Tasks.V2.Component.Onboarding || {}, BX, BX.Event, BX.Main, BX.UI.IconSet, window, BX.Tasks.V2.Lib);
//# sourceMappingURL=deadline-aha.bundle.js.map
