/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
(function (exports, main_core, ui_vue3, bizproc_fields) {
	'use strict';

	function isSameValue(left, right) {
		if (main_core.Type.isArray(left) && main_core.Type.isArray(right)) {
			return left.length === right.length && left.every((item, index) => item === right[index]);
		}
		return left === right;
	}
	const FieldControl = ui_vue3.defineComponent({
		name: 'BizprocFieldsFieldControl',
		inject: {
			injectedManager: {
				from: 'bizprocFieldManager',
				default: null
			}
		},
		props: {
			params: {
				type: Object,
				required: true
			},
			modelValue: {
				type: [String, Array],
				default: null
			},
			fieldManager: {
				type: Object,
				default: null
			}
		},
		emits: ['update:modelValue'],
		data() {
			const shared = this.fieldManager ?? this.injectedManager;
			return {
				manager: ui_vue3.markRaw(main_core.Type.isNull(shared) ? new bizproc_fields.FieldManager() : ui_vue3.toRaw(shared)),
				ownsManager: main_core.Type.isNull(shared),
				fieldId: null,
				renderedType: null
			};
		},
		watch: {
			modelValue(value) {
				if (main_core.Type.isNull(this.fieldId)) {
					return;
				}
				if (isSameValue(this.manager.getFieldValue(this.fieldId), value)) {
					return;
				}
				this.manager.setFieldValue(this.fieldId, value ?? '');
			},
			params: {
				deep: true,
				handler(value) {
					if (main_core.Type.isNull(this.fieldId)) {
						return;
					}
					if (value.property.Type === this.renderedType) {
						this.manager.applyProperty(this.fieldId, value.property);
						return;
					}
					this.remountField();
				}
			}
		},
		mounted() {
			this.mountField();
		},
		beforeUnmount() {
			if (this.ownsManager) {
				this.manager.destroy();
				return;
			}
			if (!main_core.Type.isNull(this.fieldId)) {
				this.manager.releaseField(this.fieldId);
			}
		},
		methods: {
			mountField() {
				const rendered = this.manager.renderField({
					...this.params,
					value: this.modelValue ?? undefined
				});
				this.fieldId = rendered.fieldId;
				this.renderedType = this.params.property.Type;
				const container = this.$refs.container;
				main_core.Dom.append(rendered.node, container);
				bizproc_fields.initFieldHints(container);
			},
			remountField() {
				if (!main_core.Type.isNull(this.fieldId)) {
					this.manager.releaseField(this.fieldId);
				}
				main_core.Dom.clean(this.$refs.container);
				this.mountField();
			},
			handleChange() {
				if (main_core.Type.isNull(this.fieldId)) {
					return;
				}
				const value = this.manager.getFieldValue(this.fieldId);
				if (main_core.Type.isNull(value)) {
					return;
				}
				this.$emit('update:modelValue', value);
			}
		},
		template: `
		<div
			ref="container"
			class="bizproc-fields-vue-field-control"
			data-testid="bizproc-field-vue-control"
			@change="handleChange"
		></div>
	`
	});

	exports.FieldControl = FieldControl;

})(this.BX.Bizproc.Fields = this.BX.Bizproc.Fields || {}, BX, BX.Vue3, BX.Bizproc.Fields);
//# sourceMappingURL=fields-vue.bundle.js.map
