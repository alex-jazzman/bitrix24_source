/**
 * @module tasks/unsupported-feature
 */
jn.define('tasks/unsupported-feature', (require, exports, module) => {
	const { Type } = require('type');
	const { createTestIdGenerator } = require('utils/test');
	const { PureComponent } = require('layout/pure-component');
	const { Color, Indent } = require('tokens');
	const { ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { InfoScreen } = require('layout/ui/info-screen');
	const { TasksUnavailableFeaturePreset } = require('tasks/unsupported-feature/src/preset');
	const { openQRAuth } = require('qrauth/utils');
	const { Icon } = require('ui-system/blocks/icon');

	class TasksUnavailableFeature extends PureComponent
	{
		/**
		 * @param {TasksUnavailableFeatureProps} props
		 */
		constructor(props)
		{
			super(props);
			this.type = this.#resolveType(props.type);

			this.getTestId = createTestIdGenerator({
				prefix: this.type.getTestIdPrefix(),
				context: this,
			});
		}

		/**
		 * @param {TasksUnavailableFeaturePreset} type
		 * @returns {TasksUnavailableFeaturePreset}
		 */
		#resolveType(type)
		{
			if (!TasksUnavailableFeaturePreset.has(type))
			{
				throw new TypeError('TasksUnavailableFeature: invalid enum type');
			}

			return type;
		}

		render()
		{
			return InfoScreen({
				testId: this.getTestId(),
				testIds: {
					box: this.getTestId('box'),
					content: this.getTestId(),
					image: this.getTestId('image'),
					bottomBlock: this.getTestId('bottom-block'),
					footnote: this.getTestId('footnote'),
					primaryButton: this.getTestId('button'),
				},
				withScroll: false,
				safeArea: {
					bottom: true,
				},
				image: this.#getImage(),
				title: this.type.getTitle(),
				titleColor: Color.base1,
				description: this.type.getDescription(),
				descriptionColor: Color.base2,
				items: this.type.getItems(),
				footnote: this.type.getFootnote(),
				footnoteColor: Color.base4,
				bottomBlock: this.#shouldRenderBottomBlock(),
				primaryButton: this.#getPrimaryButton(),
			});
		}

		#getImage()
		{
			const imageUri = this.type.getImageUri();

			if (!Type.isStringFilled(imageUri))
			{
				return null;
			}

			return {
				uri: imageUri,
				resizeMode: 'contain',
				width: this.type.getImageWidth(),
				height: this.type.getImageHeight(),
				maxWidth: 265,
				style: {
					marginTop: Indent.XL4.toNumber(),
				},
			};
		}

		#shouldRenderBottomBlock()
		{
			return this.type.hasRedirectUrl() || this.type.hasFootnote();
		}

		#getPrimaryButton()
		{
			if (!this.type.hasRedirectUrl())
			{
				return null;
			}

			return {
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
			};
		}
	}

	const UnsupportedFeature = TasksUnavailableFeature;
	const UnsupportedFeaturePreset = TasksUnavailableFeaturePreset;

	module.exports = {
		TasksUnavailableFeature,
		TasksUnavailableFeaturePreset,
		UnsupportedFeature,
		UnsupportedFeaturePreset,
	};
});
