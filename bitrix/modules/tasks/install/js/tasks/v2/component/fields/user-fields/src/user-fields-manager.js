import { Type } from 'main.core';
import { DateTimeFormat } from 'main.date';
import { UserFieldType } from 'tasks.v2.const';
import type { UserFieldScheme } from 'tasks.v2.model.interface';

export type PreparedUserField = {
	title: string,
	type: string,
	value: any,
	mandatory: boolean
};

export type UserField = {
	key: string,
	value: any,
};

class UserFieldsManager
{
	getPreparedUserFields(userFields: UserField[], userFieldScheme: UserFieldScheme[]): Array<PreparedUserField>
	{
		const result = [];

		for (const userField of userFields)
		{
			if (userField.value === null)
			{
				continue;
			}

			const scheme: UserFieldScheme = userFieldScheme.find((item) => {
				return item.fieldName === userField.key;
			});

			if (scheme)
			{
				if (!this.validateField(userField.value, scheme.userTypeId))
				{
					continue;
				}

				result.push({
					value: userField.value,
					title: scheme.editFormLabel,
					type: scheme.userTypeId,
					mandatory: scheme.mandatory,
				});
			}
		}

		return result;
	}

	validateField(value: any, type: string): boolean
	{
		if (value === null || value === '')
		{
			return false;
		}

		if (Type.isArray(value) && value.length === 0)
		{
			return false;
		}

		if (Type.isArray(value) && value.every((item) => item === ''))
		{
			return false;
		}

		return !(type !== UserFieldType.Boolean && value === false);
	}

	hasFilledUserFields(userFields: UserField[], userFieldScheme: UserFieldScheme[]): boolean
	{
		return this.getPreparedUserFields(userFields, userFieldScheme).length > 0;
	}

	hasUnfilledFields(userFields: UserField[], userFieldScheme: UserFieldScheme[]): boolean
	{
		for (const scheme of userFieldScheme)
		{
			const field = userFields.find((item) => item.key === scheme.fieldName);

			if (!field || field.value === null)
			{
				return true;
			}
		}

		return false;
	}

	hasUnfilledMandatoryFields(userFields: UserField[], userFieldScheme: UserFieldScheme[]): boolean
	{
		for (const scheme of userFieldScheme)
		{
			if (!scheme.mandatory)
			{
				continue;
			}

			const field = userFields.find((item) => item.key === scheme.fieldName);

			if (!field || field.value === null)
			{
				return true;
			}
		}

		return false;
	}

	hasMandatoryUserFields(userFieldScheme: UserFieldScheme[]): boolean
	{
		for (const scheme of userFieldScheme)
		{
			if (scheme.mandatory)
			{
				return true;
			}
		}

		return false;
	}

	prepareUserFieldsForTaskFromTemplate(userFields: UserField[], userFieldScheme: UserFieldScheme[]): UserField[]
	{
		const result = [];

		for (const userField of userFields)
		{
			const scheme: UserFieldScheme = userFieldScheme.find((item) => {
				return item.fieldName === userField.key;
			});

			if (!scheme)
			{
				result.push(userField);

				continue;
			}

			if (scheme.userTypeId === UserFieldType.Datetime)
			{
				const preparedField = {
					key: userField.key,
					value: this.#convertDatetimeValue(userField.value),
				};

				result.push(preparedField);
			}
			else
			{
				result.push(userField);
			}
		}

		return result;
	}

	correctDatetimeStringWithT(dateString: string, date: Date): Date
	{
		const offsetMatch = dateString.match(/([+-]\d{2}):(\d{2})$/);
		const originalOffsetMinutes = offsetMatch
			? parseInt(offsetMatch[1], 10) * 60
				+ (parseInt(offsetMatch[1], 10) < 0 ? -1 : 1) * parseInt(offsetMatch[2], 10)
			: 0
		;
		const timezoneOffset = originalOffsetMinutes + date.getTimezoneOffset();

		date.setTime(date.getTime() + timezoneOffset * 60000);

		return date;
	}

	#convertDatetimeValue(value: any): any
	{
		if (value === null || value === '')
		{
			return value;
		}

		if (Type.isArray(value))
		{
			return value.map((item) => this.#formatDatetime(item));
		}

		return this.#formatDatetime(value);
	}

	#formatDatetime(dateString: string): string
	{
		if (!Type.isStringFilled(dateString))
		{
			return dateString;
		}

		if (!dateString.includes('T'))
		{
			return dateString;
		}

		const date = new Date(dateString);

		if (!this.#isValidDate(date))
		{
			return dateString;
		}

		const newDate = this.correctDatetimeStringWithT(dateString, date);

		const format = DateTimeFormat.getFormat('FORMAT_DATETIME');
		const timestamp = newDate.getTime() / 1000;

		return DateTimeFormat.format(format, timestamp);
	}

	#isValidDate(date: any): boolean
	{
		return Type.isDate(date) && !Number.isNaN(date.getTime());
	}
}

export const userFieldsManager = new UserFieldsManager();
