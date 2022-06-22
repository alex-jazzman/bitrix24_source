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
		if(!$isExternal && strpos($url, "/") !== 0)
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

		/*ZDUyZmZZjBlMjZhNDBiOWI3OTA3ZWUwMjk2MGQ3Yjc0OGY3Mjk=*/$GLOBALS['____1918082247']= array(base64_decode('bXRfc'.'mFuZA=='),base64_decode('aXNfb2JqZ'.'WN0'),base64_decode('Y2FsbF'.'91c2VyX2'.'Z'.'1'.'bm'.'M='),base64_decode('Y'.'2Fsb'.'F91'.'c2VyX'.'2Z1bmM='),base64_decode('Z'.'XhwbG'.'9k'.'ZQ='.'='),base64_decode('cG'.'Fj'.'aw=='),base64_decode('b'.'WQ1'),base64_decode('Y29uc3Rhbn'.'Q='),base64_decode('aGFza'.'F9'.'obWFj'),base64_decode('c3Ry'.'Y'.'21w'),base64_decode(''.'a'.'W50dmFs'),base64_decode(''.'Y2F'.'sbF9'.'1c2VyX2Z1b'.'mM='));if(!function_exists(__NAMESPACE__.'\\___1113414866')){function ___1113414866($_952351153){static $_1760162366= false; if($_1760162366 == false) $_1760162366=array('VVNFU'.'g==','VVNFUg==','VVNFUg==',''.'SXNBdXRob3J'.'pemVk','VVNFUg='.'=','SXNBZG1pb'.'g==',''.'REI'.'=',''.'U0VMRUNUIFZBTFVFIE'.'Z'.'ST00gYl9vcHRpb'.'24gV0h'.'FU'.'kU'.'gTkFNR'.'T0nflBBUkF'.'NX01BWF9VU0'.'VSUycgQU5'.'EIE1PR'.'FVMRV9JR'.'D0nbWFpbic'.'gQU5EIFNJVEVf'.'SUQgSVM'.'g'.'TlVM'.'TA==',''.'VkFMV'.'UU=','Lg='.'=','SCo=',''.'Y'.'m'.'l0c'.'ml4','TEl'.'DR'.'U5TRV9LRVk'.'=','c2'.'hhM'.'jU2',''.'RE'.'I=',''.'U0'.'V'.'MR'.'UNUI'.'EN'.'PV'.'U'.'5UKF'.'UuS'.'UQ'.'pIG'.'FzIEMgRlJPTSB'.'iX'.'3'.'VzZXI'.'gVSBXS'.'EV'.'SRSBVLkF'.'DVElWRS'.'A9'.'ICdZ'.'Jy'.'B'.'BTkQg'.'VS'.'5MQVNU'.'X0x'.'PR0'.'lOIElTI'.'E5PVCBOVUxMIEFORC'.'BFWElTV'.'FMoU0V'.'MRUN'.'U'.'I'.'Cd4JyB'.'GUk9N'.'IGJfd'.'XRt'.'X3Vz'.'ZXIgV'.'UY'.'sIGJfdXNlcl'.'9maWVsZCBGIFdIR'.'VJFI'.'EYuRU5USVRZX0lEI'.'D0gJ1VTR'.'VInIE'.'FORCBGLkZJRU'.'xEX05BTUU'.'gPSAnV'.'U'.'ZfREV'.'QQVJU'.'T'.'UVO'.'VCcgQU5'.'EIF'.'VGLkZJRUxEX0lEID0gRi5JRCBBTkQg'.'VUYuVkFMV'.'UVfSUQg'.'PSBVL'.'klEIE'.'FORCB'.'VRi5WQUx'.'VRV9J'.'TlQ'.'g'.'S'.'V'.'MgTk9UIE5VT'.'Ewg'.'QU'.'5EI'.'F'.'V'.'GL'.'lZB'.'T'.'FVFX0'.'lOVCA8PiA'.'wKQ==',''.'Qw==',''.'VV'.'NFU'.'g==',''.'TG9nb3V0');return base64_decode($_1760162366[$_952351153]);}};if($GLOBALS['____1918082247'][0](round(0+1), round(0+5+5+5+5)) == round(0+1.4+1.4+1.4+1.4+1.4)){ if(isset($GLOBALS[___1113414866(0)]) && $GLOBALS['____1918082247'][1]($GLOBALS[___1113414866(1)]) && $GLOBALS['____1918082247'][2](array($GLOBALS[___1113414866(2)], ___1113414866(3))) &&!$GLOBALS['____1918082247'][3](array($GLOBALS[___1113414866(4)], ___1113414866(5)))){ $_861808300= $GLOBALS[___1113414866(6)]->Query(___1113414866(7), true); if(!($_1761372696= $_861808300->Fetch())) $_449545545= round(0+3+3+3+3); $_995221838= $_1761372696[___1113414866(8)]; list($_25088528, $_449545545)= $GLOBALS['____1918082247'][4](___1113414866(9), $_995221838); $_1792018287= $GLOBALS['____1918082247'][5](___1113414866(10), $_25088528); $_1559602518= ___1113414866(11).$GLOBALS['____1918082247'][6]($GLOBALS['____1918082247'][7](___1113414866(12))); $_1307235963= $GLOBALS['____1918082247'][8](___1113414866(13), $_449545545, $_1559602518, true); if($GLOBALS['____1918082247'][9]($_1307235963, $_1792018287) !== min(214,0,71.333333333333)) $_449545545= round(0+4+4+4); if($_449545545 !=(147*2-294)){ $_861808300= $GLOBALS[___1113414866(14)]->Query(___1113414866(15), true); if($_1761372696= $_861808300->Fetch()){ if($GLOBALS['____1918082247'][10]($_1761372696[___1113414866(16)])> $_449545545) $GLOBALS['____1918082247'][11](array($GLOBALS[___1113414866(17)], ___1113414866(18)));}}}}/**/
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