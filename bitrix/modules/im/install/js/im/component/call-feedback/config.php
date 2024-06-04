<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (\Bitrix\Im\Call\Call::isNewCallLayoutEnabled())
{
	$cssBundleFile = 'dist/call-feedback.bundle.css';
}
else
{
	$cssBundleFile = 'dist/call-feedback_old.bundle.css';
}

return [
	'css' => $cssBundleFile,
	'js' => 'dist/call-feedback.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'ui.design-tokens',
		'ui.fonts.opensans',
		'ui.vue',
		'ui.forms',
		'main.popup',
		'im.lib.logger',
	],
	'skip_core' => true,
];