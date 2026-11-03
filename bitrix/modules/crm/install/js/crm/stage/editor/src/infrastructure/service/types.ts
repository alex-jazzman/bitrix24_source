import type { StageEditorSavePayload, StageEditorStageData } from '../../model/stage-editor-model';

export type StageEditorSaveHandler = (payload: StageEditorSavePayload) => Promise<StageEditorStageData>;
export type StageEditorDeleteHandler = (stage: StageEditorStageData) => Promise<void>;
