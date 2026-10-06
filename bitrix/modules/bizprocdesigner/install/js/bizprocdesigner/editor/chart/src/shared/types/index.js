// The constants module, not the entities/blocks barrel: the barrel also re-exports UI that
// imports back into shared, so going through it closes an import cycle.
import { TEMPLATE_PUBLISH_STATUSES } from '../../entities/blocks/constants';

import {
	SHARED_TOAST_TYPES,
	TEMPLATE_DATA_TEMPLATE_SOURCE_TYPE,
} from '../constants';

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

export type PortTypes = 'input' | 'output' | 'aux' | 'topAux' | 'inputRelation' | 'outputRelation';

export type Port = {
	id: PortId;
	position: number;
	type: PortTypes;
	title?: string;
	isActive?: boolean;
}

export type BlockNode = {
	title: string;
	type: string;
	icon: string;
	colorIndex: number;
	contentBlockColor?: ?number;
	shouldShowAuxPorts?: boolean;
	relationsAvailable?: ?boolean;
	// server-owned marker of the settings panel serving the node; an absent value reads as false
	servedByUnifiedPanel?: boolean;
	// per-subaction (construction.id) list of auto-filled field codes. UI-only marker,
	// no runtime semantics; an absent key means all values are manual.
	autoFilledFields?: { [constructionId: string]: Array<string> };
};

export type BlockType = 'simple' | 'trigger' | 'complex' | 'frame' | 'tool' | 'services' | 'operators';

export type ConnectionType = 'aux';

export type Block = {
	id: BlockId;
	type: BlockType;
	position: BlockPosition;
	dimensions: BlockDimensions;
	ports: Array<Port>;
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

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// Read-model of the pilot version of the template. It comes with the diagram data and never goes
// back to the server.
export type PilotState = {
	hasPilot: boolean,
	pilotId: ?number,
	isCanvasPilot: boolean,
	publishedBy: ?number,
	publishedByName: ?string,
	publishedAt: ?string,
	audienceCount: ?number,
	hasCommonVersion: boolean,
	settingsFrozen: boolean,
};

// The scheme as it travels to the server - the draft save and both publications alike. It lists exactly
// what the diagramData getter puts together, so the state of the editor has no way into a request: the
// state of the pilot lives beside this type and not inside it.
export type DiagramData = {
	templateId: number,
	draftId: number,
	documentType: Array,
	documentTypeSigned: string,
	companyName: string,
	template: DiagramTemplate;
	blocks: Array<Block>,
	connections: Array<Connection>,
	// getter derived from saveStatus: it is part of the draft payload, not of the store state
	isOnline?: boolean,
	blockCurrentTimestamps: TimestampMap,
	blockSavedTimestamps: TimestampMap,
	connectionCurrentTimestamps: TimestampMap,
	connectionSavedTimestamps: TimestampMap,
};

// The state of the diagram store: the scheme plus what belongs to the editor alone - the save status,
// the right to publish, the mode of the publication and the read-model of the pilot. None of it is part
// of a request.
export type DiagramState = DiagramData & {
	canPublish?: boolean,
	saveStatus: SaveStatus,
	// last successful save in milliseconds, the same base as Date.now(); null when nothing is saved yet
	lastSavedAt: ?number,
	templatePublishStatus: TEMPLATE_PUBLISH_STATUSES,
	pilot?: PilotState,
	isPilotFeatureAvailable?: boolean,
	// one warning per disappearance of the pilot, so a repeated refusal stays silent
	isPilotGoneReported?: boolean,
};

export type DiagramTemplate = {
	NAME: string,
	DESCRIPTION: string,
	MODULE_ID: string,
	ENTITY: string,
	DOCUMENT_TYPE: string,
	PARAMETERS?: any,
	VARIABLES?: any,
	CONSTANTS?: DiagramTemplateGeneralData,
};

export type DiagramTemplateGeneralData = {
	[String]: {
		Name: string,
		Default: any,
		Description: string,
		Multiple: number,
		Type: string,
		Required: number,
		Options: Array,
	},
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
	ContentBlock: ContentBlock;
}

export type ContentBlock = {
	text: string;
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

export type DiagramGraphPublication = {
	blocks: Array<Block>,
	connections: Array<Connection>,
	blockCurrentTimestamps: TimestampMap,
	connectionCurrentTimestamps: TimestampMap,
};

export type ToastMessage = {
	message: string,
	type: ToastType;
	colorScheme?: string;
};

export type CustomToastType = string;

export type ToastType = $Values<SHARED_TOAST_TYPES> | CustomToastType;

export type BufferContentType = 'block' | 'selection';

export type BufferContent = {
	type: BufferContentType,
	content: Block,
};

export type DocumentField = {
	fieldKey: string,
	name: string,
	type: string,
	multiple: boolean,
	required: boolean,
	options: { [string]: string },
	property: { [string]: mixed },
};

export type EntitySelectorItem = {
	title?: string,
	customData?: {
		fieldKey?: string,
		field?: {
			type?: string,
			multiple?: boolean,
			required?: boolean,
			options?: { [string]: string },
		},
		property?: { [string]: mixed },
	},
};

export type SettingsControls = {
	brokenLinks: { [key: string]: string };
	controls: Array;
	useDocumentContext: boolean;
}

export type BlockFrameTextAlign = 'none' | 'top' | 'bottom' | 'left' | 'right';

export type DiagramStore = DiagramState & {
	template: DiagramTemplate;
	blocks: Array<Block>;
	connections: Array<Connection>;
	getInputConnections: (block: Block) => Array<Connection>;
};

export type TemplateDataItem = {
	id: string;
	name: string;
	computeValue: string;
	type: string;
};

export type TemplateDataGeneralGroup = {
	items: Array<TemplateDataItem>;
}

export type TemplateDataNodeGroup = TemplateDataGeneralGroup & {
	nodeId: BlockId,
	icon: ?string,
	name: string,
};

export type TemplateDataTemplateGroup = TemplateDataGeneralGroup & {
	type: $Values<typeof TEMPLATE_DATA_TEMPLATE_SOURCE_TYPE>;
};
