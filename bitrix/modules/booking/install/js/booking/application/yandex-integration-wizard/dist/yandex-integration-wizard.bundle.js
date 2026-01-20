/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports,ui_vue3,booking_component_mixin_locMixin,booking_lib_sidePanelInstance,booking_model_yandexIntegrationWizard,booking_core,booking_component_loader,booking_component_avatar,booking_application_skuResourcesEditor,booking_lib_deepToRaw,booking_component_helpDeskLoc,booking_component_uiErrorMessage,ui_iconSet_api_vue,booking_utils,booking_component_uiResourceWizardItem,booking_provider_service_mainPageService,ui_vue3_vuex,main_core_events,booking_const,booking_component_button,booking_provider_service_yandexIntegrationWizardService,main_core,main_popup,ui_dialogs_messagebox) {
	'use strict';

	const {
	  mapGetters
	} = ui_vue3_vuex.createNamespacedHelpers(booking_const.Model.YandexIntegrationWizard);

	// @vue/component
	const YandexIntegrationWizardLayout = {
	  name: 'YandexIntegrationWizardLayout',
	  components: {
	    Loader: booking_component_loader.Loader
	  },
	  setup() {
	    return {
	      LoaderType: booking_component_loader.LoaderType
	    };
	  },
	  computed: {
	    ...mapGetters(['isFetching'])
	  },
	  template: `
		<div class="yandex-integration-wizard-layout">
			<div class="yandex-wizard__wrapper">
				<slot name="header"/>
				<div
					class="yandex-wizard__content"
					:class="{ '--loading': isFetching }"
				>
					<slot/>
				</div>
				<Loader
					v-show="isFetching"
					class = "yandex-wizard__loader"
					:options="{ type: LoaderType.DEFAULT }"
				/>
			</div>
			<slot name="footer"/>
		</div>
	`
	};

	// @vue/component
	const YandexIntegrationWizardLayoutHeader = {
	  name: 'YandexIntegrationWizardLayoutHeader',
	  components: {
	    EmptyRichLoc: booking_component_helpDeskLoc.EmptyRichLoc,
	    Icon: ui_iconSet_api_vue.BIcon
	  },
	  setup() {
	    return {
	      IconSet: ui_iconSet_api_vue.Set,
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  computed: {
	    integrationMapsImageUrl() {
	      var _this$loc;
	      const languageId = (_this$loc = this.loc('LANGUAGE_ID')) != null ? _this$loc : 'en';
	      const imageLanguageId = languageId === 'ru' ? 'ru' : 'en';
	      return `/bitrix/js/booking/application/yandex-integration-wizard/images/integrations-maps-${imageLanguageId}.png`;
	    }
	  },
	  template: `
		<div class="yandex-wizard__title">
			{{ loc('YANDEX_WIZARD_TITLE') }}
		</div>
		<div class="yandex-wizard__info">
			<div class="yandex-wizard__info-text">
				<div class="yandex-wizard__info_icon-block">
					<div class="yandex-wizard__info_icon"></div>
				</div>
				<div class="yandex-wizard__info-text_block">
					<div class="yandex-wizard__info-text_title">
						<EmptyRichLoc
							:message="loc('YANDEX_WIZARD_SUB_TITLE')"
							:rules="['br']"
						/>
					</div>
					<div class="yandex-wizard__info-text_points">
						<div class="yandex-wizard__info-text_point">
							<div class="yandex-wizard__info-text_point-icon">
								<Icon
									:name="Outline.OBSERVER"
									color="white"
									:size="14"
								/>
							</div>
							<div class="yandex-wizard__info-text_point-icon-text">
								{{ loc('YANDEX_WIZARD_POINT_1') }}
							</div>
						</div>
						<div class="yandex-wizard__info-text_point">
							<div class="yandex-wizard__info-text_point-icon">
								<Icon
									:name="Outline.FLAG"
									color="white"
									:size="14"
								/>
							</div>
							<div class="yandex-wizard__info-text_point-icon-text">
								{{ loc('YANDEX_WIZARD_POINT_2') }}
							</div>
						</div>
						<div class="yandex-wizard__info-text_point">
							<div class="yandex-wizard__info-text_point-icon">
								<Icon
									:name="Outline.ONLINE_BOOKING"
									color="white"
									:size="14"
								/>
							</div>
							<div class="yandex-wizard__info-text_point-icon-text">
								{{ loc('YANDEX_WIZARD_POINT_3') }}
							</div>
						</div>
					</div>
				</div>
			</div>
			<img 
				class="yandex-wizard__info-map"
				:src="integrationMapsImageUrl"
				:alt="loc('YANDEX_WIZARD_TITLE')"
				draggable="false"
			/>
		</div>
	`
	};

	// @vue/component
	const ConfirmButton = {
	  name: 'ConfirmButton',
	  components: {
	    UiButton: booking_component_button.Button
	  },
	  props: {
	    buttonText: {
	      type: String,
	      required: true
	    },
	    disabled: {
	      type: Boolean,
	      default: false
	    }
	  },
	  setup() {
	    return {
	      ButtonSize: booking_component_button.ButtonSize,
	      ButtonColor: booking_component_button.ButtonColor
	    };
	  },
	  template: `
		<UiButton
			:text="buttonText"
			:size="ButtonSize.LARGE"
			:color="ButtonColor.PRIMARY"
			:disabled
			noCaps
			useAirDesign
		/>
	`
	};

	// @vue/component
	const CancelButton = {
	  name: 'CancelButton',
	  components: {
	    UiButton: booking_component_button.Button
	  },
	  setup() {
	    return {
	      ButtonSize: booking_component_button.ButtonSize,
	      ButtonColor: booking_component_button.ButtonColor
	    };
	  },
	  template: `
		<UiButton
			class="yandex-integration-wizard__cancel-button"
			:text="loc('YANDEX_WIZARD_FOOTER_CANCEL_BUTTON')"
			:size="ButtonSize.LARGE"
			:color="ButtonColor.LINK"
			noCaps
		/>
	`
	};

	const {
	  mapGetters: mapGetters$1,
	  mapActions
	} = ui_vue3_vuex.createNamespacedHelpers(booking_const.Model.YandexIntegrationWizard);

	// @vue/component
	const YandexIntegrationWizardLayoutFooter = {
	  name: 'YandexIntegrationWizardLayoutFooter',
	  components: {
	    ConfirmButton,
	    CancelButton
	  },
	  computed: {
	    ...mapGetters$1({
	      isFetching: 'isFetching',
	      isConnected: 'isConnected',
	      hasChanges: 'hasFormDataChanges',
	      updatedIntegration: 'getUpdatedIntegration',
	      isFormDataValid: 'isFormDataValid'
	    }),
	    confirmButtonText() {
	      return this.isConnected ? this.loc('YANDEX_WIZARD_FOOTER_SAVE_BUTTON') : this.loc('YANDEX_WIZARD_FOOTER_СONNECT_BUTTON');
	    }
	  },
	  methods: {
	    ...mapActions(['setFetching', 'validateFormData']),
	    async onConfirmButtonClick() {
	      this.validateFormData();
	      if (this.isFormDataValid) {
	        await this.updateIntegration();
	      }
	    },
	    async updateIntegration() {
	      this.setFetching(true);
	      try {
	        const wasConnected = this.isConnected;
	        await booking_provider_service_yandexIntegrationWizardService.yandexIntegrationWizardService.updateIntegration(this.updatedIntegration);
	        if (this.isConnected && !wasConnected) {
	          await this.showConfetti();
	        }
	        this.closeWizard();
	      } catch (error) {
	        console.error('Update wizard data error', error);
	        const {
	          Notifier
	        } = await main_core.Runtime.loadExtension('ui.notification-manager');
	        Notifier.notifyViaBrowserProvider({
	          id: 'booking-yiw-update-error',
	          text: this.loc('YANDEX_WIZARD_UPDATE_ERROR')
	        });
	      } finally {
	        this.setFetching(false);
	      }
	    },
	    closeWizard() {
	      main_core_events.EventEmitter.emit(booking_const.EventName.CloseYandexIntegrationWizard);
	    },
	    async showConfetti() {
	      const {
	        Confetti
	      } = await main_core.Runtime.loadExtension('ui.confetti');
	      return Confetti.fire({
	        particleCount: 400,
	        spread: 100,
	        zIndex: BX.SidePanel.Instance.getTopSlider().getZindex() + 1,
	        origin: {
	          y: 0.75,
	          x: 0.75
	        }
	      });
	    }
	  },
	  template: `
		<div v-show="!isFetching && (!isConnected || hasChanges)" class="yandex-integration-wizard__footer">
			<ConfirmButton
				:buttonText="confirmButtonText"
				:disabled="!isFormDataValid"
				@click="onConfirmButtonClick()"
			/>
			<CancelButton @click="closeWizard()"/>
		</div>
	`
	};

	// @vue/component
	const YandexIntegrationWizardSettingsResource = {
	  name: 'YandexIntegrationWizardSettingsResource',
	  components: {
	    UiResourceWizardItem: booking_component_uiResourceWizardItem.UiResourceWizardItem,
	    UiButton: booking_component_button.Button,
	    UiAvatar: booking_component_avatar.Avatar,
	    Icon: ui_iconSet_api_vue.BIcon
	  },
	  // eslint-disable-next-line flowtype/require-return-type
	  setup() {
	    return {
	      ButtonColor: booking_component_button.ButtonColor,
	      ButtonSize: booking_component_button.ButtonSize,
	      Outline: ui_iconSet_api_vue.Outline,
	      Main: ui_iconSet_api_vue.Main
	    };
	  },
	  computed: {
	    selectedResources() {
	      return this.$store.state[booking_const.Model.YandexIntegrationWizard].resources.filter(resource => {
	        return resource.skusYandex.length > 0;
	      });
	    },
	    selectedResourcesCount() {
	      var _this$selectedResourc, _this$selectedResourc2;
	      return (_this$selectedResourc = (_this$selectedResourc2 = this.selectedResources) == null ? void 0 : _this$selectedResourc2.length) != null ? _this$selectedResourc : 0;
	    },
	    buttonTitle() {
	      return this.selectedResourcesCount > 0 ? this.loc('YANDEX_WIZARD_SETTINGS_RESOURCE_BUTTON_MORE') : this.loc('YANDEX_WIZARD_SETTINGS_RESOURCE_BUTTON_CHOOSE');
	    },
	    informTitle() {
	      if (this.selectedResourcesCount > 0) {
	        return main_core.Loc.getMessagePlural('YANDEX_WIZARD_SETTINGS_RESOURCE_STATE', this.selectedResourcesCount, {
	          '#COUNT#': this.selectedResourcesCount
	        });
	      }
	      return this.loc('YANDEX_WIZARD_SETTINGS_RESOURCE_STATE_EMPTY');
	    },
	    imageClass() {
	      switch (this.selectedResourcesCount) {
	        case 0:
	          return '';
	        case 1:
	          return '--one';
	        case 2:
	          return '--two';
	        case 3:
	          return '--three';
	        default:
	          return '--many';
	      }
	    },
	    avatarSize() {
	      switch (this.selectedResourcesCount) {
	        case 1:
	          return 64;
	        case 2:
	          return 46;
	        default:
	          return 32;
	      }
	    },
	    shownResources() {
	      return this.selectedResources.slice(0, 4);
	    },
	    amountHiddenResource() {
	      return Math.max(this.selectedResourcesCount - 4, 0);
	    },
	    integrationStatus() {
	      return this.$store.state[booking_const.Model.YandexIntegrationWizard].integration.status || booking_const.IntegrationMapItemStatus.NOT_CONNECTED;
	    }
	  },
	  methods: {
	    openSkuResourcesEditor() {
	      const editor = new booking_application_skuResourcesEditor.SkuResourcesEditor({
	        title: this.loc('YANDEX_WIZARD_POPUP_RESOURCE_POPUP_TITLE'),
	        description: this.loc('YANDEX_WIZARD_POPUP_RESOURCE_POPUP_DESCRIPTION'),
	        resources: this.getResources(),
	        options: {
	          canAdd: true,
	          canRemove: true,
	          catalogSkuEntityOptions: this.getCatalogSkuEntityOptions()
	        },
	        save: data => this.saveResources(data)
	      });
	      editor.open();
	    },
	    getCatalogSkuEntityOptions() {
	      return this.$store.state[booking_const.Model.YandexIntegrationWizard].integration.catalogSkuEntityOptions;
	    },
	    saveResources(data) {
	      if (main_core.Type.isNil(data) || !main_core.Type.isArray(data.resources)) {
	        return;
	      }
	      const resources = data.resources.map(resource => {
	        return {
	          ...resource,
	          skusYandex: resource.skus
	        };
	      });
	      void this.$store.dispatch(`${booking_const.Model.YandexIntegrationWizard}/updateResourcesSkusYandex`, resources);
	    },
	    getResources() {
	      const notConnected = this.integrationStatus === booking_const.IntegrationMapItemStatus.NOT_CONNECTED;
	      return this.$store.state[booking_const.Model.YandexIntegrationWizard].resources.map(resource => {
	        return {
	          ...resource,
	          avatar: {
	            ...resource.avatar
	          },
	          skus: booking_lib_deepToRaw.deepToRaw(notConnected && resource.skusYandex.length === 0 ? resource.skus : resource.skusYandex)
	        };
	      });
	    }
	  },
	  template: `
		<UiResourceWizardItem
			:iconType="Outline.USER_PROFILE"
			:title="loc('YANDEX_WIZARD_SETTINGS_RESOURCE_TITLE')"
			:description="loc('YANDEX_WIZARD_SETTINGS_RESOURCE_DESCRIPTION')"
			helpDeskType="YandexIntegrationServices"
		>
			<div class="booking-yiw-settings-resource__content --ui-context-content-light">
				<div
					class="booking-yiw-settings-resource__content-icons"
					:class="imageClass"
				>
					<div v-if="selectedResourcesCount === 0"
						 class="booking-yiw-settings-resource__content-icon_empty"
					></div>
					<template v-else>
						<template v-for="resource in shownResources">
							<UiAvatar
								:size="avatarSize"
								:userName="resource.name"
								:userpicPath="resource?.avatar?.url"
								baseColor="#B15EF5"
								class="booking-yiw-settings-resource__ui-avatar"
							/>
						</template>
						<div
							v-if="amountHiddenResource"
							class="booking-yiw-settings-resource__amount-excess-resources"
						>
							+{{ amountHiddenResource }}
						</div>
					</template>
				</div>
				<div class="booking-yiw-settings-resource__content-inform">
					<div class="booking-yiw-settings-resource__content-inform_text">
						{{ informTitle }}
					</div>
					<div class="booking-yiw-settings-resource__content-inform_button-block">
						<UiButton
							:text="buttonTitle"
							:size="ButtonSize.SMALL"
							:color="ButtonColor.PRIMARY"
							noCaps
							useAirDesign
							@click="openSkuResourcesEditor"
						/>
						<div
							v-if="selectedResourcesCount > 0"
							class="booking-yiw-settings-resource__content-inform_done"
						>
							<Icon
								:name="Main.CIRCLE_CHECK"
								color="var(--ui-color-accent-main-success)"
								:size="18"
							/>
							{{ loc('YANDEX_WIZARD_SETTINGS_RESOURCE_STATE_DONE_LABEL') }}
						</div>
					</div>
				</div>
			</div>
		</UiResourceWizardItem>
	`
	};

	// @vue/component
	const YandexIntegrationWizardCabinetLink = {
	  name: 'YandexIntegrationWizardCabinetLink',
	  components: {
	    UiResourceWizardItem: booking_component_uiResourceWizardItem.UiResourceWizardItem,
	    UiErrorMessage: booking_component_uiErrorMessage.UiErrorMessage,
	    EmptyRichLoc: booking_component_helpDeskLoc.EmptyRichLoc,
	    UiButton: booking_component_button.Button,
	    Icon: ui_iconSet_api_vue.BIcon
	  },
	  setup() {
	    return {
	      ButtonColor: booking_component_button.ButtonColor,
	      ButtonSize: booking_component_button.ButtonSize,
	      ButtonIcon: booking_component_button.ButtonIcon,
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  computed: {
	    cabinetLink: {
	      get() {
	        return this.$store.getters[`${booking_const.Model.YandexIntegrationWizard}/getCabinetLink`];
	      },
	      set(link) {
	        this.$store.dispatch(`${booking_const.Model.YandexIntegrationWizard}/setCabinetLink`, {
	          link
	        });
	      }
	    },
	    hasInvalidCabinetLink() {
	      return this.$store.getters[`${booking_const.Model.YandexIntegrationWizard}/hasInvalidCabinetLink`];
	    },
	    cabinetLinkImageUrl() {
	      var _this$loc;
	      const languageId = (_this$loc = this.loc('LANGUAGE_ID')) != null ? _this$loc : 'en';
	      const imageLanguageId = languageId === 'ru' ? 'ru' : 'en';
	      return `/bitrix/js/booking/application/yandex-integration-wizard/images/yandex-cabinet-link-guide-${imageLanguageId}.png`;
	    },
	    yandexBusinessLink() {
	      const integrationSettings = this.$store.getters[`${booking_const.Model.YandexIntegrationWizard}/getIntegrationSettings`];
	      return integrationSettings.businessLink;
	    },
	    cabinetLinkPlaceholder() {
	      const integrationSettings = this.$store.getters[`${booking_const.Model.YandexIntegrationWizard}/getIntegrationSettings`];
	      return integrationSettings.cabinetLinkPlaceholder;
	    }
	  },
	  methods: {
	    goToYandexBusiness() {
	      window.open(this.yandexBusinessLink, '_blank');
	    },
	    validateCabinetLink() {
	      this.$store.dispatch(`${booking_const.Model.YandexIntegrationWizard}/validateCabinetLink`);
	    },
	    setInvalidCabinetLink(isInvalid) {
	      this.$store.dispatch(`${booking_const.Model.YandexIntegrationWizard}/setInvalidCabinetLink`, isInvalid);
	    }
	  },
	  template: `
		<UiResourceWizardItem
			:iconType="Outline.REGISTRATION_ON_SITE"
			:title="loc('YANDEX_WIZARD_CABINET_LINK_TITLE')"
			:description="loc('YANDEX_WIZARD_CABINET_LINK_DESCRIPTION')"
			helpDeskType="YandexIntegration"
		>
			<div class="booking-yiw-cabinet-link__content">
				<div class="booking-yiw-cabinet-link__input-container">
					<label for="yiw-settings-cabinet-link" class="booking-yiw-cabinet-link__input-label">
						{{ loc('YANDEX_WIZARD_CABINET_LINK_INPUT_LABEL') }}
					</label>
					<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
						<input
							type="url"
							data-id="yiw-settings-cabinet-link-input"
							id="yiw-settings-cabinet-link"
							v-model.trim="cabinetLink"
							class="ui-ctl-element"
							:class="{ '--error': hasInvalidCabinetLink }"
							:placeholder="cabinetLinkPlaceholder"
							@blur="validateCabinetLink"
							@focus="setInvalidCabinetLink(false)"
						/>
					</div>
					<UiErrorMessage
						v-if="hasInvalidCabinetLink"
						:message="loc('YANDEX_WIZARD_CABINET_LINK_INVALID_LINK')"
					/>
				</div>
				<div class="booking-yiw-cabinet-link__guide-container">
					<div class="booking-yiw-cabinet-link__guide-content">
						<div class="booking-yiw-cabinet-link__guide-title">
							{{ loc('YANDEX_WIZARD_CABINET_LINK_GUIDE_TITLE') }}
						</div>
						<div class="booking-yiw-cabinet-link__guide-steps">
							<div class="booking-yiw-cabinet-link__guide-step">
								<span class="booking-yiw-cabinet-link__guide-step-number">1</span>
								<div class="booking-yiw-cabinet-link__guide-step-text">
									<EmptyRichLoc
										:message="loc('YANDEX_WIZARD_CABINET_LINK_GUIDE_STEP_1')"
										:rules="['br']"
									/>
								</div>
							</div>
							<div class="booking-yiw-cabinet-link__guide-step">
								<span class="booking-yiw-cabinet-link__guide-step-number">2</span>
								<div class="booking-yiw-cabinet-link__guide-step-text">
									<EmptyRichLoc
										:message="loc('YANDEX_WIZARD_CABINET_LINK_GUIDE_STEP_2')"
										:rules="['br']"
									/>
								</div>
							</div>
						</div>
						<UiButton
							:text="loc('YANDEX_WIZARD_CABINET_LINK_BUTTON_TEXT')"
							:color="ButtonColor.PRIMARY"
							:size="ButtonSize.MEDIUM"
							noCaps
							useAirDesign
							@click="goToYandexBusiness"
						/>
					</div>
					<img 
						class="booking-yiw-cabinet-link__guide-image"
						:src="cabinetLinkImageUrl"
						:alt="loc('YANDEX_WIZARD_CABINET_LINK_GUIDE_TITLE')"
						draggable="false"
					/>
				</div>
			</div>
		</UiResourceWizardItem>
	`
	};

	// @vue/component
	const YandexIntegrationWizardTimeZone = {
	  name: 'YandexIntegrationWizardTimeZone',
	  components: {
	    UiResourceWizardItem: booking_component_uiResourceWizardItem.UiResourceWizardItem,
	    Icon: ui_iconSet_api_vue.BIcon
	  },
	  setup() {
	    const popupId = 'booking-yiw-timezone-menu';
	    const menuPopup = null;
	    return {
	      Outline: ui_iconSet_api_vue.Outline,
	      menuPopup,
	      popupId
	    };
	  },
	  data() {
	    return {
	      timezones: []
	    };
	  },
	  computed: {
	    timezoneId: {
	      get() {
	        return this.$store.getters[`${booking_const.Model.YandexIntegrationWizard}/getTimezone`];
	      },
	      set(timezone) {
	        this.$store.dispatch(`${booking_const.Model.YandexIntegrationWizard}/setTimezone`, {
	          timezone
	        });
	      }
	    },
	    selectedTimezoneTitle() {
	      const selected = this.timezones.find(tz => tz.timezoneId === this.timezoneId);
	      return selected ? selected.title : booking_utils.Utils.time.getDefaultUTCTimezone(this.timezoneId);
	    }
	  },
	  async created() {
	    this.timezones = await booking_provider_service_mainPageService.mainPageService.getTimezones();
	  },
	  methods: {
	    openTimezoneSelector() {
	      var _this$menuPopup, _this$menuPopup$popup;
	      if ((_this$menuPopup = this.menuPopup) != null && (_this$menuPopup$popup = _this$menuPopup.popupWindow) != null && _this$menuPopup$popup.isShown()) {
	        this.destroy();
	        return;
	      }
	      const menuButton = this.$refs['menu-button'];
	      this.menuPopup = main_popup.MenuManager.create(this.popupId, menuButton, this.getMenuItems(), {
	        className: 'booking-yiw-timezone-menu',
	        closeByEsc: true,
	        maxHeight: 300,
	        offsetTop: 0,
	        offsetLeft: 40,
	        angle: true,
	        cacheable: true,
	        targetContainer: document.querySelector('div.yandex-wizard__wrapper'),
	        events: {
	          onClose: () => this.destroy(),
	          onDestroy: () => this.destroy()
	        }
	      });
	      this.menuPopup.show();
	    },
	    getMenuItems() {
	      return this.timezones.map(timezone => ({
	        text: timezone.title,
	        onclick: () => {
	          this.timezoneId = timezone.timezoneId;
	          this.destroy();
	        }
	      }));
	    },
	    destroy() {
	      main_popup.MenuManager.destroy(this.popupId);
	      this.menuPopup = null;
	    }
	  },
	  template: `
		<UiResourceWizardItem
			:iconType="Outline.LOCATION_TIME"
			:title="loc('YANDEX_WIZARD_TIMEZONE_TITLE')"
			:description="loc('YANDEX_WIZARD_TIMEZONE_DESCRIPTION')"
		>
			<div class="booking-yiw-timezone__content">
				<div class="booking-yiw-timezone__input-label">
					{{ loc('YANDEX_TIMEZONE_LINK_INPUT_LABEL') }}
				</div>
				<div
					class="ui-ctl ui-ctl-dropdown ui-ctl-w100"
					data-id="booking-yiw-settings-timezone-input"
					id="booking-yiw-settings-timezone"
					@click="openTimezoneSelector()"
					ref="menu-button"
				>
					<div class="ui-ctl-element">{{ selectedTimezoneTitle }}</div>
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
				</div>
			</div>
		</UiResourceWizardItem>
	`
	};

	class DeactivateConfirmation {
	  static confirm() {
	    return new Promise(resolve => {
	      const messageBox = ui_dialogs_messagebox.MessageBox.create({
	        title: main_core.Loc.getMessage('YANDEX_WIZARD_CONFIRM_DEACTIVATE_TITLE'),
	        message: main_core.Loc.getMessage('YANDEX_WIZARD_CONFIRM_DEACTIVATE_DESCRIPTION'),
	        yesCaption: main_core.Loc.getMessage('YANDEX_WIZARD_CONFIRM_DEACTIVATE_YES_CAPTION'),
	        modal: true,
	        buttons: ui_dialogs_messagebox.MessageBoxButtons.YES_CANCEL,
	        popupOptions: {
	          className: 'booking-yiw__deactivate-confirmation',
	          minHeight: 200,
	          minWidth: 479,
	          closeByEsc: true,
	          closeIcon: true,
	          closeIconSize: main_popup.CloseIconSize.LARGE
	        },
	        useAirDesign: true,
	        onYes: async box => {
	          box.close();
	          resolve(true);
	        },
	        onCancel: box => {
	          box.close();
	          resolve(false);
	        }
	      });
	      messageBox.show();
	    });
	  }
	}

	const {
	  mapGetters: mapGetters$2,
	  mapActions: mapActions$1
	} = ui_vue3_vuex.createNamespacedHelpers(booking_const.Model.YandexIntegrationWizard);

	// @vue/component
	const YandexIntegrationWizardDeactivateButton = {
	  name: 'YandexIntegrationWizardDeactivateButton',
	  components: {
	    UiButton: booking_component_button.Button
	  },
	  setup() {
	    return {
	      ButtonSize: booking_component_button.ButtonSize,
	      ButtonColor: booking_component_button.ButtonColor
	    };
	  },
	  computed: {
	    ...mapGetters$2(['isConnected'])
	  },
	  methods: {
	    ...mapActions$1(['setFetching']),
	    async showDeactivateConfirmation() {
	      const isDeactivationConfirmed = await DeactivateConfirmation.confirm();
	      if (!isDeactivationConfirmed) {
	        return;
	      }
	      await this.deactivateIntegration();
	    },
	    async deactivateIntegration() {
	      this.setFetching(true);
	      try {
	        await booking_provider_service_yandexIntegrationWizardService.yandexIntegrationWizardService.deactivateIntegration();
	        main_core_events.EventEmitter.emit(booking_const.EventName.CloseYandexIntegrationWizard);
	      } catch (error) {
	        console.error('Deactivate integration error', error);
	        const {
	          Notifier
	        } = await main_core.Runtime.loadExtension('ui.notification-manager');
	        Notifier.notifyViaBrowserProvider({
	          id: 'booking-yiw-update-error',
	          text: this.loc('YANDEX_WIZARD_UPDATE_ERROR')
	        });
	      } finally {
	        this.setFetching(false);
	      }
	    }
	  },
	  template: `
		<div v-if="isConnected" class="booking-yiw__deactivate-button_container">
			<UiButton
				class="booking-yiw__deactivate-button"
				:text="loc('YANDEX_WIZARD_DEACTIVATE_BUTTON')"
				noCaps
				@click="showDeactivateConfirmation()"
			/>
		</div>
	`
	};

	const {
	  mapGetters: mapGetters$3,
	  mapActions: mapActions$2
	} = ui_vue3_vuex.createNamespacedHelpers(booking_const.Model.YandexIntegrationWizard);

	// @vue/component
	const App = {
	  name: 'YandexIntegrationWizardApp',
	  components: {
	    YandexIntegrationWizardLayout,
	    YandexIntegrationWizardLayoutHeader,
	    YandexIntegrationWizardLayoutFooter,
	    YandexIntegrationWizardCabinetLink,
	    YandexIntegrationWizardSettingsResource,
	    YandexIntegrationWizardTimeZone,
	    YandexIntegrationWizardDeactivateButton
	  },
	  computed: {
	    ...mapGetters$3(['isLoaded'])
	  },
	  async beforeMount() {
	    await this.loadWizardData();
	  },
	  methods: {
	    ...mapActions$2(['setFetching']),
	    async loadWizardData() {
	      if (this.isLoaded) {
	        return;
	      }
	      try {
	        this.setFetching(true);
	        const responseLoadData = await booking_provider_service_yandexIntegrationWizardService.yandexIntegrationWizardService.loadData();
	        if ((responseLoadData == null ? void 0 : responseLoadData.success) === true) {
	          await this.dropCounterIntegration();
	        }
	      } catch (error) {
	        console.error('Loading wizard data error', error);
	      } finally {
	        this.setFetching(false);
	      }
	    },
	    async dropCounterIntegration() {
	      var _Core$getStore, _Core$getStore$state, _Core$getStore$state$, _Core$getStore$state$2;
	      const counterMapsYa = Number((_Core$getStore = booking_core.Core.getStore()) == null ? void 0 : (_Core$getStore$state = _Core$getStore.state) == null ? void 0 : (_Core$getStore$state$ = _Core$getStore$state.counters) == null ? void 0 : (_Core$getStore$state$2 = _Core$getStore$state$.counters) == null ? void 0 : _Core$getStore$state$2.newYandexMaps);
	      if (!counterMapsYa) {
	        return;
	      }
	      const responseDropCounter = await booking_provider_service_yandexIntegrationWizardService.yandexIntegrationWizardService.dropCounterIntegration();
	      if ((responseDropCounter == null ? void 0 : responseDropCounter.success) === true) {
	        await booking_provider_service_mainPageService.mainPageService.fetchCounters();
	      }
	    }
	  },
	  template: `
		<YandexIntegrationWizardLayout>
			<template #header>
				<YandexIntegrationWizardLayoutHeader/>
			</template>

			<YandexIntegrationWizardCabinetLink/>
			<YandexIntegrationWizardSettingsResource/>
			<YandexIntegrationWizardTimeZone/>
			<YandexIntegrationWizardDeactivateButton/>

			<template #footer>
				<YandexIntegrationWizardLayoutFooter/>
			</template>
		</YandexIntegrationWizardLayout>
	`
	};

	let _ = t => t,
	  _t;
	var _width = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("width");
	var _application = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("application");
	var _mountContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("mountContent");
	var _initCore = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initCore");
	var _makeContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("makeContainer");
	class YandexIntegrationWizard {
	  constructor() {
	    Object.defineProperty(this, _makeContainer, {
	      value: _makeContainer2
	    });
	    Object.defineProperty(this, _initCore, {
	      value: _initCore2
	    });
	    Object.defineProperty(this, _mountContent, {
	      value: _mountContent2
	    });
	    Object.defineProperty(this, _application, {
	      writable: true,
	      value: null
	    });
	  }
	  get name() {
	    return 'booking:yandex-integration-wizard';
	  }
	  open() {
	    booking_lib_sidePanelInstance.SidePanelInstance.open(this.name, {
	      width: babelHelpers.classPrivateFieldLooseBase(YandexIntegrationWizard, _width)[_width],
	      cacheable: false,
	      events: {
	        onClose: this.closeSidePanel.bind(this)
	      },
	      contentCallback: async () => {
	        await babelHelpers.classPrivateFieldLooseBase(this, _initCore)[_initCore]();
	        this.subscribeEvents();
	        const container = babelHelpers.classPrivateFieldLooseBase(this, _makeContainer)[_makeContainer]();
	        babelHelpers.classPrivateFieldLooseBase(this, _mountContent)[_mountContent](container);
	        return container;
	      }
	    });
	  }
	  closeSidePanel() {
	    babelHelpers.classPrivateFieldLooseBase(this, _application)[_application].unmount();
	    babelHelpers.classPrivateFieldLooseBase(this, _application)[_application] = null;
	    this.unsubscribeEvents();
	  }
	  subscribeEvents() {
	    main_core.Event.EventEmitter.subscribe(booking_const.EventName.CloseYandexIntegrationWizard, this.close);
	  }
	  unsubscribeEvents() {
	    main_core.Event.EventEmitter.unsubscribe(booking_const.EventName.CloseYandexIntegrationWizard, this.close);
	  }
	  close() {
	    booking_lib_sidePanelInstance.SidePanelInstance.close();
	  }
	}
	function _mountContent2(container) {
	  const application = ui_vue3.BitrixVue.createApp(App, booking_core.Core.getParams());
	  application.mixin(booking_component_mixin_locMixin.locMixin);
	  application.use(booking_core.Core.getStore());
	  application.mount(container);
	  babelHelpers.classPrivateFieldLooseBase(this, _application)[_application] = application;
	}
	async function _initCore2() {
	  try {
	    await booking_core.Core.init();
	    await booking_core.Core.addDynamicModule(booking_model_yandexIntegrationWizard.YandexIntegrationWizardModel.create());
	  } catch (error) {
	    console.error('Init Yandex integration wizard error', error);
	  }
	}
	function _makeContainer2() {
	  return main_core.Tag.render(_t || (_t = _`
			<div id="booking--yandex-integration-wizard--app" class="booking--yandex-integration-wizard--app"></div>
		`));
	}
	Object.defineProperty(YandexIntegrationWizard, _width, {
	  writable: true,
	  value: 730
	});

	exports.YandexIntegrationWizard = YandexIntegrationWizard;

}((this.BX.Booking.Application = this.BX.Booking.Application || {}),BX.Vue3,BX.Booking.Component.Mixin,BX.Booking.Lib,BX.Booking.Model,BX.Booking,BX.Booking.Component,BX.Booking.Component,BX.Booking.Application,BX.Booking.Lib,BX.Booking.Component,BX.Booking.Component,BX.UI.IconSet,BX.Booking,BX.Booking.Component,BX.Booking.Provider.Service,BX.Vue3.Vuex,BX.Event,BX.Booking.Const,BX.Booking.Component,BX.Booking.Provider.Service,BX,BX.Main,BX.UI.Dialogs));
//# sourceMappingURL=yandex-integration-wizard.bundle.js.map
