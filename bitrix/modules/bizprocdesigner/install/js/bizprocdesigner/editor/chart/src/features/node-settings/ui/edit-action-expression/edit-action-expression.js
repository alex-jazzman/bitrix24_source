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
	data(): { isExpanded: boolean; }
	{
		return {
			isExpanded: true,
		};
	},
	computed:
	{
		...mapState(useNodeSettingsStore, ['nodeSettings', 'block', 'currentRule', 'currentSettingsItems']),
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
		selectedAction(): ActionDictEntry
		{
			return this.nodeSettings.actions.get(this.selectedActionId);
		},
		selectedActionId:
		{
			get(): string
			{
				return this.construction.expression.actionId ?? '';
			},
			set(actionId: string): void
			{
				this.isActionFormLoading = true;
				this.changeRuleExpression(this.construction, {
					actionId,
					activityData: null,
				});
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
	},
	methods:
	{
		...mapActions(useNodeSettingsStore, ['changeRuleExpression']),
		getMenuItems(): Array<MenuItem>
		{
			return [...this.nodeSettings.actions.values()].map(({ id, title }) => {
				return {
					id,
					text: title,
					onclick: () => {
						this.selectedActionId = id;
						this.menu.close();
					},
				};
			});
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
					@click="onShowMenu"
				>
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
					<div class="ui-ctl-element">
						{{ currentActionTitle }}
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
			<div class="editor-chart-node-settings-edit-action-expression-form__item">
				<div
					v-if="selectedActionId"
					class="editor-chart-node-settings-edit-action-expression-form__label"
				>
					<span>
						{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EXPRESSION_VALUE') }}
					</span>
					<BIcon
						v-if="isExpanded"
						name="minus-20"
						color="#828b95"
						@click="isExpanded=false"
					/>
					<BIcon
						v-else
						name="plus-20"
						color="#828b95"
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
				v-show="!isActionFormLoading"
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
