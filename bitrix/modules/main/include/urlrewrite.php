<?php

use Bitrix\Main\Web;

error_reporting(E_COMPILE_ERROR|E_ERROR|E_CORE_ERROR|E_PARSE);

require_once(__DIR__."/../bx_root.php");
require_once(__DIR__."/../lib/loader.php");
require_once(__DIR__."/autoload.php");
require_once(__DIR__."/../tools.php");

$bSkipRewriteChecking = false;

//try to fix REQUEST_URI under IIS
$aProtocols = array('http', 'https');
foreach($aProtocols as $prot)
{
	$marker = "404;".$prot."://";
	if(($p = mb_strpos($_SERVER["QUERY_STRING"], $marker)) !== false)
	{
		$uri = $_SERVER["QUERY_STRING"];
		if(($p = mb_strpos($uri, "/", $p + mb_strlen($marker))) !== false)
		{
			if($_SERVER["REQUEST_URI"] == '' || $_SERVER["REQUEST_URI"] == '/404.php' || mb_strpos($_SERVER["REQUEST_URI"], $marker) !== false)
			{
				$_SERVER["REQUEST_URI"] = $REQUEST_URI = mb_substr($uri, $p);
			}
			$_SERVER["REDIRECT_STATUS"] = '404';
			$_SERVER["QUERY_STRING"] = $QUERY_STRING = "";
			$_GET = array();
			break;
		}
	}
}

if (!defined("AUTH_404"))
	define("AUTH_404", "Y");

require_once($_SERVER["DOCUMENT_ROOT"].BX_PERSONAL_ROOT."/php_interface/dbconn.php");

if (defined("BX_URLREWRITE"))
	return;
define("BX_URLREWRITE", true);

$foundQMark = mb_strpos($_SERVER["REQUEST_URI"], "?");
$requestUriWithoutParams = ($foundQMark !== false? mb_substr($_SERVER["REQUEST_URI"], 0, $foundQMark) : $_SERVER["REQUEST_URI"]);
$requestParams = ($foundQMark !== false? mb_substr($_SERVER["REQUEST_URI"], $foundQMark) : "");

//decode only filename, not parameters
$requestPage = urldecode($requestUriWithoutParams);

$requestUri = $requestPage.$requestParams;

$io = CBXVirtualIo::GetInstance();

$arUrlRewrite = array();
if(file_exists($_SERVER['DOCUMENT_ROOT']."/urlrewrite.php"))
	include($_SERVER['DOCUMENT_ROOT']."/urlrewrite.php");

if((isset($_SERVER['REDIRECT_STATUS']) && $_SERVER['REDIRECT_STATUS'] == '404') || isset($_GET["SEF_APPLICATION_CUR_PAGE_URL"]))
{
	if(isset($_SERVER['REDIRECT_STATUS']) && $_SERVER['REDIRECT_STATUS'] == '404' && !isset($_GET["SEF_APPLICATION_CUR_PAGE_URL"]))
	{
		$url = $requestUri;
	}
	else
	{
		if(!is_string($_GET["SEF_APPLICATION_CUR_PAGE_URL"]))
		{
			$_GET["SEF_APPLICATION_CUR_PAGE_URL"] = '';
		}
		$url = $requestUri = $_GET["SEF_APPLICATION_CUR_PAGE_URL"];
		$_SERVER["REQUEST_URI"] = $REQUEST_URI = Web\Uri::urnEncode($_GET["SEF_APPLICATION_CUR_PAGE_URL"], false);
		unset($_GET["SEF_APPLICATION_CUR_PAGE_URL"]);
	}

	if(($pos = mb_strpos($url, "?")) !== false)
	{
		$params = mb_substr($url, $pos + 1);
		if ($params !== false && $params !== "")
		{
			parse_str($params, $vars);
			unset($vars["SEF_APPLICATION_CUR_PAGE_URL"]);

			$_GET += $vars;
			$_REQUEST += $vars;
			if (ini_get_bool("register_globals"))
			{
				foreach ($vars as $key => $val)
				{
					if (!isset($GLOBALS[$key]))
					{
						$GLOBALS[$key] = $val;
					}
				}
			}

			$_SERVER["QUERY_STRING"] = $QUERY_STRING = Web\Uri::urnEncode($params, false);
		}
	}

	if (isset($_GET["SEF_APPLICATION_CUR_PAGE_URL"])
		&& (
			isset($_SERVER['REDIRECT_STATUS']) && $_SERVER['REDIRECT_STATUS'] == '404'
			|| ($requestUriWithoutParams != "/bitrix/urlrewrite.php")
		)
	)
	{
		$url = $requestUri = $_SERVER["REQUEST_URI"] = $REQUEST_URI = "";
		$_GET = array();
		$_REQUEST = array();
		$_SERVER["QUERY_STRING"] = $QUERY_STRING = "";
	}

	$uriPath = GetRequestUri();
	define("POST_FORM_ACTION_URI", htmlspecialcharsbx("/bitrix/urlrewrite.php?SEF_APPLICATION_CUR_PAGE_URL=".urlencode($uriPath)));
}

$uri = new Web\Uri($_SERVER["REQUEST_URI"]);
if (!$uri->isPathTraversal())
{
	foreach($arUrlRewrite as $val)
	{
		if(preg_match($val["CONDITION"], $requestUri))
		{
			if (!empty($val["RULE"]))
				$url = preg_replace($val["CONDITION"], ($val["PATH"] <> '' ? $val["PATH"]."?" : "").$val["RULE"], $requestUri);
			else
				$url = $val["PATH"];

			if(($pos = mb_strpos($url, "?"))!==false)
			{
				$params = mb_substr($url, $pos + 1);
				parse_str($params, $vars);
				unset($vars["SEF_APPLICATION_CUR_PAGE_URL"]);

				$_GET += $vars;
				$_REQUEST += $vars;
				$_SERVER["QUERY_STRING"] = $QUERY_STRING = Web\Uri::urnEncode($params, false);
				$url = mb_substr($url, 0, $pos);

				// actualize context if it is initialized already
				if (\Bitrix\Main\Application::hasInstance() && \Bitrix\Main\Application::getInstance()->getContext())
				{
					\Bitrix\Main\Context::getCurrent()->getRequest()->modifyByQueryString($_SERVER["QUERY_STRING"]);
				}
			}

			$url = _normalizePath($url);

			if(!$io->FileExists($_SERVER['DOCUMENT_ROOT'].$url))
				continue;

			if (!$io->ValidatePathString($url))
				continue;

			$urlTmp = mb_strtolower(ltrim($url, "/\\"));
			$urlTmp = str_replace(".", "", $urlTmp);

			if ((str_starts_with($urlTmp, "upload/") || (str_starts_with($urlTmp, "bitrix/") && !str_starts_with($urlTmp, "bitrix/services/") && !str_starts_with($urlTmp, "bitrix/groupdavphp"))))
				continue;

			$ext = strtolower(GetFileExtension($url));
			if ($ext != "php")
				continue;

			// D7 response is not available here
			if(stristr(php_sapi_name(), "cgi") !== false && (!defined("BX_HTTP_STATUS") || BX_HTTP_STATUS == false))
			{
				header("Status: 200 OK");
			}
			else
			{
				header($_SERVER["SERVER_PROTOCOL"]." 200 OK");
			}

			$_SERVER["REAL_FILE_PATH"] = $url;
			include_once($io->GetPhysicalName($_SERVER['DOCUMENT_ROOT'].$url));
			die();
		}
	}
}

//admin section 404
if(str_starts_with($requestUri, "/bitrix/admin/"))
{
	$_SERVER["REAL_FILE_PATH"] = "/bitrix/admin/404.php";
	include($_SERVER["DOCUMENT_ROOT"]."/bitrix/admin/404.php");
	die();
}

define("BX_CHECK_SHORT_URI", true);
