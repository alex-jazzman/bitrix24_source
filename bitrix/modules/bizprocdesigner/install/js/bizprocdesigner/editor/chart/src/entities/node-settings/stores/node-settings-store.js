import { defineStore } from 'ui.vue3.pinia';
import { Runtime, Type } from 'main.core';

import type { Block, PortId, Port, ActivityData } from '../../../shared/types';

import { createUniqueId } from '../../../shared/utils';
import { complexNodeApi } from '../api';
import { CONSTRUCTION_TYPES } from '../constants';

import type { Construction, TRuleCard, NodeSettings, OrderPayload, OutputConstruction } from '../types';
import { generateNextInputPortId } from '../utils';

type NodesSettingsState = {
	isLoading: boolean;
	isShown: boolean;
	isRuleSettingsShown: boolean;
	currentRuleId: string;
	nodeSettings: NodeSettings | null;
	block: Block | null,
};

type SyncOutputPorts = {
	outputPortsToAdd: Map<PortId, Partial<Port>>,
	outputPortsToDelete: Set<PortId>,
};

type SavedRule = {
	outputPortsToAdd: Map<PortId, { portId: PortId, title: string; }>,
	outputPortsToDelete: Set<PortId>,
};

export const useNodeSettingsStore = defineStore('bizprocdesigner-editor-node-settings', {
	state: (): NodesSettingsState => ({
		isLoading: false,
		isSaving: false,
		isShown: false,
		isRuleSettingsShown: false,
		currentRuleId: '',
		prevSavedNodeSettings: null,
		savedBlockInputPorts: null,
		nodeSettings: null,
		block: null,
	}),
	actions:
	{
		async fetchNodeSettings(block: Block): Promise<void>
		{
			this.nodeSettings = {
				title: block.node.title,
				description: '',
				rules: new Map(),
				blockId: block.id,
			};
			this.isLoading = true;
			const {
				actions,
				rules,
				fixedDocumentType,
				title: loadedTitle,
				description,
			} = await complexNodeApi.loadSettings(block.activity);

			if (Type.isStringFilled(loadedTitle))
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
			};
			this.prevSavedNodeSettings = Runtime.clone(this.nodeSettings);
			this.savedBlockInputPorts = block.ports.input.map((port) => {
				return { ...port };
			});
			this.block = block;
			this.isLoading = false;
		},
		isCurrentBlock(blockId: string): boolean
		{
			return this.nodeSettings?.blockId === blockId;
		},
		reset(): void
		{
			this.currentRuleId = '';
			this.nodeSettings = null;
			this.block = null;
		},
		toggleVisibility(isShown: boolean): void
		{
			this.isShown = isShown;
		},
		toggleRuleSettingsVisibility(isShown: boolean): void
		{
			this.isRuleSettingsShown = isShown;
		},
		setCurrentRuleId(ruleId: string): void
		{
			this.currentRuleId = ruleId;
		},
		addRule(): string
		{
			const nextPortId = generateNextInputPortId(this.block.ports.input);

			this.nodeSettings.rules.set(nextPortId, {
				isFilled: false,
				portId: nextPortId,
				ruleCards: [],
			});

			return nextPortId;
		},
		addConstruction(ruleCard: TRuleCard, constructionType: string, position: ?number): void
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

			if (constructionType === CONSTRUCTION_TYPES.ACTION)
			{
				newConstruction.expression.value = {};
				newConstruction.expression.actionId = '';
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

			if (position)
			{
				ruleCard.constructions.splice(position, 0, newConstruction);
			}
			else
			{
				ruleCard.constructions.push(newConstruction);
			}
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
			this.nodeSettings.rules.delete(ruleId);

			return this.syncOutputPortsWithRules();
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
			const rule = this.nodeSettings.rules.get(this.currentRuleId);
			rule.ruleCards.splice(rule.ruleCards.indexOf(ruleCard), 1);
		},
		addRuleCard(): TRuleCard
		{
			const rule = this.nodeSettings.rules.get(this.currentRuleId);
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
			const rule = this.nodeSettings.rules.get(this.currentRuleId);
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

			return this.syncOutputPortsWithRules();
		},
		syncOutputPortsWithRules(): SyncOutputPorts | null
		{
			if (!this.block)
			{
				return null;
			}

			const outputConstructions = [...this.nodeSettings.rules.values()].flatMap((r) => {
				return r.ruleCards.flatMap((ruleCard) => {
					return ruleCard.constructions.filter((construction) => construction.type === CONSTRUCTION_TYPES.OUTPUT);
				});
			});

			const allExistingOutputPortIds = new Set(this.block.ports.output.map((port) => port.id));
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
		async saveRule(documentType: Array<string>): Promise<SavedRule>
		{
			const {
				outputPortsToAdd,
				outputPortsToDelete,
			} = await this.savePortRule(this.currentRuleId, documentType);
			this.toggleRuleSettingsVisibility(false);

			return {
				outputPortsToAdd,
				outputPortsToDelete,
			};
		},
		async saveForm(documentType: string): Promise<ActivityData>
		{
			try
			{
				return await complexNodeApi.saveSettings(
					this.nodeSettings,
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
		discardRuleSettings(): void
		{
			const { rules: prevSavedRules } = this.prevSavedNodeSettings;
			if (!prevSavedRules.has(this.currentRuleId))
			{
				const currentRule = this.nodeSettings.rules.get(this.currentRuleId);
				currentRule.isFilled = false;
				currentRule.ruleCards = [];

				return;
			}

			const copyRule = Runtime.clone(prevSavedRules.get(this.currentRuleId));
			this.nodeSettings.rules.set(this.currentRuleId, copyRule);
		},
		updateSettings(settings: Partial<NodeSettings>): void
		{
			this.nodeSettings = {
				...this.nodeSettings,
				...settings,
			};
		},
	},
});
