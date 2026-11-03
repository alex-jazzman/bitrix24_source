import { AlertDesign } from 'ui.system.alert';
import { Alert } from 'ui.system.alert.vue';
import { mapState } from 'ui.vue3.pinia';

import {
	NODE_BLOCK_TYPES,
	getUnreachableOutputPortIds,
	useNodeSettingsStore,
} from '../../../../entities/node-settings';
import { useLoc, type GetMessage } from '../../../../shared/composables';
import { PORT_TYPES } from '../../../../shared/constants';
import { type Port } from '../../../../shared/types';

import './style.css';

type UnreachableOutputsAlertSetup = {
	getMessage: GetMessage,
	AlertDesign: typeof AlertDesign,
};

// @vue/component
export const UnreachableOutputsAlert = {
	name: 'UnreachableOutputsAlert',
	components: {
		Alert,
	},
	setup(): UnreachableOutputsAlertSetup
	{
		const { getMessage } = useLoc();

		return {
			getMessage,
			AlertDesign,
		};
	},
	computed:
	{
		...mapState(useNodeSettingsStore, ['nodeSettings', 'ports', 'isBlockAvailable']),
		/**
		 * Whether the warning is about this node at all. The rule-to-output invariant it reports
		 * belongs to the output block: only a node that owns one can have a rule pointing at an
		 * output, and only there is the advice the text gives - add an "Output" action to a rule -
		 * something the user is able to follow. A node the unified panel merely serves (a trigger,
		 * a base node) keeps its ports fixed and its output block closed, so the warning would be
		 * both permanent and unfollowable for it.
		 */
		hasOutputBlock(): boolean
		{
			return this.isBlockAvailable(NODE_BLOCK_TYPES.OUTPUT);
		},
		/**
		 * Outputs of the node no rule points at, in the order of the port column. Relation outputs
		 * live outside the rule and never join them.
		 *
		 * The panel is open, so the answer is read off its rules, the unsaved ones included: an
		 * "Output" construction just added takes its port off the list before any save. Without loaded
		 * settings there is nothing to answer by, and the list stays empty instead of blaming every output.
		 */
		unreachableOutputTitles(): Array<string>
		{
			const settingsRules = this.nodeSettings?.rules ?? null;
			if (!settingsRules)
			{
				return [];
			}

			const outputPorts = (this.ports ?? []).filter((port: Port) => port.type === PORT_TYPES.output);
			const unreachablePortIds = new Set(getUnreachableOutputPortIds(
				outputPorts.map((port: Port) => port.id),
				{ settingsRules },
			));

			return outputPorts
				.filter((port: Port) => unreachablePortIds.has(port.id))
				.map((port: Port) => port.title)
			;
		},
		hasUnreachableOutputs(): boolean
		{
			return this.unreachableOutputTitles.length > 0;
		},
		// Russian carries the number of outputs in both the noun and the verb, so the count picks the phrase.
		alertText(): string
		{
			const titles = this.unreachableOutputTitles;
			const phraseCode = titles.length === 1
				? 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_UNREACHABLE_OUTPUTS_ALERT_ONE'
				: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_UNREACHABLE_OUTPUTS_ALERT_MANY';

			return this.getMessage(phraseCode, { '#OUTPUTS#': titles.join(', ') }) ?? '';
		},
	},
	/**
	 * The warning appears while the panel is already open, so the live region has to be in the DOM
	 * before the text it announces. It is an element of this component, not the root of the Alert:
	 * a role passed down as a fallthrough attribute would be lost with the next Alert markup change.
	 *
	 * The node gate stands above that region rather than next to the text: a node the warning cannot
	 * be about gets no live region either, because nothing will ever be announced in it. The gate is
	 * answered by the loaded node descriptor, and this panel mounts its content only once that
	 * descriptor is in, so the region is never added to a node later than the text it announces.
	 */
	template: `
		<div
			v-if="hasOutputBlock"
			class="editor-chart-unreachable-outputs-alert"
			:class="{ '--filled': hasUnreachableOutputs }"
			role="status"
			aria-live="polite"
		>
			<Alert
				v-if="hasUnreachableOutputs"
				:design="AlertDesign.tintedWarning"
				data-testid="bizprocdesigner-node-settings-unreachable-outputs-alert"
			>
				{{ alertText }}
			</Alert>
		</div>
	`,
};
