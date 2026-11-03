import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

// Loc-only dependency: TASKS_V2_ONBOARDING_BANNERS_DEADLINE_* phrases live in this lib's lang files.
import 'tasks.v2.lib.onboarding-banners';

import './deadline-banner.css';

/**
 * SC-001 onboarding inline banner shown under the «Deadline» field
 * when the field transitions to «No deadline».
 *
 * Presentational Vue component — no popup, no banner-dispatcher.
 * Emits:
 *   close  — user clicked the × button (parent should setViewed + releaseSlot)
 *   action — user clicked the CTA title (parent should open deadline picker + releaseSlot)
 * Mutual exclusion (ALG-01) is handled by the parent field via
 * onboardingBanners.acquireSlot() / releaseSlot().
 */
// @vue/component
export const DeadlineBanner = {
	name: 'TasksOnboardingDeadlineBanner',
	components: { BIcon },
	emits: ['close', 'action'],
	setup(): Object
	{
		return { Outline };
	},
	computed: {
		// SC-001 title: a single phrase with a [link]...[/link] placeholder marking
		// the accented clickable CTA fragment. Split here so translators keep one
		// sentence and can move the fragment position per target language.
		titleParts(): Object
		{
			const raw = this.loc('TASKS_V2_ONBOARDING_BANNERS_DEADLINE_TITLE');
			const match = raw.match(/^([\S\s]*?)\[link]([\S\s]*?)\[\/link]([\S\s]*)$/);
			if (!match)
			{
				return { before: '', cta: raw, after: '' };
			}

			return { before: match[1], cta: match[2], after: match[3] };
		},
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
		<div class="tasks-onboarding-deadline-banner" role="status" aria-live="polite">
			<span class="tasks-onboarding-deadline-banner__arrow" aria-hidden="true"></span>
			<div class="tasks-onboarding-deadline-banner__pill">
				<div class="tasks-onboarding-deadline-banner__avatar"></div>
				<div class="tasks-onboarding-deadline-banner__text">
					<span v-if="titleParts.before">{{ titleParts.before }}</span>
					<button
						type="button"
						class="tasks-onboarding-deadline-banner__cta"
						@click="handleCtaClick"
					>{{ titleParts.cta }}</button>
					<span v-if="titleParts.after">{{ titleParts.after }}</span>
				</div>
			</div>
			<button
				type="button"
				class="tasks-onboarding-deadline-banner__close"
				:aria-label="loc('TASKS_V2_ONBOARDING_BANNERS_DEADLINE_CLOSE') || 'Закрыть'"
				@click="handleCloseClick"
			>
				<BIcon :name="Outline.CROSS_L" aria-hidden="true"/>
			</button>
		</div>
	`,
};
