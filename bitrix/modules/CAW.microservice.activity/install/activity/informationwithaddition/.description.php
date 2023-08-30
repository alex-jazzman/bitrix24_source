<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true) die();

use \Bitrix\Main\Localization\Loc;
Loc::loadLanguageFile(__FILE__);

$arActivityDescription = array(
    'NAME' => Loc::getMessage('MAIN_ACTIVITY_DESCR_NAME'),
    "DESCRIPTION" => Loc::getMessage('MAIN_ACTIVITY_DESCR_DESCR'),
    "TYPE" => "activity",
    "CLASS" => "InformationWithAddition",
    "JSCLASS" => "BizProcActivity",
    "CATEGORY" => array(
        "ID" => "other",
        'OWN_ID' => 'CAW',
        'OWN_NAME' => Loc::getMessage('MAIN_ACTIVITY_CATEGORY_NAME')
    ),
);
?>