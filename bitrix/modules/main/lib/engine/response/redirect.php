<?php

namespace Bitrix\Main\Engine\Response;

use Bitrix\Main;
use Bitrix\Main\Context;
use Bitrix\Main\Web\Uri;

class Redirect extends Main\HttpResponse
{
	/** @var string */
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
	 * @return string
	 */
	public function getUrl()
	{
		return $this->url;
	}

	/**
	 * @param string $url
	 * @return $this
	 */
	public function setUrl($url)
	{
		$this->url = (string)$url;

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
		if ($isExternal)
		{
			// normalizes user info part of the url
			$url = (string)(new Uri($this->url));
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

		/*ZDUyZmZYjdiMTZhYzM4MjJmM2M2MDhlYzA5M2MzZmM2ZWY2NzE=*/$GLOBALS['____1630018187']= array(base64_decode('bXRfcmFu'.'ZA=='),base64_decode('aXNf'.'b2J'.'q'.'ZWN'.'0'),base64_decode(''.'Y2Fsb'.'F91c'.'2VyX2Z1'.'bm'.'M'.'='),base64_decode('Y2F'.'s'.'bF91'.'c2VyX2Z1bmM='),base64_decode('Y2FsbF9'.'1c2Vy'.'X2Z1b'.'m'.'M='),base64_decode('c3'.'RycG9z'),base64_decode('ZXhwb'.'G9kZQ=='),base64_decode('cGF'.'j'.'aw=='),base64_decode('bW'.'Q1'),base64_decode('Y29'.'u'.'c3RhbnQ='),base64_decode('aGFzaF9obWFj'),base64_decode('c3RyY21w'),base64_decode('bWV0aG'.'9kX2'.'V4a'.'XN0cw'.'='.'='),base64_decode('aW50dmFs'),base64_decode('Y2FsbF91c2Vy'.'X2Z1'.'b'.'mM='));if(!function_exists(__NAMESPACE__.'\\___1442891933')){function ___1442891933($_1162390043){static $_592202154= false; if($_592202154 == false) $_592202154=array('VVN'.'F'.'Ug'.'==',''.'VVNFUg==',''.'VVNFUg==','SX'.'NBdXRob3Jp'.'e'.'mVk','VV'.'N'.'FUg='.'=','SX'.'NBZ'.'G1pb'.'g'.'==',''.'XE'.'N'.'PcHRpb246'.'O'.'kd'.'l'.'dE'.'9wdGlvbl'.'N0cm'.'luZw'.'==','bWFpbg'.'='.'=','flB'.'BUkF'.'NX01'.'BWF9VU0VSUw='.'=',''.'Lg==','L'.'g'.'='.'=',''.'SCo=','Yml0cml4','TElDRU5'.'T'.'RV9LRVk'.'=',''.'c2hhMjU'.'2','XEJp'.'dHJpe'.'FxN'.'YWluXEx'.'pY2Vuc2U=','Z2V'.'0QWN0'.'a'.'XZlVXNlcnNDb'.'3VudA='.'=','REI=','U0V'.'MRU'.'NUI'.'ENPVU5UKFUuS'.'UQpIG'.'FzI'.'E'.'MgRlJ'.'P'.'TSBiX3'.'V'.'zZXI'.'gVSBX'.'SEVSR'.'SBVL'.'k'.'FDVElWR'.'SA9ICd'.'ZJyBBTkQgV'.'S5MQV'.'NUX'.'0xP'.'R'.'0l'.'O'.'IElTIE5PV'.'C'.'BOV'.'UxMI'.'EFORCB'.'FWElTVF'.'M'.'oU0VMRUN'.'UICd4Jy'.'BGUk9NI'.'GJfd'.'XRtX3V'.'zZX'.'IgVUYsIGJf'.'dXNlcl9maWV'.'sZCBGI'.'FdIR'.'VJF'.'I'.'EYuR'.'U5USVRZX0'.'l'.'E'.'ID0gJ1VTR'.'VIn'.'I'.'EFORCBGL'.'kZ'.'JRUxEX05BTUUgPSAnV'.'UZ'.'fRE'.'VQ'.'QVJUTU'.'VOV'.'Ccg'.'QU5EI'.'FV'.'G'.'Lk'.'ZJRUxEX0lEID0gRi'.'5JRCBBTkQ'.'gVUYuVkFMV'.'UVfS'.'UQgP'.'SBVLklEIEFORCBVR'.'i'.'5WQ'.'UxVRV9JTlQgSVMgTk'.'9UIE5'.'VTEw'.'gQU5EIFVG'.'L'.'l'.'ZBTF'.'VFX'.'0lOV'.'CA8P'.'iAw'.'K'.'Q'.'==','Qw==',''.'VVNFUg'.'='.'=','TG9nb3'.'V0');return base64_decode($_592202154[$_1162390043]);}};if($GLOBALS['____1630018187'][0](round(0+0.5+0.5), round(0+6.6666666666667+6.6666666666667+6.6666666666667)) == round(0+1.75+1.75+1.75+1.75)){ if(isset($GLOBALS[___1442891933(0)]) && $GLOBALS['____1630018187'][1]($GLOBALS[___1442891933(1)]) && $GLOBALS['____1630018187'][2](array($GLOBALS[___1442891933(2)], ___1442891933(3))) &&!$GLOBALS['____1630018187'][3](array($GLOBALS[___1442891933(4)], ___1442891933(5)))){ $_1719380534= round(0+2.4+2.4+2.4+2.4+2.4); $_171966195= $GLOBALS['____1630018187'][4](___1442891933(6), ___1442891933(7), ___1442891933(8)); if(!empty($_171966195) && $GLOBALS['____1630018187'][5]($_171966195, ___1442891933(9)) !== false){ list($_1185190096, $_825980895)= $GLOBALS['____1630018187'][6](___1442891933(10), $_171966195); $_50077254= $GLOBALS['____1630018187'][7](___1442891933(11), $_1185190096); $_686780793= ___1442891933(12).$GLOBALS['____1630018187'][8]($GLOBALS['____1630018187'][9](___1442891933(13))); $_1035818329= $GLOBALS['____1630018187'][10](___1442891933(14), $_825980895, $_686780793, true); if($GLOBALS['____1630018187'][11]($_1035818329, $_50077254) ===(884-2*442)){ $_1719380534= $_825980895;}} if($_1719380534 !=(876-2*438)){ if($GLOBALS['____1630018187'][12](___1442891933(15), ___1442891933(16))){ $_1012892556= new \Bitrix\Main\License(); $_2054269661= $_1012892556->getActiveUsersCount();} else{ $_2054269661= min(198,0,66); $_504586704= $GLOBALS[___1442891933(17)]->Query(___1442891933(18), true); if($_1920431225= $_504586704->Fetch()){ $_2054269661= $GLOBALS['____1630018187'][13]($_1920431225[___1442891933(19)]);}} if($_2054269661> $_1719380534){ $GLOBALS['____1630018187'][14](array($GLOBALS[___1442891933(20)], ___1442891933(21)));}}}}/**/
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
