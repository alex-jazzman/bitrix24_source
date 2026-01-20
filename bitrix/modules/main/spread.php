<?php

// Should work only on HTTPS requests

use Bitrix\Main;
use Bitrix\Main\Web;
use Bitrix\Main\Security\Sign;

header("Content-type: image/png");

if (!empty($_GET['s']) && is_string($_GET['s']))
{
	// "SameSite: None" requires "secure"
	ini_set('session.cookie_secure', 1);
	ini_set('session.cookie_samesite', 'None');

	require_once(__DIR__.'/include.php');

	$application = Main\Application::getInstance();
	$signer = new Main\Security\Sign\TimeSigner();

	try
	{
		$cookieString = base64_decode($signer->unsign($_GET['s'], 'spread-' . md5($_SERVER['REMOTE_ADDR'])));

		$arr = explode(chr(2), $cookieString);

		if (is_array($arr))
		{
			$context = Main\Context::getCurrent();
			$request = $context->getRequest();
			$response = $context->getResponse();

			$host = $request->getHttpHost();

			foreach ($arr as $str)
			{
				if ($str != '')
				{
					$ar = explode(chr(1), $str);

					// "SameSite: None" requires "secure"
					$cookie = (new Web\Cookie($ar[0], $ar[1], $ar[2], false))
						->setPath($ar[3])
						->setDomain($host)
						->setSecure(true)
						->setHttpOnly($ar[6])
						->setSameSite(Web\Http\Cookie::SAME_SITE_NONE)
					;

					$response->addCookie($cookie);

					//logout
					if(substr($ar[0], -5) == '_UIDH' && $ar[1] == '')
					{
						$kernelSession = $application->getKernelSession();
						$kernelSession["SESS_AUTH"] = [];
						unset($kernelSession["SESS_AUTH"]);
						unset($kernelSession["SESS_OPERATIONS"]);
					}
				}
			}

			$application->end();
		}
	}
	catch (Sign\BadSignatureException)
	{
	}
}
