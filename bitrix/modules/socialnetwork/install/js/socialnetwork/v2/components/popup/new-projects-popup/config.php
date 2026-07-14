<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/new-projects-popup.bundle.css',
	'js' => 'dist/new-projects-popup.bundle.js',
	'rel' => [
		'main.core',
		'socialnetwork.v2.components.elements.ui-popup',
		'socialnetwork.v2.provider.services.promotion-service',
		'ui.banner-dispatcher',
		'ui.icon-set.api.vue',
		'ui.system.typography.vue',
		'ui.vue3',
		'ui.vue3.components.button',
	],
	'skip_core' => false,
];
