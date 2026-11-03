import { getStageTextColor } from 'crm.stage.color';

import {
	canOpenStageEditorFromEvent,
	createLazyStageEditorFactory,
	resolveDefaultStageName,
	resolveStageVisual as resolveStageVisualBase,
	StageEditorIntegration as BaseStageEditorIntegration,
	toStageEditorData,
} from './stage-editor-integration-controller';

export {
	canOpenStageEditorFromEvent,
	createLazyStageEditorFactory,
	resolveDefaultStageName,
	toStageEditorData,
};

export function resolveStageVisual(color, semantics, options = {})
{
	return resolveStageVisualBase(color, semantics, {
		...options,
		getTextColor: getStageTextColor,
	});
}

export class StageEditorIntegration extends BaseStageEditorIntegration
{
	constructor(options)
	{
		super(options);
	}
}
