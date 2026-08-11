<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Loader;
use Bitrix\Main\Config\Option;
use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Call\Settings;
use Bitrix\Call\Integration\AI\CallAISettings;
use Bitrix\Call\Integration\AI\CallAIBaasService;

if (!Loader::includeModule('im') || !Loader::includeModule('call'))
{
	return [];
}

return [
	'js' => [
		'./dist/call.bundle.js',
	],
	'css' => [
		'./dist/call.bundle.css',
	],
	'rel' => [
		'call.adapter.desktop-api',
		'call.adapter.utils',
		'call.component.user-list',
		'call.component.user-list-popup',
		'call.infrastructure.broadcast-channel',
		'call.lib.accident-logger',
		'call.lib.analytics',
		'call.lib.call-token-manager',
		'call.lib.hardware',
		'call.lib.media-registry',
		'call.lib.settings-manager',
		'call.lib.stuck-call-finish-tracker',
		'call.mapping',
		'call.store',
		'im.lib.localstorage',
		'im.v2.const',
		'im.v2.lib.desktop',
		'im.v2.lib.desktop-api',
		'im.v2.lib.promo',
		'im.v2.lib.utils',
		'intranet.desktop-download',
		'loader',
		'main.core',
		'main.core.events',
		'main.popup',
		'resize_observer',
		'ui.buttons',
		'ui.dialogs.messagebox',
		'ui.hint',
		'ui.notification',
		'ui.switcher',
		'ui.vue3.pinia',
		'voximplant',
		'webrtc_adapter',
	],
	'oninit' => function ()
	{
		$features = [];
		$limits = \Bitrix\Call\Limit::getTypesForJs();
		foreach ($limits as $limit)
		{
			$features[$limit['id']] = [
				'enable' => !$limit['active'],
				'articleCode' => $limit['articleCode'],
			];
		}

		// todo : remove it after optimizing the start/join call methods
		$viewExtension = Settings::isVueEnabled() ? 'call.vue' : 'call.view';

		return [
			'rel' => [
				$viewExtension,
			],
			'lang_additional' => [
				'turn_server' => Settings::getTurnServer(),
				'turn_server_firefox' => Settings::getTurnServer(),
				'turn_server_login' => Option::get('call', 'turn_server_login'),
				'turn_server_password' => Option::get('call', 'turn_server_password'),
				'turn_server_max_users' => Option::get('call', 'turn_server_max_users'),
				'call_server_enabled' => Settings::isCallServerEnabled() ? 'Y' : 'N',
				'call_beta_ios_enabled' => Settings::isIosBetaEnabled() ? 'Y' : 'N',
				'call_server_max_users' => Settings::getMaxCallServerParticipants(),
				'call_log_service' => Settings::getLogService(),
				'call_client_selftest_url' => \Bitrix\Call\Library::getClientSelfTestUrl(),
				'call_collect_stats' => Option::get('call', 'collect_call_stats', 'N'),
				'call_docs_status' => \Bitrix\Im\Integration\Disk\Documents::getDocumentsInCallStatus(),
				'call_resumes_status' => \Bitrix\Im\Integration\Disk\Documents::getResumesOfCallStatus(),
				'call_features' => $features,
				'force_large_calls' => Option::get('im', 'force_large_calls'),
				'conference_chat_enabled' => Settings::isConferenceChatEnabled(),
				'call_use_tcp_sdp' => Settings::useTcpSdp(),
				'user_jwt' => \Bitrix\Call\JwtCall::getUserJwt((int)CurrentUser::get()->getId()),
			],
			'settings' => [
				'ai' => [
					'serviceEnabled' => Settings::isAIServiceEnabled(),
					'settingsEnabled' => CallAISettings::isEnableBySettings(),
					'recordingMinUsers' => CallAISettings::getRecordMinUsers(),
					'agreementAccepted' => CallAISettings::isAgreementAccepted(),
					'tariffAvailable' => CallAISettings::isTariffAvailable(),
					'baasAvailable' => CallAISettings::baasAvailable(),
					'baasPromoSlider' => CallAIBaasService::getBaasSliderCode(),
					'marketSubscriptionEnabled' => CallAISettings::checkMarketSubscription() ? CallAISettings::isMarketSubscriptionEnabled() : true,
					'marketSubscriptionSlider' => CallAISettings::getMarketSliderCode(),
					'feedBackLink' => CallAISettings::getFeedBackLink(),
					'helpSlider' => CallAISettings::checkMarketSubscription() ? CallAISettings::getMarketSliderCode() : CallAISettings::getHelpSliderCode(),
					'disclaimerArticleCode' => CallAISettings::getDisclaimerArticleCode(),
				],
				'cloudRecord' => [
					'serviceEnabled' => Settings::isCloudRecordEnabled(),
					'tariffAvailable' => Settings::isCloudRecordingAvailable(),
					'isCisRegion' => Settings::isCisRegion(),
					'tariffSlider' => 'limit_v2_videocall_cloud_record',
				],
				'call' => [
					'jwtCallsEnabled' => Settings::isNewCallsEnabled(),
					'plainCallsUseJwt' => Settings::isPlainCallsUseNewScheme(),
					'plainCallFollowUpEnabled' => Settings::isPlainCallFollowUpEnabled(),
					'plainCallCloudRecordingEnabled' => Settings::isPlainCallCloudRecordingEnabled(),
					'callBalancerUrl' => Settings::getBalancerUrl(),
					'noiseSuppressionEnabled' => Settings::isNoiseSuppressionEnabled(),
					'accidentLogSendIntervalSecs' => Settings::getAccidentLogSendIntervalSecs(),
					'accidentLogGroupMaxAgeSecs' => Settings::getAccidentLogGroupMaxAgeSecs(),
					'bigRoomChats' => Settings::getBigRoomChats(),
					'callInvitePeriod' => Settings::getCallInvitePeriod(),
				],
				'isUserControlFeatureEnabled' => Settings::isNewCallsEnabled(),
				'isPictureInPictureFeatureEnabled' => Settings::isNewCallsEnabled(),
				'isStreamQualityFeatureEnabled' => Settings::isStreamQualityFeatureEnabled(),
				'isDisableCameraNewJoinedUsersFeatureEnabled' => Settings::isDisableCameraNewJoinedUsersFeatureEnabled(),
				'isKibanaLogsEnabled' => Settings::isKibanaLogsEnabled(),
				'isConsoleLogsEnabled' => Settings::isConsoleLogsEnabled(),
				'countDisableCameraNewJoinedUsersFeature' => Settings::countDisableCameraNewJoinedUsersFeature(),
				'isMetricsEnabled' => Settings::isMetricsEnabled(),
				'isMetricsLogsEnabled' => Settings::isMetricsLogsEnabled(),
				'isAirDesignEnabled' => \Bitrix\Im\V2\Service\Locator::getMessenger()->getApplication()->isAirDesignEnabled(),
				'shouldHideQuickAccess' => \Bitrix\Im\V2\Service\Locator::getMessenger()->getApplication()->shouldHideQuickAccess(),
				'isCloudRecordEnabled' => Settings::isCloudRecordEnabled(),
				'isCloudRecordTariffEnabled' => Settings::isCloudRecordTariffEnabled(),
				'isCloudRecordCisRegion' => Settings::isCisRegion(),
				'isCloudRecordLogEnabled' => Settings::isCloudRecordingAvailable(),
				'callInstalled' => \Bitrix\Main\ModuleManager::isModuleInstalled('call'),
				'isVueEnabled' => Settings::isVueEnabled(),
			],
		];
	},
	'skip_core' => false,
];
