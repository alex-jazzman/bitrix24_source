<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

use Bitrix\Main\Web\Json;
use Bitrix\Main\Localization\Loc;

/** @var CMain $APPLICATION */
/** @var array $arParams */
/** @var array $arResult */

foreach ($arResult['ERRORS'] as $error)
{
	ShowError($error);
}

foreach ($arResult['ROWS'] as $index => $data)
{
	foreach ($data as $dataKey => $dataValue)
	{
		if (is_string($data[$dataKey]))
		{
			$data[$dataKey] = htmlspecialcharsbx($dataValue);
		}
	}

	$actions = [];
	$arResult['ROWS'][$index] = array(
		'id' => $data['ID'],
		'columns' => $data,
		'actions' => $actions,
		'data' => $data,
	);
}

$APPLICATION->IncludeComponent("bitrix:sender.ui.panel.title", "", ['LIST' => [
	['type' => 'filter', 'params' => [
		"FILTER_ID" => $arParams['FILTER_ID'],
		"GRID_ID" => $arParams['GRID_ID'],
		"FILTER" => $arResult['FILTERS'],
		"FILTER_PRESETS" => $arResult['FILTER_PRESETS'],
		"DISABLE_SEARCH" => false,
		"ENABLE_LABEL" => true,
	]],
]]);


$snippet = new \Bitrix\Main\Grid\Panel\Snippet();
$controlPanel = array('GROUPS' => array(array('ITEMS' => array())));
if ($arParams['CAN_EDIT'])
{
	$button = $snippet->getEditButton();
	$button['TEXT'] = Loc::getMessage('SENDER_CONTACT_SET_LIST_BTN_EDIT');
	$button['TITLE'] = Loc::getMessage('SENDER_CONTACT_SET_LIST_BTN_EDIT_TITLE');
	$controlPanel['GROUPS'][0]['ITEMS'][] = $button;

	$button = $snippet->getRemoveButton();
	$button['TEXT'] = Loc::getMessage('SENDER_CONTACT_SET_LIST_BTN_REMOVE');
	$button['TITLE'] = Loc::getMessage('SENDER_CONTACT_SET_LIST_BTN_REMOVE_TITLE');
	$controlPanel['GROUPS'][0]['ITEMS'][] = $button;
}


$APPLICATION->IncludeComponent(
	"bitrix:main.ui.grid",
	"",
	array(
		"GRID_ID" => $arParams['GRID_ID'],
		"COLUMNS" => $arResult['COLUMNS'],
		"ROWS" => $arResult['ROWS'],
		"NAV_OBJECT" => $arResult['NAV_OBJECT'],
		"~NAV_PARAMS" => array('SHOW_ALWAYS' => false),
		'SHOW_ROW_CHECKBOXES' => $arParams['CAN_EDIT'],
		'SHOW_GRID_SETTINGS_MENU' => true,
		'SHOW_PAGINATION' => true,
		'SHOW_SELECTED_COUNTER' => true,
		'SHOW_TOTAL_COUNTER' => true,
		'ACTION_PANEL' => $controlPanel,
		"TOTAL_ROWS_COUNT" => $arResult['TOTAL_ROWS_COUNT'],
		'ALLOW_COLUMNS_SORT' => true,
		'ALLOW_COLUMNS_RESIZE' => true,
		"AJAX_MODE" => "Y",
		"AJAX_OPTION_JUMP" => "N",
		"AJAX_OPTION_STYLE" => "N",
		"AJAX_OPTION_HISTORY" => "N"
	)
);



?>
	<script>
		BX.ready(function () {

			BX.Sender.ContactList.init(<?=Json::encode(array(
				'messages' => $arResult['MESSAGES'],
				"gridId" => $arParams['GRID_ID'],
				'mess' => array()
			))?>);
		});
	</script>
<?