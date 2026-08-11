<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/copilot-image-controller.bundle.css',
	'js' => 'dist/copilot-image-controller.bundle.js',
	'rel' => [
		'ai.ajax-error-handler',
		'ai.engine',
		'main.core',
		'main.core.events',
		'main.loader',
		'main.popup',
		'ui.buttons',
		'ui.icon-set.api.core',
	],
	'skip_core' => false,
];