import { Dom, Event, Text } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { LiveAnnouncer } from 'ui.a11y';
import { isKeyboardBusyByOverlay, useBlockDiagram, useHistory, KEY_TOKEN } from 'ui.block-diagram';
import { MessageBox } from 'ui.dialogs.messagebox';
import { type Ref } from 'ui.vue3';
import { type MenuItemOptions } from 'ui.vue3.components.menu';
import { mapState, mapWritableState, mapActions } from 'ui.vue3.pinia';

import { useAppStore } from '../../../entities/app';
import { diagramStore as useDiagramStore } from '../../../entities/blocks';
import {
	NodeSettingsLayout,
	useNodeSettingsStore,
	EVENT_NAMES,
	getPortsSignature,
	type NodeBrokenLinkRulePort,
} from '../../../entities/node-settings';
import { useLoc } from '../../../shared/composables';
import { NODE_SETTINGS_TABS, PORT_TYPES } from '../../../shared/constants';
import { useNodeDataInspectorStore } from '../../../shared/stores/node-data-inspector-store';
import { type Port } from '../../../shared/types';
import { EditorChartTabs, SaveSettingsButton, CancelSettingsButton } from '../../../shared/ui';
import { getBackgroundImage, isEditableElement } from '../../../shared/utils';
import { releaseFocusFromSettings } from '../../../shared/utils/focus-rescue';
import { BlockMediator } from '../../blocks/lib';
import { BasicNodeSettings } from './basic-node-settings';
import { NodeSettingsRules } from './node-settings-rules';
import { useDefaultTitle } from '../../../features/catalog';
import { useDataViewDefinitionStore } from '../../../features/data-view-editor';

// `InputState` of `ui.block-diagram` is not exported, so what the panel takes of it is named here.
type ExclusiveKeyInputState = {
	onExclusive: (combo: string | Array<string>, handler: (event: KeyboardEvent) => void) => () => void;
};

type NodeSettingsSetup = {
	getMessage: () => string;
	getBackgroundImage: () => string;
	blockMediator: BlockMediator;
	makeSnapshot: () => void;
	inputState: ExclusiveKeyInputState;
	blockElMap: Map<string, HTMLElement>;
	blockDiagramRef: Ref<?HTMLElement>;
};

// A refusal of the server that named a construction: the address it sent, where the store found that
// construction (useNodeSettingsStore.resolveConstructionLocation) and the refusal it arrived with.
type AddressedFailure = {
	constructionId: string,
	location: Object,
	reason: Object,
};

// The rows of the rules tab as the panel addresses them in its own DOM. One selector for every
// approach the panel makes: a second one would drift from the rows the first one means.
const RULE_CONSTRUCTION_ROW_SELECTOR = '.editor-chart-node-settings-rule-construction[data-id]';

// The mark the row an approach has led to carries for the eye, while the announcement speaks for the
// screen reader. It is a state and not a flash: the row keeps it until the next approach, so it is
// still marked when the smooth scrolling arrives at it.
const HIGHLIGHTED_ROW_CLASS = '--highlighted';
const HIGHLIGHTED_ROW_SELECTOR = `${RULE_CONSTRUCTION_ROW_SELECTOR}.${HIGHLIGHTED_ROW_CLASS}`;

/**
 * A place of the node an approach leads to: the construction to reach, and the rule that construction
 * belongs to. The rows a blocked save reports and the references the broken-links warning lists are
 * named in the very same shape, so one approach serves both.
 *
 * The last three are named by the rows of a blocked save alone - they are what its announcement is
 * built from - and are absent from a reference of the warning.
 */
type ConstructionTarget = {
	constructionId: string,
	rulePort: NodeBrokenLinkRulePort | null,
	actionTitle?: string,
	hasAutofillConflict?: boolean,
	isServerReported?: boolean,
};

type ConstructionRow = {
	block: ConstructionTarget,
	element: HTMLElement | null,
	isRowHidden?: boolean,
};

/**
 * What tells the approaches apart: what is announced once the row is reached, what is announced when
 * it cannot be reached at all, and whether the row is marked on arrival.
 *
 * `getReachedAnnouncement` is given the row that was actually found - which of the targets it is, is
 * not known before the search - and answers with nothing for a row that is to be reached silently.
 * `unreachableAnnouncement` left out keeps the approach silent about a row it could not bring on
 * screen: a blocked save leads to the inline errors of the row, and those are flagged whether the row
 * is scrolled to or not.
 */
type LeadToConstructionOptions = {
	targets: Array<ConstructionTarget>,
	getReachedAnnouncement: (target: ConstructionTarget) => string | null,
	unreachableAnnouncement?: string | null,
	shouldHighlightRow?: boolean,
};

/**
 * The rule as the panel knows it. A target names the rule by id and type alone, while the switcher of
 * the tab names the rule it shows by the title of its port: a rule opened by such a descriptor would
 * be named by the fallback phrase instead of by itself. The reserved container of a node without
 * input ports is no port of the node and never joins its ports - it stands for itself, and so does a
 * rule whose port is gone.
 */
function resolveRulePort(rulePort: NodeBrokenLinkRulePort, ports: ?Array<Port>): NodeBrokenLinkRulePort
{
	const port = (ports ?? []).find(
		(candidate) => candidate.id === rulePort.id && candidate.type === rulePort.type,
	);

	return port ?? rulePort;
}

/**
 * Brings the panel to the first of the given constructions its rules tab lays out: the tab is brought
 * back, the row is looked up, the rules mode that hides it is opened, and the row is scrolled to.
 * One approach and one announcement for the whole set of targets: without this every blocked row of a
 * press would scroll to itself (leaving the user at the last) and announce the same thing again.
 */
async function leadToConstructionRow(panel: Object, options: LeadToConstructionOptions): Promise<void>
{
	const {
		targets,
		getReachedAnnouncement,
		unreachableAnnouncement = null,
		shouldHighlightRow = false,
	} = options;
	if (targets.length === 0)
	{
		return;
	}

	// The rows live on the rules tab. An approach made from another tab keeps that tab detached
	// (KeepAlive), where no row can be found or scrolled to - so the tab is brought back first, and
	// the search below runs against its rendered rows.
	if (panel.selectedTabId !== NODE_SETTINGS_TABS.rules)
	{
		panel.selectedTabId = NODE_SETTINGS_TABS.rules;
		await panel.$nextTick();
	}

	let row = panel.findFirstBlockedRow(targets);
	// Every row that is not on screen is worth a try, not only one the mode keeps hidden: the section
	// of a rule the overview never lists - a relation rule, the reserved container of a portless node -
	// is not in the DOM at all until the panel has shown that rule (renderedRuleSections), so its row
	// is missing rather than hidden. Opening the rule is what brings it in either way.
	if (row && !row.element)
	{
		await panel.revealBlockedRow(row.block);
		row = panel.findFirstBlockedRow(targets);
	}

	// A row that could not be brought on screen answers with a word of its own where the caller asked
	// for one: an approach that cannot take place must not pass for one that did.
	if (!row?.element && unreachableAnnouncement !== null)
	{
		LiveAnnouncer.announce(unreachableAnnouncement);

		return;
	}

	if (!row)
	{
		return;
	}

	// Before the row is spoken of and scrolled to: the element the approach was made from is gone by
	// now - the switch of the tab takes the detached tab down with it - so a focus left on it would
	// land on <body>, and the place the user was led to would be marked for the eye alone. The row
	// takes the focus itself (RuleConstruction carries tabindex="-1" for it).
	row.element?.focus?.({ preventScroll: true });
	const announcement = getReachedAnnouncement(row.block);
	if (announcement)
	{
		LiveAnnouncer.announce(announcement);
	}
	// One row at a time carries the mark: an approach takes it off the row the previous one marked,
	// whether it marks a row of its own or not.
	Dom.removeClass(panel.$el?.querySelector?.(HIGHLIGHTED_ROW_SELECTOR), HIGHLIGHTED_ROW_CLASS);
	if (shouldHighlightRow)
	{
		Dom.addClass(row.element, HIGHLIGHTED_ROW_CLASS);
	}

	// After the expansion of the rows has been rendered: a row grows as its form comes back, and
	// 'start' plus the scroll-padding-top of the layout lands it right below the sticky header.
	panel.$nextTick(() => {
		// The forms of a rule just expanded mount asynchronously, so the row may still be absent. The
		// expanded rule itself is on screen either way, and leading there beats leading nowhere.
		const target = row.element ?? panel.findRuleSectionElement(row.block?.rulePort?.id);
		target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	});
}
// @vue/component
export const NodeSettings = {
	name: 'NodeSettings',
	components: {
		BasicNodeSettings,
		NodeSettingsRules,
		EditorChartTabs,
		SaveSettingsButton,
		CancelSettingsButton,
		NodeSettingsLayout,
	},
	/**
	 * The approach is the panel's own: the rows it leads to are laid out in its DOM and the tab and the
	 * rules mode that hide them are its state. A surface that names a place to lead to - the broken-
	 * links warning of a section - stands deep inside the tabs and reaches the approach from there.
	 */
	provide(): { leadToConstruction: (options: LeadToConstructionOptions) => Promise<void> }
	{
		return {
			leadToConstruction: this.leadToConstruction,
		};
	},
	setup(): NodeSettingsSetup
	{
		const { getMessage } = useLoc();
		const { makeSnapshot } = useHistory();
		const { inputState, blockElMap, blockDiagramRef } = useBlockDiagram();

		return {
			getMessage,
			getBackgroundImage,
			blockMediator: new BlockMediator(),
			makeSnapshot,
			inputState,
			blockElMap,
			blockDiagramRef,
		};
	},
	created(): void
	{
		// Kept off `data`: neither the claim nor the focus answer is display state.
		this.escapeClaim = null;
		this.isFieldFocused = isEditableElement(document.activeElement);
	},
	mounted(): void
	{
		Event.bind(document, 'focusin', this.onFocusChanged);
		Event.bind(document, 'focusout', this.onFocusChanged);
		this.syncEscapeClaim();
	},
	beforeUnmount(): void
	{
		Event.unbind(document, 'focusin', this.onFocusChanged);
		Event.unbind(document, 'focusout', this.onFocusChanged);
		this.releaseEscapeClaim();
	},
	watch: {
		isShown(): void
		{
			this.syncEscapeClaim();
		},
		isDataViewEditorOpen(): void
		{
			this.syncEscapeClaim();
		},
	},
	computed:
	{
		...mapState(useDiagramStore, ['documentType', 'blocks', 'isWriteLocked']),
		...mapState(useDataViewDefinitionStore, { isDataViewEditorOpen: 'isOpen' }),
		...mapState(useNodeSettingsStore, [
			'isLoading',
			'isShown',
			'block',
			'nodeSettings',
			'ports',
			'isResolvingActionPrefill',
			'requiredFieldsBlocks',
			'currentRule',
		]),
		...mapWritableState(useNodeSettingsStore, ['isSaving', 'selectedTabId']),
		moreMenuItems(): Array<MenuItemOptions>
		{
			return this.block ? this.blockMediator.getSettingsBlockMenuOptions(this.block) : [];
		},
		tabs(): Map
		{
			return new Map(
				[
					[
						NODE_SETTINGS_TABS.basic,
						{
							id: NODE_SETTINGS_TABS.basic,
							title: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_TAB_BASIC'),
							content: BasicNodeSettings,
						},
					],
					[
						NODE_SETTINGS_TABS.rules,
						{
							id: NODE_SETTINGS_TABS.rules,
							title: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_TAB_RULES'),
							content: NodeSettingsRules,
						},
					],
				],
			);
		},
	},
	methods:
	{
		...mapActions(useAppStore, [
			'hideRightPanel',
		]),
		...mapActions(useNodeSettingsStore, [
			'discardFormSettings',
			'toggleVisibility',
			'reset',
			'saveRule',
			'saveForm',
			'syncRelation',
			'syncAuxPorts',
			'beginRequiredFieldsBlockPass',
			'reportRequiredFieldsBlock',
			'resolveConstructionLocation',
			'setCurrentRule',
			'setRelationsSurface',
			'expandConstruction',
		]),
		...mapActions(useNodeDataInspectorStore, ['resetDataInspector']),
		...mapActions(useDiagramStore, [
			'updateBlockActivityField',
			'setPorts',
			'saveDraftWithStatus',
		]),
		// Every way out of the panel goes through here - the cross, Escape and a finished save - so
		// they all leave the keyboard in the same place: on the node the panel was about.
		hideSettings(): void
		{
			this.returnFocusToCanvas();
			this.hideRightPanel();
			this.toggleVisibility(false);
			this.reset();
			this.resetDataInspector();
		},
		returnFocusToCanvas(): void
		{
			const blockElement = this.blockElMap?.get(this.block?.id) ?? null;

			releaseFocusFromSettings([blockElement, this.blockDiagramRef]);
		},
		onClose(): void
		{
			this.discardFormSettings();
			this.hideSettings();
		},
		// Escape repeats the cross of this branch whole: closing here starts by discarding the
		// form, which `hideSettings()` alone does not do. The cross is blocked by CSS while a save
		// is in flight, and discarding the form under a pending save leaves its response without
		// the settings it writes back, so Escape stands down for the same stretch.
		onEscapeClose(): void
		{
			if (isKeyboardBusyByOverlay() || this.isSaving)
			{
				return;
			}

			this.onClose();
		},
		// Escape typed in a field belongs to the field, and closing here discards the whole form -
		// a press meant to undo the typing must not take the edits with it. The data view editor
		// window is a modal of its own and is unknown to `isKeyboardBusyByOverlay()`, so the claim
		// is given up for as long as it stands open.
		syncEscapeClaim(): void
		{
			if (this.isShown && !this.isFieldFocused && !this.isDataViewEditorOpen)
			{
				this.claimEscape();

				return;
			}

			this.releaseEscapeClaim();
		},
		// `focusout` names where the focus goes next, `focusin` where it landed; see `catalog.js`.
		onFocusChanged(event: FocusEvent): void
		{
			this.isFieldFocused = isEditableElement(
				event.type === 'focusout' ? event.relatedTarget : event.target,
			);
			this.syncEscapeClaim();
		},
		claimEscape(): void
		{
			if (this.escapeClaim === null)
			{
				this.escapeClaim = this.inputState.onExclusive(KEY_TOKEN.ESCAPE, this.onEscapeClose);
			}
		},
		releaseEscapeClaim(): void
		{
			this.escapeClaim?.();
			this.escapeClaim = null;
		},
		/**
		 * Leads the user to the block their press ran into, at the first blocked row of the tab. Each
		 * blocked row has already expanded itself, so the inline errors are there once the row is
		 * reached. A press blocked by another form (base settings, filter) reports no row and is left
		 * as it was: that form flags itself where the user already is.
		 */
		leadToRequiredFieldsBlock(): Promise<void>
		{
			return leadToConstructionRow(this, {
				targets: this.requiredFieldsBlocks,
				getReachedAnnouncement: (target: ConstructionTarget) => {
					// Only the pre-save check of the panel speaks here: its phrase says the required fields of
					// the action are empty, which is true of that check by definition. A record built from a
					// refusal of the server reaches the same approach for reasons of another nature as well - a
					// value the field type rejects, a document type the user has no access to - and the phrase
					// would then name the wrong cause. That cause is already voiced by the message of the
					// refusal itself, which names the field.
					if (target.isServerReported === true)
					{
						return null;
					}

					// A conflict of the relation is answered by clearing the field, not by filling it in: telling
					// the user to fill the required fields would name the opposite of what the row asks for.
					return this.getMessage(
						target.hasAutofillConflict === true
							? 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RELATION_CONFLICT_BLOCKED_ANNOUNCE'
							: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_REQUIRED_FIELDS_BLOCKED_ANNOUNCE',
						{ '#ACTION#': target.actionTitle },
					);
				},
			});
		},
		/**
		 * Leads the user to a construction named from outside the panel - a press on a reference of the
		 * broken-links warning. The very approach a blocked save makes, told apart by what it announces
		 * and by the mark it leaves on the row it reaches.
		 */
		leadToConstruction(options: LeadToConstructionOptions): Promise<void>
		{
			return leadToConstructionRow(this, options);
		},
		/**
		 * Brings onto the screen the mode that shows the rule of a row. The overview is the one mode
		 * that shows every ordinary rule of the node at once, and it is where a row of such a rule is
		 * reachable. A rule the overview never lists - a relation rule, the reserved container of a
		 * node without input ports - is shown by opening that very rule instead: in the overview its
		 * section stays rendered and hidden, so the row would otherwise be announced and never reached.
		 * A record naming no rule (a row of an action of the basic tab) is left to the overview.
		 */
		async revealBlockedRow(block: ConstructionTarget): Promise<void>
		{
			// The row of an ordinary rule is hidden by its own collapsing now, not only by the mode:
			// a collapsed rule keeps no row in the DOM until it has been expanded once.
			this.expandConstruction(block.constructionId);

			const rulePort = block.rulePort ?? null;
			// The surface first: a blocked row of an input is not reachable while the relations are on
			// screen, and the other way round. Then the rule itself - a relation and the reserved
			// container are shown alone, an input inside the list of inputs. Both are set without asking
			// whether that rule is the current one already: the surface of a relation rule is named nowhere
			// else, and setting them again is what keeps the panel where it is.
			this.setRelationsSurface(rulePort?.type === PORT_TYPES.inputRelation);
			const targetRule = rulePort && rulePort.type !== PORT_TYPES.input
				? resolveRulePort(rulePort, this.ports)
				: null
			;
			this.setCurrentRule(targetRule);

			await this.$nextTick();
		},
		/** Section of a rule as the tab renders it, for the fallback of leadToConstructionRow. */
		findRuleSectionElement(rulePortId: ?string): HTMLElement | null
		{
			if (!rulePortId)
			{
				return null;
			}

			return this.$el?.querySelector?.(`[data-rule-port-id="${rulePortId}"]`) ?? null;
		},
		/**
		 * The first of the given rows as the tab lays them out, with the element to bring into view.
		 * The rows the save press blocked are what this answers for by default, and any other set of
		 * places to lead to is asked for by naming it.
		 *
		 * The rows are read off the DOM and not off the order they were named in: a row that was mounted
		 * later (a section reached after the others, a card just added) is named later while sitting
		 * above them. A row rendered but hidden - its section belongs to another rules mode - cannot be
		 * led to as it is, so it is named with `isRowHidden` and no element; a row the panel cannot find
		 * at all is named the same way, only without the flag. Either way there is no element to bring
		 * into view, and the approach opens the rule of the row before looking again
		 * (leadToConstructionRow).
		 */
		findFirstBlockedRow(targets: Array<ConstructionTarget> = this.requiredFieldsBlocks): ConstructionRow | null
		{
			if (targets.length === 0)
			{
				return null;
			}

			const targetByConstructionId = new Map(targets.map((target) => [target.constructionId, target]));
			const rows = this.$el?.querySelectorAll?.(RULE_CONSTRUCTION_ROW_SELECTOR) ?? [];
			let hidden = null;
			for (const element of rows)
			{
				const block = targetByConstructionId.get(element.dataset.id);
				if (!block)
				{
					continue;
				}
				if (element.offsetParent !== null)
				{
					return { block, element };
				}
				hidden ??= { block, element: null, isRowHidden: true };
			}

			return hidden ?? { block: targets[0], element: null };
		},
		/**
		 * The addresses the errors of the given refusals name: the construction, where the store found
		 * it and the refusal it arrived with. A refusal carrying several errors carries one address for
		 * all of them, so every error of it answers with the same construction.
		 * An error without customData, an error whose customData names no construction and an address
		 * the store does not know are all legal: such a refusal belongs to no construction at all.
		 */
		resolveAddressedFailures(reasons: Array<Object>): Array<AddressedFailure>
		{
			const failures = [];
			reasons.forEach((reason: Object) => {
				(reason?.errors ?? []).forEach((error: Object) => {
					const constructionId = error?.customData?.constructionId;
					const location = constructionId ? this.resolveConstructionLocation(constructionId) : null;
					if (location)
					{
						failures.push({ constructionId, location, reason });
					}
				});
			});

			return failures;
		},
		/**
		 * Raises one of the refusals of a save and, when it names a construction, leads the user to that
		 * very row first (ALG-01). The target is the construction standing first in the traversal order
		 * of the panel, so the row reached does not depend on the order the requests answered in.
		 * Nothing named a construction - the first refusal is raised as before: the catch of onSave
		 * voices its message and nothing is opened.
		 */
		raiseSaveRefusal(reasons: Array<Object>): void
		{
			const target = this.resolveAddressedFailures(reasons).reduce(
				(first: AddressedFailure | null, failure: AddressedFailure) => {
					return first === null || failure.location.order < first.location.order ? failure : first;
				},
				null,
			);
			if (!target)
			{
				throw reasons[0];
			}

			this.reportRequiredFieldsBlock({
				constructionId: target.constructionId,
				// The rule of the row: without it the panel could not open the section a blocked row of a
				// relation rule or of the reserved container sits in.
				rulePort: target.location.rulePort,
				// No actionTitle: it is read by the announcement alone, and a record of the server is not
				// announced (see leadToRequiredFieldsBlock).
				isServerReported: true,
			});
			// Not awaited, exactly as the pre-save branch of onSave does it: the approach runs at its own
			// pace while the refusal travels on to the catch that voices it.
			this.leadToRequiredFieldsBlock();

			throw target.reason;
		},
		/**
		 * Sends every rule of the node, in parallel as before, and waits for all of them to settle: the
		 * refusal raised is chosen by the order of the rows on screen and not by the order of the
		 * answers, so one press always leads to the same row.
		 * Waiting for all of them is what that costs: the button stays busy until the last request
		 * settles, and for refusals carrying no address the message shown is the one of the first rule
		 * instead of the one of whichever rule answered first.
		 */
		async saveRules(): Promise<void>
		{
			const rulesIds = [...this.nodeSettings.rules.keys()];
			const settled = await Promise.allSettled(
				rulesIds.map((ruleId) => this.saveRule(ruleId, this.documentType)),
			);
			const reasons = settled
				.filter((outcome) => outcome.status === 'rejected')
				.map((outcome) => outcome.reason)
			;
			if (reasons.length > 0)
			{
				this.raiseSaveRefusal(reasons);
			}
		},
		syncRelations(): void
		{
			const relationsIds = [...this.nodeSettings.relations.keys()];
			relationsIds.forEach((relationId) => this.syncRelation(relationId));
		},
		async saveSettings(): Promise<void>
		{
			const { waitForCatalog, getDefaultTitle } = useDefaultTitle();
			await waitForCatalog();
			const activityData = await this.saveForm(
				this.documentType,
				getDefaultTitle(this.block.activity, this.block.node?.defaultTitle),
			);
			// Only after the server accepted the node: port sync deletes schema connections, so running
			// it before a save that may still fail would leave the diagram without a rollback.
			this.syncRelations();
			this.syncAuxPorts();
			this.updateBlockActivityField(this.block.id, activityData);
			const prevBlock = this.blocks.find((block) => block.id === this.block.id);
			const prevPortsSignature = getPortsSignature(prevBlock?.ports);
			this.setPorts(this.block.id, this.ports);
			// The panel closes right after this save, so a refusal that stayed inside the store would
			// leave the person with a closed dialog and nothing saved: the store reports it in the
			// header and, for a coded refusal, in a toast of its own.
			await this.saveDraftWithStatus();
			if (getPortsSignature(this.ports) !== prevPortsSignature)
			{
				this.makeSnapshot();
			}
		},
		async onSave(): Promise<void>
		{
			// Settings travel to the server on their own action, outside the draft write the store
			// guards, so the lock is checked here and not only by hiding the button.
			if (this.isWriteLocked)
			{
				return;
			}

			// An action being added is still resolving what it inherits: saving now would persist the
			// rules without it and close the panel, and the insertion landing afterwards would be
			// rejected by its own context check — the user would see a successful save and lose the
			// action silently. The dimmed button is out of neither the mouse's nor the keyboard's
			// reach (aria-disabled keeps it live), so the press is answered instead of ignored.
			if (this.isResolvingActionPrefill)
			{
				LiveAnnouncer.announce(this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ADD_PENDING_ANNOUNCE'));

				return;
			}

			this.isSaving = true;
			try
			{
				// A subscribed "Create" form returns true from its BEFORE_SUBMIT handler when it still has empty
				// required fields (already flagged inline). Block the save so an invalid node is not persisted;
				// the inline errors explain why, so no extra alert is raised.
				// The rows whose own form is off screen answer the same check and report themselves here
				// instead (see leadToRequiredFieldsBlock): the tab shows every rule of the node at once, so
				// one press can block several of them.
				this.beginRequiredFieldsBlockPass();
				const validations = await EventEmitter.emitAsync(EVENT_NAMES.BEFORE_SUBMIT_EVENT);
				if (Array.isArray(validations) && validations.some(Boolean))
				{
					this.leadToRequiredFieldsBlock();

					const error = new Error('Required fields validation failed');
					error.required = true;

					throw error;
				}

				await this.saveRules();
				// The same parse for the node itself: an address can reach it from a relation rule, the
				// only kind of rule this action normalizes.
				try
				{
					await this.saveSettings();
				}
				catch (error)
				{
					this.raiseSaveRefusal([error]);
				}
				this.hideSettings();
			}
			catch (error)
			{
				// The required-fields case is already flagged inline; everything else must be voiced,
				// including plain Error instances that carry no server error collection.
				if (error?.required !== true)
				{
					const message = error?.errors?.[0]?.message
						?? this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_SAVE_ERROR');
					MessageBox.alert(Text.encode(message));
				}
			}
			finally
			{
				this.isSaving = false;
			}
		},
	},
	template: `
		<NodeSettingsLayout
			:isLoading="isLoading"
			:isSaving="isSaving"
			:isShown="isShown"
			@close="onClose"
		>
			<template #header>
				<slot
					name="header"
					:block="block"
					:title="nodeSettings?.title"
					:moreMenuItems="moreMenuItems"
					:onDeletedBlock="onClose"
				/>
			</template>

			<template #tabs>
				<EditorChartTabs
					v-model="selectedTabId"
					:tabs="tabs"
				/>
			</template>

			<template #data-inspector-toggle>
				<slot name="data-inspector-toggle" />
			</template>

			<template #content>
				<KeepAlive>
					<component
						:is="tabs.get(this.selectedTabId).content"
					/>
				</KeepALive>
			</template>

			<template #actions>
				<SaveSettingsButton
					v-if="!isWriteLocked"
					:isSaving="isSaving"
					:isDisabled="isResolvingActionPrefill"
					:data-test-id="$testId('complexNodeSettingsSave')"
					@click="onSave"
				/>
				<CancelSettingsButton
					:data-test-id="$testId('complexNodeSettingsDiscard')"
					@click="onClose"
				/>
			</template>
		</NodeSettingsLayout>
	`,
};
