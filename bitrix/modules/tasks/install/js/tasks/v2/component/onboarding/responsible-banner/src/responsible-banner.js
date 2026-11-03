import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

// Loc-only dependency: TASKS_V2_ONBOARDING_BANNERS_RESPONSIBLE_* phrases live in this lib's lang files.
import 'tasks.v2.lib.onboarding-banners';

import './responsible-banner.css';

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
export const ResponsibleBanner = {
	name: 'TasksOnboardingResponsibleBanner',
	components: { BIcon },
	emits: ['close', 'action'],
	setup(): Object
	{
		return { Outline };
	},
	methods: {
		handleCtaClick(): void
		{
			this.$emit('action');
		},
		handleCloseClick(): void
		{
			this.$emit('close');
		},
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
	`,
};
