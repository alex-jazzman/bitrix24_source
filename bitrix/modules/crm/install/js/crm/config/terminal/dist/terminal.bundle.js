/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
this.BX.Crm.Config = this.BX.Crm.Config || {};
(function (exports, ui_dialogs_messagebox, main_core, ui_vue3, ui_switcher, main_popup, ui_vue3_vuex, rest_client, bitrix24_phoneverify, ui_label, landing_backend) {
	'use strict';

	const SettingsContainer = {
		props: {
			title: String,
			iconStyle: String,
			collapsed: Boolean
		},
		methods: {
			onTitleClicked() {
				this.$emit('titleClick');
			}
		},
		template: `
	<div class="settings-container">
		<div
			class="ui-slider-heading-4 settings-container-title"
			v-bind:class="{ 'settings-container-title-collapsed': collapsed }"
			v-on:click="onTitleClicked"
		>
			<div :class="iconStyle"></div>
			{{ title }}
		</div>

		<div class="settings-section-list" v-bind:class="{ 'settings-section-list-collapsed': collapsed }">
			<slot></slot>
		</div>
	</div>
	`
	};

	const SettingsSection = {
		data() {
			return {
				isEnabled: this.active,
				switcher: null
			};
		},
		mounted() {
			new BX.UI.Switcher({
				node: this.$refs.switcher,
				size: 'small',
				checked: this.isEnabled,
				handlers: {
					toggled: this.onSwitcherToggle.bind(this)
				}
			});
			BX.UI.Hint.init(this.$refs.title);
		},
		methods: {
			onSwitcherToggle() {
				this.isEnabled = !this.isEnabled;
				this.$emit('toggle', this.isEnabled);
			},
			onTitleClick() {
				this.$emit('titleClick');
			}
		},
		props: {
			title: String,
			switchable: {
				type: Boolean,
				default: false
			},
			active: {
				type: Boolean,
				default: false
			},
			hint: {
				type: String,
				default: ''
			},
			leftIconClass: {
				type: String,
				default: ''
			}
		},
		// language=Vue
		template: `
		<div>
			<div class="ui-slider-heading-4 settings-section-header">
				<div v-if="switchable" class="settings-setction-switcher-container">
					<span ref="switcher" class="ui-switcher"></span>
				</div>
				<div v-if="leftIconClass" :class="leftIconClass"></div>
				<div
					style="font-size: 16px; margin-right: 0px;"
				>
					{{ title }}
				</div>
				<span
					v-if="hint !== ''"
					class="ui-hint"
					data-hint-html
					data-hint-interactivity
					:data-hint="hint"
				>
					<span class="ui-hint-icon"></span>
				</span>
			</div>
		</div>
	`
	};

	const Sms = {
		// language=Vue
		template: `
		<div>
			<div class="sms-container">
				<slot></slot>
			</div>
		</div>
	`
	};

	const SmsProviderSelect = {
		data() {
			return {
				isListShowed: false
			};
		},
		mounted() {
			main_core.Event.bind(document, 'click', () => {
				this.isListShowed = false;
			});
		},
		methods: {
			...ui_vue3_vuex.mapGetters(['getServiceLink', 'getActiveSmsServices']),
			...ui_vue3_vuex.mapMutations(['selectSMSService']),
			switchService(serviceId) {
				this.isListShowed = false;
				this.selectSMSService(serviceId);
			},
			switchVisibility() {
				this.isListShowed = !this.isListShowed;
			},
			openSmsServicesSlider() {
				const options = {
					cacheable: false,
					allowChangeHistory: false,
					requestMethod: 'get',
					width: 700,
					events: {
						onClose: () => {
							this.$emit('onConnectSliderClosed');
						}
					}
				};
				BX.SidePanel.Instance.open(this.getServiceLink(), options);
			}
		},
		computed: {
			...ui_vue3_vuex.mapGetters(['getSelectedService']),
			getListClassname() {
				if (!this.isListShowed) {
					return 'sms-provider-selector-hided-list';
				}
				return 'sms-provider-selector-list';
			}
		},
		// language=Vue
		template: `
		<div style="display: inline-block; vertical-align: top; position: relative;">
			<span class="sms-provider-selector" @click.stop="switchVisibility">{{ $Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_SECTION_SMS_CHANGE_MSGVER_1') }}</span>
			<ul :class="getListClassname" @click.stop>
				<li v-for="provider in getActiveSmsServices()" @click="switchService(provider['ID'])" v-show="provider['ID'] !== getSelectedService['ID']">{{ provider['NAME'] }}</li>
				<li @click="openSmsServicesSlider">{{ $Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_SECTION_SMS_SERVICE_PROVIDER_CONNECT_MORE') }}</li>
			</ul>
		</div>
	`
	};

	const SmsSettingsSection = {
		components: {
			SettingsSection,
			Sms,
			SmsProviderSelect
		},
		computed: {
			...ui_vue3_vuex.mapGetters(['isSmsSendingActive', 'isAnyServiceEnabled', 'isNotificationsEnabled', 'getSelectedService']),
			getSectionTitle() {
				return this.$Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_SECTION_SMS_TITLE');
			},
			getSectionHint() {
				const replacements = {
					'#LINK_START#': '<a onclick="top.BX.Helper.show(\'redirect=detail&code=17399056\')" style="cursor: pointer">',
					'#LINK_END#': '</a>'
				};
				return this.$Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_SECTION_SMS_HINT_TEXT', replacements);
			},
			getNotificationConnectHint() {
				const replacements = {
					'#LINK_START#': '<span onclick="top.BX.Helper.show(\'redirect=detail&code=17399068\')" class="sms-provider-selector">',
					'#LINK_END#': '</span>'
				};
				return this.$Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_SECTION_SMS_SERVICE_PROVIDER_UNC_CONNECTED', replacements);
			}
		},
		methods: {
			...ui_vue3_vuex.mapMutations(['setSmsSendingActive', 'updateServicesList', 'updateNotificationsEnabled']),
			...ui_vue3_vuex.mapGetters(['getPaymentSlipLinkScheme', 'getNotificationsLink', 'getServiceLink']),
			onServiceConnectSliderClosed() {
				main_core.ajax.runComponentAction('bitrix:crm.config.terminal.settings', 'updateServicesList').then(response => {
					if (response.status === 'success') {
						const data = response.data;
						if (data?.isUCNEnabled) {
							this.updateNotificationsEnabled(data.isUCNEnabled);
						}
						this.updateServicesList(data.activeSmsServices);
					}
				}).catch(error => {
					console.error(error);
				});
			},
			onSectionToggled() {
				this.setSmsSendingActive(!this.isSmsSendingActive);
			},
			getSmsMessage() {
				const link = `<br /><span class="sms-link-path">${this.getPaymentSlipLinkScheme()}</span><span class="sms-link-plug">xxxxx</span> `;
				const text = this.$Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_SECTION_SMS_MESSAGE_TEMPLATE');
				return main_core.Text.encode(text).replaceAll('#PAYMENT_SLIP_LINK#', link);
			},
			onSmsMouseenter(event) {
				const target = event.target;
				const message = this.$Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_SECTION_SMS_MESSAGE_HINT');
				if (this.popup) {
					this.popup.destroy();
					this.popup = null;
				}
				this.popup = new main_popup.Popup(null, target, {
					events: {
						onPopupClose: () => {
							this.popup.destroy();
							this.popup = null;
						}
					},
					darkMode: true,
					content: message,
					offsetLeft: target.offsetWidth
				});
				this.popup.show();
			},
			onSmsMouseleave() {
				this.popup?.destroy();
			},
			onNotificationsConnectLinkClick() {
				const notificationLink = this.getNotificationsLink();
				if (notificationLink === null) {
					return;
				}
				if (notificationLink.type === 'connect_link') {
					const options = {
						cacheable: false,
						allowChangeHistory: false,
						requestMethod: 'get',
						width: 700,
						events: {
							onClose: () => {
								this.onServiceConnectSliderClosed();
							}
						}
					};
					BX.SidePanel.Instance.open(notificationLink.value, options);
				} else if (notificationLink.type === 'ui_helper') {
					top.BX.UI.InfoHelper.show(notificationLink.value);
				}
			},
			onProviderSmsNotificationClick() {
				const options = {
					cacheable: false,
					allowChangeHistory: false,
					requestMethod: 'get',
					width: 700,
					events: {
						onClose: () => {
							this.onServiceConnectSliderClosed();
						}
					}
				};
				BX.SidePanel.Instance.open(this.getServiceLink(), options);
			}
		},
		// language=Vue
		template: `
		<div v-if="isAnyServiceEnabled" style="display: flex; justify-content: space-between; margin-bottom: 24px;">
			<div>
				<SettingsSection
					:title="getSectionTitle"
					:switchable="true"
					v-on:toggle="onSectionToggled"
					:active="isSmsSendingActive"
					:hint="getSectionHint"
				/>
				<div style="margin-left: 53px;">
					<div
						v-html="getNotificationConnectHint"
						v-if="isNotificationsEnabled"
						class="sms-provider-name"
					></div>
					<div v-else>
						<div class="sms-provider-name" style="padding: 3px 0;">
							{{ $Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_SECTION_SMS_SERVICE_SELECT_MSGVER_2', {'%PROVIDER_NAME%': getSelectedService['NAME']}) }}
						</div>
						<SmsProviderSelect v-on:onConnectSliderClosed="onServiceConnectSliderClosed"/>
					</div>
				</div>
			</div>
			<div>
				<div class="sms-provider-message-title">
					{{ $Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_SECTION_SMS_MESSAGE_TITLE') }}
				</div>
				<div>
					<Sms>
						<span
							v-html="getSmsMessage()"
							v-on:mouseenter="onSmsMouseenter($event)"
							v-on:mouseleave="onSmsMouseleave"
						></span>
					</Sms>
				</div>
			</div>
		</div>
		<div style="margin-bottom: 24px;" v-else>
			<span class="sms-provider-empty-provider-list-text" v-if="(getNotificationsLink() !== null) && (getServiceLink() !== '')">
				{{ $Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_SECTION_SMS_ONBOARDING_TEXT') }}
			</span>
			<span class="sms-provider-empty-provider-list-text" v-else-if="(getNotificationsLink() === null) && (getServiceLink() !== '')">
				{{ $Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_SECTION_SMS_ONBOARDING_ONLY_SMS_SERVICES_TEXT') }}
			</span>
			<button class="ui-btn ui-btn-md ui-btn-primary" @click="onNotificationsConnectLinkClick" v-if="getNotificationsLink() !== null">
				{{ $Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_SECTION_SMS_SERVICE_UNC_CONNECT_BTN') }}
			</button>

			<button class="ui-btn ui-btn-md ui-btn-light-border" @click="onProviderSmsNotificationClick" v-if="(getNotificationsLink() !== null) && (getServiceLink() !== '')">
				{{ $Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_SECTION_SMS_SERVICE_PROVIDER_CONNECT_BTN') }}
			</button>
			<button class="ui-btn ui-btn-md ui-btn-primary" @click="onProviderSmsNotificationClick" v-else-if="(getNotificationsLink() === null) && (getServiceLink() !== '')">
				{{ $Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_SECTION_SMS_SERVICE_PROVIDER_CONNECT_BTN') }}
			</button>
		</div>
	`
	};

	const SmsSettings = {
		components: {
			SettingsContainer,
			SmsSettingsSection
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				isSettingsChanged: 'isChanged',
				isSaving: 'isSaving',
				getIsSmsCollapsed: 'getIsSmsCollapsed'
			})
		},
		methods: {
			...ui_vue3_vuex.mapMutations(['updateIsSmsCollapsed']),
			onTitleClick() {
				this.updateIsSmsCollapsed(!this.getIsSmsCollapsed);
				main_core.ajax.runComponentAction('bitrix:crm.config.terminal.settings', 'updateSmsCollapsed', {
					data: {
						collapsed: this.getIsSmsCollapsed
					}
				});
			}
		},
		// language=Vue
		template: `
		<SettingsContainer
			:title="$Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_SUBTITLE_NOTIFICATION')"
			iconStyle="settings-section-icon-sms"
			:collapsed="getIsSmsCollapsed"
			v-on:titleClick="onTitleClick"
		>
			<SmsSettingsSection />
		</SettingsContainer>
	`
	};

	const RequiredPaysystemCodes = Object.freeze({
		sbp: 'sbp',
		sberQr: 'sberQr',
		rest: 'rest',
		paysystemPanel: 'paysystemPanel'
	});

	const PaymentMethodsSettings = {
		components: {
			SettingsSection,
			SettingsContainer
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				getAvailablePaysystems: 'getAvailablePaysystems',
				getTerminalDisabledPaysystems: 'getTerminalDisabledPaysystems',
				getIsLinkPaymentEnabled: 'getIsLinkPaymentEnabled',
				getIsSbpEnabled: 'getIsSbpEnabled',
				getIsSberQrEnabled: 'getIsSberQrEnabled',
				getIsSbpConnected: 'getIsSbpConnected',
				getIsSberQrConnected: 'getIsSberQrConnected',
				getIsRuZone: 'getIsRuZone',
				getSbpConnectPath: 'getSbpConnectPath',
				getSberQrConnectPath: 'getSberQrConnectPath',
				getIsAnyPaysystemActive: 'getIsAnyPaysystemActive',
				getPaysystemPanelPath: 'getPaysystemPanelPath',
				getIsPaysystemsCollapsed: 'getIsPaysystemsCollapsed',
				getPaysystemsArticleUrl: 'getPaysystemsArticleUrl',
				getIsPhoneConfirmed: 'getIsPhoneConfirmed',
				getConnectedSiteId: 'getConnectedSiteId',
				getIsConnectedSitePublished: 'getIsConnectedSitePublished',
				getIsConnectedSiteExists: 'getIsConnectedSiteExists'
			}),
			getRequiredPaysystemCodes() {
				return RequiredPaysystemCodes;
			},
			getLinkPaymentHint() {
				return this.$Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_SECTION_PS_LINK_PAYMENT_HINT');
			}
		},
		methods: {
			...ui_vue3_vuex.mapMutations(['setTerminalPaysystemDisabled', 'setLinkPaymentEnabled', 'setRequiredPaysystemDisabled', 'updateSbpConnectPath', 'updateSberQrConnectPath', 'updateIsSbpConnected', 'updateIsSberQrConnected', 'updateIsPaysystemsCollapsed', 'updateIsAnyPaysystemActive', 'updateAvailablePaysystems', 'updateIsPhoneConfirmed', 'updateConnectedSiteId', 'updateIsConnectedSitePublished', 'updateIsConnectedSiteExists']),
			onPaysystemToggled(paysystemId) {
				this.setTerminalPaysystemDisabled(paysystemId);
			},
			onRequiredPaysystemToggled(paysystemCode) {
				this.setRequiredPaysystemDisabled(paysystemCode);
			},
			onLinkPaymentToggled() {
				this.setLinkPaymentEnabled(!this.getIsLinkPaymentEnabled);
			},
			openPaysystemSlider(psMode, link = '') {
				const options = {
					cacheable: false,
					allowChangeHistory: false,
					requestMethod: 'get',
					width: psMode === RequiredPaysystemCodes.paysystemPanel ? null : 1000,
					events: {
						onClose: () => {
							this.onPaysystemSliderClosed();
						}
					}
				};
				const url = psMode === RequiredPaysystemCodes.rest ? link : this.getPaysystemUrl(psMode);
				BX.SidePanel.Instance.open(url, options);
			},
			getPaysystemUrl(psMode) {
				switch (psMode) {
					case RequiredPaysystemCodes.sbp:
						return this.getSbpConnectPath;
					case RequiredPaysystemCodes.sberQr:
						return this.getSberQrConnectPath;
					case RequiredPaysystemCodes.paysystemPanel:
						return this.getPaysystemPanelPath;
					default:
						return '';
				}
			},
			onPaysystemSliderClosed() {
				main_core.ajax.runComponentAction('bitrix:crm.config.terminal.settings', 'updatePaysystemPaths').then(response => {
					this.updateSbpConnectPath(response.data.sbp);
					this.updateSberQrConnectPath(response.data.sberbankQr);
					this.updateIsSbpConnected(response.data.isSbpConnected);
					this.updateIsSberQrConnected(response.data.isSberQrConnected);
					this.updateIsAnyPaysystemActive(response.data.isAnyPaysystemActive);
					this.updateAvailablePaysystems(response.data.availablePaysystems);
				}).catch(() => {});
			},
			onSiteSliderClosed() {
				this.loader.show(document.body);
				main_core.ajax.runComponentAction('bitrix:crm.config.terminal.settings', 'updateConnectedSiteParams').then(response => {
					this.loader.hide();
					this.updateIsConnectedSiteExists(response.data.isConnectedSiteExists);
					this.updateConnectedSiteId(response.data.connectedSiteId);
					this.updateIsPhoneConfirmed(response.data.isPhoneConfirmed);
					this.updateIsConnectedSitePublished(response.data.isConnectedSitePublished);
					this.connectSite();
				}).catch(() => {});
			},
			getStatusLabel(connected = false) {
				const text = this.$Bitrix.Loc.getMessage(connected ? 'CRM_CFG_TERMINAL_SETTINGS_SECTION_PS_CONNECTED' : 'CRM_CFG_TERMINAL_SETTINGS_SECTION_PS_NOT_CONNECTED').toUpperCase();
				const label = new ui_label.Label({
					text,
					color: connected ? ui_label.LabelColor.LIGHT_GREEN : ui_label.LabelColor.LIGHT,
					size: ui_label.LabelSize.LG,
					fill: true
				});
				return label.render().outerHTML;
			},
			onTitleClick() {
				this.updateIsPaysystemsCollapsed(!this.getIsPaysystemsCollapsed);
				main_core.ajax.runComponentAction('bitrix:crm.config.terminal.settings', 'updatePaysystemsCollapsed', {
					data: {
						collapsed: this.getIsPaysystemsCollapsed
					}
				});
			},
			connectSite() {
				if (!this.loader) {
					this.loader = new BX.Loader({
						size: 200
					});
				}
				if (!this.getIsConnectedSiteExists) {
					this.createSite();
					return;
				}
				if (!this.getIsConnectedSitePublished) {
					this.publishSite();
					return;
				}
				if (!this.getIsPhoneConfirmed) {
					this.showPhoneConfirmationPopup();
				}
			},
			createSite() {
				this.loader.show(document.body);
				rest_client.rest.callMethod('salescenter.manager.getConfig').then(result => {
					const {
						connectedSiteId,
						isSiteExists,
						isPhoneConfirmed,
						siteTemplateCode
					} = result.answer.result;
					this.loader.hide();
					if (isSiteExists && connectedSiteId > 0) {
						this.updateIsConnectedSiteExists(isSiteExists);
						this.updateConnectedSiteId(connectedSiteId);
						this.updateIsPhoneConfirmed(isPhoneConfirmed);
						if (isPhoneConfirmed) {
							this.publishSite();
							return;
						}
						this.showPhoneConfirmationPopup();
					} else {
						const url = new main_core.Uri('/shop/stores/site/edit/0/');
						const params = {
							context: 'terminal',
							tpl: siteTemplateCode,
							no_redirect: 'Y'
						};
						url.setQueryParams(params);
						const options = {
							events: {
								onClose: () => {
									this.onSiteSliderClosed();
								}
							}
						};
						BX.SidePanel.Instance.open(url.toString(), options);
					}
				}).catch(() => this.loader.hide());
			},
			publishSite() {
				this.loader.show(document.body);
				landing_backend.Backend.getInstance().action('Site::publication', {
					id: this.getConnectedSiteId
				}).then(publishedSiteId => {
					this.loader.hide();
					if (publishedSiteId) {
						this.updateIsConnectedSitePublished(true);
					}
				}).catch(data => {
					this.loader.hide();
					if (data.type === 'error' && !main_core.Type.isUndefined(data.result[0])) {
						const errorCode = data.result[0].error;
						if (errorCode === 'PHONE_NOT_CONFIRMED') {
							this.showPhoneConfirmationPopup();
						} else if (errorCode === 'EMAIL_NOT_CONFIRMED') {
							BX.UI.InfoHelper.show('limit_sites_confirm_email');
						} else {
							ui_dialogs_messagebox.MessageBox.alert(data.result[0].error_description);
						}
					}
				});
			},
			confirmPhoneNumber() {
				this.loader.show(document.body);
				bitrix24_phoneverify.PhoneVerify.getInstance().setEntityType('landing_site').setEntityId(this.getConnectedSiteId).startVerify({
					mandatory: false,
					callback: verified => {
						this.loader.hide();
						if (!verified) {
							return;
						}
						this.updateIsPhoneConfirmed(verified);
						if (!this.getIsConnectedSitePublished) {
							this.publishSite();
						}
					}
				});
			},
			showPhoneConfirmationPopup() {
				ui_dialogs_messagebox.MessageBox.confirm(this.$Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_SECTION_PS_PHONE_CONFIRMATION_POPUP_MESSAGE'), this.$Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_SECTION_PS_PHONE_CONFIRMATION_POPUP_TITLE'), messageBox => {
					messageBox.close();
					this.confirmPhoneNumber();
				}, this.$Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_SECTION_PS_PHONE_CONFIRMATION_POPUP_OK_CAPTION'), messageBox => messageBox.close(), this.$Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_SECTION_PS_PHONE_CONFIRMATION_POPUP_CANCEL_CAPTION'));
			}
		},
		// language=Vue
		template: `
		<SettingsContainer
			:title="$Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_SECTION_PS_TITLE_MSGVER_1')"
			iconStyle="settings-section-icon-payment-methods"
			:collapsed="getIsPaysystemsCollapsed"
			v-on:titleClick="onTitleClick"
			v-bind:style="{ 'padding-bottom: 0px;' : !getIsPaysystemsCollapsed }"
		>

			<div
				class="payment-systems-subtitle"
				v-html="$Bitrix.Loc.getMessage(
					'CRM_CFG_TERMINAL_SETTINGS_SECTION_PS_SUBTITLE_MSGVER_1',
					{'#MORE_INFO_LINK#': getPaysystemsArticleUrl})"
			></div>

			<div class="payment-systems-section-container">
				<div class="payment-systems-container">
					<div v-if="getIsRuZone" class="payment-system-wrapper">
						<SettingsSection
							:title="$Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_SECTION_PS_SBP')"
							:switchable="true"
							:active="getIsSbpEnabled"
							leftIconClass="payment-method-icon-sbp"
							v-on:toggle="onRequiredPaysystemToggled(getRequiredPaysystemCodes.sbp)"
							v-on:titleClick="openPaysystemSlider(getRequiredPaysystemCodes.sbp)"
						/>
						<div class="payment-system-status-container">
							<span v-html="getStatusLabel(this.getIsSbpConnected)"></span>
							<span
								class="payment-system-set"
								:class="getIsSbpConnected ? 'payment-system-set-connected' : 'payment-system-set-not-connected'"
								v-on:click="openPaysystemSlider(getRequiredPaysystemCodes.sbp)"
							>
								{{ $Bitrix.Loc.getMessage(this.getIsSbpConnected
								? 'CRM_CFG_TERMINAL_SETTINGS_SECTION_PS_SET'
								: 'CRM_CFG_TERMINAL_SETTINGS_SECTION_PS_CONNECT') }}
							</span>
						</div>
					</div>

					<div v-if="getIsRuZone" class="payment-system-wrapper">
						<SettingsSection
							:title="$Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_SECTION_PS_SBER_QR_MSGVER_1')"
							:switchable="true"
							:active="getIsSberQrEnabled"
							leftIconClass="payment-method-icon-sber"
							v-on:toggle="onRequiredPaysystemToggled(getRequiredPaysystemCodes.sberQr)"
							v-on:titleClick="openPaysystemSlider(getRequiredPaysystemCodes.sberQr)"
						/>
						<div class="payment-system-status-container">
							<span v-html="getStatusLabel(this.getIsSberQrConnected)"></span>
							<span
								class="payment-system-set"
								:class="getIsSberQrConnected ? 'payment-system-set-connected' : 'payment-system-set-not-connected'"
								v-on:click="openPaysystemSlider(getRequiredPaysystemCodes.sberQr)"
							>
								{{ $Bitrix.Loc.getMessage(this.getIsSberQrConnected
								? 'CRM_CFG_TERMINAL_SETTINGS_SECTION_PS_SET'
								: 'CRM_CFG_TERMINAL_SETTINGS_SECTION_PS_CONNECT') }}
							</span>
						</div>
					</div>

					<div
						v-if="getAvailablePaysystems.length > 0"
						v-for="paysystem in getAvailablePaysystems"
						class="payment-system-wrapper"
					>
						<SettingsSection
							:key="paysystem.type"
							:title="paysystem.title"
							:switchable="paysystem.id > 0"
							:active="paysystem.id > 0 && !getTerminalDisabledPaysystems.includes(paysystem.id)"
							v-on:toggle="onPaysystemToggled(paysystem.id)"
						/>
						<div class="payment-system-status-container">
							<span v-html="getStatusLabel(paysystem.isConnected)"></span>
							<span
								class="payment-system-set"
								:class="paysystem.isConnected ? 'payment-system-set-connected' : 'payment-system-set-not-connected'"
								v-on:click="openPaysystemSlider(getRequiredPaysystemCodes.rest, paysystem.path)"
							>
								{{ $Bitrix.Loc.getMessage(paysystem.isConnected
								? 'CRM_CFG_TERMINAL_SETTINGS_SECTION_PS_SET'
								: 'CRM_CFG_TERMINAL_SETTINGS_SECTION_PS_CONNECT') }}
							</span>
						</div>
					</div>

					<div class="payment-system-wrapper">
						<SettingsSection
							:title="$Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_SECTION_PS_LINK_PAYMENT')"
							:switchable="true"
							:active="getIsLinkPaymentEnabled"
							v-on:toggle="onLinkPaymentToggled()"
							:hint="getLinkPaymentHint"
						/>
						<div class="payment-system-status-container">
							<span v-html="getStatusLabel(this.getIsAnyPaysystemActive && this.getIsConnectedSitePublished && getIsPhoneConfirmed)"></span>
							<span
								class="payment-system-set payment-system-set-connected"
								v-on:click="openPaysystemSlider(getRequiredPaysystemCodes.paysystemPanel)"
								v-if="getIsConnectedSitePublished && getIsPhoneConfirmed"
							>
								{{ $Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_SECTION_PS_PAYMENT_METHOD') }}
							</span>
							<span
								class="payment-system-set payment-system-set-not-connected"
								v-on:click="connectSite()"
								v-else
							>
								{{ $Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_SECTION_PS_CONNECT') }}
							</span>
						</div>
					</div>
				</div>
				<div class="terminal-image-wrapper"></div>
			</div>

		</SettingsContainer>
	`
	};

	const ButtonsPanel = {
		methods: {
			save() {
				this.$Bitrix.eventEmitter.emit('crm:terminal:onSettingsSave');
			},
			cancel() {
				this.$Bitrix.eventEmitter.emit('crm:terminal:onSettingsCancel');
			}
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				isSettingsChanged: 'isChanged',
				isSaving: 'isSaving'
			}),
			buttonsPanelClass() {
				return {
					'ui-button-panel-wrapper': true,
					'ui-pinner': true,
					'ui-pinner-bottom': true,
					'ui-pinner-full-width': true,
					'ui-button-panel-wrapper-hide': !this.isSettingsChanged
				};
			},
			saveButtonClasses() {
				return {
					'ui-btn': true,
					'ui-btn-success': true,
					'ui-btn-wait': this.isSaving
				};
			}
		},
		template: `
		<div :class="buttonsPanelClass">
			<div class="ui-button-panel ui-button-panel-align-center">
				<button
					@click="save"
					:class="saveButtonClasses"
				>
					{{ $Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_SAVE_BTN') }}
				</button>
				<a
					@click="cancel"
					class="ui-btn ui-btn-link"
				>
					{{ $Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_CANCEL_BTN') }}
				</a>
			</div>
		</div>
	`
	};

	class App {
		#application;
		constructor(props) {
			this.rootNode = document.getElementById(props.rootNodeId);
			this.terminalSettings = props.terminalSettings;
			this.store = this.#initStore(props.terminalSettings);
		}
		#initStore(terminalSettings) {
			const terminalSettingsStore = {
				state() {
					return {
						...terminalSettings,
						isSaving: false,
						changedValues: {}
					};
				},
				getters: {
					isChanged(state) {
						return Object.keys(state.changedValues).length > 0;
					},
					isSmsSendingActive(state) {
						if (state.changedValues.isSmsSendingEnabled !== undefined) {
							return state.changedValues.isSmsSendingEnabled;
						}
						return state.isSmsSendingEnabled;
					},
					isAnyServiceEnabled(state) {
						return state.activeSmsServices.length > 0 || state.isNotificationsEnabled;
					},
					isNotificationsEnabled(state) {
						return state.isNotificationsEnabled;
					},
					getPaymentSlipLinkScheme(state) {
						return state.paymentSlipLinkScheme;
					},
					getNotificationsLink(state) {
						if (main_core.Type.isObject(state.connectNotificationsLink)) {
							return state.connectNotificationsLink;
						}
						return null;
					},
					isNotificationAvailableToConnect(state) {
						return this.getNotificationsLink(state) !== null;
					},
					getServiceLink(state) {
						if (main_core.Type.isString(state.connectServiceLink)) {
							return state.connectServiceLink;
						}
						return '';
					},
					getSelectedService(state) {
						if (main_core.Type.isString(state.changedValues.selectedServiceId)) {
							return state.activeSmsServices.find(element => element.ID === state.changedValues.selectedServiceId);
						}
						return state.activeSmsServices.find(element => element.SELECTED);
					},
					getIsAnyPaysystemEnabled(state, getters) {
						let hasEnabledPaysystem = false;
						for (const paysystem of getters.getAvailablePaysystems) {
							if (!getters.getTerminalDisabledPaysystems.includes(paysystem.id)) {
								hasEnabledPaysystem = true;
								break;
							}
						}
						return getters.getIsSbpEnabled || getters.getIsSberQrEnabled || getters.getIsLinkPaymentEnabled || hasEnabledPaysystem;
					},
					getActiveSmsServices(state) {
						return state.activeSmsServices;
					},
					getChangedValues(state) {
						return state.changedValues;
					},
					isSaving(state) {
						return state.isSaving;
					},
					getAvailablePaysystems(state) {
						return state.availablePaysystems;
					},
					getTerminalDisabledPaysystems(state) {
						return state.terminalDisabledPaysystems;
					},
					getIsLinkPaymentEnabled(state) {
						return state.isLinkPaymentEnabled;
					},
					getPaysystemPanelPath(state) {
						return state.paysystemPanelPath;
					},
					getIsAnyPaysystemActive(state) {
						return state.isAnyPaysystemActive;
					},
					getIsSbpEnabled(state) {
						return state.isSbpEnabled;
					},
					getSbpConnectPath(state) {
						return state.sbpConnectPath;
					},
					getIsSbpConnected(state) {
						return state.isSbpConnected;
					},
					getIsSberQrEnabled(state) {
						return state.isSberQrEnabled;
					},
					getSberQrConnectPath(state) {
						return state.sberQrConnectPath;
					},
					getIsSberQrConnected(state) {
						return state.isSberQrConnected;
					},
					getIsPaysystemsCollapsed(state) {
						return state.isPaysystemsCollapsed;
					},
					getPaysystemsArticleUrl(state) {
						return state.paysystemsArticleUrl;
					},
					getIsSmsCollapsed(state) {
						return state.isSmsCollapsed;
					},
					getIsRuZone(state) {
						return state.isRuZone;
					},
					getIsPhoneConfirmed(state) {
						return state.isPhoneConfirmed;
					},
					getConnectedSiteId(state) {
						return state.connectedSiteId;
					},
					getIsConnectedSitePublished(state) {
						return state.isConnectedSitePublished;
					},
					getIsConnectedSiteExists(state) {
						return state.isConnectedSiteExists;
					}
				},
				mutations: {
					setSmsSendingActive(state, value) {
						if (state.changedValues.isSmsSendingEnabled !== undefined && value === state.isSmsSendingEnabled) {
							delete state.changedValues.isSmsSendingEnabled;
						} else {
							state.isChanged = true;
							state.changedValues.isSmsSendingEnabled = value;
						}
					},
					selectSMSService(state, value) {
						if (state.activeSmsServices.find(element => element.SELECTED).ID === value) {
							delete state.changedValues.selectedServiceId;
						} else {
							state.changedValues.selectedServiceId = value;
						}
					},
					setTerminalPaysystemDisabled(state, paysystemId) {
						if (!Array.isArray(state.changedValues.terminalDisabledPaysystems)) {
							state.changedValues.terminalDisabledPaysystems = state.terminalDisabledPaysystems;
						}
						if (state.changedValues.terminalDisabledPaysystems.includes(paysystemId)) {
							const currentDisabledPs = state.changedValues.terminalDisabledPaysystems ?? [];
							state.changedValues.terminalDisabledPaysystems = currentDisabledPs.filter(ps => ps !== paysystemId);
							state.terminalDisabledPaysystems = state.changedValues.terminalDisabledPaysystems;
							if (state.changedValues.terminalDisabledPaysystems.length === 0) {
								state.changedValues.terminalPaysystemsAllEnabled = true;
								state.terminalPaysystemsAllEnabled = true;
							}
							state.isChanged = true;
						} else {
							state.isChanged = true;
							if (state.changedValues.terminalDisabledPaysystems) {
								state.changedValues.terminalDisabledPaysystems.push(paysystemId);
								state.terminalDisabledPaysystems.push(paysystemId);
							} else {
								state.changedValues.terminalDisabledPaysystems = [paysystemId];
								state.terminalDisabledPaysystems = [paysystemId];
							}
							delete state.changedValues.terminalPaysystemsAllEnabled;
							delete state.terminalPaysystemsAllEnabled;
						}
					},
					setRequiredPaysystemDisabled(state, paysystemCode) {
						let paysystemKey;
						switch (paysystemCode) {
							case RequiredPaysystemCodes.sbp:
								paysystemKey = 'isSbpEnabled';
								break;
							case RequiredPaysystemCodes.sberQr:
								paysystemKey = 'isSberQrEnabled';
								break;
							default:
								paysystemKey = null;
						}
						if (!paysystemKey) {
							return;
						}
						state[paysystemKey] = !state[paysystemKey];
						state.changedValues[paysystemKey] = state[paysystemKey];
					},
					setLinkPaymentEnabled(state, value) {
						if (state.changedValues.isLinkPaymentEnabled !== undefined && value === state.isLinkPaymentEnabled) {
							delete state.changedValues.isLinkPaymentEnabled;
						} else {
							state.isChanged = true;
							state.changedValues.isLinkPaymentEnabled = value;
							state.isLinkPaymentEnabled = value;
						}
					},
					setSaving(state, value) {
						if (main_core.Type.isBoolean(value)) {
							state.isSaving = value;
						}
					},
					updateServicesList(state, value) {
						state.activeSmsServices = value;
					},
					updateNotificationsEnabled(state, value) {
						state.isNotificationsEnabled = value;
					},
					updateSbpConnectPath(state, value) {
						state.sbpConnectPath = value;
					},
					updateSberQrConnectPath(state, value) {
						state.sberQrConnectPath = value;
					},
					updateIsSbpConnected(state, value) {
						state.isSbpConnected = value;
					},
					updateIsSberQrConnected(state, value) {
						state.isSberQrConnected = value;
					},
					updateIsPaysystemsCollapsed(state, value) {
						state.isPaysystemsCollapsed = value;
					},
					updateIsSmsCollapsed(state, value) {
						state.isSmsCollapsed = value;
					},
					updateIsAnyPaysystemActive(state, value) {
						state.isAnyPaysystemActive = value;
					},
					updateAvailablePaysystems(state, value) {
						state.availablePaysystems = value;
					},
					updateIsPhoneConfirmed(state, value) {
						state.isPhoneConfirmed = value;
					},
					updateConnectedSiteId(state, value) {
						state.connectedSiteId = value;
					},
					updateIsConnectedSitePublished(state, value) {
						state.isConnectedSitePublished = value;
					},
					updateIsConnectedSiteExists(state, value) {
						state.isConnectedSiteExists = value;
					}
				}
			};
			return ui_vue3_vuex.createStore(terminalSettingsStore);
		}
		attachTemplate() {
			this.#application = ui_vue3.BitrixVue.createApp({
				components: {
					SmsSettings,
					PaymentMethodsSettings,
					ButtonsPanel
				},
				computed: {
					...ui_vue3_vuex.mapGetters(['isChanged', 'isSaving', 'getChangedValues', 'getIsPaysystemsCollapsed', 'getIsSbpEnabled', 'getIsSberQrEnabled', 'getIsLinkPaymentEnabled', 'getAvailablePaysystems', 'getTerminalDisabledPaysystems', 'getIsAnyPaysystemEnabled'])
				},
				mounted() {
					this.$Bitrix.eventEmitter.subscribe('crm:terminal:onSettingsSave', this.onSettingsSave);
					this.$Bitrix.eventEmitter.subscribe('crm:terminal:onSettingsCancel', this.onSettingsCancel);
				},
				beforeUnmount() {
					this.$Bitrix.eventEmitter.unsubscribe('crm:terminal:onSettingsSave');
					this.$Bitrix.eventEmitter.unsubscribe('crm:terminal:onSettingsCancel');
				},
				methods: {
					...ui_vue3_vuex.mapMutations(['setSaving']),
					validateChangedValues() {
						const values = this.getChangedValues;
						if (values && Object.keys(values).length > 0) {
							return values;
						}
						return {};
					},
					onSettingsSave() {
						if (this.getIsAnyPaysystemEnabled) {
							this.save();
						} else {
							ui_dialogs_messagebox.MessageBox.confirm(this.$Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_SAVING_CONFIRM_TITLE'), messageBox => messageBox.close(), this.$Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_SAVING_CONFIRM_OK'), messageBox => {
								messageBox.close();
								this.save();
							}, this.$Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_SAVING_CONFIRM_SAVE_AND_CLOSE'));
						}
					},
					save() {
						if (!this.isChanged || this.isSaving) {
							return;
						}
						this.setSaving(true);
						main_core.ajax.runComponentAction('bitrix:crm.config.terminal.settings', 'saveSettings', {
							data: {
								changedValues: this.validateChangedValues()
							}
						}).then(() => {
							this.setSaving(false);
							BX.SidePanel.Instance.close();
							top.BX.UI.Notification.Center.notify({
								content: this.$Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_ON_SAVE_SUCCESS')
							});
						}, () => {
							this.setSaving(false);
							BX.UI.Notification.Center.notify({
								content: this.$Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_ON_SAVE_ERROR'),
								width: 350,
								autoHideDelay: 4000
							});
						});
					},
					onSettingsCancel() {
						BX.SidePanel.Instance.close();
					}
				},
				// language=Vue
				template: `
				<div style="position: relative; overflow: hidden;">
					<div class="ui-side-panel-wrap-workarea payment-methods-settings-wrapper">
						<PaymentMethodsSettings/>
					</div>
					<div
						class="terminal-image"
						v-bind:class="{ 'terminal-image-collapsed': this.getIsPaysystemsCollapsed }"
					>
						<div class="terminal-image-title">{{ $Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_IMAGE_TITLE') }}</div>
						<div class="terminal-image-paysystems-container">
							<div v-if="getIsSbpEnabled" class="terminal-image-paysystem terminal-image-paysystem-sbp">
								<span>{{ $Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_SECTION_PS_SBP') }}</span>
							</div>
							<div v-if="getIsSberQrEnabled" class="terminal-image-paysystem terminal-image-paysystem-sber-qr">
								<span>{{ $Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_SECTION_PS_SBER_QR_MSGVER_1') }}</span>
							</div>
							<template v-if="getAvailablePaysystems.length > 0" v-for="paysystem in getAvailablePaysystems">
								<div class="terminal-image-paysystem terminal-image-paysystem-wallet" v-if="getTerminalDisabledPaysystems.indexOf(paysystem.id) === -1">
									<span>{{ paysystem.title }}</span>
								</div>
							</template>
							<div v-if="getIsLinkPaymentEnabled" class="terminal-image-paysystem terminal-image-paysystem-link">
								<span>{{ $Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_SECTION_PS_LINK_PAYMENT') }}</span>
							</div>
							<div class="terminal-image-no-paysystems-stub" v-if="!getIsAnyPaysystemEnabled">
								{{ $Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_SECTION_PS_NO_PAY_METHODS') }}
							</div>
						</div>
					</div>
				</div>

				<div class="ui-side-panel-wrap-workarea" style="margin-bottom: 70px;">
					<SmsSettings/>
				</div>

				<ButtonsPanel/>
			`
			});
			this.#application.use(this.store);
			this.#application.mount(this.rootNode);
		}
	}

	exports.App = App;

})(this.BX.Crm.Config.Terminal = this.BX.Crm.Config.Terminal || {}, BX.UI.Dialogs, BX, BX.Vue3, BX.UI, BX.Main, BX.Vue3.Vuex, BX, BX.Bitrix24, BX.UI, BX.Landing);
//# sourceMappingURL=terminal.bundle.js.map
