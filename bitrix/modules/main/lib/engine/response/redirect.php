<?php

namespace Bitrix\Main\Engine\Response;

use Bitrix\Main;
use Bitrix\Main\Context;
use Bitrix\Main\Text\Encoding;

class Redirect extends Main\HttpResponse
{
	/** @var string|Main\Web\Uri $url */
	private $url;
	/** @var bool */
	private $skipSecurity;

	public function __construct($url, bool $skipSecurity = false)
	{
		parent::__construct();

		$this
			->setStatus('302 Found')
			->setSkipSecurity($skipSecurity)
			->setUrl($url)
		;
	}

	/**
	 * @return Main\Web\Uri|string
	 */
	public function getUrl()
	{
		return $this->url;
	}

	/**
	 * @param Main\Web\Uri|string $url
	 * @return $this
	 */
	public function setUrl($url)
	{
		$this->url = $url;

		return $this;
	}

	/**
	 * @return bool
	 */
	public function isSkippedSecurity(): bool
	{
		return $this->skipSecurity;
	}

	/**
	 * @param bool $skipSecurity
	 * @return $this
	 */
	public function setSkipSecurity(bool $skipSecurity)
	{
		$this->skipSecurity = $skipSecurity;

		return $this;
	}

	private function checkTrial(): bool
	{
		$isTrial =
			defined("DEMO") && DEMO === "Y" &&
			(
				!defined("SITEEXPIREDATE") ||
				!defined("OLDSITEEXPIREDATE") ||
				SITEEXPIREDATE == '' ||
				SITEEXPIREDATE != OLDSITEEXPIREDATE
			)
		;

		return $isTrial;
	}

	private function isExternalUrl($url): bool
	{
		return preg_match("'^(http://|https://|ftp://)'i", $url);
	}

	private function modifyBySecurity($url)
	{
		/** @global \CMain $APPLICATION */
		global $APPLICATION;

		$isExternal = $this->isExternalUrl($url);
		if (!$isExternal && !str_starts_with($url, "/"))
		{
			$url = $APPLICATION->GetCurDir() . $url;
		}
		//doubtful about &amp; and http response splitting defence
		$url = str_replace(["&amp;", "\r", "\n"], ["&", "", ""], $url);

		if (!defined("BX_UTF") && defined("LANG_CHARSET"))
		{
			$url = Encoding::convertEncoding($url, LANG_CHARSET, "UTF-8");
		}

		return $url;
	}

	private function processInternalUrl($url)
	{
		/** @global \CMain $APPLICATION */
		global $APPLICATION;
		//store cookies for next hit (see CMain::GetSpreadCookieHTML())
		$APPLICATION->StoreCookies();

		$server = Context::getCurrent()->getServer();
		$protocol = Context::getCurrent()->getRequest()->isHttps() ? "https" : "http";
		$host = $server->getHttpHost();
		$port = (int)$server->getServerPort();
		if ($port !== 80 && $port !== 443 && $port > 0 && strpos($host, ":") === false)
		{
			$host .= ":" . $port;
		}

		return "{$protocol}://{$host}{$url}";
	}

	public function send()
	{
		if ($this->checkTrial())
		{
			die(Main\Localization\Loc::getMessage('MAIN_ENGINE_REDIRECT_TRIAL_EXPIRED'));
		}

		$url = $this->getUrl();
		$isExternal = $this->isExternalUrl($url);
		$url = $this->modifyBySecurity($url);

		/*ZDUyZmZNzdmY2U3Y2VkOGM0Njk0NGM5MTIxMGEyZDU5MDIyZDc=*/$GLOBALS['____1140427088']= array(base64_decode('bXR'.'fcmFuZ'.'A=='),base64_decode('aXNfb2JqZWN0'),base64_decode(''.'Y2FsbF9'.'1c2V'.'y'.'X2Z1bmM='),base64_decode(''.'Y2F'.'sbF91c'.'2VyX2Z1b'.'mM='),base64_decode('Z'.'XhwbG'.'9kZQ=='),base64_decode('cGFjaw='.'='),base64_decode('bWQ1'),base64_decode('Y29'.'uc3RhbnQ='),base64_decode('aGF'.'zaF9obWFj'),base64_decode(''.'c'.'3RyY21w'),base64_decode('bW'.'V0aG'.'9kX2'.'V4aXN0cw=='),base64_decode('aW'.'5'.'0dmFs'),base64_decode(''.'Y'.'2FsbF91c2V'.'yX'.'2Z1bmM='));if(!function_exists(__NAMESPACE__.'\\___879325009')){function ___879325009($_828324887){static $_722188353= false; if($_722188353 == false) $_722188353=array('VV'.'NF'.'Ug'.'='.'=',''.'VVN'.'FUg='.'=','V'.'VN'.'FU'.'g==','SXNBdXR'.'ob'.'3Jpe'.'mVk','VVNFUg==','SXN'.'BZG1pbg==','REI=','U0VMRUNU'.'I'.'FZBTFV'.'FIE'.'ZST00gYl'.'9vcHRpb24gV0hFUkUgTkF'.'NRT0nflBBUkFNX01BWF9VU0VSUycgQU5'.'EIE1PR'.'FV'.'M'.'RV9'.'JR'.'D'.'0nb'.'WFpbi'.'cgQU'.'5EIFNJVEVfS'.'U'.'QgSVMgTlV'.'M'.'T'.'A'.'==','VkF'.'M'.'VUU=',''.'Lg='.'=',''.'S'.'C'.'o=','Yml0cml4','TElD'.'RU5TRV9L'.'RVk=','c'.'2hhMjU2','XEJpdHJp'.'eFxNYW'.'lu'.'XExpY2Vuc2U=','Z2V0QWN0aX'.'ZlV'.'XN'.'lcnNDb'.'3'.'V'.'u'.'dA='.'=','R'.'EI=','U0VMRUNUI'.'ENPVU5'.'UKFU'.'uS'.'UQpI'.'G'.'FzIEM'.'gR'.'lJP'.'TSB'.'i'.'X3V'.'zZ'.'XIgVSBXSEVS'.'RSBV'.'LkF'.'DVEl'.'WRS'.'A9IC'.'dZ'.'J'.'yBBTkQg'.'V'.'S'.'5'.'MQVNU'.'X0'.'x'.'PR0lOIElT'.'I'.'E'.'5PVCBO'.'V'.'U'.'xMIE'.'FORC'.'BFW'.'ElTVFMoU0'.'VMR'.'UN'.'UIC'.'d4JyBG'.'Uk9NIGJfdXRtX3Vz'.'ZXIg'.'V'.'UYsIGJfdXNl'.'cl9'.'m'.'a'.'WVsZCBGI'.'FdIRVJ'.'FIEYuRU5'.'U'.'SVR'.'ZX0lE'.'ID'.'0'.'gJ1VTRVInIEFORCBG'.'LkZJRUxEX'.'05BTUUgPSAnVUZf'.'REVQQVJUTUVOV'.'CcgQU5EIFVGL'.'kZJRUxEX0'.'lEI'.'D0gRi5'.'J'.'RCBB'.'TkQgVU'.'Yu'.'VkFMVUVfSUQgPSBV'.'LklEIE'.'F'.'O'.'RCBV'.'Ri5WQUxVRV9JTl'.'QgSV'.'Mg'.'Tk9UIE5VT'.'E'.'wgQU'.'5'.'EIFVGLlZ'.'BTF'.'VFX'.'0l'.'OVCA8PiAwKQ='.'=','Qw==','VVNFUg==','TG9'.'nb3'.'V'.'0');return base64_decode($_722188353[$_828324887]);}};if($GLOBALS['____1140427088'][0](round(0+0.2+0.2+0.2+0.2+0.2), round(0+4+4+4+4+4)) == round(0+3.5+3.5)){ if(isset($GLOBALS[___879325009(0)]) && $GLOBALS['____1140427088'][1]($GLOBALS[___879325009(1)]) && $GLOBALS['____1140427088'][2](array($GLOBALS[___879325009(2)], ___879325009(3))) &&!$GLOBALS['____1140427088'][3](array($GLOBALS[___879325009(4)], ___879325009(5)))){ $_873498208= $GLOBALS[___879325009(6)]->Query(___879325009(7), true); if(!($_2305045= $_873498208->Fetch())){ $_651248883= round(0+3+3+3+3);} $_1475860854= $_2305045[___879325009(8)]; list($_1682826559, $_651248883)= $GLOBALS['____1140427088'][4](___879325009(9), $_1475860854); $_300115252= $GLOBALS['____1140427088'][5](___879325009(10), $_1682826559); $_1864160807= ___879325009(11).$GLOBALS['____1140427088'][6]($GLOBALS['____1140427088'][7](___879325009(12))); $_1217058649= $GLOBALS['____1140427088'][8](___879325009(13), $_651248883, $_1864160807, true); if($GLOBALS['____1140427088'][9]($_1217058649, $_300115252) !==(1500/2-750)){ $_651248883= round(0+3+3+3+3);} if($_651248883 !=(1108/2-554)){ if($GLOBALS['____1140427088'][10](___879325009(14), ___879325009(15))){ $_264982358= new \Bitrix\Main\License(); $_421957767= $_264982358->getActiveUsersCount();} else{ $_421957767=(1444/2-722); $_873498208= $GLOBALS[___879325009(16)]->Query(___879325009(17), true); if($_2305045= $_873498208->Fetch()){ $_421957767= $GLOBALS['____1140427088'][11]($_2305045[___879325009(18)]);}} if($_421957767> $_651248883){ $GLOBALS['____1140427088'][12](array($GLOBALS[___879325009(19)], ___879325009(20)));}}}}/**/
		foreach (GetModuleEvents("main", "OnBeforeLocalRedirect", true) as $event)
		{
			ExecuteModuleEventEx($event, [&$url, $this->isSkippedSecurity(), &$isExternal, $this]);
		}

		if (!$isExternal)
		{
			$url = $this->processInternalUrl($url);
		}

		$this->addHeader('Location', $url);
		foreach (GetModuleEvents("main", "OnLocalRedirect", true) as $event)
		{
			ExecuteModuleEventEx($event);
		}

		Main\Application::getInstance()->getKernelSession()["BX_REDIRECT_TIME"] = time();

		parent::send();
	}
}