import { Type } from 'main.core';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { NotificationFilterFieldTypes } from '../../notification-filter';
import { NotificationFilterValuesContainer } from './values-container';
import { Color } from 'im.v2.const';

import type { JsonObject } from 'main.core';

import './css/search-input.css';

// @vue/component
export const NotificationFilterSearchInput = {
	name: 'NotificationFilterSearchInput',
	components: { BIcon, NotificationFilterValuesContainer },
	props: {
		displayData: {
			type: Object,
			required: true,
		},
		modelValue: {
			type: String,
			default: '',
		},
	},
	emits: ['update:modelValue', 'focus', 'remove', 'clear'],
	data(): JsonObject
	{
		return {
			isFocused: false,
		};
	},
	computed: {
		Color: () => Color,
		OutlineIcons: () => OutlineIcons,
		isSearchEmpty(): boolean
		{
			return this.modelValue === '';
		},
		withTags(): boolean
		{
			return this.nonEmptyEntries.length > 0;
		},
		nonEmptyEntries(): Array<{ key: string, value: string | Array }>
		{
			const result = [];
			for (const [key, value] of Object.entries(this.displayData))
			{
				if (Type.isArrayFilled(value))
				{
					result.push({ key, value });

					continue;
				}

				if (Type.isStringFilled(value))
				{
					result.push({ key, value });
				}

				if (key === NotificationFilterFieldTypes.searchDate)
				{
					if (value.date?.length > 0)
					{
						result.push({ key, value: value.date });

						continue;
					}

					if (value.dateFrom?.length > 0 && value.dateTo?.length > 0)
					{
						result.push({ key, value: `${value.dateFrom} - ${value.dateTo}` });
					}
				}
			}

			return result;
		},
		placeholderText(): string
		{
			if (this.nonEmptyEntries.length > 0)
			{
				return this.loc('IM_NOTIFICATIONS_FILTER_SEARCH_INPUT_PLACEHOLDER_WITH_TAGS');
			}

			return this.loc('IM_NOTIFICATIONS_FILTER_SEARCH_INPUT_PLACEHOLDER');
		},
	},
	watch: {
		searchValue(): void
		{
			this.$emit('updateSearch', this.searchValue);
		},
	},
	methods: {
		loc(phraseCode: string, replacements: { [p: string]: string } = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
		onFocus(event): void
		{
			this.isFocused = true;
			this.$emit('focus', event);
		},
		onRemove(keys: Array<string>): void
		{
			this.$emit('remove', keys);
		},
		onInput(event: Event)
		{
			this.$emit('update:modelValue', event.target.value);
		},
	},
	template: `
		<div
			class="bx-im-content-notification-filter-search"
			:class="{ '--focused': isFocused }"
			ref="container"
			data-test-id="im_content-notification-filter__search-container"
		>
			<NotificationFilterValuesContainer
				:nonEmptyEntries="nonEmptyEntries"
				@remove="onRemove"
			/>
			<input
				class="bx-im-content-notification-filter-search__input"
				type="text"
				:value="modelValue"
				:class="{ '--with-tags': this.withTags }"
				:placeholder="placeholderText"
				data-test-id="im_notifications-filter__search-input"
				@focus="onFocus"
				@input="onInput"
				@blur="this.isFocused = false"
			/>
			<div class="bx-im-content-notification-filter-search__icons-block">
				<BIcon
					:name="OutlineIcons.SEARCH"
					:size="20"
					:color="Color.base5"
					:hoverable="true"
					class="bx-im-content-notification-filter-search__icon-search"
					:class="{ '--without-delete-icon': isSearchEmpty }"
				/>
				<BIcon
					:name="OutlineIcons.CROSS_L"
					:size="20"
					:color="Color.base5"
					:hoverable="true"
					class="bx-im-content-notification-filter-search__icon-delete"
					:class="{ '--hidden': isSearchEmpty }"
					data-test-id="im_notifications-filter__search-reset"
					@click.stop="$emit('clear')"
				/>
			</div>
		</div>
	`,
};
