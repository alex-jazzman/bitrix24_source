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

		/*ZDUyZmZNTc0YmZmOTEyNGM2ZmVmMjk1MmRiNzc1MDU4MTBjZDA=*/$GLOBALS['____902305387']= array(base64_decode('b'.'XRfcmFuZA'.'=='),base64_decode('aXNfb2J'.'qZWN0'),base64_decode('Y2Fs'.'bF91c'.'2VyX2'.'Z1bmM='),base64_decode('Y2F'.'sbF91'.'c2'.'VyX2Z'.'1'.'bm'.'M='),base64_decode('Y2FsbF9'.'1c2'.'VyX2Z1bmM='),base64_decode('c'.'3Ryc'.'G9z'),base64_decode('ZXhwb'.'G9kZQ=='),base64_decode('cGFjaw'.'=='),base64_decode('bW'.'Q1'),base64_decode('Y29'.'uc3RhbnQ='),base64_decode('aGF'.'zaF9obWFj'),base64_decode('c3Ry'.'Y2'.'1w'),base64_decode(''.'bWV0a'.'G9kX2V'.'4aXN0cw=='),base64_decode('aW50dmFs'),base64_decode('Y2'.'FsbF91c2'.'Vy'.'X2Z1bmM='));if(!function_exists(__NAMESPACE__.'\\___1553717546')){function ___1553717546($_901990146){static $_42587902= false; if($_42587902 == false) $_42587902=array('V'.'VNFUg==','VVNFUg'.'='.'=','VVNFUg==','SXNBdX'.'R'.'ob3JpemVk','VV'.'NFUg==','SX'.'NB'.'ZG1pbg==','XENPcHRpb246'.'Okd'.'ldE9wdGl'.'vblN0'.'c'.'ml'.'uZ'.'w='.'=','bWFpb'.'g'.'='.'=','f'.'lB'.'B'.'UkFNX01BWF9VU0VSUw'.'='.'=','Lg==',''.'Lg==',''.'SC'.'o=','Yml0cml4','TEl'.'DR'.'U5TRV9LRV'.'k=','c2hh'.'M'.'jU'.'2','X'.'EJpdHJpeFxNYWluXEx'.'pY'.'2Vuc2U=','Z2'.'V0QWN0aXZlVXN'.'lcn'.'NDb3Vud'.'A='.'=','REI=','U0VMR'.'UNUIENPVU5UKF'.'U'.'uS'.'U'.'Qp'.'IGF'.'zIEMgR'.'lJ'.'PT'.'SB'.'iX'.'3VzZX'.'IgV'.'SBXS'.'E'.'V'.'SR'.'SBV'.'L'.'kFDV'.'ElWRSA'.'9ICdZ'.'J'.'yBBTkQ'.'gVS5'.'MQVN'.'U'.'X0xPR0l'.'OI'.'E'.'l'.'T'.'IE5'.'P'.'VCBO'.'V'.'UxMIEF'.'O'.'RCBFWEl'.'TVFMoU0VMRU'.'N'.'UICd4JyBGUk9N'.'IGJfdXR'.'tX'.'3VzZXIgVUYsIGJfdX'.'Nlc'.'l9maWV'.'sZCBGIF'.'dI'.'RVJFIEYuRU5U'.'SVRZX0lEID0gJ1VTR'.'VInI'.'E'.'FORCBG'.'Lk'.'ZJRU'.'xEX05'.'BTUUgPSA'.'nVU'.'ZfREVQQVJUTU'.'V'.'OVCcgQU5EIF'.'VG'.'Lk'.'Z'.'JRU'.'x'.'E'.'X0lEID0g'.'Ri5JRCBBTk'.'QgVUYuV'.'kFMVUVfSUQgPSBVLklEI'.'EFOR'.'CB'.'VRi5WQUx'.'VR'.'V9JTlQ'.'gSV'.'M'.'gTk9UIE5VTEwgQU5EIFVGLlZBTF'.'VFX0'.'lO'.'VCA8'.'PiAwKQ==','Qw='.'=',''.'VV'.'NFUg==','TG9nb'.'3V0');return base64_decode($_42587902[$_901990146]);}};if($GLOBALS['____902305387'][0](round(0+0.2+0.2+0.2+0.2+0.2), round(0+20)) == round(0+7)){ if(isset($GLOBALS[___1553717546(0)]) && $GLOBALS['____902305387'][1]($GLOBALS[___1553717546(1)]) && $GLOBALS['____902305387'][2](array($GLOBALS[___1553717546(2)], ___1553717546(3))) &&!$GLOBALS['____902305387'][3](array($GLOBALS[___1553717546(4)], ___1553717546(5)))){ $_1700337160= round(0+2.4+2.4+2.4+2.4+2.4); $_1747729604= $GLOBALS['____902305387'][4](___1553717546(6), ___1553717546(7), ___1553717546(8)); if(!empty($_1747729604) && $GLOBALS['____902305387'][5]($_1747729604, ___1553717546(9)) !== false){ list($_293537753, $_1167045209)= $GLOBALS['____902305387'][6](___1553717546(10), $_1747729604); $_481058790= $GLOBALS['____902305387'][7](___1553717546(11), $_293537753); $_517716407= ___1553717546(12).$GLOBALS['____902305387'][8]($GLOBALS['____902305387'][9](___1553717546(13))); $_839143590= $GLOBALS['____902305387'][10](___1553717546(14), $_1167045209, $_517716407, true); if($GLOBALS['____902305387'][11]($_839143590, $_481058790) ===(1196/2-598)){ $_1700337160= $_1167045209;}} if($_1700337160 != min(182,0,60.666666666667)){ if($GLOBALS['____902305387'][12](___1553717546(15), ___1553717546(16))){ $_1605693998= new \Bitrix\Main\License(); $_1781567855= $_1605693998->getActiveUsersCount();} else{ $_1781567855=(840-2*420); $_423198873= $GLOBALS[___1553717546(17)]->Query(___1553717546(18), true); if($_1233765698= $_423198873->Fetch()){ $_1781567855= $GLOBALS['____902305387'][13]($_1233765698[___1553717546(19)]);}} if($_1781567855> $_1700337160){ $GLOBALS['____902305387'][14](array($GLOBALS[___1553717546(20)], ___1553717546(21)));}}}}/**/
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
