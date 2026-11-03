import type { StageEditorSavePayload, StageEditorStageData } from '../../model/stage-editor-model';
import { mapStageDtoToModelData, mapStagePayloadToDto } from './mappers';
import type { StageEditorDeleteHandler, StageEditorSaveHandler } from './types';

export class StageEditorService
{
	#onSave: StageEditorSaveHandler;
	#onDelete: StageEditorDeleteHandler;

	constructor(onSave: StageEditorSaveHandler, onDelete: StageEditorDeleteHandler)
	{
		this.#onSave = onSave;
		this.#onDelete = onDelete;
	}

	async save(payload: StageEditorSavePayload): Promise<StageEditorStageData>
	{
		const dto = await this.#onSave(mapStagePayloadToDto(payload));

		return mapStageDtoToModelData(dto);
	}

	async delete(stage: StageEditorStageData): Promise<void>
	{
		await this.#onDelete(mapStageDtoToModelData(stage));
	}
}
