/**
 * @module onboarding/condition
 */
jn.define('onboarding/condition', (require, exports, module) => {
	const { getProfileFields } = require('onboarding/utils');
	const { isLonelyUser } = require('onboarding/utils');
	const { VisitCounter } = require('onboarding/visit-counter');

	class ConditionBase
	{
		static hasAppVisitsAtLeast(minDays)
		{
			return async (context) => {
				const counter = new VisitCounter();
				const day = await counter.getFromServer();

				return day >= minDays;
			};
		}

		static isCurrentUserProfile()
		{
			return (context) => {
				return Number(context.ownerId) === Number(env.userId);
			};
		}

		static profileRequiredFieldsFilledAtLeast(count)
		{
			const requiredFields = [
				['NAME', 'LAST_NAME'],
				'WORK_POSITION',
				'PERSONAL_MOBILE',
			];

			return ConditionBase.profileFieldsFilledAtLeast(requiredFields, count);
		}

		static profileFieldsFilledAtLeast(fields, count)
		{
			return async (context) => {
				const commonFields = await getProfileFields(context);
				const allFields = ConditionBase.#extractAllFields(commonFields);
				const byId = ConditionBase.#mapFieldsById(allFields);

				const filledCount = fields.filter((field) => ConditionBase.#isFieldGroupFilled(field, byId)).length;

				return filledCount >= count;
			};
		}

		static #extractAllFields(groups)
		{
			return (Array.isArray(groups) ? groups : []).flatMap((group) => {
				return (Array.isArray(group?.fields) ? group.fields : []);
			});
		}

		static #mapFieldsById(fields)
		{
			return new Map(fields.map((field) => [field.id, field]));
		}

		static #isFieldGroupFilled(field, byId)
		{
			if (Array.isArray(field))
			{
				return field.every((id) => ConditionBase.#checkIsNonEmpty(ConditionBase.#getValue(id, byId)));
			}

			return ConditionBase.#checkIsNonEmpty(ConditionBase.#getValue(field, byId));
		}

		static #getValue(id, byId)
		{
			return byId.get(id)?.value ?? null;
		}

		static #checkIsNonEmpty(val)
		{
			if (!val)
			{
				return false;
			}

			if (typeof val === 'string')
			{
				return val.trim().length > 0;
			}

			if (typeof val === 'object')
			{
				return Object.prototype.hasOwnProperty.call(
					val,
					'IS_EMPTY',
				) ? !val.IS_EMPTY : Object.keys(val).length > 0;
			}

			return Boolean(val);
		}

		static isUserAlone()
		{
			return async () => {
				return isLonelyUser();
			};
		}

		static any(conditions = [])
		{
			return async (ctx) => {
				for (const cond of conditions)
				{
					if (!cond)
					{
						continue;
					}

					// eslint-disable-next-line no-await-in-loop
					const result = await cond(ctx);

					if (result)
					{
						return true;
					}
				}

				return false;
			};
		}

		static not(condition)
		{
			return async (ctx) => {
				if (!condition)
				{
					return false;
				}

				// eslint-disable-next-line no-await-in-loop
				const result = await condition(ctx);

				return result === false;
			};
		}
	}

	module.exports = {
		ConditionBase,
	};
});
