/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {};
this.BX.Socialnetwork.V2.Components = this.BX.Socialnetwork.V2.Components || {};
(function (exports, ui_vue3_components_button, socialnetwork_v2_const, socialnetwork_v2_components_elements_uiPopup, ui_vue3, ui_system_radiobutton, ui_system_typography_vue, ui_system_menu_vue, ui_iconSet_api_vue) {
	'use strict';

	// @vue/component
	const RadioGroupFieldset = ui_vue3.defineComponent({
		name: 'RadioGroupFieldset',
		components: {
			RadioButton: ui_system_radiobutton.Vue.RadioButton
		},
		props: {
			items: {
				type: Array,
				required: true
			},
			ariaLabel: {
				type: String,
				default: ''
			}
		},
		emits: ['change'],
		computed: {
			selectedValue() {
				return this.items.find(option => option.selected)?.value;
			}
		},
		methods: {
			handleOptionClick(value, event) {
				if (event.target instanceof HTMLElement && event.target.closest('label')) {
					return;
				}
				this.$emit('change', value);
			}
		},
		template: `
		<fieldset
			class="socialnetwork--auto-delete-popup-radio__container"
			role="radiogroup"
			:aria-label="ariaLabel || null"
			data-testid="auto-delete-popup-radio-group"
		>
			<div
				v-for="option in items"
				:key="option.value"
				class="socialnetwork--auto-delete-popup-radio__option"
				:data-testid="'auto-delete-popup-radio-option-' + option.value"
				@click="handleOptionClick(option.value, $event)"
			>
				<RadioButton
					group="socialnetwork-auto-delete-popup-radio"
					:modelValue="selectedValue === option.value"
					:aria-label="option.text"
					:data-testid="'auto-delete-popup-radio-' + option.value"
					@update:modelValue="$emit('change', option.value)"
				/>
				<span class="socialnetwork--auto-delete-popup-radio__label">{{ option.text }}</span>
			</div>
		</fieldset>
	`
	});

	const delayMap = {
		[socialnetwork_v2_const.AutoDeleteMessageDelay.Off]: 'SONET_AUTO_DELETE_MESSAGE_STATUS_OFF',
		[socialnetwork_v2_const.AutoDeleteMessageDelay.Hour]: 'SONET_AUTO_DELETE_MESSAGE_STATUS_1H',
		[socialnetwork_v2_const.AutoDeleteMessageDelay.Day]: 'SONET_AUTO_DELETE_MESSAGE_STATUS_1D',
		[socialnetwork_v2_const.AutoDeleteMessageDelay.Week]: 'SONET_AUTO_DELETE_MESSAGE_STATUS_1W',
		[socialnetwork_v2_const.AutoDeleteMessageDelay.Month]: 'SONET_AUTO_DELETE_MESSAGE_STATUS_1M'
	};

	function getAutoDeleteStatusText(hours) {
		return delayMap[hours] ?? '';
	}

	// @vue/component
	const AutoDeleteMessagePopup = {
		name: 'AutoDeletePopup',
		components: {
			RadioGroupFieldset,
			UiButton: ui_vue3_components_button.Button,
			UiPopup: socialnetwork_v2_components_elements_uiPopup.UiPopup
		},
		props: {
			delay: {
				type: Number,
				default: socialnetwork_v2_const.AutoDeleteMessageDelay.Off
			}
		},
		emits: ['close', 'change'],
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		data() {
			return {
				selectedDelay: this.delay
			};
		},
		computed: {
			popupId() {
				return 'socialnetwork--auto-delete-message-popup';
			},
			options() {
				return {
					titleBar: this.loc('SONET_AUTO_DELETE_MESSAGE_POPUP_TITLE'),
					height: 390,
					width: 400,
					closeIcon: true,
					targetContainer: document.body,
					fixed: true,
					padding: 0,
					autoHide: true,
					overlay: true,
					contentPadding: 0,
					contentBackground: '#fff',
					className: 'socialnetwork--auto-delete-message-popup'
				};
			},
			items() {
				return Object.values(socialnetwork_v2_const.AutoDeleteMessageDelay).map(value => ({
					value,
					text: this.loc(getAutoDeleteStatusText(value)),
					selected: value === this.selectedDelay
				}));
			}
		},
		methods: {
			handleSelect(value) {
				this.selectedDelay = value;
			},
			handleApply() {
				this.$emit('change', this.selectedDelay);
				this.$emit('close');
			}
		},
		template: `
		<UiPopup :id="popupId" :options @close="$emit('close')">
			<div class="socialnetwork--auto-delete-message-popup__container">
				<div class="socialnetwork--auto-delete-message-popup__info">
					{{ this.loc('SONET_AUTO_DELETE_MESSAGE_POPUP_INFO_MSGVER_1') }}
				</div>
				<RadioGroupFieldset :items="items" :ariaLabel="loc('SONET_AUTO_DELETE_MESSAGE_POPUP_TITLE')" @change="handleSelect"/>
				<div class="socialnetwork--auto-delete-message-popup__footer">
					<UiButton
						:text="loc('SONET_AUTO_DELETE_MESSAGE_POPUP_APPLY')"
						:size="ButtonSize.MEDIUM"
						:style="AirButtonStyle.FILLED"
						data-testid="auto-delete-popup-apply"
						@click="handleApply"
					/>
				</div>
			</div>
		</UiPopup>
	`
	};

	// @vue/component
	const AutoDeleteMessageDropdown = {
		name: 'AutoDeleteMessageDropdown',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			BMenu: ui_system_menu_vue.BMenu,
			TextXs: ui_system_typography_vue.TextXs
		},
		props: {
			delay: {
				type: Number,
				required: true
			},
			targetContainer: {
				type: [HTMLElement, null],
				default: null
			}
		},
		emits: ['change'],
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		data() {
			return {
				menuOpened: false,
				selectedValue: socialnetwork_v2_const.AutoDeleteMessageDelay.Off
			};
		},
		computed: {
			isEnabled() {
				return this.delay !== socialnetwork_v2_const.AutoDeleteMessageDelay.Off;
			},
			autoDeleteText() {
				return this.loc(getAutoDeleteStatusText(this.delay));
			}
		},
		beforeUnmount() {
			this.menuInstance?.destroy();
		},
		methods: {
			toggleMenu() {
				if (this.delay === socialnetwork_v2_const.AutoDeleteMessageDelay.Off) {
					return;
				}
				this.menuOpened = !this.menuOpened;
			},
			getMenuOptions() {
				return {
					id: 'sonet-auto-delete-delay-dropdown',
					bindElement: this.$refs.dropdown.$el,
					targetContainer: this.targetContainer || document.body,
					bindOptions: {
						forceBindPosition: true,
						position: 'bottom'
					},
					offsetTop: 6,
					width: 193,
					items: this.getMenuItems()
				};
			},
			getMenuItems() {
				return Object.values(socialnetwork_v2_const.AutoDeleteMessageDelay).map(delay => {
					return {
						title: this.loc(getAutoDeleteStatusText(delay)),
						isSelected: delay === this.delay,
						onClick: () => this.$emit('change', delay)
					};
				});
			}
		},
		template: `
		<TextXs
			ref="dropdown"
			:className="[
				'socialnetwork--auto-delete-message-dropdown',
				{
					'--enabled': isEnabled
				}
			]"
			role="button"
			aria-haspopup="menu"
			:tabindex="isEnabled ? 0 : -1"
			:aria-expanded="menuOpened ? 'true' : 'false'"
			:aria-disabled="isEnabled ? null : 'true'"
			@click.stop="toggleMenu"
			@keydown.enter.prevent="toggleMenu"
			@keydown.space.prevent="toggleMenu"
		>
			{{ autoDeleteText }}
			<BIcon
				:name="Outline.CHEVRON_DOWN_S"
				:class="['socialnetwork--auto-delete-message-dropdown--icon', { '--open': menuOpened }]"
			/>
		</TextXs>
		<BMenu v-if="menuOpened" :options="getMenuOptions()" @close="menuOpened = false"/>
	`
	};

	exports.AutoDeleteMessageDropdown = AutoDeleteMessageDropdown;
	exports.AutoDeleteMessagePopup = AutoDeleteMessagePopup;

})(this.BX.Socialnetwork.V2.Components.Popup = this.BX.Socialnetwork.V2.Components.Popup || {}, BX.Vue3.Components, BX.Socialnetwork.V2, BX.Socialnetwork.V2.Components.Elements, BX.Vue3, BX.UI.System.RadioButton, BX.UI.System.Typography.Vue, BX.UI.System.Menu, BX.UI.IconSet);
//# sourceMappingURL=auto-delete-popup.bundle.js.map
