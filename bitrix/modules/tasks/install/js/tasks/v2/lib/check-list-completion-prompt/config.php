<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/check-list-completion-prompt.bundle.js',
	'rel' => [
		'main.core',
		'tasks.v2.lib.api-client',
	],
	'skip_core' => false,
];
