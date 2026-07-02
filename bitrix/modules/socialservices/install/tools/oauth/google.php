<?
/*
This is callback page for Google OAuth 2.0 authentication.
Google redirects only to specific back url set in the OAuth application.
The page opens in popup window after user authorized on Google.
*/
define("NOT_CHECK_PERMISSIONS", true);

require_once $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/socialservices/include/state_processing.php';

require_once($_SERVER['DOCUMENT_ROOT'] . "/bitrix/modules/main/include/prolog_before.php");

if(Bitrix\Main\Loader::includeModule("socialservices"))
{
	$provider = 'GoogleOAuth';

	$state = (string)($_REQUEST['state'] ?? '');
	$statePayload = \Bitrix\Socialservices\OAuth\StateService::getInstance()->getPayload($state);
	if (isset($statePayload['provider']) && $statePayload['provider'] === 'GooglePlusOAuth')
	{
		$provider = 'GooglePlusOAuth';
	}

	$oAuthManager = CSocServGoogleProxyOAuth::isProxyAuth()
			? new CSocServGoogleProxyOAuth()
			: new CSocServAuthManager()
	;
	$oAuthManager->Authorize($provider);
}

require_once($_SERVER['DOCUMENT_ROOT'] . "/bitrix/modules/main/include/epilog_after.php");
?>
