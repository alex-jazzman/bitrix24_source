<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/project-members-popup.bundle.css',
	'js' => 'dist/project-members-popup.bundle.js',
	'rel' => [
		'main.core',
		'main.loader',
		'main.popup',
	],
	'skip_core' => false,
];
