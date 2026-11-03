import { Loc } from 'main.core';
import { Popup } from 'main.popup';
import { marketInstallState } from 'market.install-store';
import { MarketLinks } from 'market.market-links';
import { FocusNavigator, LiveAnnouncer } from 'ui.a11y';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { Chip } from 'ui.system.chip.vue';
import { LabelIcon, LabelStyle } from 'ui.system.label';
import { Label } from 'ui.system.label.vue';
import { HeadlineXs, TextMd, TextSm, TextXs } from 'ui.system.typography.vue';
import { markRaw, nextTick } from 'ui.vue3';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { mapState, mapActions } from 'ui.vue3.pinia';

import './popup-install.css';

export const PopupInstall = {
	components: {
		BIcon,
		Chip,
		HeadlineXs,
		Label,
		TextMd,
		TextSm,
		TextXs,
		UiButton,
	},
	props: [
		'appInfo', 'licenseInfo'
	],
	data() {
		return {
			AirButtonStyle,
			ButtonSize,
			isLoadForm: false,
			isSystemUserPopoverOpen: false,
			LabelIcon,
			LabelStyle,
			installedLink: MarketLinks.installedLink(),
			Outline,
			submitButtonText: BX.message('MARKET_DETAIL_ACTION_JS_INSTALL'),
			systemUserPopover: null,
			systemUserPopoverParent: null,
			updateButtonText: BX.message('MARKET_DETAIL_ACTION_JS_REFRESH'),
		};
	},
	computed: {
		isInstall: function () {
			return this.appInfo.BUTTONS.hasOwnProperty('INSTALL') && this.appInfo.BUTTONS.INSTALL === 'Y'
		},
		isUpdate: function () {
			return this.appInfo.BUTTONS.hasOwnProperty('UPDATE') && this.appInfo.BUTTONS.UPDATE === 'Y'
		},
		installAgreementLinks() {
			const agreementConfigs = [
				{
					key: 'tos',
					field: 'TERMS_OF_SERVICE_TEXT',
					messageCode: 'MARKET_POPUP_INSTALL_JS_AGREEMENT_TOS',
				},
				{
					key: 'eula',
					field: 'EULA_TEXT',
					messageCode: 'MARKET_POPUP_INSTALL_JS_AGREEMENT_EULA',
				},
				{
					key: 'privacy',
					field: 'PRIVACY_TEXT',
					messageCode: 'MARKET_POPUP_INSTALL_JS_AGREEMENT_PRIVACY',
				},
			];

			return agreementConfigs.map((agreement) => {
				const source = this.licenseInfo?.[agreement.field];
				if (!source)
				{
					return null;
				}

				const container = document.createElement('div');
				container.innerHTML = source;
				const link = container.querySelector('a');
				if (!link)
				{
					return null;
				}

				link.classList.add('market-popup__agreement_label-link');
				link.dataset.testid = `market-popup-install-agreement-${agreement.key}-link`;
				link.textContent = this.$Bitrix.Loc.getMessage(agreement.messageCode);

				return {
					key: agreement.key,
					html: link.outerHTML,
				};
			}).filter(Boolean);
		},
		installAgreementText() {
			if (this.installAgreementLinks.length === 0)
			{
				return '';
			}

			return this.$Bitrix.Loc.getMessage(
				'MARKET_POPUP_INSTALL_JS_ACCEPTANCE_TEXT',
				{
					'#AGREEMENTS#': this.installAgreementLinks.map(({ html }) => html).join(', '),
				},
			);
		},
		updateAgreementText() {
			if (this.installAgreementLinks.length === 0)
			{
				return '';
			}

			return this.$Bitrix.Loc.getMessage(
				'MARKET_POPUP_INSTALL_JS_UPDATE_ACCEPTANCE_TEXT',
				{
					'#AGREEMENTS#': this.installAgreementLinks.map(({ html }) => html).join(', '),
				},
			);
		},
		currentVersion() {
			return this.appInfo.VERSIONS_FORMAT?.[this.versionSlider.currentItem] ?? {};
		},
		systemUserFooterText() {
			return Loc.getMessage(
				'MARKET_POPUP_INSTALL_JS_SYSTEM_USER',
				{
					'[system_user]': `
						<br>
						<button
							type="button"
							class="market-popup__footer-system-user-trigger"
							data-testid="market-popup-install-system-user-button"
						>
							<span class="market-popup__footer-system-user">
					`,
					'[/system_user]': `
							</span>
							<span
								class="ui-icon-set --${Outline.QUESTION}"
								style="--ui-icon-set__icon-size: 16px; --ui-icon-set__icon-color: var(--ui-color-base-4);"
								aria-hidden="true"
							></span>
						</button>
					`,
				},
			);
		},
		hasMultipleVersions() {
			return (this.appInfo.VERSIONS_FORMAT?.length ?? 0) > 1;
		},
		systemUserPopoverId() {
			const appCode = String(this.appInfo?.CODE ?? 'app').replaceAll(/[^\w-]/g, '-');

			return `market-system-user-popover-${appCode}`;
		},
		...mapState(marketInstallState, [
			'installPopup', 'installStep', 'slider', 'versionSlider',
		]),
	},
	watch: {
		installStep(currentStep) {
			const popupContainer = this.installPopup?.getPopupContainer();
			if (
				(currentStep !== 2 && currentStep !== 3)
				|| !popupContainer?.contains(this.$el)
			)
			{
				return;
			}

			nextTick(() => {
				if (
					this.installPopup?.getPopupContainer() !== popupContainer
					|| !popupContainer.contains(this.$el)
				)
				{
					return;
				}

				const currentState = currentStep === 2
					? this.$refs.installingState
					: this.$refs.successState
				;

				if (!currentState)
				{
					return;
				}

				FocusNavigator.focusTarget(currentState, {
					preventScroll: true,
					focusVisible: true,
				});
				this.announceInstallationStep(currentStep);
			});
		},
	},
	mounted() {
		this.setLicenseInfo(this.licenseInfo);
		this.setPopupNode(this.appInfo.CODE, this.$refs['market-popup-install']);
	},
	beforeUnmount() {
		this.destroySystemUserPopover();
	},
	methods: {
		...mapActions(marketInstallState, [
			'cleanLicenseError', 'willOpenAppAfterInstall', 'openSliderWithContent', 'reloadSlider', 'isSubscriptionApp',
			'isHiddenBuy', 'prevVersion', 'nextVersion', 'setPopupNode', 'openApplication', 'buildAppForm',
			'canShowAppForm', 'closeInstallPopup', 'setLicenseInfo', 'setLicenseAgreement', 'submitInstallStep',
		]),
		acceptAgreementsAndSubmit() {
			this.installAgreementLinks.forEach(({ key }) => {
				this.setLicenseAgreement(key, true);
			});
			this.cleanLicenseError();
			this.submitInstallStep();
		},
		announceInstallationStep(step) {
			const messageCode = step === 2
				? (
					this.isUpdate
						? 'MARKET_POPUP_INSTALL_JS_UPDATING_TITLE'
						: 'MARKET_POPUP_INSTALL_JS_INSTALLING_TITLE'
				)
				: (
					this.isUpdate
						? 'MARKET_POPUP_INSTALL_JS_UPDATE_SUCCESS_TITLE'
						: 'MARKET_POPUP_INSTALL_JS_SUCCESS_TITLE'
				)
			;

			LiveAnnouncer.announce(this.$Bitrix.Loc.getMessage(messageCode));
		},
		announceCurrentVersion() {
			if (!this.currentVersion.VERSION)
			{
				return;
			}

			LiveAnnouncer.announce(
				this.$Bitrix.Loc.getMessage(
					'MARKET_POPUP_INSTALL_JS_VERSION_SELECTED',
					{ '#VERSION#': this.currentVersion.VERSION },
				),
			);
		},
		handlePreviousVersion() {
			this.prevVersion();
			this.announceCurrentVersion();
		},
		handleNextVersion() {
			this.nextVersion();
			this.announceCurrentVersion();
		},
		handleSystemUserFooterClick(event) {
			const bindElement = event.target.closest(
				'[data-testid="market-popup-install-system-user-button"]',
			);
			if (!bindElement)
			{
				return;
			}

			this.toggleSystemUserPopover(bindElement);
		},
		toggleSystemUserPopover(bindElement) {
			if (!this.systemUserPopover || this.systemUserPopover.isDestroyed())
			{
				this.createSystemUserPopover(bindElement);
			}

			this.bindSystemUserPopoverToInstallPopup();
			this.systemUserPopover?.toggle();
		},
		createSystemUserPopover(bindElement) {
			const contentTemplate = this.$refs.systemUserPopoverContent;
			if (!bindElement || !contentTemplate)
			{
				return;
			}

			const content = contentTemplate.cloneNode(true);
			content.id = this.systemUserPopoverId;
			content.dataset.testid = 'market-popup-install-system-user-popover';

			this.systemUserPopover = markRaw(new Popup({
				bindElement,
				bindOptions: {
					position: 'bottom',
				},
				content,
				className: 'market-popup__system-user-popover',
				width: 432,
				padding: 0,
				contentPadding: 20,
				borderRadius: '16px',
				contentBorderRadius: '16px',
				background: 'var(--ui-color-accent-main-primary)',
				contentBackground: 'var(--ui-color-accent-main-primary)',
				angle: {
					position: 'top',
					offset: 48,
				},
				autoHide: true,
				closeByEsc: true,
				focusTrap: false,
				role: 'tooltip',
				events: {
					onShow: () => {
						this.isSystemUserPopoverOpen = true;
						bindElement.setAttribute('aria-describedby', this.systemUserPopoverId);
					},
					onClose: () => {
						this.isSystemUserPopoverOpen = false;
						bindElement.removeAttribute('aria-describedby');
					},
					onDestroy: () => {
						this.isSystemUserPopoverOpen = false;
						bindElement.removeAttribute('aria-describedby');
						this.systemUserPopover = null;
					},
				},
			}));
		},
		bindSystemUserPopoverToInstallPopup() {
			if (!this.installPopup || this.systemUserPopoverParent === this.installPopup)
			{
				return;
			}

			this.unbindSystemUserPopoverFromInstallPopup();
			this.systemUserPopoverParent = this.installPopup;
			this.systemUserPopoverParent.subscribe('onClose', this.destroySystemUserPopover);
			this.systemUserPopoverParent.subscribe('onDestroy', this.destroySystemUserPopover);
		},
		unbindSystemUserPopoverFromInstallPopup() {
			if (!this.systemUserPopoverParent)
			{
				return;
			}

			this.systemUserPopoverParent.unsubscribe('onClose', this.destroySystemUserPopover);
			this.systemUserPopoverParent.unsubscribe('onDestroy', this.destroySystemUserPopover);
			this.systemUserPopoverParent = null;
		},
		destroySystemUserPopover() {
			const popover = this.systemUserPopover;
			this.systemUserPopover = null;
			this.isSystemUserPopoverOpen = false;
			this.unbindSystemUserPopoverFromInstallPopup();

			if (popover && !popover.isDestroyed())
			{
				popover.destroy();
			}
		},
		clickDone: function() {
			this.isLoadForm = true;
			this.buildAppForm(this.appInfo.CODE).then((form) => {
				this.reloadSlider();
				form.show();
				this.isLoadForm = false;
			});
		}
	},
	template: `
		<div
			class="market-popup"
			ref="market-popup-install"
			data-testid="market-popup-install-root"
		>
			<template v-if="installStep === 1">
				<div class="market-popup__container --install"
					 v-if="isInstall"
					 data-testid="market-popup-install-state-install"
				>
					<div class="market-popup__header">
						<div class="market-popup__header-logo">
							<img class="market-popup__header-logo_img" :src="appInfo.ICON" alt="">
						</div>
						<div class="market-popup__header-info">
							<HeadlineXs
								tag="h2"
								className="market-popup__header-title"
								 v-html="$Bitrix.Loc.getMessage('MARKET_POPUP_INSTALL_JS_INSTALL_TITLE', {'#APP_NAME#' : appInfo.NAME})"
							/>
							<div class="market-popup__header-additional">
								<TextSm tag="div" className="market-popup__header-version">
									{{ $Bitrix.Loc.getMessage('MARKET_POPUP_INSTALL_JS_VERSION', {'#APP_VERSION#': appInfo.VER}) }}
								</TextSm>
								<Label
									v-if="isSubscriptionApp()"
									:icon="LabelIcon.CHECK"
									:style="LabelStyle.TINTED_SUCCESS"
									:value="$Bitrix.Loc.getMessage('MARKET_POPUP_INSTALL_JS_AVAILABLE_IN_SUBSCRIPTION')"
								/>
								<Label
									v-else
									:style="LabelStyle.FILLED_NO_ACCENT"
									:value="$Bitrix.Loc.getMessage('MARKET_POPUP_INSTALL_JS_IS_FREE')"
								/>
								<div class="market-popup__header_about-buying"
									 v-if="isHiddenBuy()"
								>
									{{ $Bitrix.Loc.getMessage('MARKET_POPUP_INSTALL_JS_IN_APP_PURCHASES') }}
								</div>
							</div>
						</div>
					</div>

					<div class="market-popup__body">
						<div class="market-popup__row">
							<div class="market-popup__title">
								<HeadlineXs tag="h3" className="market-popup__title_text">
									{{ $Bitrix.Loc.getMessage('MARKET_POPUP_INSTALL_JS_ACCESS') }}
								</HeadlineXs>
							</div>
						</div>
						<div class="market-popup__content">
							<TextSm tag="div" className="market-popup__content-description">
								{{ $Bitrix.Loc.getMessage('MARKET_POPUP_INSTALL_JS_APP_REQUESTS_PERMISSIONS_TO_WORK') }}
							</TextSm>
							<div class="market-popup__modules">
								<template v-for="(scope, index) in appInfo.SCOPES" :key="index">
									<Chip
										v-if="index < appInfo.SCOPES_TO_SHOW"
										:text="scope.TITLE"
									/>
								</template>
							</div>
							<button
								type="button"
								class="market-popup__modules-more"
								data-testid="market-popup-install-permissions-more-button"
								@click="openSliderWithContent(slider.scope, 491)"
							>
								<TextSm>{{ $Bitrix.Loc.getMessage('MARKET_POPUP_INSTALL_JS_MORE') }}</TextSm>
							</button>
							<div v-if="installAgreementText" class="market-popup__agreement">
								<TextSm
									tag="div"
									className="market-popup__agreement_label-text"
									v-html="installAgreementText"
								/>
							</div>
						</div>
					</div>
					<div class="market-popup__actions">
						<UiButton
							class="market-popup__action-button"
							:dataset="{ testid: 'market-popup-install-submit-button' }"
							:size="ButtonSize.EXTRA_LARGE"
							:style="AirButtonStyle.FILLED"
							:text="submitButtonText"
							:wide="true"
							@click="acceptAgreementsAndSubmit"
						/>
						<UiButton
							class="market-popup__action-button"
							:dataset="{ testid: 'market-popup-install-cancel-button' }"
							:size="ButtonSize.EXTRA_LARGE"
							:style="AirButtonStyle.OUTLINE"
							:text="$Bitrix.Loc.getMessage('MARKET_POPUP_INSTALL_JS_CANCEL')"
							:wide="true"
							@click="closeInstallPopup"
						/>
					</div>
					<div class="market-popup__footer">
						<TextSm
							tag="div"
							className="market-popup__footer-text"
							v-html="systemUserFooterText"
							@click="handleSystemUserFooterClick"
						/>
						<div
							ref="systemUserPopoverContent"
							class="market-popup__system-user-popover-content"
						>
							<TextSm tag="div" className="market-popup__system-user-popover-text">
								{{ $Bitrix.Loc.getMessage('MARKET_POPUP_INSTALL_JS_SYSTEM_USER_TOOLTIP') }}
							</TextSm>
						</div>
					</div>
				</div>
				<div class="market-popup__container --update"
					 v-if="isUpdate"
					 data-testid="market-popup-install-state-update"
				>
					<div class="market-popup__update-header">
						<div class="market-popup__update-logo">
							<img class="market-popup__header-logo_img" :src="appInfo.ICON" alt="">
							<div class="market-popup__update-logo-badge" aria-hidden="true">
								<BIcon
									:name="Outline.REFRESH"
									:size="20"
									color="var(--ui-color-base-white-fixed)"
								/>
							</div>
						</div>
						<div class="market-popup__update-header-info">
							<HeadlineXs tag="h2">
								{{ $Bitrix.Loc.getMessage('MARKET_POPUP_INSTALL_JS_UPDATE_TITLE') }}
							</HeadlineXs>
							<TextMd tag="div" className="market-popup__update-app-name">
								{{ appInfo.NAME }}
							</TextMd>
						</div>
					</div>

					<div class="market-popup__update-body">
						<div class="market-popup__update-card">
							<div class="market-popup__update-card-header">
								<HeadlineXs tag="h3">
									{{ $Bitrix.Loc.getMessage('MARKET_POPUP_INSTALL_JS_WHATS_NEW') }}
								</HeadlineXs>
								<div class="market-popup__update-version">
									<button
										v-if="hasMultipleVersions"
										type="button"
										class="market-popup__update-version-button"
										data-testid="market-popup-install-version-previous-button"
										:aria-label="$Bitrix.Loc.getMessage('MARKET_POPUP_INSTALL_JS_PREVIOUS_VERSION')"
										@click="handlePreviousVersion"
									>
										<BIcon
											:name="Outline.CHEVRON_LEFT_M"
											:size="20"
											color="var(--ui-color-base-3)"
										/>
									</button>
									<TextSm className="market-popup__update-version-text">
										{{ $Bitrix.Loc.getMessage(
											'MARKET_POPUP_INSTALL_JS_UPDATE_VERSION',
											{'#VERSION#': currentVersion.VERSION},
										) }}
									</TextSm>
									<button
										v-if="hasMultipleVersions"
										type="button"
										class="market-popup__update-version-button"
										data-testid="market-popup-install-version-next-button"
										:aria-label="$Bitrix.Loc.getMessage('MARKET_POPUP_INSTALL_JS_NEW_VERSION')"
										@click="handleNextVersion"
									>
										<BIcon
											:name="Outline.CHEVRON_RIGHT_M"
											:size="20"
											color="var(--ui-color-base-3)"
										/>
									</button>
								</div>
							</div>
							<div
								class="market-popup__update-card-content"
								v-html="currentVersion.TEXT"
							></div>
						</div>
						<div v-if="updateAgreementText" class="market-popup__update-agreement">
							<TextSm
								tag="div"
								className="market-popup__agreement_label-text"
								v-html="updateAgreementText"
							/>
						</div>
					</div>
					<div class="market-popup__update-actions">
						<UiButton
							class="market-popup__action-button"
							:dataset="{ testid: 'market-popup-install-update-button' }"
							:size="ButtonSize.EXTRA_LARGE"
							:style="AirButtonStyle.FILLED"
							:text="updateButtonText"
							:wide="true"
							@click="acceptAgreementsAndSubmit"
						/>
						<UiButton
							class="market-popup__action-button"
							:dataset="{ testid: 'market-popup-install-update-cancel-button' }"
							:size="ButtonSize.EXTRA_LARGE"
							:style="AirButtonStyle.OUTLINE"
							:text="$Bitrix.Loc.getMessage('MARKET_POPUP_INSTALL_JS_CANCEL')"
							:wide="true"
							@click="closeInstallPopup"
						/>
					</div>
				</div>
			</template>
			<div class="market-popup__container --installing"
				 v-if="installStep === 2"
				 ref="installingState"
				 data-testid="market-popup-install-state-loading"
				 tabindex="-1"
			>
				<div class="market-install-loader" aria-hidden="true"></div>
				<HeadlineXs tag="h2" className="market-popup__installing-title">
					{{ $Bitrix.Loc.getMessage(
						isUpdate
							? 'MARKET_POPUP_INSTALL_JS_UPDATING_TITLE'
							: 'MARKET_POPUP_INSTALL_JS_INSTALLING_TITLE',
					) }}
				</HeadlineXs>
				<TextMd tag="div" className="market-popup__installing-description">
					{{ $Bitrix.Loc.getMessage('MARKET_POPUP_INSTALL_JS_INSTALLING_DESCRIPTION') }}
				</TextMd>
			</div>
			<div class="market-popup__container --success"
				 v-if="installStep === 3"
				 ref="successState"
				 data-testid="market-popup-install-state-success"
				 tabindex="-1"
			>
				<div class="market-popup__success-icon" aria-hidden="true">
					<BIcon
						:name="Outline.CHECK_L"
						:size="40"
						color="var(--ui-color-base-white-fixed)"
					/>
				</div>
				<HeadlineXs tag="h2" className="market-popup__success-title">
					{{ $Bitrix.Loc.getMessage(
						isUpdate
							? 'MARKET_POPUP_INSTALL_JS_UPDATE_SUCCESS_TITLE'
							: 'MARKET_POPUP_INSTALL_JS_SUCCESS_TITLE',
					) }}
				</HeadlineXs>
				<TextXs
					v-if="willOpenAppAfterInstall()"
					tag="div"
					className="market-popup__success-description"
				>
					{{ $Bitrix.Loc.getMessage('MARKET_POPUP_INSTALL_JS_SUCCESS_DESCRIPTION_WITH_INTERFACE') }}
				</TextXs>
				<TextXs
					v-else-if="canShowAppForm()"
					tag="div"
					className="market-popup__success-description"
				>
					{{ $Bitrix.Loc.getMessage('MARKET_POPUP_INSTALL_JS_SUCCESS_DESCRIPTION_WITH_INSTALLER') }}
				</TextXs>
				<TextXs
					v-else
					tag="div"
					className="market-popup__success-description"
				>
					{{ $Bitrix.Loc.getMessage('MARKET_POPUP_INSTALL_JS_SUCCESS_DESCRIPTION_REST_ONLY') }}
				</TextXs>
				<div class="market-popup__success-app">
					<div class="market-popup__success-app-icon">
						<img
							class="market-popup__success-app-icon-image"
							:src="appInfo.ICON"
							alt=""
						>
					</div>
					<div class="market-popup__success-app-info">
						<TextSm tag="div" className="market-popup__success-app-name">
							{{ appInfo.NAME }}
						</TextSm>
						<div class="market-popup__success-status">
							<div class="market-popup__success-status-icon" aria-hidden="true">
								<BIcon
									:name="Outline.CHECK_XS"
									:size="8"
									color="var(--ui-color-base-white-fixed)"
								/>
							</div>
							<TextXs>
								{{ $Bitrix.Loc.getMessage(
									isUpdate
										? 'MARKET_POPUP_INSTALL_JS_UPDATE_SUCCESS_STATUS'
										: 'MARKET_POPUP_INSTALL_JS_SUCCESS_STATUS',
								) }}
							</TextXs>
						</div>
					</div>
				</div>
				<div class="market-popup__success-actions">
					<UiButton
						v-if="willOpenAppAfterInstall()"
						:dataset="{ testid: 'market-popup-install-success-open-button' }"
						:size="ButtonSize.EXTRA_LARGE"
						:style="AirButtonStyle.FILLED"
						:text="$Bitrix.Loc.getMessage('MARKET_POPUP_INSTALL_JS_SUCCESS_OPEN')"
						:loading="isLoadForm"
						wide
						@click="openApplication"
					/>
					<UiButton
						v-else-if="canShowAppForm()"
						:dataset="{ testid: 'market-popup-install-success-configure-button' }"
						:size="ButtonSize.EXTRA_LARGE"
						:style="AirButtonStyle.FILLED"
						:text="$Bitrix.Loc.getMessage('MARKET_POPUP_INSTALL_JS_SUCCESS_CONFIGURE')"
						:loading="isLoadForm"
						wide
						@click="clickDone"
					/>
					<UiButton
						v-else
						:dataset="{ testid: 'market-popup-install-success-done-button' }"
						:size="ButtonSize.EXTRA_LARGE"
						:style="AirButtonStyle.FILLED"
						:text="$Bitrix.Loc.getMessage('MARKET_POPUP_INSTALL_JS_READY')"
						:loading="isLoadForm"
						wide
						@click="reloadSlider"
					/>
					<a
						class="market-popup__success-installed-link"
						:href="installedLink"
						data-load-content="list"
						data-testid="market-popup-install-installed-link"
						@click="closeInstallPopup"
					>
						<TextSm tag="span">
							{{ $Bitrix.Loc.getMessage('MARKET_POPUP_INSTALL_JS_SUCCESS_INSTALLED_LINK') }}
						</TextSm>
					</a>
				</div>
			</div>
		</div>
	`,
}
