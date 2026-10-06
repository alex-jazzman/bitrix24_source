<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/simplelinkpanel.bundle.js',
    'css' => './dist/simplelinkpanel.bundle.css',
    'rel' => [
		'landing.loc',
		'landing.pageobject',
		'main.core',
		'ui.buttons',
		'ui.forms',
		'ui.icon-set.outline',
	],
    'skip_core' => false,
];
