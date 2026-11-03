/**
 * @module layout/ui/user-list/src/list-item
 */
jn.define('layout/ui/user-list/src/list-item', (require, exports, module) => {
	const { Color, Indent } = require('tokens');
	const { Avatar } = require('ui-system/blocks/avatar');
	const { UserName } = require('layout/ui/user/user-name');
	const { Text2, Text5 } = require('ui-system/typography/text');
	const { UserProfile } = require('user-profile');

	class ListItem extends LayoutComponent
	{
		constructor(props)
		{
			super(props);
			this.layoutWidget = null;
		}

		render()
		{
			const { user, showBorder, testId, renderBelowBlock } = this.props;

			if (renderBelowBlock)
			{
				return this.#renderWithBelowBlock(user, showBorder, testId);
			}

			return this.renderListItem(this.props);
		}

		renderListItem({ user, showBorder, testId })
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						marginLeft: Indent.XL3.toNumber(),
					},
					testId,
					onClick: () => this.#openUserProfile(user.id),
					onLongClick: this.props.onItemLongClick && (() => this.props.onItemLongClick(user)),
				},
				this.#renderAvatar(user, testId),
				View(
					{
						style: {
							height: 70,
							justifyContent: 'center',
							flex: 1,
							flexDirection: 'column',
							marginHorizontal: Indent.XL.toNumber(),
							borderTopWidth: showBorder ? 1 : 0,
							borderTopColor: Color.bgSeparatorPrimary.toHex(),
							paddingVertical: Indent.XL2.toNumber(),
						},
					},
					this.#renderName(user, testId),
					this.#renderAdditionalText(user, testId),
				),
				this.#renderRightAction(user, testId),
			);
		}

		/**
		 * Layout for rows that carry a below-block (e.g. a status chip): the chip row starts
		 * under the avatar - below the whole "avatar + texts" block, not under the text column.
		 */
		#renderWithBelowBlock(user, showBorder, testId)
		{
			return View(
				{
					style: {
						marginLeft: Indent.XL3.toNumber(),
						borderTopWidth: showBorder ? 1 : 0,
						borderTopColor: Color.bgSeparatorPrimary.toHex(),
						paddingVertical: Indent.XL2.toNumber(),
					},
				},
				View(
					{
						style: {
							flexDirection: 'row',
							alignItems: 'flex-start',
						},
						testId,
						onClick: () => this.#openUserProfile(user.id),
						onLongClick: this.props.onItemLongClick && (() => this.props.onItemLongClick(user)),
					},
					this.#renderAvatar(user, testId),
					View(
						{
							style: {
								flex: 1,
								flexDirection: 'column',
								marginHorizontal: Indent.XL.toNumber(),
							},
						},
						this.#renderName(user, testId),
						this.#renderAdditionalText(user, testId),
					),
					this.#renderRightAction(user, testId),
				),
				this.#renderBelowBlock(user, testId),
			);
		}

		#renderAvatar(user, testId)
		{
			return Avatar({
				id: user.id,
				name: user.name,
				size: 40,
				testId: `${testId}_AVATAR`,
				image: user.avatar,
				withRedux: true,
			});
		}

		#renderName(user, testId)
		{
			return UserName({
				id: user.id,
				testId: `${testId}_NAME`,
				text: user.name,
				numberOfLines: 1,
				ellipsize: 'end',
				textElement: Text2,
			});
		}

		#renderAdditionalText(user, testId)
		{
			if (this.props.renderCustomDescription)
			{
				return this.props.renderCustomDescription(user);
			}

			const { workPosition } = user;

			if (workPosition)
			{
				return Text5({
					color: Color.base3,
					testId: `${testId}-work-position`,
					numberOfLines: 1,
					ellipsize: 'end',
					text: workPosition,
				});
			}

			return null;
		}

		#renderBelowBlock(user, testId)
		{
			if (!this.props.renderBelowBlock)
			{
				return null;
			}

			return View(
				{
					testId: `${testId}-below-block`,
				},
				this.props.renderBelowBlock(user, this.props.parentWidget),
			);
		}

		#renderRightAction(user, testId)
		{
			if (!this.props.renderRightAction)
			{
				return null;
			}

			return View(
				{
					testId: `${testId}-right-action`,
					style: {
						marginRight: Indent.XL3.toNumber(),
					},
				},
				this.props.renderRightAction(user, this.props.parentWidget),
			);
		}

		/**
		 * @returns {PageManager}
		 */
		getParentWidget()
		{
			const { parentWidget } = this.props;

			return parentWidget;
		}

		#openUserProfile(userId)
		{
			void UserProfile.open({
				ownerId: userId,
				parentWidget: this.getParentWidget(),
				analyticsSection: 'ui_user_list_item',
			});
		}
	}

	module.exports = { ListItem };
});
