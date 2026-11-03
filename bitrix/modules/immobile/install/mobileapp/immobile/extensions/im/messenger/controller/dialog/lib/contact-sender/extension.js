/**
 * @module im/messenger/controller/dialog/lib/contact-sender
 */
jn.define('im/messenger/controller/dialog/lib/contact-sender', (require, exports, module) => {
	const {
		ContactSender,
		prepareContact,
		findSourceContact,
	} = require('im/messenger/controller/dialog/lib/contact-sender/src/contact-sender');

	module.exports = { ContactSender, prepareContact, findSourceContact };
});
