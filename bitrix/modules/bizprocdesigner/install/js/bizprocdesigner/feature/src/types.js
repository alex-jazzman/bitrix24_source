export type FeatureCodeType =
	'aiAssistant' | 'complexNodeConnections'
;

export const FeatureCode: Record<string, FeatureCodeType> = Object.freeze({
	aiAssistant: 'aiAssistant',
	complexNodeConnections: 'complexNodeConnections',
});
