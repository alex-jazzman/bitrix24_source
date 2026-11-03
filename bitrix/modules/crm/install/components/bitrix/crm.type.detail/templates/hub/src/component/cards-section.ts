import { defineComponent, type Component, type PropType } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { BInput, InputSize } from 'ui.system.input.vue';
import { TextSm } from 'ui.system.typography.vue';
import { LiveAnnouncer } from 'ui.a11y';
import {
	CrmHubCard,
	CrmHubControlRenderer,
	CrmHubFeatureCard,
	type ScalarRecord,
	type SettingsRecord,
} from 'crm.settings-hub';

import { type CardsSectionLayout, type FeatureCardLayout } from '../const/cards-section';
import { DAYS_OWNER_RECORD_ID, DAYS_RECORD_ID } from '../const/main-layout';
import { resolveFeatureCardAction } from '../lib/resolve-feature-card-action/resolve-feature-card-action';
import { resolveFeatureCardCopy } from '../lib/resolve-feature-card-copy/resolve-feature-card-copy';
import { resolveFeatureCardDisabled } from '../lib/resolve-feature-card-disabled/resolve-feature-card-disabled';

type FeatureCardView = FeatureCardLayout & {
	record: ScalarRecord;
	checked: boolean;
	disabled: boolean;
	reason: string;
	isActionVisible: boolean;
};

// The single frame of every "grid of feature cards" section: the white card with the tile grid, the
// grey block of secondary rows under it, and the fallback renderer for records the layout does not
// place itself. What differs between sections is DATA (CardsSectionLayout), not code — which is what
// makes the fourth section of the new tree a literal instead of a fourth copy of this file.
export const CrmTypeHubCardsSection = defineComponent({
	name: 'CrmTypeHubCardsSection',
	components: {
		CrmHubCard,
		CrmHubControlRenderer,
		CrmHubFeatureCard,
		BInput,
		UiButton,
		TextSm,
	},
	mixins: [locMixin],
	props: {
		layout: {
			type: Object as PropType<CardsSectionLayout>,
			required: true,
		},
		records: {
			type: Array as PropType<SettingsRecord[]>,
			default: () => [],
		},
		snapshot: {
			type: Object as PropType<Record<string, unknown>>,
			required: true,
		},
		readOnly: {
			type: Boolean,
			default: false,
		},
		controls: {
			type: Object as PropType<Record<string, Component>>,
			default: null,
		},
	},
	emits: ['update', 'action'],
	setup(): Object
	{
		return {
			AirButtonStyle,
			ButtonSize,
			InputSize,
			DAYS_OWNER_RECORD_ID,
		};
	},
	computed: {
		// Server map of action addresses, handed down in the snapshot like every other read-only
		// param of the form.
		actionUrls(): Readonly<Record<string, unknown>>
		{
			return (this.snapshot.hubActionUrls as Record<string, unknown> | undefined) ?? {};
		},
		featureCards(): FeatureCardView[]
		{
			return this.layout.cards
				.map((card) => {
					const record = this.findRecord(card.recordId) as ScalarRecord | null;
					if (!record)
					{
						return null;
					}

					const checked = Boolean(this.snapshot[record.valueKey]);

					return {
						...card,
						record,
						checked,
						...resolveFeatureCardDisabled(record, this.snapshot),
						isActionVisible: resolveFeatureCardAction(card.action, checked, this.actionUrls),
					};
				})
				.filter(Boolean) as FeatureCardView[]
			;
		},
		daysRecord(): ScalarRecord | null
		{
			return this.findRecord(DAYS_RECORD_ID) as ScalarRecord | null;
		},
		daysValue(): string
		{
			const raw = this.daysRecord ? this.snapshot[this.daysRecord.valueKey] : '';

			return (raw === null || raw === undefined) ? '' : String(raw);
		},
		// Records the layout does not draw itself: kept so raising SUPPLY_STEP cannot silently drop a
		// new record off the screen — the guarantee every hand-written section carried and this frame
		// inherits (D-17).
		restRecords(): SettingsRecord[]
		{
			return this.records.filter((record) => !this.layout.layoutRecordIds.includes(record.id));
		},
	},
	methods: {
		findRecord(id: string): SettingsRecord | null
		{
			return this.records.find((record) => record.id === id) ?? null;
		},
		// Layout overrides record for both fields alike (resolveFeatureCardCopy) — see
		// FeatureCardLayout.description for why this is safe for descriptor.ts.
		featureTitle(card: FeatureCardView): string
		{
			return resolveFeatureCardCopy(card.title, card.record.title);
		},
		featureDescription(card: FeatureCardView): string
		{
			return resolveFeatureCardCopy(card.description, card.record.description);
		},
		handleFeatureUpdate(card: FeatureCardView, value: boolean): void
		{
			this.$emit('update', { id: card.record.id, valueKey: card.record.valueKey, value });
			this.announceActionRevealed(card.record.id);
		},
		// Ties the announcement to the switch the user just operated, not to every recompute of
		// featureCards — a programmatic reset (Cancel) touches many rows at once and is not the user's
		// current focus. $nextTick waits for the snapshot round-trip through the parent store to land
		// before reading the row's fresh isActionVisible.
		announceActionRevealed(recordId: string): void
		{
			void this.$nextTick(() => {
				const card = this.featureCards.find((item) => item.record.id === recordId);
				if (!card || !card.isActionVisible || !card.action)
				{
					return;
				}

				LiveAnnouncer.announce(
					this.loc('CRM_TYPE_DETAIL_HUB_ACTION_REVEALED', { '#ACTION#': this.loc(card.action.text) }),
					'polite',
				);
			});
		},
		handleCardAction(card: FeatureCardView): void
		{
			if (card.action)
			{
				this.$emit('action', { id: card.record.id, actionKey: card.action.actionKey });
			}
		},
		handleDaysUpdate(value: string): void
		{
			const record = this.daysRecord;
			if (record)
			{
				this.$emit('update', { id: record.id, valueKey: record.valueKey, value });
			}
		},
	},
	template: `
		<div :class="layout.rootClass" :data-testid="'crm-type-hub-cards-' + layout.sectionId">
			<CrmHubCard
				class="crm-type-hub-cards__card"
				:card-id="layout.cardId"
				:title="layout.title"
				:icon="layout.icon"
			>
				<div v-if="layout.intro" class="crm-type-hub-cards-intro">
					<TextSm class="crm-type-hub-card-intro">{{ loc(layout.intro.text) }}</TextSm>
				</div>
				<div class="crm-type-hub-feature-rows">
					<CrmHubFeatureCard
						v-for="card in featureCards"
						:key="card.record.id"
						:feature-id="card.record.id"
						:title="featureTitle(card)"
						:description="featureDescription(card)"
						:icon="card.icon"
						:checked="card.checked"
						:disabled="card.disabled || readOnly"
						:reason="card.reason"
						@update="handleFeatureUpdate(card, $event)"
					>
						<template v-if="card.isActionVisible" #action>
							<UiButton
								:text="loc(card.action.text)"
								:size="ButtonSize.MEDIUM"
								:style="AirButtonStyle.OUTLINE_NO_ACCENT"
								:left-icon="card.action.icon"
								:dataset="{ testid: 'crm-type-hub-action-' + card.record.id }"
								@click="handleCardAction(card)"
							/>
						</template>
						<!--
							The days field belongs to the switch above it: with "Сроки" off there are no dates on
							the element at all, so a deadline in days has nothing to count from. Gated on
							card.checked, the same gate the action buttons use.

							Its caption is the input's own label, not a line of text laid above it by hand. The
							hand-rolled one only looked like a label — nothing tied it to the field, and the
							accessible name came from a different phrase entirely (the descriptor's title), so a
							screen reader announced one thing while the eye read another. One phrase now does
							both jobs.
						-->
						<template v-if="card.record.id === DAYS_OWNER_RECORD_ID && daysRecord && card.checked" #control>
							<BInput
								class="crm-type-hub-cards__days"
								:model-value="daysValue"
								:size="InputSize.Md"
								type="number"
								:label="loc('CRM_TYPE_DETAIL_HUB_FEATURE_DATES_NOTE')"
								:aria-label="loc('CRM_TYPE_DETAIL_HUB_FEATURE_DATES_NOTE')"
								:readonly="readOnly"
								data-testid="crm-type-hub-main-days-input"
								@update:modelValue="handleDaysUpdate"
							/>
						</template>
					</CrmHubFeatureCard>
				</div>
			</CrmHubCard>

			<CrmHubCard v-if="restRecords.length" :card-id="layout.cardId + '-rest'">
				<CrmHubControlRenderer
					v-for="record in restRecords"
					:key="record.id"
					:descriptor="record"
					:snapshot="snapshot"
					:read-only="readOnly"
					:controls="controls"
					@update="$emit('update', $event)"
					@action="$emit('action', $event)"
				/>
			</CrmHubCard>
		</div>
	`,
});
