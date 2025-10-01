/**
 * @module user-profile/common-tab
 */
jn.define('user-profile/common-tab', (require, exports, module) => {
	const { Box } = require('ui-system/layout/box');
	const { AreaList } = require('ui-system/layout/area-list');
	const { Area } = require('ui-system/layout/area');
	const { createTestIdGenerator } = require('utils/test');
	const { Line } = require('utils/skeleton');
	const { Indent, Component, Color } = require('tokens');
	const { fetchTabData } = require('user-profile/api');
	const { ProfileBlockFactory } = require('user-profile/common-tab/src/block/factory');
	const { ScrollView } = require('layout/ui/scroll-view');

	/**
	 * @typedef {Object} CommonTabProps
	 * @property {number} ownerId
	 * @class CommonTab
	 */
	class CommonTab extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: 'common-tab',
				context: this,
			});
			this.#initState(props);
		}

		async componentDidMount()
		{
			const { ownerId } = this.props;

			const response = await fetchTabData({ ownerId });

			this.setState({
				pending: false,
				fullResponse: response,
			});
		}

		get blocks()
		{
			const { ownerId, parentWidget } = this.props;
			const { fullResponse } = this.state;

			if (!fullResponse || fullResponse.status === 'error')
			{
				return [];
			}

			const options = {
				...fullResponse.data,
				ownerId,
				parentWidget,
			};

			return ProfileBlockFactory.getAll(options);
		}

		render()
		{
			const {
				pending,
			} = this.state;

			if (pending)
			{
				return this.#renderSkeleton();
			}

			return ScrollView(
				{
					testId: this.getTestId('box'),
					safeArea: {
						bottom: true,
					},
					style: {
						flex: 1,
						backgroundColor: Color.bgContentSecondary.toHex(),
					},
				},
				View(
					{
						testId: this.getTestId('block-list-view'),
						style: {
							flexDirection: 'row',
							flexWrap: 'wrap',
							justifyContent: 'center',
							paddingBottom: Component.cardListGap.toNumber(),
						},
					},
					...this.blocks,
				),
			);
		}

		#initState = (props) => {
			const {
				pending = true,
				fullResponse = null,
			} = props;

			this.state = {
				pending,
				fullResponse,
			};
		};

		#renderSkeleton = () => {
			return Box(
				{
					testId: this.getTestId('box-skeleton'),
					safeArea: {
						bottom: true,
					},
				},
				AreaList(
					{
						testId: this.getTestId('area-list-skeleton'),
					},
					Area(
						{},
						View(
							{
								style: {
									paddingHorizontal: Component.paddingLr.toNumber(),
									alignItems: 'center',
								},
							},
							Line(190, 135, 24, Indent.XL3.toNumber(), 16),
							Line(260, 21, 13, 8, 8),
							Line(270, 16, 8, 0, 8),
							Line(250, 16, 8, 0, 8),
							Line(310, 16, 8, 0, 8),
							Line(230, 16, 8, 0, 8),
							Line(110, 18, 22, 0, 8),
						),
					),
				),
			);
		};
	}

	module.exports = {
		/**
		 * @param {CommonTabProps} props
		 * @returns {CommonTab}
		 */
		CommonTab: (props) => new CommonTab(props),
	};
});
