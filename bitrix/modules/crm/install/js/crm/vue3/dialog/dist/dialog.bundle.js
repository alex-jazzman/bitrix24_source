/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core_events, ui_entitySelector) {
	'use strict';

	// @vue/component
	const Dialog = {
		emits: ['onSelectItem', 'onDeselectItem'],
		props: {
			items: {
				type: Array,
				default: []
			},
			tabs: {
				type: Array,
				default: []
			},
			entities: {
				type: Array,
				default: []
			},
			showAvatars: {
				type: Boolean
			},
			multiple: {
				type: Boolean
			},
			context: {
				type: String,
				default: ''
			},
			events: {
				type: Object,
				default: {}
			},
			readOnly: {
				type: Boolean
			},
			preselectedItems: {
				type: Array
			}
		},
		data() {
			return {
				selectedItemTitle: ''
			};
		},
		methods: {
			getDialog() {
				if (!this.dialog) {
					const targetNode = this.$refs.dialog;
					this.dialog = new ui_entitySelector.Dialog({
						targetNode,
						context: this.context,
						multiple: this.multiple,
						dropdownMode: true,
						showAvatars: this.showAvatars,
						enableSearch: true,
						width: 450,
						zIndex: 2500,
						items: this.items,
						preselectedItems: this.preselectedItems,
						entities: this.entities,
						tabs: this.tabs,
						searchOptions: {
							allowCreateItem: false
						},
						events: {
							'Item:onSelect': event => {
								const {
									item: selectedItem
								} = event.getData();
								this.selectedItemTitle = selectedItem.title.text;
								this.emitSelectItem(selectedItem);
							},
							'Item:onDeselect': event => {
								const {
									item: deselectedItem
								} = event.getData();
								this.selectedItemTitle = '';
								this.emitDeselectItem(deselectedItem);
							}
						}
					});
				}
				return this.dialog;
			},
			emitSelectItem(selectedItem) {
				this.$emit('onSelectItem', selectedItem);
			},
			emitDeselectItem(deselectedItem) {
				this.$emit('onDeselectItem', deselectedItem);
			},
			selectItem(itemId) {
				const item = this.dialog.getItem(itemId);
				item?.select();
			},
			show() {
				this.getDialog().show();
			},
			toggleDialog() {
				if (this.readOnly) {
					return;
				}
				const dialog = this.getDialog();
				if (dialog.isOpen()) {
					dialog.hide();
				} else {
					dialog.show();
				}
			},
			destroy() {
				this.dialog?.destroy();
				this.dialog = null;
			}
		},
		computed: {
			elementTitle() {
				return this.items.find(item => item.selected)?.title ?? '';
			},
			customData() {
				return this.items.find(item => item.selected)?.customData ?? '';
			},
			controlClassList() {
				return ['ui-ctl', 'ui-ctl-after-icon', {
					'ui-ctl-dropdown': !this.readOnly
				}];
			},
			iconClassList()
			// @todo
			{
				return ['crm-repeat-sale__segment-sandbox-field-icon', {
					'--color': Boolean(this.customData?.color)
				}];
			},
			iconStyleList() {
				if (this.customData?.color === null) {
					return {};
				}
				return {
					backgroundColor: this.customData.color
				};
			}
		},
		// language=Vue
		template: `
		<div
			:class="controlClassList"
			ref="dialog"
			@click="toggleDialog"
		>
				<div 
				v-if="!readOnly"
				class="ui-ctl-after ui-ctl-icon-angle"
			></div>
			<div class="ui-ctl-element">
				<span class="crm-repeat-sale__sandbox-dialog-field">
					<span 
						:class="iconClassList"
						:style="iconStyleList"
					></span>
					<span
						v-if="entities.length > 0"
						class="crm-repeat-sale__sandbox-dialog-field-value"
					>
						{{selectedItemTitle}}
					</span>
					<span
						v-else
						class="crm-repeat-sale__sandbox-dialog-field-value"
					>
						{{elementTitle}}
					</span>
				</span>
			</div>
		</div>
	`
	};

	exports.Dialog = Dialog;

})(this.BX.Crm.Vue3 = this.BX.Crm.Vue3 || {}, BX.Event, BX.UI.EntitySelector);
//# sourceMappingURL=dialog.bundle.js.map
