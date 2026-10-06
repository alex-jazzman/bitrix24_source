<?php

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI;
use Bitrix\Main\Web\Uri;
use Bitrix\UI\Toolbar\ButtonLocation;
use Bitrix\UI\Toolbar\Facade\Toolbar;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

UI\Extension::load('ui.buttons');
UI\Extension::load('mail.secretary');

$message = $arResult['MESSAGE'];
$source = $arResult['MAIL_SOURCE'] ?? [];
$sourceType = (string)($source['TYPE'] ?? '');
$sourceId = (int)($source['ID'] ?? 0);
$messageSubject = ($message['SUBJECT'] ?? '') ?: Loc::getMessage('MAIL_MESSAGE_ACTIONS_SUBJECT_PLACEHOLDER');
$messageDateTs = (int)($message['MAIL_DATE_TS'] ?? (($message['INTERNALDATE'] ?? $message['FIELD_DATE'] ?? null)?->getTimestamp() ?? 0));

$taskUrlParams = array(
	'ta_sec' => 'mail',
	'ta_el' => 'quick_button',
	'TITLE' => Loc::getMessage(
		'MAIL_MESSAGE_ACTIONS_TASK_TITLE',
		array(
			'#SUBJECT#' => $messageSubject,
		)
	),
	'MAIL_SUBJECT' => $messageSubject,
	'MAIL_FROM' => htmlspecialchars_decode($message['FIELD_FROM'] ?? '', ENT_QUOTES),
	'MAIL_DATE' => $messageDateTs > 0 ? $messageDateTs : '',
);

if ($sourceType !== '' && $sourceId > 0)
{
	$taskUrlParams['MAIL_SOURCE_TYPE'] = $sourceType;
	$taskUrlParams['MAIL_SOURCE_ID'] = $sourceId;
}

if ((int)($message['ID'] ?? 0) > 0)
{
	$taskUrlParams['UF_MAIL_MESSAGE'] = (int)$message['ID'];
}

$createMenu = array(
	'TASKS_TASK' => array(
		'title' => Loc::getMessage('MAIL_MESSAGE_ACTIONS_TASK_BTN'),
		'href' => (string)(new Uri(\CComponentEngine::makePathFromTemplate(
				$arParams['PATH_TO_USER_TASKS_TASK'],
				array(
					'action' => 'edit',
					'task_id' => '0',
				)
			)))->addParams($taskUrlParams),
	),
	'CRM_ACTIVITY' => array(
		'title' => Loc::getMessage('MAIL_MESSAGE_ACTIONS_CRM_BTN'),
	),
	'CRM_EXCLUDE' => array(
		'title' => Loc::getMessage('MAIL_MESSAGE_ACTIONS_CRM_EXCLUDE_BTN'),
	),
	'BLOG_POST' => array(
		'title' => Loc::getMessage('MAIL_MESSAGE_ACTIONS_FEED_POST_BTN'),
		'href' => (string)(new Uri(\CComponentEngine::makePathFromTemplate(
				$arParams['PATH_TO_USER_BLOG_POST_EDIT'],
				array(
					'post_id' => '0',
				)
			)))->addParams([
				'TITLE' => Loc::getMessage(
					'MAIL_MESSAGE_ACTIONS_POST_TITLE',
					array(
						'#SUBJECT#' => $messageSubject,
					)
				),
				'UF_MAIL_MESSAGE' => (int) $message['ID'],
			]),
	),
	'IM_CHAT' => array(
		'title' => Loc::getMessage('MAIL_MESSAGE_ACTIONS_IM_BTN'),
	),
	'CALENDAR_EVENT' => array(
		'title' => Loc::getMessage('MAIL_MESSAGE_ACTIONS_EVENT_BTN'),
	),
);

foreach ($createMenu as $id => $item)
{
	$createMenu[$id]['id'] = $id;
	$createMenu[$id]['binded'] = (bool) preg_grep(sprintf('/%s-\d+/', preg_quote($id)), (array)($message['BIND'] ?? []));
}

$availableItems = !empty($arResult['MAIL_MESSAGE_ACTIONS_AVAILABLE'])
	? ['TASKS_TASK', 'CRM_ACTIVITY', 'BLOG_POST', 'IM_CHAT', 'CALENDAR_EVENT']
	: ['TASKS_TASK']
;
$defaultAction = \CUserOptions::getOption('mail', 'default_create_action', 'TASKS_TASK');
if (!in_array($defaultAction, $availableItems, true))
{
	$defaultAction = 'TASKS_TASK';
}

$createMenu['__default'] = &$createMenu[$defaultAction];
$controlId = (string)($arResult['CONTROL_ID'] ?? (int)$message['ID']);
if (count($availableItems) === 1)
{
	// A single available action (typical CRM context) has no menu items, so render a plain
	// button without the split menu arrow to avoid opening an empty/meaningless menu.
	$createButton = new Bitrix\UI\Buttons\Button([
		'color' => Bitrix\UI\Buttons\Color::PRIMARY,
		'text' => $createMenu['__default']['title'],
		'dataset' => [
			'toolbar-collapsed-icon' => Bitrix\UI\Buttons\Icon::CAMERA
		]
	]);
	$createButton->addAttribute('id', 'mail-msg-'. $controlId .'-actions-create-btn');
	Toolbar::addButton($createButton);
}
else
{
	$splitButton = new Bitrix\UI\Buttons\Split\Button([
		'color' => Bitrix\UI\Buttons\Color::PRIMARY,
		'text' => $createMenu['__default']['title'],
		'dataset' => [
			'toolbar-collapsed-icon' => Bitrix\UI\Buttons\Icon::CAMERA
		]
	]);
	$splitButton->getMainButton()->addAttribute('id', 'mail-msg-'. $controlId .'-actions-create-btn');
	$splitButton->getMenuButton()->addAttribute('id', 'mail-msg-'. $controlId .'-actions-create-menu-btn');
	$splitButton->getMenuButton()->addAttribute('aria-label', Loc::getMessage('MAIL_MESSAGE_ACTIONS_MORE_MENU'));
	Toolbar::addButton($splitButton);
}
?>

<script>
	BX.ready(function ()
	{
		BX.message({
			MAIL_MESSAGE_ACTIONS_NOTIFY_ADDED_TO_CRM: '<?=\CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_ACTIONS_NOTIFY_ADDED_TO_CRM')) ?>',
			MAIL_MESSAGE_ACTIONS_NOTIFY_EXCLUDED_FROM_CRM: '<?=\CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_ACTIONS_NOTIFY_EXCLUDED_FROM_CRM')) ?>'
		});

		BXMailMessageActions.init({
			controlId: <?=\Bitrix\Main\Web\Json::encode($controlId) ?>,
			messageId: <?=intval($message['ID']) ?>,
			createMenu: <?=\Bitrix\Main\Web\Json::encode($createMenu) ?>,
			availableItems: <?=\Bitrix\Main\Web\Json::encode($availableItems) ?>,
			isCrmEnabled: <?=\CUtil::phpToJsObject(!empty($arParams['CRM_AVAILABLE'])); ?>
		});
	});

</script>
