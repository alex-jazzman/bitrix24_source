import { Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { MenuManager, type MenuItem } from 'main.popup';
import { BIcon } from 'ui.icon-set.api.vue';
import { ref, provide } from 'ui.vue3';
import { mapState, mapActions } from 'ui.vue3.pinia';

import { diagramStore as useDiagramStore } from '../../../../entities/blocks';
import { ValueSelector } from '../../../../entities/common-node-settings';
import {
	useNodeSettingsStore,
	isActionExpressionDocumentCorrect,
	isReadableExpressionsAvailable,
	getConnectedBlocksContextForConstruction,
	resolveRuleCollection,
	EVENT_NAMES,
	type ActionDictEntry,
} from '../../../../entities/node-settings';
import { useLoc } from '../../../../shared/composables';
import { EVALUATION_STAGE, PORT_TYPES } from '../../../../shared/constants';
import { type ActivityData, type Block } from '../../../../shared/types';
import { isDataFieldEmpty } from '../../utils/autofill-form';
import { insertExpression } from '../../utils/expression-builder-insert';
import { hasFocusInside, mountFieldVeneer, unmountFieldVeneer } from '../../utils/readable-expressions-veneer';
import { EditAuxPortSelector } from '../edit-aux-port-selector/edit-aux-port-selector';

import './style.css';

let formIdCounter = 0;

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
		/**
		 * The settings form of the action is mounted only once a section the user has reached shows it:
		 * in the overview of every rule of a node mounting them all at once costs one request and one
		 * property dialog per action (see NodeSettingsRulesLayout.isSectionLive). The selectors of the
		 * action itself are rendered either way, so the row still says what the action is.
		 */
		isLive:
		{
			type: Boolean,
			default: true,
		},
		/**
		 * @type Port | PortlessRule
		 * Rule of the row this action belongs to. Without it the action works on the single rule the
		 * panel shows: only the all-rules mode has no single one, and there every row names its own.
		 */
		rulePort:
		{
			type: [Object, null],
			default: null,
		},
		/**
		 * Whether the classification of the catalog shapes the action selector: group headers in the
		 * flat list, and the intent-first cascade (group -> area -> object) where the catalog is fully
		 * classified. Turned off, the selector offers the plain list of the actions of the node.
		 */
		isGrouped:
		{
			type: Boolean,
			default: true,
		},
	},
	setup(props): {
		getMessage: () => string;
		isActionFormLoading: { value: boolean };
		isActionFormSubmitReady: { value: boolean };
		documentFieldId: string;
	}
	{
		const { getMessage } = useLoc();
		// A form that is not mounted is not loading either: the flag hides the auxiliary port selector
		// while the form arrives, and a row without a form would keep it hidden for good.
		const isActionFormLoading = ref(props.isLive && Boolean(props.construction?.expression?.actionId));
		provide('isActionFormLoading', isActionFormLoading);
		// The form answers the pre-save check only from the moment it has subscribed to the submit
		// event, and that is after it has loaded: until it says so, the row keeps answering itself.
		const isActionFormSubmitReady = ref(false);
		provide('isActionFormSubmitReady', isActionFormSubmitReady);

		formIdCounter++;

		return {
			getMessage,
			isActionFormLoading,
			isActionFormSubmitReady,
			documentFieldId: `editor-chart-action-expression-document-${formIdCounter}`,
		};
	},
	data(): {
		isExpanded: boolean;
		wasActionFormShown: boolean;
		wasSectionLive: boolean;
		selectedGroupRef: ?string;
		}
	{
		return {
			isExpanded: true,
			// The settings form of the action has been on screen at least once in this row: from then on
			// it stays mounted (see isActionFormMounted).
			wasActionFormShown: false,
			// The rule of this row has been reached at least once (see isAuxPortSelectorMounted).
			wasSectionLive: false,
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
	mounted(): void
	{
		// The pre-save check of the required fields lives on the row and not on the settings form: the
		// row is on screen for as long as the panel shows the action, and it is the row that answers
		// while the form of a collapsed row is off screen with its inline errors (isActionFormVisible).
		this.onBeforeSubmitCallback = () => this.onBeforeSubmit();
		EventEmitter.subscribe(EVENT_NAMES.BEFORE_SUBMIT_EVENT, this.onBeforeSubmitCallback);

		this.mountDocumentVeneer();
	},
	beforeUnmount(): void
	{
		EventEmitter.unsubscribe(EVENT_NAMES.BEFORE_SUBMIT_EVENT, this.onBeforeSubmitCallback);

		this.unmountDocumentVeneer();
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
		// A watcher runs before the rerender, so a field about to go loses its layer while it is still
		// there, and a field just brought in gets one as soon as it is rendered.
		isDocumentFieldShown(isShown: boolean): void
		{
			if (!isShown)
			{
				this.unmountDocumentVeneer();

				return;
			}

			void this.$nextTick(() => this.mountDocumentVeneer());
		},
		// The value written from outside - an insertion through the value selector, a reset on a new
		// action - reaches the field itself only after the rerender, so the layer is rebuilt after it.
		selectedDocument(): void
		{
			void this.$nextTick(() => this.syncDocumentVeneer());
		},
		isActionFormVisible:
		{
			// immediate: a row of a reached rule opens expanded, so the very first answer is the one that
			// mounts its form - without it the form of such a row would wait for a collapse and an expand.
			immediate: true,
			handler(isVisible: boolean): void
			{
				// Lazily mounted the first time the row shows it, and kept mounted from then on: the values
				// the user types live in the controls of the form and nowhere else - the form commits them
				// to rawActivityData, never to the activityData a rebuilt form reads - so an unmounted form
				// comes back showing the values from before the edit. The requests are still paid once per
				// row, and a rule nobody reached pays nothing.
				if (isVisible)
				{
					this.wasActionFormShown = true;
				}
			},
		},
		isLive:
		{
			// immediate: a row of a reached rule mounts its auxiliary port selector right away, as it did
			// before the overview existed.
			immediate: true,
			handler(isLive: boolean): void
			{
				if (isLive)
				{
					this.wasSectionLive = true;
				}
			},
		},
		isActionFormMounted(isMounted: boolean): void
		{
			// A form no longer on screen is not loading either: unmounted with the value section while it
			// was still arriving, it would leave the flag raised and keep the auxiliary port selector
			// hidden for good.
			if (!isMounted)
			{
				this.isActionFormLoading = false;
				// The form that answered the pre-save check went off screen with its subscription; the
				// next one says when it has taken the check over again.
				this.isActionFormSubmitReady = false;
			}
		},
	},
	computed:
	{
		...mapState(useDiagramStore, ['isWriteLocked']),
		...mapState(useNodeSettingsStore, [
			'nodeSettings',
			'block',
			'currentRule',
			'capabilityCatalog',
			'isActionCatalogFullyClassified',
			'actionGroupOptions',
			'catalogEntryByActionId',
			'actionAreasByGroup',
			'actionObjectsByArea',
			'resolveCatalogActionId',
			'isRelationAutofillEnabled',
		]),
		/** Rule this action works on: the one of its own row, or the single rule the panel shows. */
		targetRulePort(): Object | null
		{
			return this.rulePort ?? this.currentRule;
		},
		/** Id of that rule, as the context builder and the document selector take it. */
		targetRulePortId(): string | null
		{
			return this.targetRulePort?.id ?? null;
		},
		/** Rules collection the target rule lives in - relation rules are the ones kept apart. */
		targetSettingsItems(): Map | null
		{
			return resolveRuleCollection(this.nodeSettings, this.targetRulePort);
		},
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
			return this.isGrouped && this.areaOptions.length > 0;
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
				this.targetRulePortId,
				this.ruleCard,
				this.construction,
				this.targetSettingsItems,
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
			return this.targetRulePort?.type === PORT_TYPES.inputRelation;
		},
		selectedAction(): ActionDictEntry
		{
			if (this.isRelationContext && this.nodeSettings?.relationAction)
			{
				return this.nodeSettings.relationAction;
			}

			return this.nodeSettings?.actions?.get(this.selectedActionId);
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
				if (actionId === this.selectedActionId)
				{
					return;
				}

				const groupId = this.deriveGroupFromAction(actionId);
				this.selectedGroupRef = groupId;
				const catalogEntry = this.catalogEntryByActionId(actionId);
				const props = {};
				// Treat a pick as a group change only when the cascade is in play —
				// the new action has areas, or a stale area/object must be cleared.
				// A pure flat -> flat pick keeps the legacy behavior for the cascade fields.
				const picksCascadeAction = (catalogEntry?.areas?.length ?? 0) > 0;
				const changesCascade = Boolean(picksCascadeAction || this.selectedArea || this.selectedObject);
				if (changesCascade)
				{
					const { area, object } = picksCascadeAction
						? this.getCompatibleCascadeSelection(groupId, catalogEntry)
						: { area: null, object: null }
					;
					props.area = area;
					props.object = object;
				}

				// The document belongs to the form that shows the field: an action shown no field cannot own
				// the value the previous one left in it, and a cascade pick names another entity altogether.
				// Both drop the leftover here, at the switch, because the switch is the only thing that makes
				// one. Whatever the save receives afterwards is a document the template names, and every
				// contour that writes one - the settings form, the external agent, an import - is taken at
				// its word there.
				const keepsDocument = !changesCascade
					&& this.nodeSettings?.actions?.get(actionId)?.handlesDocument === true
				;
				if (!keepsDocument)
				{
					props.document = null;
				}

				this.applyResolvedAction(actionId, props);
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
			if (
				this.isGrouped
				&& (
					this.isActionCatalogFullyClassified
					|| (!this.selectedActionId && this.selectedGroup && this.isCascadeAvailable)
				)
			)
			{
				return this.selectedGroup ? this.getGroupTitle(this.selectedGroup) : this.notSelectedMessage;
			}

			const action = this.nodeSettings?.actions?.get(this.selectedActionId);

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
		isDocumentFieldShown(): boolean
		{
			return this.selectedAction?.handlesDocument === true;
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
		/**
		 * True while the settings form of the action is on screen: the value section is expanded and the
		 * section of the rule has been reached. Everything the form owns - the request, the property
		 * dialog and the pending flag - follows the first time this becomes true.
		 */
		isActionFormVisible(): boolean
		{
			return this.isExpanded && this.isLive;
		},
		/**
		 * True while the settings form of the action is mounted: from the first time the row showed it
		 * until the value section itself goes away. A collapsed row keeps its form mounted and merely
		 * hidden, because the form is where the input of the user lives (see the isActionFormVisible
		 * watcher); a row that has never shown one mounts nothing and costs no request.
		 */
		isActionFormMounted(): boolean
		{
			return this.isValueSectionShown && this.wasActionFormShown;
		},
		/**
		 * True from the first time the rule of this row was reached: the auxiliary port selector copies
		 * the ports of the node and subscribes to the scroll of the panel, so in the overview of every
		 * rule it is not built for the rules nobody reached. Once built it stays, like the settings form
		 * of the action: the ports the user added there live in the selector until the node is saved.
		 */
		isAuxPortSelectorMounted(): boolean
		{
			return this.wasSectionLive;
		},
		/**
		 * Auxiliary port of the action as its committed data names it, shown while the selector itself
		 * waits for the rule to be reached. The title is stored next to the id, and a payload that
		 * carries the id alone is answered by the ports of the node (see EditAuxPortSelector).
		 */
		committedAuxPortTitle(): string
		{
			const { auxPortId, auxPortTitle } = this.construction.expression;
			if (Type.isStringFilled(auxPortTitle))
			{
				return auxPortTitle;
			}

			const port = auxPortId
				? (this.block?.ports ?? []).find(({ id }) => id === auxPortId)
				: null;

			return port?.title ?? this.notSelectedMessage;
		},
	},
	methods:
	{
		...mapActions(useNodeSettingsStore, [
			'changeRuleExpression',
			'ensureCapabilityCatalog',
			'requestAutofillApply',
			'getRequiredFieldsCheck',
			'setRequiredFieldsCheck',
			'reportRequiredFieldsBlock',
		]),
		/**
		 * Pre-save check of the required fields of the action, for the row whose form leaves the user
		 * without a reachable error: a collapsed row keeps its form mounted, so that form answers too,
		 * but hidden with it are the errors it flags inline; the same holds for a row of a rule the
		 * current mode hides; a form still loading has not even subscribed to the submit event yet. The
		 * verdict comes off the data the form committed (rawActivityData) and the required fields it
		 * recorded.
		 * Returns whether the save has to be blocked.
		 */
		onBeforeSubmit(): boolean
		{
			// A row in a rule the user has not reached cannot show anything, and no form of it has been
			// mounted there either, so it blocks nothing. Neither does a row whose value section is
			// hidden: the source document of the action stopped resolving, so no form of it can be
			// mounted and no field of it reached - a block there would name fields nobody can fill and
			// point away from the document selector that actually needs the attention, and the server
			// check stays the final barrier either way.
			// A form on screen answers for itself, but only once it has taken the check over
			// (isActionFormSubmitReady). The mounted form of a collapsed row is subscribed and answers as
			// well, yet the errors it flags inline are hidden with it, so the row answers alongside it and
			// expands itself for them: both verdicts block the save, and only the row makes the errors
			// reachable.
			if (
				!this.isLive
				|| !this.isValueSectionShown
				|| (this.isActionFormVisible && this.isActionFormSubmitReady && this.isRowOnScreen())
			)
			{
				return false;
			}

			const check = this.getRequiredFieldsCheck(this.construction.id);
			// No form of this action has been mounted for the node, or the row has picked another action
			// since the record was written: there is nothing to answer for.
			if (check?.actionId !== this.selectedActionId || !this.hasEmptyRequiredFields(check))
			{
				return false;
			}

			this.blockSaveOnRequiredFields(check);

			return true;
		},
		/**
		 * True while the row is really on screen, asked at the moment of the save: expanded and live say
		 * only what this row decided, and a section the user has reached keeps both once another rule
		 * takes over the panel - it stays mounted and hidden by the v-show of the layout
		 * (NodeSettingsRulesLayout.renderedRuleSections). The form hidden with it flags its errors where
		 * nobody sees them, so from there the row answers again. Not a computed: the state is in the DOM
		 * and is not reactive, and isActionFormVisible drives the v-show of the form itself.
		 */
		isRowOnScreen(): boolean
		{
			return this.$el.offsetParent !== null;
		},
		/**
		 * One verdict behind both consequences of a block: the record is rewritten with the verdict the
		 * row blocked on, so the form flags exactly those fields inline
		 * (EditExtendedAction.restoreRequiredFieldErrors) instead of reading a stale "no errors" off it.
		 * The panel raises no alert for this branch and the inline errors are only visible in an expanded
		 * row, so the row expands itself. Bringing a row into view and announcing the block belong to the
		 * panel: in the all-rules mode one press can block several rows at once, and it is the panel that
		 * sees them all and leads to the first (NodeSettings.onSave).
		 * The row only ever raises the recorded verdict; lowering it belongs to the form, which sees the
		 * live fields.
		 */
		blockSaveOnRequiredFields(check: Object): void
		{
			this.setRequiredFieldsCheck(this.construction.id, { ...check, hasEmptyRequired: true });
			this.isExpanded = true;
			this.reportRequiredFieldsBlock({
				constructionId: this.construction.id,
				actionTitle: this.currentActionTitle,
				// What the announcement of the block has to say: a conflict of the relation asks for the
				// opposite of filling the field in - the field is filled, and it is that value that stands in
				// the way.
				hasAutofillConflict: check.hasAutofillConflict === true,
				// The rule of the row: the overview lists the ordinary rules of the node and never a
				// relation rule, so without the name of the rule the panel could not open the section a
				// blocked row of one sits in.
				rulePort: this.targetRulePort ?? null,
			});
		},
		/**
		 * Emptiness of the recorded required fields, off the form data the row holds: that data is what
		 * the save would send, so it answers for a form the user has edited and collapsed. A row whose
		 * form committed nothing (opened and left untouched) has none, and the verdict the form recorded
		 * before it left the screen stands.
		 */
		hasEmptyRequiredFields(check: Object): boolean
		{
			if (check.hasAutofillConflict === true)
			{
				return true;
			}

			const { rawActivityData } = this.construction.expression;
			if (!Type.isPlainObject(rawActivityData))
			{
				return check.hasEmptyRequired;
			}

			return check.fields.some((fieldCode: string) => {
				// A required field the committed data does not carry at all (a control prepareForm leaves
				// out, an unchecked checkbox among them) says nothing about its own emptiness here: read as
				// filled it would silently drop the verdict of the form, which did see the live control.
				if (!(fieldCode in rawActivityData))
				{
					return check.hasEmptyRequired;
				}

				return isDataFieldEmpty(rawActivityData, fieldCode);
			});
		},
		deriveGroupFromAction(actionId: ?string): ?string
		{
			return this.catalogEntryByActionId(actionId)?.group
				?? this.nodeSettings?.actions?.get(actionId)?.group
				?? null;
		},
		getCompatibleCascadeSelection(
			groupId: ?string,
			entry: ?Object = null,
			selectedArea: ?string = this.selectedArea,
			selectedObject: ?string = this.selectedObject,
		): { area: ?string, object: ?string }
		{
			const hasConcreteEntry = entry !== null;
			const areaOptions = this.actionAreasByGroup(groupId);
			const actionAreas = Array.isArray(entry?.areas) ? entry.areas : [];
			const isSelectedAreaCompatible = Boolean(selectedArea)
				&& areaOptions.some((area) => area.id === selectedArea)
				&& (!hasConcreteEntry || actionAreas.some((area) => area.id === selectedArea))
			;
			const area = isSelectedAreaCompatible
				? selectedArea
				: (actionAreas.length === 1 ? (actionAreas[0]?.id ?? null) : null)
			;

			if (!area)
			{
				return { area: null, object: null };
			}

			const objectOptions = this.actionObjectsByArea(groupId, area);
			const actionObjects = Array.isArray(entry?.objects)
				? entry.objects.filter((object) => object?.area === area)
				: []
			;
			const isSelectedObjectCompatible = Boolean(selectedObject)
				&& objectOptions.some((object) => object.id === selectedObject)
				&& (!hasConcreteEntry || actionObjects.some((object) => object.id === selectedObject))
			;

			return {
				area,
				object: isSelectedObjectCompatible
					? selectedObject
					: (actionObjects.length === 1 ? (actionObjects[0]?.id ?? null) : null),
			};
		},
		resolveCascadeActionId(groupId: ?string, areaId: ?string, objectId: ?string = null): string | null
		{
			if (!areaId)
			{
				return null;
			}

			const objectOptions = this.actionObjectsByArea(groupId, areaId);
			if (objectOptions.length > 0 && !objectId)
			{
				return null;
			}

			return this.resolveCatalogActionId(groupId, areaId, objectId);
		},
		applyResolvedAction(actionId: ?string, props: Object): void
		{
			const isActionChanged = actionId !== (this.construction.expression.actionId ?? null);
			if (
				actionId
				&& isActionChanged
				&& this.isRelationAutofillEnabled
				&& this.nodeSettings?.actions?.get(actionId)?.isRelationCreate
			)
			{
				this.requestAutofillApply(this.construction.id);
			}

			if (isActionChanged)
			{
				this.isActionFormLoading = Boolean(actionId);
			}

			this.changeRuleExpression(this.construction, {
				...props,
				actionId,
				...(isActionChanged ? { activityData: null } : {}),
			});
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

			const currentActionEntry = this.catalogEntryByActionId(this.selectedActionId);
			const isCurrentActionCompatible = Array.isArray(currentActionEntry?.areas)
				&& currentActionEntry.areas.some((area) => area.id === areaId)
			;
			const { object } = this.getCompatibleCascadeSelection(
				this.selectedGroup,
				isCurrentActionCompatible ? currentActionEntry : null,
				areaId,
				this.selectedObject,
			);
			const resolvedActionId = this.resolveCascadeActionId(this.selectedGroup, areaId, object);
			this.applyResolvedAction(resolvedActionId, {
				area: areaId,
				object,
				document: null,
			});
		},
		onSelectObject(objectId: string): void
		{
			if (objectId === this.selectedObject)
			{
				return;
			}

			const resolvedActionId = this.resolveCatalogActionId(this.selectedGroup, this.selectedArea, objectId);
			this.applyResolvedAction(resolvedActionId, {
				object: objectId,
				document: null,
			});
		},
		onSelectGroup(groupId: string): void
		{
			if (groupId === this.selectedGroup)
			{
				return;
			}

			this.selectedGroupRef = groupId;
			const { area, object } = this.getCompatibleCascadeSelection(groupId);
			const resolvedActionId = this.resolveCascadeActionId(groupId, area, object);
			this.applyResolvedAction(resolvedActionId, {
				area,
				object,
				document: null,
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
			const entries = [...(this.nodeSettings?.actions?.values() ?? [])];
			if (!this.isGrouped)
			{
				return entries.map(({ id, title }) => this.makeActionItem(id, title));
			}

			// Fully classified catalog: offer intents only, concrete activities are
			// resolved further down the cascade (area -> object).
			if (this.isActionCatalogFullyClassified)
			{
				return this.actionGroupOptions.map(({ id }) => this.makeGroupItem(id));
			}

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
		/**
		 * The value is committed when the field is left, not on every keystroke: a write to the store
		 * rebuilds the rules of the node and asks the server for the parameters form of the action.
		 * It goes in trimmed, whitespace alone as an empty value - the node must not be saved with a
		 * document the field itself shows as missing.
		 */
		onDocumentChange({ target }: Event): void
		{
			const document = target.value.trim();

			// The field is brought to the committed value by hand: with an already empty store a field of
			// spaces would keep showing them, as an unchanged computed value gives Vue nothing to render.
			target.value = document;
			this.selectedDocument = document;
		},
		/**
		 * The readable layer over the raw expression of the field. It is mounted while the field is not
		 * being edited: a mounted layer shows its tokens, and the very moment the field is left is when
		 * it may carry a reference for the first time - both the value selector and typing by hand leave
		 * the field focused.
		 */
		mountDocumentVeneer(): void
		{
			if (!isReadableExpressionsAvailable())
			{
				return;
			}

			const input = this.$refs.documentInput;
			if (input)
			{
				mountFieldVeneer(input, this.connectedBlocks);
			}
		},
		// Tokens of a mounted layer are built once, so a value changed from outside gets a layer built
		// anew. A field being edited is left alone: leaving it rebuilds the layer by itself.
		syncDocumentVeneer(): void
		{
			if (hasFocusInside(this.$refs.documentInput))
			{
				return;
			}

			this.unmountDocumentVeneer();
			this.mountDocumentVeneer();
		},
		unmountDocumentVeneer(): void
		{
			unmountFieldVeneer(this.$refs.documentInput);
		},
		/**
		 * The value of the source document is an expression, so it is inserted where the caret stands
		 * instead of replacing what the user has typed: an id typed by hand and a free expression are
		 * legitimate values of this field too. The dialog is the one every field of the settings opens,
		 * save for one thing: the value of this field is a document, so a document is offered as a value
		 * of its own instead of a node to drill into for its fields, and the documents that could never
		 * be this one - a projection of many, a document of a module this node does not serve - are left
		 * out of the offer.
		 */
		onChooseDocument(event: Event): void
		{
			if (this.isWriteLocked)
			{
				return;
			}

			const selector = new ValueSelector(
				useDiagramStore(),
				this.block,
				this.targetRulePortId,
				this.connectedBlocks,
				// The document of an action is read by a workflow that is already running.
				EVALUATION_STAGE.IN_STARTED_WORKFLOW,
			);

			void selector
				.show(event.target, {
					selectableDocuments: true,
					fixedDocumentType: this.nodeSettings?.fixedDocumentType ?? null,
				})
				.then((value: string) => {
					// The insertion sends the same `change` the field gets from typing by hand, and
					// that event commits the value: there is one way into the store, not two.
					insertExpression(this.$refs.documentInput, value);
				})
				.catch((error) => console.error(error))
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
			<div v-if="isDocumentFieldShown"
				 class="editor-chart-node-settings-edit-action-expression-form__item"
				 data-testid="bizprocdesigner-action-document-field"
			>
				<label
					class="editor-chart-node-settings-edit-action-expression-form__label"
					:for="documentFieldId"
				>
					{{ getMessage('BIZPROCDESIGNER_EDITOR_DOCUMENT') }}
				</label>
				<div class="editor-chart-node-settings-edit-action-expression-form__document">
					<input
						ref="documentInput"
						type="text"
						class="editor-chart-node-settings-edit-action-expression-form__document-value"
						:id="documentFieldId"
						data-testid="bizprocdesigner-action-document-input"
						:readonly="isWriteLocked"
						:value="selectedDocument"
						@change="onDocumentChange"
						@blur="mountDocumentVeneer"
					/>
					<button
						type="button"
						class="editor-chart-node-settings-edit-action-expression-form__document-select"
						data-testid="bizprocdesigner-action-document-select-btn"
						:title="getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION_DOCUMENT_SELECT')"
						:aria-label="getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION_DOCUMENT_SELECT')"
						:disabled="isWriteLocked"
						@click="onChooseDocument"
					></button>
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
				<!-- v-if for the first showing, v-show from then on: the form is not built until the row
				actually shows it (one request and one property dialog per action), and once built it is
				only hidden, because the input of the user lives in its controls -->
				<div
					v-if="isActionFormMounted"
					v-show="isActionFormVisible"
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
				<!-- Same lazy border as the settings form above: the selector copies the ports of the node
				and subscribes to the scroll of the panel, so it waits for the rule to be reached and the
				row names the committed port until then -->
				<EditAuxPortSelector
					v-if="isAuxPortSelectorMounted"
					:construction="construction"
				/>
				<template v-else>
					<span class="editor-chart-node-settings-edit-action-expression-form__label">
						{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_AUX_PORT_TITLE') }}
					</span>
					<div
						class="ui-ctl ui-ctl-textbox"
						:data-test-id="$testId('auxPortPreview')"
					>
						<div class="ui-ctl-element">{{ committedAuxPortTitle }}</div>
					</div>
				</template>
			</div>
		</div>
	`,
};
