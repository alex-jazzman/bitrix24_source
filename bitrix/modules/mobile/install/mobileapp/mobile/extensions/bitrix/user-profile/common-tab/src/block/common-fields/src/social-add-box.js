/**
 * @module user-profile/common-tab/src/block/common-fields/src/social-add-box
 */
jn.define('user-profile/common-tab/src/block/common-fields/src/social-add-box', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { BottomSheet } = require('bottom-sheet');
	const { Box } = require('ui-system/layout/box');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { Area } = require('ui-system/layout/area');
	const { ChipButton, ChipButtonDesign, ChipButtonMode } = require('ui-system/blocks/chips/chip-button');
	const { Text4 } = require('ui-system/typography/text');
	const { StringInput, InputDesign } = require('ui-system/form/inputs/string');
	const { Indent } = require('tokens');
	const { Loc } = require('loc');
	const { Haptics } = require('haptics');
	const { createTestIdGenerator } = require('utils/test');
	const { getSocialIconUriById } = require('user-profile/common-tab/src/block/common-fields/src/utils');
	const { PropTypes } = require('utils/validation');

	class SocialAddBox extends PureComponent
	{
		/**
		 * @param {object} social
		 * @param {function} onSave
		 * @param {PageManager} parentWidget
		 */
		static open({ social, onSave, parentWidget = PageManager })
		{
			void new BottomSheet({
				titleParams: {
					type: 'dialog',
					text: Loc.getMessage('M_PROFILE_COMMON_FIELDS_SOCIAL_ADD_WIDGET_TITLE'),
				},
				component: (widget) => new SocialAddBox({ social, onSave, layoutWidget: widget }),
			})
				.setParentWidget(parentWidget)
				.hideNavigationBarBorder()
				.disableOnlyMediumPosition()
				.setMediumPositionHeight(200)
				.enableAdoptHeightByKeyboard()
				.open()
			;
		}

		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ context: this });
			this.onSocialLinkChange = this.#onSocialLinkChange.bind(this);

			this.state = {
				socialLink: '',
			};
		}

		render()
		{
			return Box(
				{
					withScroll: false,
					resizableByKeyboard: true,
					safeArea: {
						bottom: true,
					},
					footer: BoxFooter({
						keyboardButton: {
							disabled: this.state.socialLink.trim().length === 0,
							text: Loc.getMessage('M_PROFILE_COMMON_FIELDS_SOCIAL_ADD_SAVE'),
							testId: this.getTestId('button-save'),
							onClick: () => {
								const { onSave, layoutWidget } = this.props;

								Haptics.notifySuccess();
								onSave(this.state.socialLink.trim());
								layoutWidget.close();
							},
						},
					}),
				},
				Area(
					{
						style: {
							alignItems: 'center',
						},
						isFirst: true,
					},
					this.#renderSocialChip(),
					this.#renderSocialLink(),
				),
			);
		}

		#renderSocialChip()
		{
			const { id, title } = this.props.social;

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
			});
		}

		#renderSocialLink()
		{
			return StringInput({
				testId: this.getTestId('input'),
				design: InputDesign.GREY,
				focus: true,
				label: Loc.getMessage('M_PROFILE_COMMON_FIELDS_SOCIAL_ADD_LINK_LABEL'),
				value: this.state.socialLink,
				onChange: this.onSocialLinkChange,
			});
		}

		#onSocialLinkChange(value)
		{
			this.setState({ socialLink: value });
		}
	}

	SocialAddBox.propTypes = {
		social: PropTypes.shape({
			id: PropTypes.string.isRequired,
			title: PropTypes.string.isRequired,
		}).isRequired,
		onSave: PropTypes.func.isRequired,
		layoutWidget: PropTypes.object.isRequired,
	};

	module.exports = { SocialAddBox };
});
