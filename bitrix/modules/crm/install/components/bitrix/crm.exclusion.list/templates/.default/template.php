<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

use Bitrix\Main\Web\Json;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\UI\Buttons\Color;
use Bitrix\UI\Buttons\Icon;
use Bitrix\UI\Toolbar\ButtonLocation;
use Bitrix\UI\Toolbar\Facade\Toolbar;

\Bitrix\Main\Loader::includeModule('ui');

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

	if ($data['TYPE_NAME'])
	{
		$data['TYPE_ID'] = $data['TYPE_NAME'];
	}

	$actions = array();
	if ($arParams['CAN_EDIT'])
	{
		$actions[] = array(
			'TITLE' => Loc::getMessage('CRM_EXCLUSION_LIST_BTN_REMOVE_TITLE'),
			'TEXT' => Loc::getMessage('CRM_EXCLUSION_LIST_BTN_REMOVE'),
			'ONCLICK' => "BX.Crm.Exclusion.Grid.removeFromExclusions({$data['ID']});"
		);
	}

	$arResult['ROWS'][$index] = array(
		'id' => $data['ID'],
		'columns' => $data,
		'actions' => $actions
	);
}

Toolbar::deleteFavoriteStar();
Toolbar::addFilter([
	"FILTER_ID" => $arParams['FILTER_ID'],
	"GRID_ID" => $arParams['GRID_ID'],
	"FILTER" => $arResult['FILTERS'],
	"DISABLE_SEARCH" => true,
	"ENABLE_LABEL" => true,
]);

if ($arParams['CAN_EDIT'])
{
	$button = new Bitrix\UI\Buttons\Button([
		'text' => Loc::getMessage('CRM_EXCLUSION_LIST_BTN_ADD'),
		'link' => htmlspecialcharsbx($arParams['PATH_TO_IMPORT']),
		'color' => Color::PRIMARY,
		'icon' => Icon::ADD,
	]);
	$button->addAttribute('id', 'CRM_EXCLUSION_BUTTON_ADD');
	Toolbar::addButton($button, ButtonLocation::AFTER_TITLE);
}

Extension::load("ui.buttons");
Extension::load("ui.buttons.icons");


$snippet = new \Bitrix\Main\Grid\Panel\Snippet();
$controlPanel = array('GROUPS' => array(array('ITEMS' => array())));
if ($arParams['CAN_EDIT'])
{
	$button = $snippet->getRemoveButton();
	$button['TEXT'] = Loc::getMessage('CRM_EXCLUSION_LIST_BTN_REMOVE');
	$button['TITLE'] = Loc::getMessage('CRM_EXCLUSION_LIST_BTN_REMOVE_TITLE');
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
		'SHOW_ROW_CHECKBOXES' => true,
		'SHOW_GRID_SETTINGS_MENU' => true,
		'SHOW_PAGESIZE' => true,
		'DEFAULT_PAGE_SIZE' => 10,
		'PAGE_SIZES' => array(
			array('NAME' => '10', 'VALUE' => '10'),
			array('NAME' => '20', 'VALUE' => '20'),
			array('NAME' => '50', 'VALUE' => '50'),
			array('NAME' => '100', 'VALUE' => '100'),
		),
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
	<style>
		.crm-exclusion-page-size-menu .menu-popup-item
		{
			width: 110px;
		}

		.crm-exclusion-page-size-menu .menu-popup-item-icon
		{
			position: absolute;
			left: 20px;
			margin-left: 0;
		}

		.crm-exclusion-page-size-menu .menu-popup-item-text
		{
			box-sizing: border-box;
			padding: 0 20px;
			text-align: center;
		}
	</style>
	<script>
		BX.ready(function () {
			var gridId = <?=Json::encode($arParams['GRID_ID'])?>;

			var pageSizeSelector = null;
			var pageSizePopup = null;
			var documentHandlersBound = false;
			var pageSizeValues = ['10', '20', '50', '100'];
			var pageSizeMenuId = gridId + '_page_size_menu';

			var setupPageSizeSelector = function () {
				var selector = document.getElementById(gridId + '_grid_page_size');
				pageSizeSelector = selector;
				if (!selector || selector.dataset.crmExclusionPageSizeA11y === 'Y')
				{
					return;
				}

				var isPopupVisible = function (popup) {
					return popup && popup.offsetParent !== null;
				};

				var isPageSizePopup = function (popup) {
					if (!isPopupVisible(popup))
					{
						return false;
					}

					if (popup.classList.contains('main-grid-panel-select-pagesize-list'))
					{
						return true;
					}

					var items = popup.querySelectorAll('.menu-popup-item, .main-grid-panel-select-pagesize-list-item');
					return Array.prototype.some.call(items, function (item) {
						return /^(10|20|50|100)$/.test((item.textContent || '').trim());
					});
				};

				var findPopup = function () {
					if (isPageSizePopup(pageSizePopup))
					{
						return pageSizePopup;
					}

					pageSizePopup = Array.prototype.find.call(
						document.querySelectorAll('.main-grid-panel-select-pagesize-list, .menu-popup'),
						isPageSizePopup
					) || null;

					return pageSizePopup;
				};

				var syncExpandedState = function () {
					selector.setAttribute('aria-expanded', findPopup() ? 'true' : 'false');
				};

				var focusFirstItem = function () {
					var popup = findPopup();
					if (!popup)
					{
						syncExpandedState();
						return;
					}

					popup.setAttribute('role', 'menu');
					var item = popup.querySelector('.menu-popup-item, .main-grid-panel-select-pagesize-list-item');
					if (item)
					{
						item.setAttribute('role', 'menuitem');
						item.setAttribute('tabindex', '-1');
						item.focus();
					}

					syncExpandedState();
				};

				var selectPageSize = function (value, menuItem) {
					if (menuItem)
					{
						menuItem.getMenuWindow().close();
					}

					setPageSizeValue(value);

					var grid = BX.Main.gridManager.getInstanceById(gridId);
					if (!grid || !grid.getUserOptions)
					{
						return;
					}

					var userOptions = grid.getUserOptions();
					userOptions.setPageSize(value, function () {
						if (grid.reloadTable)
						{
							grid.reloadTable('POST', { clear_nav: 'Y' });
						}
						else if (grid.reload)
						{
							grid.reload();
						}
					});
				};

				var getPageSizeValue = function () {
					var pageSizeValue = selector.getAttribute('data-value') || '10';
					try
					{
						pageSizeValue = JSON.parse(pageSizeValue);
					}
					catch (error)
					{
						pageSizeValue = selector.getAttribute('data-value') || '10';
					}
					if (BX.type.isPlainObject(pageSizeValue))
					{
						pageSizeValue = pageSizeValue.VALUE;
					}

					return pageSizeValues.indexOf(String(pageSizeValue)) !== -1 ? String(pageSizeValue) : '10';
				};

				var setPageSizeValue = function (value) {
					selector.setAttribute('data-value', value);
					var pageSizeName = selector.querySelector('.main-ui-select-name');
					if (pageSizeName)
					{
						pageSizeName.textContent = value;
					}
					else
					{
						selector.textContent = value;
					}
				};

				var openPageSizePopup = function () {
					var selectedPageSize = getPageSizeValue();

					BX.PopupMenu.destroy(pageSizeMenuId);
					BX.PopupMenu.show(
						pageSizeMenuId,
						selector,
						pageSizeValues.map(function (value) {
							return {
								text: value,
								className: value === selectedPageSize ? 'menu-popup-item-accept-sm' : 'menu-popup-item-none',
								onclick: function (event, item) {
									selectPageSize(value, item);
								}
							};
						}),
						{
							autoHide: true,
							closeByEsc: true,
							className: 'crm-exclusion-page-size-menu'
						}
					);

					pageSizePopup = null;
					setTimeout(focusFirstItem, 0);
				};

				setPageSizeValue(getPageSizeValue());

				selector.dataset.crmExclusionPageSizeA11y = 'Y';
				selector.setAttribute('role', 'button');
				selector.setAttribute('data-testid', 'crm-exclusion-page-size-selector');
				selector.setAttribute('tabindex', '0');
				selector.setAttribute('aria-haspopup', 'menu');
				selector.setAttribute('aria-expanded', 'false');

				selector.addEventListener('click', function (event) {
					event.preventDefault();
					event.stopImmediatePropagation();
					openPageSizePopup();
				}, true);

				BX.bind(selector, 'keydown', function (event) {
					if (event.key !== 'Enter' && event.key !== ' ')
					{
						return;
					}

					event.preventDefault();
					openPageSizePopup();
				});

				if (!documentHandlersBound)
				{
					documentHandlersBound = true;
					document.addEventListener('click', function (event) {
						setTimeout(function () {
							if (!pageSizeSelector)
							{
								return;
							}

							var target = event.target;
							if (
								target
								&& target !== pageSizeSelector
								&& !pageSizeSelector.contains(target)
								&& (!isPageSizePopup(pageSizePopup) || !pageSizePopup.contains(target))
							)
							{
								pageSizePopup = null;
								pageSizeSelector.setAttribute('aria-expanded', 'false');

								return;
							}

							pageSizeSelector.setAttribute('aria-expanded', findPopup() ? 'true' : 'false');
						}, 0);
					}, true);
					document.addEventListener('keydown', function (event) {
						if (
							event.key === 'Escape'
							&& pageSizeSelector
							&& pageSizeSelector.getAttribute('aria-expanded') === 'true'
						)
						{
							BX.PopupMenu.destroy(pageSizeMenuId);
							pageSizePopup = null;
							setTimeout(function () {
								pageSizeSelector.setAttribute('aria-expanded', 'false');
								pageSizeSelector.focus();
							}, 0);
						}
					}, true);
				}
			};

			BX.Crm.Exclusion.Grid.init(<?=Json::encode([
				'messages' => $arResult['MESSAGES'],
				"gridId" => $arParams['GRID_ID'],
				'signedParameters' => $this->getComponent()->getSignedParameters(),
				'componentName' => $this->getComponent()->getName(),
				'mess' => array()
			])?>);
			setupPageSizeSelector();
			BX.addCustomEvent('Grid::updated', setupPageSizeSelector);
		});
	</script>
<?
