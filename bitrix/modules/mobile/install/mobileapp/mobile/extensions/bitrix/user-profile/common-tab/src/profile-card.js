/**
 * @module user-profile/common-tab/profile-card
 */
jn.define('user-profile/common-tab/profile-card', (require, exports, module) => {
	const { Indent, Color, Corner, Component } = require('tokens');
	const { Text4 } = require('ui-system/typography/text');

	const ViewMode = {
		FULL_WIDTH: 'full',
		HALF_WIDTH: 'half',
	};

	const BaseViewStyles = {
		backgroundColor: Color.bgContentPrimary.toHex(),
		flexDirection: 'column',
		justifyContent: 'flex-start',
		marginBottom: Component.cardListGap.toNumber(),
	};

	const ViewModeStyles = {
		[ViewMode.FULL_WIDTH]: {
			...BaseViewStyles,
			width: '100%',
			borderRadius: Component.cardPaddingT.toNumber(),
			padding: Component.cardPaddingLr.toNumber(),
		},
		[ViewMode.HALF_WIDTH]: {
			...BaseViewStyles,
			minWidth: 171,
			borderRadius: Corner.L.toNumber(),
			padding: Indent.XL.toNumber(),
		},
	};

	/**
	 * @class
	 * @extends LayoutComponent
	 * @property {string|null} title
	 * @property {Object|null} content
	 * @property {Object} viewMode
	 */
	class ProfileCard extends LayoutComponent
	{
		/**
		 * @returns {string|null}
		 */
		get title()
		{
			return this.props.title ?? null;
		}

		/**
		 * @returns {Object|null}
		 */
		get content()
		{
			return this.props.content ?? null;
		}

		/**
		 * @returns {Object|null}
		 */
		get shimmer()
		{
			return this.props.shimmer ?? null;
		}

		/**
		 * @returns {Object|null}
		 */
		get emptyState()
		{
			return this.props.emptyState ?? null;
		}

		/**
		 * @returns {string|null}
		 */
		get testId()
		{
			return this.props.testId ?? null;
		}

		/**
		 * @returns {Object}
		 */
		get viewModeStyles()
		{
			return ViewModeStyles[this.props.viewMode] ?? ViewModeStyles[ViewMode.FULL_WIDTH];
		}

		render()
		{
			const { onClick, onLongClick, style: customStyles = {} } = this.props;

			return View(
				{
					style: {
						...this.viewModeStyles,
						...customStyles,
					},
					onClick,
					onLongClick,
					testId: this.testId,
				},
				!this.emptyState && this.renderTitle(),
				this.renderContent(),
			);
		}

		renderTitle()
		{
			if (!this.title)
			{
				return null;
			}

			return Text4({
				text: this.title,
				color: Color.base1,
				style: {
					marginBottom: Indent.XL2.toNumber(),
				},
			});
		}

		renderContent()
		{
			if (!this.content && this.shimmer)
			{
				return this.shimmer;
			}

			if (this.emptyState)
			{
				return this.emptyState;
			}

			return this.content;
		}
	}

	ProfileCard.defaultProps = {
		title: null,
		content: null,
		shimmer: null,
		emptyState: null,
		testId: null,
		viewMode: ViewMode.FULL_WIDTH,
	};

	ProfileCard.propTypes = {
		testId: PropTypes.string.isRequired,
		viewMode: PropTypes.oneOf([ViewMode.FULL_WIDTH, ViewMode.HALF_WIDTH]),
		title: PropTypes.string,
		content: PropTypes.object,
		shimmer: PropTypes.object,
		emptyState: PropTypes.object,
		onClick: PropTypes.func,
		onLongClick: PropTypes.func,
		style: PropTypes.object,
	};

	module.exports = {
		ProfileCard: (props) => new ProfileCard(props),
		ProfileCardClass: ProfileCard,
		ViewMode,
	};
});
