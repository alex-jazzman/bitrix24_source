/**
 * @module communication/connection
 */
jn.define('communication/connection', (require, exports, module) => {

		const { CommunicationMenu } = require('communication/menu');
		const { connectionItem } = require('communication/connection/item');
		const { ClientType } = require('layout/ui/fields/client');
		const { EmailType } = require('layout/ui/fields/email');
		const { ImType } = require('layout/ui/fields/im');
		const { PhoneType } = require('layout/ui/fields/phone');
		const { isEmpty } = require('utils/object');

		const connections = [PhoneType, ImType, EmailType];
		const openLineCode = 'OPENLINE';


		const isExistContacts = (entityValue, entityType) => {

			if (isEmpty(entityValue))
			{
				return false;
			}

			return Boolean(
				Object
					.keys(entityValue)
					.filter((entityName) => Array.isArray(entityValue[entityName]))
					.map((entityName) => entityValue[entityName].map((value) => {
						return Array.isArray(value[entityType])
							? value[entityType].filter(({ valueType }) =>
								entityType !== ImType || openLineCode === valueType)
							: value[entityType];
					}))
					.flat(Infinity)
					.filter(Boolean)
					.length,
			);
		};

		module.exports = { isExistContacts, connections };
	},
);
