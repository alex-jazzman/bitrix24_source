<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/license-widget.bundle.css',
	'js' => 'dist/license-widget.bundle.js',
	'rel' => [
		'intranet.partner-discontinue',
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.buttons',
		'ui.feedback.partnerform',
		'ui.icon-set.outlined',
		'ui.info-helper',
		'ui.popupcomponentsmaker',
	],
	'skip_core' => false,
];
