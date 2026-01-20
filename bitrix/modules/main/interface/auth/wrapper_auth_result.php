<?php

/**
 * Bitrix vars
 * @global CMain $APPLICATION
 * @var string $inc_file From CMain::AuthForm()
 * @var array $arAuthResult From CMain::AuthForm()
 * @var string $last_login From wrapper.php
 * @var string $authUrl From wrapper.php
 * @var bool $bOnHit From wrapper.php
 * @var array $pullConfig From wrapper.php
 */

use Bitrix\Main\Web\Json;

if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)
{
	die();
}

if (!is_array($arAuthResult))
{
	$arAuthResult = array("TYPE" => "ERROR", "MESSAGE" => $arAuthResult);
}

if($inc_file === "otp")
{
	$arAuthResult['CAPTCHA'] = CModule::IncludeModule("security") && \Bitrix\Security\Mfa\Otp::isCaptchaRequired();
}
elseif($inc_file == 'forgot_password' || $inc_file == 'change_password')
{
	$arAuthResult['CAPTCHA'] = COption::GetOptionString("main", "captcha_restoring_password", "N") == "Y";
}
else
{
	$arAuthResult['CAPTCHA'] = $APPLICATION->NeedCAPTHAForLogin($last_login);
}

if ($arAuthResult['CAPTCHA'])
{
	$arAuthResult['CAPTCHA_CODE'] = $APPLICATION->CaptchaGetCode();
}

if (is_string($arAuthResult['MESSAGE']))
{
	$arAuthResult['MESSAGE'] = str_replace('<br>', ' ', $arAuthResult['MESSAGE']);
}

if ($bOnHit):
?>
<script>
	BX.ready(function(){BX.defer(BX.adminLogin.setAuthResult, BX.adminLogin)(<?= Json::encode($arAuthResult) ?>);});
</script>
<?
else:
?>
<script bxrunfirst="true">
<?php
if (!empty($pullConfig))
{
	$formParams = [
		'url' => $authUrl . (($s = DeleteParam(["logout", "login"])) == "" ? "" : "?" . $s),
		'pullConfig' => $pullConfig,
	];
?>
	top.BX.adminLogin.getForm('otp').setParams(<?= Json::encode($formParams) ?>);
<?php
}
?>
	top.BX.adminLogin.setAuthResult(<?= Json::encode($arAuthResult) ?>);
</script>
<?
endif;
