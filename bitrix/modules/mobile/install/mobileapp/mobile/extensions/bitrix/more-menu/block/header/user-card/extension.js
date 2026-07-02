/**
 * @module more-menu/block/header/user-card
 */
jn.define('more-menu/block/header/user-card', (require, exports, module) => {
	const { Feature } = require('feature');
	const {
		UserCardClass,
		UserCard: HorizontalUserCard,
		mapStateToProps,
		mapDispatchToProps,
	} = require('layout/ui/user/card');
	const { Card } = require('ui-system/layout/card');
	const { Line, Circle } = require('utils/skeleton');
	const { Avatar } = require('ui-system/blocks/avatar');
	const { Indent } = require('tokens');
	const { Icon, IconView } = require('ui-system/blocks/icon');
	const { Text2 } = require('ui-system/typography/text');
	const { connect } = require('statemanager/redux/connect');
	const { getTextColorByTheme } = require('user/theme');

	const AVATAR_SIZE = 60;

	class UserCard extends UserCardClass
	{
		render()
		{
			return Card(
				{
					testId: this.getTestId('wrapper'),
					excludePaddingSide: { all: true },
					onClick: this.getOnCardClickHandler(),
					style: {
						backgroundColor: '#00000000',
						alignItems: 'center',
						paddingTop: Indent.S.toNumber(),
						paddingBottom: Indent.S.toNumber(),
					},
				},
				this.renderAvatar(),
				View(
					{
						style: {
							marginTop: Indent.XL2.toNumber(),
						},
					},
					this.renderDetails(),
				),
			);
		}

		renderAvatar()
		{
			const { user } = this.props;

			if (!user)
			{
				return Circle(AVATAR_SIZE);
			}

			return Avatar({
				id: user.id,
				name: user.name,
				size: AVATAR_SIZE,
				testId: this.getTestId('avatar'),
				image: user.avatar,
				withRedux: true,
				accent: user?.isExtranet || user?.isCollaber,
				entityType: this.getEntityType(user),
				backBorderWidth: 0,
			});
		}

		renderDetails()
		{
			const { user, currentTheme } = this.props;

			if (!user)
			{
				return this.renderDetailsSkeleton();
			}

			const textColor = getTextColorByTheme(currentTheme);

			return View(
				{
					style: {
						flexDirection: 'column',
						justifyContent: 'center',
						alignItems: 'center',
						flexShrink: 2,
						padding: Indent.XS.toNumber(),
					},
				},
				View(
					{
						style: {
							flexDirection: 'row',
							alignItems: 'center',
							flexShrink: 2,
						},
					},
					Text2({
						text: user.fullName,
						accent: true,
						testId: this.getTestId('full_name'),
						color: textColor,
						numberOfLines: 1,
						ellipsize: 'end',
						style: {
							flexShrink: 2,
						},
					}),
					IconView({
						icon: Icon.CHEVRON_TO_THE_RIGHT,
						size: 20,
						color: textColor,
						testId: this.getTestId('chevron'),
						resizeMode: 'cover',
						style: {
							width: 10,
							height: 21,
							marginLeft: Indent.XS.toNumber(),
							alignSelf: 'flex-end',
						},
					}),
				),
				this.renderStatus(textColor, 5),
			);
		}

		renderDetailsSkeleton()
		{
			return View(
				{
					style: {
						flexDirection: 'column',
						justifyContent: 'center',
						alignItems: 'center',
						flexShrink: 2,
						padding: Indent.XS.toNumber(),
						paddingTop: Indent.XL.toNumber(),
					},
				},
				View(
					{
						style: {
							marginBottom: Indent.XL.toNumber(),
						},
					},
					Line(120, 12),
				),
				Line(90, 9),
			);
		}
	}

	const VerticalUserCard = connect(mapStateToProps, mapDispatchToProps)(UserCard);

	module.exports = {
		UserCard: Feature.canUseWidgetBackground() ? VerticalUserCard : HorizontalUserCard,
	};
});
