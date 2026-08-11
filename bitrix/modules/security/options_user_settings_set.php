<?php
/**
 * @global int $ID - Edited user id
 * @global CUser $USER
 * @global CMain $APPLICATION
 */

use Bitrix\Security\Mfa\Otp;
use Bitrix\Security\Mfa\OtpException;
use Bitrix\Main\Localization\Loc;

$securityWarningTmp = "";
$security_res = true;
if(
	$ID > 0
	&& CModule::IncludeModule("security")
	&& check_bitrix_sessid()
	&& $USER->CanDoOperation('security_edit_user_otp')
	&& (!empty($_POST['security_SYNC1']) || isset($_POST['security_EMAIL']))
)
{
	if (!empty($_POST['security_EMAIL']) && !check_email($_POST['security_EMAIL'], true))
	{
		$APPLICATION->ThrowException(Loc::getMessage('security_user_edit_incorrect_email'));
		$security_res = false;

		return;
	}

	try
	{
		$otp = Otp::getByUser($ID);
		if (!empty($_POST['security_SYNC1']))
		{
			$otp->syncParameters($_POST['security_SYNC1'], $_POST['security_SYNC2']);
		}
		if (isset($_POST['security_EMAIL']))
		{
			$otp->setEmail($_POST['security_EMAIL'] ?: null);
		}
		$otp->save();
	}
	catch (OtpException $e)
	{
		$APPLICATION->ThrowException($e->getMessage());
		$security_res = false;
	}
}
