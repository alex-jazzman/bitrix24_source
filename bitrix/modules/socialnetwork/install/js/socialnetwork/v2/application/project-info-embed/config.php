<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/project-info-embed.bundle.js',
	'css' => './dist/project-info-embed.bundle.css',
	'rel' => [
		'main.core',
		'main.date',
		'ui.system.chip.vue',
		'ui.system.typography.vue',
		'ui.vue3',
		'ui.vue3.mixins.loc-mixin',
	],
	'skip_core' => false,
];
