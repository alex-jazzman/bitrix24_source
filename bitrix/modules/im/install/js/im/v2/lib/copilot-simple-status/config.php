<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/copilot-simple-status.bundle.js',
	'rel' => [
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.logger',
		'main.core',
	],
	'skip_core' => false,
];
