/**
 * @module user-profile/common-tab/block/gratitude
 */
jn.define('user-profile/common-tab/block/gratitude', (require, exports, module) => {
	const { Indent, Color } = require('tokens');
	const { Text4, Text5, Text7 } = require('ui-system/typography/text');
	const { ElementsStack, ElementsStackDirection } = require('elements-stack');
	const { CircleStack } = require('utils/skeleton');
	const { makeLibraryImagePath } = require('asset-manager');
	const { GratitudeListManager } = require('layout/ui/gratitude-list');
	const { GratitudeIcon } = require('assets/icons');
	const { Loc } = require('loc');
	const { Type } = require('type');
	const { selectGratitudesByOwnerId } = require('statemanager/redux/slices/gratitude');
	const { connect } = require('statemanager/redux/connect');
	const { createTestIdGenerator } = require('utils/test');
	const { ProfileCard, ViewMode } = require('user-profile/common-tab/profile-card');

	const IMAGE_SIZE = 34;

	class Gratitude extends LayoutComponent
	{
		constructor(props)
		{
			super(props);
			this.getTestId = createTestIdGenerator({
				prefix: 'gratitude',
				context: this,
			});
		}

		get items()
		{
			return this.props.gratitudes ?? null;
		}

		get totalQuantity()
		{
			return this.props.gratitudeTotalCount ?? 0;
		}

		get quantityForPreview()
		{
			const HALF_WIDTH_QUANTITY = 4;
			const FULL_WIDTH_QUANTITY = 10;

			if (this.viewMode === ViewMode.HALF_WIDTH)
			{
				return HALF_WIDTH_QUANTITY;
			}

			return FULL_WIDTH_QUANTITY;
		}

		get badgePreview()
		{
			return this.items
				.slice(0, this.quantityForPreview)
				.map((badge) => {
					const badgeImage = GratitudeIcon.getSvgUriByName(badge.name);
					const testId = GratitudeIcon.getTestIdByName(badge.name);

					return {
						...badge,
						testId: testId ?? null,
						svgUri: badgeImage ?? null,
					};
				});
		}

		get viewMode()
		{
			if (this.props?.ownerId === Number(env.userId))
			{
				return ViewMode.HALF_WIDTH;
			}

			return ViewMode.FULL_WIDTH;
		}

		render()
		{
			return ProfileCard(
				{
					testId: this.getTestId('card'),
					viewMode: this.viewMode,
					title: Loc.getMessage('M_PROFILE_GRATITUDE_TITLE'),
					content: this.items ? this.renderContent() : null,
					shimmer: this.renderShimmer(),
					emptyState: (Type.isArrayFilled(this.items) || !this.items) ? null : this.renderEmptyState(),
					onClick: () => this.openGratitudeList(),
					style: {
						minHeight: 96,
					},
				},
			);
		}

		renderShimmer()
		{
			return View(
				{
					testId: this.getTestId('shimmer'),
				},
				CircleStack({ count: 4, size: 34, offsetRatio: 0.8 }),
			);
		}

		renderEmptyState()
		{
			const emptyStateUri = makeLibraryImagePath('gratitude.svg', 'empty-states');

			if (this.viewMode === ViewMode.HALF_WIDTH)
			{
				return this.renderSmallEmptyState(emptyStateUri);
			}

			return this.renderDefaultEmptyState(emptyStateUri);
		}

		renderSmallEmptyState(emptyStateUri)
		{
			return View(
				{
					style: {
						alignItems: 'center',
						justifyContent: 'flex-start',
					},
				},
				Image(
					{
						style: {
							width: 52,
							height: 52,
						},
						svg: {
							uri: emptyStateUri,
						},
					},
				),
				Text7({
					text: Loc.getMessage('M_PROFILE_GRATITUDE_EMPTY'),
					color: Color.base3,
					numberOfLines: 2,
					style: {
						textAlign: 'center',
					},
				}),
			);
		}

		renderDefaultEmptyState(emptyStateUri)
		{
			return View(
				{
					style: {
						alignItems: 'center',
						flexDirection: 'row',
						justifyContent: 'flex-start',
					},
				},
				Image(
					{
						style: {
							width: 64,
							height: 64,
						},
						svg: {
							uri: emptyStateUri,
						},
					},
				),
				Text4({
					text: Loc.getMessage('M_PROFILE_GRATITUDE_EMPTY'),
					color: Color.base3,
					style: {
						textAlign: 'left',
						marginLeft: Indent.XL2.toNumber(),
					},
				}),
			);
		}

		renderContent()
		{
			return View(
				{
					style: {
						testId: this.getTestId('content'),
						width: '100%',
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'space-between',
					},
				},
				this.renderElementsStack(),
				this.renderRemainingQuantity(),
			);
		}

		renderElementsStack()
		{
			const elements = this.getElements();

			return ElementsStack(
				{
					testId: this.getTestId('element-stack'),
					direction: ElementsStackDirection.RIGHT,
					offset: Indent.L.toNumber(),
					radius: null,
					indent: null,
				},
				...elements,
			);
		}

		renderRemainingQuantity()
		{
			const remainingGratitude = this.calculateRemainingGratitude();
			if (remainingGratitude <= 0)
			{
				return View({});
			}

			if (this.viewMode === ViewMode.HALF_WIDTH)
			{
				return View(
					{
						testId: this.getTestId('remaining-quantity'),
						style: {
							borderWidth: 1,
							borderRadius: 50,
							borderColor: Color.bgSeparatorPrimary.toHex(),
							marginLeft: 7,
							alignItems: 'center',
							justifyContent: 'center',
							width: IMAGE_SIZE,
							height: IMAGE_SIZE,
						},
					},
					Text5({
						testId: this.getTestId(`remaining-quantity-${remainingGratitude}`),
						color: Color.base4,
						text: `+${remainingGratitude}`,
					}),
				);
			}

			return Text4({
				testId: this.getTestId(`remaining-quantity-${remainingGratitude}`),
				color: Color.base4,
				text: Loc.getMessage('M_PROFILE_GRATITUDE_MORE_QUANTITY', {
					'#QUANTITY#': remainingGratitude,
				}),
				style: {
					alignSelf: 'flex-end',
				},
			});
		}

		calculateRemainingGratitude()
		{
			return Math.min(this.totalQuantity - this.quantityForPreview, 99);
		}

		getElements()
		{
			if (this.badgePreview)
			{
				return this.badgePreview?.map((badge) => {
					return View({
						testId: badge?.testId,
						style: {
							backgroundImageSvgUrl: badge?.svgUri,
							backgroundResizeMode: 'center',
							width: IMAGE_SIZE,
							height: IMAGE_SIZE,
						},
					});
				});
			}

			return [];
		}

		openGratitudeList()
		{
			const { parentLayout, ownerId } = this.props;

			return GratitudeListManager.openInComponentWithRedux({
				parentLayout,
				ownerId,
			});
		}
	}

	const mapStateToProps = (state, ownProps) => {
		const gratitudes = selectGratitudesByOwnerId(state, ownProps.ownerId);

		return {
			gratitudes,
		};
	};

	module.exports = {
		Gratitude: connect(mapStateToProps)(Gratitude),
		GratitudeClass: Gratitude,
	};
});
