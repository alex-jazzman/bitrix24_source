import { MenuManager } from 'main.popup';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { mapActions, mapState } from 'ui.vue3.pinia';

import { useNodeSettingsStore } from '../../../../entities/node-settings';
import { useLoc } from '../../../../shared/composables';
import { PORT_TYPES, PORTLESS_RULE_TYPE, isPortRulesAllowedBlockType } from '../../../../shared/constants';
import { type Port } from '../../../../shared/types';

import './style.css';

let captionIdCounter = 0;

/**
 * SelectRulePort — input switcher inside the Rules card on the rules tab
 * (mockup 1383:21594): shows which input's rules are being edited and lets
 * the user switch between inputs of the same kind right in the card.
 *
 * A live switcher belongs to a node that owns its set of input ports (a complex one). In the rules
 * context its list starts with "all rules", the mode a node opens in: the panel then shows the rules
 * of every input at once, so the control stays there for a node with a single input as well - it
 * switches between the whole list and that one rule. Where the switch leads nowhere it renders
 * nothing: the relations context has no "all rules" item, so a single relation port leaves nothing
 * to pick.
 *
 * Every other node the unified panel serves (a trigger, a base node) keeps its set of rules fixed.
 * There the field is always in the card header and never switches: it names the rules the panel is
 * working on, and a chevron and a menu are left out rather than promising a choice the node does
 * not have.
 *
 * On the relations surface of the tab the switcher works the way it does for the rules: the item
 * leading back to the whole list names the relations, and picking one shows that relation alone.
 *
 * Switching only calls the existing setCurrentRule() store action —
 * the domain model, payload and save flow stay untouched.
 */
// @vue/component
export const SelectRulePort = {
	name: 'SelectRulePort',
	components: { BIcon },
	setup(): { getMessage: () => string; iconSet: Outline; captionId: string }
	{
		const { getMessage } = useLoc();
		captionIdCounter++;

		return {
			getMessage,
			iconSet: Outline,
			captionId: `editor-chart-select-rule-port-caption-${captionIdCounter}`,
		};
	},
	data(): Object
	{
		return {
			isMenuOpen: false,
		};
	},
	created(): void
	{
		// menu instance must stay non-reactive (main.popup Menu)
		this.menu = null;
	},
	computed:
	{
		...mapState(useNodeSettingsStore, ['block', 'ports', 'currentRule', 'isRelationsSurfaceShown']),
		/**
		 * Whether the node owns the set of input ports its rules belong to. Only such a node has
		 * anything to switch between: the set of rules of every other node the unified panel serves is
		 * fixed, so its field names the whole set and opens nothing.
		 */
		supportsPortRules(): boolean
		{
			return isPortRulesAllowedBlockType(this.block?.type);
		},
		/**
		 * The field is part of the card header of every node with a fixed set of rules. Only the
		 * switcher of a node owning its ports can be absent - where its list leads nowhere.
		 */
		isControlShown(): boolean
		{
			return !this.supportsPortRules || this.isSwitchAvailable;
		},
		/**
		 * Ports of the same kind as the current rule: input ports map to nodeSettings.rules,
		 * relation ports map to nodeSettings.relations — mixing them in one list would
		 * point the layout at a different collection on switch.
		 * The all-rules mode is a mode of the rules, so it lists the input ports.
		 */
		selectablePorts(): Array<Port>
		{
			// The surface the tab shows decides the list: on the relations surface the choice is between
			// the relations of the node, everywhere else between its inputs. Without a rule shown the
			// type comes from that surface and not from the rule, which is then null.
			const portType = this.isRelationsSurfaceShown
				? PORT_TYPES.inputRelation
				: (this.currentRule?.type ?? PORT_TYPES.input)
			;

			return (this.ports ?? []).filter((port) => port.type === portType);
		},
		/**
		 * True in the rules context - the all-rules mode itself and any input port of the node.
		 * The relations of a node are a scenario of their own and are never shown next to its rules,
		 * so the item is absent there; the container of a node without input ports has no list to
		 * open at all.
		 */
		isAllRulesAvailable(): boolean
		{
			// The relations are a list of their own, and the item leading back to it is theirs as well.
			if (this.isRelationsSurfaceShown)
			{
				return true;
			}

			return this.currentRule === null || this.currentRule.type === PORT_TYPES.input;
		},
		/**
		 * The switcher leads somewhere. In the rules context the all-rules item is one of the choices,
		 * so a single input port is already a list of two; in the relations context there is no such
		 * item and a single port leaves nothing to pick.
		 */
		isSwitchAvailable(): boolean
		{
			return this.isAllRulesAvailable
				? this.selectablePorts.length > 0
				: this.selectablePorts.length > 1
			;
		},
		/** The item leading back to the whole list names the surface it leads to. */
		currentPortTitleForAll(): string
		{
			return this.getMessage(this.isRelationsSurfaceShown
				? 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ALL_RELATIONS'
				: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ALL_RULES');
		},
		/**
		 * The whole set of rules is named in the all-rules mode and on the reserved container a node
		 * without input ports keeps its rules in: that container is no port and carries no title of
		 * its own to fall back to. Any real port is named by itself.
		 */
		currentPortTitle(): string
		{
			if (this.currentRule === null || this.currentRule.type === PORTLESS_RULE_TYPE)
			{
				return this.currentPortTitleForAll;
			}

			return this.currentRule.title
				|| this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_BLOCK_RULES_INPUT_TITLE');
		},
	},
	beforeUnmount(): void
	{
		this.closeMenu();
	},
	methods:
	{
		...mapActions(useNodeSettingsStore, ['setCurrentRule']),
		onShowMenu({ currentTarget }: PointerEvent): void
		{
			// toggle: a second click on the trigger closes the open menu
			if (this.menu)
			{
				this.closeMenu();

				return;
			}

			this.menu = MenuManager.create({
				id: 'select-rule-port-menu',
				bindElement: currentTarget,
				items: [
					...(this.isAllRulesAvailable ? [this.buildAllRulesItem()] : []),
					...this.selectablePorts.map((port) => ({
						id: port.id,
						text: port.title,
						dataset: { testId: `complexNodeRuleSettingsPortSelectItem-${port.id}` },
						onclick: () => {
							this.setCurrentRule(port);
							this.closeMenu();
						},
					})),
				],
				maxHeight: 200,
				closeByEsc: true,
				autoHide: true,
				cacheable: false,
				events: {
					onShow: () => {
						this.isMenuOpen = true;
					},
					onClose: () => this.handleMenuClose(),
				},
			});
			this.menu.show();
		},
		/**
		 * The item returning the panel to the all-rules mode. Selecting it changes the mode only:
		 * nothing is saved or discarded on the way, so unsaved edits of every rule stay in the form.
		 */
		buildAllRulesItem(): Object
		{
			return {
				id: 'all-rules',
				text: this.currentPortTitleForAll,
				dataset: { testId: 'complexNodeRuleSettingsPortSelectItem-all' },
				onclick: () => {
					this.setCurrentRule(null);
					this.closeMenu();
				},
			};
		},
		handleMenuClose(): void
		{
			this.isMenuOpen = false;
			this.menu = null;
			// return focus to the trigger unless the user moved it elsewhere
			const active = document.activeElement;
			if (!active || active === document.body)
			{
				this.$refs.trigger?.focus();
			}
		},
		closeMenu(): void
		{
			this.menu?.close();
		},
	},
	template: `
		<div
			v-if="isControlShown"
			class="editor-chart-node-settings-select-rule-port"
			:data-test-id="$testId('complexNodeRuleSettingsPortSelectField')"
		>
			<button
				v-if="supportsPortRules"
				type="button"
				ref="trigger"
				class="editor-chart-node-settings-select-rule-port__control"
				:data-test-id="$testId('complexNodeRuleSettingsPortSelect')"
				aria-haspopup="true"
				:aria-expanded="isMenuOpen ? 'true' : 'false'"
				:aria-describedby="captionId"
				@click="onShowMenu"
			>
				<span class="editor-chart-node-settings-select-rule-port__value">{{ currentPortTitle }}</span>
				<BIcon
					:name="iconSet.CHEVRON_DOWN_M"
					:size="20"
					color="var(--ui-color-base-3)"
					:data-test-id="$testId('complexNodeRuleSettingsPortSelectChevron')"
					aria-hidden="true"
				/>
			</button>
			<div
				v-else
				class="editor-chart-node-settings-select-rule-port__control --static"
				:data-test-id="$testId('complexNodeRuleSettingsPortSelect')"
			>
				<span class="editor-chart-node-settings-select-rule-port__value">{{ currentPortTitle }}</span>
			</div>
			<span
				:id="captionId"
				class="editor-chart-node-settings-select-rule-port__caption"
			>
				{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_PORT_SELECT_CAPTION') }}
			</span>
		</div>
	`,
};
