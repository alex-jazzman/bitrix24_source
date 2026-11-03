import StoreDocumentFieldConfigurator from './store-document-field-configurator';
import { Type } from 'main.core';

const disabledAiFillPolicy = {
	isAiFillPolicyAvailable: () => false,
	isAiFillPolicyChanged: () => false,
	isAiFillPolicySupportedForType: () => false,
	getSavedAiFillPolicyState: () => true,
};

export default class StoreDocumentFieldConfigurationManager extends BX.UI.EntityConfigurationManager
{
	getSimpleFieldConfigurator(params, parent): StoreDocumentFieldConfigurator
	{
		let typeId = '';
		const field = Type.isObject(params.field) ? params.field : null;
		if (field)
		{
			typeId = field.getType();
			field.setVisible(false);

			let userType = field.getSchemeElement().getData().userType;
			userType = Type.isString(userType) ? userType : false;
			if (userType)
			{
				typeId = userType;
			}
		}
		else
		{
			typeId = Type.isString(params.TypeId) ? params.TypeId : BX.UI.EntityUserFieldType.string;
		}

		this._fieldConfigurator = StoreDocumentFieldConfigurator.create(
			'',
			{
				editor: this._editor,
				schemeElement: null,
				model: parent._model,
				mode: BX.UI.EntityEditorMode.edit,
				parent,
				typeId,
				field,
				mandatoryConfigurator: null,
			},
		);

		return this._fieldConfigurator;
	}

	getUserFieldConfigurator(params, parent)
	{
		const configurator = super.getUserFieldConfigurator(params, parent);
		// Remove after http://jabber.bx/view.php?id=256488 fixes the shared configurator contract.
		for (const [methodName, implementation] of Object.entries(disabledAiFillPolicy))
		{
			if (!Type.isFunction(configurator[methodName]))
			{
				configurator[methodName] = implementation;
			}
		}

		return configurator;
	}

	static create(id, settings): StoreDocumentFieldConfigurationManager
	{
		const self: StoreDocumentFieldConfigurationManager = new this();
		self.initialize(id, settings);

		return self;
	}
}
