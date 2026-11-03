<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

// A consumer can resolve this config before any other im extension, so the module may not be loaded yet.
$isConnectorReady = \Bitrix\Main\Loader::includeModule('im')
    && \Bitrix\Im\Integration\Vibecodeconnector\Catalog::isAvailableForUser();

return [
    'js' => './dist/vibe-code-catalog-button.bundle.js',
    'css' => './dist/vibe-code-catalog-button.bundle.css',
    'rel' => [
		'im.v2.const',
		'main.core',
		'main.core.events',
		'ui.icon-set.api.vue',
		'ui.vue3',
	],
	'settings' => [
		'isAvailable' => $isConnectorReady,
	],
    'skip_core' => false,
];
