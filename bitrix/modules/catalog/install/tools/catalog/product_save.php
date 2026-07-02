<?php

use Bitrix\Catalog\Access\AccessController;
use Bitrix\Catalog\Access\ActionDictionary;
use Bitrix\Main\Loader;

if ($_SERVER['REQUEST_METHOD'] !== 'POST')
{
	die();
}

const NO_AGENT_CHECK = true;
const STOP_STATISTICS = true;
const NO_KEEP_STATISTIC = 'Y';
const NO_AGENT_STATISTIC = 'Y';
const DisableEventsCheck = true;

require_once($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_before.php');

if (!Loader::includeModule('catalog'))
{
	die();
}

if (!AccessController::getCurrent()->check(ActionDictionary::ACTION_PRODUCT_ADD))
{
	die();
}

const URL_BUILDER_TYPE = 'INVENTORY';
include($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/iblock/admin/iblock_element_edit.php');
