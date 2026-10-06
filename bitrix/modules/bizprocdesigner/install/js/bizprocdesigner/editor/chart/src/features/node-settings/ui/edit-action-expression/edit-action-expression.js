import { MenuManager, type MenuItem } from 'main.popup';
import { BIcon } from 'ui.icon-set.api.vue';
import { ref, provide } from 'ui.vue3';
import { mapState, mapActions } from 'ui.vue3.pinia';

import {
	useNodeSettingsStore,
	evaluateActionExpressionDocumentTitle,
	isActionExpressionDocumentCorrect,
	getConnectedBlocksContextForConstruction,
	type ActionDictEntry,
} from '../../../../entities/node-settings';
import { useLoc } from '../../../../shared/composables';
import { PORT_TYPES } from '../../../../shared/constants';
import { type ActivityData, type Block } from '../../../../shared/types';
import { EditAuxPortSelector } from '../edit-aux-port-selector/edit-aux-port-selector';
import { DocumentSelector } from './document-selector';

import './style.css';

// @vue/component
export const EditActionExpression = {
	name: 'EditActionExpression',
	components: { BIcon, EditAuxPortSelector },
	props:
	{
		/** @type ActionConstruction */
		construction:
		{
			type: Object,
			required: true,
		},
		ruleCard:
		{
			type: [Object, null],
			required: false,
			default: null,
		},
		isExpertMode:
		{
			type: Boolean,
			required: true,
		},
		isScrolling:
		{
			type: Boolean,
			default: false,
		},
	},
	setup(props): { getMessage: () => string; isActionFormLoading: { value: boolean }; }
	{
		const { getMessage } = useLoc();
		const isActionFormLoading = ref(Boolean(props.construction?.expression?.actionId));
		provide('isActionFormLoading', isActionFormLoading);

		return { getMessage, isActionFormLoading };
	},
	data(): { isExpanded: boolean; selectedGroupRef: ?string; }
	{
		return {
			isExpanded: true,
			// Active cascade group. Held locally because the persisted actionId is
			// briefly cleared while the user picks a new area (§2.5), which would
			// otherwise collapse the area/object steps mid-selection.
			selectedGroupRef: null,
		};
	},
	created(): void
	{
		void this.ensureCapabilityCatalog();
		this.selectedGroupRef = this.deriveGroupFromAction(this.selectedActionId);
	},
	watch:
	{
		capabilityCatalog(): void
		{
			// The catalog may arrive after mount; derive the group for an already
			// configured action so the cascade steps appear without a re-pick.
			if (this.selectedGroupRef === null && this.selectedActionId)
			{
				this.selectedGroupRef = this.deriveGroupFromAction(this.selectedActionId);
			}
		},
	},
	computed:
	{
		...mapState(useNodeSettingsStore, [
			'nodeSettings',
			'block',
			'currentRule',
			'currentSettingsItems',
			'capabilityCatalog',
			'isActionCatalogFullyClassified',
			'actionGroupOptions',
			'catalogEntryByActionId',
			'actionAreasByGroup',
			'actionObjectsByArea',
			'resolveCatalogActionId',
			'isRelationAutofillEnabled',
		]),
		selectedGroup(): ?string
		{
			return this.selectedGroupRef;
		},
		selectedArea(): ?string
		{
			return this.construction.expression.area ?? null;
		},
		selectedObject(): ?string
		{
			return this.construction.expression.object ?? null;
		},
		areaOptions(): Array<Object>
		{
			return this.actionAreasByGroup(this.selectedGroup);
		},
		// Cascade is available only when the selected action's group offers areas;
		// otherwise the flat action selector stays as the only control.
		isCascadeAvailable(): boolean
		{
			return this.areaOptions.length > 0;
		},
		objectOptions(): Array<Object>
		{
			return this.selectedArea
				? this.actionObjectsByArea(this.selectedGroup, this.selectedArea)
				: [];
		},
		// Skipped when the area has no objects (e.g. the notification MVP node):
		// the actionId is then resolved by group + area alone.
		isObjectStepShown(): boolean
		{
			return this.isCascadeAvailable && Boolean(this.selectedArea) && this.objectOptions.length > 0;
		},
		selectedAreaTitle(): string
		{
			return this.areaOptions.find((area) => area.id === this.selectedArea)?.title
				?? this.notSelectedMessage;
		},
		selectedObjectTitle(): string
		{
			return this.objectOptions.find((object) => object.id === this.selectedObject)?.title
				?? this.notSelectedMessage;
		},
		connectedBlocksContext(): Object
		{
			return getConnectedBlocksContextForConstruction(
				this.block,
				this.currentRule.id,
				this.ruleCard,
				this.construction,
				this.currentSettingsItems,
			);
		},
		shouldShowAuxPorts(): boolean
		{
			return this.block.node?.shouldShowAuxPorts === true;
		},
		connectedBlocks(): Array<Block>
		{
			return this.connectedBlocksContext.allBlocks;
		},
		isRelationContext(): boolean
		{
			return this.currentRule?.type === PORT_TYPES.inputRelation;
		},
		selectedAction(): ActionDictEntry
		{
			if (this.isRelationContext && this.nodeSettings?.relationAction)
			{
				return this.nodeSettings.relationAction;
			}

			return this.nodeSettings.actions.get(this.selectedActionId);
		},
		selectedActionId:
		{
			get(): string
			{
				const actionId = this.construction.expression.actionId ?? '';
				if (!actionId && this.isRelationContext && this.nodeSettings?.relationAction)
				{
					return this.nodeSettings.relationAction.id;
				}

				return actionId;
			},
			set(actionId: string): void
			{
				// A user-initiated "Create" selection is the only trigger for autofill, and only on a relation
				// input port: mark the request here so the form applies it once mounted, even on first select.
				// A "Create" sub-action in a plain process branch must not autofill from ordinary ancestors.
				if (
					this.isRelationAutofillEnabled
					&& this.currentRule?.type === PORT_TYPES.inputRelation
					&& this.nodeSettings.actions.get(actionId)?.isRelationCreate
				)
				{
					this.requestAutofillApply(this.construction.id);
				}

				this.isActionFormLoading = true;
				this.selectedGroupRef = this.deriveGroupFromAction(actionId);
				const props = { actionId, activityData: null };
				// Treat a pick as a group change only when the cascade is in play —
				// the new action has areas, or a stale area/object must be cleared.
				// A pure flat -> flat pick keeps the legacy behavior (no document reset).
				const picksCascadeAction = (this.catalogEntryByActionId(actionId)?.areas?.length ?? 0) > 0;
				if (picksCascadeAction || this.selectedArea || this.selectedObject)
				{
					props.area = null;
					props.object = null;
					props.document = null;
				}
				this.changeRuleExpression(this.construction, props);
			},
		},
		actionValue(): ?ActivityData
		{
			return this.construction.expression.activityData;
		},
		notSelectedMessage(): string
		{
			return this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EXPRESSION_ITEM_NOT_SELECTED');
		},
		currentActionTitle(): string
		{
			if (this.isRelationContext && this.nodeSettings?.relationAction)
			{
				return this.nodeSettings.relationAction.title;
			}

			// Intent-first mode shows the picked universal action, not the resolved activity.
			if (this.isActionCatalogFullyClassified)
			{
				return this.selectedGroup ? this.getGroupTitle(this.selectedGroup) : this.notSelectedMessage;
			}

			const action = this.nodeSettings.actions.get(this.selectedActionId);

			return action?.title ?? this.notSelectedMessage;
		},
		selectedDocument:
		{
			get(): string
			{
				return isActionExpressionDocumentCorrect(this.connectedBlocks, this.construction.expression.document)
					? this.construction.expression.document
					: ''
				;
			},
			set(document: string | null): void
			{
				this.changeRuleExpression(this.construction, {
					document,
				});
			},
		},
		selectedDocumentTitle(): string
		{
			return evaluateActionExpressionDocumentTitle(
				this.connectedBlocks,
				this.selectedDocument,
			);
		},
		// A handlesDocument action cannot build its parameters form until the source
		// document is picked, so the whole value section stays hidden until then.
		isValueSectionShown(): boolean
		{
			return Boolean(this.selectedActionId)
				&& (this.selectedAction?.handlesDocument !== true || this.selectedDocument !== '');
		},
		// The form can only be loading while it is actually rendered: with the value
		// section hidden nobody would reset the injected flag.
		isActionFormPending(): boolean
		{
			return this.isValueSectionShown && this.isActionFormLoading;
		},
	},
	methods:
	{
		...mapActions(useNodeSettingsStore, ['changeRuleExpression', 'ensureCapabilityCatalog', 'requestAutofillApply']),
		deriveGroupFromAction(actionId: ?string): ?string
		{
			return this.catalogEntryByActionId(actionId)?.group
				?? this.nodeSettings?.actions?.get(actionId)?.group
				?? null;
		},
		onShowAreaMenu({ currentTarget }: PointerEvent): void
		{
			this.areaMenu = MenuManager.create({
				id: 'edit-action-area-menu',
				bindElement: currentTarget,
				items: this.areaOptions.map((area) => ({
					id: `action-area-${area.id}`,
					text: area.title,
					dataset: { testId: `actionAreaSelectItem-${area.id}` },
					onclick: () => {
						this.onSelectArea(area.id);
						this.areaMenu.close();
					},
				})),
				maxHeight: 200,
				closeByEsc: true,
				autoHide: true,
				cacheable: false,
			});
			this.areaMenu.show();
		},
		onShowObjectMenu({ currentTarget }: PointerEvent): void
		{
			this.objectMenu = MenuManager.create({
				id: 'edit-action-object-menu',
				bindElement: currentTarget,
				items: this.objectOptions.map((object) => ({
					id: `action-object-${object.id}`,
					text: object.title,
					dataset: { testId: `actionObjectSelectItem-${object.id}` },
					onclick: () => {
						this.onSelectObject(object.id);
						this.objectMenu.close();
					},
				})),
				maxHeight: 200,
				closeByEsc: true,
				autoHide: true,
				cacheable: false,
			});
			this.objectMenu.show();
		},
		onSelectArea(areaId: string): void
		{
			if (areaId === this.selectedArea)
			{
				return;
			}

			// No object step for this area → the action resolves from group + area.
			const resolvedActionId = this.actionObjectsByArea(this.selectedGroup, areaId).length === 0
				? this.resolveCatalogActionId(this.selectedGroup, areaId)
				: null;
			this.isActionFormLoading = Boolean(resolvedActionId);
			this.changeRuleExpression(this.construction, {
				area: areaId,
				object: null,
				actionId: resolvedActionId,
				document: null,
				activityData: null,
			});
		},
		onSelectObject(objectId: string): void
		{
			if (objectId === this.selectedObject)
			{
				return;
			}

			const resolvedActionId = this.resolveCatalogActionId(this.selectedGroup, this.selectedArea, objectId);
			this.isActionFormLoading = Boolean(resolvedActionId);
			this.changeRuleExpression(this.construction, {
				object: objectId,
				actionId: resolvedActionId,
				document: null,
				activityData: null,
			});
		},
		onSelectGroup(groupId: string): void
		{
			if (groupId === this.selectedGroup)
			{
				return;
			}

			this.selectedGroupRef = groupId;
			this.isActionFormLoading = false;
			this.changeRuleExpression(this.construction, {
				area: null,
				object: null,
				actionId: null,
				document: null,
				activityData: null,
			});
		},
		makeGroupItem(groupId: string): Object
		{
			return {
				id: `action-group-${groupId}`,
				text: this.getGroupTitle(groupId),
				dataset: { testId: `actionGroupSelectItem-${groupId}` },
				onclick: () => {
					this.onSelectGroup(groupId);
					this.menu.close();
				},
			};
		},
		makeActionItem(id: string, title: string): Object
		{
			return {
				id,
				text: title,
				dataset: { testId: `actionSelectItem-${id}` },
				onclick: () => {
					this.selectedActionId = id;
					this.menu.close();
				},
			};
		},
		getGroupTitle(groupId: string): string
		{
			const key = `BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION_GROUP_${groupId.toUpperCase()}`;
			return this.getMessage(key) || groupId;
		},
		getMenuItems(): Array<Object>
		{
			// Fully classified catalog: offer intents only, concrete activities are
			// resolved further down the cascade (area -> object).
			if (this.isActionCatalogFullyClassified)
			{
				return this.actionGroupOptions.map(({ id }) => this.makeGroupItem(id));
			}

			const entries = [...this.nodeSettings.actions.values()];
			const grouped = new Map();
			for (const entry of entries)
			{
				const key = entry.group ?? null;
				if (!grouped.has(key))
				{
					grouped.set(key, []);
				}
				grouped.get(key).push(entry);
			}

			if (grouped.size === 1 && grouped.has(null))
			{
				return entries.map(({ id, title }) => this.makeActionItem(id, title));
			}

			const items = [];
			for (const [groupId, groupEntries] of grouped)
			{
				if (groupId !== null)
				{
					items.push({
						id: `action-group-${groupId}`,
						text: this.getGroupTitle(groupId),
						disabled: true,
					});
				}
				for (const { id, title } of groupEntries)
				{
					items.push(this.makeActionItem(id, title));
				}
			}

			return items;
		},
		onShowMenu({ currentTarget }: PointerEvent): void
		{
			this.menu = MenuManager.create(
				{
					id: 'edit-actions-menu',
					bindElement: currentTarget,
					items: this.getMenuItems(),
					maxHeight: 200,
					closeByEsc: true,
					autoHide: true,
					cacheable: false,
				},
			);
			this.menu.show();
		},
		onChooseDocument(event: Event): void
		{
			const selector = new DocumentSelector(
				this.block,
				this.currentRule.id,
				this.nodeSettings.fixedDocumentType,
				this.connectedBlocks,
			);

			void selector
				.show(event.target)
				.then((document) => {
					this.selectedDocument = document;
				})
			;
		},
	},
	template: `
		<div class="editor-chart-node-settings-edit-action-expression-form">
			<div class="editor-chart-node-settings-edit-action-expression-form__item">
				<span class="editor-chart-node-settings-edit-action-expression-form__label">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION_EXPRESSION_NAME') }}
				</span>
				<div
					class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown editor-chart-node-settings-edit-action-expression-form__dropdown"
					:class="{ '--disabled': isRelationContext }"
					:data-test-id="$testId('actionSelect')"
					@click="isRelationContext ? null : onShowMenu($event)"
				>
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
					<div class="ui-ctl-element">
						{{ currentActionTitle }}
					</div>
				</div>
			</div>
			<div v-if="isCascadeAvailable"
				 class="editor-chart-node-settings-edit-action-expression-form__item"
			>
				<span class="editor-chart-node-settings-edit-action-expression-form__label">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION_AREA') }}
				</span>
				<div
					class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown editor-chart-node-settings-edit-action-expression-form__dropdown"
					:data-test-id="$testId('actionAreaSelect')"
					@click="onShowAreaMenu"
				>
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
					<div class="ui-ctl-element">
						{{ selectedAreaTitle }}
					</div>
				</div>
			</div>
			<div v-if="isObjectStepShown"
				 class="editor-chart-node-settings-edit-action-expression-form__item"
			>
				<span class="editor-chart-node-settings-edit-action-expression-form__label">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION_OBJECT') }}
				</span>
				<div
					class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown editor-chart-node-settings-edit-action-expression-form__dropdown"
					:data-test-id="$testId('actionObjectSelect')"
					@click="onShowObjectMenu"
				>
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
					<div class="ui-ctl-element">
						{{ selectedObjectTitle }}
					</div>
				</div>
			</div>
			<div v-if="selectedAction && selectedAction.handlesDocument"
				 class="editor-chart-node-settings-edit-action-expression-form__item"
			>
				<span class="editor-chart-node-settings-edit-action-expression-form__label">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_DOCUMENT') }}
				</span>
				<div
					 class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown editor-chart-node-settings-edit-action-expression-form__dropdown"
					 @click="onChooseDocument"
				>
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
					<div
						class="ui-ctl-element"
						:data-test-id="$testId('selectedActionDocument')"
					>
						{{ selectedDocumentTitle }}
					</div>
				</div>
			</div>
			<div
				v-if="isValueSectionShown"
				class="editor-chart-node-settings-edit-action-expression-form__item"
			>
				<div class="editor-chart-node-settings-edit-action-expression-form__label">
					<span>
						{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EXPRESSION_VALUE') }}
					</span>
					<BIcon
						v-if="isExpanded"
						name="minus-20"
						color="#828b95"
						:data-test-id="$testId('actionCollapseBtn')"
						@click="isExpanded=false"
					/>
					<BIcon
						v-else
						name="plus-20"
						color="#828b95"
						:data-test-id="$testId('actionExpandBtn')"
						@click="isExpanded=true"
					/>
				</div>
				<div
					v-show="isExpanded"
					class="editor-chart-node-settings-edit-action-expression-form__settings node-settings-panel"
				>
					<slot
						:actionId="selectedActionId"
						:activityData="actionValue"
						:selectedDocument="selectedDocument"
					/>
				</div>
			</div>
			<div
				v-if="shouldShowAuxPorts && selectedActionId"
				v-show="!isActionFormPending"
				class="editor-chart-node-settings-edit-action-expression-form__item"
			>
				<EditAuxPortSelector
					:construction="construction"
					:isScrolling="isScrolling"
				/>
			</div>
		</div>
	`,
};
