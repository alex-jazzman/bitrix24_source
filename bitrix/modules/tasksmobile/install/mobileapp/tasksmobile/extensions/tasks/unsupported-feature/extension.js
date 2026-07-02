/**
 * @module tasks/unsupported-feature
 */
jn.define('tasks/unsupported-feature', (require, exports, module) => {
	const { Type } = require('type');
	const { createTestIdGenerator } = require('utils/test');
	const { PureComponent } = require('layout/pure-component');
	const { Color, Component, Corner, Indent } = require('tokens');
	const { Box } = require('ui-system/layout/box');
	const { Area } = require('ui-system/layout/area');
	const { H3 } = require('ui-system/typography/heading');
	const { Text2, Text4 } = require('ui-system/typography/text');
	const { IconView } = require('ui-system/blocks/icon');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
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
				Area(
					{
						testId: this.getTestId('area'),
						style: {
							flex: 1,
							alignItems: 'center',
						},
					},
					this.#renderImage(),
					this.#renderInfo(),
				),
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

		#renderInfo()
		{
			return View(
				{
					testId: this.getTestId('info'),
					style: {
						width: '100%',
						marginTop: Indent.XL2.toNumber(),
						paddingHorizontal: Component.paddingLrMore.toNumber(),
						alignItems: 'center',
					},
				},
				this.#renderTitle(),
				this.#renderList(),
			);
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

		#renderTitle()
		{
			const title = this.type.getTitle();

			if (!Type.isStringFilled(title))
			{
				return null;
			}

			return H3({
				testId: this.getTestId('title'),
				text: title,
				color: Color.base1,
				style: {
					alignSelf: 'stretch',
					textAlign: 'center',
				},
			});
		}

		#renderList()
		{
			const items = this.type.getItems();

			if (!Type.isArrayFilled(items))
			{
				return null;
			}

			return View(
				{
					testId: this.getTestId('list'),
					style: {
						width: '100%',
						marginTop: Indent.L.toNumber(),
						paddingTop: Indent.XL.toNumber(),
					},
				},
				...items.map((item, index) => this.#renderListItem(item, index)),
			);
		}

		#renderListItem(item, index)
		{
			return View(
				{
					testId: this.getTestId(`list-item-${index}`),
					style: {
						width: '100%',
						flexDirection: 'row',
						alignItems: 'flex-start',
						marginTop: index === 0 ? 0 : Indent.L.toNumber(),
					},
				},
				IconView({
					testId: this.getTestId(`list-item-${index}-icon`),
					icon: item.icon,
					size: 26,
					color: Color.accentMainPrimary,
					style: {
						marginRight: Indent.M.toNumber(),
					},
				}),
				Text2({
					testId: this.getTestId(`list-item-${index}-text`),
					text: item.text,
					color: Color.base2,
					style: {
						flexShrink: 1,
					},
				}),
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
