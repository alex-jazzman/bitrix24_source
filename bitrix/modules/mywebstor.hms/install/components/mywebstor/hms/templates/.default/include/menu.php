<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();
/** @var \CMain $APPLICATION */
/** @var \CBitrixComponent $component */

$templatePage = $component->getTemplatePage();
if ($templatePage == "config")
    $templatePage = $arResult["TEMPLATE_PAGE"];

$APPLICATION->IncludeComponent(
    "mywebstor:hms.menu",
    "",
    array(
        "ID" => $templatePage
    ),
    $component
);
