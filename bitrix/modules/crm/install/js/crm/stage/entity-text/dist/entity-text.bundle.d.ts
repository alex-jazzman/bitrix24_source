/* eslint-disable */
type EntityTextContext = {
	entityTypeId?: number;
	entityTypeName?: string;
	entityTypeCaption?: string;
};

declare namespace BX.Crm.Stage {
	function getEntityMessageCodeCandidates(baseCode: string, context?: EntityTextContext): string[];

	function getEntityMessage(baseCode: string, context?: EntityTextContext, replacements?: Record<string, string>): string;
}
