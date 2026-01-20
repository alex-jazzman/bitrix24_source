/**
 * @module layout/ui/reaction/const
 */
jn.define('layout/ui/reaction/const', (require, exports, module) => {
	const DEFAULT_REACTION = 'like';

	const OrderType = {
		DEFAULT: 'default',
		PRESERVE: 'preserve',
		CURRENT_USER_FAVORITES: 'currentUserFavorites',
	};

	module.exports = {
		DEFAULT_REACTION,
		OrderType,
	};
});
