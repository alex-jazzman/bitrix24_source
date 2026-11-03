/**
 * @module settings-v2/ui/items/src/appearance-bundle-switch
 */
jn.define('settings-v2/ui/items/src/appearance-bundle-switch', (require, exports, module) => {
	const { createTestIdGenerator } = require('utils/test');
	const { Card, CardDesign } = require('ui-system/layout/card');
	const { CardList } = require('ui-system/layout/card-list');
	const { Text4 } = require('ui-system/typography/text');
	const { Color, Indent, Component } = require('tokens');
	const { ChipButton, ChipButtonSize, ChipButtonDesign, ChipButtonMode } = require('ui-system/blocks/chips/chip-button');
	const { Ellipsize } = require('utils/enums/style');
	const { Loc } = require('loc');
	const { NativeAppearanceBundleService } = require('settings-v2/services/native');
	const { SettingEmitter } = require('settings-v2/emitter');
	const { EventType, SettingApplyStatus } = require('settings-v2/const');
	const { AppearanceAnalytics } = require('settings-v2/analytics');
	const { AppearanceBundleBackdrop } = require('settings-v2/ui/items/src/appearance-bundle-backdrop');

	const CARD_WIDTH = 148;
	const CARD_HEIGHT = 268;
	const CARD_PADDING = Indent.XL.toNumber();
	const CARD_BOTTOM_PADDING = Indent.XL3.toNumber();

	const LABEL_BACKDROP_STYLE = {
		borderRadius: 10,
		paddingVertical: 2,
		paddingHorizontal: 4,
		backgroundColor: '#03FFFFFF',
	};

	const PREVIEW_FILL_STYLE = {
		position: 'absolute',
		top: -CARD_PADDING,
		left: -CARD_PADDING,
		right: -CARD_PADDING,
		bottom: -CARD_BOTTOM_PADDING,
	};

	const LABEL_FILL_STYLE = {
		position: 'absolute',
		top: -CARD_PADDING,
		left: 0,
		right: 0,
		bottom: -CARD_BOTTOM_PADDING,
		alignItems: 'center',
		justifyContent: 'center',
	};

	/**
	 * @param {Object} optionData
	 * @param {string} bundleId
	 * @return {string}
	 */
	const getAppearanceBundleLabel = (optionData, bundleId) => optionData?.[bundleId]?.label || bundleId;

	/**
	 * @param {Object} optionData
	 * @param {string} bundleId
	 * @return {string|null}
	 */
	const getAppearanceBundlePreview = (optionData, bundleId) => optionData?.[bundleId]?.preview || null;

	class AppearanceBundleSwitchItem extends LayoutComponent
	{
		/**
		 * @param {ItemProps} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: 'settings-appearance-bundle-item',
				context: this,
			});

			this.state = {
				selectedBundle: props.value,
				isLoading: true,
			};

			this.options = [];
			this.optionData = {};
		}

		componentDidMount()
		{
			void this.loadOptions();
		}

		async loadOptions()
		{
			try
			{
				const { options, optionData } = await NativeAppearanceBundleService.getCatalog();

				this.options = options;
				this.optionData = optionData;
			}
			catch (e)
			{
				console.error(e);

				this.options = [];
				this.optionData = {};
			}

			this.setState({
				isLoading: false,
			});
		}

		render()
		{
			if (!this.state.isLoading && this.options.length === 0)
			{
				return null;
			}

			return View(
				{},
				this.state.isLoading ? this.renderLoader() : this.renderList(),
			);
		}

		renderLoader()
		{
			return Loader({
				testId: this.getTestId('loader'),
				animating: true,
				size: 'small',
				tintColor: Color.base3,
				style: {
					width: 50,
					height: CARD_HEIGHT,
					alignSelf: 'center',
				},
			});
		}

		renderList()
		{
			return CardList(
				{
					testId: this.getTestId('list'),
					horizontal: true,
					withScroll: true,
					divided: false,
					showsHorizontalScrollIndicator: false,
					style: {
						height: CARD_HEIGHT,
					},
				},
				...this.options.map((bundleId, index) => this.renderBundleCard(bundleId, index)),
			);
		}

		renderBundleCard(bundleId, index)
		{
			const selected = this.state.selectedBundle === bundleId;

			return Card(
				{
					testId: this.getTestId(`bundle-card-${bundleId}`),
					design: CardDesign.PRIMARY,
					onClick: () => this.openBackdrop(bundleId),
					style: {
						alignItems: 'center',
						borderRadius: Component.cardCornerXL.toNumber(),
						justifyContent: 'flex-end',
						width: CARD_WIDTH,
						flexShrink: 0,
						height: CARD_HEIGHT,
						overflow: 'hidden',
						marginLeft: index === 0 ? 0 : Component.cardListGap.toNumber(),
						paddingHorizontal: CARD_PADDING,
						paddingTop: CARD_PADDING,
						paddingBottom: CARD_BOTTOM_PADDING,
					},
				},
				this.renderPreview(bundleId),
				this.renderLabel(bundleId),
				this.renderApplyButton(bundleId, selected),
			);
		}

		renderLabel(bundleId)
		{
			return View(
				{
					style: LABEL_FILL_STYLE,
				},
				View(
					{
						testId: this.getTestId(`label-backdrop-${bundleId}`),
						style: LABEL_BACKDROP_STYLE,
					},
					Text4({
						accent: true,
						testId: this.getTestId(`label-${bundleId}`),
						text: getAppearanceBundleLabel(this.optionData, bundleId),
						color: Color.baseWhiteFixed,
						numberOfLines: 1,
						ellipsize: Ellipsize.END.toString(),
					}),
				),
			);
		}

		openBackdrop(bundleId)
		{
			void AppearanceBundleBackdrop.open({
				bundleId,
				title: getAppearanceBundleLabel(this.optionData, bundleId),
				bundleData: this.optionData[bundleId],
				selected: this.state.selectedBundle === bundleId,
				onApply: () => this.onChange(bundleId),
			});
		}

		renderApplyButton(bundleId, selected)
		{
			return ChipButton({
				testId: this.getTestId(`apply-button-${bundleId}`),
				text: selected
					? Loc.getMessage('SETTINGS_V2_STRUCTURE_UI_ITEMS_APPEARANCE_BUNDLE_APPLIED')
					: Loc.getMessage('SETTINGS_V2_STRUCTURE_UI_ITEMS_APPEARANCE_BUNDLE_APPLY'),
				size: ChipButtonSize.S,
				design: selected ? ChipButtonDesign.SUCCESS : ChipButtonDesign.BLACK,
				mode: selected ? ChipButtonMode.SOLID : ChipButtonMode.OUTLINE,
				onClick: () => this.onChange(bundleId),
			});
		}

		renderPreview(bundleId)
		{
			const preview = getAppearanceBundlePreview(this.optionData, bundleId);

			if (!preview)
			{
				return View({
					testId: this.getTestId(`preview-placeholder-${bundleId}`),
					style: {
						...PREVIEW_FILL_STYLE,
						backgroundColor: Color.base6.toHex(),
					},
				});
			}

			return Image({
				testId: this.getTestId(`preview-${bundleId}`),
				named: preview,
				resizeMode: 'cover',
				style: PREVIEW_FILL_STYLE,
			});
		}

		onChange = (bundleId) => {
			if (this.state.selectedBundle === bundleId)
			{
				return;
			}

			this.setState({
				selectedBundle: bundleId,
			}, () => {
				void this.applyBundle(bundleId);

				SettingEmitter.emit(EventType.changeAppearanceBundle, bundleId);
			});
		};

		/**
		 * @param {string} bundleId
		 * @return {Promise<void>}
		 */
		async applyBundle(bundleId)
		{
			const { id, controller, onChange } = this.props;

			if (!onChange)
			{
				return;
			}

			const { status, value } = await onChange(id, controller, bundleId) ?? {};

			if (status !== SettingApplyStatus.SUCCESS && status !== SettingApplyStatus.ERROR)
			{
				return;
			}

			AppearanceAnalytics.sendApplyBundle({
				bundleId: value,
				status,
			});
		}
	}

	module.exports = {
		AppearanceBundleSwitchItem,
		getAppearanceBundleLabel,
		getAppearanceBundlePreview,
	};
});
