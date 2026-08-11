import { defineStore } from 'ui.vue3.pinia';
import { Runtime, Type } from 'main.core';

import { PORT_TYPES, COMPLEX_NODE_PORT_LABELS, NODE_SETTINGS_TABS } from '../../../shared/constants';
import { type Block, type PortId, type Port, type PortTypes, type ActivityData } from '../../../shared/types';

import { createUniqueId, parsePortTitle } from '../../../shared/utils';
import { complexNodeApi } from '../api';
import { CONSTRUCTION_TYPES, CRM_FILTER_BACKING_ACTIVITY_TYPE } from '../constants';

import { type Construction, type TRuleCard, type NodeSettings, type OrderPayload, type OutputConstruction, type Rule } from '../types';
import { generateNextInputPortId } from '../utils';

type NodesSettingsState = {
	isLoading: boolean;
	isShown: boolean;
	currentRule: Port;
	nodeSettings: NodeSettings | null;
	block: Block | null,
	lastFetchId: number,
};

type SyncOutputPorts = {
	outputPortsToAdd: Map<PortId, Partial<Port>>,
	outputPortsToDelete: Set<PortId>,
};

type SyncAuxPort = {
	portId: PortId,
	title: string,
};

type SyncAuxPorts = {
	auxPortsToAdd: Map<PortId, SyncAuxPort>,
	auxPortsToActivate: Set<PortId>,
};

type PortParams = {
	portId: PortId,
	type: PortTypes,
	label: string,
	portTitle?: string,
};

const PORT_POSITIONS = Object.freeze({
	left: 'left',
	right: 'right',
});

export const useNodeSettingsStore = defineStore('bizprocdesigner-editor-node-settings', {
	state: (): NodesSettingsState => ({
		isLoading: false,
		isSaving: false,
		isShown: false,
		currentRule: null,
		prevSavedNodeSettings: null,
		ports: null,
		nodeSettings: null,
		block: null,
		lastFetchId: 0,
		selectedTabId: NODE_SETTINGS_TABS.basic,
	}),
	getters:
	{
		currentSettingsItems: (state: NodesSettingsState): Map<PortId, Rule> => {
			return state.currentRule.type === PORT_TYPES.input
				? state.nodeSettings.rules
				: state.nodeSettings.relations;
		},
		inputPorts: (state: NodesSettingsState): Array<Port> => {
			return state.ports.filter((port) => port.type === PORT_TYPES.input
				|| port.type === PORT_TYPES.inputRelation);
		},
	},
	actions:
	{
		async fetchNodeSettings(
			block: Block,
			defaultTitlePromise: Promise<string> = Promise.resolve(''),
		): Promise<void>
		{
			const fetchId = ++this.lastFetchId;
			this.nodeSettings = {
				title: '',
				description: '',
				rules: new Map(),
				relations: new Map(),
				blockId: block.id,
				filterSupported: false,
			};
			this.isLoading = true;
			const [loaded, defaultTitle] = await Promise.all([
				complexNodeApi.loadSettings(block.activity),
				defaultTitlePromise,
			]);
			const {
				actions,
				rules,
				fixedDocumentType,
				filterSupported,
				title: loadedTitle,
				description,
			} = loaded;

			if (this.lastFetchId !== fetchId || !this.nodeSettings)
			{
				return;
			}

			if (Type.isStringFilled(loadedTitle) && loadedTitle !== defaultTitle)
			{
				this.nodeSettings.title = loadedTitle;
			}

			this.nodeSettings = {
				...this.nodeSettings,
				actions: new Map(Object.entries(actions)),
				rules: new Map(
					Object.entries(rules).map(([id, rule]) => {
						return [
							id, {
								...rule,
								isFilled: rule.ruleCards.some((ruleCard) => {
									return ruleCard.constructions?.length > 0;
								}),
							},
						];
					}),
				),
				fixedDocumentType,
				description,
				filterSupported,
			};
			this.prevSavedNodeSettings = Runtime.clone(this.nodeSettings);
			this.ports = block.ports.map((port) => ({ ...port })).sort((a, b) => {
				const { id: aId } = parsePortTitle(a.title);
				const { id: bId } = parsePortTitle(b.title);

				return aId - bId;
			});
			const rulesIds = new Set(this.nodeSettings.rules.keys());
			let firstRulePort = null;
			this.ports.forEach((port) => {
				if (port.type === PORT_TYPES.input)
				{
					if (!rulesIds.has(port.id))
					{
						this.addRule(port.id);
					}

					if (!firstRulePort)
					{
						firstRulePort = port;
					}

					return;
				}

				if (port.type === PORT_TYPES.inputRelation)
				{
					this.addRelation(port.id);
				}
			});
			this.setCurrentRule(firstRulePort);
			this.block = block;
			this.isLoading = false;
		},
		isCurrentBlock(blockId: string): boolean
		{
			return this.nodeSettings?.blockId === blockId;
		},
		reset(): void
		{
			this.currentRule = null;
			this.nodeSettings = null;
			this.block = null;
			this.ports = null;
			this.selectedTabId = NODE_SETTINGS_TABS.basic;
		},
		toggleVisibility(isShown: boolean): void
		{
			this.isShown = isShown;
		},
		setCurrentRule(port: Port): void
		{
			this.currentRule = port;
		},
		addRule(portId: ?PortId): PortId
		{
			const nextPortId = portId ?? generateNextInputPortId(this.inputPorts);
			this.nodeSettings.rules.set(nextPortId, {
				isFilled: false,
				portId: nextPortId,
				ruleCards: [],
			});

			return nextPortId;
		},
		addRelation(portId: ?PortId): PortId
		{
			const nextPortId = portId ?? generateNextInputPortId(this.inputPorts);
			this.nodeSettings.relations.set(nextPortId, {
				isFilled: false,
				portId: nextPortId,
				ruleCards: [],
			});

			return nextPortId;
		},
		addConstruction(ruleCard: TRuleCard, constructionType: string): void
		{
			const newConstruction = {
				id: createUniqueId(),
				type: constructionType,
				expression: {
					title: '',
					valueId: '',
					value: '',
				},
			};

			if (
				constructionType === CONSTRUCTION_TYPES.ACTION
				|| constructionType === CONSTRUCTION_TYPES.FILTER
			)
			{
				newConstruction.expression.value = {};
				newConstruction.expression.actionId = constructionType === CONSTRUCTION_TYPES.FILTER
					? CRM_FILTER_BACKING_ACTIVITY_TYPE
					: ''
				;
				newConstruction.expression.rawActivityData = null;
				newConstruction.expression.activityData = null;
				newConstruction.expression.document = null;
			}
			else
			{
				newConstruction.expression.operator = '';
				newConstruction.expression.field = null;
			}

			if (constructionType === CONSTRUCTION_TYPES.OUTPUT)
			{
				newConstruction.expression = {
					portId: null,
					title: null,
				};
			}

			const pos = ruleCard.constructions.length;
			ruleCard.constructions.splice(pos, 0, newConstruction);
		},
		deleteConstruction(ruleCard: TRuleCard, construction: Construction): void
		{
			ruleCard.constructions.splice(ruleCard.constructions.indexOf(construction), 1);
			if (ruleCard.constructions.length === 0)
			{
				this.deleteRuleCard(ruleCard);
			}
		},
		deleteRuleSettings(ruleId: string): SyncOutputPorts | null
		{
			const isRule = this.nodeSettings.rules.has(ruleId);
			const settingsItems = isRule ? this.nodeSettings.rules : this.nodeSettings.relations;
			settingsItems.delete(ruleId);

			const portType = isRule ? PORT_TYPES.input : PORT_TYPES.inputRelation;

			return this.syncOutputPortsWithRules(portType);
		},
		selectBooleanType(construction: Construction, type: string): void
		{
			Object.assign(construction, { type });
		},
		changeRuleExpression(construction: Construction, props: Partial<Construction['expression']>): void
		{
			Object.assign(construction.expression, props);
		},
		deleteRuleCard(ruleCard: TRuleCard): void
		{
			const rule = this.currentSettingsItems.get(this.currentRule.id);
			rule.ruleCards.splice(rule.ruleCards.indexOf(ruleCard), 1);
		},
		addRuleCard(): TRuleCard
		{
			const rule = this.currentSettingsItems.get(this.currentRule.id);
			const ruleCard = {
				id: createUniqueId(),
				constructions: [],
			};
			rule.ruleCards.push(ruleCard);

			return ruleCard;
		},
		reorder(payload: OrderPayload): void
		{
			const { draggedId, targetId, insertion, ruleCardId } = payload;
			const rule = this.currentSettingsItems.get(this.currentRule.id);
			let collection = rule.ruleCards;
			if (ruleCardId)
			{
				const ruleCard = rule.ruleCards.find((currentRuleCard) => currentRuleCard.id === ruleCardId);
				collection = ruleCard.constructions;
			}

			const draggedItem = collection.find((item) => item.id === draggedId);
			const targetItem = collection.find((item) => item.id === targetId);
			const draggedIndex = collection.indexOf(draggedItem);
			collection.splice(draggedIndex, 1);
			const targetIndex = collection.indexOf(targetItem);
			const newDraggedIndex = insertion === 'over' ? targetIndex : targetIndex + 1;
			collection.splice(newDraggedIndex, 0, draggedItem);
		},
		async savePortRule(ruleId: string, documentType: Array<string>): Promise<SyncOutputPorts | null>
		{
			const rule = this.nodeSettings.rules.get(ruleId);
			if (!rule)
			{
				return null;
			}

			const transformedPortRule = await complexNodeApi.saveRuleSettings(rule, documentType);
			transformedPortRule.isFilled = transformedPortRule.ruleCards.some((ruleCard) => {
				return ruleCard.constructions?.length > 0;
			});
			this.nodeSettings.rules.set(ruleId, transformedPortRule);
			this.prevSavedNodeSettings.rules.set(ruleId, Runtime.clone(transformedPortRule));

			return this.syncOutputPortsWithRules(PORT_TYPES.input);
		},
		syncOutputPortsWithRules(portType?: string): SyncOutputPorts | null
		{
			if (!this.block)
			{
				return null;
			}

			const type = portType ?? this.currentRule?.type;
			const settingsItems = type === PORT_TYPES.input
				? this.nodeSettings.rules
				: this.nodeSettings.relations
			;

			const outputConstructions = [...settingsItems.values()].flatMap((r) => {
				return r.ruleCards.flatMap((ruleCard) => {
					return ruleCard.constructions.filter((construction) => construction.type === CONSTRUCTION_TYPES.OUTPUT);
				});
			});

			const outputType = type === PORT_TYPES.input
				? PORT_TYPES.output
				: PORT_TYPES.outputRelation
			;

			const allExistingOutputPortIds = new Set(
				this.ports
					.filter((port) => port.type === outputType)
					.map((port) => port.id),
			);

			const toDeletePortIds = new Set(allExistingOutputPortIds);
			const toAddPortsMap: Map<string, { portId: string, title: string }> = new Map();

			outputConstructions.forEach((construction: OutputConstruction) => {
				const { portId, title } = construction.expression;
				if (!portId || !title)
				{
					return;
				}

				const isPortExist = allExistingOutputPortIds.has(portId);
				if (!isPortExist)
				{
					toAddPortsMap.set(portId, { portId, title });
				}

				toDeletePortIds.delete(portId);
			});

			return {
				outputPortsToAdd: toAddPortsMap,
				outputPortsToDelete: toDeletePortIds,
			};
		},
		async saveRule(ruleId: string, documentType: Array<string>): Promise<void>
		{
			const { outputPortsToAdd } = await this.savePortRule(ruleId, documentType);
			outputPortsToAdd.forEach(({ portId, title }) => {
				this.addRulePort(portId, PORT_TYPES.output, title);
			});

			const auxSync = this.syncAuxPortsWithActions();
			auxSync?.auxPortsToAdd.forEach(({ portId, title }) => {
				this.addAuxPort(portId, title);
			});
			auxSync?.auxPortsToActivate?.forEach((portId) => {
				this.activatePort(portId);
			});
		},
		async saveRelation(relationId: string): Promise<void>
		{
			await new Promise((resolve) => {
				setTimeout(resolve, 2000);
			});
			const rule = this.nodeSettings.relations.get(relationId);
			rule.isFilled = true;
			const { outputPortsToAdd } = this.syncOutputPortsWithRules(PORT_TYPES.inputRelation);
			outputPortsToAdd.forEach(({ portId, title }) => {
				this.addRelationPort(portId, PORT_TYPES.outputRelation, title);
			});
		},
		async saveForm(documentType: string, defaultTitle: string = ''): Promise<ActivityData>
		{
			try
			{
				const nodeSettingsToSave = {
					...this.nodeSettings,
					title: Type.isStringFilled(this.nodeSettings.title)
						? this.nodeSettings.title
						: defaultTitle,
				};

				return await complexNodeApi.saveSettings(
					nodeSettingsToSave,
					this.block.activity,
					documentType,
				);
			}
			catch (e)
			{
				console.error(e);
				throw e;
			}
		},
		discardFormSettings(): void
		{
			this.nodeSettings = Runtime.clone(this.prevSavedNodeSettings);
		},
		createPort(ports: Array<Port>, { portId, type, label, portTitle }: PortParams): Port
		{
			const lastPort = ports[ports.length - 1] ?? null;
			const [, count] = (lastPort?.title?.split(label) ?? []);
			const title = portTitle ?? `${label}${Number(count ?? 0) + 1}`;

			const leftInputPortTypes = new Set([PORT_TYPES.input, PORT_TYPES.inputRelation]);

			return {
				id: portId,
				title,
				type,
				position: leftInputPortTypes.has(type) ? PORT_POSITIONS.left : PORT_POSITIONS.right,
			};
		},
		addRulePort(portId: string, type: PortTypes, portTitle: ?string): void
		{
			if (![PORT_TYPES.input, PORT_TYPES.output].includes(type))
			{
				return;
			}

			const currentPorts = this.ports.filter((port) => port.type === type);
			const label = type === PORT_TYPES.input
				? COMPLEX_NODE_PORT_LABELS.inputRule
				: COMPLEX_NODE_PORT_LABELS.outputRule
			;

			const port = this.createPort(currentPorts, { portId, type, label, portTitle });
			const addedPortId = parsePortTitle(port.title).id;
			for (let i = currentPorts.length - 1; i >= 0; i--)
			{
				const currentPortId = parsePortTitle(currentPorts[i].title).id;
				if (currentPortId < addedPortId)
				{
					this.ports.splice(this.ports.indexOf(currentPorts[i]) + 1, 0, port);

					return;
				}
			}

			this.ports.unshift(port);
		},
		addRelationPort(portId: string, type: PortTypes): void
		{
			if (![PORT_TYPES.inputRelation, PORT_TYPES.outputRelation].includes(type))
			{
				return;
			}

			const relationPorts = type === PORT_TYPES.inputRelation
				? this.ports.filter((port) => port.type === PORT_TYPES.inputRelation)
				: this.ports.filter((port) => port.type === PORT_TYPES.outputRelation)
			;
			const port = this.createPort(relationPorts, { portId, type, label: COMPLEX_NODE_PORT_LABELS.relation });
			this.ports.push({ ...port });
		},
		deletePort(portId: string): void
		{
			const deletedPort = this.ports.find((port) => port.id === portId);
			if (!deletedPort)
			{
				return;
			}

			if (deletedPort.type === PORT_TYPES.aux)
			{
				deletedPort.isActive = false;
				this.resetAuxPortReferencesInRules(portId);

				return;
			}

			this.ports.splice(this.ports.indexOf(deletedPort), 1);
			if (portId === this.currentRule.id)
			{
				this.setCurrentRule(null);
			}
		},
		activatePort(portId: string): void
		{
			const port = this.ports.find((p) => p.id === portId);
			if (port)
			{
				port.isActive = true;
			}
		},
		resetAuxPortReferencesInRules(portId: string): void
		{
			if (!this.nodeSettings?.rules)
			{
				return;
			}

			this.nodeSettings.rules.forEach((rule) => {
				rule.ruleCards.forEach((ruleCard) => {
					ruleCard.constructions.forEach((construction) => {
						if (
							construction.type === CONSTRUCTION_TYPES.ACTION
							&& construction.expression?.auxPortId === portId
						)
						{
							Object.assign(construction.expression, {
								auxPortId: null,
								auxPortTitle: null,
							});
						}
					});
				});
			});
		},
		syncAuxPortsWithActions(): SyncAuxPorts | null
		{
			if (!this.block)
			{
				return null;
			}

			const actionConstructions = [...this.nodeSettings.rules.values()].flatMap((r) => {
				return r.ruleCards.flatMap((ruleCard) => {
					return ruleCard.constructions.filter(
						(construction) => construction.type === CONSTRUCTION_TYPES.ACTION
							&& construction.expression.auxPortId,
					);
				});
			});

			const existingAuxPorts = new Map(
				this.ports
					.filter((port) => port.type === PORT_TYPES.aux)
					.map((port) => [port.id, port]),
			);

			const toAddPortsMap: Map<PortId, SyncAuxPort> = new Map();
			const toActivatePortIds: Set<PortId> = new Set();

			actionConstructions.forEach((construction) => {
				const { auxPortId, auxPortTitle } = construction.expression;
				if (!auxPortId || !auxPortTitle)
				{
					return;
				}

				const existingPort = existingAuxPorts.get(auxPortId);
				if (!existingPort)
				{
					toAddPortsMap.set(auxPortId, { portId: auxPortId, title: auxPortTitle });

					return;
				}

				if (existingPort.isActive === false)
				{
					toActivatePortIds.add(auxPortId);
				}
			});

			return {
				auxPortsToAdd: toAddPortsMap,
				auxPortsToActivate: toActivatePortIds,
			};
		},
		addAuxPort(portId: string, portTitle: ?string): void
		{
			const auxPorts = this.ports.filter((port) => port.type === PORT_TYPES.aux);
			const label = COMPLEX_NODE_PORT_LABELS.aux;
			const port = this.createPort(auxPorts, { portId, type: PORT_TYPES.aux, label, portTitle });
			this.ports.push(port);
		},
	},
});
