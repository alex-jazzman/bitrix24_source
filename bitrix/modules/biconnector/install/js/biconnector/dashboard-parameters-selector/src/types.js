export type ParameterSelectorParams = {
	groups: number[],
	scopes: string[],
	params: string[],
	paramList: { [paramCode: string]: Parameter },
	activeUrlParamsSelector: boolean,
	isNewDashboard: boolean,
	isAllowedClearGroups: boolean,
	requiredParamList: ?{ [paramCode: string]: string },
	isNew: boolean,
};

export type Parameter = {
	code: string,
	scope: string,
	title: string,
	description: string,
	superTitle: string,
};

export type CheckCompatibilityResult = {
	incompatibleParams: Parameter[],
	addedParameters: Parameter[],
}
