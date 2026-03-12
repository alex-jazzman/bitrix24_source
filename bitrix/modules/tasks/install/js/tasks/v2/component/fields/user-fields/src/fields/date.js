import { Type } from 'main.core';
import { DateTimeFormat } from 'main.date';

import { TextMd, TextXs } from 'ui.system.typography.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { calendar } from 'tasks.v2.lib.calendar';
import { userFieldsManager } from '../user-fields-manager';

import './fields.css';

// @vue/component
export const UserFieldDate = {
	components: {
		TextMd,
		TextXs,
		BIcon,
	},
	props: {
		title: {
			type: String,
			required: true,
		},
		value: {
			type: [String, Array],
			default: '',
		},
		mandatory: {
			type: Boolean,
			default: false,
		},
		isLast: {
			type: Boolean,
			default: false,
		},
	},
	session: undefined,
	setup(): void
	{
		return { Outline };
	},
	computed: {
		values(): string[]
		{
			if (Type.isArrayFilled(this.value))
			{
				return this.value.map((v) => this.formatDate(v));
			}

			return [this.formatDate(this.value)];
		},
	},
	methods: {
		formatDate(dateString: string): string
		{
			const date = this.tryParseDate(dateString);

			if (!date)
			{
				return dateString;
			}

			return calendar.formatDateTime(date.getTime(), { removeOffset: true });
		},
		tryParseDate(dateString: string): Date | null
		{
			if (dateString.includes('T'))
			{
				const date = new Date(dateString);

				if (!this.isDate(date))
				{
					return null;
				}

				return userFieldsManager.correctDatetimeStringWithT(dateString, date);
			}

			const parsedDate = DateTimeFormat.parse(dateString);

			if (this.isDate(parsedDate))
			{
				return parsedDate;
			}

			return null;
		},
		isDate(value: any): boolean
		{
			return Type.isDate(value) && !Number.isNaN(value.getTime());
		},
	},
	template: `
		<div
			class="tasks-user-field print-no-border --date"
			:class="{ '--last': isLast }"
		>
			<TextXs
				class="tasks-user-field-title"
				:class="{ '--mandatory': mandatory }"
			>
				{{ title }}
			</TextXs>
			<template v-for="(item, index) in values" :key="index">
				<div class="tasks-user-field-date-row">
					<BIcon :name="Outline.CALENDAR_WITH_SLOTS"/>
					<TextMd>{{ item }}</TextMd>
				</div>
			</template>
		</div>
	`,
};
