<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
	die;

use Bitrix\Main\Localization\Loc;

\Bitrix\Main\UI\Extension::load([
	"ui.buttons",
	"ui.alerts",
	"ui.fonts.opensans",
	"intranet.notify-banner.push-otp",
	"intranet.push-otp.connect-popup",
	'ui.design-tokens',
	'intranet.design-tokens',
]);

/**
 * @var array $arParams
 * @var array $arResult
 * @var CBitrixComponent $component
 * @global CMain $APPLICATION
 * @global CUser $USER
 */
?>

<div class="intranet-user-otp-con-top">
	
	<div class="intranet-user-otp-con-top-title"><?= GetMessage("INTRANET_USER_OTP_AUTH")?></div>
	<?php
	if ($arResult["OTP"]["IS_ACTIVE"])
	{
	?>
		<div class="intranet-user-otp-con-top-status">
			<span class="intranet-user-otp-con-top-status-block intranet-user-otp-con-top-status-block-on">
				<?= GetMessage("INTRANET_USER_OTP_ACTIVE")?>
			</span>

			<?if ($arResult["OTP"]["USER_HAS_EDIT_RIGHTS"]|| !$arResult["OTP"]["IS_MANDATORY"]):?>
				<a class="intranet-user-otp-con-top-status-link" href="javascript:void(0)" data-role="intranet-otp-deactivate">
					<?= GetMessage("INTRANET_USER_OTP_DEACTIVATE")?>
				</a>
			<?endif?>
		</div>

		<?if ($USER->GetID() == $arParams["USER_ID"]):?>
			<a class="ui-btn ui-btn-light-border" href="javascript:void(0)" data-role="intranet-otp-change-phone"><?= GetMessage("INTRANET_USER_OTP_CHANGE_PHONE_1")?></a>
			<div id="notify-banner-push-otp"></div>
		<?endif?>
	<?php
	}
	elseif (
		!$arResult["OTP"]["IS_ACTIVE"]
		&& $arResult["OTP"]["IS_MANDATORY"]
	) {
	?>
		<div class="intranet-user-otp-con-top-status">
			<span class="intranet-user-otp-con-top-status-block intranet-user-otp-con-top-status-block-off">
				<?= ($arResult["OTP"]["IS_EXIST"]) ? GetMessage("INTRANET_USER_OTP_NOT_ACTIVE") : GetMessage("INTRANET_USER_OTP_NOT_EXIST")?>
			</span>
			<?php
			if ($arResult["OTP"]["IS_EXIST"])
			{
			?>
				<a class="intranet-user-otp-con-top-status-link" href="javascript:void(0)" onclick="BX.Intranet.UserOtpConnected.activateUserOtp()"><?= GetMessage("INTRANET_USER_OTP_ACTIVATE")?></a>
			<?php
			}
			else
			{
				if ($USER->GetID() == $arParams["USER_ID"]):?>
					<a class="intranet-user-otp-con-top-status-link" href="javascript:void(0)" data-role="intranet-otp-change-phone">
						<?= GetMessage("INTRANET_USER_OTP_SETUP")?>
					</a>
				<?else:?>
					<a class="intranet-user-otp-con-top-status-link" href="javascript:void(0)" data-role="intranet-otp-defer">
						<?= GetMessage("INTRANET_USER_OTP_PROROGUE")?>
					</a>
				<?endif;
			}
			?>
		</div>

		<?if ($arResult["OTP"]["IS_EXIST"] && $USER->GetID() == $arParams["USER_ID"]):?>
			<a class="ui-btn ui-btn-light-border" href="javascript:void(0)" data-role="intranet-otp-change-phone">
				<?= GetMessage("INTRANET_USER_OTP_CHANGE_PHONE_1")?>
			</a>
		<?endif;

		if ($arResult["OTP"]["NUM_LEFT_DAYS"])
		{
		?>
			<div style="margin-left: 10px">
				<div class="ui-alert ui-alert-xs ui-alert-warning">
					<span class="ui-alert-message">
						<?= Loc::getMessage("INTRANET_USER_OTP_LEFT_DAYS", [
							"#NUM#" => "<strong>" . $arResult["OTP"]["NUM_LEFT_DAYS"] . "</strong>",
						])?>
					</span>
				</div>
			</div>
		<?php
		}
	}
	elseif (
		!$arResult["OTP"]["IS_ACTIVE"]
		&& $arResult["OTP"]["IS_EXIST"]
		&& !$arResult["OTP"]["IS_MANDATORY"]
	) {
		?>
		<div class="intranet-user-otp-con-top-status">
			<span class="intranet-user-otp-con-top-status-block intranet-user-otp-con-top-status-block-off">
				<?= GetMessage("INTRANET_USER_OTP_NOT_ACTIVE")?>
			</span>

			<a class="intranet-user-otp-con-top-status-link" href="javascript:void(0)" onclick="BX.Intranet.UserOtpConnected.activateUserOtp()"><?= GetMessage("INTRANET_USER_OTP_ACTIVATE")?></a>
		</div>
		<?php
		if ($USER->GetID() == $arParams["USER_ID"])
		{
		?>
			<a class="ui-btn ui-btn-light-border" href="javascript:void(0)" data-role="intranet-otp-change-phone">
				<?= GetMessage("INTRANET_USER_OTP_CHANGE_PHONE_1")?>
			</a>
		<?php
		}

		if ($arResult["OTP"]["NUM_LEFT_DAYS"])
		{
		?>
			<div style="width: 100%; margin-top: 10px;">
				<div class="ui-alert ui-alert-xs ui-alert-warning ui-alert-text-center">
					<span class="ui-alert-message">
						<?= Loc::getMessage("INTRANET_USER_OTP_LEFT_DAYS", [
							"#NUM#" => "<strong>" . $arResult["OTP"]["NUM_LEFT_DAYS"] . "</strong>",
						])?>
					</span>
				</div>
			</div>
		<?php
		}
	}
	elseif (
		!$arResult["OTP"]["IS_ACTIVE"]
		&& !$arResult["OTP"]["IS_EXIST"]
	) {
	?>
		<div class="intranet-user-otp-con-top-status">
			<span class="intranet-user-otp-con-top-status-block intranet-user-otp-con-top-status-block-off">
				<?= GetMessage("INTRANET_USER_OTP_NOT_EXIST")?>
			</span>
		</div>
		<?php
		if ($USER->GetID() == $arParams["USER_ID"])
		{
			?>
			<a class="ui-btn ui-btn-light-border" href="javascript:void(0)" data-role="intranet-otp-change-phone">
				<?= GetMessage("INTRANET_USER_OTP_CONNECT")?>
			</a>
			<?php
		}
	}
	?>

	<!-- codes --><?php
	if (
		$USER->GetID() == $arParams["USER_ID"]
		&& $arResult["OTP"]["IS_ACTIVE"]
		&& $arResult["OTP"]["ARE_RECOVERY_CODES_ENABLED"]
	) {
	?>
		<a href="javascript:void(0)" class="ui-btn ui-btn-link" data-role="intranet-recovery-codes"><?= GetMessage("INTRANET_USER_OTP_CODES")?></a>
	<?php
	}

?>
</div>

<?php
$arJSParams = [
	"signedParameters" => $this->getComponent()->getSignedParameters(),
	"componentName" => $this->getComponent()->getName(),
	"otpDays" => $arResult["OTP"]["DAY_LIST"],
	"showOtpPopup" => (isset($_GET["otp"]) && $_GET["otp"] == "Y") ? "Y" : "N",
	//"otpRecoveryCodes" => $arResult["IS_OTP_RECOVERY_CODES_ENABLE"] ? "Y" : "N",
];
?>
<script>
	BX.ready(function () {
		BX.Intranet.UserOtpConnected.init(<?= CUtil::PhpToJSObject($arJSParams)?>);
	});
</script>

