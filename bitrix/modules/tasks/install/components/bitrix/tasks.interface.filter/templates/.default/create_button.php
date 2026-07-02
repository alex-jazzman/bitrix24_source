<?php

use Bitrix\UI\Buttons;
use Bitrix\UI\Toolbar\ButtonLocation;
use Bitrix\UI\Toolbar\Facade\Toolbar;
use Bitrix\Main\Localization\Loc;
use Bitrix\UI\Buttons\Split\Button as SplitButton;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Web\Uri;

/**
 * @var array $arResult
 * @var array $arParams
 */

$isCollab = $arResult['IS_COLLAB'];
$groupId = (int)$arParams['MENU_GROUP_ID'];
$currentUserId = (int)$arResult['USER_ID'];
$targetUserId = (int)$arParams['USER_ID'];
$isV2Form = \Bitrix\Tasks\V2\FormV2Feature::isOn('miniform') || \Bitrix\Tasks\V2\FormV2Feature::isOn('', $groupId);

$createButtonUri = new Uri(
	CComponentEngine::makePathFromTemplate(
		($groupId > 0 ? $arParams['PATH_TO_GROUP_TASKS_TASK'] : $arParams['PATH_TO_USER_TASKS_TASK']),
		[
			'action' => 'edit',
			'task_id' => 0,
			'user_id' => $targetUserId, // pass page's owner here to make him responsible automatically
			'group_id' => $groupId,
		]
	)
);
if (isset($arParams['SCOPE']) && $arParams['SCOPE'] !== '')
{
	$createButtonUri->addParams(['SCOPE' => $arParams['SCOPE']]);
}
if ($groupId > 0)
{
	$createButtonUri->addParams(['GROUP_ID' => $groupId]);
}
if ($currentUserId !== $targetUserId)
{
	$createButtonUri->addParams(['RESPONSIBLE_ID' => $arParams['USER_ID']]);
}

$analytics = \Bitrix\Tasks\Helper\Analytics::getInstance($currentUserId);

$createButtonUri->addParams([
	'ta_sec' => $arResult['CREATE_BUTTON_ANALYTICS']['sectionType'] ?? '',
	'ta_sub' => $arResult['CREATE_BUTTON_ANALYTICS']['viewState'] ?? '',
	'ta_el' => \Bitrix\Tasks\Helper\Analytics::ELEMENT['create_button'],
	'p1' => $analytics->getIsDemoParameter(),
	'p2' => $analytics->getUserTypeParameter(),
]);

if ($isCollab)
{
	$createButtonUri->addParams([
		'p4' => $analytics->getCollabParameter($groupId),
	]);
}

$mainButton = $isV2Form ? [] : [
	'link' => $createButtonUri->getUri(),
	'tag' =>  Buttons\Tag::LINK,
];

$splitButton = new SplitButton([
	'text' => Loc::getMessage('TASKS_BTN_CREATE_TASK'),
	'mainButton' => $mainButton,
	'menuButton' => [
		'icon' => Buttons\Icon::SETTING,
	],
]);
$splitButton->addAttribute('id', 'tasks-buttonAdd');
$splitButton->getMenuButton()->addAttribute('id', 'tasks-popupMenuAdd');
Toolbar::addButton($splitButton, ButtonLocation::AFTER_TITLE);

if (!$arResult['IS_SCRUM_PROJECT'])
{
	$rolesButton = (new Buttons\Button())
		->setText($arResult['roles']['selectedRoleName'] ?? Loc::getMessage('TASKS_ALL_ROLES'))
		->setCollapsedIcon(Buttons\Icon::TWO_PERSONS)
		->setCounter($arResult['roles']['totalCounter'])
		->setStyle(Buttons\AirButtonStyle::OUTLINE)
		->setDropdown()
		->addAttribute('id', 'tasks-buttonRoles')
	;
	Toolbar::addButton($rolesButton, ButtonLocation::AFTER_TITLE);
}

?>

<script>
	(function() {
		const TEMPLATE_SELECTOR_OPENER_ID = 'templateSelectorOpenerInFilterInterface';

		let EntitySelectorDialog = null;
		let EntitySelectorEntity = null;
		let menu = null;
		let dialogTemplate = null;
		let intervalAutoHideWorkaround = null;


		BX.Runtime.loadExtension('tasks.v2.lib.entity-selector-dialog').then(data => ({ EntitySelectorDialog } = data));
		BX.Runtime.loadExtension('tasks.v2.const').then(data => ({ EntitySelectorEntity } = data));

		function freezeMenu() {
			menu.popupWindow.setAutoHide(false);
			menu.popupWindow.setClosingByEsc(false);
		}

		function unfreezeMenu() {
			setTimeout(() => {
				menu.popupWindow.setAutoHide(true);
				menu.popupWindow.setClosingByEsc(true);
			}, 100);
		}

		async function createTaskFromTemplate(templateId) {
			const { TaskCard } = await BX.Runtime.loadExtension('tasks.v2.application.task-card');
			const { idUtils } = await BX.Runtime.loadExtension('tasks.v2.lib.id-utils');
			const { Analytics } = await BX.Runtime.loadExtension('tasks.v2.const');

			TaskCard.showFullCard({
				templateId: idUtils.unbox(templateId),
				analytics: {
					context: Analytics.Section.Templates,
					additionalContext: Analytics.SubSection.TemplatesCard,
					element: Analytics.Element.CreateButton,
				},
			});
		}

		async function showTemplateSelector() {
			const popupWidth = 385;
			const popupHeight = 385;

			const openerElement = document.querySelector(`[data-id-opener=${TEMPLATE_SELECTOR_OPENER_ID}]`);

			dialogTemplate ??= new EntitySelectorDialog({
				context: 'tasks-card',
				width: popupWidth,
				height: popupHeight,
				multiple: false,
				enableSearch: true,
				dropdownMode: true,
				entities: [
					{
						id: EntitySelectorEntity.TemplateCommon,
						options: {
							isFullListOpenable: true,
						},
					},
				],
				events: {
					'Item:onSelect': (event) => {
						const template = dialogTemplate.getSelectedItems()[0];
						const templateId = template?.getId();

						if (templateId > 0)
						{
							createTaskFromTemplate(templateId);
						}

						dialogTemplate.deselectAll();
					},
				},
				popupOptions: {
					className: 'popup-window_entity-picker-no-check',
					events: {
						onClose: () => {
							if (intervalAutoHideWorkaround)
							{
								clearInterval(intervalAutoHideWorkaround);
								unfreezeMenu();
							}
						},
					},
				},
			});

			dialogTemplate.showTo(openerElement);

			// TODO: if maybe one day we get entity selector without restriction on
			//  negative offsets, then get rid of this workaround
			const openerWidth = openerElement.offsetWidth;
			const openerHeight = openerElement.offsetHeight;
			dialogTemplate.getPopup().setOffset({
				offsetLeft: (openerWidth - 10),
				offsetTop: (0 - openerHeight),
			});
			dialogTemplate.adjustPosition();
			freezeMenu();
			intervalAutoHideWorkaround = setInterval(() => {
				freezeMenu();
			}, 20);
		}

		function closeMenu() {
			if (intervalAutoHideWorkaround)
			{
				clearInterval(intervalAutoHideWorkaround);
				unfreezeMenu();
			}
			dialogTemplate && dialogTemplate.hide();
			menu.popupWindow.close();
		}

		function handleClickTemplateSelectorOpener() {
			if (EntitySelectorDialog && EntitySelectorEntity)
			{
				showTemplateSelector();
			}
			else
			{
				setTimeout(() => {
					handleClickTemplateSelectorOpener();
				}, 50);
			}
		}

		function getItemCreateTaskWithFullCard()
		{
			return {
				tabId: 'popupMenuAdd',
				text: '<?= GetMessageJS('TASKS_BTN_ADD_TASK_BY_TASK_MSGVER_1') ?>',
				href: '<?= $createButtonUri->getUri() ?>',
				onclick : function() {
					closeMenu();
				},
			};
		}

		function getItemCreateTaskWithTemplate()
		{
			return {
				dataset: {
					idOpener: TEMPLATE_SELECTOR_OPENER_ID,
				},
				className: 'menu-popup-no-icon menu-popup-item-submenu',
				href: '',
				tabId: 'popupMenuAdd',
				text: '<?= GetMessageJS('TASKS_BTN_CREATE_TASK_BY_TEMPLATE') ?>',
				onclick : function() {
					handleClickTemplateSelectorOpener();
				},
			};
		}

		function getMenuItems()
		{
			const menuItems = [];

			const isTemplatesAvailable = <?=CUtil::PhpToJSObject($arResult['IS_TEMPLATES_AVAILABLE'])?>;

			menuItems.push(getItemCreateTaskWithFullCard());
			if (isTemplatesAvailable)
			{
				menuItems.push(getItemCreateTaskWithTemplate());
			}

			return menuItems;
		}

		const createButtonExtra = BX('tasks-popupMenuAdd');
		menu ??= BX.Main.MenuManager.create({
			id: 'popupMenuAdd',
			bindElement: createButtonExtra,
			items: getMenuItems(),
			closeByEsc: true,
			offsetLeft: -15,
			offsetTop: 5,
		});

		BX.bind(createButtonExtra, 'click', () => {
			menu.popupWindow.show();
		});
	})();
</script>
