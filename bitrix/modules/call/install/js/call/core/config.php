<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Loader;
use Bitrix\Main\Config\Option;
use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Main\Localization\Loc;
use Bitrix\Call\Settings;
use Bitrix\Call\Integration\AI\CallAISettings;
use Bitrix\Call\Integration\AI\CallAIBaasService;
use Bitrix\Ui\Public\Services\Copilot\CopilotNameService;

Loc::loadMessages(__FILE__);

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
		'call.application.incoming',
		'call.component.lobby',
		'call.infrastructure.broadcast-channel',
		'call.legacy.component.user-list',
		'call.legacy.component.user-list-popup',
		'call.lib.a11y',
		'call.lib.analytics',
		'call.lib.background-dialog',
		'call.lib.call-token-manager',
		'call.lib.hardware',
		'call.lib.media-registry',
		'call.lib.reconnect-history',
		'call.lib.settings-manager',
		'call.lib.stuck-call-finish-tracker',
		'call.mapping',
		'im.lib.localstorage',
		'im.v2.const',
		'im.v2.lib.desktop',
		'im.v2.lib.desktop-api',
		'im.v2.lib.promo',
		'loader',
		'main.core',
		'main.core.events',
		'main.popup',
		'resize_observer',
		'ui.a11y',
		'ui.buttons',
		'ui.dialogs.messagebox',
		'ui.hint',
		'ui.notification',
		'ui.switcher',
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

		$copilotNameReplace = ['#COPILOT_NAME#' => CallAISettings::getCopilotName()];
		$copilotLangData = Loc::loadLanguageFile(__DIR__ . '/copilot.php');
		$copilotPhrases = [];
		foreach ($copilotLangData as $key => $template)
		{
			$copilotPhrases[$key] = strtr($template, $copilotNameReplace);
		}

		$rel = [
			'call.view',
		];

		// The logger ships with the core so that it is already on the page once an error happens.
		// Keep this condition no stricter than the client's own check in accident-manager.ts: a
		// stricter one would leave the client collecting logs with no extension on the page.
		if (
			Settings::getAccidentLogSendIntervalSecs() > 0
			&& Settings::getAccidentLogGroupMaxAgeSecs() > 0
		)
		{
			$rel[] = 'call.lib.accident-logger';
		}

		return [
			'rel' => $rel,
			'lang_additional' => array_merge($copilotPhrases, [
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
			]),
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
					'copilotModelName' => (new CopilotNameService())->getCopilotName(),
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
					'accidentLogSendIntervalSecs' => Settings::getAccidentLogSendIntervalSecs(),
					'accidentLogGroupMaxAgeSecs' => Settings::getAccidentLogGroupMaxAgeSecs(),
					'bigRoomChats' => Settings::getBigRoomChats(),
					'callInvitePeriod' => Settings::getCallInvitePeriod(),
					'syncCallInvitePeriod' => Settings::getSyncCallInvitePeriod(),
					'autoBalanceEnabled' => Settings::isAutoBalanceEnabled(),
					'nqeDowngradeWindowSec' => Settings::getNqeDowngradeWindowSec(),
					'nqeUpgradeWindowSec' => Settings::getNqeUpgradeWindowSec(),
					'nqeWarmupSec' => Settings::getNqeWarmupSec(),
					'nqeHighDowngradePacketsLostPct' => Settings::getNqeHighDowngradePacketsLostPct(),
					// RTT is delivered for forward-compat only; not used by the v1 composite score (reserved for a future version).
					'nqeHighDowngradeRttMs' => Settings::getNqeHighDowngradeRttMs(),
					'nqeHighDowngradeJitterMs' => Settings::getNqeHighDowngradeJitterMs(),
					'nqeMedDowngradePacketsLostPct' => Settings::getNqeMedDowngradePacketsLostPct(),
					// RTT is delivered for forward-compat only; not used by the v1 composite score (reserved for a future version).
					'nqeMedDowngradeRttMs' => Settings::getNqeMedDowngradeRttMs(),
					'nqeMedDowngradeJitterMs' => Settings::getNqeMedDowngradeJitterMs(),
					'nqeMedUpgradePacketsLostPct' => Settings::getNqeMedUpgradePacketsLostPct(),
					// RTT is delivered for forward-compat only; not used by the v1 composite score (reserved for a future version).
					'nqeMedUpgradeRttMs' => Settings::getNqeMedUpgradeRttMs(),
					'nqeMedUpgradeJitterMs' => Settings::getNqeMedUpgradeJitterMs(),
					'nqeLowUpgradePacketsLostPct' => Settings::getNqeLowUpgradePacketsLostPct(),
					// RTT is delivered for forward-compat only; not used by the v1 composite score (reserved for a future version).
					'nqeLowUpgradeRttMs' => Settings::getNqeLowUpgradeRttMs(),
					'nqeLowUpgradeJitterMs' => Settings::getNqeLowUpgradeJitterMs(),
				],
				'isUserControlFeatureEnabled' => Settings::isNewCallsEnabled(),
				'isPictureInPictureFeatureEnabled' => Settings::isNewCallsEnabled(),
				'isStreamQualityFeatureEnabled' => Settings::isStreamQualityFeatureEnabled(),
				'isDisableCameraNewJoinedUsersFeatureEnabled' => Settings::isDisableCameraNewJoinedUsersFeatureEnabled(),
				'isWebPushToTalkEnabled' => Settings::isWebPushToTalkEnabled(),
				'isKibanaLogsEnabled' => Settings::isKibanaLogsEnabled(),
				'isConsoleLogsEnabled' => Settings::isConsoleLogsEnabled(),
				'countDisableCameraNewJoinedUsersFeature' => Settings::countDisableCameraNewJoinedUsersFeature(),
				'isAirDesignEnabled' => \Bitrix\Im\V2\Service\Locator::getMessenger()->getApplication()->isAirDesignEnabled(),
				'shouldHideQuickAccess' => \Bitrix\Im\V2\Service\Locator::getMessenger()->getApplication()->shouldHideQuickAccess(),
				'isCloudRecordEnabled' => Settings::isCloudRecordEnabled(),
				'isCloudRecordTariffEnabled' => Settings::isCloudRecordTariffEnabled(),
				'isCloudRecordCisRegion' => Settings::isCisRegion(),
				'isCloudRecordLogEnabled' => Settings::isCloudRecordingAvailable(),
				'callInstalled' => \Bitrix\Main\ModuleManager::isModuleInstalled('call'),
				'activePresetCode' => Settings::getActivePresetCode(),
				'syncTabBannerNeedToShow' => \Bitrix\Call\Promotion\SyncTabBannerPromo::needToShow(),
			],
		];
	},
	'skip_core' => false,
];
