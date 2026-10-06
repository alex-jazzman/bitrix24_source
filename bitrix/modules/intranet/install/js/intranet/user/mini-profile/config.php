<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/user-mini-profile.bundle.css',
	'js' => 'dist/user-mini-profile.bundle.js',
	'rel' => [
		'humanresources.company-structure.public',
		'main.core',
		'main.core.cache',
		'main.core.events',
		'main.date',
		'main.popup',
		'ui.design-tokens',
		'ui.icon-set.api.core',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.icon-set.solid',
		'ui.notification',
		'ui.vue3',
		'ui.vue3.components.avatar',
		'ui.vue3.components.button',
		'ui.vue3.components.menu',
		'ui.vue3.components.rich-menu',
		'ui.vue3.directives.hint',
	],
	'skip_core' => false,
	'settings' => [
		'isRenamedIntegrator' => \Bitrix\Intranet\Public\Service\IntegratorService::createByDefault()->isRenamedIntegrator() ? 'Y' : 'N',
	],
];
