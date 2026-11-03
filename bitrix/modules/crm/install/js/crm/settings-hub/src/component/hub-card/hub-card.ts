import { defineComponent } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';
import { BIcon } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { HeadlineSm } from 'ui.system.typography.vue';

import './hub-card.css';

// White rounded card of the hub layout: an icon + title header over a free content area.
// The section keeps its own heading hidden, so the card headings are what the user reads.
export const CrmHubCard = defineComponent({
	name: 'CrmHubCard',
	components: { BIcon, HeadlineSm },
	mixins: [locMixin],
	props: {
		cardId: {
			type: String,
			required: true,
		},
		title: {
			type: String,
			default: '',
		},
		icon: {
			type: String,
			default: '',
		},
		collapsible: {
			type: Boolean,
			default: false,
		},
		defaultOpen: {
			type: Boolean,
			default: true,
		},
	},
	data(): { isOpen: boolean }
	{
		return { isOpen: true };
	},
	created(): void
	{
		this.isOpen = !this.collapsible || this.defaultOpen;
	},
	computed: {
		titleId(): string
		{
			return `crm-settings-hub-card-${this.cardId}-title`;
		},
		testId(): string
		{
			return `crm-settings-hub-card-${this.cardId}`;
		},
	},
	methods: {
		toggle(): void
		{
			if (this.collapsible)
			{
				this.isOpen = !this.isOpen;
			}
		},
		handleHeaderKeydown(event: KeyboardEvent): void
		{
			if (!this.collapsible || !['Enter', ' '].includes(event.key))
			{
				return;
			}

			event.preventDefault();
			this.toggle();
		},
	},
	template: `
		<section
			class="crm-settings-hub-card"
			:class="{ '--collapsible': collapsible, '--open': collapsible && isOpen }"
			:aria-labelledby="title ? titleId : null"
			:data-testid="testId"
		>
			<header
				v-if="title"
				class="crm-settings-hub-card__header"
				:role="collapsible ? 'button' : null"
				:tabindex="collapsible ? 0 : null"
				:aria-expanded="collapsible ? String(isOpen) : null"
				@click="toggle"
				@keydown="handleHeaderKeydown"
			>
				<BIcon v-if="icon" class="crm-settings-hub-card__icon" :name="icon" :size="24"/>
				<HeadlineSm :id="titleId" tag="h3" class="crm-settings-hub-card__title">{{ loc(title) }}</HeadlineSm>
				<!--
					Action of the header (the mockup puts "Добавить представление" there). Clicks are
					stopped: the header itself is the collapse control, and a button inside it would
					fold the card as a side effect of its own action.
				-->
				<span
					v-if="$slots.action"
					class="crm-settings-hub-card__action"
					@click.stop
					@keydown.stop
				>
					<slot name="action"/>
				</span>
				<BIcon
					v-if="collapsible"
					class="crm-settings-hub-card__chevron"
					:name="isOpen ? 'chevron-top-m' : 'chevron-down-m'"
					:size="20"
				/>
			</header>
			<div v-show="isOpen" class="crm-settings-hub-card__content">
				<slot/>
			</div>
		</section>
	`,
});
