import { Loc, Type } from 'main.core';
import { type DialogOptions, TagSelector } from 'ui.entity-selector';
import { defineComponent, markRaw, type PropType } from 'ui.vue3';
import { Switcher } from 'ui.vue3.components.switcher';
import { HeadlineXl, HeadlineSm, HeadlineXs, TextMd, TextXs } from 'ui.system.typography.vue';
import { BInput, InputSize } from 'ui.system.input.vue';
import { Chip, ChipDesign, ChipSize } from 'ui.system.chip.vue';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';

import { apiClient } from './api-client';
import {
	ENTITY_SELECTOR_CONTEXT,
	SITUATION_DEFAULT_THRESHOLDS,
	SITUATION_THRESHOLD_BOUNDS,
	SITUATIONS_CONFIG,
	SITUATIONS_WITH_THRESHOLD_IN_UI,
	WEEKDAYS,
} from './const';
import type { Recipient, Settings, SituationCode, Situations, ThresholdBounds } from './types';

type NotificationCenter = {
	notify(options: { content: string }): unknown;
};

type SidePanelSlider = {
	close(): void;
};

type SidePanelInstance = {
	getTopSlider(): SidePanelSlider | null;
};

type RootWindow = Window & {
	BX: {
		UI?: {
			Notification?: {
				Center?: NotificationCenter;
			};
		};
		SidePanel: {
			Instance: SidePanelInstance;
		};
	};
};

type State = {
	isSaving: boolean;
	isEnabled: boolean;
	recipientUserIds: number[];
	scheduleWeekdays: number[];
	situations: Situations;
	sendSelfDigest: boolean;
	tagSelector: TagSelector | null;
};

const SITUATION_CODES: readonly SituationCode[] = ['badStreak', 'goodStreak', 'ratingDropped', 'ratingRaised'];

function normalizeSituations(input: unknown): Situations
{
	const result = {} as Situations;
	const source: Record<string, unknown> = (input && Type.isPlainObject(input))
		? input as Record<string, unknown>
		: {}
	;

	for (const code of SITUATION_CODES)
	{
		const raw = (Type.isPlainObject(source[code]) ? source[code] : {}) as Record<string, unknown>;
		const fallback = SITUATION_DEFAULT_THRESHOLDS[code];
		const bounds = SITUATION_THRESHOLD_BOUNDS[code];
		const threshold = Number.parseInt(String(raw.threshold ?? fallback), 10);

		result[code] = {
			enabled: Boolean(raw.enabled ?? false),
			threshold: Number.isFinite(threshold)
				? Math.min(bounds.max, Math.max(bounds.min, threshold))
				: fallback,
		};
	}

	return result;
}

// @vue/component
export const Master = defineComponent({
	name: 'CrmCopilotCallAssessmentSummaryMaster',
	components: {
		Switcher,
		HeadlineXl,
		HeadlineSm,
		HeadlineXs,
		TextMd,
		TextXs,
		BInput,
		Chip,
		UiButton,
	},
	props: {
		initialSettings: {
			type: Object as PropType<Settings>,
			required: true,
		},
		initialRecipients: {
			type: Array as PropType<Recipient[]>,
			default: () => [],
		},
	},
	setup()
	{
		return {
			weekdays: WEEKDAYS,
			situationsConfig: SITUATIONS_CONFIG,
			InputSize,
			ChipDesign,
			ChipSize,
			AirButtonStyle,
			ButtonSize,
		};
	},
	data(): State
	{
		const settings = this.initialSettings;

		return {
			isSaving: false,
			isEnabled: Boolean(settings.isEnabled ?? false),
			recipientUserIds: Array.isArray(settings.recipientUserIds) ? [...settings.recipientUserIds] : [],
			scheduleWeekdays: Array.isArray(settings.scheduleWeekdays) ? [...settings.scheduleWeekdays] : [],
			situations: normalizeSituations(settings.situations),
			sendSelfDigest: Boolean(settings.sendSelfDigest ?? false),
			tagSelector: null,
		};
	},
	mounted(): void
	{
		this.initTagSelector();
	},
	beforeUnmount(): void
	{
		this.tagSelector = null;
	},
	methods: {
		loc(code: string): string
		{
			return Loc.getMessage(code) ?? '';
		},
		hasThresholdInUi(code: SituationCode): boolean
		{
			return SITUATIONS_WITH_THRESHOLD_IN_UI.includes(code);
		},
		thresholdBounds(code: SituationCode): ThresholdBounds
		{
			return SITUATION_THRESHOLD_BOUNDS[code];
		},
		handleThresholdInput(code: SituationCode, value: string): void
		{
			const bounds = this.thresholdBounds(code);
			const parsed = Number.parseInt(value, 10);
			if (!Number.isFinite(parsed))
			{
				return;
			}

			this.situations[code].threshold = Math.min(bounds.max, Math.max(bounds.min, parsed));
		},
		thresholdParts(messageCode: string): { before: string, after: string }
		{
			const [before = '', after = ''] = this.loc(messageCode).split('#INPUT#');

			return { before: before.trim(), after: after.trim() };
		},
		isWeekdayOn(value: number): boolean
		{
			return this.scheduleWeekdays.includes(value);
		},
		handleToggleWeekday(value: number): void
		{
			const index = this.scheduleWeekdays.indexOf(value);
			if (index === -1)
			{
				this.scheduleWeekdays = [...this.scheduleWeekdays, value].sort((a, b) => a - b);
			}
			else
			{
				const next = [...this.scheduleWeekdays];
				next.splice(index, 1);
				this.scheduleWeekdays = next;
			}
		},
		initTagSelector(): void
		{
			const target = this.$refs.recipientsTarget as HTMLElement | undefined;
			if (!target)
			{
				return;
			}

			this.tagSelector = markRaw(new TagSelector({
				multiple: true,
				placeholder: this.loc('CRM_COPILOT_SUMMARY_RECIPIENTS_PLACEHOLDER'),
				addButtonCaption: this.loc('CRM_COPILOT_SUMMARY_RECIPIENTS_ADD'),
				items: this.initialRecipients.map((user) => ({
					entityId: 'user',
					id: String(user.id),
					title: user.name,
					...(user.avatar ? { avatar: user.avatar } : {}),
				})),
				dialogOptions: {
					height: 360,
					context: ENTITY_SELECTOR_CONTEXT,
					entities: [{ id: 'user' }],
					preselectedItems: this.recipientUserIds.map((id) => ['user', String(id)]),
				} as unknown as DialogOptions,
				events: {
					onAfterTagAdd: () => this.syncRecipientsFromSelector(),
					onAfterTagRemove: () => this.syncRecipientsFromSelector(),
				},
			}));
			this.tagSelector.renderTo(target);
		},
		syncRecipientsFromSelector(): void
		{
			if (!this.tagSelector)
			{
				return;
			}

			this.recipientUserIds = this.tagSelector
				.getTags()
				.filter((tag: { entityId: string; }) => tag.entityId === 'user')
				.map((tag: { id: any; }) => Number(tag.id))
				.filter((id: any) => Number.isInteger(id) && id > 0)
			;
		},
		handleSave(): void
		{
			if (this.isSaving)
			{
				return;
			}

			this.isSaving = true;

			const payload: Settings = {
				isEnabled: this.isEnabled,
				recipientUserIds: [...this.recipientUserIds],
				scheduleWeekdays: [...this.scheduleWeekdays],
				situations: this.situations,
				sendSelfDigest: this.sendSelfDigest,
			};

			apiClient.saveSettings(payload)
				.then(() => {
					this.getRootWindow().BX.SidePanel.Instance.getTopSlider()?.close();
				})
				.catch(() => {
					this.getRootWindow().BX.UI?.Notification?.Center?.notify({
						content: this.loc('CRM_COPILOT_SUMMARY_SAVE_FAILED'),
					});
				})
				.finally(() => {
					this.isSaving = false;
				})
			;
		},
		handleClose(): void
		{
			this.getRootWindow().BX.SidePanel.Instance.getTopSlider()?.close();
		},
		getRootWindow(): RootWindow
		{
			return (window.top ?? window) as unknown as RootWindow;
		},
	},
	template: `
		<div class="crm-summary__card-list">

			<div class="crm-summary__header">
				<HeadlineXl class="crm-summary__header-title">{{ loc('CRM_COPILOT_CALL_ASSESSMENT_SUMMARY_TITLE') }}</HeadlineXl>
				<div class="crm-summary__header-toggle">
					<TextXs class="crm-summary__header-toggle-label">{{ loc('CRM_COPILOT_SUMMARY_ENABLED') }}</TextXs>
					<Switcher
						:is-checked="isEnabled"
						:options="{ size: 'extra-small' }"
						@check="isEnabled = true"
						@uncheck="isEnabled = false"
					/>
				</div>
			</div>

			<div class="crm-summary__card">
				<HeadlineSm class="crm-summary__card-title">{{ loc('CRM_COPILOT_SUMMARY_RECIPIENTS_TITLE') }}</HeadlineSm>
				<div class="crm-summary__card-body">
					<div ref="recipientsTarget"></div>
				</div>
			</div>

			<div class="crm-summary__card">
				<HeadlineSm class="crm-summary__card-title">{{ loc('CRM_COPILOT_SUMMARY_SCHEDULE_TITLE') }}</HeadlineSm>
				<TextXs class="crm-summary__card-description">{{ loc('CRM_COPILOT_SUMMARY_SCHEDULE_DESCRIPTION') }}</TextXs>
				<div class="crm-summary__card-body">
					<TextMd class="crm-summary__weekday-label">{{ loc('CRM_COPILOT_SUMMARY_WEEKDAY_LABEL') }}</TextMd>
					<div class="crm-summary__weekday-chips" role="group" :aria-label="loc('CRM_COPILOT_SUMMARY_WEEKDAY_LABEL')">
						<Chip
							v-for="day in weekdays"
							:key="day.value"
							:text="loc(day.labelCode)"
							:size="ChipSize.Lg"
							:design="isWeekdayOn(day.value) ? ChipDesign.Filled : ChipDesign.Outline"
							@click="handleToggleWeekday(day.value)"
						/>
					</div>
				</div>
			</div>

			<div class="crm-summary__card">
				<HeadlineSm class="crm-summary__card-title">{{ loc('CRM_COPILOT_SUMMARY_SITUATIONS_TITLE') }}</HeadlineSm>
				<div class="crm-summary__card-body">
					<div
						v-for="item in situationsConfig"
						:key="item.code"
						class="crm-summary__situation"
					>
						<div class="crm-summary__situation-toggle">
							<Switcher
								:is-checked="situations[item.code].enabled"
								:options="{ size: 'extra-small' }"
								@check="situations[item.code].enabled = true"
								@uncheck="situations[item.code].enabled = false"
							/>
						</div>
						<div class="crm-summary__situation-body">
							<HeadlineXs accent class="crm-summary__situation-title">{{ loc(item.titleCode) }}</HeadlineXs>
							<TextXs class="crm-summary__situation-description">{{ loc(item.descriptionCode) }}</TextXs>
							<div v-if="hasThresholdInUi(item.code) && item.thresholdCode" class="crm-summary__threshold-row">
								<TextXs class="crm-summary__threshold-text">{{ thresholdParts(item.thresholdCode).before }}</TextXs>
								<BInput
									:size="InputSize.Sm"
									center
									class="crm-summary__threshold-input"
									:model-value="String(situations[item.code].threshold)"
									@update:modelValue="(value) => handleThresholdInput(item.code, value)"
								/>
								<TextXs class="crm-summary__threshold-text">{{ thresholdParts(item.thresholdCode).after }}</TextXs>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="crm-summary__card">
				<HeadlineSm class="crm-summary__card-title">{{ loc('CRM_COPILOT_SUMMARY_SELF_DIGEST_TITLE') }}</HeadlineSm>
				<div class="crm-summary__card-body crm-summary__inline-row">
					<Switcher
						:is-checked="sendSelfDigest"
						:options="{ size: 'extra-small' }"
						@check="sendSelfDigest = true"
						@uncheck="sendSelfDigest = false"
					/>
					<TextMd>{{ loc('CRM_COPILOT_SUMMARY_SELF_DIGEST_LABEL') }}</TextMd>
				</div>
			</div>

		</div>

		<div class="crm-summary-footer">
			<UiButton
				:text="loc('CRM_COPILOT_SUMMARY_ACTION_SAVE')"
				:style="AirButtonStyle.FILLED"
				:size="ButtonSize.MEDIUM"
				:loading="isSaving"
				@click="handleSave"
			/>
			<UiButton
				:text="loc('CRM_COPILOT_SUMMARY_ACTION_CANCEL')"
				:style="AirButtonStyle.PLAIN_ACCENT"
				:size="ButtonSize.MEDIUM"
				:disabled="isSaving"
				@click="handleClose"
			/>
		</div>
	`,
});
