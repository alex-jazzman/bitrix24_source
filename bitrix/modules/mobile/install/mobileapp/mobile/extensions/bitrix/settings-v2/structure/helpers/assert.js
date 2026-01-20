/**
 * @module settings-v2/structure/helpers/assert
 */
jn.define('settings-v2/structure/helpers/assert', (require, exports, module) => {
	const { Type } = require('type');

	function assertDefined(expectedKeys, props, entityName)
	{
		expectedKeys.forEach((key) => {
			if (Type.isNil(props[key]))
			{
				console.error(`${entityName} must have ${key}, but got ${JSON.stringify(props)}`);
			}
		});
	}

	module.exports = {
		assertDefined,
	};
});
