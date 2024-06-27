<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

/**
 * @var \CMain $APPLICATION
 * @var \CUser $USER
 * @var \CDatabase $DB
 * @var \HmsAppointmentListComponent $component
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

$toolbarManager = \Bitrix\UI\Toolbar\Manager::getInstance();
$toolbar = $toolbarManager->getToolbarById(\Bitrix\UI\Toolbar\Facade\Toolbar::DEFAULT_ID)
    ?: $toolbarManager->createToolbar(\Bitrix\UI\Toolbar\Facade\Toolbar::DEFAULT_ID, array());

$addButton = new \Bitrix\UI\Buttons\AddButton(array(
    "click" => new \Bitrix\UI\Buttons\JsCode(
        'BX.SidePanel.Instance.open("/hms/reception/appointment/details/0/");'
    )
));

$toolbar->addButton($addButton);

$toolbar->addFilter(array(
    "GRID_ID" => $arResult["GRID_ID"],
    "FILTER_ID" => $arResult["GRID_ID"],
    "FILTER" => $component->prepareFilterFields(),
    "ENABLE_LIVE_SEARCH" => true,
    "ENABLE_LABEL" => true
));

$APPLICATION->IncludeComponent(
    "bitrix:main.ui.grid",
    "",
    array(
        "GRID_ID" => $arResult["GRID_ID"],
        "SORT" => $arResult["SORT"],
        "SORT_VARS" => $arResult["SORT_VARS"],
        "HEADERS" => $arResult["HEADERS"],
        "ROWS" => $arResult["ROWS"],
        "AJAX_MODE" => "Y",
        "AJAX_OPTION_JUMP" => "N",
        "AJAX_OPTION_HISTORY" => "N",
        "SHOW_NAVIGATION_PANEL" => true,
        "SHOW_PAGINATION" => true,
        "SHOW_TOTAL_COUNTER" => true,
        "SHOW_PAGESIZE" => true,
        "PAGE_SIZES" => $arResult["PAGE_SIZES"],
        "DEFAULT_PAGE_SIZE" => "5",
        "SHOW_ROW_ACTIONS_MENU" => true,
        "SHOW_SELECTED_COUNTER" => false,
        "NAV_OBJECT" => $arResult["NAV_OBJECT"],
        "PAGINATION" => array(),
        "ALLOW_SORT" => true,
        "ALLOW_ROWS_SORT" => false,
        "ALLOW_ROWS_SORT_IN_EDIT_MODE" => true,
        "ALLOW_ROWS_SORT_INSTANT_SAVE" => false,
        "ENABLE_ROW_COUNT_LOADER" => false,
        "HIDE_FILTER" => false,
        "ENABLE_COLLAPSIBLE_ROWS" => false,
        "ADVANCED_EDIT_MODE" => false,
        "TOTAL_ROWS_COUNT" => $arResult["NAV_OBJECT"]->getRecordCount(),
        "NAME_TEMPLATE" => Loc::getMessage('HMS_APPOINTMENT_LIST_TITLE'),
        "ACTION_PANEL" => $arResult["ACTION_PANEL"],
        "SHOW_ACTION_PANEL" => true,
        "SHOW_ROW_CHECKBOXES" => false,
        "SETTINGS_WINDOW_TITLE" => Loc::getMessage('HMS_APPOINTMENT_LIST_TITLE'),
        "CACHE_TYPE" => "N",
        "MESSAGES" => $arResult["ERRORS"]
    )
); ?>
<script>
    BX.ready(function() {
        var appointmentList = BX.MyWebstor.HMS.Appointment.List.getInstance(
            <?=
            \CUtil::PhpToJSObject(array(
                "GRID_ID" => $arResult["GRID_ID"],
                "IS_TAB" => !empty($arParams["CONTACT_ID"]) && $arParams["CONTACT_ID"] > 0,
                "SIGNED_PARAMETERS" => $component->getSignedParameters()
            ))
            ?>
        );
    });
</script>
