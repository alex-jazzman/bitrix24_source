<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
	die;

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

/**
 * @var $arResult array
 * @var $arParams array
 */

Extension::load([
	"ui.buttons",
	"ui.alerts",
	"ui.fonts.opensans",
	"intranet.notify-banner.push-otp",
	"intranet.push-otp.connect-popup",
	"intranet.push-otp.menu",
	'ui.design-tokens',
	'intranet.design-tokens',
	'ui.system.typography',
]);

$this->addExternalCss('/bitrix/components/bitrix/intranet.user.profile.section.security/templates/.default/style.css');

$arJSParams = [
	"signedParameters" => $this->getComponent()->getSignedParameters(),
	"componentName" => $this->getComponent()->getName(),
	"otpDays" => $arResult["OTP"]["DAY_LIST"],
	"showOtpPopup" => (isset($_GET["otp"]) && $_GET["otp"] == "Y") ? "Y" : "N",
	//"otpRecoveryCodes" => $arResult["IS_OTP_RECOVERY_CODES_ENABLE"] ? "Y" : "N",

	...$arResult["OTP"]["PUSH_OTP_CONFIG"],
	'provideSmsOtp' => $arResult['PROVIDE_SMS_OTP'] === true,
	'canShowBannerPushOtp' => (int)$USER->GetID() === (int)$arParams["USER_ID"],
	'isOtpActive' => $arResult["OTP"]["IS_ACTIVE"] === true,
	'isNotPushOtp' => $arResult['OTP']['TYPE'] !== \Bitrix\Security\Mfa\OtpType::Push,
];

?>

<div class="intranet-user-otp">
	<p class="intranet-user-otp__description ui-text --sm">
		<?= Loc::getMessage('INTRANET_USER_OTP_LIST_DESCRIPTION')?>
	</p>

	<ul class="intranet-user-otp-list">
		<li class="intranet-user-otp-list__section-row">
			<div class="intranet-user-otp-list__section-row-header-wrapper">
				<div class="intranet-user-otp-list__section-row-header">
					<div class="intranet-user-otp-list__row-label ui-text --md">
						<div class="ui-icon-set --o-mobile"></div>
						<?= Loc::getMessage('INTRANET_USER_OTP_LIST_DEVICES') ?>
					</div>
						<div class="intranet-user-otp-list__row-status">
							<?php if ($arResult["OTP"]["IS_EXIST"] && !empty($arResult["OTP"]["DEVICE_INFO"])): ?>
							<div class="intranet-user-otp-list__row-value ui-text --md">
								<?php if(
										!empty($arResult['OTP']['DEVICE_INFO']['platform'])
										&& in_array(strtolower($arResult['OTP']['DEVICE_INFO']['platform']), ['ios', 'android'])
								): ?>
									<div class="intranet-user-otp-list__device-icon intranet-user-otp-list__device-icon--<?= mb_strtolower($arResult['OTP']['DEVICE_INFO']['platform']) ?>"></div>
								<?php else: ?>
									<div class="intranet-user-otp-list__device-icon intranet-user-otp-list__device-icon--unknown"></div>
								<?php endif; ?>
								<?= $arResult["OTP"]["DEVICE_INFO"]['displayModel']?>
							</div>
							<?php endif; ?>
							<a class="intranet-user-otp-list__change-btn ui-link ui-link-secondary ui-link-dashed" onclick="BX.Intranet.UserOtpConnected.getPopupOtpProvider().onlyPushOtp().show()">
								<?= Loc::getMessage('INTRANET_USER_OTP_LIST_CHANGE_BTN')?>
							</a>
						</div>
				</div>
				<div class="intranet-user-otp-list__section-row-description">
					<?= Loc::getMessage('INTRANET_USER_OTP_LIST_DEVICES_DESCRIPTION')?>
				</div>
			</div>
		</li>

		<?php if ($arResult['PROVIDE_SMS_OTP']): ?>
		<li class="intranet-user-otp-list__section-row">
			<div class="intranet-user-otp-list__section-row-header-wrapper">
				<div class="intranet-user-otp-list__section-row-header">
					<div class="intranet-user-otp-list__row-label ui-text --md">
						<div class="ui-icon-set --o-sms"></div>
						<?= Loc::getMessage('INTRANET_USER_OTP_LIST_SMS') ?>
					</div>
					<div class="intranet-user-otp-list__row-status<?= empty($arResult['OTP']['PHONE_NUMBER']) ? ' --single' : '' ?>">
						<div class="intranet-user-otp-list__row-value ui-text --md">
							<?php if (!$arResult['OTP']['PHONE_NUMBER_CONFIRMED'] && $arResult['OTP']['PHONE_NUMBER']): ?>
							<div
								data-hint="<?= Loc::getMessage('INTRANET_USER_OTP_LIST_SMS_HINT') ?>"
								data-hint-no-icon="true"
								class="ui-hint ui-icon-set --o-alert-accent"
								onclick="BX.Intranet.UserOtpConnected.getPopupOtpProvider().onlySmsOtpConfirm().show()"
							></div>
							<?php elseif (empty($arResult['OTP']['PHONE_NUMBER'])): ?>
								<div
									data-hint="<?= Loc::getMessage('INTRANET_USER_OTP_LIST_SMS_HINT_WITHOUT_CONNECT') ?>"
									data-hint-no-icon="true"
									class="ui-hint ui-icon-set --o-alert-accent"
									onclick="BX.Intranet.UserOtpConnected.getPopupOtpProvider().onlySmsOtpChange().show()"
								></div>
							<?php endif; ?>
							<?= $arResult['OTP']['PHONE_NUMBER'] ?? '' ?>
						</div>
						<a class="intranet-user-otp-list__change-btn ui-link ui-link-secondary ui-link-dashed" onclick="BX.Intranet.UserOtpConnected.getPopupOtpProvider().onlySmsOtpChange().show()">
							<?= !empty($arResult['OTP']['PHONE_NUMBER']) ? Loc::getMessage('INTRANET_USER_OTP_LIST_CHANGE_BTN') : Loc::getMessage('INTRANET_USER_OTP_LIST_ADD_PHONE_NUMBER_BTN') ?>
						</a>
					</div>
				</div>
				<div class="intranet-user-otp-list__section-row-description">
					<?= Loc::getMessage('INTRANET_USER_OTP_LIST_SMS_DESCRIPTION')?>
				</div>
			</div>
		</li>
		<?php endif; ?>

		<?php if ($arResult["OTP"]["CAN_USE_RECOVERED_CODES"]):
			$component = new \CBitrixComponent();
			$component->initComponent('bitrix:security.user.recovery.codes');
			$component->setSiteTemplateId('bitrix24');
			$component->IncludeComponent('push', [
					"MODE" => '',
					"PATH_TO_CODES" => $arParams['PATH_TO_CODES'],
			], null);
		endif; ?>
	</ul>

	<div class="intranet-user-otp__footer">
		<?php if (!$arResult["OTP"]["IS_ACTIVE"] && $arResult["OTP"]["IS_EXIST"]): ?>
			<a class="intranet-user-otp-list__disable-link ui-link ui-link-dashed" href="#" onclick="resumeOtp()">
				<?= Loc::getMessage('INTRANET_USER_OTP_LIST_ENABLE_DEF_BTN')?>
			</a>
		<?php elseif (
			$arResult["OTP"]["IS_ACTIVE"]
			&& (
				$arResult["OTP"]["USER_HAS_EDIT_RIGHTS"]
				|| !$arResult["OTP"]["IS_MANDATORY"]
			)
		): ?>
			<a class="intranet-user-otp-list__disable-link intranet-user-otp-list__disable-link--alert ui-link ui-link-dashed" href="#" onclick="pauseOtp(this)">
				<?= Loc::getMessage('INTRANET_USER_OTP_LIST_DISABLE_DEF_BTN')?>
			</a>
		<?php endif ?>
	</div>
</div>

<script>
	BX.ready(function () {
		BX.Intranet.UserOtpConnected.init(<?= CUtil::PhpToJSObject($arJSParams)?>);
		BX.UI.Hint.init(BX('intranet-user-otp'));
	});

	function pauseOtp(element)
	{
		const callback = (item) => {
			BX.Intranet.PushOtp.pauseOtpRequest(
				item.numDays,
				'<?= CUtil::JSEscape($arResult["OTP"]["PUSH_OTP_CONFIG"]['signedUserId'])?>',
			).then(() => BX.SidePanel.Instance.reload());
		}

		const menu = new BX.Intranet.PushOtp.Menu(element, {
			days: <?= Json::encode($arResult["OTP"]["DAY_LIST"])?>,
			callback: callback,
		});

		menu.show();
	}

	function resumeOtp()
	{
		BX.Intranet.UserOtpConnected
			.getPopupOtpProvider()
			.resumeOtpRequest()
			.then(() => BX.SidePanel.Instance.reload());
	}
</script>
