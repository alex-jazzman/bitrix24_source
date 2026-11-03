<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/popup-install.bundle.css',
	'js' => 'dist/popup-install.bundle.js',
	'rel' => [
		'main.core',
		'main.popup',
		'market.install-store',
		'market.market-links',
		'ui.a11y',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.system.chip.vue',
		'ui.system.label',
		'ui.system.label.vue',
		'ui.system.typography.vue',
		'ui.vue3',
		'ui.vue3.components.button',
		'ui.vue3.pinia',
	],
	'skip_core' => false,
];
