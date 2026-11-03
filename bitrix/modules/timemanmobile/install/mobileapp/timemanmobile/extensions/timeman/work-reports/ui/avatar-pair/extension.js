/**
 * @module timeman/work-reports/ui/avatar-pair
 */
jn.define('timeman/work-reports/ui/avatar-pair', (require, exports, module) => {
	const { Color } = require('tokens');
	const { Avatar } = require('ui-system/blocks/avatar');
	const { IconView, Icon } = require('ui-system/blocks/icon');

	function AvatarPair({ fromUser, toUser, getTestId })
	{
		return View(
			{
				style: {
					flexDirection: 'row',
					alignItems: 'center',
					flexShrink: 1,
				},
			},
			fromUser
				? Avatar({
					testId: getTestId('reporter'),
					id: fromUser.id,
					name: fromUser.name,
					uri: fromUser.photo,
					size: 24,
					withRedux: true,
				})
				: null,
			toUser
				? IconView({
					testId: getTestId('chevron'),
					icon: Icon.CHEVRON_TO_THE_RIGHT,
					color: Color.base4,
					size: 20,
				})
				: null,
			toUser
				? Avatar({
					testId: getTestId('evaluator'),
					id: toUser.id,
					name: toUser.name,
					uri: toUser.photo,
					size: 24,
					withRedux: true,
				})
				: null,
		);
	}

	module.exports = { AvatarPair };
});
