import { ajax, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { mapState } from 'ui.vue3.pinia';

import { diagramStore } from '../../../../entities/blocks';
import { useNodeSettingsStore } from '../../../../entities/node-settings';
import { BxControl } from '../../directives/bx-control';
import { FormInputTracker } from '../../directives/form-input-tracker';
import { handleBpSelectorButtonClick } from '../../utils/bp-selector-button';

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
	},
	emits: ['update:modelValue'],
	computed: {
		...mapState(useNodeSettingsStore, ['block', 'currentRule']),
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
		};
		EventEmitter.subscribe('BX.Bizproc.FieldType.onDesignerRenderControlFinished', this.renderFinishedHandler);
	},
	unmounted(): void
	{
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
				portId: this.currentRule.id,
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
