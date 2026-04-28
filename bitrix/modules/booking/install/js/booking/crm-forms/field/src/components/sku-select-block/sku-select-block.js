import { Event } from 'main.core';

import { SkuSelector } from './sku-selector';
import { SkuQuantity } from './sku-quantity';
import type { Sku } from '../../types';

// @vue/component
export const SkuSelectBlock = {
	name: 'SkuSelectBlock',
	components: {
		SkuSelector,
		SkuQuantity,
	},
	props: {
		skuId: {
			type: Number,
			required: true,
		},
		resourcesWithSkus: {
			type: Array,
			required: true,
		},
		settingsData: {
			type: Object,
			required: true,
		},
		dependencies: {
			type: Object,
			required: true,
		},
		fetching: {
			type: Boolean,
			default: false,
		},
		errorMessage: {
			type: String,
			default: '',
		},
		hasErrors: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:skuId'],
	data(): { dropdownOpened: boolean }
	{
		return {
			dropdownOpened: false,
		};
	},
	computed: {
		skus(): Sku[]
		{
			const skusMap: Map<number, Sku> = new Map();

			this.resourcesWithSkus.forEach(({ skus }) => {
				skus.forEach((sku) => {
					if (!skusMap.has(sku.id))
					{
						skusMap.set(sku.id, sku);
					}
				});
			});

			return [...skusMap.values()];
		},
		label(): string
		{
			return this.settingsData?.skuLabel || '';
		},
		sku(): ?Sku
		{
			return this.skus?.find((sku) => sku.id === this.skuId) || null;
		},
		skuName(): string
		{
			return this.sku?.name || '';
		},
		placeholder(): string
		{
			return `${this.settingsData?.skuTextHeader || ''} *`;
		},
		hint(): { visible: boolean, text: string }
		{
			return {
				text: this.settingsData?.skuHint || '',
				visible: Boolean(this.settingsData?.isVisibleSkuHint),
			};
		},
		fieldItemDropdownComponent(): Object
		{
			return this.dependencies.mixinDropdown.components['field-item-dropdown'];
		},
	},
	watch: {
		dropdownOpened(opened: boolean): void
		{
			if (opened)
			{
				Event.bind(window, 'click', this.handleClickOutOfSelector, true);
			}
			else
			{
				Event.unbind(window, 'click', this.handleClickOutOfSelector, true);
			}
		},
	},
	unmounted(): void
	{
		Event.unbind(window, 'click', this.handleClickOutOfSelector, true);
	},
	methods: {
		handleClickOutOfSelector(e: PointerEvent): void
		{
			if (
				this.$refs.dropdown.$el?.contains(e.target)
				|| this.$refs.tagSelector?.contains(e.target)
			)
			{
				return;
			}

			this.closeDropdown();
		},
		toggleDropdown(): void
		{
			if (this.dropdownOpened)
			{
				this.closeDropdown();

				return;
			}

			if (this.fetching)
			{
				return;
			}

			this.dropdownOpened = true;
		},
		closeDropdown(): void
		{
			setTimeout(() => {
				this.dropdownOpened = false;
			}, 0);
		},
		setSku(sku: Sku): void
		{
			this.$emit('update:skuId', sku.id);
			this.closeDropdown();
		},
	},
	template: `
		<div
			class="booking-crm-forms-field"
			:class="{
				'--error': false,
			}"
		>
			<div class="b24-form-field-layout-section booking-crm-forms-field-title">
				{{ label }}
			</div>
			<div
				ref="tagSelector"
				class="booking-crm-forms-field-sku-selector b24-form-control-string"
				:class="{
					'--disabled': fetching,
				}"
			>
				<div
					class="b24-form-control-container b24-form-control-icon-after booking-crm-forms-field-sku-selector-container"
					@click="toggleDropdown"
				>
					<input
						name="skuName"
						type="text"
						readonly
						:placeholder="placeholder"
						:value="skuName"
						class="b24-form-control booking--crm-forms--field-tag-selector-input"
						@click.capture.stop.prevent="toggleDropdown"
					/>
					<div class="booking--crm-forms--field-tag-selector-input-icon"></div>
				</div>
			</div>
			<component
				v-if="dropdownOpened"
				ref="dropdown"
				:is="fieldItemDropdownComponent"
				:marginTop="0"
				:visible="dropdownOpened"
				:title="label"
				@close="closeDropdown()"
			>
				<SkuSelector :skus="skus" @select="setSku"/>
			</component>
			<SkuQuantity v-if="sku" :sku="sku"/>
			<div class="b24-form-control-alert-message" style="top: 75px">{{ errorMessage }}</div>
			<div v-if="hint.visible" class="booking--crm-forms--field-hint">
				<div class="booking--crm-forms--field-hint-text">{{ hint.text }}</div>
			</div>
		</div>
	`,
};
