<?php

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Page\Asset;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\UI\PageNavigation;
use Bitrix\Main\Web\Json;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * @var array $arParams
 * @var array $arResult
 * @var CMain $APPLICATION
 * @var CBitrixComponent $component
 * @var CBitrixComponentTemplate $this
 */

Extension::load([
	'tooltip',
	'ui',
	'ui.alerts',
	'ui.buttons',
	'ui.buttons.icons',
	'ui.icons',
	'ui.dialogs.messagebox',
]);

Asset::getInstance()->addJs('/bitrix/js/bizproc/tools.js');

$templates = $arResult['viewData']['gridData'] ?? [];

$gridRows = [];

function createUserCell(array $data): string
{
	if (empty($data))
	{
		return '';
	}

	$html = <<< HTML
		<div class="bizproc-template-processes-grid-username-wrapper">
			<a class="bizproc-template-processes-grid-username">
				<span class="ui-icon ui-icon-common-user bizproc-template-processes-grid-avatar %s">
					<i %s></i>
				</span>
				<span bx-tooltip-user-id="%s" class="bizproc-template-processes-grid-username-inner">
					%s
				</span>
			</a>
		</div>
	HTML;

	return sprintf(
		$html,
		htmlspecialcharsbx($data['visible']),
		$data['style'],
		htmlspecialcharsbx($data['userId']),
		htmlspecialcharsbx($data['fullName'])
	);
}

function createNameCell(array $data): string
{
	$descriptionHtml = !empty($data['description'])
		? sprintf('<div class="%s">%s</div>', 'bizproc-template-processes-grid-description', htmlspecialcharsbx($data['description']))
		: null;

	$html = <<< HTML
		<div class="bizproc-template-processes-grid-document-name-wrapper">
			<a class="ui-btn-link ui-typography-text-lg ui-typography-text-bold" href="/bizprocdesigner/editor/?ID=%s" target="_blank">
				%s
			</a>
			%s
		</div>
	HTML;

	return sprintf($html, htmlspecialcharsbx($data['templateId']), htmlspecialcharsbx($data['name']), $descriptionHtml);
}

foreach ($templates as $row)
{
	$gridRows[] = [
		'id' => $row['ID'],
		'columns' => [
			'NAME' => createNameCell($row['NAME']),
			'ACTIONS' => $row['ACTIONS'],
			'EDITOR' => createUserCell($row['EDITOR'] ?? []),
			'CREATOR' => createUserCell($row['CREATOR'] ?? []),
			'MODIFIED' => htmlspecialcharsbx($row['MODIFIED']),
		],
		'actions' => [
			[
				'TEXT' => Loc::getMessage('BIZPROC_TEMPLATE_PROCESSES_DELETE_BUTTON_TEXT'),
				'ONCLICK' => "BX.Bizproc.Component.TemplateProcesses.Instance.deleteTemplateAction({$row['ID']})",
			],
		],
	];
}

global $APPLICATION;

/** @var PageNavigation $pageNavigation */
$pageNavigation = $arResult['pageNavigation'];

$APPLICATION->IncludeComponent(
	'bitrix:main.ui.grid',
	'',
	[
		'GRID_ID' => $arResult['gridId'],
		'COLUMNS' => $arResult['gridColumns'],
		'ROWS' => $gridRows,
		'SHOW_ROW_CHECKBOXES' => false,
		'NAV_OBJECT' => $arResult['pageNavigation'],
		'AJAX_MODE' => 'Y',
		'AJAX_ID' => CAjax::getComponentID('bitrix:bizproc.template.processes', '.default', ''),
		'PAGE_SIZES' => $arResult['pageSizes'],
		'AJAX_OPTION_JUMP' => 'N',
		'SHOW_ROW_ACTIONS_MENU' => true,
		'SHOW_GRID_SETTINGS_MENU' => true,
		'SHOW_NAVIGATION_PANEL' => true,
		'SHOW_PAGINATION' => true,
		'SHOW_MORE_BUTTON' => true,
		'ENABLE_NEXT_PAGE' => $pageNavigation->getCurrentPage() < $pageNavigation->getPageCount(),
		'CURRENT_PAGE' => $pageNavigation->getCurrentPage(),
		'NAV_PARAM_NAME' => $arResult['navigationId'],
		'SHOW_SELECTED_COUNTER' => false,
		'SHOW_TOTAL_COUNTER' => true,
		'TOTAL_ROWS_COUNT' => $arResult['pageNavigation']->getRecordCount(),
		'SHOW_PAGESIZE' => true,
		'SHOW_ACTION_PANEL' => true,
		'ACTION_PANEL' => $arResult['gridActions'] ?? null,
		'ALLOW_COLUMNS_SORT' => true,
		'ALLOW_COLUMNS_RESIZE' => true,
		'ALLOW_HORIZONTAL_SCROLL' => true,
		'ALLOW_INLINE_EDIT' => true,
		'ALLOW_SORT' => true,
		'ALLOW_PIN_HEADER' => true,
		'AJAX_OPTION_HISTORY' => 'N',
		'HANDLE_RESPONSE_ERROR' => true,
		'MESSAGES' => array_map(
			fn($error) => [
				'TEXT' => $error->getMessage(),
				'TYPE' => 'error',
			],
			$this->getComponent()->getErrors(),
		),
	],
);

$messages = Loc::loadLanguageFile(__FILE__);

?>
<div id="bp-template-processes-errors-container"></div>

<script>
	BX.ready(function () {
		BX.message(<?= Json::encode($messages) ?>);
		BX.Bizproc.Component.TemplateProcesses.Instance = new BX.Bizproc.Component.TemplateProcesses({
			componentName: '<?= CUtil::JSEscape('bitrix:bizproc.template.processes') ?>',
			signedParameters: '<?= CUtil::JSEscape($this->getComponent()->getSignedParameters())?>',
			gridId: '<?= CUtil::JSEscape($arResult['gridId'])?>',
		});
	});
</script>