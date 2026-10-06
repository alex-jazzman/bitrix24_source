export type UnitTestsRunnerProps = {
	params: TestingRunnerParams,
};

export type UnitTestsRunnerState = {
	status: 'loading' | 'running' | 'result' | 'error',
	result: TestingRunnerResult | null,
	restarting: boolean,
};
