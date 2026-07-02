<?php

use Bitrix\Catalog\Access\AccessController;
use Bitrix\Catalog\Access\ActionDictionary;
use Bitrix\Main\Loader;

if (!defined('URL_BUILDER_TYPE'))
{
	define('URL_BUILDER_TYPE', 'INVENTORY');
}
if (!defined('SELF_FOLDER_URL'))
{
	define('SELF_FOLDER_URL', '/shop/settings/');
}
if (!defined('INTERNAL_ADMIN_PAGE'))
{
	define('INTERNAL_ADMIN_PAGE', 'Y');
}

require_once($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_before.php');

if (!Loader::includeModule('catalog'))
{
	die();
}

if (!AccessController::getCurrent()->check(ActionDictionary::ACTION_PRODUCT_ADD))
{
	die();
}

include($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/iblock/admin/iblock_element_edit.php');
