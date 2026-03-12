/**
 * @module user-profile/common-tab/src/block/common-fields/src/field/social-field
 */
jn.define('user-profile/common-tab/src/block/common-fields/src/field/social-field', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { ChipButton, ChipButtonDesign, ChipButtonMode } = require('ui-system/blocks/chips/chip-button');
	const { Icon, IconView } = require('ui-system/blocks/icon');
	const { Text4 } = require('ui-system/typography/text');
	const { Color, Indent } = require('tokens');
	const { copyToClipboard } = require('utils/copy');
	const { normalizeSocialLink } = require('utils/url/social');
	const { PropTypes } = require('utils/validation');
	const { createTestIdGenerator } = require('utils/test');
	const { Haptics } = require('haptics');
	const {
		getSocialIconUriById,
		getSocialPlatformById,
	} = require('user-profile/common-tab/src/block/common-fields/src/utils');

	class SocialField extends PureComponent
	{
		/**
		 * @param {object} props
		 * @param {string} props.testId
		 * @param {string} props.id
		 * @param {string} props.value
		 * @param {boolean} [props.isEditMode=false]
		 * @param {function|null} [props.onSocialRemove=null]
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ context: this });

			this.onCopyClick = this.#onCopyClick.bind(this);
			this.onSocialClick = this.#onSocialClick.bind(this);
		}

		render()
		{
			const { isEditMode, id, value, onSocialRemove } = this.props;

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
							maxWidth: '100%',
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'center',
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
					View(
						{
							style: {
								flexShrink: 1,
								flexGrow: 1,
								marginLeft: Indent.XS.toNumber(),
							},
						},
						Text4({
							testId: this.getTestId('field-value'),
							text: value,
							numberOfLines: 1,
							ellipsize: 'end',
						}),
					),
					isEditMode && IconView({
						style: {
							marginLeft: Indent.XS.toNumber(),
						},
						testId: this.getTestId('field-remove-button'),
						icon: Icon.CROSS,
						color: Color.base5,
						onClick: () => onSocialRemove?.(id),
					}),
					!isEditMode && IconView({
						style: {
							marginLeft: Indent.XS.toNumber(),
						},
						testId: this.getTestId('field-copy-button'),
						icon: Icon.COPY,
						color: Color.base5,
						onClick: this.onCopyClick,
					}),
				),
				testId: this.getTestId('chip-button'),
				onClick: isEditMode ? null : this.onSocialClick,
			});
		}

		#onCopyClick()
		{
			const normalizedLink = this.#getNormalizedLink();

			Haptics.notifySuccess();
			copyToClipboard(normalizedLink || this.props.value);
		}

		#onSocialClick()
		{
			const normalizedLink = this.#getNormalizedLink();
			if (normalizedLink)
			{
				Haptics.notifySuccess();
				Application.openUrl(normalizedLink);
			}
		}

		#getNormalizedLink()
		{
			const { id, value } = this.props;
			const platform = getSocialPlatformById(id);

			return normalizeSocialLink(platform, value);
		}
	}

	SocialField.defaultProps = {
		isEditMode: false,
		onSocialRemove: null,
	};

	SocialField.propTypes = {
		testId: PropTypes.string.isRequired,
		id: PropTypes.string.isRequired,
		value: PropTypes.string.isRequired,
		isEditMode: PropTypes.bool,
		onSocialRemove: PropTypes.func,
	};

	module.exports = { SocialField };
});
