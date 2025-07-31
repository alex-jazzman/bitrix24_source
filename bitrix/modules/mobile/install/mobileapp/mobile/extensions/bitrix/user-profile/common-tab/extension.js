/**
 * @module user-profile/common-tab
 */
jn.define('user-profile/common-tab', (require, exports, module) => {
	const { Box } = require('ui-system/layout/box');
	const { AreaList } = require('ui-system/layout/area-list');
	const { Area } = require('ui-system/layout/area');
	const { createTestIdGenerator } = require('utils/test');
	const { usersUpserted } = require('statemanager/redux/slices/users');
	const { dispatch } = require('statemanager/redux/store');
	const { Line } = require('utils/skeleton');
	const { Indent, Component, Color } = require('tokens');
	const { gratitudesUpserted } = require('statemanager/redux/slices/gratitude');
	const { batchActions } = require('statemanager/redux/batched-actions');
	const { HeaderBlock } = require('user-profile/common-tab/block/header');
	const { Gratitude } = require('user-profile/common-tab/block/gratitude');
	const { UserStatus } = require('user-profile/common-tab/enum/user-status');
	const { fetchTabData } = require('user-profile/api');

	/**
	 * @typedef {Object} CommonTabProps
	 * @property {number} ownerId
	 * @property {string} [testId]
	 * @property {boolean} [pending]
	 * @property {string} [GMTString]
	 * @property {Date} [lastSeenDate]
	 * @property {string} [personalGender]
	 * @property {string} [onVacationDateTo]
	 * @property {string} [status]

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
			const {
				GMTString,
				lastSeenDate,
				personalGender,
				onVacationDateTo,
				status,
				gratitudeTotalCount,
			} = this.#prepareDataFromResponse(response);

			this.setState({
				pending: false,
				GMTString,
				lastSeenDate,
				personalGender,
				onVacationDateTo,
				status: UserStatus.getEnum(status),
				gratitudeTotalCount,
			});
		}

		render()
		{
			const { ownerId } = this.props;
			const {
				pending,
				GMTString,
				lastSeenDate,
				personalGender,
				onVacationDateTo,
				status,
				gratitudeTotalCount,
			} = this.state;

			if (pending)
			{
				return this.#renderSkeleton();
			}

			return Box(
				{
					testId: this.getTestId('box'),
					safeArea: {
						bottom: true,
					},
				},
				AreaList(
					{
						testId: this.getTestId('area-list'),
						style: {
							backgroundColor: Color.bgContentSecondary.toHex(),
						},
					},
					HeaderBlock({
						ownerId,
						GMTString,
						lastSeenDate,
						personalGender,
						onVacationDateTo,
						status,
					}),
					Area(
						{},
						View(
							{
								style: {
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'space-between',
								},
							},
							Gratitude({
								ownerId,
								gratitudeTotalCount,
							}),
							// TODO: Add Efficiency block here
						),
					),
				),
			);
		}

		#initState = (props) => {
			const {
				pending = true,
				GMTString = null,
				lastSeenDate = null,
				onVacationDateTo = null,
				status = '',
				gratitudeTotalCount = null,
				personalGender = null,
			} = props;

			this.state = {
				pending,
				GMTString,
				lastSeenDate,
				onVacationDateTo,
				status: UserStatus.getEnum(status),
				gratitudeTotalCount,
				personalGender,
			};
		};

		#prepareDataFromResponse(response)
		{
			if (response?.status === 'success')
			{
				const { user, gratitude, statusData = {} } = response.data;

				const actions = [
					gratitude?.items?.length > 0 && gratitudesUpserted(gratitude.items),
					user && usersUpserted([user]),
				].filter(Boolean);

				dispatch(batchActions(actions));

				return {
					...statusData,
					personalGender: user.personalGender,
					gratitudeTotalCount: gratitude?.totalCount,
				};
			}

			return {};
		}

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
