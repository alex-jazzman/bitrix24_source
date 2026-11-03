<?php

use Bitrix\Intranet\Internal\Integration\Socialnetwork\FeatureProvider;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/invitation-widget.bundle.css',
	'js' => 'dist/invitation-widget.bundle.js',
	'rel' => [
		'intranet.invitation-widget-counter',
		'main.core',
		'main.core.events',
		'main.loader',
		'main.popup',
		'ui.a11y',
		'ui.analytics',
		'ui.cnt',
		'ui.popupcomponentsmaker',
	],
	'skip_core' => false,
	'settings' => [
		'isNewProjectsAvailable' => (new FeatureProvider())->isNewProjectsAvailable(),
		'canCreateProjects' => (new FeatureProvider())->canCreateProjects(),
	],
];
