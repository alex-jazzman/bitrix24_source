<?
/*
This is callback page for Bitrix24.Net OAuth 2.0 authentication.
Bitrix24.Net redirects only to specific back url set in the OAuth application.
The page opens in popup window after user authorized on Bitrix24.Net.
*/

/**
 * Bitrix vars
 *
 * @global \CUser $USER
 *
 */

define("NOT_CHECK_PERMISSIONS", true);
define('SOCSERV_CHECK_STATE_ADMIN_SECTION', true);

require_once $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/socialservices/include/state_processing.php';
require_once($_SERVER['DOCUMENT_ROOT']."/bitrix/modules/main/include/prolog_before.php");

if(isset($_REQUEST["update_broadcast"]))
{
	\Bitrix\Main\Config\Option::set("socialservices", "network_last_update", time());
}
else
{
	if(CModule::IncludeModule("socialservices"))
	{
		if(isset($_REQUEST['apcode']))
		{
			if($USER->IsAuthorized())
			{
				if(\Bitrix\Socialservices\ApManager::receive($USER->GetID(), $_REQUEST['apcode']))
				{
					$arState = \Bitrix\Socialservices\OAuth\StateService::getInstance()->getPayload($state);
					if(isset($arState['redirect_url']))
					{
						LocalRedirect($arState['redirect_url']);
					}
					elseif(defined('ADMIN_SECTION'))
					{
						LocalRedirect('/bitrix/admin/');
					}
					else
					{
						LocalRedirect('/');
					}
				}
			}
		}
		else
		{
			$oAuthManager = new CSocServAuthManager();
			$oAuthManager->Authorize("Bitrix24Net");
		}
	}
}

require_once($_SERVER['DOCUMENT_ROOT']."/bitrix/modules/main/include/epilog_after.php");
?>
