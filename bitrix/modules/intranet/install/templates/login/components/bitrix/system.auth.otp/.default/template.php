<?php

use Bitrix\Main\Localization\Loc;

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)
{
	die();
}
/**
 * @global CMain $APPLICATION
 * @var array $arParams
 * @var array $arResult
 */

\Bitrix\Main\UI\Extension::load([
	'ui.forms',
	'ui.vue3',
	'intranet.login.otp-auth',
	'ui.hint',
	'ui.icon-set.outline'
]);
?>

<?php
if ($arResult['REQUIRED_BY_MANDATORY'] === true)
{
?>
	<div class="intranet-island__otp">
	<?php
	$APPLICATION->IncludeComponent(
		'bitrix:security.auth.otp.mandatory',
		$arResult['IS_DEFAULT_PUSH_OTP'] ? 'push-otp' : '',
		[
			'AUTH_LOGIN_URL' => $arResult['~AUTH_LOGIN_URL'],
			'NOT_SHOW_LINKS' => $arParams['NOT_SHOW_LINKS'],
		],
	);
	?>
	</div>
<?php
}
elseif (isset($_GET['help']) && $_GET['help'] === 'Y')
{
?>
	<div class="intranet-island__otp">
		<div>
			<div class="intranet-otp-help-header"><?=Loc::getMessage('INTRANET_AUTH_OTP_HELP_TITLE')?></div>
			<div class="intranet-otp-help-additional-wrap">
				<a href="<?=htmlspecialcharsbx($arResult['AUTH_OTP_LINK'])?>" class="intranet-otp-help-additional-text"><?=Loc::getMessage('INTRANET_AUTH_OTP_BACK')?></a>
			</div>
		</div>
		<hr class="b_line_gray">
		<div class="intranet-otp-help-text">
			<?=Loc::getMessage('INTRANET_AUTH_OTP_HELP_TEXT_MSGVER_1', array('#PATH#' => $this->GetFolder()))?>
			<div class="intranet-otp-help-footer">
				<a href="<?=htmlspecialcharsbx($arResult['AUTH_OTP_LINK'])?>" class="intranet-otp-help-btn"><?=Loc::getMessage('INTRANET_AUTH_OTP_BACK')?></a>
			</div>
		</div>
	</div>
<?php
}
else
{
?>
<div class="intranet-island__otp <?= $arResult['USE_PUSH_OTP'] ? '--push' : '' ?>" data-role="otp-container">

</div>

<script>
	BX.ready(() => {
		const params = {
			containerNode: document.querySelector("[data-role='otp-container']"),
			authUrl: '<?= $arResult['AUTH_URL'] ?>',
			authOtpHelpLink: '<?= htmlspecialcharsbx($arResult["AUTH_OTP_HELP_LINK"]) ?>',
			authLoginUrl: '<?= htmlspecialcharsbx($arResult["AUTH_LOGIN_URL"]) ?>',
			rememberOtp: <?= $arResult['REMEMBER_OTP'] ? 'true' : 'false' ?>,
			captchaCode: '<?= $arResult['CAPTCHA_CODE'] ?? '' ?>',
			notShowLinks: <?= isset($arResult['NOT_SHOW_LINKS']) && $arResult['NOT_SHOW_LINKS'] ? 'true' : 'false' ?>,
			isBitrix24: <?= IsModuleInstalled('bitrix24') ? 'true' : 'false' ?>,
			<?php if ($arResult['USE_PUSH_OTP']): ?>
			pushOtpConfig: <?= \Bitrix\Main\Web\Json::encode($arResult['PUSH_OTP']) ?>,
			canLoginBySms: <?= $arResult['CAN_LOGIN_BY_SMS'] ? 'true' : 'false' ?>,
			isRecoveryCodesEnabled: <?= $arResult['IS_RECOVERY_CODES_ENABLED'] ? 'true' : 'false' ?>,
			maskedUserAuthPhoneNumber: '<?= $arResult['USER_MASKED_AUTH_PHONE_NUMBER'] ?? '' ?>',
			currentStep: '<?= $arResult['CURRENT_STEP'] ?>',
			recoveryCodesHelpLink: '<?= $arResult['RECOVERY_CODES_HELP_LINK'] ?>',
			userDevice: <?= \Bitrix\Main\Web\Json::encode($arResult['USER_DEVICE']) ?>,
			<?php endif; ?>
			errorMessage: '<?= CUtil::JSescape($arResult['ERROR_MESSAGE']) ?>',
		};
		BX.Intranet.Login.OtpAuth.init(params);
	});
</script>
<?php
}
?>


