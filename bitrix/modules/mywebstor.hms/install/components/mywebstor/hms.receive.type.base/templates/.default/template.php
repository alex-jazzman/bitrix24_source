<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

/**
 * @var \CMain $APPLICATION
 * @var \CUser $USER
 * @var \CDatabase $DB
 * @var \HmsReceiveTypeBaseComponent $component
 * @var \CBitrixComponentTemplate $this
 * @var array $arParams
 * @var array $arResult
 * @var array $templateData
 * @var string $templateFolder
 * @var string $parentTemplateFolder
 * @var string $templateName
 * @var string $componentPath
 */
global $APPLICATION, $USER, $DB;

use Bitrix\Main\Localization\Loc;

Loc::loadMessages(__FILE__);

include_once(__DIR__ . "/messages.php");

$APPLICATION->IncludeComponent(
    "bitrix:ui.form",
    "",
    array(
        "ENTITY_TYPE_NAME" => $arResult["ENTITY_TYPE_NAME"],
        "ENTITY_ID" => $arResult["ID"],
        "GUID" => $arResult["GUID"],
        "READ_ONLY" => $arResult["READ_ONLY"],
        "ENABLE_BOTTOM_PANEL" => true,
        "ENABLE_FIELDS_CONTEXT_MENU" => false,
        "ENABLE_PAGE_TITLE_CONTROLS" => true,
        "ENABLE_SECTION_EDIT" => false,
        "ENABLE_SECTION_CREATION" => false,
        "ENABLE_SETTINGS_FOR_ALL" => true,
        "ENABLE_SECTION_DRAG_DROP" => false,
        "ENABLE_FIELD_DRAG_DROP" => false,
        "ENABLE_CONFIGURATION_UPDATE" => false,
        "ENABLE_COMMON_CONFIGURATION_UPDATE" => true,
        "ENABLE_PERSONAL_CONFIGURATION_UPDATE" => true,
        "ENABLE_CONFIG_CONTROL" => false,
        "ENABLE_CONFIG_SCOPE_TOGGLE" => false,
        "ENABLE_TOOL_PANEL" => false,
        "INITIAL_MODE" => $arResult["INITIAL_MODE"],
        "ENTITY_FIELDS" => $arResult["ENTITY_FIELDS"],
        "ENTITY_CONFIG" => $arResult["ENTITY_CONFIG"],
        "ENTITY_CONFIG_OPTIONS" => $arResult["ENTITY_CONFIG_OPTIONS"],
        "ENTITY_DATA" => $arResult["ENTITY_DATA"],
        "ENTITY_CONTROLLERS" => $arResult["ENTITY_CONTROLLERS"],
        "COMPONENT_AJAX_DATA" => $arResult["COMPONENT_AJAX_DATA"]
    )
);
?>

<script>
    BX.ready(function() {
        var receiveDetails = BX.MyWebstor.HMS.Receive.Base.getInstance(
            <?= \CUtil::PhpToJSObject(array(
                "entityEditorID" => $arResult["GUID"],
                "ID" => $arResult["ID"],
            )) ?>
        );
    });
</script>
