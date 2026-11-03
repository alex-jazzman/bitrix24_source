import { useHistory } from 'ui.block-diagram';
import { mapState, mapWritableState, mapActions } from 'ui.vue3.pinia';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { LiveAnnouncer } from 'ui.a11y';

import { diagramStore as useDiagramStore } from '../../../../entities/blocks';
import {
	useNodeSettingsStore,
	NodeSettingsPreview,
	getAllAncestorBlocks,
	getPortsSignature,
} from '../../../../entities/node-settings';
import { AddSettingsItem } from '../add-settings-item/add-settings-item';
import { useLoc } from '../../../../shared/composables';
import { PORT_TYPES, NODE_SETTINGS_TABS } from '../../../../shared/constants';
import { type Block, type Port } from '../../../../shared/types';

import './style.css';

const ADD_BUTTON_SELECTOR = '.editor-chart-node-settings-form__add-buttons button';
const CARD_EDIT_BUTTON_SELECTOR = '.editor-chart-node-settings-preview__edit-btn';

/**
 * Gate for the Relations block - driven by the availableBlocks descriptor.
 * Constraint: node must not have aux ports (shouldShowAuxPorts !== true).
 * A node arriving without a descriptor has no relations: the legacy default of
 * normalizeAvailableBlocks resolves relations to false, which is the very verdict the server
 * reports for such a node everywhere else (canvas ports, save).
 *
 * Exported for the same reason the rows and the gate of the rules section are: the warning about the
 * references of the node has to know whether the block that would name them is on screen, and a
 * second reading of that condition would let the two disagree - the block hidden, the references
 * named nowhere.
 */
export function isRelationsBlockShown(block: ?Block, isBlockAvailable: (type: string) => boolean): boolean
{
	return block?.node?.shouldShowAuxPorts !== true && isBlockAvailable('relations');
}

// @vue/component
export const RelationsBlock = {
	name: 'RelationsBlock',
	components: {
		NodeSettingsPreview,
		AddSettingsItem,
		BIcon,
	},
	setup(): { getMessage: () => string; iconSet: Outline; makeSnapshot: () => void }
	{
		const { getMessage } = useLoc();
		const { makeSnapshot } = useHistory();

		return {
			getMessage,
			iconSet: Outline,
			makeSnapshot,
		};
	},
	computed:
	{
		...mapState(useDiagramStore, ['connections']),
		...mapState(useNodeSettingsStore, [
			'block',
			'ports',
			'nodeSettings',
			'isBlockAvailable',
			'canAddRelation',
		]),
		...mapWritableState(useNodeSettingsStore, ['selectedTabId']),
		isVisible(): boolean
		{
			return isRelationsBlockShown(this.block, this.isBlockAvailable);
		},
		relationPorts(): Array<Port>
		{
			return this.ports
				? this.ports.filter((port) => port.type === PORT_TYPES.inputRelation)
				: [];
		},
		// Same reason as in BasicNodeSettings: the preview watches this prop, so its value must keep
		// its identity between renders of this block.
		ancestorBlocksByPortId(): { [string]: Array<Block> }
		{
			return Object.fromEntries(
				this.relationPorts.map((port: Port) => [port.id, getAllAncestorBlocks(this.block, port.id)]),
			);
		},
	},
	methods:
	{
		...mapActions(useNodeSettingsStore, ['deletePort', 'deleteRuleSettings', 'setCurrentRule']),
		...mapActions(useDiagramStore, [
			'getBlockAncestorsByInputPortId',
			'saveDraftWithStatus',
			'deleteConnectionByBlockIdAndPortId',
		]),
		onShowRelationConstructions(port: Port): void
		{
			this.selectedTabId = NODE_SETTINGS_TABS.rules;
			// The relation of the row and it alone: the whole list is one item away, in the selector
			// above it ("all relations").
			this.setCurrentRule(port);
		},
		async deleteRelation(relationId: string): Promise<void>
		{
			const prevConnectionsCount = this.connections.length;
			const prevPortsSignature = getPortsSignature(this.ports);
			this.deletePort(relationId);
			const { outputPortsToDelete } = this.deleteRuleSettings(relationId);
			outputPortsToDelete.forEach((portId) => {
				this.deletePort(portId);
				this.deleteConnectionByBlockIdAndPortId(this.block.id, portId);
			});
			this.deleteConnectionByBlockIdAndPortId(this.block.id, relationId);
			const isConnectionRemoved = this.connections.length < prevConnectionsCount;
			if (isConnectionRemoved)
			{
				await this.saveDraftWithStatus();
			}
			const isCanvasChanged = getPortsSignature(this.ports) !== prevPortsSignature
				|| isConnectionRemoved;
			if (isCanvasChanged)
			{
				this.makeSnapshot();
			}
		},
		/**
		 * The press on the delete button of a card, as opposed to the removal itself: the store part of
		 * `deleteRelation` runs before its first await, so the card is already gone from the state here
		 * and the focus is handed over on the very render that removes its button — without waiting for
		 * the draft to be saved. The removal itself is shared with the canvas and knows nothing of focus.
		 */
		async onDeleteRelation(relationId: string): Promise<void>
		{
			const removal = this.deleteRelation(relationId);
			this.handleRelationDeleted();

			await removal;
		},
		/**
		 * The add action removes itself the moment the limit of the node is reached (v-if), and the
		 * focus of the keyboard would leave the panel for the canvas with it. The card the press has
		 * just produced is where the focus belongs, and the addition is announced on top of that:
		 * nothing else on the screen reports it, and the action being gone has to be said as well.
		 */
		handleRelationAdded(): void
		{
			this.$nextTick(() => {
				if (!this.focusLastRelationCard())
				{
					return;
				}

				LiveAnnouncer.announce(this.getMessage(
					this.canAddRelation
						? 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RELATION_ADDED_ANNOUNCE'
						: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RELATION_ADDED_LIMIT_ANNOUNCE',
				));
			});
		},
		/**
		 * The delete button goes away with the card it sits on, so the focus is handed over on the
		 * render that removes it: to the add action the freed limit brings back, and to the card left
		 * on screen while the node still holds one.
		 */
		handleRelationDeleted(): void
		{
			this.$nextTick(() => {
				const addButton = this.blockElement()?.querySelector(ADD_BUTTON_SELECTOR);
				if (addButton)
				{
					addButton.focus();
				}
				else
				{
					this.focusLastRelationCard();
				}

				LiveAnnouncer.announce(
					this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RELATION_DELETED_ANNOUNCE'),
				);
			});
		},
		/**
		 * Puts the focus on the last relation card of the block, telling whether the focus is now on it.
		 * The button of a card is on screen with opacity: 0 and shows itself on :hover/:focus-within, so
		 * a rule that hides it outright would leave the focus on the body - on the canvas, out of the
		 * panel - and the caller has to hear about that instead of announcing a move that never happened.
		 */
		focusLastRelationCard(): boolean
		{
			const cardButtons = this.blockElement()?.querySelectorAll(CARD_EDIT_BUTTON_SELECTOR) ?? [];
			const target = cardButtons[cardButtons.length - 1];
			target?.focus();

			return Boolean(target) && document.activeElement === target;
		},
		// The block leaves the panel with the node it belongs to, and a deferred pass can land after
		// that: `$el` is then the placeholder comment of `v-if` and holds no query of its own.
		blockElement(): ?HTMLElement
		{
			return this.$el instanceof HTMLElement ? this.$el : null;
		},
	},
	template: `
		<div
			v-if="isVisible"
			class="editor-chart-node-settings-form__section --relations"
			:data-test-id="$testId('complexNodeSettingsRelationsBlock')"
		>
			<div class="editor-chart-node-settings-form__section-header">
				<div class="editor-chart-node-settings-form__section-header-main">
					<BIcon :name="iconSet.LINK" :size="24"/>
					<span class="editor-chart-node-settings-form__section-title">
						{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RELATIONS_SECTION_TITLE') }}
					</span>
				</div>
				<span class="editor-chart-node-settings-form__section-description">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RELATIONS_SECTION_DESCRIPTION') }}
				</span>
			</div>
			<slot name="notice" />
			<NodeSettingsPreview
				v-for="port in relationPorts"
				:key="port.id"
				:port="port"
				:block="block"
				:nodeSettings="nodeSettings"
				:connectedBlocks="ancestorBlocksByPortId[port.id] ?? []"
				@showConstructions="onShowRelationConstructions(port)"
				@deletePreview="onDeleteRelation(port.id)"
			>
				{{ port.title }}
			</NodeSettingsPreview>
			<div class="editor-chart-node-settings-form__add-buttons">
				<!-- The listener falls through onto the button of the action and runs after its own one,
				so the card is already in the store by the time the focus is handed over. -->
				<AddSettingsItem
					v-if="canAddRelation"
					itemType="relation"
					iconName="plus-m"
					@click="handleRelationAdded"
				>
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ADD_ENTRY_POINT_BUTTON') }}
				</AddSettingsItem>
			</div>
		</div>
	`,
};
