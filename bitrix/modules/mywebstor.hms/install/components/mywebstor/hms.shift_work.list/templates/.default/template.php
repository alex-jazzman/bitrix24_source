<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

/**
 * @var \CMain $APPLICATION
 * @var \CUser $USER
 * @var \CDatabase $DB
 * @var \LicensesLicenseListComponent $component
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

$addButton = new \Bitrix\UI\Buttons\AddButton(array(
    "click" => new \Bitrix\UI\Buttons\JsCode(
        'BX.SidePanel.Instance.open("/hms/config/shift_work/details/0/");'
    )
));

$toolbarManager = \Bitrix\UI\Toolbar\Manager::getInstance();
$toolbar = $toolbarManager->getToolbarById(\Bitrix\UI\Toolbar\Facade\Toolbar::DEFAULT_ID)
    ?: $toolbarManager->createToolbar(\Bitrix\UI\Toolbar\Facade\Toolbar::DEFAULT_ID, array());

$toolbar->addButton($addButton);

$APPLICATION->IncludeComponent(
    'bitrix:main.ui.grid',
    '',
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
        "NAME_TEMPLATE" => $arResult["NAME_TEMPLATE"],
        "ACTION_PANEL" => $arResult["ACTION_PANEL"],
        "SHOW_ACTION_PANEL" => true,
        "SHOW_ROW_CHECKBOXES" => false,
        "SETTINGS_WINDOW_TITLE" => $arResult["SETTINGS_WINDOW_TITLE"],
        "CACHE_TYPE" => "N",
        "MESSAGES" => $arResult["ERRORS"]
    )
); ?>
<script>
    BX.ready(function() {
        var shiftWorkList = BX.MyWebstor.HMS.ShiftWork.List.getInstance("<?= $arResult["GRID_ID"] ?>");
    });
</script>