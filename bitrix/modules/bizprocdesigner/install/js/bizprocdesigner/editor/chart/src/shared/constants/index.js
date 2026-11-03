import { type BlockType, type PortTypes } from '../types';

export const BLOCK_TYPES: { [string]: string } = Object.freeze({

	SIMPLE: 'simple',
	TRIGGER: 'trigger',
	COMPLEX: 'complex',
	TOOL: 'tool',
	FRAME: 'frame',
	SERVICES: 'services',
	OPERATORS: 'operators',
});

export const BLOCK_TYPES_WITHOUT_SETTINGS = [
	BLOCK_TYPES.FRAME,
];

export const DATA_VIEWS_ALLOWED_BLOCK_TYPES: Array<BlockType> = Object.freeze([
	BLOCK_TYPES.COMPLEX,
]);

export function isDataViewsAllowedBlockType(type: ?BlockType): boolean
{
	return DATA_VIEWS_ALLOWED_BLOCK_TYPES.includes(type);
}

/**
 * Whether a block of this type may keep rules of its own input ports. Port rules are a complex-node
 * capability: a node translated to the unified panel (a trigger or a base node) keeps its port set
 * fixed, so it must neither gain nor lose input ports here. One answer for the form that offers the
 * rules section and for the preview that decides whether a port may be removed, so the two parts of
 * the same panel cannot drift apart.
 */
export function isPortRulesAllowedBlockType(type: ?BlockType): boolean
{
	return type === BLOCK_TYPES.COMPLEX;
}

/**
 * When the server computes the construction whose value sources are being listed. Base settings of a
 * node and its condition are read before the workflow starts; its action and its filter belong to a
 * workflow that is already running.
 */
export const EVALUATION_STAGE: { [string]: string } = Object.freeze({
	BEFORE_WORKFLOW_START: 'beforeWorkflowStart',
	IN_STARTED_WORKFLOW: 'inStartedWorkflow',
});

// Template sources that exist before the workflow starts. The rules of a trigger are checked on a
// stub workflow (ApplyRulesChecker + TriggerStageWorkflowFactory): it is initialized with no
// parameters and no variables, so {=Template:} and {=Variable:} resolve to an empty value there,
// while constants are read through the template id that stub workflow carries.
const TEMPLATE_SOURCES_BEFORE_WORKFLOW_START = new Set(['CONSTANTS']);

/**
 * Whether the template source (`PARAMETERS`, `VARIABLES`, `CONSTANTS`) may be offered for a
 * construction of a block of this type. One answer for every source list of a node — the field
 * selector of its condition and the value selector its base settings, action fields and filters
 * open — so what the parts of the same node offer cannot drift apart.
 *
 * Only a trigger loses sources, and only where the server reads the construction before the start:
 * its base settings (the Properties the rule check initializes the trigger from) and its condition
 * (evaluated on the same stub workflow). The action of a trigger runs after it fired and the results
 * of its filter are published onto the activity of a running workflow, so there parameters and
 * variables do exist and the full list stays available.
 *
 * The stage a caller left out is taken for «before the start»: an unknown construction gets the
 * narrower list, which is the safer of the two errors — what it hides stays writable by hand and
 * keeps working where it is already saved, while offering a source the trigger resolves to nothing
 * would build a setting that silently reads an empty value.
 */
export function isTemplateSourceAvailableForBlockType(
	type: ?BlockType,
	sourceKey: string,
	stage: string = EVALUATION_STAGE.BEFORE_WORKFLOW_START,
): boolean
{
	if (type !== BLOCK_TYPES.TRIGGER || stage === EVALUATION_STAGE.IN_STARTED_WORKFLOW)
	{
		return true;
	}

	return TEMPLATE_SOURCES_BEFORE_WORKFLOW_START.has(sourceKey);
}

export const PORT_TYPES: Record<string, PortTypes> = Object.freeze({
	input: 'input',
	output: 'output',
	aux: 'aux',
	topAux: 'topAux',
	inputRelation: 'inputRelation',
	outputRelation: 'outputRelation',
});

// Type the panel gives the current-rule descriptor of the rules container of a node without input
// ports (the transport keys that container by PORTLESS_RULES_KEY). Deliberately outside PORT_TYPES:
// consumers branching on a port type must not take the container for a port of the node.
export const PORTLESS_RULE_TYPE = 'portless';

export const ACTIVATION_STATUS = Object.freeze({
	ACTIVE: 'Y',
	INACTIVE: 'N',
});

export const PROPERTY_TYPES: { [string]: string } = Object.freeze({
	DOCUMENT: 'document',
});

export const RELATION_PACKAGE_SETTINGS_KEY = 'relationPackage';

export const RELATION_PACKAGE_ROLES: { [string]: string } = Object.freeze({
	SOURCE_DOCUMENT: 'sourceDocument',
	TARGET_FIELD: 'targetField',
});

// Own entity-selector entity of the designer instead of the base bizproc one: it answers with the
// same document fields plus what the contributors of this module add. Not registered through an
// entity-selector config.php, so every dialog has to state `dynamicLoad` itself.
export const DOCUMENT_FIELDS_ENTITY_ID = 'bizprocdesigner-document';

export const SHARED_TOAST_TYPES = Object.freeze({
	WARNING: 'warning',
});

export const COMPLEX_NODE_PORT_LABELS: { [string]: string } = Object.freeze({
	inputRule: 'G',
	outputRule: 'E',
	relation: 'NG',
	aux: 'T',
});

export const MAX_AUX_COUNT = 5;

export const BX_FLAG_YES = 'Y';
export const BX_FLAG_NO = 'N';

export const TITLE_FIELD_NAME = 'title';

export const TEMPLATE_DATA_TEMPLATE_SOURCE_TYPE = Object.freeze({
	CONSTANT: 'template_constant',
	VARIABLE: 'template_variable',
});

export const TEMPLATE_DEFAULT_DATA_TYPE = 'string';

export const COMPUTE_VALUE_PREFIXES: Record<string, string> = Object.freeze({
	CONSTANT: 'Constant',
	VARIABLE: 'Variable',
});

export const NODE_SETTINGS_TABS = Object.freeze({
	basic: 'basic',
	rules: 'rules',
});

/** The only way into the process data window: the menu item and the publication error handler emit it (EVENT-01). */
export const PROCESS_DATA_EVENTS = Object.freeze({
	OPEN: 'BizprocDesigner.ProcessData.Open',
});

/** The only way into the library window: the menu items of the editor emit it. */
export const FRAGMENT_LIBRARY_EVENTS = Object.freeze({
	OPEN: 'BizprocDesigner.FragmentLibrary.Open',
	// A selection on its way into the library. The menu of a group selection reaches the dialog through
	// the widget it belongs to; the menu of a single node is built by the mediator, which has no such
	// widget above it, so the two entry points meet at this event instead.
	SAVE: 'BizprocDesigner.FragmentLibrary.Save',
});
