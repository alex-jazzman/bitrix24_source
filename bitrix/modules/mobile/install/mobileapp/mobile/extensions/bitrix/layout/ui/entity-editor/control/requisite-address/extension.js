(() => {

	/**
	 * @class RequisiteAddressField
	 */
	class RequisiteAddressField extends EntityEditorField
	{
		constructor(props)
		{
			super(props);
		}

		getValueFromModel(defaultValue = [])
		{
			if (this.model)
			{
				const requisites = this.model.getField('REQUISITES_ADDRESSES_RAW', {});

				return Array.isArray(requisites) ? requisites : [];
			}

			return defaultValue;
		}

		getValuesToSave()
		{
			return {};
		}
	}

	jnexport(RequisiteAddressField);
})();
