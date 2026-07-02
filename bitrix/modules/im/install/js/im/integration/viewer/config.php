<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/im.integration.viewer.bundle.js',
	'rel' => [
		'disk.viewer.onlyoffice-item',
		'main.core',
	],
	'skip_core' => false,
];