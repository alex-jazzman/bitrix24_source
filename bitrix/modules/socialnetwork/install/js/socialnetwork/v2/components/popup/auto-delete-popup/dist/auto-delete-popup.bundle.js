/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {};
this.BX.Socialnetwork.V2.Components = this.BX.Socialnetwork.V2.Components || {};
(function (exports, socialnetwork_v2_const, socialnetwork_v2_components_elements_uiPopup, socialnetwork_v2_components_elements_uiRadio, ui_system_typography_vue, ui_system_menu_vue, ui_iconSet_api_vue) {
	'use strict';

	// @vue/component
	const RadioGroupFieldset = {
		name: 'RadioGroupFieldset',
		components: {
			UiRadio: socialnetwork_v2_components_elements_uiRadio.UiRadio
		},
		props: {
			items: {
				type: Array,
				required: true
			}
		},
		emits: ['change'],
		computed: {
			selectedValue() {
				return this.items.find(option => option.selected)?.value;
			}
		},
		template: `
		<div class="socialnetwork--auto-delete-popup-radio__container">
			<label v-for="option in items" :key="option.value" class="socialnetwork--auto-delete-popup-radio__option">
				<UiRadio
					:modelValue="selectedValue"
					:value="option.value"
					inputClassName="socialnetwork--auto-delete-popup-radio__input"
					@update:modelValue="this.$emit('change', option.value)"
				/>
				<span class="socialnetwork--auto-delete-popup-radio__label">{{ option.text }}</span>
			</label>
		</div>
	`
	};

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
			UiPopup: socialnetwork_v2_components_elements_uiPopup.UiPopup
		},
		props: {
			delay: {
				type: Number,
				default: socialnetwork_v2_const.AutoDeleteMessageDelay.Off
			}
		},
		emits: ['close', 'change'],
		computed: {
			popupId() {
				return 'socialnetwork--auto-delete-message-popup';
			},
			options() {
				return {
					titleBar: this.loc('SONET_AUTO_DELETE_MESSAGE_POPUP_TITLE'),
					height: 350,
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
					selected: value === this.delay
				}));
			}
		},
		methods: {
			onDelayChange(value) {
				this.$emit('change', value);
				this.$emit('close');
			}
		},
		template: `
		<UiPopup :id="popupId" :options @close="$emit('close')">
			<div class="socialnetwork--auto-delete-message-popup__container">
				<div class="socialnetwork--auto-delete-message-popup__info">
					{{ this.loc('SONET_AUTO_DELETE_MESSAGE_POPUP_INFO_MSGVER_1') }}
				</div>
				<RadioGroupFieldset :items="items" @change="onDelayChange"/>
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
			@click.stop="toggleMenu"
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

})(this.BX.Socialnetwork.V2.Components.Popup = this.BX.Socialnetwork.V2.Components.Popup || {}, BX.Socialnetwork.V2, BX.Socialnetwork.V2.Components.Elements, BX.Socialnetwork.V2.Components.Elements, BX.UI.System.Typography.Vue, BX.UI.System.Menu, BX.UI.IconSet);
//# sourceMappingURL=auto-delete-popup.bundle.js.map
