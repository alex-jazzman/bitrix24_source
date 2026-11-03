/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports, ui_iconSet_api_vue, tasks_v2_component_elements_hoverPill) {
	'use strict';

	const FieldAdd = {
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			HoverPill: tasks_v2_component_elements_hoverPill.HoverPill
		},
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		props: {
			icon: {
				type: String,
				required: true
			},
			disabled: {
				type: Boolean,
				default: false
			},
			withTabStop: {
				type: Boolean,
				default: true
			},
			isLocked: {
				type: Boolean,
				default: false
			},
			ariaLabel: {
				type: String,
				default: ''
			},
			ariaHaspopup: {
				type: String,
				default: ''
			},
			ariaExpanded: {
				type: Boolean,
				default: null
			}
		},
		template: `
		<HoverPill :ariaLabel :ariaHaspopup :ariaExpanded :withTabStop>
			<div :class="['b24-field-add', { '--disabled': disabled }]">
				<BIcon :name="icon" aria-hidden="true"/>
				<div>{{ loc('TASKS_V2_FIELD_ADD') }}</div>
				<BIcon v-if="isLocked" :name="Outline.LOCK_L" class="b24-field-add__lock" aria-hidden="true"/>
			</div>
		</HoverPill>
	`
	};

	exports.FieldAdd = FieldAdd;

})(this.BX.Tasks.V2.Component.Elements = this.BX.Tasks.V2.Component.Elements || {}, BX.UI.IconSet, BX.Tasks.V2.Component.Elements);
//# sourceMappingURL=field-add.bundle.js.map
