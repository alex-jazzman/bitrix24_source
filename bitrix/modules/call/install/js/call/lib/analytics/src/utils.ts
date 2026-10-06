import { Extension } from 'main.core';

import { AnalyticsTool } from './const';

const PRESET_TOOL_MAP: Record<string, string> = {
	sync: AnalyticsTool.sync,
};

export function getCallTool(): string
{
	const presetCode = Extension.getSettings('call.core')?.activePresetCode ?? '';

	return PRESET_TOOL_MAP[presetCode] ?? AnalyticsTool.im;
}
