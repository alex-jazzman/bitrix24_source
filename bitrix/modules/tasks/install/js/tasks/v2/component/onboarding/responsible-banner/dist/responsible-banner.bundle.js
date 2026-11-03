/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports, ui_iconSet_api_vue) {
	'use strict';

	/**
	 * SC-002 onboarding inline banner shown under the «Responsible» field
	 * when the new-task form opens after a server-side «3 self-assigned in a row» trigger.
	 *
	 * Presentational Vue component — no popup, no banner-dispatcher.
	 * Emits: close (when the user clicks the × button).
	 * Mutual exclusion (ALG-01) is handled by the parent field via
	 * onboardingBanners.acquireSlot() / releaseSlot().
	 */
	// @vue/component
	const ResponsibleBanner = {
		name: 'TasksOnboardingResponsibleBanner',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		emits: ['close', 'action'],
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		methods: {
			handleCtaClick() {
				this.$emit('action');
			},
			handleCloseClick() {
				this.$emit('close');
			}
		},
		template: `
		<div class="tasks-onboarding-responsible-banner" role="status" aria-live="polite">
			<span class="tasks-onboarding-responsible-banner__arrow" aria-hidden="true"></span>
			<div class="tasks-onboarding-responsible-banner__pill">
				<div class="tasks-onboarding-responsible-banner__avatar"></div>
				<div class="tasks-onboarding-responsible-banner__text">
					<button
						type="button"
						class="tasks-onboarding-responsible-banner__cta"
						@click="handleCtaClick"
					>{{ loc('TASKS_V2_ONBOARDING_BANNERS_RESPONSIBLE_TITLE') }}</button>
					<span class="tasks-onboarding-responsible-banner__subtitle">{{ loc('TASKS_V2_ONBOARDING_BANNERS_RESPONSIBLE_SUBTITLE') }}</span>
				</div>
			</div>
			<button
				type="button"
				class="tasks-onboarding-responsible-banner__close"
				:aria-label="loc('TASKS_V2_ONBOARDING_BANNERS_RESPONSIBLE_CLOSE') || 'Закрыть'"
				@click="handleCloseClick"
			>
				<BIcon :name="Outline.CROSS_L" aria-hidden="true"/>
			</button>
		</div>
	`
	};

	exports.ResponsibleBanner = ResponsibleBanner;

})(this.BX.Tasks.V2.Component.Onboarding = this.BX.Tasks.V2.Component.Onboarding || {}, BX.UI.IconSet);
//# sourceMappingURL=responsible-banner.bundle.js.map
