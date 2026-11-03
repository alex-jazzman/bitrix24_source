<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/task-queue.bundle.css',
	'js' => 'dist/task-queue.bundle.js',
	'rel' => [
		'main.core',
		'main.loader',
		'main.popup',
		'tasks.side-panel-integration',
	],
	'skip_core' => false,
];
