<?php
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)
{
	die();
}

use Bitrix\Security\Mfa\Otp;
use Bitrix\Security\Mfa\OtpType;
use Bitrix\Security\Controller\PushOtp;

/*
Parameters:
	AUTH_RESULT - Authorization result message
	NOT_SHOW_LINKS - Whether to show links to register page && password restoration (Y/N)
*/

/**
 * @var array $arParams
 * @var array $arResult
 * @global CMain $APPLICATION
 */

$arParams["NOT_SHOW_LINKS"] = ($arParams["NOT_SHOW_LINKS"] == "Y" ? "Y" : "N");

$arParamsToDelete = array(
	"login",
	"logout",
	"register",
	"forgot_password",
	"change_password",
	"confirm_registration",
	"confirm_code",
	"confirm_user_id",
	"logout_butt",
);

$arResult["AUTH_URL"] = $APPLICATION->GetCurPageParam("", $arParamsToDelete);

$arResult["AUTH_LOGIN_URL"] = $APPLICATION->GetCurPageParam("login_form=yes", $arParamsToDelete);

$arResult["REMEMBER_OTP"] = (COption::GetOptionString('security', 'otp_allow_remember') === 'Y');

$arResult["REQUIRED_BY_MANDATORY"] = false;

$arRes = array();
foreach($arResult as $key=>$value)
{
	$arRes[$key] = htmlspecialcharsbx($value);
	$arRes['~'.$key] = $value;
}
$arResult = $arRes;

$arResult["CAPTCHA_CODE"] = false;
$arResult["USE_PUSH_OTP"] = false;

if(CModule::IncludeModule("security"))
{
	if (Otp::isCaptchaRequired())
	{
		$arResult["CAPTCHA_CODE"] = $APPLICATION->CaptchaGetCode();
	}
	if (Otp::isOtpRequiredByMandatory())
	{
		if(empty($arParams["~AUTH_RESULT"]) || $arParams["~AUTH_RESULT"] === true)
		{
			$arResult["REQUIRED_BY_MANDATORY"] = true;
			$arParams["~AUTH_RESULT"] = array("MESSAGE" => GetMessage("system_auth_otp_required"), "TYPE" => "ERROR");
		}
	}

	$otpParams = Otp::getDeferredParams();
	$arResult["USER_ID"] = $otpParams['USER_ID'];

	if (Otp::isPushPossible())
	{
		if (!empty($otpParams['OTP_TYPE']) && $otpParams['OTP_TYPE'] === OtpType::Push->value)
		{
			$arResult["USE_PUSH_OTP"] = true;
			$arResult["PUSH_OTP"] = PushOtp::getPullConfig();

			$controller = new PushOtp();
			if ($controller->sendMobilePushAction($arResult["PUSH_OTP"]['channelTag']) === null)
			{
				$errorString = '';
				foreach ($controller->getErrors() as $error)
				{
					$errorString .= ' ' . $error->getMessage();
				}
				$arParams["~AUTH_RESULT"] = array("MESSAGE" => GetMessage('system_auth_otp_error_push_otp') . $errorString, "TYPE" => "ERROR");
			}
		}
	}
}

$this->IncludeComponentTemplate();
