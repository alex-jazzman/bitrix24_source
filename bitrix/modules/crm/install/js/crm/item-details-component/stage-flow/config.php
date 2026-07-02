<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/index.bundle.css',
	'js' => 'dist/index.bundle.js',
	'rel' => [
		'crm.stage.permission-checker',
		'crm.stage-model',
		'main.core',
		'ui.buttons',
		'ui.stageflow',
	],
	'skip_core' => false,
];
