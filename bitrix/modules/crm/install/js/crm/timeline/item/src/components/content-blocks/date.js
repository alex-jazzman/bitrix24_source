import { DatetimeConverter } from 'crm.timeline.tools';
import { Text as CoreTextHelper, Type } from 'main.core';
import Text from './text';

export default {
	props: {
		withTime: {
			type: Boolean,
			required: false,
			default: true,
		},
		format: {
			type: String,
			required: false,
			default: null,
		},
		duration: {
			type: Number,
			required: false,
			default: null,
		},
	},
	extends: Text,
	methods: {
		getFormattedDate(datetimeConverter: DatetimeConverter): string
		{
			if (this.format)
			{
				return datetimeConverter.toFormatString(this.format);
			}

			const options = {
				delimiter: ', ',
				withDayOfWeek: true,
				withFullMonth: true,
			};

			return this.withTime
				? datetimeConverter.toDatetimeString(options)
				: datetimeConverter.toDateString()
			;
		},
		getDatetimeConverter(): DatetimeConverter
		{
			return (DatetimeConverter.createFromServerTimestamp(this.value)).toUserTime();
		},
		getDatetimeConverterWithDuration(): DatetimeConverter
		{
			return (DatetimeConverter.createFromServerTimestamp(this.value + this.duration)).toUserTime();
		},
	},
	computed: {
		encodedText(): string
		{
			const converter = this.getDatetimeConverter();
			const dateFrom = this.getFormattedDate(converter);

			if (!Type.isNumber(this.duration) || this.duration < 0)
			{
				return CoreTextHelper.encode(dateFrom);
			}

			const converterWithDuration = this.getDatetimeConverterWithDuration();
			const isSameDay = converter.toDateString() === converterWithDuration.toDateString();

			if (isSameDay)
			{
				return CoreTextHelper.encode(dateFrom);
			}

			const dateTo = isSameDay
				? converterWithDuration.toTimeString()
				: this.getFormattedDate(converterWithDuration)
			;

			return CoreTextHelper.encode(`${dateFrom} - ${dateTo}`);
		},
	},
	template: Text.template,
};
