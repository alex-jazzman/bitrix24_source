<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/new-project-banner.bundle.css',
	'js' => 'dist/new-project-banner.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.vue3.components.rich-loc',
	],
	'skip_core' => true,
];
