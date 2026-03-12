/**
 * @module user-profile/common-tab/src/block/common-fields/src/social-list-box
 */
jn.define('user-profile/common-tab/src/block/common-fields/src/social-list-box', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { BottomSheet } = require('bottom-sheet');
	const { Area } = require('ui-system/layout/area');
	const { ChipButton, ChipButtonDesign, ChipButtonMode } = require('ui-system/blocks/chips/chip-button');
	const { Text4 } = require('ui-system/typography/text');
	const { Indent } = require('tokens');
	const { Loc } = require('loc');
	const { Haptics } = require('haptics');
	const { createTestIdGenerator } = require('utils/test');
	const { SocialAddBox } = require('user-profile/common-tab/src/block/common-fields/src/social-add-box');
	const { getSocialIconUriById } = require('user-profile/common-tab/src/block/common-fields/src/utils');
	const { PropTypes } = require('utils/validation');
	const { useCallback } = require('utils/function');

	class SocialListBox extends PureComponent
	{
		/**
		 * @param {array} socials
		 * @param {PageManager} parentWidget
		 * @param {function} onSocialAdd
		 */
		static open({ socials, onSocialAdd, parentWidget = PageManager })
		{
			void new BottomSheet({
				titleParams: {
					type: 'dialog',
					text: Loc.getMessage('M_PROFILE_COMMON_FIELDS_SOCIAL_LIST_WIDGET_TITLE'),
				},
				component: (widget) => {
					return new SocialListBox({
						socials,
						onSocialAdd,
						parentWidget,
						layoutWidget: widget,
					});
				},
			})
				.setParentWidget(parentWidget)
				.hideNavigationBarBorder()
				.enableOnlyMediumPosition()
				.setMediumPositionHeight(150)
				.open()
			;
		}

		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ context: this });
		}

		render()
		{
			return Area(
				{
					isFirst: false,
				},
				View(
					{
						style: {
							flexDirection: 'row',
							flexWrap: 'wrap',
							justifyContent: 'center',
						},
					},
					...this.props.socials.map((field) => this.#renderSocial(field)),
				),
			);
		}

		#renderSocial({ id, title })
		{
			return ChipButton({
				style: {
					marginRight: Indent.XL.toNumber(),
					marginBottom: Indent.XL.toNumber(),
				},
				mode: ChipButtonMode.OUTLINE,
				design: ChipButtonDesign.GREY,
				content: View(
					{
						style: {
							flexDirection: 'row',
						},
						testId: this.getTestId('field-content'),
					},
					Image({
						style: {
							width: 20,
							height: 20,
						},
						svg: {
							uri: getSocialIconUriById(id),
						},
					}),
					Text4({
						style: {
							marginLeft: Indent.XS.toNumber(),
						},
						testId: this.getTestId('field-value'),
						text: title,
					}),
				),
				testId: this.getTestId('chip-button'),
				onClick: useCallback(() => this.#onSocialClick({ id, title })),
			});
		}

		#onSocialClick(social)
		{
			const { layoutWidget, parentWidget, onSocialAdd } = this.props;

			Haptics.impactLight();
			layoutWidget.close(() => {
				SocialAddBox.open({
					social,
					parentWidget,
					onSave: (value) => onSocialAdd(social.id, value),
				});
			});
		}
	}

	SocialListBox.propTypes = {
		socials: PropTypes.array.isRequired,
		parentWidget: PropTypes.object.isRequired,
		layoutWidget: PropTypes.object.isRequired,
		onSocialAdd: PropTypes.func.isRequired,
	};

	module.exports = { SocialListBox };
});
