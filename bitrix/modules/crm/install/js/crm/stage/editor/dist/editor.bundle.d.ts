/* eslint-disable */
type StageEditorOptions = {
	stage: StageEditorStageData;
	mode: 'create' | 'edit';
	anchor: HTMLElement;
	canEdit?: boolean;
	canDelete: boolean;
	deleteBlockReasons: string[];
	onSave: (payload: StageEditorSavePayload) => Promise<StageEditorStageData>;
	onDelete: (stage: StageEditorStageData) => Promise<void>;
	onCancel: (snapshot: StageEditorStageData) => void;
	onChange?: (payload: StageEditorSavePayload, field: StageEditorChangedField) => void;
	entityTextContext?: BX.Crm.Stage.EntityTextContext;
};

type StageEditorStageData = {
	id?: string | number | null;
	statusId?: string | null;
	entityId?: string | null;
	name?: string | null;
	sort?: number | string | null;
	color?: string | null;
	semantics?: string | null;
	categoryId?: number | string | null;
	description?: string | null;
	type?: string | null;
	TYPE?: string | null;
	[key: string]: unknown;
};

type StageEditorSavePayload = StageEditorStageData & {
	name: string;
	color: string;
	description: string;
};

type StageEditorChangedField = 'name' | 'color' | 'description';

declare namespace BX.Crm.Stage {
	class StageEditor {
		static open(options: StageEditorOptions): StageEditor;
		constructor(options: StageEditorOptions);
		open(): void;
		close(): void;
	}
}
