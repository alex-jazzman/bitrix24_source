/**
 * @module mail/selector/entity/mail-crm-element
 */
jn.define('mail/selector/entity/mail-crm-element', (require, exports, module) => {
	const { CrmElementSelector } = require('crm/selector/entity/element');
	/**
	 * @class MailCrmElementSelector
	 */
	class MailCrmElementSelector extends CrmElementSelector
	{
		static getEntityIds()
		{
			return [
				'contact',
				'company',
			];
		}

		static getContext()
		{
			return 'MESSAGES_FOR_CRM_ENTITIES';
		}

		static getEntityWeight()
		{
			return {
				contact: 100,
				company: 100,
			};
		}
	}

	module.exports = { MailCrmElementSelector };
});
