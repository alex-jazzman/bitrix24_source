/**
 * @module intranet/simple-list/items/login
 */
jn.define('intranet/simple-list/items/login', (require, exports, module) => {
	const { Base } = require('layout/ui/simple-list/items/base');
	const { LoginContentView } = require('intranet/simple-list/items/login/src/content-view');

	class Login extends Base
	{
		renderItemContent()
		{
			return new LoginContentView({
				testId: 'login-item',
				...this.props.item,
			});
		}
	}

	module.exports = { Login };
});
