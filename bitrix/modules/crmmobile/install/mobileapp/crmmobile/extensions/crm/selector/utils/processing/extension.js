/**
 * @module crm/selector/utils/processing
 */
jn.define('crm/selector/utils/processing', (require, exports, module) => {

	const { isEmpty } = require('utils/object');
	const TYPE_ADVANCED_INFO = ['EMAIL', 'PHONE', 'IM'];

	/**
	 * @class SelectorProcessing
	 */
	class SelectorProcessing
	{
		static prepareContact(secondaryData)
		{
			const { id, title, type, desc, hidden, advancedInfo = {} } = secondaryData;
			const params = {
				id: Number(id),
				title,
				type,
				subtitle: desc,
				hidden,
			};

			const multiFields = advancedInfo.multiFields || [];
			const requisiteData = advancedInfo.requisiteData || [];

			params.addresses = requisiteData
				.filter(({ selected }) => selected)
				.map(({ requisiteData }) => {
					try
					{
						const requisite = JSON.parse(requisiteData);

						if (isEmpty(requisite) || isEmpty(requisite.formattedAddresses))
						{
							return [];
						}

						return Object.values(requisite.formattedAddresses);

					}
					catch (e)
					{
						console.error(e);
						return [];
					}
				}).flat();

			if (multiFields.length > 0)
			{
				multiFields.forEach(({ TYPE_ID, VALUE_FORMATTED, COMPLEX_NAME, VALUE_TYPE }) => {
					const key = TYPE_ID.toLowerCase();
					if (
						!params.hasOwnProperty(key)
						&& TYPE_ADVANCED_INFO.includes(TYPE_ID)
						&& VALUE_FORMATTED
					)
					{
						params[key] = {
							value: VALUE_FORMATTED,
							complexName: COMPLEX_NAME,
							valueType: VALUE_TYPE,
						};
					}
				});
			}

			return params;
		}
	}

	module.exports = { SelectorProcessing };
});