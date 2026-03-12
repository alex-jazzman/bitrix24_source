import { Type } from 'main.core';

import { NotificationFilterFieldTypes } from '../../notification-filter';
import { NotificationFilterValueChip } from './value-chip';

import './css/values-container.css';

const ANOTHER_TYPE = 'anotherValues';

// @vue/component
export const NotificationFilterValuesContainer = {
	name: 'NotificationFilterValuesContainer',
	components: { NotificationFilterValueChip },
	props: {
		nonEmptyEntries: {
			type: Array,
			required: true,
		},
	},
	emits: ['remove'],
	computed: {
		ANOTHER_TYPE: () => ANOTHER_TYPE,
		firstNonEmptyField(): ?{ key: string, value: string | Array }
		{
			const list = this.nonEmptyEntries;

			return list.length > 0 ? list[0] : null;
		},
		secondNonEmptyField(): ?{ key: string, value: string | Array }
		{
			const list = this.nonEmptyEntries;

			return list.length > 1 ? list[1] : null;
		},
		remainingNonEmptyEntries(): Array<{ key: string, value: string | Array }>
		{
			const list = this.nonEmptyEntries;

			return list.length > 1 ? list.slice(1) : [];
		},
		firstTagTitle(): string
		{
			if (!this.firstNonEmptyField)
			{
				return '';
			}

			return this.formatEntry(this.firstNonEmptyField);
		},
		secondTagTitle(): string
		{
			if (!this.secondNonEmptyField)
			{
				return '';
			}

			return this.formatEntry(this.secondNonEmptyField);
		},
		remainingTagTitle(): string
		{
			if (this.remainingNonEmptyEntries.length === 0)
			{
				return '';
			}

			return this.remainingNonEmptyEntries.map((e) => this.formatEntry(e)).join('\n');
		},
		hasNonEmptyEntries(): boolean
		{
			return this.nonEmptyEntries.length > 0;
		},
		hasSingleRemainingEntry(): boolean
		{
			return this.remainingNonEmptyEntries.length === 1;
		},
		hasMultipleRemainingEntries(): boolean
		{
			return this.remainingNonEmptyEntries.length > 1;
		},
	},
	methods: {
		loc(phraseCode: string, replacements: { [p: string]: string } = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
		getTitle(key: string, values?: string | Array | null): string
		{
			if (!values && key === this.ANOTHER_TYPE && this.remainingNonEmptyEntries.length > 0)
			{
				return this.loc(
					'IM_NOTIFICATIONS_FILTER_ANOTHER_VALUES_TAG',
					{ '#COUNT#': String(this.remainingNonEmptyEntries.length) },
				);
			}

			return this.formatEntry({ key, value: values });
		},
		getTagTitle(fieldKey: string): string
		{
			if (fieldKey === NotificationFilterFieldTypes.searchTypes)
			{
				return 'IM_NOTIFICATIONS_FILTER_TYPE_FIELD_TAG_TEXT';
			}

			if (fieldKey === NotificationFilterFieldTypes.searchDate)
			{
				return 'IM_NOTIFICATIONS_FILTER_DATE_FIELD_TAG_TEXT';
			}

			if (fieldKey === NotificationFilterFieldTypes.searchAuthors)
			{
				return 'IM_NOTIFICATIONS_FILTER_AUTHOR_FIELD_TAG_TEXT';
			}

			return '';
		},
		formatValue(fieldKey: string, value: any): string
		{
			if (Type.isArray(value))
			{
				return value.join(', ');
			}

			return String(value);
		},
		formatEntry(entry: { key: string, value: any }): string
		{
			const phraseCode = this.getTagTitle(entry.key);
			if (phraseCode === '')
			{
				return '';
			}

			return this.loc(
				phraseCode,
				{ '#VALUE#': this.formatValue(entry.key, entry.value) },
			);
		},
		onRemoveSimpleTag(key: string): void
		{
			if (this.firstNonEmptyField)
			{
				this.$emit('remove', [key]);
			}
		},
		onRemoveRemainingTags(): void
		{
			const keys = this.remainingNonEmptyEntries.map((e) => e.key);
			if (keys.length > 0)
			{
				this.$emit('remove', keys);
			}
		},
	},
	template: `
		<div
			v-if="hasNonEmptyEntries"
			class="bx-im-notification-filter-value_tags-container"
		>
			<NotificationFilterValueChip
				v-if="firstNonEmptyField"
				:text="getTitle(firstNonEmptyField.key, firstNonEmptyField.value)"
				:title="firstTagTitle"
				data-test-id="im_notifications-filter__chip-first"
				@clear="onRemoveSimpleTag(firstNonEmptyField.key)"
			/>
			<NotificationFilterValueChip
				v-if="hasSingleRemainingEntry"
				:text="getTitle(secondNonEmptyField.key, secondNonEmptyField.value)"
				:title="secondTagTitle"
				data-test-id="im_notifications-filter__chip-second"
				@clear="onRemoveSimpleTag(secondNonEmptyField.key)"
			/>
			<NotificationFilterValueChip
				v-if="hasMultipleRemainingEntries"
				:text="getTitle(ANOTHER_TYPE)"
				:title="remainingTagTitle"
				data-test-id="im_notifications-filter__chip-third"
				@clear="onRemoveRemainingTags()"
			/>
			<span class="bx-im-notification-filter-plus">+</span>
		</div>
	`,
};
