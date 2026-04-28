import { Loc } from 'main.core';

export class NameService
{
	static copilotName(): string
	{
		return Loc.getMessage('COPILOT_NAME') || '';
	}

	static copilotNameReplacement(): Object
	{
		return {
			'#COPILOT_NAME#': this.copilotName(),
		};
	}
}
