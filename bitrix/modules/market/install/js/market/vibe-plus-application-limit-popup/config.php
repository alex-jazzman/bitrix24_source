<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/vibe-plus-application-limit-popup.bundle.js',
	'css' => './dist/vibe-plus-application-limit-popup.bundle.css',
	'rel' => [
		'main.core',
		'main.date',
		'main.popup',
		'market.market-links',
		'ui.banner-dispatcher',
		'ui.design-tokens',
		'ui.icon-set.api.vue',
		'ui.system.typography.vue',
		'ui.vue3',
		'ui.vue3.components.button',
	],
	'skip_core' => false,
];
