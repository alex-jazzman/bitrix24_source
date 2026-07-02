<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}
/** @var CBitrixComponentTemplate $this */
/** @var array $arParams */
/** @var array $arResult */
/** @global CDatabase $DB */
/** @global CUser $USER */
/** @global CMain $APPLICATION */
/** @var CBitrixComponent $component */

use Bitrix\Main\Engine\CurrentUser;

$pageId = 'user_tasks';
$userId = (int)$arResult['VARIABLES']['user_id'];
$templateId = (int)$arResult['VARIABLES']['template_id'];
$action = $arResult['VARIABLES']['action'];

$userId = CurrentUser::get()->getId();
$backgroundForTemplate = true;
require_once('user_templates_template_background.php');
