<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)
{
	die;
}

use Bitrix\Intranet\Internal\Integration\Main\OtpSigner;
use Bitrix\Intranet\Internal\Integration\Security\OtpSettings;
use Bitrix\Intranet\Internal\Integration\Security\PersonalOtp;
use Bitrix\Intranet\Internal\Service\Otp\MobilePush;
use Bitrix\Intranet\Repository\UserRepository;

$otp = (new OtpSettings());
$deferredParams = $otp->getDeferredParams();
$currentUser = (new UserRepository())->getUserById($deferredParams['USER_ID']);

if ($currentUser)
{
	$arResult['SIGNED_USER_ID'] = (new OtpSigner())->signUserId($currentUser->getId());
	$personalOtp = new PersonalOtp($currentUser);
	$pushOtp = MobilePush::createByDefault();
	$arResult['END_MANDATORY_PERIOD'] = $personalOtp->getGracePeriod()?->getTimestamp();
	$arResult['PROMOTE_MODE'] = $pushOtp->getPromoteMode()->value;
	$arResult['PUSH_OTP_CONFIG'] = $personalOtp->getOtpConfig();
	$arResult['DEEPLINK'] = $personalOtp->getDeeplink($arResult['PUSH_OTP_CONFIG']['intent']);
}
