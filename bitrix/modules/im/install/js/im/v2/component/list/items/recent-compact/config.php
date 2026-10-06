<?php

use Bitrix\Im\V2\Permission;
use Bitrix\Im\V2\Permission\GlobalAction;
use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Main\Loader;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$openLinesAvailable = false;

if (Loader::includeModule('im'))
{
	$openLinesAvailable = (bool)Permission::canDoGlobalAction(
		(int)CurrentUser::get()->getId(),
		GlobalAction::GetOpenlines,
		null,
	);
}

return [
	'css' => 'dist/recent-compact.bundle.css',
	'js' => 'dist/recent-compact.bundle.js',
	'rel' => [
		'call.component.compact-active-call-list',
		'im.public',
		'im.v2.application.core',
		'im.v2.component.elements.avatar',
		'im.v2.const',
		'im.v2.css.classes',
		'im.v2.css.tokens',
		'im.v2.lib.analytics',
		'im.v2.lib.counter',
		'im.v2.lib.feature',
		'im.v2.lib.menu',
		'im.v2.lib.recent',
		'im.v2.lib.utils',
		'im.v2.provider.service.recent',
		'main.core',
		'ui.design-tokens.air',
		'ui.icon-set.api.vue',
	],
	'skip_core' => false,
	'settings' => [
		'openLinesAvailable' => $openLinesAvailable,
	],
];
