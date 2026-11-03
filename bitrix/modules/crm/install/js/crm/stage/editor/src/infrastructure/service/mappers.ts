import { Type } from 'main.core';
import { normalizeStageColor } from 'crm.stage.color';

import type { StageEditorSavePayload, StageEditorStageData } from '../../model/stage-editor-model';

export function mapStageDtoToModelData(dto: StageEditorStageData): StageEditorStageData
{
	return {
		...dto,
		color: normalizeStageColor(dto.color),
		description: Type.isString(dto.description) ? dto.description : '',
	};
}

export function mapStagePayloadToDto(payload: StageEditorSavePayload): StageEditorSavePayload
{
	return {
		...payload,
		color: normalizeStageColor(payload.color),
		description: Type.isString(payload.description) ? payload.description : '',
		name: Type.isString(payload.name) ? payload.name.trim() : '',
	};
}
