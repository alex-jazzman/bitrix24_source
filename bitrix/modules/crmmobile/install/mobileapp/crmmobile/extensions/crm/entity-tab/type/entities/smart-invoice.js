/**
 * @module crm/entity-tab/type/entities/smart-invoice
 */
jn.define('crm/entity-tab/type/entities/smart-invoice', (require, exports, module) => {
	const { Base: BaseEntityType } = require('crm/entity-tab/type/entities/base');
	const { TypeId, TypeName } = require('crm/type');
	const { Loc } = require('loc');
	const { UIMenuType } = require('layout/ui/menu');

	/**
	 * @class SmartInvoice
	 */
	class SmartInvoice extends BaseEntityType
	{
		/**
		 * @returns {Number}
		 */
		getId()
		{
			return TypeId.SmartInvoice;
		}

		/**
		 * @returns {String}
		 */
		getName()
		{
			return TypeName.SmartInvoice;
		}

		getEmptyEntityScreenDescriptionText()
		{
			return Loc.getMessage('M_CRM_ENTITY_TAB_ENTITY_EMPTY_DESCRIPTION_SEND_TO_CLIENTS', {
				'#MANY_ENTITY_TYPE_TITLE#': this.getManyEntityTypeTitle(),
			});
		}

		getMenuActions()
		{
			return [
				{
					type: UIMenuType.HELPDESK,
					data: {
						articleCode: '17418408',
					},
				},
			];
		}
	}

	module.exports = { SmartInvoice };
});
