/**
 * @module tasks/unsupported-feature
 */
jn.define('tasks/unsupported-feature', (require, exports, module) => {
	const { Type } = require('type');
	const { createTestIdGenerator } = require('utils/test');
	const { PureComponent } = require('layout/pure-component');
	const { Color, Corner, Indent } = require('tokens');
	const { Box } = require('ui-system/layout/box');
	const { Text4 } = require('ui-system/typography/text');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { StatusBlock } = require('ui-system/blocks/status-block');
	const { UnsupportedFeatureType } = require('tasks/unsupported-feature/src/type-enum');
	const { openQRAuth } = require('qrauth/utils');
	const { Loc } = require('loc');
	const { Icon } = require('ui-system/blocks/icon');

	class UnsupportedFeature extends PureComponent
	{
		constructor(props)
		{
			super(props);
			this.type = this.#resolveType(props.type);

			this.getTestId = createTestIdGenerator({
				prefix: this.type.getTestIdPrefix(),
				context: this,
			});
		}

		#resolveType(type)
		{
			if (!UnsupportedFeatureType.has(type))
			{
				throw new TypeError('UnsupportedFeature: invalid enum type');
			}

			return type;
		}

		render()
		{
			return Box(
				{
					testId: this.getTestId('box'),
					withScroll: false,
					safeArea: {
						bottom: true,
					},
				},
				StatusBlock({
					testId: this.getTestId(),
					image: this.#renderImage(),
					title: this.type.getTitle(),
					list: this.type.getItems(),
				}),
				this.#renderBottomBlock(),
			);
		}

		#renderImage()
		{
			const imageUri = this.type.getImageUri();

			if (!Type.isStringFilled(imageUri))
			{
				return null;
			}

			return Image({
				testId: this.getTestId('image'),
				uri: imageUri,
				resizeMode: 'contain',
				style: {
					marginTop: Indent.XL4.toNumber(),
					width: this.type.getImageWidth(),
					height: this.type.getImageHeight(),
					maxWidth: 265,
				},
			});
		}

		#renderBottomBlock()
		{
			return View(
				{
					testId: this.getTestId('bottom-block'),
					style: {
						width: '100%',
						paddingHorizontal: Indent.XL3.toNumber(),
						paddingBottom: Corner.XL2.toNumber(),
					},
				},
				this.#renderButton(),
				this.#renderFootnote(),
			);
		}


		#renderFootnote()
		{
			return Text4({
				testId: this.getTestId('footnote'),
				text: this.type.getFootnote(),
				color: Color.base4,
				style: {
					alignSelf: 'stretch',
					textAlign: 'center',
					marginTop: Indent.S.toNumber(),
					paddingTop: Indent.M.toNumber(),
				},
			});
		}

		#renderButton()
		{
			return Button({
				testId: this.getTestId('button'),
				text: this.type.getButtonText(),
				leftIcon: Icon.EARTH,
				size: ButtonSize.L,
				design: ButtonDesign.FILLED,
				stretched: true,
				onClick: () => openQRAuth({
					layout: this.props.layout,
					redirectUrl: this.type.getRedirectUrl(),
					showHint: true,
					title: this.type.getQrTitle(),
					analyticsSection: 'tasks',
				}),
			});
		}
	}

	module.exports = {
		UnsupportedFeature,
		UnsupportedFeatureType,
	};
});
