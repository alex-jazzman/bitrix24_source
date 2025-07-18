<?php
if(!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true)die();

use \Bitrix\Main\Localization\Loc;
use \Bitrix\Main\UI;

/**
 * @var array $arParams
 * @var array $arResult
 * @global \CMain $APPLICATION
 * @global \CUser $USER
 * @global \CDatabase $DB
 * @var \CBitrixComponentTemplate $this
 * @var \CBitrixComponent $component
 */

\Bitrix\Main\Loader::includeModule("ui");

\Bitrix\Main\UI\Extension::load([
	'ui.design-tokens',
]);

if (!empty($arResult['LINE_NAME']))
{
	$APPLICATION->SetTitle(Loc::getMessage('OL_STAT_TITLE', ['#LINE_NAME#' => htmlspecialcharsbx($arResult['LINE_NAME'])]));
}

if (!empty($arResult['ERROR_TEXT']))
{
	\ShowError($arResult['ERROR_TEXT']);
}

$isBitrix24Template = (SITE_TEMPLATE_ID == 'bitrix24');
if($isBitrix24Template)
{
	$bodyClass = $APPLICATION->GetPageProperty('BodyClass');
	$APPLICATION->SetPageProperty('BodyClass', ($bodyClass ? $bodyClass.' ' : '').'pagetitle-toolbar-field-view');
}

\Bitrix\UI\Toolbar\Facade\Toolbar::addFilter([
	'GRID_ID' => $arResult['GRID_ID'],
	'FILTER_ID' => $arResult['FILTER_ID'],
	'FILTER' => $arResult['FILTER'] ?? [],
	'FILTER_PRESETS' => $arResult['FILTER_PRESETS'] ?? [],
	'ENABLE_LIVE_SEARCH' => (bool)\Bitrix\Main\Config\Option::get('imopenlines', 'enable_live_search'),
	'ENABLE_LABEL' => true,
]);

$menuButton = new \Bitrix\UI\Buttons\Button([
	'icon' => \Bitrix\UI\Buttons\Icon::SETTINGS,
	'color' => \Bitrix\UI\Buttons\Color::LIGHT_BORDER,
	'dropdown' => false,
	"menu" => [
		"items" => [
			[
				"text" => Loc::getMessage('OL_COMPONENT_SESSION_CONFIGURATION_UF_TITLE'),
				"onclick" => new \Bitrix\UI\Buttons\JsCode(
					"
					BX.SidePanel.Instance.open('".CUtil::JSEscape($arResult['UF_LIST_CONFIG_URL'])."', {
						cacheable: false,
						allowChangeHistory: false,
						requestMethod: 'post',
						requestParams: {
							sessid: BX.bitrix_sessid()
						},
						width: 990
					});
				"
				)
			],
		],
	],
]);

if($arResult['ALLOW_MODIFY_SETTINGS'] === true)
{
	\Bitrix\UI\Toolbar\Facade\Toolbar::addButton($menuButton);
}


\Bitrix\UI\Toolbar\Facade\Toolbar::addButton([
	'text' => Loc::getMessage('OL_STAT_EXCEL'),
	'icon' => ($arResult['LIMIT_EXPORT'] === true) ? \Bitrix\UI\Buttons\Icon::LOCK : \Bitrix\UI\Buttons\Icon::DOWNLOAD,
	'color' => \Bitrix\UI\Buttons\Color::LIGHT_BORDER,
	'click' => new \Bitrix\UI\Buttons\JsCode($arResult['BUTTON_EXPORT']),
	'dataset' => [
		'toolbar-collapsed-icon' => Bitrix\UI\Buttons\Icon::DOWNLOAD
	]
]);


if ($isBitrix24Template)
{
	$isAdmin = \Bitrix\Main\Loader::includeModule('bitrix24') ? \CBitrix24::isPortalAdmin($USER->getId()) : $USER->IsAdmin();
	if($isAdmin)
	{
		echo Bitrix\Imopenlines\Ui\Helper::getStatisticStepper();
		echo Bitrix\Imopenlines\Ui\Helper::getMigrateQueueStepper();
		echo Bitrix\Imopenlines\Ui\Helper::getFixRecentDuplicatesStepper();
	}
}

$APPLICATION->IncludeComponent(
	'bitrix:main.ui.grid',
	'',
	[
		'GRID_ID' => $arResult['GRID_ID'],
		'HEADERS' => $arResult['HEADERS'],
		'ROWS' => $arResult['ELEMENTS_ROWS'],
		'NAV_OBJECT' => $arResult['NAV_OBJECT'],
		'SORT' => $arResult['SORT'],
		'ALLOW_COLUMNS_SORT' => true,
		'ALLOW_SORT' => true,
		'ALLOW_PIN_HEADER' => true,
		'ACTION_PANEL' => $arResult['GROUP_ACTIONS'],
		'SHOW_CHECK_ALL_CHECKBOXES' => true,
		'SHOW_ROW_CHECKBOXES' => true,
		'SHOW_ROW_ACTIONS_MENU' => true,
		'SHOW_GRID_SETTINGS_MENU' => true,
		'SHOW_NAVIGATION_PANEL' => true,
		'SHOW_SELECTED_COUNTER' => true,
		'SHOW_TOTAL_COUNTER' => true,
		'SHOW_PAGINATION' => true,
		'SHOW_PAGESIZE' => true,
		'PAGE_SIZES' => [
			['NAME' => '20', 'VALUE' => '20'],
			['NAME' => '50', 'VALUE' => '50'],
			['NAME' => '100', 'VALUE' => '100'],
		],
		'TOTAL_ROWS_COUNT' => $arResult['ROWS_COUNT'],
		'AJAX_MODE' => 'Y',
		'AJAX_OPTION_JUMP' => 'N',
		'AJAX_OPTION_HISTORY' => 'N',
		'AJAX_ID' => CAjax::GetComponentID('bitrix:imopenlines.statistics.detail', '.default', '')
	],
	$component,
	['HIDE_ICONS' => 'Y']
);

\Bitrix\Imopenlines\Ui\Helper::renderCustomSelectors($arResult['FILTER_ID'], $arResult['FILTER']);
UI\Extension::load([
	'ui.entity-selector',
	'ui.buttons',
	'ui.forms',
	'ui.stepprocessing',
]);
$isStExport = is_array($arResult['STEXPORT_PARAMS']);
if ($isStExport)
{
	?>
	<script>
		BX.ready(
			function()
			{
				BX.UI.StepProcessing.ProcessManager.create(<?=\Bitrix\Main\Web\Json::encode([
					'id' => 'OpenLinesExport',
					'component' => 'bitrix:imopenlines.statistics.detail',
					'componentMode' => 'ajax',
					'messages' => [
					 	'DialogTitle' => Loc::getMessage('OL_STAT_EXCEL_EXPORT_POPUP_TITLE'),
						'DialogSummary' => Loc::getMessage('OL_STAT_EXCEL_EXPORT_POPUP_BODY'),
						'DialogStartButton' => Loc::getMessage('OL_STAT_EXCEL_EXPORT_POPUP_BTN_START'),
						'DialogStopButton' => Loc::getMessage('OL_STAT_EXCEL_EXPORT_POPUP_BTN_STOP'),
						'DialogCloseButton' => Loc::getMessage('OL_STAT_EXCEL_EXPORT_POPUP_BTN_CLOSE'),
						//'RequestError' => Loc::getMessage('OL_STAT_EXCEL_EXPORT_POPUP_REQUEST_ERR'),
						//'WaitingResponse' => Loc::getMessage('OL_STAT_EXCEL_EXPORT_POPUP_WAIT'),
					],
					'queue' => [
						[
							'action' => 'dispatcher',
						],
					],
					'params' => $arResult['STEXPORT_PARAMS'],
					'dialogMaxWidth' => 610,
				])?>);
			}
		);
	</script>
	<?php
}

UI\Extension::load([
	'ui.sidepanel.layout',
	'ui.notification'
]);
?>
<script>
	BX.ready(
		function()
		{
			BX.message({
				LIST_GROUP_ACTION_TITLE: '<?= CUtil::JSEscape(Loc::getMessage('OL_STAT_EXCEL_ACTIONS_TITLE'))?>',
				LIST_GROUP_ACTION_SUMMARY: '<?= CUtil::JSEscape(Loc::getMessage('OL_STAT_EXCEL_ACTIONS_BODY'))?>',
				LIST_GROUP_ACTION_CLOSE: '<?= CUtil::JSEscape(Loc::getMessage('OL_COMPONENT_SESSION_LIST_GROUP_ACTION_CLOSE_TITLE'))?>',
				LIST_GROUP_ACTION_SPAM: '<?= CUtil::JSEscape(Loc::getMessage('OL_COMPONENT_SESSION_LIST_GROUP_ACTION_SPAM_TITLE'))?>',
				LIST_GROUP_ACTION_TRANSFER: '<?= CUtil::JSEscape(Loc::getMessage('OL_COMPONENT_SESSION_LIST_GROUP_ACTION_TRANSFER_TITLE'))?>',
				OL_COMPONENT_SESSION_CONFIRM_GROUP_ACTION: '<?= CUtil::JSEscape(Loc::getMessage('OL_COMPONENT_SESSION_CONFIRM_GROUP_ACTION'))?>',//TODO: del
				OL_COMPONENT_SESSION_GROUP_ACTION_OPEN_LINES_TITLE: '<?= CUtil::JSEscape(Loc::getMessage('OL_COMPONENT_SESSION_GROUP_ACTION_OPEN_LINES_TITLE')) ?>',
				CONFIGURATION_UF_TITLE: '<?= CUtil::JSEscape(Loc::getMessage('OL_COMPONENT_SESSION_CONFIGURATION_UF_TITLE')) ?>',
				FILTER_SHARE_URL: '<?= CUtil::JSEscape(Loc::getMessage('OL_COMPONENT_SESSION_FILTER_SHARE_URL')) ?>',
				FILTER_SHARE_URL_DONE: '<?= CUtil::JSEscape(Loc::getMessage('OL_COMPONENT_SESSION_FILTER_SHARE_URL_DONE')) ?>'
			});

			BX.OpenLines.GridActions.gridId = "<?= CUtil::JSEscape($arResult['GRID_ID'])?>";//TODO: del
			BX.OpenLines.Actions.init(
				"<?= CUtil::JSEscape($arResult['GRID_ID'])?>",
				<?= CUtil::PhpToJSObject(array_merge(
					$arResult['groupActionsData'],
					['filterId' => $arResult['FILTER_ID']]
				))?>
			);

			<?php if($arResult['ALLOW_MODIFY_SETTINGS'] === true):?>
				BX.OpenLines.Configuration.init({
					configurationButton: BX('ol-stat-configuration-button'),
					ufFieldListUrl: '<?= CUtil::JSEscape($arResult['UF_LIST_CONFIG_URL'])?>'
				});
			<?php endif;?>

			<?php if($arResult['FDC_MODE'] === true):?>
				BX.OpenLines.GridFilter.init({
					filterId: '<?= $arResult['FILTER_ID'] ?>',
					linkId: 'ol-stat-filter-list-url'
				});
			<?php endif; ?>
		}
	);
</script>

<?php if ($arResult['META_RESTRICTION_LABEL']): ?>
	<div class="intranet-contact-center-extremist-organization-label">
		<span><?= Loc::getMessage("OL_STAT_META_RESTRICTION_RU") ?></span>
	</div>
<?php endif ?>