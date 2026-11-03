<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
	'js' => './dist/final-transition.bundle.js',
	'css' => './dist/final-transition.bundle.css',
	'rel' => [
		'crm.stage.description-tooltip',
		'crm.stage.entity-text',
		'main.core',
		'ui.a11y',
		'ui.buttons',
		'ui.notification',
		'ui.system.dialog',
	],
	'skip_core' => false,
];
