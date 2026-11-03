<?php

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;
use Bitrix\Tasks\Access\TaskAccessController;
use Bitrix\Tasks\UI\ScopeDictionary;
use Bitrix\UI\Buttons;
use Bitrix\UI\Toolbar\Facade\Toolbar;
use Bitrix\UI\Toolbar\ButtonLocation;

Extension::load([
	'ui.stepprocessing',
	'tasks.deadline.menu',
	'ui.analytics',
]);

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$menuBtn = new Buttons\Button([
	'color' => Buttons\Color::LIGHT_BORDER,
	'icon' => Buttons\Icon::SETTING,
]);
$menuBtn->addClass('ui-btn-themes webform-cogwheel');
$menuBtn->addAttribute('id', 'tasks-popupMenuOptions');
$menuBtn->addAttribute('data-testid', 'tasks-filter-settings-btn');
$menuBtn->addAttribute('aria-label', Loc::getMessage('TASKS_FILTER_OPTIONS_BTN_ARIA_LABEL'));
$menuBtn->addAttribute('aria-haspopup', 'menu');
$menuBtn->addAttribute('aria-expanded', 'false');

Toolbar::addButton($menuBtn, ButtonLocation::RIGHT);

$disabledDeadlineMenuScopes = [
	ScopeDictionary::SCOPE_TASKS_KANBAN_SPRINT,
	ScopeDictionary::SCOPE_TASKS_PLANNING,
]
?>

<script>
	(function()
	{
		var menuItemsOptions = [];
		var columnId = '<?= $arParams['SORT_FIELD'] ?? "" ?>';
		var columnDir = '<?= $arParams['SORT_FIELD_DIR'] ?? "" ?>';

		// a line that opens the menu separates nothing: the block it belongs to is simply absent here
		function pushDelimiter()
		{
			if (menuItemsOptions.length === 0)
			{
				return;
			}

			menuItemsOptions.push({
				tabId: 'popupMenuOptions',
				delimiter: true
			});
		}

		BX.addCustomEvent('BX.Main.grid:sort', function(column, grid) {
			if (BX.type.isNotEmptyString(column.sort_by))
			{
				columnId = column.sort_by;
			}
			if (BX.type.isNotEmptyString(column.sort_order))
			{
				columnDir = column.sort_order;
			}
		});

		<?php if($arParams['USE_GROUP_BY_SUBTASKS'] == 'Y'):?>
		<?php
		$instance = CTaskListState::getInstance($arParams['USER_ID']);
		$state = $instance->getState();
		$submodes = $state['SUBMODES'];
		$groupBySubTasks = $submodes['VIEW_SUBMODE_WITH_SUBTASKS']['SELECTED'] == 'Y';
		?>
		var groupBySubTasks = ('<?=$groupBySubTasks?>' === '1');
		menuItemsOptions.push({
			id: 'groupBySubTasks',
			tabId: "popupMenuOptions",
			text: '<?=$submodes['VIEW_SUBMODE_WITH_SUBTASKS']['TITLE']?>',
			className: (groupBySubTasks ? 'menu-popup-item-accept' : 'menu-popup-item-none'),
			onclick: function(event, item) {
				BX.ajax.runComponentAction('bitrix:tasks.interface.filter', 'toggleGroupByTasks', {
					mode: 'class',
					data: {
						userId: <?= $arParams['USER_ID'] ?>
					}
				}).then(
					function(response)
					{
						if (
							response.status
							&& response.status === 'success'
						)
						{
							if (BX.hasClass(item.layout.item, "menu-popup-item-accept"))
							{
								BX.removeClass(item.layout.item, "menu-popup-item-accept");
								BX.addClass(item.layout.item, "menu-popup-item-none");
							}
							else
							{
								BX.addClass(item.layout.item, "menu-popup-item-accept");
								BX.removeClass(item.layout.item, "menu-popup-item-none");
							}

							if (BX.Main.gridManager)
							{
								groupBySubTasks = !groupBySubTasks;
								var gridInstance = BX.Main.gridManager.getById('<?=$arParams['GRID_ID']?>').instance;
								gridInstance.reloadTable();
								BX.onCustomEvent('BX.Tasks.Filter.group', [gridInstance, 'groupBySubTasks', groupBySubTasks]);
							}
							else
							{
								window.location.reload();
							}
						}
					}.bind(this),
					function(response)
					{

					}.bind(this)
				);
			}
		});
		<?php endif?>

		<?php if($arParams['USE_GROUP_BY_GROUPS'] == 'Y'):?>
		<?php
		$instance = CTaskListState::getInstance($arParams['USER_ID']);
		$state = $instance->getState();
		$submodes = $state['SUBMODES'];
		$groupByGroups = $submodes['VIEW_SUBMODE_WITH_GROUPS']['SELECTED'] == 'Y';
		?>
		var groupByGroups = '<?=$groupByGroups?>' === '1';
		menuItemsOptions.push({
			id: 'groupByGroups',
			tabId: "popupMenuOptions",
			text: '<?=$submodes['VIEW_SUBMODE_WITH_GROUPS']['TITLE']?>',
			className: (groupByGroups ? 'menu-popup-item-accept' : 'menu-popup-item-none'),
			onclick: function(event, item) {
				BX.ajax.runComponentAction('bitrix:tasks.interface.filter', 'toggleGroupByGroups', {
					mode: 'class',
					data: {
						userId: <?= $arParams['USER_ID'] ?>
					}
				}).then(
					function(response)
					{
						if (
							response.status
							&& response.status === 'success'
						)
						{
							if (BX.hasClass(item.layout.item, "menu-popup-item-accept"))
							{
								BX.removeClass(item.layout.item, "menu-popup-item-accept");
								BX.addClass(item.layout.item, "menu-popup-item-none");
							}
							else
							{
								BX.addClass(item.layout.item, "menu-popup-item-accept");
								BX.removeClass(item.layout.item, "menu-popup-item-none");
							}

							if (BX.Main.gridManager)
							{
								groupByGroups = !groupByGroups;
								var gridInstance = BX.Main.gridManager.getById('<?=$arParams['GRID_ID']?>').instance;
								gridInstance.reloadTable();
								BX.onCustomEvent('BX.Tasks.Filter.group', [gridInstance, 'groupByGroups', groupByGroups]);
							}
							else
							{
								window.location.reload();
							}
						}
					}.bind(this),
					function(response)
					{

					}.bind(this)
				);
			}
		});
		<?php endif?>

		<?php if($arParams['SHOW_USER_SORT'] == 'Y'):?>

		pushDelimiter();

		<?php
		$sortFields = \Bitrix\Tasks\Ui\Controls\Column::getFieldsWithMessages('TASKS_BTN_SORT_');
		?>

		function onMenuItemClick(selectedItemType, selectedItem, menuItems)
		{
			if (selectedItemType === 'field')
			{
				columnId = selectedItem.value;
			}
			else if (selectedItemType === 'dir')
			{
				columnDir = selectedItem.value;
			}

			BX.Tasks.SortManager.setSort(columnId, columnDir, '<?=$arParams['GRID_ID']?>');

			menuItems.forEach(function(item) {
				handleStyles(item, columnId, columnDir);
			});
		}

		function handleStyles(item, columnId, columnDir)
		{
			var itemAccept = 'menu-popup-item-accept';
			var itemSortField = 'menu-popup-item-sort-field';
			var itemSortDir = 'menu-popup-item-sort-dir';
			var itemDisplayNone = 'menu-popup-item-display-none';

			if (item.className != undefined && item.className.indexOf(itemSortField) >= 0)
			{
				if (columnId === item.value)
				{
					BX.addClass(item.getLayout().item, itemAccept);
				}
				else
				{
					BX.removeClass(item.getLayout().item, itemAccept);
				}
			}

			if (columnId === 'SORTING')
			{
				if (
					item.getId() === "delimiterDir"
					|| (item.className != undefined && item.className.indexOf(itemSortDir) >= 0)
				)
				{
					item.getLayout().item.classList.add(itemDisplayNone);
				}
			}
			else
			{
				BX.removeClass(item.getLayout().item, itemDisplayNone);
			}

			if (item.className != undefined && item.className.indexOf(itemSortDir) >= 0)
			{
				if (columnDir === item.value)
				{
					BX.addClass(item.getLayout().item, itemAccept);
				}
				else
				{
					BX.removeClass(item.getLayout().item, itemAccept);
				}
			}
		}

		menuItemsOptions.push({
			id: "popupMenuOptionsSort",
			text: '<?=GetMessageJS('TASKS_USER_SORT')?>',
			className: "menu-popup-item-none menu-popup-sort",
			events: {
				onSubMenuShow: function()
				{
					this.getSubMenu().getMenuItems().forEach(function(item)
					{
						handleStyles(item, columnId, columnDir);
					});
				}
			},
			items: [
				<?php foreach($sortFields as $sortField => $langTitle):?>
				{
					html: '<?=GetMessageJS($langTitle)?><?php if($sortField === "ACTIVITY_DATE"):?><span class="menu-popup-item-sort-field-label"><?=GetMessageJS('TASKS_BTN_SORT_RECOMMENDED_LABEL')?></span><?php endif;?>',
					value: '<?=$sortField?>',
					className: "menu-popup-item-sort-field menu-popup-item-none",
					onclick: function(event, menuItem)
					{
						onMenuItemClick('field', menuItem, this.menuItems);
					}
				},
				<?php if($sortField === 'SORTING' || $sortField === 'ACTIVITY_DATE'):?>
				{
					tabId: "popupMenuOptions",
					delimiter: true
				},
				<?php endif?>
				<?php endforeach?>
				{
					tabId: "popupMenuOptions",
					id: 'delimiterDir',
					delimiter: true
				},
				{
					tabId: "popupMenuOptions",
					className: "menu-popup-item-sort-dir menu-popup-item-accept",
					text: "<?=GetMessageJS('TASKS_BTN_SORT_DIR_ASC')?>",
					value: 'asc',
					onclick: function(event, menuItem)
					{
						onMenuItemClick('dir', menuItem, this.menuItems);
					}
				},
				{
					tabId: "popupMenuOptions",
					className: "menu-popup-item-sort-dir menu-popup-item-none",
					text: "<?=GetMessageJS('TASKS_BTN_SORT_DIR_DESC')?>",
					value: 'desc',
					onclick: function(event, menuItem)
					{
						onMenuItemClick('dir', menuItem, this.menuItems);
					}
				}
			]
		});
		<?php endif?>

		<?php if (!in_array((string)($arParams['SCOPE'] ?? ''), $disabledDeadlineMenuScopes)): ?>

		pushDelimiter();

		const deadlineMenu = new BX.Tasks.Deadline.Menu();
		menuItemsOptions.push(...deadlineMenu.menuItems);

		<?php endif; ?>

		<?php if($arParams['USE_EXPORT'] == 'Y'):?>

		pushDelimiter();

		<?php if(TaskAccessController::can($arResult['USER_ID'], \Bitrix\Tasks\Access\ActionDictionary::ACTION_TASK_IMPORT)): ?>
		menuItemsOptions.push({
			tabId: "popupMenuOptions",
			text: '<?=GetMessageJS('TASKS_BTN_IMPORT')?>',
			className: "menu-popup-item-none",
			items: [
				{
					tabId: "popupMenuOptions",
					text: '<?=GetMessageJS('TASKS_BTN_IMPORT_CSV')?>',
					className: "tasks-interface-filter-icon-excel",
					href: '<?= '/company/personal/user/'.$arResult['USER_ID'].'/tasks/import/'?>'
				}
			]
		});
		<?php endif; ?>

		<?php if(TaskAccessController::can($arResult['USER_ID'], \Bitrix\Tasks\Access\ActionDictionary::ACTION_TASK_EXPORT)):?>

		var baloonShowed = false;
		var baloonLifeTime = 5000;

		var onClickExport = function(exportType = ''){
			BX.UI.StepProcessing.ProcessManager.get('EXPORT_EXCEL_PARAMS').showDialog();
		};

		menuItemsOptions.push({
			tabId: "popupMenuOptions",
			text: '<?=GetMessageJS('TASKS_BTN_EXPORT_TO_EXCEL')?>',
			className: 'menu-popup-item-none',
			onclick: function(){
				onClickExport();
			}
		});

		<?php endif; ?>

		<?php if(
		TaskAccessController::can($arResult['USER_ID'], \Bitrix\Tasks\Access\ActionDictionary::ACTION_TASK_EXPORT)
		&& TaskAccessController::can($arResult['USER_ID'], \Bitrix\Tasks\Access\ActionDictionary::ACTION_TASK_IMPORT)
		): ?>
		menuItemsOptions.push({
			tabId: "popupMenuOptions",
			text: '<?=GetMessageJS('TASKS_BTN_SYNC')?>',
			className: 'menu-popup-item-none',
			items: [
				{
					tabId: "popupMenuOptions",
					text: '<?=GetMessageJS('TASKS_BTN_SYNC_OUTLOOK')?>',
					className: "tasks-interface-filter-icon-outlook",
					onclick: function(event, item)
					{
						<?=CIntranetUtils::GetStsSyncURL(array('LINK_URL' => $arParams['PATH_TO_TASKS'] ?? ''), 'tasks')?>
					}
				}
			]
		});
		<?php endif; ?>
		<?php endif?>

		<?if (!empty($arParams['POPUP_MENU_ITEMS'])):?>
		<?foreach ($arParams['POPUP_MENU_ITEMS'] as $menuItem):?>
		<?php if (!empty($menuItem['kanbanSort'])):?>
		// the sort of the kanban is a menu of its own: the board passes its state, the extension builds the items
		menuItemsOptions.push(new BX.Tasks.KanbanSortMenu(<?= Json::encode($menuItem['kanbanSort'])?>).menuItem);
		<?php else:?>
		menuItemsOptions.push({
			tabId: "<?= isset($menuItem['tabId']) ? $menuItem['tabId'] : ''?>",
			text: "<?= isset($menuItem['text']) ? $menuItem['text'] : ''?>",
			html: "<?= isset($menuItem['html']) ? $menuItem['html'] : ''?>",
			href: "<?= isset($menuItem['href']) ? $menuItem['href'] : ''?>",
			className: "<?= isset($menuItem['className']) ? $menuItem['className'] : ''?>",
			onclick: <?= isset($menuItem['onclick']) ? $menuItem['onclick'] : '""'?>,
			<?php if (!empty($menuItem['delimiter'])):?>delimiter: true,<?php endif;?>
			params: <?= isset($menuItem['params']) ? $menuItem['params'] : '{}'?>,
			<?php if (isset($menuItem['focusable'])):?>
			focusable: <?= $menuItem['focusable'] ? 'true' : 'false'?>,
			<?php endif;?>
		});
		<?php endif;?>
		<?endforeach;?>
		<?endif;?>

		<?php
		$viewKanbanFieldsPopup = [
			\Bitrix\Tasks\UI\ScopeDictionary::SCOPE_TASKS_KANBAN,
			\Bitrix\Tasks\UI\ScopeDictionary::SCOPE_TASKS_KANBAN_TIMELINE,
			\Bitrix\Tasks\UI\ScopeDictionary::SCOPE_TASKS_KANBAN_PERSONAL,
		];
		$leftAlignedMenuScopes = [
			\Bitrix\Tasks\UI\ScopeDictionary::SCOPE_TASKS_KANBAN_PERSONAL,
			\Bitrix\Tasks\UI\ScopeDictionary::SCOPE_TASKS_KANBAN_TIMELINE,
		];
		$scope = (string)($arParams['SCOPE'] ?? '');
		$sprintId = (int)($arParams['ACTIVE_SPRINT_ID'] ?? 0);
		if (
			in_array($scope, $viewKanbanFieldsPopup)
			|| (
				$scope === \Bitrix\Tasks\UI\ScopeDictionary::SCOPE_TASKS_KANBAN_SPRINT
				&& $sprintId > 0
			)
		): ?>

		<?php if (in_array($scope, $leftAlignedMenuScopes, true)): ?>

		pushDelimiter();

		<?php endif;?>

		menuItemsOptions.push({
			tabId: "popupMenuOptions",
			text: '<?=GetMessageJS('TASKS_BTN_KANBAN_POPUP_TITLE_CONFIGURE_VIEW')?>',
			className: "menu-popup-item-none menu-popup-no-icon",
			onclick: function(event, item) {
				BX.Event.EventEmitter.emit('tasks-kanban-settings-fields-view');
			},
		})
		<?php endif;?>

		<?php if (in_array($scope, $leftAlignedMenuScopes, true)): ?>

		// no root item of this menu is a switch, so the icon slot only shifts the text away from the left edge
		menuItemsOptions.forEach(function(item) {
			var className = item.className;

			if (
				item.delimiter
				|| !BX.type.isNotEmptyString(className)
				|| className.indexOf('menu-popup-item-none') < 0
				|| className.indexOf('menu-popup-item-accept') >= 0
				|| className.indexOf('menu-popup-no-icon') >= 0
			)
			{
				return;
			}

			item.className = className + ' menu-popup-no-icon';
		});

		<?php endif;?>

		const angle = <?= ($arResult['relationToId'] ?? 0) ? 'false' : 'true' ?>;

		var buttonRect = BX("tasks-popupMenuOptions").getBoundingClientRect();
		var menu = new BX.Main.Menu({
			id: "popupMenuOptions",
			bindElement: BX("tasks-popupMenuOptions"),
			items: menuItemsOptions,
			closeByEsc: true,
			// focusTrap is set explicitly: left to the environment gate, the menu takes no
			// focus at all on a customer portal
			focusTrap: true,
			offsetLeft: buttonRect.width / 2,
			angle,
			events: {
				onShow: function() {
					BX("tasks-popupMenuOptions").setAttribute("aria-expanded", "true");
				},
				onClose: function() {
					BX("tasks-popupMenuOptions").setAttribute("aria-expanded", "false");
				},
			},
		});

		BX.bind(BX("tasks-popupMenuOptions"), "click", BX.delegate(function() {
			if (BX.data(BX("tasks-popupMenuOptions"), "disabled") !== true)
			{
				menu.show();

				BX.UI.Analytics.sendData({
					tool: 'tasks',
					category: 'task_operations',
					event: 'settings_button_click',
					type: 'task',
					c_section: 'tasks',
					c_element: 'settings_button_click',
				});
			}
		}, this));
	})();
</script>
