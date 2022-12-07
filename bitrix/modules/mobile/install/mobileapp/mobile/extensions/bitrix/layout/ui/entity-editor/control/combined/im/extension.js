/**
 * @module layout/ui/entity-editor/control/combined/im
 */
jn.define('layout/ui/entity-editor/control/combined/im', (require, exports, module) => {

	const { EntityEditorWeb } = require('layout/ui/entity-editor/control/combined/web');

	/**
	 * @class EntityEditorIm
	 */
	class EntityEditorIm extends EntityEditorWeb
	{
		prepareValue(value)
		{
			const { VALUE, VALUE_TYPE } = value;

			return {
				...value,
				LINK: this.getLink(VALUE_TYPE).replace(/#VALUE_URL#/i, VALUE),
			};
		}

	}

	module.exports = { EntityEditorIm };
});
