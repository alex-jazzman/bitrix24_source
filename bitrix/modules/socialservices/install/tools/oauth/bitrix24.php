<?
/*
This is callback page for Bitrix24 OAuth 2.0 authentication.
Google redirects only to specific back url set in the OAuth application.
The page opens in popup window after user authorized on Bitrix24.
*/
define("NOT_CHECK_PERMISSIONS", true);
require_once $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/socialservices/include/state_processing.php';

require_once($_SERVER['DOCUMENT_ROOT']."/bitrix/modules/main/include/prolog_before.php");

if(CModule::IncludeModule("socialservices"))
{
	$oAuthManager = new CSocServAuthManager();
	$oAuthManager->Authorize("Bitrix24OAuth");
}

require_once($_SERVER['DOCUMENT_ROOT']."/bitrix/modules/main/include/epilog_after.php");
?>