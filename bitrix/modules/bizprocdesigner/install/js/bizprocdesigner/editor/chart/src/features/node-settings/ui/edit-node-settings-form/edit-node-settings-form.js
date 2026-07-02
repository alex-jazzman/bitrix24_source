import './style.css';
import { Type } from 'main.core';

import { mapState } from 'ui.vue3.pinia';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { FeatureCode } from 'bizprocdesigner.feature';

import { useLoc, useFeature } from '../../../../shared/composables';
import { PORT_TYPES, BLOCK_TYPES, ACTIVATION_STATUS } from '../../../../shared/constants';

import { useNodeSettingsStore } from '../../../../entities/node-settings';
import { diagramStore, BlockHeader, BlockIcon } from '../../../../entities/blocks';

import { IconButton } from '../../../../shared/ui';

// @vue/component
export const EditNodeSettingsForm = {
	name: 'EditNodeSettingsForm',
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
		ports:
		{
			type: Object,
			required: true,
		},
	},
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
	computed:
	{
		...mapState(useNodeSettingsStore, ['nodeSettings']),
		iconName(): string
		{
			return Outline[this.block?.node?.icon] ?? Outline.FILE;
		},
		rulePorts(): Array<TPort>
		{
			return this.ports
				.filter((port) => port.type === PORT_TYPES.input)
			;
		},
		relationPorts(): Array<TPort>
		{
			return this.ports.filter((port) => port.type === PORT_TYPES.inputRelation);
		},
		rulePortsLength(): number
		{
			return this.rulePorts.length;
		},
		isRelationFeatureAvailable(): boolean
		{
			return this.block.node?.shouldShowAuxPorts !== true
				&& this.isFeatureAvailable(FeatureCode.complexNodeConnections);
		},
		isSubIcon(): boolean
		{
			return this.block.node?.type === BLOCK_TYPES.TOOL
				&& this.block.node?.icon && Outline[this.block.node.icon] !== Outline.DATABASE;
		},
		activationIcon(): string
		{
			return this.block.activity.Activated === ACTIVATION_STATUS.ACTIVE
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
		previewTypes(): Array
		{
			return [
				{
					id: 'rule',
					ports: this.rulePorts,
					sectionTitle: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_SECTION_TITLE'),
					caption: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ITEM_RULE'),
					isAvailable: true,
				},
				{
					id: 'relation',
					ports: this.relationPorts,
					sectionTitle: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONNECTION_SECTION_TITLE'),
					caption: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ITEM_CONNECTION'),
					isAvailable: this.isRelationFeatureAvailable,
				},
			];
		},
	},
	watch:
	{
		rulePortsLength(): void
		{
			this.$nextTick(() => {
				const { scrollHeight, clientHeight } = this.$el;
				if (scrollHeight > clientHeight)
				{
					this.$el.scrollTop = scrollHeight - clientHeight;
				}
			});
		},
	},
	methods:
	{
		onChangeTitle({ target: { value: title } }: InputEvent): void
		{
			this.nodeSettings.title = title;
		},
		onChangeDescription({ target: { value: description } }: InputEvent): void
		{
			this.nodeSettings.description = description;
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
		toggleActivation(event: MouseEvent): void
		{
			this.store.toggleBlockActivation(this.block.id, true);
		},
	},
	template: `
		<div class="editor-chart-node-settings-form">
			<div class="editor-chart-node-settings-form__node-brief">
				<BlockHeader
					:block="block"
					:subIconExternal="isUrl(block.node?.icon)"
					:title="nodeSettings.title"
				>
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
					@click="toggleActivation"
				/>
			</div>
			<div class="editor-chart-node-settings-form__section-delimeter"></div>
			<div class="editor-chart-node-settings-form__section">
				<div>
					<span class="editor-chart-node-settings-form__label">
						{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_NODE_NAME_LABEL') }}
					</span>
					<div class="ui-ctl ui-ctl-textbox editor-chart-node-settings-form__node-name-input">
						<input type="text"
							class="ui-ctl-element"
							:placeholder="getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_NODE_NAME_PLACEHOLDER')"
							:value="nodeSettings.title"
							:data-test-id="$testId('complexNodeName')"
							@input="onChangeTitle"
						/>
					</div>
				</div>
				<div class="editor-chart-node-settings-form__node-description">
					<span class="editor-chart-node-settings-form__label">
						{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_NODE_DESCRIPTION_LABEL') }}
					</span>
					<div class="ui-ctl ui-ctl-textarea editor-chart-node-settings-form__node-description_textarea">
						<textarea
							rows="1"
							class="ui-ctl-element"
							:placeholder="getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_NODE_DESCRIPTION_PLACEHOLDER')"
							:value="nodeSettings.description"
							:data-test-id="$testId('complexNodeDescription')"
							@input="onChangeDescription"
						></textarea>
					</div>
					<p class="editor-chart-node-settings-form__node-description_text">
						{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_NODE_DESCRIPTION_TEXT') }}
					</p>
				</div>
			</div>
			<div class="editor-chart-node-settings-form__section-delimeter"></div>
			<template
				v-for="previewType in previewTypes"
				:key="previewType.id"
			>
				<div
					v-if="previewType.isAvailable"
					class="editor-chart-node-settings-form__section"
				>
					<p class="editor-chart-node-settings-form__section-title">
						{{ previewType.sectionTitle }}
					</p>
					<slot
						v-for="port in previewType.ports"
						:key="port.id"
						:port="port"
						name="preview"
					/>
					<slot
						:itemType="previewType.id"
						:text="previewType.caption"
						name="addSettingsItem"
					/>
				</div>
			</template>
		</div>
	`,
};
