<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

use Bitrix\Main\Localization\Loc;

/**
 * @var \CMain $APPLICATION
 * @var \CUser $USER
 * @var \CDatabase $DB
 * @var \HmsVhiServiceTypeDetailsComponent $component
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

Loc::loadMessages(__DIR__);

$toolbarManager = \Bitrix\UI\Toolbar\Manager::getInstance();
$toolbar = $toolbarManager->getToolbarById(\Bitrix\UI\Toolbar\Facade\Toolbar::DEFAULT_ID)
    ?: $toolbarManager->createToolbar(\Bitrix\UI\Toolbar\Facade\Toolbar::DEFAULT_ID, array());

$toolbar->deleteFavoriteStar();
$removeButton = new \Bitrix\UI\Buttons\Button(array(
    "text" => Loc::getMessage("HMS_VHI_TYPE_BUTTON_DELETE"),
    "className" => "ui-btn-light-border",
    "click" => new \Bitrix\UI\Buttons\JsCode(
        'BX.MyWebstor.HMS.Vhi.Type.Details.Instance.delete();'
    )
));
if ($arResult["ID"] > 0)
    $toolbar->addButton($removeButton);

\Bitrix\Main\UI\Extension::load(array(
    "mywebstor.hms.entity-editor-fields",
    "mywebstor.hms.entity-selector",
    "crm.entity-selector"
));

$APPLICATION->IncludeComponent(
    "bitrix:ui.form",
    "",
    array(
        "ENTITY_TYPE_NAME" => $arResult["ENTITY_TYPE_NAME"],
        "ENTITY_ID" => $arResult["ID"],
        "GUID" => $arResult["GUID"],
        "READ_ONLY" => false,
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
        "FORCE_DEFAULT_CONFIG" => true,
        "ENTITY_FIELDS" => $arResult["ENTITY_FIELDS"],
        "ENTITY_CONFIG" => $arResult["ENTITY_CONFIG"],
        "ENTITY_CONFIG_OPTIONS" => $arResult["ENTITY_CONFIG_OPTIONS"],
        "ENTITY_DATA" => $arResult["ENTITY_DATA"],
        "ENTITY_CONTROLLERS" => $arResult["ENTITY_CONTROLLERS"],
        "COMPONENT_AJAX_DATA" => $arResult["COMPONENT_AJAX_DATA"]
    )
); ?>
<script>
    BX.ready(function() {
        var vhiDetails = BX.MyWebstor.HMS.Vhi.Type.Details.getInstance(
            <?=
            \CUtil::PhpToJSObject(array(
                "GUID" => $arResult["GUID"],
                "ID" => $arResult["ID"]
            ))
            ?>
        );
    });
</script>
