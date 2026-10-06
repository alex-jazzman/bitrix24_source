export type FeatureCodeType =
	'aiAssistant' | 'complexNodeConnections' | 'debugBar' | 'dataTables' | 'externalAiAgent' | 'expressionBuilder' | 'readableExpressions' | 'lastRunValues' | 'versionHistory' | 'pilotPublication'
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
	pilotPublication: 'pilotPublication',
});
