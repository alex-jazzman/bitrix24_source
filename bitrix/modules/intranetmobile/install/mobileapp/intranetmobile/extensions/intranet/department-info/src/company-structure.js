/**
 * @module intranet/department-info/src/company-structure
 */
jn.define('intranet/department-info/src/company-structure', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { Avatar } = require('ui-system/blocks/avatar');
	const { Color, Indent } = require('tokens');
	const { Text4 } = require('ui-system/typography/text');
	const { createTestIdGenerator } = require('utils/test');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { DepartmentCard } = require('ui-system/blocks/department-card');
	const { Loc } = require('loc');
	const { renderSkeleton } = require('intranet/department-info/src/skeleton');

	/**
	 * @typedef {Object} CompanyStructureProps
	 * @property {string} testId
	 * @property {Array} departments
	 * @property {Array} heads
	 * @property {Array} employeeCounts
	 * @property {boolean} pending
	 * @property {Object} containerStyle
	 * @property {boolean} [chevron = true]

	 * @class CompanyStructure
	 */
	class CompanyStructure extends PureComponent
	{
		constructor(props)
		{
			super(props);
			this.getTestId = createTestIdGenerator({
				context: this,
			});
		}

		get chevron()
		{
			return this.props.chevron ?? false;
		}

		render()
		{
			const { containerStyle = {}, pending } = this.props;

			const renderedDepartments = this.#getDepartmentsWithoutCompany().map(
				(department, index) => this.#renderDepartment(department, index),
			);

			if (pending)
			{
				return renderSkeleton();
			}

			return View(
				{
					style: containerStyle,
				},
				this.#renderCompany(),
				...renderedDepartments,
			);
		}

		#getDepartmentsWithoutCompany()
		{
			return this.props.departments.slice(1);
		}

		#renderCompany()
		{
			const { departments } = this.props;
			const company = departments[0];

			return View(
				{
					testId: this.getTestId('company'),
					style: {
						marginBottom: Indent.XL.toNumber(),
					},
				},
				View(
					{
						style: {
							flexDirection: 'row',
							alignItems: 'center',
						},
					},
					Avatar({
						testId: this.getTestId('company-avatar'),
						icon: IconView({
							testId: this.getTestId('company-avatar-icon'),
							size: 28,
							color: Color.baseWhiteFixed,
							icon: Icon.COMPANY,
						}),
						backgroundColor: Color.accentMainSuccess,
						style: {
							marginRight: Indent.L.toNumber(),
						},
					}),
					Text4({
						text: company?.name,
						color: Color.base2,
						numberOfLines: 2,
						ellipsize: 'end',
						accent: true,
						style: {
							flexShrink: 1,
						},
					}),
					this.chevron && this.#renderChevron(),
				),
			);
		}

		#renderDepartment = (department, index) => {
			const departmentsCount = this.#getDepartmentsWithoutCompany().length;
			const managers = this.#getDepartmentManagers(department.id);
			const employeesCountText = this.#getEmployeesCountText(department.id);

			return DepartmentCard({
				testId: this.getTestId(`department-card-${this.#getIndexForDepartmentCardTestId(index)}`),
				departmentName: department.name,
				employeeName: managers[0]?.fullName,
				employeePosition: managers[0]?.workPosition,
				employeeCounterValue: managers.length > 1 ? `+${managers.length - 1}` : undefined,
				employeeAvatarProps: {
					uri: managers[0]?.avatarSize100 ? encodeURI(managers[0]?.avatarSize100) : '',
				},
				employeesCountText,
				chevron: this.chevron,
				depth: index,
				accent: index === departmentsCount - 1,
			});
		};

		#getIndexForDepartmentCardTestId = (index) => {
			return this.#getDepartmentsWithoutCompany().length - index - 1;
		};

		#renderChevron()
		{
			return IconView({
				testId: this.getTestId('chevron-icon'),
				size: 20,
				color: Color.base2,
				icon: Icon.CHEVRON_TO_THE_RIGHT,
			});
		}

		#getDepartmentManagers = (departmentId) => {
			return this.props.heads[departmentId] ?? [];
		};

		#getEmployeesCountText = (departmentId) => {
			const employeeCount = this.props.employeeCounts[departmentId] ?? 0;

			return Loc.getMessagePlural(
				'DEPARTMENT_INFO_BOX_USERS_COUNT',
				employeeCount,
				{
					'#COUNT#': employeeCount,
				},
			);
		};
	}

	module.exports = {
		/**
		 * @param {CompanyStructureProps} props
		 * @returns {CompanyStructure}
		 */
		CompanyStructure: (props) => new CompanyStructure(props),
	};
});
