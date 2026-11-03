/* eslint-disable */
type EditorOptions = {
	containerId: string;
	editorContainerId: string;
	formId: string;
	editorId: string;
	initialData: EditorInitialData;
};

type EditorInitialData = EditorFields & {
	id: number;
	ownerId: number;
	canEdit: boolean;
	entityTypes: EditorEntityType[];
	placeholderMaps: EditorPlaceholderMap[];
	senders: EditorSender[];
	canAddSender: boolean;
	copilotParams: Record<string, unknown>;
	paths: {
		list: string;
	};
};

type EditorFields = {
	title: string;
	entityTypeId: number;
	access: EditorAccessItem[];
	isActive: boolean;
	emailFrom: string;
	subject: string;
	bodyHtml: string;
	files: string[];
};

type EditorAccessItem = [string, number | string];

type EditorEntityType = {
	id: number;
	name: string;
};

type EditorPlaceholderMap = {
	typeId: number;
	typeName: string;
	fields: EditorPlaceholderField[];
};

type EditorPlaceholderField = {
	id: string;
	name: string;
	typeId?: number;
	sort?: number;
};

type EditorSender = {
	value: string;
	label: string;
};

declare namespace BX.Crm.MailTemplateEditor {
	class Editor {
		constructor(options: EditorOptions);
		start(): void;
		destroy(): void;
	}
}
