import { reactive } from 'ui.vue3';

export type EditorAccessItem = [string, number | string];

export type EditorEntityType = {
	id: number;
	name: string;
};

export type EditorPlaceholderField = {
	id: string;
	name: string;
	typeId?: number;
	sort?: number;
};

export type EditorPlaceholderMap = {
	typeId: number;
	typeName: string;
	fields: EditorPlaceholderField[];
};

export type EditorSender = {
	value: string;
	label: string;
};

export type EditorFields = {
	title: string;
	entityTypeId: number;
	access: EditorAccessItem[];
	isActive: boolean;
	emailFrom: string;
	subject: string;
	bodyHtml: string;
	files: string[];
};

export type EditorEditableFields = Omit<EditorFields, 'bodyHtml' | 'files'>;
export type EditorContentSnapshot = Pick<EditorFields, 'bodyHtml' | 'files'>;

export type EditorFileState = {
	files: string[];
	pending: boolean;
	failed: boolean;
};

export type EditorInitialData = EditorFields & {
	id: number;
	ownerId: number;
	canEdit: boolean;
	entityTypes: EditorEntityType[];
	placeholderMaps: EditorPlaceholderMap[];
	senders: EditorSender[];
	canAddSender: boolean;
	copilotParams: Record<string, unknown>;
	paths: { list: string };
};

export type EditorError = {
	code: string;
	message: string;
	field?: keyof EditorFields;
};

export type EditorState = EditorInitialData & {
	ready: boolean;
	busy: boolean;
	uploadsPending: boolean;
	uploadsFailed: boolean;
	errors: EditorError[];
};

export type EditorStore = {
	state: EditorState;
	readonly canSave: boolean;
	setField<K extends keyof EditorEditableFields>(field: K, value: EditorEditableFields[K]): void;
	setReady(ready: boolean): void;
	setBusy(busy: boolean): void;
	setErrors(errors: EditorError[]): void;
	syncBody(bodyHtml: string): void;
	syncFiles(fileState: EditorFileState): void;
	syncSnapshot(snapshot: EditorContentSnapshot): void;
};

export function createEditorStore(initialData: EditorInitialData): EditorStore
{
	const state: EditorState = reactive({
		...initialData,
		access: initialData.access.map(([entityId, id]): EditorAccessItem => [entityId, id]),
		files: [...initialData.files],
		entityTypes: initialData.entityTypes.map((entityType) => ({ ...entityType })),
		placeholderMaps: initialData.placeholderMaps.map((map) => ({
			...map,
			fields: map.fields.map((field) => ({ ...field })),
		})),
		senders: initialData.senders.map((sender) => ({ ...sender })),
		copilotParams: { ...initialData.copilotParams },
		paths: { ...initialData.paths },
		ready: false,
		busy: false,
		uploadsPending: false,
		uploadsFailed: false,
		errors: [],
	});

	return {
		state,
		get canSave(): boolean
		{
			return state.canEdit && state.ready && !state.busy && !state.uploadsPending && !state.uploadsFailed;
		},
		setField<K extends keyof EditorEditableFields>(field: K, value: EditorEditableFields[K]): void
		{
			if (!state.canEdit || state.busy)
			{
				return;
			}

			if (field === 'access')
			{
				state.access = (value as EditorAccessItem[]).map(([entityId, id]) => [entityId, id]);
			}
			else
			{
				const editableFields: EditorEditableFields = state;
				editableFields[field] = value;
			}
		},
		setReady(ready: boolean): void
		{
			state.ready = ready;
		},
		setBusy(busy: boolean): void
		{
			state.busy = busy;
		},
		setErrors(errors: EditorError[]): void
		{
			state.errors = errors.map((error) => ({ ...error }));
		},
		syncBody(bodyHtml: string): void
		{
			if (state.canEdit)
			{
				state.bodyHtml = bodyHtml;
			}
		},
		syncFiles(fileState: EditorFileState): void
		{
			state.uploadsPending = fileState.pending;
			state.uploadsFailed = fileState.failed;
			if (state.canEdit)
			{
				state.files = [...fileState.files];
			}
		},
		syncSnapshot(snapshot: EditorContentSnapshot): void
		{
			if (state.canEdit)
			{
				state.bodyHtml = snapshot.bodyHtml;
				state.files = [...snapshot.files];
			}
		},
	};
}
