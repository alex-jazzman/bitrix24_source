<?
/*
This is callback page for Odnoklassniki OAuth 2.0 authentication.
MyMailRu redirects only to specific back url set in the OAuth application.
The page opens in popup window after user authorized on Odnoklassniki.
*/
define("NOT_CHECK_PERMISSIONS", true);
require_once $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/socialservices/include/state_processing.php';

require_once($_SERVER['DOCUMENT_ROOT']."/bitrix/modules/main/include/prolog_before.php");

if(CModule::IncludeModule("socialservices"))
{
	$oAuthManager = new CSocServAuthManager();
	$oAuthManager->Authorize("Odnoklassniki");
}

require_once($_SERVER['DOCUMENT_ROOT']."/bitrix/modules/main/include/epilog_after.php");
?>