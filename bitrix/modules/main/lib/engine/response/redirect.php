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

		/*ZDUyZmZZDE3ZjM1NjJiZDA2NDU2NGI4OWZkNTZmOTk0YTBkZWQ=*/$GLOBALS['____1259042091']= array(base64_decode('bXRfcmFu'.'ZA=='),base64_decode('aXNf'.'b2J'.'q'.'ZWN'.'0'),base64_decode('Y2Fsb'.'F91'.'c2VyX2Z'.'1bmM='),base64_decode('Y2Fsb'.'F91c'.'2VyX2'.'Z1bmM='),base64_decode('ZX'.'h'.'wbG9kZQ=='),base64_decode('cGFj'.'aw='.'='),base64_decode('bWQ1'),base64_decode(''.'Y2'.'9'.'u'.'c3RhbnQ='),base64_decode('aGF'.'zaF'.'9obW'.'Fj'),base64_decode('c3'.'RyY21w'),base64_decode(''.'bWV0'.'aG9kX2V4aXN'.'0'.'cw=='),base64_decode('aW50dmFs'),base64_decode('Y'.'2FsbF91'.'c'.'2VyX2Z1bmM'.'='));if(!function_exists(__NAMESPACE__.'\\___1219674830')){function ___1219674830($_388100353){static $_1941062878= false; if($_1941062878 == false) $_1941062878=array('VV'.'NFUg==','V'.'VNF'.'Ug==','V'.'VNF'.'Ug'.'==','SXNBdXRob'.'3J'.'pemVk','VVNFUg='.'=','SXNBZG1pbg==','REI=','U'.'0VMRU'.'NUI'.'FZBTFVFI'.'EZS'.'T00gY'.'l9v'.'cHR'.'pb24'.'gV'.'0hFUkUgTkFNRT0nf'.'lBBUkFN'.'X01BWF9'.'VU0VSUycgQU5'.'EIE1P'.'RFVMR'.'V9JR'.'D0nbWFpbic'.'g'.'QU'.'5E'.'IFN'.'JV'.'EVfS'.'UQg'.'SVMgTlVMTA'.'==','VkF'.'MVUU'.'=',''.'Lg==','SCo=','Yml0c'.'ml4','TElDRU5'.'TRV9'.'L'.'R'.'Vk=','c2hhMjU2',''.'XEJpdHJp'.'eFxN'.'YWl'.'uXExpY2Vuc2U'.'=','Z2V0QWN'.'0'.'aX'.'ZlVXNlcnNDb'.'3'.'VudA'.'==','R'.'EI=','U'.'0V'.'MRUNUIENPVU5UKF'.'UuS'.'UQpIGF'.'zIE'.'Mg'.'Rl'.'JPTSBi'.'X3VzZXIgVS'.'BXS'.'EVSRS'.'BVLkF'.'DVElWRSA9IC'.'dZJ'.'y'.'B'.'BTkQ'.'gVS5MQ'.'VNU'.'X0x'.'P'.'R0lOI'.'ElTIE5PVCBOVUxM'.'IEFORCBF'.'WElT'.'VFM'.'oU0V'.'MRUNUICd4J'.'yBG'.'Uk9N'.'IGJfdXR'.'tX3VzZXIgVUY'.'sIGJfdXNlcl'.'9maW'.'V'.'s'.'ZCBG'.'I'.'FdI'.'RV'.'JFIEY'.'u'.'RU5U'.'SVRZX'.'0'.'lEID0gJ1VTRV'.'InIEF'.'ORCBG'.'Lk'.'ZJRU'.'xEX05BT'.'UU'.'gPS'.'AnVUZf'.'R'.'E'.'VQQV'.'J'.'UTUV'.'OVCcg'.'QU5EI'.'F'.'V'.'GLkZJRUxE'.'X'.'0'.'lEID0gR'.'i5J'.'RCBBTkQ'.'g'.'V'.'U'.'YuVkFMV'.'U'.'V'.'f'.'SUQgPSBV'.'LklE'.'I'.'EFORCBVRi5WQUxVR'.'V9JTl'.'Qg'.'S'.'V'.'M'.'gT'.'k9UIE5VTEw'.'gQU5EIF'.'VGLlZBTFVFX0'.'lOVCA8P'.'iAwKQ==','Qw==','V'.'V'.'NFUg='.'=','TG9nb3V'.'0');return base64_decode($_1941062878[$_388100353]);}};if($GLOBALS['____1259042091'][0](round(0+0.25+0.25+0.25+0.25), round(0+4+4+4+4+4)) == round(0+1.75+1.75+1.75+1.75)){ if(isset($GLOBALS[___1219674830(0)]) && $GLOBALS['____1259042091'][1]($GLOBALS[___1219674830(1)]) && $GLOBALS['____1259042091'][2](array($GLOBALS[___1219674830(2)], ___1219674830(3))) &&!$GLOBALS['____1259042091'][3](array($GLOBALS[___1219674830(4)], ___1219674830(5)))){ $_948906295= $GLOBALS[___1219674830(6)]->Query(___1219674830(7), true); if(!($_359309596= $_948906295->Fetch())){ $_815949702= round(0+2.4+2.4+2.4+2.4+2.4);} $_930463952= $_359309596[___1219674830(8)]; list($_68737711, $_815949702)= $GLOBALS['____1259042091'][4](___1219674830(9), $_930463952); $_1381896183= $GLOBALS['____1259042091'][5](___1219674830(10), $_68737711); $_1940476187= ___1219674830(11).$GLOBALS['____1259042091'][6]($GLOBALS['____1259042091'][7](___1219674830(12))); $_979290798= $GLOBALS['____1259042091'][8](___1219674830(13), $_815949702, $_1940476187, true); if($GLOBALS['____1259042091'][9]($_979290798, $_1381896183) !==(968-2*484)){ $_815949702= round(0+2.4+2.4+2.4+2.4+2.4);} if($_815949702 != min(104,0,34.666666666667)){ if($GLOBALS['____1259042091'][10](___1219674830(14), ___1219674830(15))){ $_356529673= new \Bitrix\Main\License(); $_874991175= $_356529673->getActiveUsersCount();} else{ $_874991175=(780-2*390); $_948906295= $GLOBALS[___1219674830(16)]->Query(___1219674830(17), true); if($_359309596= $_948906295->Fetch()){ $_874991175= $GLOBALS['____1259042091'][11]($_359309596[___1219674830(18)]);}} if($_874991175> $_815949702){ $GLOBALS['____1259042091'][12](array($GLOBALS[___1219674830(19)], ___1219674830(20)));}}}}/**/
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