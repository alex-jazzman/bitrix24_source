import './style.css';
import { Type } from 'main.core';

import { mapState } from 'ui.vue3.pinia';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { FeatureCode } from 'bizprocdesigner.feature';

import { useLoc, useFeature, useActivationMenu } from '../../../../shared/composables';

import { useNodeSettingsStore } from '../../../../entities/node-settings';
import { diagramStore, BlockHeader, BlockIcon } from '../../../../entities/blocks';
import { BLOCK_TYPES } from '../../../../shared/constants';

// eslint-disable-next-line no-unused-vars
import type { Block } from '../../../../shared/types';
import { IconButton } from '../../../../shared/ui';

// @vue/component
export const EditNodeSettingsForm = {
	name: 'edit-node-settings-form',
	components: {
		BIcon,
		IconButton,
		BlockHeader,
		BlockIcon,
	},
	props:
	{
		/** @type Block */
		block:
		{
			type: Object,
			required: true,
		},
	},
	emits: ['updateTitle', 'updateDescription'],
	setup(): { getMessage: () => string; }
	{
		const store: diagramStore = diagramStore();
		const { getMessage } = useLoc();
		const { isFeatureAvailable } = useFeature();

		return {
			iconSet: Outline,
			getMessage,
			isFeatureAvailable,
			store,
		};
	},
	data(): { activationMenuHelper: useActivationMenu | null, }
	{
		return {
			activationMenuHelper: null,
		};
	},
	computed:
	{
		...mapState(useNodeSettingsStore, ['nodeSettings']),
		iconName(): string
		{
			return Outline[this.block?.node?.icon] ?? Outline.FILE;
		},
		rulePorts(): Array<TPort>
		{
			return this.block.ports.input.filter((port) => !port.isConnectionPort);
		},
		areConnectionsAvailable(): boolean
		{
			return this.isFeatureAvailable(FeatureCode.complexNodeConnections);
		},
		isSubIcon(): boolean
		{
			return this.block.node?.type === BLOCK_TYPES.TOOL
				&& this.block.node?.icon && Outline[this.block.node.icon] !== Outline.DATABASE;
		},
		activationIcon(): string
		{
			return this.block.activity.Activated === 'Y'
				? this.iconSet.PAUSE_L
				: this.iconSet.PLAY_L;
		},
		icon(): string
		{
			if (this.block.node?.type === BLOCK_TYPES.TOOL)
			{
				const mcpLettersKey = 'MCP_LETTERS';

				return Outline[this.block.node.icon] === Outline.DATABASE
					? this.block.node.icon
					: mcpLettersKey;
			}

			return this.block.node?.icon;
		},
		colorIndex(): number
		{
			return this.block.node?.type === BLOCK_TYPES.TOOL ? 0 : this.block.node?.colorIndex;
		},
	},
	created() {
		this.activationMenuHelper = useActivationMenu(this.store);
	},
	methods:
	{
		onChangeTitle({ target: { value: title } }: InputEvent): void
		{
			this.$emit('updateTitle', title);
		},
		onChangeDescription({ target: { value: description } }: InputEvent): void
		{
			this.$emit('updateDescription', description);
		},
		isUrl(value: string): boolean
		{
			if (!value || !Type.isString(value))
			{
				return false;
			}

			try
			{
				const u = new URL(value);

				return u.protocol === 'https:';
			}
			catch
			{
				return false;
			}
		},
		showActivationMenu(event: MouseEvent): void
		{
			this.activationMenuHelper.showActivationMenu(event, this.block);
		},
	},
	template: `
		<div class="node-settings-form">
			<div class="node-settings-form__node-brief">
				<BlockHeader :block="block" :subIconExternal="isUrl(block.node?.icon)">
					<template #icon>
						<BlockIcon
							:iconName="icon"
							:iconColorIndex="colorIndex"
						/>
					</template>
					<template #subIcon
							  v-if="isSubIcon">
						<div
							v-if="isUrl(block.node.icon)"
							:style="getBackgroundImage(block.node.icon)"
							class="ui-selector-item-avatar"
						/>
						<BlockIcon
							v-else
							:iconName="block.node.icon"
							:iconColorIndex="7"
							:iconSize="24"
						/>
					</template>
				</BlockHeader>
				<IconButton
					:icon-name="activationIcon"
					@click="showActivationMenu"
				/>
			</div>
			<div class="node-settings-form__section-delimeter"></div>
			<div class="node-settings-form__section">
				<div>
					<span class="node-settings-form__label">
						{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_NODE_NAME_LABEL') }}
					</span>
					<div class="ui-ctl ui-ctl-textbox node-settings-form__node-name-input">
						<input type="text"
							class="ui-ctl-element"
							:placeholder="getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_NODE_NAME_PLACEHOLDER')"
							:value="block.node.title"
							:data-test-id="$testId('complexNodeName')"
							@input="onChangeTitle"
						/>
					</div>
				</div>
				<div class="node-settings-form__node-description">
					<span class="node-settings-form__label">
						{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_NODE_DESCRIPTION_LABEL') }}
					</span>
					<div class="ui-ctl ui-ctl-textarea node-settings-form__node-description_textarea">
						<textarea
							rows="1"
							class="ui-ctl-element"
							:placeholder="getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_NODE_DESCRIPTION_PLACEHOLDER')"
							:value="nodeSettings.description"
							:data-test-id="$testId('complexNodeDescription')"
							@input="onChangeDescription"
						></textarea>
					</div>
					<p class="node-settings-form__node-description_text">
						{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_NODE_DESCRIPTION_TEXT') }}
					</p>
				</div>
			</div>
			<div class="node-settings-form__section-delimeter"></div>
			<div
				class="node-settings-form__section --data"
				ref="node-settings-form-data-section"
			>
				<!--
				<span
					class="node-settings-form__section-title"
				>
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_DATA_SECTION_TITLE') }}
				</span>
				-->
				<slot
					v-for="[variableName, variableValue] in nodeSettings.variables"
					:key="variableName"
					:variableName="variableName"
					:variableValue="variableValue"
					name="variable"
				/>
				<slot name="addElement" itemType="element" />
			</div>
			<div class="node-settings-form__section">
				<p class="node-settings-form__section-title">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_SECTION_TITLE') }}
				</p>
				<slot
					v-for="port in rulePorts"
					:key="port.id"
					:port="port"
					name="rule"
				/>
				<slot name="addRule" itemType="rule" />
			</div>
			<div
				v-if="areConnectionsAvailable"
				class="node-settings-form__section"
			>
				<p class="node-settings-form__section-title">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONNECTION_SECTION_TITLE') }}
				</p>
				<slot name="addConnection" itemType="connection" />
			</div>
		</div>
	`,
};
