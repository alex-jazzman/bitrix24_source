import { ajax, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { mapState } from 'ui.vue3.pinia';

import { diagramStore } from '../../../../entities/blocks';
import { useNodeSettingsStore } from '../../../../entities/node-settings';
import { BxControl } from '../../directives/bx-control';
import { FormInputTracker } from '../../directives/form-input-tracker';
import { handleBpSelectorButtonClick } from '../../utils/bp-selector-button';
import { closeExpressionBuilder, mountExpressionBuilders } from '../../utils/expression-builder-mount';

// @vue/component
export const ConditionValueControl = {
	name: 'ConditionValueControl',
	directives: { BxControl, FormInputTracker },
	props: {
		property: {
			type: Object,
			required: true,
		},
		documentType: {
			type: Array,
			required: true,
		},
		modelValue: {
			required: true,
		},
		fieldName: {
			type: String,
			required: true,
		},
		/**
		 * @type Port | PortlessRule
		 * Rule of the row this control belongs to. Without it the control works on the single rule the
		 * panel shows: only the all-rules mode has no single one, and there every row names its own.
		 */
		rulePort: {
			type: [Object, null],
			default: null,
		},
	},
	emits: ['update:modelValue'],
	computed: {
		...mapState(useNodeSettingsStore, ['block', 'currentRule']),
		/** Rule this control works on: the one of its own row, or the single rule the panel shows. */
		targetRulePort(): Object | null
		{
			return this.rulePort ?? this.currentRule;
		},
		/** Id of that rule, as the expression builder and the value selector take it. */
		targetRulePortId(): string | null
		{
			return this.targetRulePort?.id ?? null;
		},
	},
	data(): {
		renderedNode: HTMLElement | null,
		renderFinishedHandler: (() => void) | null,
		}
	{
		return {
			renderedNode: null,
			renderFinishedHandler: null,
		};
	},
	mounted(): void
	{
		const initialValue = (Type.isObject(this.modelValue) && !Type.isArray(this.modelValue))
			? (this.modelValue[this.fieldName] ?? this.modelValue[`${this.fieldName}_text`] ?? '')
			: this.modelValue;

		this.renderedNode = BX.Bizproc.FieldType.renderControl(
			this.documentType,
			this.property,
			this.fieldName,
			initialValue,
			'designer',
		);

		this.renderFinishedHandler = () => {
			if (typeof BX.Bizproc.Selector !== 'undefined' && this.renderedNode)
			{
				BX.Bizproc.Selector.initSelectors(this.renderedNode);
			}
			mountExpressionBuilders(this.$refs.form, { block: this.block, portId: this.targetRulePortId });
		};
		EventEmitter.subscribe('BX.Bizproc.FieldType.onDesignerRenderControlFinished', this.renderFinishedHandler);

		void this.$nextTick(() => {
			mountExpressionBuilders(this.$refs.form, { block: this.block, portId: this.targetRulePortId });
		});
	},
	unmounted(): void
	{
		closeExpressionBuilder();

		if (this.renderFinishedHandler)
		{
			EventEmitter.unsubscribe('BX.Bizproc.FieldType.onDesignerRenderControlFinished', this.renderFinishedHandler);
		}
		this.renderedNode = null;
		this.renderFinishedHandler = null;
	},
	methods: {
		onChange(): void
		{
			if (!this.$refs.form)
			{
				return;
			}

			const data = ajax.prepareForm(this.$refs.form).data;

			this.$emit('update:modelValue', {
				[this.fieldName]: data[this.fieldName] ?? '',
				[`${this.fieldName}_text`]: data[`${this.fieldName}_text`] ?? '',
			});
		},
		onFormClick(event: MouseEvent): void
		{
			handleBpSelectorButtonClick(event, {
				form: this.$refs.form,
				store: diagramStore(),
				block: this.block,
				portId: this.targetRulePortId,
				onChange: () => this.onChange(),
			});
		},
	},
	template: `
		<form v-if="renderedNode" class="node-settings-panel" ref="form" v-form-input-tracker="onChange" @click.capture="onFormClick">
			<div
				class="field-row"
				v-bx-control="renderedNode"
			></div>
		</form>
	`,
};
