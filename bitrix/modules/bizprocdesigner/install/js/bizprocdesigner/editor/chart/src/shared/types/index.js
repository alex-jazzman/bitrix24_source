import { TEMPLATE_PUBLISH_STATUSES } from '../../entities/blocks';

// eslint-disable-next-line import/named
import { SHARED_TOAST_TYPES } from '../constants';

export type BlockId = string;

export type BlockPosition = {
	x: number;
	y: number;
};

export type BlockDimensions = {
	width: number;
	height: number;
};

export type PortId = string;

export type PortTypes = 'input' | 'output' | 'aux' | 'topAux';

export type Port = {
	id: PortId;
	position: number;
	type: PortTypes;
	title?: string;
}

export type Ports = {
	input: Array<Port>;
	output: Array<Port>;
	aux: Array<Port>;
	topAux: Array<Port>;
};

export type BlockNode = {
	title: string;
	type: string;
	icon: string;
	colorIndex: number;
};

export type BlockType = 'simple' | 'trigger' | 'complex' | 'frame';

export type ConnectionType = 'aux';

export type Block = {
	id: BlockId;
	type: BlockType;
	position: BlockPosition;
	dimensions: BlockDimensions;
	ports: Ports;
	node: BlockNode;
	activity: ActivityData;
};

export type ConnectionId = string;

export type Connection = {
	id: ConnectionId;
	sourceBlockId: BlockId;
	sourcePortId: PortId;
	targetBlockId: BlockId;
	targetPortId: PortId;
	type?: ConnectionType;
	createdAt: number,
};

export type DiagramData = {
	templateId: number,
	draftId: number,
	documentType: Array,
	documentTypeSigned: string,
	companyName: string,
	template: DiagramTemplate;
	blocks: Array<Block>,
	connections: Array<Connection>,
	isOnline: boolean,
	blockCurrentTimestamps: TimestampMap,
	blockSavedTimestamps: TimestampMap,
	connectionCurrentTimestamps: TimestampMap,
	connectionSavedTimestamps: TimestampMap,
	templatePublishStatus: TEMPLATE_PUBLISH_STATUSES,
};

export type DiagramTemplate = {
	NAME: string,
	DESCRIPTION: string,
	MODULE_ID: string,
	ENTITY: string,
	DOCUMENT_TYPE: string,
	PARAMETERS?: any,
	VARIABLES?: any,
	CONSTANTS?: any,
};

export type UpdateTemplateData = {
	templateId: number,
	data: DiagramTemplate
};

export type ActivityData = {
	Name: string;
	Type: string;
	PresetId: ?string;
	Properties: Object<{Title: string, ...}>;
	Activated: 'Y' | 'N';
	ReturnProperties: Array<ActivityProperty>;
	Document: BizprocExpression;
	Children?: Array<ActivityData>;
}

export type BizprocExpression = string;

export type ActivityProperty = {
	Id: string;
	Name: string;
	Type: string;
	Multiple: boolean;
	Default: any;
}

export type GetNodeSettingsControlsData = {
	activity: string;
	template: Object;
	activityName: string;
};

export type ItemType = 'delimiter' | 'title' | 'description' | 'constant';

export type ConstantItem = {
	itemType: ItemType;
	id: string;
	name: string;
	constantType: string;
	multiple: boolean;
	default: string;
	description: string;
	required: boolean;
	options: Record<string, string>;
};

export type TimestampMap = Record<string, number>;

export type ToastMessage = {
	message: string,
	type: ToastType;
};

export type CustomToastType = string;

export type ToastType = $Values<SHARED_TOAST_TYPES> | CustomToastType;

export type BufferContentType = 'block' | 'selection';

export type BufferContent = {
	type: BufferContentType,
	content: Block,
};

export type SettingsControls = {
	brokenLinks: { [key: string]: string };
	controls: Array;
	useDocumentContext: boolean;
}
