import { Loc, Extension } from 'main.core';
import { Spot } from './spot';

export class FlowCopilotAdvice extends Spot
{
	getWidth(): number
	{
		return 340;
	}

	getIconSrc(): ?string
	{
		return null;
	}

	getTitle(): string
	{
		return Loc.getMessage('TASKS_CLUE_FLASH_COPILOT_ADVICE_TITLE_MSGVER_1', {
			'#COPILOT_NAME#': Extension.getSettings('tasks.clue').copilotName,
		});
	}

	getText(): string
	{
		return Loc.getMessage('TASKS_CLUE_FLASH_COPILOT_ADVICE_TEXT');
	}

	getSpotlightColor(): ?string
	{
		return '#8e52ec';
	}

	getConditionColor(): string
	{
		return 'copilot';
	}
}
