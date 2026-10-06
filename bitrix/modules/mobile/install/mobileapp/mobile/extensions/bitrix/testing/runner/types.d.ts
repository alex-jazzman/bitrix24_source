export type TestingRunnerParams = {
	groupId: string,
	groupType: 'module' | 'feature' | 'basic',
	title: string,
	extensionNames: string[],
};

export type TestingRunnerLoadError = {
	extensionName: string,
	message: string,
};

export type TestingRunnerExecutionError = {
	suiteName: string,
	message: string,
};

export type TestingRunnerResult = {
	state: 'result' | 'error',
	report: TestingReport,
	loadErrors: TestingRunnerLoadError[],
	executionErrors: TestingRunnerExecutionError[],
	fatalError: { message: string } | null,
	success: boolean,
};

export type TestingRunnerOptions = {
	importer?: (extensionName: string) => Promise<void>,
	testingProvider?: () => { testSuites: TestSuite[], report: TestingReport },
};

export type TestingRunnerStateChangeHandler = (
	state: 'loading' | 'running' | 'result' | 'error',
	result?: TestingRunnerResult,
) => void;
