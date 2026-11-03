<?php

use Bitrix\Call\Integration\Intranet\SyncPageRouter;
use Bitrix\Main\Context;
use Bitrix\Main\Loader;

require_once($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/main/include/prolog_before.php');

// Full width page without the chat bar; the site template reads the constant while drawing the header
if (Loader::includeModule('call') && class_exists(SyncPageRouter::class))
{
	$requestedPage = (string)Context::getCurrent()->getRequest()->getRequestedPage();
	if (SyncPageRouter::resolvePage($requestedPage) === SyncPageRouter::PAGE_CALLS)
	{
		define('AIR_TEMPLATE_HIDE_CHAR_BAR', true);
	}
}

require($_SERVER['DOCUMENT_ROOT'].'/bitrix/header.php');

$APPLICATION->IncludeComponent('bitrix:call.sync', '.default', []);

require($_SERVER['DOCUMENT_ROOT'].'/bitrix/footer.php');
