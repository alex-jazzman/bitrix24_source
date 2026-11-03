<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/sprint.completion.form.bundle.css',
	'js' => 'dist/sprint.completion.form.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'ui.confetti',
		'ui.design-tokens',
		'ui.dialogs.messagebox',
		'ui.fonts.opensans',
		'ui.hint',
		'ui.sidepanel.layout',
	],
	'skip_core' => false,
];