/* eslint-disable */
declare namespace BX.Crm.Stage {
	function normalizeStageColor(color: unknown, fallback?: string): string;

	function getDefaultStageColor(): string;

	function getStageTextColor(color: unknown): '#000000' | '#ffffff';
}
