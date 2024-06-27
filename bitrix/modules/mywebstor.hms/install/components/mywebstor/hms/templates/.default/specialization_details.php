<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();
/** @var \CMain $APPLICATION */
// include __DIR__ . "/include/menu.php";

$APPLICATION->IncludeComponent(
    "bitrix:ui.sidepanel.wrapper",
    "",
    array(
        "POPUP_COMPONENT_NAME" => "mywebstor:hms.specialization.details",
        "POPUP_COMPONENT_TEMPLATE_NAME" => "",
        "POPUP_COMPONENT_PARAMS" => array(
            "ID" => $arResult["SPECIALIZATION_ID"]
        ),
        "USE_UI_TOOLBAR" => "Y",
        "USE_PADDING" => false,
        "USE_BACKGROUND_CONTENT" => false,
        "CLOSE_AFTER_SAVE" => false,
        "RELOAD_GRID_AFTER_SAVE" => true,
        "RELOAD_PAGE_AFTER_SAVE" => true,
        "POPUP_COMPONENT_PARENT" => $component,
    ),
);
