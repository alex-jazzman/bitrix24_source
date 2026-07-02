import { type BitrixVueComponentProps } from 'ui.vue3';

import './entity-selector.css';

export const EntitySelectorConstantSettings: BitrixVueComponentProps = {
	name: 'EntitySelectorConstantSettings',

	emits: ['update:modelValue'],

	props: {
		modelValue: {
			type: Object,
			required: true,
		},
		/** @type EntitySelectorConstantConfiguration */
		constantConfiguration: {
			type: Object,
			required: true,
		},
	},

	computed: {
		selectorId: {
			get(): string
			{
				return this.modelValue?.selectorId;
			},
			set(value: string) {
				const updatedValue = {
					...this.modelValue,
					selectorId: value,
					selector: this.getSelectors().find((selector) => selector.id === value),
				};

				this.$emit('update:modelValue', updatedValue);
			},
		},
	},

	methods: {
		getSelectors(): Array
		{
			return this.constantConfiguration.options.selectors;
		},
		firstSelectorId(): string
		{
			return this.getSelectors()[0].id;
		},
		getSelectorIds(): Array
		{
			return this.getSelectors().map((selector) => selector.id);
		},
	},

	mounted() {
		const selectorId = this.modelValue.selectorId;
		if (this.getSelectorIds().includes(selectorId))
		{
			return;
		}

		this.selectorId = this.firstSelectorId();
	},

	template: `
		<div class="ui-ctl-container">
			<div class="ui-ctl-top">
				<label class="ui-ctl-title">
					{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_SETTINGS_ENTITY_SELECTOR_PROVIDER') }}
				</label>
			</div>
			<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100">
				<div class="ui-ctl-after ui-ctl-icon-angle"></div>
				<select
					v-model="selectorId"
					class="ui-ctl-element"
				>
					<option
						v-for="selector in getSelectors()"
						:value="selector.id"
					>
						{{ selector.title }}
					</option>
				</select>
			</div>
		</div>
	`,
};
