<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die;
}


use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

/**
 * @var $arResult array
 * @var $arParams array
 */

Extension::load([
	'intranet.notify-banner.push-otp',
	'intranet.push-otp.connect-popup',
	'intranet.push-otp.menu',
	'ui.sidepanel.layout',
	'ui.icons',
	'main.core',
	'ui.design-tokens',
	'intranet.design-tokens',
	'ui.system.typography',
]);
?>

<div class="intranet-user-otp">
	<p class="intranet-user-otp__description ui-text --sm">
		<?= Loc::getMessage('INTRANET_USER_SECURITY_DESCRIPTION')?>
	</p>

	<ul class="intranet-user-otp-list">
		<?php if ($arResult["PASSWORD"]["CAN_VIEW"] === 'Y'): ?>
		<li class="intranet-user-otp-security__section-row" id="intranet-user-otp-security__change-password">
			<div class="intranet-user-otp-list__section-row-header">
				<div class="intranet-user-otp-list__row-label ui-text --md">
					<span class="ui-icon-set --lock-l"></span>
					<?= Loc::getMessage('INTRANET_USER_SECURITY_PASSWORD') ?>
				</div>
				<div class="intranet-user-otp-list__row-status">
					<div class="intranet-user-otp-list__row-value ui-text --md">
						<?php if (isset($arResult['PROFILE']['PASSWORD_CHANGE_DATE_FORMATTED'])): ?>
							<?= Loc::getMessage('INTRANET_USER_SECURITY_PASSWORD_CHANGED_MSGVER_1', [
								'#DATE#' => $arResult['PROFILE']['PASSWORD_CHANGE_DATE_FORMATTED']
							])?>
						<?php else: ?>
							<?= Loc::getMessage('INTRANET_USER_SECURITY_PASSWORD_CHANGE')?>
						<?php endif; ?>
					</div>

					<div class="ui-icon-set --chevron-right-s"></div>
				</div>
			</div>
		</li>
		<?php endif; ?>

		<?php if ($arResult["OTP"]["IS_ENABLED"] === 'Y' && $arResult["OTP"]["CAN_EDIT_OTP"] === 'Y'): ?>
			<?php if ($arResult["OTP"]["IS_PUSH_OTP_AVAILABLE"] === 'Y'): ?>
			<li id="notify-banner-push-otp"></li>
			<?php endif; ?>
			<li class="intranet-user-otp-security__section-row" id="intranet-user-otp-security__2fa-config">
				<div class="intranet-user-otp-list__section-row-header">
					<div class="intranet-user-otp-list__row-label ui-text --md">
						<span class="ui-icon-set --o-shield-checked"></span>
						<?= Loc::getMessage('INTRANET_USER_SECURITY_PUSH_OTP_AUTH') ?>
					</div>
					<div class="intranet-user-otp-list__row-status">
						<div class="intranet-user-otp-list__row-value ui-text --md">
							<?php if ($arResult["OTP"]["IS_ACTIVE"] === 'Y'):?>
								<div class="ui-icon-set --o-circle-check"></div>
								<?= Loc::getMessage('INTRANET_USER_SECURITY_OTP_ENABLED')?>
							<?php else: ?>
								<div class="ui-icon-set --o-alert-accent"></div>
								<?= Loc::getMessage('INTRANET_USER_SECURITY_OTP_DISABLED')?>
							<?php endif; ?>
							<?php if (($arResult["OTP"]["IS_PHONE_CONFIRMATION_REQUIRED"] ?? 'N') === 'Y'): ?>
								<div class="intranet-user-otp-list__counter-wrapper"></div>
							<?php endif; ?>
						</div>
						<div class="ui-icon-set --chevron-right-s"></div>
					</div>
				</div>
			</li>
		<?php endif; ?>

		<?php if (isset($arResult['PROFILE'])): ?>
			<li id="intranet-security-section-email" class="intranet-user-otp-security__section-row" onclick="window.open('<?= $arResult['PROFILE']['NETWORK_URL']?>');">
				<div class="intranet-user-otp-list__section-row-header">
					<div class="intranet-user-otp-list__row-label ui-text --md">
						<span class="ui-icon-set --o-mail"></span>
						<?= Loc::getMessage('INTRANET_USER_SECURITY_EMAIL') ?>
					</div>
					<div class="intranet-user-otp-list__row-status">
						<div class="intranet-user-otp-list__row-value ui-text --md">
							<?php if (isset($arResult['PROFILE']['EMAIL'])): ?>
								<div class="ui-icon-set --o-circle-check"></div>
								<?= htmlspecialcharsbx($arResult['PROFILE']['EMAIL']) ?>
							<?php else: ?>
								<?= Loc::getMessage('INTRANET_USER_SECURITY_NOT_SET')?>
							<?php endif; ?>
						</div>
						<div class="ui-icon-set --chevron-right-s"></div>
					</div>
				</div>
			</li>

			<li id="intranet-security-section-phone" class="intranet-user-otp-security__section-row" onclick="window.open('<?= $arResult['PROFILE']['NETWORK_URL']?>');">
				<div class="intranet-user-otp-list__section-row-header">
					<div class="intranet-user-otp-list__row-label ui-text --md">
						<span class="ui-icon-set --o-mobile"></span>
						<?= Loc::getMessage('INTRANET_USER_SECURITY_PHONE') ?>
					</div>
					<div class="intranet-user-otp-list__row-status">
						<div class="intranet-user-otp-list__row-value ui-text --md">
							<?php if (isset($arResult['PROFILE']['PHONE'])): ?>
								<div class="ui-icon-set --o-circle-check"></div>
								<?= htmlspecialcharsbx($arResult['PROFILE']['PHONE']) ?>
							<?php else: ?>
								<?= Loc::getMessage('INTRANET_USER_SECURITY_NOT_SET')?>
							<?php endif; ?>
						</div>
						<div class="ui-icon-set --chevron-right-s"></div>
					</div>
				</div>
			</li>

			<li id="intranet-security-section-socserv" class="intranet-user-otp-security__section-row" onclick="window.open('<?= $arResult['PROFILE']['NETWORK_URL']?>');">
				<div class="intranet-user-otp-list__section-row-header">
					<div class="intranet-user-otp-list__row-label ui-text --md">
						<span class="ui-icon-set --o-apps"></span>
						<?= Loc::getMessage('INTRANET_USER_SECURITY_SOC_NET') ?>
					</div>
					<div class="intranet-user-otp-list__row-status">
						<div class="intranet-user-otp-list__row-value ui-text --md">
							<?php if (empty($arResult['PROFILE']['SOCSERV'])):?>
								<?= Loc::getMessage('INTRANET_USER_SECURITY_NOT_CONNECTED')?>
							<?php else: ?>
								<?= Loc::getMessage('INTRANET_USER_SECURITY_ACCOUNTS', ['#NUM#' => count($arResult['PROFILE']['SOCSERV'])])?>
							<?php endif; ?>
						</div>
						<div class="ui-icon-set --chevron-right-s"></div>
					</div>
				</div>
				<?php if (!empty($arResult['PROFILE']['SOCSERV'])): ?>
					<ul class="intranet-user-otp-security__socserv-list">
						<?php foreach ($arResult['PROFILE']['SOCSERV'] as $service):?>
							<li class="intranet-user-otp-security__socserv-item ui-icon ui-icon-service-<?= $service['ICON'] ?>">
								<i></i>
							</li>
						<?php endforeach; ?>
					</ul>
				<?php endif; ?>
			</li>

			<?php if (isset($arResult['CAN_VIEW_RESTORE_PASSWORD']) && $arResult['CAN_VIEW_RESTORE_PASSWORD']): ?>
			<li id="intranet-security-section-reset-password" class="intranet-user-otp-security__section-row">
				<div class="intranet-user-otp-list__section-row-header">
					<div class="intranet-user-otp-list__row-label ui-text --md">
						<span class="ui-icon-set --lock-l"></span>
						<?= Loc::getMessage('INTRANET_USER_SECURITY_RESTORE_PASSWORD') ?>
					</div>
					<div class="intranet-user-otp-list__row-status"></div>
				</div>
			</li>
			<?php endif; ?>
		<?php endif; ?>
	</ul>
	<?php if ($arResult["USER"]["CAN_LOGOUT"] === 'Y'):?>
		<div class="intranet-user-otp__footer">
			<a class="intranet-user-otp-list__disable-link ui-link ui-link-dashed" href="#">
				<?= Loc::getMessage('INTRANET_USER_SECURITY_EXIT_BUTTON') ?>
			</a>
			<p class="intranet-user-otp__footer-description ui-text --2xs">
				<?= Loc::getMessage('INTRANET_USER_SECURITY_EXIT_DESCRIPTION') ?>
			</p>
		</div>
	<?php endif;?>
</div>

<script>
	BX.message(<?= Json::encode(Loc::loadLanguageFile(__FILE__)) ?>);
	BX.ready(() => {
		const pswBtn = document.querySelector('#intranet-user-otp-security__change-password');
		const securitySection = new BX.Intranet.SecuritySection({
			signedParameters: '<?= $this->getComponent()->getSignedParameters()?>',
			signedUserId: '<?= CUtil::JSEscape($arResult['OTP_PARAMS']['signedUserId'])?>',
			userId: '<?= CUtil::JSEscape($arParams['USER_ID'])?>',
			isCloud: <?= $arResult['IS_CLOUD'] ? 'true' : 'false' ?>,
			passwordNetworkUrl: '<?= $arResult['PROFILE']['CHANGE_PASSWORD_URL'] ?? ''?>',
			emailElement: BX('intranet-security-section-email'),
			phoneElement: BX('intranet-security-section-phone'),
			socservElement: BX('intranet-security-section-socserv'),
			passwordElement: pswBtn,
		});

		<?php if ($arResult["OTP"]["IS_ENABLED"] === 'Y' && $arResult["OTP"]["CAN_EDIT_OTP"] === 'Y'): ?>
		const params = {
			...<?= Json::encode($arResult['OTP_PARAMS']) ?>,
			title: '<?= $arResult["OTP"]["IS_PUSH_OTP_NEW"] === 'Y' ? \CUtil::JSEscape(Loc::getMessage('INTRANET_USER_SECURITY_BANNER_TITLE_NEW')) : \CUtil::JSEscape(Loc::getMessage('INTRANET_USER_SECURITY_BANNER_TITLE')) ?>',
			text: '<?= \CUtil::JSEscape(Loc::getMessage('INTRANET_USER_SECURITY_BANNER_DESC')) ?>',
			events: {
				onAppConnected: () => {
					securitySection.reload();
				}
			},
		};

		<?php if ($arResult["OTP"]["IS_PUSH_OTP_AVAILABLE"] === 'Y'): ?>
		BX.Intranet.BannerFactory.create(params)?.renderTo(BX('notify-banner-push-otp'));
		<?php endif; ?>

		<?php if (($arResult["OTP"]["IS_PHONE_CONFIRMATION_REQUIRED"] ?? 'N') === 'Y'): ?>
		const counterWrapper = document.querySelector('.intranet-user-otp-list__counter-wrapper');
		if (counterWrapper)
		{
			securitySection.renderPhoneConfirmationCounter(counterWrapper);
		}
		<?php endif; ?>

		const tfaBtn = document.querySelector('#intranet-user-otp-security__2fa-config');
		if (tfaBtn)
		{
			tfaBtn.onclick = () => {
				params.isNotPushOtp ? securitySection.openOld2Fa() : securitySection.open2FaSlider();
			};
		}
		<?php endif; ?>

		const logoutBtn = document.querySelector('.intranet-user-otp__footer .intranet-user-otp-list__disable-link');
		if (logoutBtn)
		{
			logoutBtn.onclick = () => {
				securitySection.logoutAll();
			};
		}

		if (pswBtn)
		{
			pswBtn.onclick = () => securitySection.openChangePassword();
		}

		<?php if (isset($arResult['CAN_VIEW_RESTORE_PASSWORD']) && $arResult['CAN_VIEW_RESTORE_PASSWORD']): ?>
		const resetPswBtn = document.querySelector('#intranet-security-section-reset-password');
		if (resetPswBtn)
		{
			const buttonContainer = resetPswBtn.querySelector('.intranet-user-otp-list__row-status');
			(new BX.Intranet.RestoreNetworkPassword({
				userId: '<?= CUtil::JSEscape($arParams['USER_ID']) ?>',
				usePhone: <?= !empty($arResult['PROFILE']['PHONE']) ? 'true' : 'false' ?>,
				useEmail: <?= !empty($arResult['PROFILE']['EMAIL']) ? 'true' : 'false' ?>,
			})).renderTo(buttonContainer);
		}
		<?php endif; ?>

	});
</script>
