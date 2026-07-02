<?php

if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Rest\Engine\Access;
use Bitrix\Rest\PlacementTable;
use Bitrix\Main;
use Bitrix\Rest;

/**
 * Bitrix vars
 *
 * @var array $arParams
 * @var array $arResult
 * @var CBitrixComponent $this
 * @global CMain $APPLICATION
 * @global CUser $USER
 */

$request = \Bitrix\Main\Context::getCurrent()->getRequest();
//$arResult['SUBSCRIPTION_FINISH']; //defined in class.php
$arApp = $arResult['APPLICATION'];
//	$arResult['APP_NAME']; //defined in class.php
//	$arResult['PRESET_OPTIONS']; //defined in class.php
$arParams['ID'] = $arApp['ID'];

$arResult['ID'] = $arApp['ID'];
$arResult['APP_ID'] = $arApp['CLIENT_ID'];
$arResult['APP_VERSION'] = $arApp['VERSION'];
$arResult['APP_INSTALLED'] = $arApp['INSTALLED'] == \Bitrix\Rest\AppTable::INSTALLED;
$arResult['APP_CODE'] = $arApp['CODE'];

// common application options set via setAppOption
$arResult['APP_OPTIONS'] = COption::GetOptionString("rest", "options_".$arResult['APP_ID'], "");
if($arResult['APP_OPTIONS'] <> '')
	$arResult['APP_OPTIONS'] = unserialize($arResult['APP_OPTIONS'], ['allowed_classes' => false]);
else
	$arResult['APP_OPTIONS'] = array();

// user application options set via setUserOption
$arResult['USER_OPTIONS'] = CUserOptions::GetOption("app_options", "options_".$arResult['APP_ID'], array());

// additional user application params set by app environment
$arAppParams = CUserOptions::GetOption("app_options", "params_".$arResult['APP_ID']."_".$arResult['APP_VERSION'], array());

// this is a first run for the application and the current user
$arResult['FIRST_RUN'] = !array_key_exists('install', $arAppParams) || !$arAppParams['install'];

//		$arResult['AUTH'] - from class.php;

$arResult['APP_NEED_REINSTALL'] = $arApp['STATUS'] == \Bitrix\Rest\AppTable::STATUS_PAID && !isset($arApp['SHARED_KEY']);

$arResult['APP_SID'] = md5(uniqid(rand(), true));

$arResult['IS_ADMIN'] = \CRestUtil::isAdmin() || \CRestUtil::canInstallApplication($arApp);
$arResult['REST_PATH'] = \Bitrix\Main\Config\Option::get("rest", "server_path", "/rest");

if (empty($arResult['AUTH']))
{
	$arResult['APP_STATUS']['PAYMENT_ALLOW'] = 'N';
}

// additional actions
if($arResult['APP_STATUS']['PAYMENT_ALLOW'] == 'Y' && isset($_REQUEST['action']) && in_array($_REQUEST['action'], array('access_refresh', 'set_option', 'set_installed')) && check_bitrix_sessid())
{
	$APPLICATION->RestartBuffer();

	Header('Content-Type: application/json');

	switch($_REQUEST['action'])
	{
		// refresh auth
		case 'access_refresh':
			echo '{"access_token":"'.$arResult["AUTH"]['access_token'].'","refresh_token":"'.$arResult['AUTH']['refresh_token'].'","expires_in":"'.$arResult["AUTH"]['expires_in'].'"}';
			break;

		// set application option value
		case 'set_option':
			if($arResult['IS_ADMIN'])
			{
				if(is_array($_REQUEST['options']))
				{
					foreach($_REQUEST['options'] as $opt)
					{
						$arResult['APP_OPTIONS'][$opt['name']] = $opt['value'];
					}
				}

				\Bitrix\Main\Config\Option::set("rest", "options_".$arResult['APP_ID'], serialize($arResult['APP_OPTIONS']));

				echo \Bitrix\Main\Web\Json::encode($arResult['APP_OPTIONS']);
			}
			else
			{
				echo '{"error":"access_denied"}';
			}

			break;

		// set installation finish flag
		case 'set_installed':
			if($arResult['IS_ADMIN'])
			{
				\Bitrix\Rest\AppTable::setSkipRemoteUpdate(true);
				$updateResult = \Bitrix\Rest\AppTable::update(
					$arParams['ID'],
					array(
						'INSTALLED' => $_REQUEST['v'] == 'N'
							? \Bitrix\Rest\AppTable::NOT_INSTALLED
							: \Bitrix\Rest\AppTable::INSTALLED
					)
				);
				\Bitrix\Rest\AppTable::setSkipRemoteUpdate(false);

				\Bitrix\Rest\AppTable::install($arParams['ID']);

				\Bitrix\Rest\AppLogTable::log($arParams['ID'], \Bitrix\Rest\AppLogTable::ACTION_TYPE_INSTALL);

				echo '{"result":"'.($updateResult->isSuccess()  ? 'true' : 'false').'"}';
			}
			else
			{
				echo '{"result":"false"}';
			}
			break;
	}

	\CMain::FinalActions();
	die();
}

// get and parse application URL
//		$arResult['APP_URL']; //defined in class.php
//		$arResult['INSTALL']; //defined in class.php

$arResult["APP_STATIC"] = \CRestUtil::isStatic($arResult['APP_URL']);

$p = parse_url($arResult['APP_URL']);
$arResult['APP_HOST'] = $p['host'];
$arResult['APP_PORT'] = $p['port'] ?? null;
$arResult['APP_PROTO'] = $p['scheme'];

if($arResult['APP_PORT'])
{
	$arResult['APP_HOST'] .= ':'.$arResult['APP_PORT'];
}

$arResult['CURRENT_HOST_SECURE'] = $request->isHttps();
$arResult['CURRENT_HOST'] = $request->getHttpHost();

$serverPort = \Bitrix\Main\Context::getCurrent()->getServer()->getServerPort();
if($serverPort != 80 && $serverPort != 443)
{
	$arResult['CURRENT_HOST'] .= ':'.$serverPort;
}

$arResult['MEMBER_ID'] = \CRestUtil::getMemberId();

$updateVersion = intval(\Bitrix\Rest\Marketplace\Client::getAvailableUpdate($arApp["CODE"]));
if(
	$updateVersion > $arApp['VERSION']
	&& !array_key_exists('skip_update_'.$updateVersion, $arAppParams)
)
{
	$arResult['UPDATE_VERSION'] = $updateVersion;
}

if($arParams['POPUP'])
{
	$APPLICATION->RestartBuffer();
	$APPLICATION->ShowAjaxHead();
}
elseif(!isset($arParams['SET_TITLE']) || $arParams['SET_TITLE'] !== 'N')
{
	$APPLICATION->SetTitle(htmlspecialcharsbx($arResult['APP_NAME']));
}

CJSCore::Init(array('applayout'));

if($arResult['APP_STATUS']['PAYMENT_ALLOW'] === 'Y')
{
	\Bitrix\Rest\UsageStatTable::logPlacement($arResult['APP_ID'], $arParams['PLACEMENT']);
	\Bitrix\Rest\UsageStatTable::finalize();
}

$componentPage = '';
if (
	$arResult['APP_STATUS']['PAYMENT_EXPIRED'] === 'Y'
	&& (
		$arResult['APP_STATUS']['STATUS'] === \Bitrix\Rest\AppTable::STATUS_TRIAL
		|| $arResult['APP_STATUS']['STATUS'] === \Bitrix\Rest\AppTable::STATUS_PAID
	)
	&& \Bitrix\Rest\Marketplace\Client::isSubscriptionAvailable()
)
{
	$componentPage = 'payment';
}
elseif (
	!Access::isAvailable($arApp['CODE'])
	|| (Access::needCheckCount() && !Access::isAvailableCount(Access::ENTITY_TYPE_APP, $arApp['CODE']))
)
{
	$arResult['ERROR_MESSAGE'] = GetMessage('REST_AL_ERROR_APP_ACCESS_DENIED');
	$componentPage = 'error';
	if (\Bitrix\Main\Loader::includeModule('ui'))
	{
		$code = Access::getHelperCode(Access::ACTION_OPEN, Access::ENTITY_TYPE_APP, $arResult['APP_ID']);
		if ($code !== '')
		{
			$arResult['HELPER_DATA']['CODE'] = $code;
			$arResult['HELPER_DATA']['TEMPLATE_URL'] = \Bitrix\UI\InfoHelper::getUrl();
			$arResult['HELPER_DATA']['URL'] = str_replace(
				'/code/',
				'/' . $code . '/',
				$arResult['HELPER_DATA']['TEMPLATE_URL']
			);
		}
	}
}
elseif (
	$arResult['APP_STATUS']['PAYMENT_EXPIRED'] === 'Y'
	||
	(
		$arResult['APP_STATUS']['STATUS'] === \Bitrix\Rest\AppTable::STATUS_SUBSCRIPTION
		&& !\Bitrix\Rest\Marketplace\Client::isSubscriptionAvailable()
	)
)
{
	if (\Bitrix\Main\Loader::includeModule('ui'))
	{
		$code = Access::getHelperCode(
			Access::ACTION_OPEN,
			Access::ENTITY_TYPE_APP,
			$arResult['APP_ID']
		);
		if ($code !== '')
		{
			$arResult['HELPER_DATA']['CODE'] = $code;
			$arResult['HELPER_DATA']['TEMPLATE_URL'] = \Bitrix\UI\InfoHelper::getUrl();
			$arResult['HELPER_DATA']['URL'] = str_replace(
				'/code/',
				'/' . $code . '/',
				$arResult['HELPER_DATA']['TEMPLATE_URL']
			);
		}
	}
	$componentPage = 'payment';
}

$this->IncludeComponentTemplate($componentPage);

if($arParams['POPUP'])
{
	CMain::FinalActions();
	die();
}

return $arResult['APP_SID'];
