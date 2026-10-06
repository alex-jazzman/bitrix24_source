import { MenuManager } from 'main.popup';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { mapActions, mapState } from 'ui.vue3.pinia';

import { useNodeSettingsStore } from '../../../../entities/node-settings';
import { useLoc } from '../../../../shared/composables';
import { type Port } from '../../../../shared/types';

import './style.css';

let captionIdCounter = 0;

/**
 * SelectRulePort — input switcher inside the Rules card on the rules tab
 * (mockup 1383:21594): shows which input's rules are being edited and lets
 * the user switch between inputs of the same kind right in the card.
 *
 * Renders nothing while there is nothing to switch between: a node with a single input, and a node
 * whose rules live in the reserved container instead of a port (in a trigger no port of its own
 * matches the container), would otherwise show a control that only names the current rule.
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
		...mapState(useNodeSettingsStore, ['ports', 'currentRule']),
		/**
		 * Ports of the same kind as the current rule: input ports map to nodeSettings.rules,
		 * relation ports map to nodeSettings.relations — mixing them in one list would
		 * point the layout at a different collection on switch.
		 */
		selectablePorts(): Array<Port>
		{
			return (this.ports ?? []).filter((port) => port.type === this.currentRule?.type);
		},
		/**
		 * The switcher is shown only where a switch is possible. One port leaves nothing to pick,
		 * and the container of a node without input ports matches no port at all: the whole rules
		 * card would then carry a control that changes nothing.
		 */
		hasSwitchablePorts(): boolean
		{
			return this.selectablePorts.length > 1;
		},
		currentPortTitle(): string
		{
			return this.currentRule?.title
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
				items: this.selectablePorts.map((port) => ({
					id: port.id,
					text: port.title,
					dataset: { testId: `complexNodeRuleSettingsPortSelectItem-${port.id}` },
					onclick: () => {
						this.setCurrentRule(port);
						this.closeMenu();
					},
				})),
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
			v-if="hasSwitchablePorts"
			class="editor-chart-node-settings-select-rule-port"
		>
			<button
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
					aria-hidden="true"
				/>
			</button>
			<span
				:id="captionId"
				class="editor-chart-node-settings-select-rule-port__caption"
			>
				{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_PORT_SELECT_CAPTION') }}
			</span>
		</div>
	`,
};
