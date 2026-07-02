export type FeatureCodeType =
	'aiAssistant' | 'complexNodeConnections' | 'debugBar'
;

export const FeatureCode: Record<string, FeatureCodeType> = Object.freeze({
	aiAssistant: 'aiAssistant',
	complexNodeConnections: 'complexNodeConnections',
	debugBar: 'debugBar',
});
