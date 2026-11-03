/**
 * @module layout/ui/field-filter/values/src/enums/field-type
 */
jn.define('layout/ui/field-filter/values/src/enums/field-type', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');

	/**
	 * Canonical field types (CONTRACT-DTO-01).
	 * @extends {BaseEnum<FieldType>}
	 */
	class FieldType extends BaseEnum
	{
		static STRING = new FieldType('STRING', 'string');

		static NUMBER = new FieldType('NUMBER', 'number');

		static DATE = new FieldType('DATE', 'date');

		static LIST = new FieldType('LIST', 'list');

		static BOOLEAN = new FieldType('BOOLEAN', 'boolean');

		static ENTITY_SELECTOR = new FieldType('ENTITY_SELECTOR', 'entity_selector');

		static FULLTEXT = new FieldType('FULLTEXT', 'fulltext');
	}

	module.exports = {
		FieldType: FieldType.export(),
	};
});
