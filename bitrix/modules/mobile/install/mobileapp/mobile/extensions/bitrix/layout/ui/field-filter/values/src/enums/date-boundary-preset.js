/**
 * @module layout/ui/field-filter/values/src/enums/date-boundary-preset
 */
jn.define('layout/ui/field-filter/values/src/enums/date-boundary-preset', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');

	/**
	 * Date presets that carry explicit boundaries (main UI\Filter\DateType).
	 * Only these require `_from`/`_to` alongside `_datesel` (ALG-01).
	 * @extends {BaseEnum<DateBoundaryPreset>}
	 */
	class DateBoundaryPreset extends BaseEnum
	{
		static RANGE = new DateBoundaryPreset('RANGE', 'RANGE');

		static EXACT = new DateBoundaryPreset('EXACT', 'EXACT');

		/**
		 * Whether the preset takes two dates. `EXACT` takes one: `Options::calcDates()` reads `_from`
		 * alone there and closes the day itself, so a second date is a value nobody reads - and a date
		 * standing in it alone draws a filled row over a condition the server drops.
		 *
		 * @param {?string} preset
		 * @return {boolean}
		 */
		static hasUpperBoundary(preset)
		{
			return preset === DateBoundaryPreset.RANGE.getValue();
		}
	}

	module.exports = {
		DateBoundaryPreset: DateBoundaryPreset.export(),
	};
});
