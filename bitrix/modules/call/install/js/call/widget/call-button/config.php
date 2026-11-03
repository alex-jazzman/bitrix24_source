<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Call\Integration\AI\CallAISettings;
use Bitrix\Call\Settings;

Loc::loadMessages(__FILE__);

return [
	'css' => 'dist/call-button.bundle.css',
	'js' => 'dist/call-button.bundle.js',
	'rel' => [
		'call.const',
		'call.core',
		'call.legacy.component.elements',
		'call.lib.analytics',
		'call.lib.call-manager',
		'im.public',
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.feature',
		'im.v2.lib.local-storage',
		'im.v2.lib.menu',
		'im.v2.lib.permission',
		'im.v2.lib.promo',
		'im.v2.lib.rest',
		'main.core',
		'main.core.events',
		'ui.info-helper',
		'ui.notification',
		'ui.system.menu',
		'ui.vue3',
		'ui.vue3.directives.hint',
	],
	'oninit' => function ()
	{
		if (!Loader::includeModule('call'))
		{
			return [];
		}

		$copilotNameReplace = ['#COPILOT_NAME#' => CallAISettings::getCopilotName()];
		$copilotLangData = Loc::loadLanguageFile(__DIR__ . '/copilot.php');
		$copilotPhrases = [];
		foreach ($copilotLangData as $key => $template)
		{
			$copilotPhrases[$key] = strtr($template, $copilotNameReplace);
		}

		return [
			'lang_additional' => $copilotPhrases,
			'settings' => [
				'syncCallEnabled' => Settings::isSyncCallEnabled(),
			],
		];
	},
	'skip_core' => false,
];
