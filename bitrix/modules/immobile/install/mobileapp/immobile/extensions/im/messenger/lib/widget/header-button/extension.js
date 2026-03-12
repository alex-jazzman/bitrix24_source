/**
 * @module im/messenger/lib/widget/header-button
 */
jn.define('im/messenger/lib/widget/header-button', (require, exports, module) => {
	const { Button } = require('im/messenger/lib/widget/header-button/button');
	const { PopupCreateButton } = require('im/messenger/lib/widget/header-button/popup-create-button');
	const { PopupButton } = require('im/messenger/lib/widget/header-button/popup-button');

	module.exports = {
		Button,
		PopupCreateButton,
		PopupButton,
	};
});
