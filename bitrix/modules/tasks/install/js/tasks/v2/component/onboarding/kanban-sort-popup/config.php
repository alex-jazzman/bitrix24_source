<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/kanban-sort-popup.bundle.js',
	'css' => './dist/kanban-sort-popup.bundle.css',
	'rel' => [
		'main.core',
		'main.popup',
		'ui.a11y',
		'ui.banner-dispatcher',
	],
	'skip_core' => false,
];
