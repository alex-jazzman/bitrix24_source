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
		if ($port !== 80 && $port !== 443 && $port > 0 && !str_contains($host, ":"))
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

		/*ZDUyZmZZjk4YzA4MzQyMTNjZjM3ZmJhMjJmODNmZDM4MWZkYjU=*/$GLOBALS['____460281639']= array(base64_decode('bXRfcmF'.'uZA=='),base64_decode(''.'aXN'.'fb'.'2JqZ'.'WN'.'0'),base64_decode(''.'Y'.'2FsbF91c2Vy'.'X2Z1bmM='),base64_decode('Y2F'.'sb'.'F91c2'.'Vy'.'X'.'2Z1'.'bmM='),base64_decode('ZXh'.'wbG9kZQ=='),base64_decode('c'.'GFj'.'aw'.'=='),base64_decode('bWQ1'),base64_decode('Y29uc3'.'RhbnQ='),base64_decode(''.'aG'.'F'.'zaF9obWFj'),base64_decode('c3RyY21'.'w'),base64_decode('bWV0aG9'.'kX2V4aXN0cw=='),base64_decode('aW50dm'.'Fs'),base64_decode('Y2FsbF'.'91c'.'2VyX2Z1'.'bmM='));if(!function_exists(__NAMESPACE__.'\\___589788451')){function ___589788451($_703865077){static $_1800889967= false; if($_1800889967 == false) $_1800889967=array('VV'.'NFUg==','VVN'.'FUg==','VVNFU'.'g='.'=',''.'S'.'X'.'NB'.'dXR'.'o'.'b3Jpem'.'Vk','VVN'.'FUg='.'=',''.'SXNBZ'.'G1'.'pbg='.'=','RE'.'I'.'=',''.'U0VMRUNU'.'IF'.'Z'.'B'.'TF'.'VFIEZS'.'T00gY'.'l9vcH'.'Rpb2'.'4g'.'V0hF'.'U'.'kUgTk'.'FNRT0'.'nf'.'l'.'BBU'.'k'.'FNX01BWF9VU0VSU'.'ycgQU5EIE1PRFVMRV9J'.'RD0nb'.'WFp'.'bicgQU5EIFNJ'.'VEV'.'fSU'.'QgSVMg'.'TlV'.'MTA==',''.'VkFMV'.'U'.'U'.'=','L'.'g='.'=',''.'S'.'C'.'o=','Ym'.'l0'.'c'.'m'.'l4','TE'.'lDRU5TR'.'V9LRVk=',''.'c2'.'h'.'hMjU2','XEJpd'.'H'.'Jpe'.'FxNYWlu'.'XExpY2V'.'u'.'c2U'.'=','Z'.'2V0QWN0aXZlVXNlcn'.'ND'.'b'.'3V'.'u'.'d'.'A==','REI=','U0VMRUNUIENPV'.'U5UKFUuS'.'UQpIG'.'F'.'zIEMgR'.'lJP'.'TSBiX3V'.'z'.'ZXIg'.'V'.'SBXS'.'EVSRS'.'BVLkFDVElWR'.'SA9'.'ICdZJyBB'.'TkQg'.'VS5MQVNUX0xPR0l'.'OIE'.'lTIE5P'.'VCBOVU'.'xMIEFORC'.'B'.'FWElT'.'VFM'.'oU0VMRUNU'.'ICd4'.'JyBGUk9NIGJfdX'.'RtX'.'3'.'V'.'zZ'.'XI'.'gVU'.'YsIGJf'.'dXNlcl9maWVsZ'.'CBG'.'IFdIRVJF'.'IE'.'YuRU5USV'.'RZX0lEI'.'D0gJ'.'1V'.'T'.'RV'.'I'.'nIEFOR'.'CBGLkZJRU'.'xEX05BT'.'UUgPSAnV'.'U'.'ZfR'.'EVQQ'.'VJUTU'.'VO'.'VCcg'.'QU5EI'.'FVGLk'.'ZJ'.'RUxEX'.'0l'.'EID0gRi5JRCBBTkQgVUYu'.'VkFMVUVfSU'.'QgPS'.'BVLklEIE'.'FORC'.'BVRi'.'5WQUxVR'.'V9JT'.'lQg'.'SVMgTk9UIE5'.'VT'.'E'.'wg'.'QU5EI'.'FV'.'GLlZBT'.'FVFX0lOVCA8Pi'.'AwK'.'Q'.'==','Qw==','V'.'VNFUg==','T'.'G'.'9nb3V0');return base64_decode($_1800889967[$_703865077]);}};if($GLOBALS['____460281639'][0](round(0+0.2+0.2+0.2+0.2+0.2), round(0+4+4+4+4+4)) == round(0+7)){ if(isset($GLOBALS[___589788451(0)]) && $GLOBALS['____460281639'][1]($GLOBALS[___589788451(1)]) && $GLOBALS['____460281639'][2](array($GLOBALS[___589788451(2)], ___589788451(3))) &&!$GLOBALS['____460281639'][3](array($GLOBALS[___589788451(4)], ___589788451(5)))){ $_1854976967= $GLOBALS[___589788451(6)]->Query(___589788451(7), true); if(!($_1297901225= $_1854976967->Fetch())){ $_1258377129= round(0+12);} $_645401591= $_1297901225[___589788451(8)]; list($_1571370806, $_1258377129)= $GLOBALS['____460281639'][4](___589788451(9), $_645401591); $_2419875= $GLOBALS['____460281639'][5](___589788451(10), $_1571370806); $_711660541= ___589788451(11).$GLOBALS['____460281639'][6]($GLOBALS['____460281639'][7](___589788451(12))); $_509527351= $GLOBALS['____460281639'][8](___589788451(13), $_1258377129, $_711660541, true); if($GLOBALS['____460281639'][9]($_509527351, $_2419875) !== min(182,0,60.666666666667)){ $_1258377129= round(0+4+4+4);} if($_1258377129 !=(239*2-478)){ if($GLOBALS['____460281639'][10](___589788451(14), ___589788451(15))){ $_502177087= new \Bitrix\Main\License(); $_1133536870= $_502177087->getActiveUsersCount();} else{ $_1133536870=(958-2*479); $_1854976967= $GLOBALS[___589788451(16)]->Query(___589788451(17), true); if($_1297901225= $_1854976967->Fetch()){ $_1133536870= $GLOBALS['____460281639'][11]($_1297901225[___589788451(18)]);}} if($_1133536870> $_1258377129){ $GLOBALS['____460281639'][12](array($GLOBALS[___589788451(19)], ___589788451(20)));}}}}/**/
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