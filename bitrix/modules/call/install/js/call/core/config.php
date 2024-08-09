<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (!\Bitrix\Main\Loader::includeModule('im'))
{
	return [];
}

if (\Bitrix\Im\Call\Call::isNewCallLayoutEnabled())
{
	$cssBundleFile = './dist/call.bundle.css';
}
else
{
	$cssBundleFile = './dist/call_old.bundle.css';
}

use Bitrix\Main\Config\Option;

return [
	'js' => [
		'./dist/call.bundle.js',
	],
	'css' => [
		$cssBundleFile,
	],
	'rel' => [
		'im.lib.utils',
		'ui.switcher',
		'ui.dialogs.messagebox',
		'ui.buttons',
		'im.v2.lib.desktop-api',
		'im.v2.const',
		'main.core.events',
		'main.popup',
		'main.core',
		'im.v2.lib.utils',
		'call.lib.analytics',
		'loader',
		'resize_observer',
		'webrtc_adapter',
		'im.lib.localstorage',
		'ui.hint',
		'voximplant',
	],
	'oninit' => function ()
	{
		$features = [];
		$limits = \Bitrix\Im\Limit::getTypesForJs();
		foreach ($limits as $limit)
		{
			$features[$limit['id']] = [
				'enable' => !$limit['active'],
				'articleCode' => $limit['articleCode'],
			];
		}

		return [
			'lang_additional' => [
				'turn_server' => Option::get('im', 'turn_server'),
				'turn_server_firefox' => Option::get('im', 'turn_server_firefox'),
				'turn_server_login' => Option::get('im', 'turn_server_login'),
				'turn_server_password' => Option::get('im', 'turn_server_password'),
				'turn_server_max_users' => Option::get('im', 'turn_server_max_users'),
				'call_server_enabled' => \Bitrix\Im\Call\Call::isCallServerEnabled() ? 'Y' : 'N',
				'call_beta_ios_enabled' => \Bitrix\Im\Call\Call::isIosBetaEnabled() ? 'Y' : 'N',
				'new_call_layout_enabled' => \Bitrix\Im\Call\Call::isNewCallLayoutEnabled() ? 'Y' : 'N',
				'call_server_max_users' => \Bitrix\Im\Call\Call::getMaxCallServerParticipants(),
				'call_log_service' => \Bitrix\Im\Call\Call::getLogService(),
				'call_collect_stats' => Option::get('im', 'collect_call_stats', 'N'),
				'call_docs_status' => \Bitrix\Im\Integration\Disk\Documents::getDocumentsInCallStatus(),
				'call_resumes_status' => \Bitrix\Im\Integration\Disk\Documents::getResumesOfCallStatus(),
				'call_features' => $features,
			],
		];
	},
	'skip_core' => false,
];
