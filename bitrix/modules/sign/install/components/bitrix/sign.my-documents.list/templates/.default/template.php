<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arParams */
/** @var array $arResult */

/** @var $APPLICATION */

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Grid\Panel\Actions;
use Bitrix\Main\Grid\Panel\Types;
use Bitrix\Main\Web\Json;
use Bitrix\Sign\Helper\JsonHelper;
use Bitrix\Sign\Ui\MyDocumentsGrid\TextGenerator;
use Bitrix\Sign\Ui\MyDocumentsGrid\Template;

$APPLICATION->SetTitle($arResult['TITLE']);

\CJSCore::Init("loader");
\Bitrix\Main\UI\Extension::load([
	'sign.v2.grid.b2e.my-documents',
	'humanresources.hcmlink.salary-vacation-menu',
	'ui.hint',
	'applayout',
]);

$isAnnulMarkEnabled = (bool)($arParams['IS_ANNUL_MARK_ENABLED'] ?? false);

$gridRows = [];
$isBulkActionAvailable = (bool)($arParams['IS_BULK_ACTION_AVAILABLE'] ?? false);

$rows = $arResult['DOCUMENTS']->rows ?? [];
foreach ($rows as $row)
{
	$textGenerator = new TextGenerator($row);
	$template = new Template($textGenerator, $row, $isAnnulMarkEnabled);
	$bulkActions = $arResult['BULK_ACTIONS'][$row->id] ?? [];

	$gridRow = [
		'id' => $row->id,
		'data' => [
			'ID' => $row->id,
			'TITLE' => $template->getDocumentTitle(),
			'MEMBERS' => $template->getParticipants(),
			'ACTION' => $template->getAction(),
		],
	];
	if ($isBulkActionAvailable)
	{
		// every row stays selectable: what the selection allows is said by the action buttons of the
		// panel, so a row without actions blocks them with a reason instead of refusing the checkbox.
		// the key itself has to stay: the grid template reads it without checking that it is there
		$gridRow['attrs'] = ['data-bulk-actions' => implode(',', $bulkActions)];
		$gridRow['editable'] = true;
	}

	$gridRows[] = $gridRow;
}

// The panel is anchored to the toolbar strip, and this grid has two of them: a page keeps
// `.page__toolbar`, a side panel replaces it with `.ui-side-panel-toolbar`. An anchor absent from the
// current view leaves main.ui.grid throwing over a null node, taking the whole grid script with it.
$actionPanelRenderTo = $isBulkActionAvailable ? '.ui-side-panel-toolbar, .page__toolbar' : null;

$actionPanel = [];
if ($isBulkActionAvailable)
{
	$actionPanel = [
		'GROUPS' => [
			[
				'ITEMS' => [
					[
						'TYPE' => Types::BUTTON,
						'ID' => 'sign-my-documents-bulk-action-approve',
						'TEXT' => Loc::getMessage('SIGN_MY_DOCUMENTS_BULK_ACTION_APPROVE'),
						'ONCHANGE' => [
							[
								'ACTION' => Actions::CALLBACK,
								'DATA' => [
									['JS' => 'myDocumentsGrid.applyBulkAction(\'approve\');'],
								],
							],
						],
					],
					[
						'TYPE' => Types::BUTTON,
						'ID' => 'sign-my-documents-bulk-action-reject',
						'TEXT' => Loc::getMessage('SIGN_MY_DOCUMENTS_BULK_ACTION_REJECT'),
						'ONCHANGE' => [
							[
								'ACTION' => Actions::CALLBACK,
								'DATA' => [
									['JS' => 'myDocumentsGrid.applyBulkAction(\'reject\');'],
								],
							],
						],
					],
				],
			],
		],
	];
}

\Bitrix\UI\Toolbar\Facade\Toolbar::addFilter([
	"GRID_ID" => $arParams["GRID_ID"],
	"FILTER_ID" => $arParams["FILTER_ID"],
	"FILTER" => $arResult["FILTER"],
	"FILTER_PRESETS" => $arResult['FILTER_PRESETS'],
	"DISABLE_SEARCH" => false,
	"ENABLE_LIVE_SEARCH" => true,
	"ENABLE_LABEL" => true,
	'THEME' => Bitrix\Main\UI\Filter\Theme::MUTED,
]);

$APPLICATION->IncludeComponent(
	'bitrix:sign.document.counter.panel',
	'',
	[
		'ITEMS' => $arResult['COUNTER_ITEMS'],
		'TITLE' => Loc::getMessage('SIGN_MY_DOCUMENT_COUNTER_ITEMS_TITLE_MSG_1'),
		'FILTER_ID' => $arParams['FILTER_ID'],
		'RESET_ALL_FIELDS' => true,
	]
);

$APPLICATION->IncludeComponent(
	'bitrix:main.ui.grid',
	'',
	[
		'GRID_ID' => $arParams['GRID_ID'] ?? '',
		'COLUMNS' => $arParams['COLUMNS'] ?? '',
		'ROWS' => $gridRows,
		'NAV_OBJECT' => $arResult['PAGE_NAVIGATION'] ?? null,
		'SHOW_ROW_CHECKBOXES' => $isBulkActionAvailable,
		'SHOW_TOTAL_COUNTER' => true,
		'SHOW_PAGESIZE' => (bool)($arParams['SHOW_PAGESIZE'] ?? false),
		'PAGE_SIZES' => $arParams['PAGE_SIZES'] ?? [],
		'DEFAULT_PAGE_SIZE' => $arParams['DEFAULT_PAGE_SIZE'] ?? null,
		'TOTAL_ROWS_COUNT' => $arResult['TOTAL_COUNT'] ?? 0,
		'ALLOW_COLUMNS_SORT' => true,
		'ALLOW_SORT' => true,
		'ALLOW_COLUMNS_RESIZE' => true,
		'AJAX_MODE' => 'Y',
		'AJAX_OPTION_HISTORY' => 'N',
		'AJAX_OPTION_JUMP' => 'N',
		'SHOW_ACTION_PANEL' => false,
		'TOP_ACTION_PANEL_RENDER_TO' => $actionPanelRenderTo,
		'TOP_ACTION_PANEL_CLASS' => $isBulkActionAvailable ? 'sign-my-documents-bulk-action-panel' : null,
		'ACTION_PANEL' => $actionPanel,
	]
);
?>

<script>
	const myDocumentsGrid = new BX.Sign.V2.Grid.B2e.MyDocuments({
		gridId: '<?= CUtil::JSEscape($arParams['GRID_ID'] ?? '') ?>',
		bulkActionAvailable: <?= $isBulkActionAvailable ? 'true' : 'false' ?>,
		bulkActionLabels: {
			disabledHint: {
				approve: '<?= CUtil::JSEscape(Loc::getMessage('SIGN_MY_DOCUMENTS_BULK_ACTION_APPROVE_DISABLED_HINT') ?? '') ?>',
				reject: '<?= CUtil::JSEscape(Loc::getMessage('SIGN_MY_DOCUMENTS_BULK_ACTION_REJECT_DISABLED_HINT') ?? '') ?>',
			},
		},
		needActionCounterId: '<?= CUtil::JSEscape($arResult['NEED_ACTION_COUNTER_ID'] ?? '') ?>',
		counterPullEventName: '<?= CUtil::JSEscape($arResult['COUNTER_PULL_EVENT_NAME'] ?? '') ?>',
	});
	myDocumentsGrid.openSignSliderByGridId('#<?= CUtil::JSEscape($arParams['GRID_ID']) ?>');
	myDocumentsGrid.subscribeOnGridEvents();
	myDocumentsGrid.subscribeOnPullEvents();
</script>

<?php if (!empty($arParams['SALARY_VACATION_SETTINGS'] ?? [])):?>
<script>
	const salaryVacationButton = document.getElementsByClassName('<?= $arParams['SIGN_B2E_MY_DOCUMENTS_SALARY_VACATION_BUTTON_CLASS'] ?>')[0] ?? null;
	if (salaryVacationButton && BX.HumanResources.HcmLink.SalaryVacationMenu)
	{
		const salaryVacationMenu = new BX.HumanResources.HcmLink.SalaryVacationMenu('ui-btn');

		salaryVacationMenu
			.setSettings(<?= Json::encode($arParams['SALARY_VACATION_SETTINGS'] ?? []) ?>)
			.bindButton(salaryVacationButton)
		;
	}
</script>
<?php endif;?>

<?php if ($arParams['IS_B2E_FROM_EMPLOYEE_ENABLED'] ?? false):?>
	<script>
		BX.ready(function()
		{
			const analyticContext = <?=
				JsonHelper::encodeOrDefault(
					'{}',
					$arResult['SEND_DOCUMENT_BY_EMPLOYEE_ANALYTIC_CONTEXT'] ?? '',
				)
				?>;
			const elements = document.getElementsByClassName('<?= $arParams['SIGN_B2E_MY_DOCUMENTS_CREATE_BUTTON_CLASS'] ?? ''?>');
			if (elements && elements[0])
			{
				BX.bind(elements[0], 'click', () =>
				{
					<?php if ($arParams['IS_B2E_AVAILIBLE_IN_CURENT_TARIFF'] ?? false):?>
					BX.SidePanel.Instance.open('sign-b2e-settings-init-by-employee', {
						width: 750,
						cacheable: false,
						contentCallback: () => {
							return top.BX.Runtime.loadExtension(['sign.v2.b2e.sign-settings-employee']).then(exports => {
								const { B2EEmployeeSignSettings } = exports;
								const container = BX.Tag.render`<div id="sign-b2e-employee-settings-container"></div>`;
								const employeeSignSettings = new B2EEmployeeSignSettings(undefined, analyticContext);
								employeeSignSettings.renderToContainer(container);

								return container;
							});
						},
					});
					<?php else:?>
						top.BX.UI.InfoHelper.show('limit_office_e_signature');
					<?php endif;?>
				});
			}
		});
	</script>
<?php endif;?>
