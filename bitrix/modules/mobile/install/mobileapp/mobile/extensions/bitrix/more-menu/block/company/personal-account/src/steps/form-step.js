/**
 * @module more-menu/block/company/personal-account/src/steps/form-step
 */
jn.define('more-menu/block/company/personal-account/src/steps/form-step', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Color, Indent } = require('tokens');
	const { Moment } = require('utils/date');
	const { createTestIdGenerator } = require('utils/test');
	const { Input } = require('ui-system/form/inputs/input');
	const { Text5 } = require('ui-system/typography/text');

	const MIN_YEAR = 2000;

	/**
	 * Form step: company selector (only when several companies) and, for salary,
	 * a single month+year period picker. The employee is derived from the chosen
	 * company mapping - there is no employee selector. The step is controlled: it
	 * renders only the fields and reports each change to the flow via `onChange`,
	 * which owns the values and computes submit validity.
	 *
	 * @class FormStep
	 */
	class FormStep extends LayoutComponent
	{
		/**
		 * @param {object} props
		 * @param {string} props.testId
		 * @param {boolean} props.needCompany
		 * @param {boolean} props.needPeriod
		 * @param {Array<{ companyId: number, title: string, employees: Array<{ id: number, code: string }> }>} props.companies
		 * @param {?number} props.companyId
		 * @param {?{ month: number, year: number }} props.period
		 * @param {function({ companyId?: number, employeeId?: number, period?: { month: number, year: number } }): void} props.onChange
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ prefix: props.testId });

			this.handleCompanyChange = this.handleCompanyChange.bind(this);
			this.openCompanyPicker = this.openCompanyPicker.bind(this);
			this.openPeriodPicker = this.openPeriodPicker.bind(this);
		}

		render()
		{
			return View(
				{
					testId: this.getTestId(),
					style: {
						width: '100%',
					},
				},
				this.#renderCompanyField(),
				this.#renderPeriodField(),
			);
		}

		#renderCompanyField()
		{
			const { needCompany } = this.props;

			if (!needCompany)
			{
				return null;
			}

			return this.#renderField({
				name: 'company',
				label: Loc.getMessage('MORE_MENU_COMPANY_PERSONAL_ACCOUNT_COMPANY_LABEL'),
				value: this.#getCompanyLabel(),
				onClick: this.openCompanyPicker,
			});
		}

		#renderPeriodField()
		{
			const { needPeriod, needCompany } = this.props;

			if (!needPeriod)
			{
				return null;
			}

			return this.#renderField({
				name: 'period',
				label: Loc.getMessage('MORE_MENU_COMPANY_PERSONAL_ACCOUNT_PERIOD_LABEL'),
				value: this.#getPeriodLabel(),
				onClick: this.openPeriodPicker,
				style: {
					marginTop: needCompany ? Indent.M.toNumber() : 0,
				},
			});
		}

		// The field title sits above the input (Text5 / base3), not inside it.
		#renderField({ name, label, value, onClick, style = {} })
		{
			return View(
				{
					testId: this.getTestId(`${name}-field`),
					style,
				},
				Text5({
					testId: this.getTestId(`${name}-label`),
					text: label,
					color: Color.base3,
				}),
				Input({
					testId: this.getTestId(name),
					value,
					readOnly: true,
					dropdown: true,
					onClick,
				}),
			);
		}

		handleCompanyChange(id)
		{
			const companyId = id ?? null;

			this.props.onChange({
				companyId,
				employeeId: this.#resolveEmployeeId(companyId),
			});
		}

		openCompanyPicker()
		{
			const { companies } = this.props;

			dialogs.showActionSheet({
				callback: (item) => {
					this.handleCompanyChange(Number(item.code));
				},
				items: companies.map((company) => ({
					title: company.title,
					code: company.companyId,
				})),
			});
		}

		openPeriodPicker()
		{
			dialogs.showDatePicker(
				{
					title: Loc.getMessage('MORE_MENU_COMPANY_PERSONAL_ACCOUNT_PERIOD_LABEL'),
					type: 'monthyear',
					dateFormat: 'LLLL Y',
					value: this.#getPeriodPickerValue(),
					minDate: new Date(MIN_YEAR, 0, 1).getTime(),
					maxDate: FormStep.#lastCompletedMonthEnd(),
				},
				(eventName, ms) => {
					if (eventName === 'onPick' && ms)
					{
						const date = new Date(ms);
						this.props.onChange({
							period: {
								month: date.getMonth() + 1,
								year: date.getFullYear(),
							},
						});
					}
				},
			);
		}

		#resolveEmployeeId(companyId)
		{
			const { companies } = this.props;
			const company = companies.find((item) => String(item.companyId) === String(companyId));

			return company?.employees?.[0]?.id ?? null;
		}

		#getCompanyLabel()
		{
			const { companies, companyId } = this.props;
			const company = companies.find((item) => String(item.companyId) === String(companyId));

			return company ? company.title : '';
		}

		#getPeriodLabel()
		{
			const { period } = this.props;

			if (!period)
			{
				return '';
			}

			const monthName = new Moment(period.year, period.month - 1, 1).format('LLLL');

			return Loc.getMessage('MORE_MENU_COMPANY_PERSONAL_ACCOUNT_PERIOD_VALUE', {
				'#MONTH#': monthName,
				'#YEAR#': period.year,
			});
		}

		#getPeriodPickerValue()
		{
			const { period } = this.props;

			if (!period)
			{
				return FormStep.#lastCompletedMonthEnd();
			}

			return new Date(period.year, period.month - 1, 1).getTime();
		}

		// Salary exists only for a finished month, so the picker is capped at the previous
		// month. Day 0 of the current month resolves to the last day of the previous one.
		static #lastCompletedMonthEnd()
		{
			const today = new Date();

			return new Date(today.getFullYear(), today.getMonth(), 0).getTime();
		}
	}

	module.exports = { FormStep };
});
