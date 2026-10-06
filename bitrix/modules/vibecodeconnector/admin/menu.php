<?php

declare(strict_types=1);

use Bitrix\Main\Localization\Loc;

Loc::loadMessages(__FILE__);

$menu = [];
$menu[] = [
	'parent_menu' => 'global_menu_services',
	'section' => 'vibecodeconnector',
	'sort' => 1000,
	'text' => Loc::getMessage('VIBECODECONNECTOR_MENU_TITLE'),
	'items_id' => 'menu_vibecodeconnector',
	'items' => [
		[
			'text' => Loc::getMessage('VIBECODECONNECTOR_MENU_DIAGNOSTIC'),
			'url' => '/bitrix/admin/vibecodeconnector_diagnostic.php',
		],
		[
			'text' => Loc::getMessage('VIBECODECONNECTOR_MENU_DEVELOPER_KEYS'),
			'url' => '/bitrix/admin/vibecodeconnector_developer_keys.php',
		],
		[
			'text' => Loc::getMessage('VIBECODECONNECTOR_MENU_IM_BUTTON_TEST'),
			'url' => '/bitrix/admin/vibecodeconnector_im_button.php',
		],
		[
			'text' => Loc::getMessage('VIBECODECONNECTOR_MENU_SETTINGS'),
			'url' => '/bitrix/admin/settings.php?mid=vibecodeconnector',
		],
	],
];

return $menu;
