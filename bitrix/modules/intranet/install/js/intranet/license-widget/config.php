<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/license-widget.bundle.css',
	'js' => 'dist/license-widget.bundle.js',
	'rel' => [
		'ui.popupcomponentsmaker',
		'main.core.events',
		'ui.buttons',
		'ui.feedback.partnerform',
		'ui.icon-set.outlined',
		'intranet.partner-discontinue',
		'main.popup',
		'ui.info-helper',
		'main.core',
	],
	'skip_core' => false,
];
