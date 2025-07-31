/**
 * @module intranet/department-info
 */
jn.define('intranet/department-info', (require, exports, module) => {
	const { Loc } = require('loc');
	const { BottomSheet } = require('bottom-sheet');
	const { Color, Indent } = require('tokens');
	const { Box } = require('ui-system/layout/box');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { createTestIdGenerator } = require('utils/test');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { getParentDepartments } = require('intranet/department-info/src/api');
	const { CompanyStructure } = require('intranet/department-info/src/company-structure');
	const { Area } = require('ui-system/layout/area');
	const { AreaList } = require('ui-system/layout/area-list');

	const boxDefaultHeight = 600;

	class DepartmentInfo extends LayoutComponent
	{
		constructor(props)
		{
			super(props);
			this.getTestId = createTestIdGenerator({
				context: this,
			});
			this.#initState(props);
		}

		#initState(props)
		{
			this.state = {
				pending: props.pending ?? true,
				departments: [],
				heads: [],
				employeeCounts: [],
			};
		}

		async componentDidMount()
		{
			const response = await getParentDepartments(this.props.departmentId);
			if (response.status === 'success')
			{
				const {
					departments = [],
					heads = [],
					employeeCounts = [],
				} = response.data;

				this.setState({
					pending: false,
					departments,
					heads,
					employeeCounts,
				});
			}
		}

		/**
		 * @param {Object} params
		 * @param {number} params.departmentId
		 * @param {string} params.title
		 * @param {Widget} params.parentWidget
		 * @param {number} params.height
		 * @param {function} params.onClose
		 * @param {function} params.onSelectButtonClick

		 * @returns {DepartmentInfo}
		 */
		static open({
			departmentId,
			title,
			parentWidget = PageManager,
			height = boxDefaultHeight,
			onClose,
			onSelectButtonClick,
		})
		{
			const instance = new DepartmentInfo({
				departmentId,
				onClose,
				onSelectButtonClick,
			});
			const bottomSheet = new BottomSheet({
				component: instance,
				titleParams: {
					type: 'dialog',
					text: title ?? Loc.getMessage('DEPARTMENT_INFO_BOX_TITLE'),
					largeMode: true,
				},
			});
			bottomSheet
				.setParentWidget(parentWidget)
				.setBackgroundColor(Color.bgSecondary.toHex())
				.setNavigationBarColor(Color.bgSecondary.toHex())
				.disableShowOnTop()
				.disableOnlyMediumPosition()
				.setMediumPositionHeight(height)
				.disableContentSwipe()
				.enableBounce()
				.enableSwipe()
				.disableHorizontalSwipe()
				.enableResizeContent()
				.enableAdoptHeightByKeyboard()
				.open()
				.then((layoutWidget) => {
					instance.setLayout(layoutWidget);
				})
				.catch(() => {});

			return instance;
		}

		render()
		{
			return Box(
				{
					footer: this.#renderButtons(),
					withScroll: true,
				},
				AreaList(
					{
						testId: this.getTestId('area-list'),
						withScroll: false,
					},
					Area(
						{
							isFirst: true,
							testId: this.getTestId('area'),
						},
						this.#renderStructure(),
					),
				),
			);
		}

		close()
		{
			this.layout?.close();
		}

		#renderStructure()
		{
			const { departments, heads, employeeCounts, pending } = this.state;

			return CompanyStructure({
				testId: this.getTestId('structure'),
				departments: this.#prepareDepartments(departments),
				heads,
				employeeCounts,
				pending,
				displayEmployeesCount: false,
				containerStyle: {
					marginBottom: Indent.XL.toNumber(),
				},
			});
		}

		#prepareDepartments(departments)
		{
			if (departments.length < 4)
			{
				return [departments[0], ...departments];
			}

			return departments;
		}

		#renderButtons()
		{
			const {
				showSelectButton = true,
				selectButtonText,
				onSelectButtonClick,
				departmentId,
			} = this.props;

			return BoxFooter(
				{
					safeArea: true,
					testId: this.getTestId('buttons'),
					style: {
						borderTopWidth: 1,
						borderTopColor: Color.bgSeparatorPrimary.toHex(),
					},
				},
				showSelectButton && Button(
					{
						testId: this.getTestId('select-button'),
						text: selectButtonText ?? Loc.getMessage('DEPARTMENT_INFO_BOX_SELECT_BUTTON_TEXT'),
						size: ButtonSize.L,
						design: ButtonDesign.PRIMARY,
						stretched: true,
						onClick: () => {
							onSelectButtonClick?.(departmentId);
						},
					},
				),
			);
		}

		setLayout(layout)
		{
			this.layout = layout;

			this.layout.on('onViewHidden', () => {
				this.props.onClose?.(this);
			});
		}
	}

	module.exports = {
		DepartmentInfo,
	};
});
