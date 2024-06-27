<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();
/** @var \CMain $APPLICATION */
// include __DIR__ . "/include/menu.php";

$request = \Bitrix\Main\Application::getInstance()->getContext()->getRequest();

$uploadUri = new \Bitrix\Main\Web\Uri($request->getRequestUri());
$uploadUri->addParams(array("UPLOAD" => "Y"));

$APPLICATION->IncludeComponent(
    "bitrix:ui.sidepanel.wrapper",
    "",
    array(
        "POPUP_COMPONENT_NAME" => "bitrix:documentgenerator.templates",
        "POPUP_COMPONENT_TEMPLATE_NAME" => $request->get("UPLOAD") == "Y" ? "upload" : "",
        "POPUP_COMPONENT_PARAMS" => array(
            "UPLOAD_URI" => $uploadUri,
            "ID" => $request->get("ID"),
            "MODULE" => "mywebstor.hms",
            "PROVIDER" => $request->get("entityTypeId")
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
