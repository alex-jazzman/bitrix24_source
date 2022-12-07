/**
 * @module layout/ui/entity-editor/control/combined/web
 */
jn.define('layout/ui/entity-editor/control/combined/web', (require, exports, module) => {

	const { stringify } = require('utils/string');
	const { isValidLink } = require('utils/url');
	const { EntityEditorCombinedBase } = require('layout/ui/entity-editor/control/combined/base');

	/**
	 * @class EntityEditorWeb
	 */
	class EntityEditorWeb extends EntityEditorCombinedBase
	{
		getValueFromModel(defaultValue = '')
		{
			if (!this.model)
			{
				return defaultValue;
			}

			const values = this.model.getField(this.getName(), []);

			return (
				values.length
					? values.map((entityValue) => ({ ...entityValue, value: this.prepareValue(entityValue.value) }))
					: defaultValue
			);
		}

		getLink(type)
		{
			const { links } = this.schemeElement.getData();

			if (links && type && links.hasOwnProperty(type))
			{
				return stringify(links[type]);
			}

			return '';
		}

		prepareValue(value)
		{
			const { VALUE, VALUE_TYPE } = value;

			return {
				...value,
				LINK: isValidLink(VALUE) ? VALUE : this.getLink(VALUE_TYPE).replace(/#VALUE_URL#/i, VALUE),
			};
		}
	}

	module.exports = { EntityEditorWeb };
});
