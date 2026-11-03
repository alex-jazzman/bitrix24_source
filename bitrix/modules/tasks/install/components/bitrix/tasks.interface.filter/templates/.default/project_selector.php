<?php

use Bitrix\UI\Buttons;
use Bitrix\UI\Toolbar\ButtonLocation;
use Bitrix\UI\Toolbar\Facade\Toolbar;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$containerID = 'tasks_group_selector';
if (isset($arResult['GROUPS'][$arParams['GROUP_ID']]))
{
	$currentGroup = $arResult['GROUPS'][$arParams['GROUP_ID']];
	unset($arResult['GROUPS'][$arParams['GROUP_ID']]);
}
else
{
	$currentGroup = array(
		'id' => 'wo',
		'text' => \GetMessage('TASKS_BTN_GROUP_WO')
	);
}

\Bitrix\Main\UI\Extension::load(['ui.entity-selector', 'ui.buttons', 'ui.forms']);

$projectBtn = new Buttons\Button([
	'text' => $currentGroup['text'],
	'color' => Buttons\Color::LIGHT_BORDER,
	'round' => true,
	'noCaps' => true,
]);
$projectBtn->addAttribute('id', htmlspecialcharsbx($containerID));
$projectBtn->addAttribute('data-testid', 'tasks-filter-project-btn');
$projectBtn->addAttribute('aria-label', \GetMessage('TASKS_FILTER_PROJECT_BTN_ARIA_LABEL', ['#NAME#' => $currentGroup['text']]));
$projectBtn->addAttribute('aria-haspopup', 'dialog');
$projectBtn->addAttribute('aria-expanded', 'false');

Toolbar::addButton($projectBtn, ButtonLocation::AFTER_TITLE);
?>

<script>
	(function() {
		const dialog = new BX.UI.EntitySelector.Dialog({
			targetNode: document.getElementById('<?= $containerID ?>'),
			enableSearch: true,
			context: 'TASKS',
			multiple: false,
			ariaLabel: '<?= \GetMessageJS('TASKS_FILTER_PROJECT_DIALOG_ARIA_LABEL'); ?>',
			footer: [
				BX.Dom.create('button', {
					props: {
						type: 'button',
						className: 'ui-selector-footer-link ui-selector-footer-link-add tasks-interface-filter-footer-button'
					},
					dataset: {
						testid: 'tasks-filter-project-create-btn'
					},
					text: '<?= \GetMessageJS('TASKS_LINK_CREATE_PROJECT'); ?>',
					events: {
						click: function () {
							BX.SidePanel.Instance.open('/company/personal/user/<?= $arResult['USER_ID'] ?>/groups/create/?firstRow=project')
						}
					}
				})
			],
			entities: [
				{
					id: 'project',
				},
			],
			events: {
				'Item:onSelect': function(event) {
					var item = event.getData().item;
					BX.Tasks.ProjectSelector.reloadProject(item.id);
				},
			},
			popupOptions: {
				focusTrap: true,
				events: {
					onShow: function() {
						document.getElementById('<?= $containerID; ?>').setAttribute('aria-expanded', 'true');
					},
					onClose: function() {
						document.getElementById('<?= $containerID; ?>').setAttribute('aria-expanded', 'false');
					}
				}
			}
		});

		document.getElementById('<?= $containerID; ?>').addEventListener('click', function() {
			dialog.getPopup().getPopupContainer().setAttribute('aria-modal', 'true');
			dialog.show();
		});

	})();
</script>
