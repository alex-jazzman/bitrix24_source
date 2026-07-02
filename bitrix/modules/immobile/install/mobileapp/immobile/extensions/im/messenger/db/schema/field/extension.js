/**
 * @module im/messenger/db/schema/field
 */
jn.define('im/messenger/db/schema/field', (require, exports, module) => {
	const { BaseField } = require('im/messenger/db/schema/field/src/base');
	const { ScalarField } = require('im/messenger/db/schema/field/src/scalar');
	const { OrderedField } = require('im/messenger/db/schema/field/src/ordered');

	const { IntegerField } = require('im/messenger/db/schema/field/src/integer');
	const { StringField } = require('im/messenger/db/schema/field/src/string');
	const { BooleanField } = require('im/messenger/db/schema/field/src/boolean');
	const { DateField } = require('im/messenger/db/schema/field/src/date');

	const { StructuredField } = require('im/messenger/db/schema/field/src/structured');
	const { ObjectField } = require('im/messenger/db/schema/field/src/object');
	const { ArrayField } = require('im/messenger/db/schema/field/src/array');
	const { MapField } = require('im/messenger/db/schema/field/src/map');
	const { SetField } = require('im/messenger/db/schema/field/src/set');

	const { ExpressionField, expressionField } = require('im/messenger/db/schema/field/src/expression');
	const { FieldAlias } = require('im/messenger/db/schema/field/src/alias');

	module.exports = {
		BaseField,
		ScalarField,
		OrderedField,

		IntegerField,
		StringField,
		BooleanField,
		DateField,

		StructuredField,
		ObjectField,
		ArrayField,
		MapField,
		SetField,

		ExpressionField,
		expressionField,

		FieldAlias,
	};
});
