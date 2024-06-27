<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();
/** @var \CMain $APPLICATION */
if ($arResult["IS_MENU_SHOW"])
    include(__DIR__ . "/include/menu.php");

$APPLICATION->IncludeComponent(
    $arResult["COMPONENT_NAME"],
    $arResult["COMPONENT_TEMPLATE"],
    $arResult["COMPONENT_PARAMS"]
);
