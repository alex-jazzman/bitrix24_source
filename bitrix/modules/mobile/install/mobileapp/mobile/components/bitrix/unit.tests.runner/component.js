(() => {
	const require = (ext) => jn.require(ext);
	const { ComponentHelper } = require('helpers/component');
	const { Loc } = require('loc');
	const { TestingRunner } = require('testing/runner');
	const { ConsolePrinter, JnLayoutPrinter } = require('testing');
	const { Color, Indent } = require('tokens');
	const { StatusBlock } = require('ui-system/blocks/status-block');
	const { Button, ButtonDesign } = require('ui-system/form/buttons/button');
	const { Box } = require('ui-system/layout/box');
	const { Text2, Text3 } = require('ui-system/typography/text');

	/**
	 * @extends {LayoutComponent<UnitTestsRunnerProps, UnitTestsRunnerState>}
	 */
	class UnitTestsRunnerDashboard extends LayoutComponent
	{
		/**
		 * @param {UnitTestsRunnerProps} props
		 */
		constructor(props)
		{
			super(props);

			this.runner = new TestingRunner();
			this.jnLayoutPrinter = new JnLayoutPrinter();
			this.consolePrinter = new ConsolePrinter();
			this.state = {
				status: 'loading',
				result: null,
				restarting: false,
			};
		}

		componentDidMount()
		{
			void this.#run();
		}

		render()
		{
			if (this.state.status === 'loading' || this.state.status === 'running')
			{
				return Box(
					{
						testId: 'unit-tests-runner',
						safeArea: { bottom: true },
					},
					StatusBlock({
						testId: `unit-tests-runner-${this.state.status}`,
						title: this.state.status === 'loading'
							? Loc.getMessage('MOBILE_UNIT_TESTS_RUNNER_LOADING')
							: Loc.getMessage('MOBILE_UNIT_TESTS_RUNNER_RUNNING'),
					}),
				);
			}

			return this.#renderResult();
		}

		#renderResult()
		{
			const { result } = this.state;
			const assertions = result.report.totalAssertions;
			const failures = result.report.totalFailures;
			const stats = failures === 0
				? `Assertions: ${assertions}`
				: `Assertions: ${assertions}, failures: ${failures}`;

			return Box(
				{
					testId: 'unit-tests-runner',
					withScroll: true,
					safeArea: { bottom: true },
				},
				View(
					{
						testId: 'unit-tests-runner-summary',
						style: {
							paddingHorizontal: Indent.XL.toNumber(),
							paddingTop: Indent.XL.toNumber(),
						},
					},
					Text2({
						testId: 'unit-tests-runner-status',
						text: result.success ? 'SUCCESS' : 'FAILURES',
						accent: true,
						color: result.success ? Color.accentMainSuccess : Color.accentMainAlert,
					}),
					Text3({
						testId: 'unit-tests-runner-statistics',
						text: stats,
						style: { marginTop: Indent.S.toNumber() },
					}),
					this.#renderErrors(),
					Button({
						testId: 'unit-tests-runner-repeat',
						text: Loc.getMessage('MOBILE_UNIT_TESTS_RUNNER_REPEAT'),
						design: ButtonDesign.OUTLINE,
						stretched: true,
						disabled: this.state.restarting,
						style: { marginTop: Indent.XL.toNumber() },
						onClick: () => this.#runAgain(),
					}),
				),
				this.jnLayoutPrinter.print(result.report),
			);
		}

		#renderErrors()
		{
			const { result } = this.state;
			const errors = [
				...result.loadErrors.map((error) => `${error.extensionName}: ${error.message}`),
				...result.executionErrors.map((error) => `${error.suiteName}: ${error.message}`),
				...(result.fatalError ? [result.fatalError.message] : []),
			];

			if (errors.length === 0)
			{
				return null;
			}

			return View(
				{
					testId: 'unit-tests-runner-errors',
					style: { marginTop: Indent.XL.toNumber() },
				},
				Text3({
					testId: 'unit-tests-runner-errors-title',
					text: Loc.getMessage('MOBILE_UNIT_TESTS_RUNNER_ERRORS'),
					accent: true,
					color: Color.accentMainAlert,
				}),
				...errors.map((error, index) => Text3({
					testId: `unit-tests-runner-error-${index}`,
					text: error,
					style: { marginTop: Indent.S.toNumber() },
				})),
			);
		}

		async #run()
		{
			const result = await this.runner.run(
				this.props.params,
				(status, currentResult) => this.setState({ status, result: currentResult ?? null }),
			);

			this.consolePrinter.print(result.report);
		}

		#runAgain()
		{
			this.setState({ restarting: true });

			layout.close(() => {
				ComponentHelper.openLayout({
					name: 'unit.tests.runner',
					canOpenInDefault: true,
					widgetParams: { title: this.props.params.title },
					componentParams: this.props.params,
				});
			});
		}
	}

	BX.onViewLoaded(() => {
		const params = {
			groupId: BX.componentParameters.get('groupId', ''),
			groupType: BX.componentParameters.get('groupType', 'basic'),
			title: BX.componentParameters.get('title', 'Unit tests'),
			extensionNames: BX.componentParameters.get('extensionNames', []),
		};

		layout.showComponent(new UnitTestsRunnerDashboard({ params }));
	});
})();
