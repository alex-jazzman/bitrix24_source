<?php

use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Socialnetwork\ComponentHelper;
use Bitrix\Socialnetwork\Integration\Tasks\Flow\Path\FlowPath;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (!\Bitrix\Main\Loader::includeModule('socialnetwork'))
{
	return [];
}

return [
	'css' => 'dist/converter.bundle.css',
	'js' => 'dist/converter.bundle.js',
	'rel' => [
		'main.popup',
		'ui.vue3',
		'ui.vue3.mixins.loc-mixin',
		'ui.loader',
		'ui.avatar',
		'ui.icon-set.api.vue',
		'ui.icon-set.api.core',
		'ui.vue3.components.button',
		'ui.icon-set.outline',
		'main.core',
	],
	'lang_additional' => [
		'SN_COLLAB_CONVERTER_GROUP_URL' => ComponentHelper::getWorkgroupSEFUrl(),
		'SN_COLLAB_CONVERTER_FLOW_URL_TEMPLATE' => FlowPath::getTemplate((int)CurrentUser::get()->getId()),
	],
	'skip_core' => false,
];
