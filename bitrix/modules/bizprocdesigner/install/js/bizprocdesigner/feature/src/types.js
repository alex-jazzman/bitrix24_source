export type FeatureCodeType =
	'aiAssistant'
	| 'complexNodeConnections'
	| 'debugBar'
	| 'dataTables'
	| 'externalAiAgent'
	| 'expressionBuilder'
	| 'readableExpressions'
	| 'lastRunValues'
	| 'versionHistory'
	| 'templateEditLock'
	| 'pilotPublication'
	| 'templateNotes'
	| 'rulesSummary'
	| 'frameNodeSticking'
	| 'nodeFilter'
	| 'processData'
	| 'componentLibrary'
;

export const FeatureCode: Record<string, FeatureCodeType> = Object.freeze({
	aiAssistant: 'aiAssistant',
	complexNodeConnections: 'complexNodeConnections',
	debugBar: 'debugBar',
	dataTables: 'dataTables',
	externalAiAgent: 'externalAiAgent',
	expressionBuilder: 'expressionBuilder',
	readableExpressions: 'readableExpressions',
	lastRunValues: 'lastRunValues',
	versionHistory: 'versionHistory',
	templateEditLock: 'templateEditLock',
	pilotPublication: 'pilotPublication',
	templateNotes: 'templateNotes',
	rulesSummary: 'rulesSummary',
	frameNodeSticking: 'frameNodeSticking',
	nodeFilter: 'nodeFilter',
	processData: 'processData',
	componentLibrary: 'componentLibrary',
});
