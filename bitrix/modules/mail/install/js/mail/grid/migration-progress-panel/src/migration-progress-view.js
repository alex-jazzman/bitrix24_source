import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import { HeadlineXs, TextSm, TextXs } from 'ui.system.typography.vue';
import { defineComponent } from 'ui.vue3';

import { MigrationStepper, type MigrationStep } from './migration-stepper';

export type MigrationProgressViewState = {
	summary: string,
	message: string,
	retryVisible: boolean,
	retryDisabled: boolean,
	stageVisible: boolean,
	stageTitle: string,
	stageDescription: string,
	steps: MigrationStep[],
	details: Array<{ label: string, value: string }>,
	hints: string[],
	manualVisible: boolean,
	manualDescription: string,
	manualWaitingSince: string,
	manualAllowedCommands: string[],
	manualCommandPending: boolean,
	selectStage: (index: number) => void,
	retry: () => void,
	manualAction: (command: string) => void,
};

// @vue/component
export const MigrationProgressView = defineComponent({
	name: 'MailMigrationProgressView',
	components: { HeadlineXs, MigrationStepper, TextSm, TextXs, UiButton },
	props: {
		state: {
			type: Object,
			required: true,
		},
	},
	setup()
	{
		return {
			AirButtonStyle,
			ButtonSize,
		};
	},
	template: `
		<div class="mail-migration-progress__layout">
			<header class="mail-migration-progress__header">
				<h2 class="mail-migration-progress__title">{{ $Bitrix.Loc.getMessage('MAIL_MIGRATION_PROGRESS_TITLE') }}</h2>
				<div class="mail-migration-progress__summary">{{ state.summary }}</div>
			</header>

			<div class="mail-migration-progress__live" role="status" aria-live="polite" aria-atomic="true">
				{{ state.message }}
			</div>

			<template v-if="state.stageVisible">
				<section class="mail-migration-progress__stage-card">
					<h3 class="mail-migration-progress__stage-title">{{ state.stageTitle }}</h3>
					<p class="mail-migration-progress__stage-description">{{ state.stageDescription }}</p>
				</section>

				<MigrationStepper :steps="state.steps" @select="state.selectStage"/>
			</template>

			<section v-if="state.details.length > 0" class="mail-migration-progress__metrics" aria-labelledby="mail-migration-progress-metrics-title">
				<HeadlineXs id="mail-migration-progress-metrics-title" tag="h3">
					{{ $Bitrix.Loc.getMessage('MAIL_MIGRATION_PROGRESS_CURRENT_METRICS_TITLE') }}
				</HeadlineXs>
				<dl class="mail-migration-progress__details">
					<div v-for="(detail, index) in state.details" :key="index" class="mail-migration-progress__detail">
						<dt>{{ detail.label }}</dt>
						<dd>{{ detail.value }}</dd>
					</div>
				</dl>
			</section>

			<div v-if="state.hints.length > 0" class="mail-migration-progress__hint">
				<p v-for="(hint, index) in state.hints" :key="index">{{ hint }}</p>
			</div>

			<section
				v-if="state.manualVisible"
				class="mail-migration-progress__manual-control"
				data-testid="mail-migration-manual-control"
				aria-labelledby="mail-migration-manual-control-title"
			>
				<HeadlineXs id="mail-migration-manual-control-title" tag="h3">
					{{ $Bitrix.Loc.getMessage('MAIL_MIGRATION_PROGRESS_MANUAL_TITLE') }}
				</HeadlineXs>
				<TextSm tag="p" class="mail-migration-progress__manual-description">
					{{ state.manualDescription }}
				</TextSm>
				<TextXs v-if="state.manualWaitingSince" tag="p" class="mail-migration-progress__manual-waiting">
					{{ state.manualWaitingSince }}
				</TextXs>
				<div class="mail-migration-progress__manual-actions">
					<div v-if="state.manualAllowedCommands.includes('enable')">
						<UiButton
							:text="$Bitrix.Loc.getMessage('MAIL_MIGRATION_PROGRESS_MANUAL_ENABLE')"
							:style="AirButtonStyle.FILLED"
							:size="ButtonSize.MEDIUM"
							:disabled="state.manualCommandPending"
							:loading="state.manualCommandPending"
							:dataset="{ testid: 'mail-migration-manual-enable' }"
							@click="state.manualAction('enable')"
						/>
					</div>
					<div v-if="state.manualAllowedCommands.includes('grant')">
						<UiButton
							:text="$Bitrix.Loc.getMessage('MAIL_MIGRATION_PROGRESS_MANUAL_GRANT')"
							:style="AirButtonStyle.FILLED"
							:size="ButtonSize.MEDIUM"
							:disabled="state.manualCommandPending"
							:loading="state.manualCommandPending"
							:dataset="{ testid: 'mail-migration-manual-grant' }"
							@click="state.manualAction('grant')"
						/>
					</div>
					<div v-if="state.manualAllowedCommands.includes('automatic')">
						<UiButton
							:text="$Bitrix.Loc.getMessage('MAIL_MIGRATION_PROGRESS_MANUAL_AUTOMATIC')"
							:style="AirButtonStyle.OUTLINE"
							:size="ButtonSize.MEDIUM"
							:disabled="state.manualCommandPending"
							:loading="state.manualCommandPending"
							:dataset="{ testid: 'mail-migration-manual-automatic' }"
							@click="state.manualAction('automatic')"
						/>
					</div>
				</div>
			</section>

			<div :hidden="!state.retryVisible">
				<UiButton
					:text="$Bitrix.Loc.getMessage('MAIL_MIGRATION_PROGRESS_RETRY')"
					:style="AirButtonStyle.OUTLINE"
					:size="ButtonSize.MEDIUM"
					:disabled="state.retryDisabled"
					:dataset="{ testid: 'mail-migration-progress-retry' }"
					@click="state.retry"
				/>
			</div>
		</div>
	`,
});
