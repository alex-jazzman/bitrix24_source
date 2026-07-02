<?php
define("NOT_CHECK_PERMISSIONS", true);
require_once $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/socialservices/include/state_processing.php';

require_once($_SERVER['DOCUMENT_ROOT'] . "/bitrix/modules/main/include/prolog_before.php");

if (CModule::IncludeModule('socialservices'))
{
	$oAuthManager = new CSocServAuthManager();
	$oAuthManager->Authorize('zoom');
}

require_once($_SERVER['DOCUMENT_ROOT'] . "/bitrix/modules/main/include/epilog_after.php");
?>