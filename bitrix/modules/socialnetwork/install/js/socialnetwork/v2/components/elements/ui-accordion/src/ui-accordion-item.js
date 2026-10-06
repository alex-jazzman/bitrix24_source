import { TextMd } from 'ui.system.typography.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

// @vue/component
export const UiAccordionItem = {
	name: 'UiAccordionItem',
	components: {
		BIcon,
		TextMd,
	},
	inject: {
		accordion: {
			default: null,
		},
	},
	props: {
		value: {
			type: [Number, String],
			required: true,
		},
		title: {
			type: String,
			default: null,
		},
		iconName: {
			type: [String, null],
			default: null,
		},
		iconColor: {
			type: [String, null],
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:value'],
	setup(): { Outline: typeof Outline }
	{
		return {
			Outline,
		};
	},
	computed: {
		isOpen(): boolean
		{
			if (!this.accordion)
			{
				return false;
			}

			return this.accordion.isItemOpen(this.itemValue);
		},
		itemValue(): string | number
		{
			if (this.value === null || this.value === undefined)
			{
				return this._uid;
			}

			return this.value;
		},
		isDisabled(): boolean
		{
			return Boolean(this.disabled || this.accordion?.disabled);
		},
	},
	methods: {
		onToggle(): void
		{
			if (this.isDisabled || !this.accordion)
			{
				return;
			}

			this.accordion.toggleItem(this.itemValue);
		},
	},
	template: `
		<div class="sonet--ui-accordion-item">
			<button
				class="sonet--ui-accordion-item-head"
				type="button"
				:disabled="isDisabled"
				:aria-expanded="isOpen ? 'true' : 'false'"
				:tabindex="isDisabled ? -1 : 0"
				@click="onToggle"
			>
				<span class="sonet--ui-accordion-item-head-content">
					<slot name="head">
						<BIcon v-if="iconName" :size="24" :name="iconName" :color="iconColor"/>
						<TextMd>{{ title }}</TextMd>
					</slot>
				</span>
				<span
					class="sonet--ui-accordion-item-chevron"
					:class="{ '--open': isOpen }"
				>
					<BIcon :size="26" :name="Outline.CHEVRON_DOWN_L" color="var(--ui-color-base-4)"/>
				</span>
			</button>
			<transition name="sonet--ui-accordion-item">
				<div v-if="isOpen" class="sonet--ui-accordion-item-content">
					<slot/>
				</div>
			</transition>
		</div>
	`,
};
