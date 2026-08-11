import { Loc } from 'main.core';
import { BIcon, Outline } from 'ui.icon-set.api.vue';

import './style.css';

// @vue/component
export const InspectorSearch = {
	name: 'InspectorSearch',
	components: {
		BIcon,
	},
	props: {
		modelValue: {
			type: String,
			required: true,
		},
	},
	emits: ['update:modelValue'],
	data(): { isFocused: boolean }
	{
		return {
			isFocused: false,
		};
	},
	computed: {
		iconColor(): string
		{
			return this.isActive
				? 'var(--ui-color-accent-main-primary)'
				: 'var(--ui-color-gray-50)'
			;
		},
		isActive(): string
		{
			return this.isFocused || this.modelValue.length > 0;
		},
		placeholderText(): string
		{
			return Loc.getMessage('BIZPROCDESIGNER_EDITOR_SEARCH');
		},
		Outline: (): typeof Outline => Outline,
	},
	methods: {
		onFocus(): void
		{
			this.isFocused = true;
		},
		onBlur(): void
		{
			this.isFocused = false;
		},
		onClear(): void
		{
			this.$emit('update:modelValue', '');
		},
	},
	template: `
		<div class='inspector-search-container' :class="{ '--active': isActive }">
			<input
				class="inspector-search__input"
				:placeholder="placeholderText"
				:value="modelValue"
				@focus="onFocus"
				@blur="onBlur"
				@input="$emit('update:modelValue', $event.target.value)"
			/>
			<button
				v-if="modelValue.length > 0"
				type="button"
				class="inspector-search__clear-btn"
				@mousedown.prevent
				@click="onClear"
			>
				<BIcon
					:name="Outline.CROSS_L"
					:size="20"
					color="var(--ui-color-gray-50)"
				/>
			</button>
			<div v-else class="inspector-search__icon">
				<BIcon
					:name="Outline.SEARCH"
					:size="20"
					:color='iconColor'
				/>
			</div>
		</div>
	`,
};
