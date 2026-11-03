import { Loc, Type } from 'main.core';

import { FeatureCode } from 'bizprocdesigner.feature';

import { useFeature } from '../../shared/composables';
import { EVALUATION_STAGE, isTemplateSourceAvailableForBlockType } from '../../shared/constants';
import { type BlockType, type DiagramTemplate } from '../../shared/types';
import { diagramStore } from '../blocks/stores/diagram';
import { useProcessDataStore } from './stores/process-data-store';
import type { Mechanics, ProcessDataElement, ProcessDataProperty, Purpose } from './types';

export type ProcessDataSelectorEntry = {
	key: string;
	idKey: string;
	entityId: string;
	property: ProcessDataProperty;
};

export type ProcessDataSelectorGroup = {
	id: string;
	title: string;
	entries: ProcessDataSelectorEntry[];
};

type GroupSource = {
	idKey: string;
	entityId: string;
	sourceKey: string;
};

/** What the catalog is decided by: the diagram store itself, or whatever a selector was built on. */
type DiagramSource = {
	template: DiagramTemplate | null;
	templateId: number;
};

const PROCESS_DATA_MARKER = 'PROCESS_DATA';

const GLOBALS_ENTITY_ID = 'GLOBALS';

// A global value is read before the workflow starts, as a constant is, so it answers the `CONSTANTS` rule.
const GROUP_SOURCES: { [string]: GroupSource } = Object.freeze({
	Parameter: { idKey: 'Template', entityId: 'PARAMETERS', sourceKey: 'PARAMETERS' },
	Variable: { idKey: 'Variable', entityId: 'VARIABLES', sourceKey: 'VARIABLES' },
	Constant: { idKey: 'Constant', entityId: 'CONSTANTS', sourceKey: 'CONSTANTS' },
	GlobalVar: { idKey: 'GlobalVar', entityId: GLOBALS_ENTITY_ID, sourceKey: 'CONSTANTS' },
	GlobalConst: { idKey: 'GlobalConst', entityId: GLOBALS_ENTITY_ID, sourceKey: 'CONSTANTS' },
});

const TEMPLATE_GROUPS = Object.freeze([
	{ sourceKey: 'PARAMETERS', idKey: 'Template', titleKey: 'BIZPROCDESIGNER_SELECTOR_ITEM_PARAMETERS' },
	{ sourceKey: 'VARIABLES', idKey: 'Variable', titleKey: 'BIZPROCDESIGNER_SELECTOR_ITEM_VARIABLES' },
	{ sourceKey: 'CONSTANTS', idKey: 'Constant', titleKey: 'BIZPROCDESIGNER_SELECTOR_ITEM_CONSTANTS' },
]);

const PURPOSE_GROUPS: $ReadOnlyArray<{ purpose: Purpose, sourceKey: string }> = Object.freeze([
	{ purpose: 'input', sourceKey: 'PARAMETERS' },
	{ purpose: 'internal', sourceKey: 'VARIABLES' },
	{ purpose: 'constant', sourceKey: 'CONSTANTS' },
	{ purpose: 'shared', sourceKey: 'CONSTANTS' },
]);

type AvailabilityCheck = (sourceKey: string) => boolean;

export function buildProcessDataGroups(
	template: DiagramTemplate | null,
	blockType: BlockType | null,
	evaluationStage: string = EVALUATION_STAGE.BEFORE_WORKFLOW_START,
	mechanics: Mechanics = 'legacy',
): ProcessDataSelectorGroup[]
{
	const isAvailable: AvailabilityCheck = (sourceKey: string): boolean => isTemplateSourceAvailableForBlockType(
		blockType,
		sourceKey,
		evaluationStage,
	);

	return isCatalogGrouped(mechanics)
		? buildPurposeGroups(isAvailable)
		: buildTemplateGroups(template, isAvailable)
	;
}

/** Which build the groups of a selector come from. A template of the previous mechanics answers
 * without touching the catalog store at all. */
export function processDataMechanics(diagram: DiagramSource): Mechanics
{
	return isProcessDataTemplate(diagram) ? useProcessDataStore().mechanics : 'legacy';
}

// Null when there is nothing to read, and then the caller collects in the same tick: neither a template
// of the previous mechanics nor a second caller of the same read goes to the network.
export function loadProcessDataCatalog(diagram: DiagramSource = diagramStore()): Promise<boolean> | null
{
	if (!isProcessDataTemplate(diagram) || isCatalogRead())
	{
		return null;
	}

	return useProcessDataStore().load();
}

function isProcessDataTemplate(diagram: DiagramSource): boolean
{
	if (!useFeature().isFeatureAvailable(FeatureCode.processData))
	{
		return false;
	}

	return diagram.template?.TEMPLATE_SETTINGS?.[PROCESS_DATA_MARKER] === 'Y' || diagram.templateId <= 0;
}

// An answered read of an empty catalog is a read one, so the flag of the store is the answer and the
// length of its lists is not.
function isCatalogRead(): boolean
{
	return useProcessDataStore().isLoaded;
}

function isCatalogGrouped(mechanics: Mechanics): boolean
{
	return mechanics === 'new' && isCatalogRead();
}

function buildPurposeGroups(isAvailable: AvailabilityCheck): ProcessDataSelectorGroup[]
{
	const store = useProcessDataStore();

	return PURPOSE_GROUPS
		.filter((group) => isAvailable(group.sourceKey))
		.map((group) => ({
			id: group.purpose,
			title: Loc.getMessage(`BIZPROCDESIGNER_EDITOR_PROCESS_DATA_GROUP_${group.purpose.toUpperCase()}`) ?? '',
			entries: store.byPurpose(group.purpose)
				.map((element: ProcessDataElement) => toEntry(element))
				.filter((entry: ProcessDataSelectorEntry | null) => entry !== null),
		}))
		.filter((group) => group.entries.length > 0)
	;
}

function toEntry(element: ProcessDataElement): ProcessDataSelectorEntry | null
{
	const source = GROUP_SOURCES[element.sourceType];
	if (!source)
	{
		return null;
	}

	return {
		key: element.key,
		idKey: source.idKey,
		entityId: source.entityId,
		property: element.property,
	};
}

function buildTemplateGroups(
	template: DiagramTemplate | null,
	isAvailable: AvailabilityCheck,
): ProcessDataSelectorGroup[]
{
	return TEMPLATE_GROUPS
		.filter((group) => isAvailable(group.sourceKey))
		.map((group) => ({
			id: group.idKey,
			title: Loc.getMessage(group.titleKey) ?? '',
			entries: collectEntries(template?.[group.sourceKey], group.idKey, group.sourceKey),
		}))
		.filter((group) => group.entries.length > 0)
	;
}

function collectEntries(
	collection: { [string]: ProcessDataProperty } | null,
	idKey: string,
	entityId: string,
): ProcessDataSelectorEntry[]
{
	if (!Type.isObject(collection))
	{
		return [];
	}

	return Object.keys(collection).map((key) => ({
		key,
		idKey,
		entityId,
		property: collection[key],
	}));
}
