<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => '../dist/alert.bundle.css',
	'rel' => [
		'ui.system.typography.vue',
		'ui.icon-set.api.vue',
	],
	'skip_core' => true,
];
