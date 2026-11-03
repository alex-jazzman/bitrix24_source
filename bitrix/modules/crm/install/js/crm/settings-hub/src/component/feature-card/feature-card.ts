import { defineComponent } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';
import { BIcon } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { Switcher } from 'ui.vue3.components.switcher';
// ui.switcher is already a declared dependency of the kit (config.php), so importing the style enum
// from it adds nothing to the generated rel list — and that file belongs to the kit's author.
import { AirSwitcherStyle } from 'ui.switcher';
import { HeadlineSm, TextSm, TextXs } from 'ui.system.typography.vue';

import { getToggleAriaState } from '../../lib/get-toggle-aria-state/get-toggle-aria-state';

import './feature-card.css';

// A single feature of a hub card: icon + title + description with the switch on the right.
// The `note` slot holds a second description line, `control` an extra field under the switch
// (the days-before-close input of the dates feature), and `action` a secondary button under the
// description — the route out of the row ("Редактор воронок и туннелей", "Открыть корзину"). The
// wizard mockup puts that button INSIDE the row, which is what retired the grey block of extra rows
// the sections used to carry under the card.
export const CrmHubFeatureCard = defineComponent({
	name: 'CrmHubFeatureCard',
	components: { BIcon, Switcher, HeadlineSm, TextSm, TextXs },
	mixins: [locMixin],
	props: {
		featureId: {
			type: String,
			required: true,
		},
		// Phrase code of the row heading.
		title: {
			type: String,
			default: '',
		},
		// Ready text, for headings that come from data rather than from a phrase file — the entity
		// names of the relations catalog ("Лид", "Сделка"). Wins over `title` when both are given.
		titleText: {
			type: String,
			default: '',
		},
		// Phrase code of the row description.
		description: {
			type: String,
			default: '',
		},
		// Ready text, the description's counterpart of `titleText` and there for the same reason: a
		// description that names live data (the process being configured) cannot come out of a phrase
		// file alone — the caller substitutes into the phrase and hands over the result. Wins over
		// `description` when both are given.
		descriptionText: {
			type: String,
			default: '',
		},
		icon: {
			type: String,
			default: '',
		},
		checked: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		reason: {
			type: String,
			default: '',
		},
	},
	emits: ['update'],
	setup(): Object
	{
		return { AirSwitcherStyle };
	},
	computed: {
		headingText(): string
		{
			return this.titleText || (this.title ? this.loc(this.title) : '');
		},
		descriptionContent(): string
		{
			return this.descriptionText || (this.description ? this.loc(this.description) : '');
		},
		labelId(): string
		{
			return `crm-settings-hub-feature-${this.featureId}-label`;
		},
		descriptionId(): string
		{
			return `crm-settings-hub-feature-${this.featureId}-description`;
		},
		hintId(): string
		{
			return `crm-settings-hub-feature-${this.featureId}-hint`;
		},
		describedBy(): string | null
		{
			const ids: string[] = [];
			if (this.descriptionContent)
			{
				ids.push(this.descriptionId);
			}

			if (this.reason)
			{
				ids.push(this.hintId);
			}

			return ids.length > 0 ? ids.join(' ') : null;
		},
		ariaState(): { role: 'switch', ariaChecked: 'true' | 'false' }
		{
			return getToggleAriaState(this.checked);
		},
	},
	methods: {
		handleCheck(): void
		{
			this.$emit('update', true);
		},
		handleUncheck(): void
		{
			this.$emit('update', false);
		},
		handleKeydown(event: KeyboardEvent): void
		{
			if (event.currentTarget !== event.target || this.disabled || !['Enter', ' '].includes(event.key))
			{
				return;
			}

			event.preventDefault();
			this.$emit('update', !this.checked);
		},
		// The whole row toggles the setting, like the option rows of the hub. Clicks that already mean
		// something inside the row are not taken over: the switch toggles itself (without the guard the
		// row would toggle twice and look dead), and the field under the description — days before
		// close — is a control of its own.
		handleRowClick(event: MouseEvent): void
		{
			const target = event.target;
			if (this.disabled || !(target instanceof Element))
			{
				return;
			}

			const ownMeaning = target.closest([
				'.crm-settings-hub-feature-card__switch',
				'.crm-settings-hub-feature-card__control',
				'a',
				'button',
				'input',
				'textarea',
				'select',
			].join(','));

			if (ownMeaning)
			{
				return;
			}

			this.$emit('update', !this.checked);
		},
	},
	template: `
		<div
			class="crm-settings-hub-feature-card"
			:class="{ '--off': !checked, '--disabled': disabled, '--clickable': !disabled }"
			:data-testid="'crm-settings-hub-feature-' + featureId"
			@click="handleRowClick"
		>
			<BIcon v-if="icon" class="crm-settings-hub-feature-card__icon" :name="icon" :size="27"/>
			<div class="crm-settings-hub-feature-card__aside">
				<!--
					The switch semantics live here and not on the row: aria-disabled inherits down the subtree,
					so from the root it would also reach the action button inside the row — a working button
					announced as disabled. The row still toggles on click (handleRowClick); the switcher inside
					is decoration, or the reader would get two switches for one setting.

					Placed before __body in DOM order (the CSS \`order\` restores the visual sequence) so the
					switch's tab stop precedes the action button's — Tab from the switch lands on this row's own
					button, not the next row's.

					The tab stop stays even when the row is disabled, as in ui.switcher's disable(): dropping it
					would hide the lock and its reason (aria-describedby → __hint) from keyboard users.
					Activation is still refused — handleKeydown returns early on \`disabled\`.
				-->
				<div
					class="crm-settings-hub-feature-card__switch"
					tabindex="0"
					:role="ariaState.role"
					:aria-checked="ariaState.ariaChecked"
					:aria-disabled="disabled ? 'true' : null"
					:aria-labelledby="labelId"
					:aria-describedby="describedBy"
					data-testid="crm-settings-hub-feature-card-switch"
					@keydown="handleKeydown"
				>
					<!-- 'large' is 40x19 in the AIR css — the size the mockup draws for the block's switcher. -->
					<Switcher
						:is-checked="checked"
						:is-disabled="disabled"
						:options="{
							size: 'large',
							showStateTitle: false,
							useAirDesign: true,
							style: AirSwitcherStyle.SOLID,
						}"
						aria-hidden="true"
						@check="handleCheck"
						@uncheck="handleUncheck"
					/>
				</div>
				<div v-if="$slots.control" class="crm-settings-hub-feature-card__control">
					<slot name="control"/>
				</div>
			</div>
			<div class="crm-settings-hub-feature-card__body">
				<HeadlineSm accent :id="labelId" class="crm-settings-hub-feature-card__title">{{ headingText }}</HeadlineSm>
				<TextSm
					v-if="descriptionContent"
					:id="descriptionId"
					class="crm-settings-hub-feature-card__description"
				>{{ descriptionContent }}</TextSm>
				<div v-if="$slots.note" class="crm-settings-hub-feature-card__note">
					<slot name="note"/>
				</div>
				<TextXs v-if="reason" :id="hintId" class="crm-settings-hub-feature-card__hint">{{ loc(reason) }}</TextXs>
				<!--
					Its place under the description comes from the CSS \`order\`, not from where it sits in the
					markup. The button carries its own meaning, so handleRowClick lets it through (the 'button'
					entry of the exclusion list) instead of toggling the setting under it.
				-->
				<div v-if="$slots.action" class="crm-settings-hub-feature-card__action">
					<slot name="action"/>
				</div>
				<!--
					Sub-options of the row: the chip groups of a relation. They take the description's place
					when the row is on — the caller simply stops passing a description, because with the
					options on screen the sentence about them is a second telling.
				-->
				<div v-if="$slots.details" class="crm-settings-hub-feature-card__details">
					<slot name="details"/>
				</div>
			</div>
		</div>
	`,
});
