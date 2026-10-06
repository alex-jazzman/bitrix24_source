<?php

use Bitrix\Bizproc\BaseType\Date;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/setup-template-activity.bundle.css',
	'js' => 'dist/setup-template-activity.bundle.js',
	'rel' => [
		'bizproc.setup-template',
		'main.core',
		'main.core.events',
		'ui.dialogs.messagebox',
		'ui.entity-selector',
		'ui.icon-set.api.core',
		'ui.icon-set.api.vue',
		'ui.system.menu.vue',
		'ui.system.typography.vue',
		'ui.vue3',
		'ui.vue3.components.button',
	],
	'skip_core' => false,
	'settings' => [
		// The constant form offers only the server zone and the current user one, so the full
		// module-wide list is not shipped here. The `time` field of bizproc.setup-template needs it, not this one.
		'timezones' => \Bitrix\Main\Loader::includeModule('bizproc')
			? array_values(
				array_filter(
					Date::getZones(),
					static fn(array $zone): bool => in_array($zone['value'], ['', 'current'], true)
				)
			)
			: [],
	],
];
