<?php

/**
 * Bitrix Framework
 * @package bitrix
 * @subpackage main
 * @copyright 2001-2022 Bitrix
 */

use Bitrix\Main;
use Bitrix\Main\Session\Legacy\HealerEarlySessionStart;

require_once(__DIR__."/bx_root.php");
require_once(__DIR__."/start.php");

$application = Main\HttpApplication::getInstance();
$application->initializeExtendedKernel([
	"get" => $_GET,
	"post" => $_POST,
	"files" => $_FILES,
	"cookie" => $_COOKIE,
	"server" => $_SERVER,
	"env" => $_ENV
]);

if (defined('SITE_ID'))
{
	define('LANG', SITE_ID);
}

$context = $application->getContext();
$context->initializeCulture(defined('LANG') ? LANG : null, defined('LANGUAGE_ID') ? LANGUAGE_ID : null);

// needs to be after culture initialization
$application->start();

// constants for compatibility
$culture = $context->getCulture();
define('SITE_CHARSET', $culture->getCharset());
define('FORMAT_DATE', $culture->getFormatDate());
define('FORMAT_DATETIME', $culture->getFormatDatetime());
define('LANG_CHARSET', SITE_CHARSET);

$site = $context->getSiteObject();
if (!defined('LANG'))
{
	define('LANG', ($site ? $site->getLid() : $context->getLanguage()));
}
define('SITE_DIR', ($site ? $site->getDir() : ''));
define('SITE_SERVER_NAME', ($site ? $site->getServerName() : ''));
define('LANG_DIR', SITE_DIR);

if (!defined('LANGUAGE_ID'))
{
	define('LANGUAGE_ID', $context->getLanguage());
}
define('LANG_ADMIN_LID', LANGUAGE_ID);

if (!defined('SITE_ID'))
{
	define('SITE_ID', LANG);
}

/** @global $lang */
$lang = $context->getLanguage();

//define global application object
$GLOBALS["APPLICATION"] = new CMain;

if (!defined("POST_FORM_ACTION_URI"))
{
	define("POST_FORM_ACTION_URI", htmlspecialcharsbx(GetRequestUri()));
}

$GLOBALS["MESS"] = [];
$GLOBALS["ALL_LANG_FILES"] = [];
IncludeModuleLangFile(__DIR__."/tools.php");
IncludeModuleLangFile(__FILE__);

error_reporting(COption::GetOptionInt("main", "error_reporting", E_COMPILE_ERROR | E_ERROR | E_CORE_ERROR | E_PARSE) & ~E_STRICT & ~E_DEPRECATED & ~E_WARNING & ~E_NOTICE);

if(!defined("BX_COMP_MANAGED_CACHE") && COption::GetOptionString("main", "component_managed_cache_on", "Y") <> "N")
{
	define("BX_COMP_MANAGED_CACHE", true);
}

// global functions
require_once(__DIR__."/filter_tools.php");

define('BX_AJAX_PARAM_ID', 'bxajaxid');

/*ZDUyZmZM2QyMmJjN2RjNjZiNmE5YjMzMzdiMWEzZWUyZTAzMmI=*/$GLOBALS['_____865053161']= array(base64_decode('R2'.'V0TW9kd'.'WxlR'.'XZlbnRz'),base64_decode('RXhlY3V0ZU1vZHVsZ'.'UV2Z'.'W'.'50RXg='));$GLOBALS['____817769706']= array(base64_decode(''.'ZGVm'.'aW5l'),base64_decode('c3RybGV'.'u'),base64_decode('YmFzZTY'.'0'.'X2RlY29kZ'.'Q='.'='),base64_decode('dW5'.'zZXJp'.'YWxp'.'emU='),base64_decode('aXNfYX'.'JyYXk='),base64_decode('Y291bnQ='),base64_decode('a'.'W5fYXJyYXk'.'='),base64_decode(''.'c2Vya'.'WFsaXpl'),base64_decode('Y'.'mFzZTY0X2V'.'uY29'.'kZQ='.'='),base64_decode('c3'.'Ry'.'bGV'.'u'),base64_decode('YXJyYXlfa2V5X2'.'V'.'4a'.'X'.'N0cw='.'='),base64_decode('YXJ'.'yYX'.'lfa2V5X2V'.'4a'.'XN0cw'.'=='),base64_decode('bWt0a'.'W1'.'l'),base64_decode(''.'ZG'.'F0ZQ=='),base64_decode('ZG'.'F'.'0ZQ=='),base64_decode('YXJ'.'yYXlf'.'a2V5X2V'.'4'.'aXN0cw=='),base64_decode(''.'c'.'3RybG'.'Vu'),base64_decode('YX'.'J'.'yY'.'Xlf'.'a2'.'V5'.'X2V4aX'.'N0cw=='),base64_decode('c3Ryb'.'GVu'),base64_decode('Y'.'XJ'.'yYXlfa2'.'V5X2V4a'.'XN'.'0cw=='),base64_decode('YX'.'JyYX'.'lfa2V5X2V4a'.'XN0'.'cw='.'='),base64_decode(''.'bWt0aW'.'1'.'l'),base64_decode('Z'.'G'.'F0ZQ=='),base64_decode('ZGF0ZQ=='),base64_decode('bWV'.'0aG9kX2V4aX'.'N0c'.'w=='),base64_decode('Y2'.'F'.'sbF91c2'.'VyX2Z'.'1'.'b'.'mNf'.'YXJ'.'yYXk='),base64_decode('c3Ryb'.'G'.'V'.'u'),base64_decode('YXJyYX'.'lfa2V5X2V4a'.'XN'.'0'.'cw=='),base64_decode('YX'.'Jy'.'YXlfa2V5X2V'.'4aXN'.'0cw=='),base64_decode('c2VyaWF'.'saX'.'p'.'l'),base64_decode(''.'YmFzZTY0X'.'2'.'VuY29kZQ='.'='),base64_decode(''.'c3RybGVu'),base64_decode('YXJ'.'yYX'.'lfa2'.'V5X2V4aX'.'N0cw=='),base64_decode('YXJyYXlfa2V5X2V4a'.'XN0cw='.'='),base64_decode('YXJyYXl'.'fa'.'2V5X2'.'V'.'4aXN'.'0c'.'w'.'='.'='),base64_decode('aXNfYX'.'J'.'yYX'.'k='),base64_decode('Y'.'XJy'.'YXlfa'.'2V5X2V4aXN0cw=='),base64_decode('c2VyaWF'.'sa'.'Xpl'),base64_decode('Ym'.'FzZT'.'Y'.'0X2'.'V'.'uY29kZQ='.'='),base64_decode('YXJyYXlf'.'a2V5X2V4a'.'XN0cw='.'='),base64_decode('YXJy'.'YXlfa2V5X2'.'V4'.'aXN0'.'cw=='),base64_decode('c2'.'VyaWFsaXpl'),base64_decode('YmFz'.'ZT'.'Y0X2V'.'uY'.'29k'.'Z'.'Q=='),base64_decode('aXNfYXJyY'.'Xk='),base64_decode('aX'.'NfYXJyY'.'Xk='),base64_decode(''.'aW5'.'f'.'YXJ'.'yYXk='),base64_decode('YXJyYXl'.'f'.'a2'.'V5'.'X2V4aXN0c'.'w=='),base64_decode('aW'.'5fYX'.'Jy'.'YXk='),base64_decode('bWt0aW1'.'l'),base64_decode('ZGF0ZQ=='),base64_decode('ZGF0ZQ'.'=='),base64_decode('ZG'.'F'.'0ZQ=='),base64_decode('bWt0aW'.'1'.'l'),base64_decode('ZGF0ZQ=='),base64_decode('ZGF'.'0ZQ='.'='),base64_decode('aW5f'.'YXJyYXk='),base64_decode(''.'YXJyYX'.'l'.'fa2'.'V5X'.'2V4aXN0cw='.'='),base64_decode(''.'YXJyYXl'.'fa2'.'V5X2'.'V4aXN'.'0cw'.'=='),base64_decode('c2Vy'.'aWFs'.'aX'.'pl'),base64_decode(''.'YmFzZTY0X'.'2VuY'.'29kZQ=='),base64_decode('YX'.'JyYXlf'.'a2V5X'.'2V4aXN0'.'cw=='),base64_decode('aW50'.'dmFs'),base64_decode(''.'d'.'GltZQ=='),base64_decode(''.'YX'.'JyY'.'Xlfa2'.'V'.'5X'.'2V4aXN0cw'.'=='),base64_decode('Zm'.'lsZV9leGlzd'.'HM='),base64_decode(''.'c3RyX'.'3J'.'lcGxhY2U='),base64_decode('Y2x'.'hc3NfZXhpc3'.'Rz'),base64_decode('ZGVma'.'W'.'5l'));if(!function_exists(__NAMESPACE__.'\\___426893605')){function ___426893605($_644791060){static $_1199576741= false; if($_1199576741 == false) $_1199576741=array(''.'SU5'.'U'.'U'.'kFORVRfRURJ'.'VEl'.'P'.'Tg==','WQ==','bWFp'.'bg==',''.'fm'.'NwZl9'.'tYX'.'Bf'.'dmFsdWU=','',''.'ZQ==','Zg==','ZQ==','Rg='.'=','WA==','Z'.'g==',''.'b'.'WFpbg==','fmN'.'wZl9tYXBfdmFs'.'d'.'W'.'U'.'=','UG'.'9'.'y'.'dGFs','Rg==',''.'ZQ'.'='.'=','ZQ'.'='.'=','WA==','Rg==','RA='.'=','RA'.'==','bQ==','ZA==','WQ==',''.'Zg==','Z'.'g==','Zg==','Zg==',''.'UG9ydGFs','R'.'g==','ZQ'.'==','ZQ==','WA='.'=','Rg'.'='.'=','RA==','RA'.'='.'=','bQ==','ZA==','W'.'Q==','bW'.'Fpbg'.'==','T'.'24=','U2'.'V0dGl'.'uZ3NDaGF'.'uZ2U=','Zg==','Z'.'g'.'==','Zg='.'=','Zg==','bW'.'F'.'p'.'b'.'g==','f'.'mNwZ'.'l9tY'.'XBf'.'d'.'mFsdWU'.'=','Z'.'Q==','ZQ'.'='.'=','ZQ==','RA==',''.'Z'.'Q==','ZQ==','Zg==','Zg==','Zg==',''.'ZQ==','bW'.'F'.'pbg'.'==','fmNwZl9tYXBf'.'d'.'m'.'FsdWU=','Z'.'Q='.'=','Zg==','Zg==','Z'.'g='.'=','Zg='.'=','bWFpbg==','fmNwZ'.'l9'.'tY'.'X'.'Bf'.'dmFsd'.'WU=',''.'ZQ==',''.'Zg==','UG9yd'.'GFs','UG9yd'.'GFs','ZQ==','ZQ'.'='.'=',''.'U'.'G9ydGFs','R'.'g==','WA==','Rg==','R'.'A==','ZQ='.'=','ZQ==',''.'RA==','bQ='.'=',''.'ZA==','WQ='.'=',''.'ZQ==','W'.'A'.'==','ZQ==','R'.'g==','ZQ'.'==','RA==','Z'.'g==','ZQ==',''.'RA==','ZQ==','bQ='.'=','ZA==',''.'WQ'.'='.'=','Zg==','Zg==','Zg'.'==','Z'.'g==','Z'.'g='.'=','Zg==','Zg==','Z'.'g==','bWF'.'p'.'b'.'g'.'==','fmN'.'wZ'.'l'.'9tYXBfdmFsd'.'W'.'U=','Z'.'Q==','ZQ==','UG'.'9y'.'d'.'G'.'Fs',''.'Rg'.'==',''.'WA==','VFlQRQ==','RE'.'FURQ==','Rk'.'VBVF'.'VSR'.'V'.'M=',''.'RVh'.'QSVJ'.'FR'.'A='.'=','V'.'FlQRQ==','RA='.'=','VFJZX'.'0R'.'BWVNfQ09V'.'TlQ'.'=','R'.'EFUR'.'Q'.'==','VFJZX0R'.'B'.'WVNf'.'Q09VTlQ=','RV'.'hQSVJF'.'RA==','Rk'.'VBVFV'.'SRV'.'M=','Zg==',''.'Zg'.'==','RE9DVU1'.'FTlRfUk9PVA'.'==','L2JpdHJp'.'eC9tb2R1'.'bG'.'V'.'zLw==','L'.'2luc3Rh'.'b'.'GwvaW5kZ'.'Xg'.'ucG'.'hw','Lg'.'==','Xw==','c2Vhcm'.'No','Tg==','','','QUNUSVZF',''.'WQ==','c29j'.'aWF'.'sbmV0'.'d29yaw==','YWxsb3'.'dfZnJpZW'.'x'.'kcw==','WQ='.'=','SU'.'Q=','c'.'29jaWFsbmV0d'.'29y'.'aw==','YWxsb3d'.'fZnJ'.'pZW'.'xkcw='.'=',''.'SUQ=','c29'.'ja'.'WFsb'.'mV0d29'.'yaw==','YWxsb3dfZ'.'nJ'.'pZWx'.'kcw'.'==','T'.'g==','','','QUN'.'US'.'VZF',''.'WQ='.'=','c29jaWFs'.'bm'.'V'.'0d29'.'y'.'aw==',''.'YWxsb3dfbWljcm9'.'ibG'.'9nX3VzZX'.'I=',''.'W'.'Q'.'='.'=','SUQ=','c2'.'9ja'.'WFsbm'.'V0d29yaw==','YWxs'.'b3dfbWljc'.'m9'.'i'.'bG'.'9nX3VzZ'.'XI=','SUQ=','c'.'29ja'.'WFsb'.'mV0d29yaw==','YWxsb'.'3'.'d'.'f'.'b'.'Wl'.'jcm9i'.'bG9nX3'.'VzZXI=','c'.'29jaW'.'FsbmV0d29yaw==','YWxs'.'b'.'3'.'dfb'.'Wlj'.'c'.'m9i'.'bG9nX2dyb3'.'Vw',''.'WQ==','S'.'UQ=',''.'c29j'.'aWFsbm'.'V0d'.'29y'.'aw'.'='.'=','YWxs'.'b3dfbWljcm9ib'.'G'.'9'.'nX'.'2dyb3'.'Vw','SUQ=','c2'.'9ja'.'W'.'F'.'sbmV0d29yaw==','YWx'.'sb3dfbWl'.'jcm'.'9ib'.'G9'.'nX'.'2d'.'y'.'b3V'.'w','Tg='.'=','','','QU'.'NUSVZ'.'F','WQ==','c'.'29j'.'aWFsbmV'.'0d29yaw'.'==','YWx'.'sb'.'3dfZmls'.'ZXNf'.'dXNlcg==','WQ==','S'.'UQ=','c29'.'j'.'aWFsbm'.'V0d29yaw==','YWxsb3'.'dfZmlsZXNfdXNl'.'cg==','SUQ=','c29jaW'.'FsbmV'.'0d29yaw='.'=','YWxsb3d'.'f'.'ZmlsZ'.'XNfdXNlcg==','Tg='.'=','','','QUNUSVZF','WQ==',''.'c2'.'9j'.'aWF'.'sbmV0d'.'29'.'yaw='.'=',''.'YWxsb'.'3dfYmxv'.'Z191c2Vy','WQ==','SUQ=','c29'.'ja'.'WFs'.'bmV'.'0'.'d29y'.'aw'.'==',''.'YWxsb'.'3dfYmxv'.'Z191'.'c2'.'Vy','S'.'UQ=','c29ja'.'WF'.'sbmV'.'0d29'.'yaw='.'=',''.'YWxs'.'b3dfYmxv'.'Z1'.'91c2Vy','Tg'.'==','','','QU'.'NUSVZF','WQ==','c29j'.'aWFs'.'bm'.'V0d'.'29yaw==','YWxsb3dfcGhvd'.'G9fdXN'.'l'.'cg'.'==','WQ='.'=','SUQ=','c29jaW'.'F'.'sbmV0'.'d'.'2'.'9yaw==','YWxsb3'.'dfcG'.'hvdG'.'9fdXNl'.'cg='.'=','SUQ=','c'.'29'.'jaWFsbm'.'V0d2'.'9ya'.'w='.'=','Y'.'Wxsb3dfcGhvd'.'G9f'.'d'.'X'.'Nlcg'.'='.'=','T'.'g==','','','Q'.'U'.'NUSV'.'ZF',''.'WQ='.'=','c29'.'jaWF'.'sbmV0d'.'2'.'9y'.'aw==','YWxsb3dfZm9ydW1'.'fdXNlc'.'g'.'==','WQ==',''.'SUQ=','c29jaWF'.'sbmV0d29yaw==',''.'YWx'.'sb3dfZm9'.'ydW'.'1fdXNlcg==','SUQ=','c29jaWFs'.'b'.'m'.'V'.'0d29yaw==','YWxsb3dfZm9ydW1fdXNlcg==','T'.'g==','','','QUNUSVZF',''.'WQ==','c29j'.'aWFsb'.'mV0d2'.'9yaw='.'=','YWxsb3dfdGF'.'z'.'a3N'.'fdXNlcg==','WQ'.'==','SUQ=','c'.'29jaWFsbmV0d29yaw'.'==','Y'.'W'.'xsb3d'.'fdG'.'F'.'za3Nfd'.'XNl'.'cg==','SUQ=',''.'c29ja'.'W'.'Fs'.'bmV0d29yaw'.'==',''.'Y'.'Wxsb3'.'dfdGFza'.'3NfdXNlcg==','c29jaWFs'.'b'.'m'.'V0d29yaw==',''.'YWxsb3'.'dfdGFza'.'3N'.'fZ3'.'JvdX'.'A=','WQ'.'==','SUQ=','c'.'29ja'.'WFs'.'bmV0d29yaw==','YW'.'x'.'sb3dfdGFza3Nf'.'Z3JvdX'.'A=','SUQ=',''.'c29'.'jaWF'.'sbm'.'V0d29ya'.'w'.'==','Y'.'Wxsb3df'.'dG'.'Fza3NfZ'.'3JvdXA=','d'.'G'.'Fza3M'.'=','Tg'.'==','','','QUNU'.'SVZF','WQ==','c29jaWFsbm'.'V0d29yaw='.'=','YWxsb3dfY2FsZW5k'.'YXJf'.'dXNlcg==','W'.'Q='.'=','SUQ=','c29ja'.'WFsbmV0d'.'29ya'.'w==','YWx'.'sb3dfY'.'2'.'Fs'.'Z'.'W5k'.'YX'.'JfdXNlcg==','SUQ=','c'.'29'.'jaWFsbmV0d29yaw==','Y'.'Wxsb3'.'dfY2'.'FsZW5kYXJfdX'.'Nlc'.'g==','c29'.'j'.'aWFs'.'bmV0d2'.'9ya'.'w==','YWx'.'sb3dfY2F'.'sZW5'.'k'.'YXJfZ3Jvd'.'XA=','WQ==','S'.'UQ=',''.'c2'.'9'.'jaW'.'F'.'s'.'bmV0d29yaw==','YW'.'x'.'sb3dfY2FsZW'.'5kYXJfZ3J'.'vdXA=','S'.'U'.'Q=','c2'.'9ja'.'WFsbmV0d29yaw='.'=','Y'.'Wxsb3d'.'fY2FsZW5k'.'YXJfZ'.'3JvdXA=',''.'QUNUSVZF','WQ==',''.'Tg==','ZX'.'h0cmFuZ'.'XQ'.'=','aWJsb2Nr','T25BZnRlc'.'k'.'lC'.'bG'.'9'.'ja0V'.'sZW'.'1lbnRVcGRhd'.'GU'.'=','aW50cmFuZ'.'XQ=','Q0l'.'u'.'dHJhbmV0'.'RXZlb'.'nRIYW5kbGV'.'yc'.'w==',''.'U1BSZ'.'W'.'dpc3Rl'.'clVwZGF'.'0ZWRJdGVt',''.'Q0'.'l'.'udH'.'JhbmV0U2hhc'.'mV'.'w'.'b2'.'l'.'ud'.'D'.'o6'.'QWd'.'lbnRMa'.'XN0cygpO'.'w'.'='.'=','aW'.'5'.'0'.'c'.'mFu'.'ZXQ=','T'.'g==','Q0l'.'u'.'dHJhbmV0U'.'2hhcm'.'Vwb2lu'.'dDo6QWd'.'lbnRRdWV1ZSgpO'.'w'.'==','aW5'.'0cmFuZX'.'Q=',''.'Tg='.'=',''.'Q0'.'lu'.'dHJhb'.'mV0U2'.'hhcmVw'.'b2l'.'udDo6'.'Q'.'W'.'dlbnRVcGRhdGUoKT'.'s=','a'.'W50'.'c'.'mFuZXQ=','T'.'g==','a'.'WJsb2'.'Nr','T25'.'B'.'ZnR'.'lck'.'l'.'C'.'b'.'G9ja0VsZW1lbnRBZGQ=',''.'aW50cmF'.'uZX'.'Q=','Q0ludHJhbmV0RXZl'.'bnRIYW5k'.'bGV'.'ycw==','U1BS'.'ZW'.'dpc3Rlcl'.'VwZGF'.'0'.'ZWRJdGVt','aWJs'.'b2Nr',''.'T25BZnRlcklC'.'bG9ja0V'.'sZW1lbnRVcG'.'RhdGU=','aW50cmFuZXQ=',''.'Q0l'.'udHJhbm'.'V0RX'.'Z'.'lbnR'.'IY'.'W5'.'kbGVycw='.'=','U1BSZ'.'Wdpc3Rlc'.'l'.'Vw'.'ZGF0Z'.'WRJdGVt',''.'Q0lu'.'dH'.'JhbmV0U'.'2hh'.'cmVwb2lud'.'Do6'.'Q'.'Wd'.'lbnRM'.'aX'.'N0cyg'.'pO'.'w==',''.'a'.'W50cmFuZXQ=',''.'Q'.'0'.'ludHJ'.'h'.'bmV0U2hhcmVwb2ludD'.'o'.'6QW'.'dlb'.'nRR'.'dWV1ZS'.'gp'.'Ow'.'='.'=','aW50c'.'m'.'FuZXQ=','Q0ludHJ'.'hbm'.'V0'.'U2h'.'hcmVwb2lu'.'dD'.'o6QWdl'.'bnR'.'VcGRhdG'.'UoKTs=','aW5'.'0cm'.'Fu'.'ZXQ=','Y3Jt','bWFpb'.'g==','T2'.'5CZWZv'.'cmVQcm9s'.'b2'.'c=','bWFpbg==','Q1dpem'.'FyZF'.'NvbFBhbmVsSW50cmFu'.'ZX'.'Q=','U2h'.'vd1BhbmVs',''.'L'.'21vZHVsZX'.'MvaW50cmFuZXQvcGFuZWxfYnV0d'.'G9uLnBocA==','RU5DT'.'0RF','WQ==');return base64_decode($_1199576741[$_644791060]);}};$GLOBALS['____817769706'][0](___426893605(0), ___426893605(1));class CBXFeatures{ private static $_1206510477= 30; private static $_1589414946= array( "Portal" => array( "CompanyCalendar", "CompanyPhoto", "CompanyVideo", "CompanyCareer", "StaffChanges", "StaffAbsence", "CommonDocuments", "MeetingRoomBookingSystem", "Wiki", "Learning", "Vote", "WebLink", "Subscribe", "Friends", "PersonalFiles", "PersonalBlog", "PersonalPhoto", "PersonalForum", "Blog", "Forum", "Gallery", "Board", "MicroBlog", "WebMessenger",), "Communications" => array( "Tasks", "Calendar", "Workgroups", "Jabber", "VideoConference", "Extranet", "SMTP", "Requests", "DAV", "intranet_sharepoint", "timeman", "Idea", "Meeting", "EventList", "Salary", "XDImport",), "Enterprise" => array( "BizProc", "Lists", "Support", "Analytics", "crm", "Controller", "LdapUnlimitedUsers",), "Holding" => array( "Cluster", "MultiSites",),); private static $_1966275372= false; private static $_711052099= false; private static function __2063333850(){ if(self::$_1966275372 == false){ self::$_1966275372= array(); foreach(self::$_1589414946 as $_674696021 => $_2048831795){ foreach($_2048831795 as $_1436195149) self::$_1966275372[$_1436195149]= $_674696021;}} if(self::$_711052099 == false){ self::$_711052099= array(); $_1089022273= COption::GetOptionString(___426893605(2), ___426893605(3), ___426893605(4)); if($GLOBALS['____817769706'][1]($_1089022273)>(230*2-460)){ $_1089022273= $GLOBALS['____817769706'][2]($_1089022273); self::$_711052099= $GLOBALS['____817769706'][3]($_1089022273); if(!$GLOBALS['____817769706'][4](self::$_711052099)) self::$_711052099= array();} if($GLOBALS['____817769706'][5](self::$_711052099) <=(192*2-384)) self::$_711052099= array(___426893605(5) => array(), ___426893605(6) => array());}} public static function InitiateEditionsSettings($_461352671){ self::__2063333850(); $_1786679769= array(); foreach(self::$_1589414946 as $_674696021 => $_2048831795){ $_1758941786= $GLOBALS['____817769706'][6]($_674696021, $_461352671); self::$_711052099[___426893605(7)][$_674696021]=($_1758941786? array(___426893605(8)): array(___426893605(9))); foreach($_2048831795 as $_1436195149){ self::$_711052099[___426893605(10)][$_1436195149]= $_1758941786; if(!$_1758941786) $_1786679769[]= array($_1436195149, false);}} $_1119220028= $GLOBALS['____817769706'][7](self::$_711052099); $_1119220028= $GLOBALS['____817769706'][8]($_1119220028); COption::SetOptionString(___426893605(11), ___426893605(12), $_1119220028); foreach($_1786679769 as $_321255710) self::__723804943($_321255710[(862-2*431)], $_321255710[round(0+0.33333333333333+0.33333333333333+0.33333333333333)]);} public static function IsFeatureEnabled($_1436195149){ if($GLOBALS['____817769706'][9]($_1436195149) <= 0) return true; self::__2063333850(); if(!$GLOBALS['____817769706'][10]($_1436195149, self::$_1966275372)) return true; if(self::$_1966275372[$_1436195149] == ___426893605(13)) $_1378170144= array(___426893605(14)); elseif($GLOBALS['____817769706'][11](self::$_1966275372[$_1436195149], self::$_711052099[___426893605(15)])) $_1378170144= self::$_711052099[___426893605(16)][self::$_1966275372[$_1436195149]]; else $_1378170144= array(___426893605(17)); if($_1378170144[(766-2*383)] != ___426893605(18) && $_1378170144[(212*2-424)] != ___426893605(19)){ return false;} elseif($_1378170144[(980-2*490)] == ___426893605(20)){ if($_1378170144[round(0+1)]< $GLOBALS['____817769706'][12]((978-2*489),(1396/2-698),(222*2-444), Date(___426893605(21)), $GLOBALS['____817769706'][13](___426893605(22))- self::$_1206510477, $GLOBALS['____817769706'][14](___426893605(23)))){ if(!isset($_1378170144[round(0+1+1)]) ||!$_1378170144[round(0+2)]) self::__1793484325(self::$_1966275372[$_1436195149]); return false;}} return!$GLOBALS['____817769706'][15]($_1436195149, self::$_711052099[___426893605(24)]) || self::$_711052099[___426893605(25)][$_1436195149];} public static function IsFeatureInstalled($_1436195149){ if($GLOBALS['____817769706'][16]($_1436195149) <= 0) return true; self::__2063333850(); return($GLOBALS['____817769706'][17]($_1436195149, self::$_711052099[___426893605(26)]) && self::$_711052099[___426893605(27)][$_1436195149]);} public static function IsFeatureEditable($_1436195149){ if($GLOBALS['____817769706'][18]($_1436195149) <= 0) return true; self::__2063333850(); if(!$GLOBALS['____817769706'][19]($_1436195149, self::$_1966275372)) return true; if(self::$_1966275372[$_1436195149] == ___426893605(28)) $_1378170144= array(___426893605(29)); elseif($GLOBALS['____817769706'][20](self::$_1966275372[$_1436195149], self::$_711052099[___426893605(30)])) $_1378170144= self::$_711052099[___426893605(31)][self::$_1966275372[$_1436195149]]; else $_1378170144= array(___426893605(32)); if($_1378170144[min(58,0,19.333333333333)] != ___426893605(33) && $_1378170144[min(88,0,29.333333333333)] != ___426893605(34)){ return false;} elseif($_1378170144[(1032/2-516)] == ___426893605(35)){ if($_1378170144[round(0+0.2+0.2+0.2+0.2+0.2)]< $GLOBALS['____817769706'][21]((1356/2-678),(127*2-254),(239*2-478), Date(___426893605(36)), $GLOBALS['____817769706'][22](___426893605(37))- self::$_1206510477, $GLOBALS['____817769706'][23](___426893605(38)))){ if(!isset($_1378170144[round(0+2)]) ||!$_1378170144[round(0+0.4+0.4+0.4+0.4+0.4)]) self::__1793484325(self::$_1966275372[$_1436195149]); return false;}} return true;} private static function __723804943($_1436195149, $_397756188){ if($GLOBALS['____817769706'][24]("CBXFeatures", "On".$_1436195149."SettingsChange")) $GLOBALS['____817769706'][25](array("CBXFeatures", "On".$_1436195149."SettingsChange"), array($_1436195149, $_397756188)); $_746382828= $GLOBALS['_____865053161'][0](___426893605(39), ___426893605(40).$_1436195149.___426893605(41)); while($_8985875= $_746382828->Fetch()) $GLOBALS['_____865053161'][1]($_8985875, array($_1436195149, $_397756188));} public static function SetFeatureEnabled($_1436195149, $_397756188= true, $_851507773= true){ if($GLOBALS['____817769706'][26]($_1436195149) <= 0) return; if(!self::IsFeatureEditable($_1436195149)) $_397756188= false; $_397756188=($_397756188? true: false); self::__2063333850(); $_694506578=(!$GLOBALS['____817769706'][27]($_1436195149, self::$_711052099[___426893605(42)]) && $_397756188 || $GLOBALS['____817769706'][28]($_1436195149, self::$_711052099[___426893605(43)]) && $_397756188 != self::$_711052099[___426893605(44)][$_1436195149]); self::$_711052099[___426893605(45)][$_1436195149]= $_397756188; $_1119220028= $GLOBALS['____817769706'][29](self::$_711052099); $_1119220028= $GLOBALS['____817769706'][30]($_1119220028); COption::SetOptionString(___426893605(46), ___426893605(47), $_1119220028); if($_694506578 && $_851507773) self::__723804943($_1436195149, $_397756188);} private static function __1793484325($_674696021){ if($GLOBALS['____817769706'][31]($_674696021) <= 0 || $_674696021 == "Portal") return; self::__2063333850(); if(!$GLOBALS['____817769706'][32]($_674696021, self::$_711052099[___426893605(48)]) || $GLOBALS['____817769706'][33]($_674696021, self::$_711052099[___426893605(49)]) && self::$_711052099[___426893605(50)][$_674696021][(972-2*486)] != ___426893605(51)) return; if(isset(self::$_711052099[___426893605(52)][$_674696021][round(0+0.4+0.4+0.4+0.4+0.4)]) && self::$_711052099[___426893605(53)][$_674696021][round(0+1+1)]) return; $_1786679769= array(); if($GLOBALS['____817769706'][34]($_674696021, self::$_1589414946) && $GLOBALS['____817769706'][35](self::$_1589414946[$_674696021])){ foreach(self::$_1589414946[$_674696021] as $_1436195149){ if($GLOBALS['____817769706'][36]($_1436195149, self::$_711052099[___426893605(54)]) && self::$_711052099[___426893605(55)][$_1436195149]){ self::$_711052099[___426893605(56)][$_1436195149]= false; $_1786679769[]= array($_1436195149, false);}} self::$_711052099[___426893605(57)][$_674696021][round(0+0.66666666666667+0.66666666666667+0.66666666666667)]= true;} $_1119220028= $GLOBALS['____817769706'][37](self::$_711052099); $_1119220028= $GLOBALS['____817769706'][38]($_1119220028); COption::SetOptionString(___426893605(58), ___426893605(59), $_1119220028); foreach($_1786679769 as $_321255710) self::__723804943($_321255710[min(112,0,37.333333333333)], $_321255710[round(0+0.33333333333333+0.33333333333333+0.33333333333333)]);} public static function ModifyFeaturesSettings($_461352671, $_2048831795){ self::__2063333850(); foreach($_461352671 as $_674696021 => $_1782340689) self::$_711052099[___426893605(60)][$_674696021]= $_1782340689; $_1786679769= array(); foreach($_2048831795 as $_1436195149 => $_397756188){ if(!$GLOBALS['____817769706'][39]($_1436195149, self::$_711052099[___426893605(61)]) && $_397756188 || $GLOBALS['____817769706'][40]($_1436195149, self::$_711052099[___426893605(62)]) && $_397756188 != self::$_711052099[___426893605(63)][$_1436195149]) $_1786679769[]= array($_1436195149, $_397756188); self::$_711052099[___426893605(64)][$_1436195149]= $_397756188;} $_1119220028= $GLOBALS['____817769706'][41](self::$_711052099); $_1119220028= $GLOBALS['____817769706'][42]($_1119220028); COption::SetOptionString(___426893605(65), ___426893605(66), $_1119220028); self::$_711052099= false; foreach($_1786679769 as $_321255710) self::__723804943($_321255710[min(168,0,56)], $_321255710[round(0+1)]);} public static function SaveFeaturesSettings($_2091506993, $_459240624){ self::__2063333850(); $_622278416= array(___426893605(67) => array(), ___426893605(68) => array()); if(!$GLOBALS['____817769706'][43]($_2091506993)) $_2091506993= array(); if(!$GLOBALS['____817769706'][44]($_459240624)) $_459240624= array(); if(!$GLOBALS['____817769706'][45](___426893605(69), $_2091506993)) $_2091506993[]= ___426893605(70); foreach(self::$_1589414946 as $_674696021 => $_2048831795){ if($GLOBALS['____817769706'][46]($_674696021, self::$_711052099[___426893605(71)])) $_2057084315= self::$_711052099[___426893605(72)][$_674696021]; else $_2057084315=($_674696021 == ___426893605(73))? array(___426893605(74)): array(___426893605(75)); if($_2057084315[min(162,0,54)] == ___426893605(76) || $_2057084315[(844-2*422)] == ___426893605(77)){ $_622278416[___426893605(78)][$_674696021]= $_2057084315;} else{ if($GLOBALS['____817769706'][47]($_674696021, $_2091506993)) $_622278416[___426893605(79)][$_674696021]= array(___426893605(80), $GLOBALS['____817769706'][48](min(230,0,76.666666666667),(1160/2-580),(152*2-304), $GLOBALS['____817769706'][49](___426893605(81)), $GLOBALS['____817769706'][50](___426893605(82)), $GLOBALS['____817769706'][51](___426893605(83)))); else $_622278416[___426893605(84)][$_674696021]= array(___426893605(85));}} $_1786679769= array(); foreach(self::$_1966275372 as $_1436195149 => $_674696021){ if($_622278416[___426893605(86)][$_674696021][(234*2-468)] != ___426893605(87) && $_622278416[___426893605(88)][$_674696021][(1272/2-636)] != ___426893605(89)){ $_622278416[___426893605(90)][$_1436195149]= false;} else{ if($_622278416[___426893605(91)][$_674696021][min(96,0,32)] == ___426893605(92) && $_622278416[___426893605(93)][$_674696021][round(0+0.5+0.5)]< $GLOBALS['____817769706'][52]((205*2-410), min(42,0,14), min(228,0,76), Date(___426893605(94)), $GLOBALS['____817769706'][53](___426893605(95))- self::$_1206510477, $GLOBALS['____817769706'][54](___426893605(96)))) $_622278416[___426893605(97)][$_1436195149]= false; else $_622278416[___426893605(98)][$_1436195149]= $GLOBALS['____817769706'][55]($_1436195149, $_459240624); if(!$GLOBALS['____817769706'][56]($_1436195149, self::$_711052099[___426893605(99)]) && $_622278416[___426893605(100)][$_1436195149] || $GLOBALS['____817769706'][57]($_1436195149, self::$_711052099[___426893605(101)]) && $_622278416[___426893605(102)][$_1436195149] != self::$_711052099[___426893605(103)][$_1436195149]) $_1786679769[]= array($_1436195149, $_622278416[___426893605(104)][$_1436195149]);}} $_1119220028= $GLOBALS['____817769706'][58]($_622278416); $_1119220028= $GLOBALS['____817769706'][59]($_1119220028); COption::SetOptionString(___426893605(105), ___426893605(106), $_1119220028); self::$_711052099= false; foreach($_1786679769 as $_321255710) self::__723804943($_321255710[(794-2*397)], $_321255710[round(0+1)]);} public static function GetFeaturesList(){ self::__2063333850(); $_795451165= array(); foreach(self::$_1589414946 as $_674696021 => $_2048831795){ if($GLOBALS['____817769706'][60]($_674696021, self::$_711052099[___426893605(107)])) $_2057084315= self::$_711052099[___426893605(108)][$_674696021]; else $_2057084315=($_674696021 == ___426893605(109))? array(___426893605(110)): array(___426893605(111)); $_795451165[$_674696021]= array( ___426893605(112) => $_2057084315[(1352/2-676)], ___426893605(113) => $_2057084315[round(0+0.2+0.2+0.2+0.2+0.2)], ___426893605(114) => array(),); $_795451165[$_674696021][___426893605(115)]= false; if($_795451165[$_674696021][___426893605(116)] == ___426893605(117)){ $_795451165[$_674696021][___426893605(118)]= $GLOBALS['____817769706'][61](($GLOBALS['____817769706'][62]()- $_795451165[$_674696021][___426893605(119)])/ round(0+17280+17280+17280+17280+17280)); if($_795451165[$_674696021][___426893605(120)]> self::$_1206510477) $_795451165[$_674696021][___426893605(121)]= true;} foreach($_2048831795 as $_1436195149) $_795451165[$_674696021][___426893605(122)][$_1436195149]=(!$GLOBALS['____817769706'][63]($_1436195149, self::$_711052099[___426893605(123)]) || self::$_711052099[___426893605(124)][$_1436195149]);} return $_795451165;} private static function __884021564($_299037559, $_1074357037){ if(IsModuleInstalled($_299037559) == $_1074357037) return true; $_1971462960= $_SERVER[___426893605(125)].___426893605(126).$_299037559.___426893605(127); if(!$GLOBALS['____817769706'][64]($_1971462960)) return false; include_once($_1971462960); $_1470267866= $GLOBALS['____817769706'][65](___426893605(128), ___426893605(129), $_299037559); if(!$GLOBALS['____817769706'][66]($_1470267866)) return false; $_1609954876= new $_1470267866; if($_1074357037){ if(!$_1609954876->InstallDB()) return false; $_1609954876->InstallEvents(); if(!$_1609954876->InstallFiles()) return false;} else{ if(CModule::IncludeModule(___426893605(130))) CSearch::DeleteIndex($_299037559); UnRegisterModule($_299037559);} return true;} protected static function OnRequestsSettingsChange($_1436195149, $_397756188){ self::__884021564("form", $_397756188);} protected static function OnLearningSettingsChange($_1436195149, $_397756188){ self::__884021564("learning", $_397756188);} protected static function OnJabberSettingsChange($_1436195149, $_397756188){ self::__884021564("xmpp", $_397756188);} protected static function OnVideoConferenceSettingsChange($_1436195149, $_397756188){ self::__884021564("video", $_397756188);} protected static function OnBizProcSettingsChange($_1436195149, $_397756188){ self::__884021564("bizprocdesigner", $_397756188);} protected static function OnListsSettingsChange($_1436195149, $_397756188){ self::__884021564("lists", $_397756188);} protected static function OnWikiSettingsChange($_1436195149, $_397756188){ self::__884021564("wiki", $_397756188);} protected static function OnSupportSettingsChange($_1436195149, $_397756188){ self::__884021564("support", $_397756188);} protected static function OnControllerSettingsChange($_1436195149, $_397756188){ self::__884021564("controller", $_397756188);} protected static function OnAnalyticsSettingsChange($_1436195149, $_397756188){ self::__884021564("statistic", $_397756188);} protected static function OnVoteSettingsChange($_1436195149, $_397756188){ self::__884021564("vote", $_397756188);} protected static function OnFriendsSettingsChange($_1436195149, $_397756188){ if($_397756188) $_1054478164= "Y"; else $_1054478164= ___426893605(131); $_1373613852= CSite::GetList(($_1758941786= ___426893605(132)),($_1470812867= ___426893605(133)), array(___426893605(134) => ___426893605(135))); while($_612004515= $_1373613852->Fetch()){ if(COption::GetOptionString(___426893605(136), ___426893605(137), ___426893605(138), $_612004515[___426893605(139)]) != $_1054478164){ COption::SetOptionString(___426893605(140), ___426893605(141), $_1054478164, false, $_612004515[___426893605(142)]); COption::SetOptionString(___426893605(143), ___426893605(144), $_1054478164);}}} protected static function OnMicroBlogSettingsChange($_1436195149, $_397756188){ if($_397756188) $_1054478164= "Y"; else $_1054478164= ___426893605(145); $_1373613852= CSite::GetList(($_1758941786= ___426893605(146)),($_1470812867= ___426893605(147)), array(___426893605(148) => ___426893605(149))); while($_612004515= $_1373613852->Fetch()){ if(COption::GetOptionString(___426893605(150), ___426893605(151), ___426893605(152), $_612004515[___426893605(153)]) != $_1054478164){ COption::SetOptionString(___426893605(154), ___426893605(155), $_1054478164, false, $_612004515[___426893605(156)]); COption::SetOptionString(___426893605(157), ___426893605(158), $_1054478164);} if(COption::GetOptionString(___426893605(159), ___426893605(160), ___426893605(161), $_612004515[___426893605(162)]) != $_1054478164){ COption::SetOptionString(___426893605(163), ___426893605(164), $_1054478164, false, $_612004515[___426893605(165)]); COption::SetOptionString(___426893605(166), ___426893605(167), $_1054478164);}}} protected static function OnPersonalFilesSettingsChange($_1436195149, $_397756188){ if($_397756188) $_1054478164= "Y"; else $_1054478164= ___426893605(168); $_1373613852= CSite::GetList(($_1758941786= ___426893605(169)),($_1470812867= ___426893605(170)), array(___426893605(171) => ___426893605(172))); while($_612004515= $_1373613852->Fetch()){ if(COption::GetOptionString(___426893605(173), ___426893605(174), ___426893605(175), $_612004515[___426893605(176)]) != $_1054478164){ COption::SetOptionString(___426893605(177), ___426893605(178), $_1054478164, false, $_612004515[___426893605(179)]); COption::SetOptionString(___426893605(180), ___426893605(181), $_1054478164);}}} protected static function OnPersonalBlogSettingsChange($_1436195149, $_397756188){ if($_397756188) $_1054478164= "Y"; else $_1054478164= ___426893605(182); $_1373613852= CSite::GetList(($_1758941786= ___426893605(183)),($_1470812867= ___426893605(184)), array(___426893605(185) => ___426893605(186))); while($_612004515= $_1373613852->Fetch()){ if(COption::GetOptionString(___426893605(187), ___426893605(188), ___426893605(189), $_612004515[___426893605(190)]) != $_1054478164){ COption::SetOptionString(___426893605(191), ___426893605(192), $_1054478164, false, $_612004515[___426893605(193)]); COption::SetOptionString(___426893605(194), ___426893605(195), $_1054478164);}}} protected static function OnPersonalPhotoSettingsChange($_1436195149, $_397756188){ if($_397756188) $_1054478164= "Y"; else $_1054478164= ___426893605(196); $_1373613852= CSite::GetList(($_1758941786= ___426893605(197)),($_1470812867= ___426893605(198)), array(___426893605(199) => ___426893605(200))); while($_612004515= $_1373613852->Fetch()){ if(COption::GetOptionString(___426893605(201), ___426893605(202), ___426893605(203), $_612004515[___426893605(204)]) != $_1054478164){ COption::SetOptionString(___426893605(205), ___426893605(206), $_1054478164, false, $_612004515[___426893605(207)]); COption::SetOptionString(___426893605(208), ___426893605(209), $_1054478164);}}} protected static function OnPersonalForumSettingsChange($_1436195149, $_397756188){ if($_397756188) $_1054478164= "Y"; else $_1054478164= ___426893605(210); $_1373613852= CSite::GetList(($_1758941786= ___426893605(211)),($_1470812867= ___426893605(212)), array(___426893605(213) => ___426893605(214))); while($_612004515= $_1373613852->Fetch()){ if(COption::GetOptionString(___426893605(215), ___426893605(216), ___426893605(217), $_612004515[___426893605(218)]) != $_1054478164){ COption::SetOptionString(___426893605(219), ___426893605(220), $_1054478164, false, $_612004515[___426893605(221)]); COption::SetOptionString(___426893605(222), ___426893605(223), $_1054478164);}}} protected static function OnTasksSettingsChange($_1436195149, $_397756188){ if($_397756188) $_1054478164= "Y"; else $_1054478164= ___426893605(224); $_1373613852= CSite::GetList(($_1758941786= ___426893605(225)),($_1470812867= ___426893605(226)), array(___426893605(227) => ___426893605(228))); while($_612004515= $_1373613852->Fetch()){ if(COption::GetOptionString(___426893605(229), ___426893605(230), ___426893605(231), $_612004515[___426893605(232)]) != $_1054478164){ COption::SetOptionString(___426893605(233), ___426893605(234), $_1054478164, false, $_612004515[___426893605(235)]); COption::SetOptionString(___426893605(236), ___426893605(237), $_1054478164);} if(COption::GetOptionString(___426893605(238), ___426893605(239), ___426893605(240), $_612004515[___426893605(241)]) != $_1054478164){ COption::SetOptionString(___426893605(242), ___426893605(243), $_1054478164, false, $_612004515[___426893605(244)]); COption::SetOptionString(___426893605(245), ___426893605(246), $_1054478164);}} self::__884021564(___426893605(247), $_397756188);} protected static function OnCalendarSettingsChange($_1436195149, $_397756188){ if($_397756188) $_1054478164= "Y"; else $_1054478164= ___426893605(248); $_1373613852= CSite::GetList(($_1758941786= ___426893605(249)),($_1470812867= ___426893605(250)), array(___426893605(251) => ___426893605(252))); while($_612004515= $_1373613852->Fetch()){ if(COption::GetOptionString(___426893605(253), ___426893605(254), ___426893605(255), $_612004515[___426893605(256)]) != $_1054478164){ COption::SetOptionString(___426893605(257), ___426893605(258), $_1054478164, false, $_612004515[___426893605(259)]); COption::SetOptionString(___426893605(260), ___426893605(261), $_1054478164);} if(COption::GetOptionString(___426893605(262), ___426893605(263), ___426893605(264), $_612004515[___426893605(265)]) != $_1054478164){ COption::SetOptionString(___426893605(266), ___426893605(267), $_1054478164, false, $_612004515[___426893605(268)]); COption::SetOptionString(___426893605(269), ___426893605(270), $_1054478164);}}} protected static function OnSMTPSettingsChange($_1436195149, $_397756188){ self::__884021564("mail", $_397756188);} protected static function OnExtranetSettingsChange($_1436195149, $_397756188){ $_1255561560= COption::GetOptionString("extranet", "extranet_site", ""); if($_1255561560){ $_923522603= new CSite; $_923522603->Update($_1255561560, array(___426893605(271) =>($_397756188? ___426893605(272): ___426893605(273))));} self::__884021564(___426893605(274), $_397756188);} protected static function OnDAVSettingsChange($_1436195149, $_397756188){ self::__884021564("dav", $_397756188);} protected static function OntimemanSettingsChange($_1436195149, $_397756188){ self::__884021564("timeman", $_397756188);} protected static function Onintranet_sharepointSettingsChange($_1436195149, $_397756188){ if($_397756188){ RegisterModuleDependences("iblock", "OnAfterIBlockElementAdd", "intranet", "CIntranetEventHandlers", "SPRegisterUpdatedItem"); RegisterModuleDependences(___426893605(275), ___426893605(276), ___426893605(277), ___426893605(278), ___426893605(279)); CAgent::AddAgent(___426893605(280), ___426893605(281), ___426893605(282), round(0+250+250)); CAgent::AddAgent(___426893605(283), ___426893605(284), ___426893605(285), round(0+300)); CAgent::AddAgent(___426893605(286), ___426893605(287), ___426893605(288), round(0+1800+1800));} else{ UnRegisterModuleDependences(___426893605(289), ___426893605(290), ___426893605(291), ___426893605(292), ___426893605(293)); UnRegisterModuleDependences(___426893605(294), ___426893605(295), ___426893605(296), ___426893605(297), ___426893605(298)); CAgent::RemoveAgent(___426893605(299), ___426893605(300)); CAgent::RemoveAgent(___426893605(301), ___426893605(302)); CAgent::RemoveAgent(___426893605(303), ___426893605(304));}} protected static function OncrmSettingsChange($_1436195149, $_397756188){ if($_397756188) COption::SetOptionString("crm", "form_features", "Y"); self::__884021564(___426893605(305), $_397756188);} protected static function OnClusterSettingsChange($_1436195149, $_397756188){ self::__884021564("cluster", $_397756188);} protected static function OnMultiSitesSettingsChange($_1436195149, $_397756188){ if($_397756188) RegisterModuleDependences("main", "OnBeforeProlog", "main", "CWizardSolPanelIntranet", "ShowPanel", 100, "/modules/intranet/panel_button.php"); else UnRegisterModuleDependences(___426893605(306), ___426893605(307), ___426893605(308), ___426893605(309), ___426893605(310), ___426893605(311));} protected static function OnIdeaSettingsChange($_1436195149, $_397756188){ self::__884021564("idea", $_397756188);} protected static function OnMeetingSettingsChange($_1436195149, $_397756188){ self::__884021564("meeting", $_397756188);} protected static function OnXDImportSettingsChange($_1436195149, $_397756188){ self::__884021564("xdimport", $_397756188);}} $GLOBALS['____817769706'][67](___426893605(312), ___426893605(313));/**/			//Do not remove this

require_once(__DIR__."/autoload.php");

// Component 2.0 template engines
$GLOBALS['arCustomTemplateEngines'] = [];

// User fields manager
$GLOBALS['USER_FIELD_MANAGER'] = new CUserTypeManager;

// todo: remove global
$GLOBALS['BX_MENU_CUSTOM'] = CMenuCustom::getInstance();

if(file_exists(($_fname = __DIR__."/classes/general/update_db_updater.php")))
{
	$US_HOST_PROCESS_MAIN = False;
	include($_fname);
}

if(file_exists(($_fname = $_SERVER["DOCUMENT_ROOT"]."/bitrix/init.php")))
	include_once($_fname);

if(($_fname = getLocalPath("php_interface/init.php", BX_PERSONAL_ROOT)) !== false)
	include_once($_SERVER["DOCUMENT_ROOT"].$_fname);

if(($_fname = getLocalPath("php_interface/".SITE_ID."/init.php", BX_PERSONAL_ROOT)) !== false)
	include_once($_SERVER["DOCUMENT_ROOT"].$_fname);

if(!defined("BX_FILE_PERMISSIONS"))
	define("BX_FILE_PERMISSIONS", 0644);
if(!defined("BX_DIR_PERMISSIONS"))
	define("BX_DIR_PERMISSIONS", 0755);

//global var, is used somewhere
$GLOBALS["sDocPath"] = $GLOBALS["APPLICATION"]->GetCurPage();

if((!(defined("STATISTIC_ONLY") && STATISTIC_ONLY && mb_substr($GLOBALS["APPLICATION"]->GetCurPage(), 0, mb_strlen(BX_ROOT."/admin/")) != BX_ROOT."/admin/")) && COption::GetOptionString("main", "include_charset", "Y")=="Y" && LANG_CHARSET <> '')
	header("Content-Type: text/html; charset=".LANG_CHARSET);

if(COption::GetOptionString("main", "set_p3p_header", "Y")=="Y")
	header("P3P: policyref=\"/bitrix/p3p.xml\", CP=\"NON DSP COR CUR ADM DEV PSA PSD OUR UNR BUS UNI COM NAV INT DEM STA\"");

header("X-Powered-CMS: Bitrix Site Manager (".(LICENSE_KEY == "DEMO"? "DEMO" : md5("BITRIX".LICENSE_KEY."LICENCE")).")");
if (COption::GetOptionString("main", "update_devsrv", "") == "Y")
	header("X-DevSrv-CMS: Bitrix");

if (!defined("BX_CRONTAB_SUPPORT"))
{
	define("BX_CRONTAB_SUPPORT", defined("BX_CRONTAB"));
}

//agents
if(COption::GetOptionString("main", "check_agents", "Y") == "Y")
{
	$application->addBackgroundJob(["CAgent", "CheckAgents"], [], \Bitrix\Main\Application::JOB_PRIORITY_LOW);
}

//send email events
if(COption::GetOptionString("main", "check_events", "Y") !== "N")
{
	$application->addBackgroundJob(['\Bitrix\Main\Mail\EventManager', 'checkEvents'], [], \Bitrix\Main\Application::JOB_PRIORITY_LOW-1);
}

$healerOfEarlySessionStart = new HealerEarlySessionStart();
$healerOfEarlySessionStart->process($application->getKernelSession());

$kernelSession = $application->getKernelSession();
$kernelSession->start();
$application->getSessionLocalStorageManager()->setUniqueId($kernelSession->getId());

foreach (GetModuleEvents("main", "OnPageStart", true) as $arEvent)
	ExecuteModuleEventEx($arEvent);

//define global user object
$GLOBALS["USER"] = new CUser;

//session control from group policy
$arPolicy = $GLOBALS["USER"]->GetSecurityPolicy();
$currTime = time();
if(
	(
		//IP address changed
		$kernelSession['SESS_IP']
		&& $arPolicy["SESSION_IP_MASK"] <> ''
		&& (
			(ip2long($arPolicy["SESSION_IP_MASK"]) & ip2long($kernelSession['SESS_IP']))
			!=
			(ip2long($arPolicy["SESSION_IP_MASK"]) & ip2long($_SERVER['REMOTE_ADDR']))
		)
	)
	||
	(
		//session timeout
		$arPolicy["SESSION_TIMEOUT"]>0
		&& $kernelSession['SESS_TIME']>0
		&& $currTime-$arPolicy["SESSION_TIMEOUT"]*60 > $kernelSession['SESS_TIME']
	)
	||
	(
		//signed session
		isset($kernelSession["BX_SESSION_SIGN"])
		&& $kernelSession["BX_SESSION_SIGN"] <> bitrix_sess_sign()
	)
	||
	(
		//session manually expired, e.g. in $User->LoginHitByHash
		isSessionExpired()
	)
)
{
	$compositeSessionManager = $application->getCompositeSessionManager();
	$compositeSessionManager->destroy();

	$application->getSession()->setId(Main\Security\Random::getString(32));
	$compositeSessionManager->start();

	$GLOBALS["USER"] = new CUser;
}
$kernelSession['SESS_IP'] = $_SERVER['REMOTE_ADDR'];
if (empty($kernelSession['SESS_TIME']))
{
	$kernelSession['SESS_TIME'] = $currTime;
}
elseif (($currTime - $kernelSession['SESS_TIME']) > 60)
{
	$kernelSession['SESS_TIME'] = $currTime;
}
if(!isset($kernelSession["BX_SESSION_SIGN"]))
{
	$kernelSession["BX_SESSION_SIGN"] = bitrix_sess_sign();
}

//session control from security module
if(
	(COption::GetOptionString("main", "use_session_id_ttl", "N") == "Y")
	&& (COption::GetOptionInt("main", "session_id_ttl", 0) > 0)
	&& !defined("BX_SESSION_ID_CHANGE")
)
{
	if(!isset($kernelSession['SESS_ID_TIME']))
	{
		$kernelSession['SESS_ID_TIME'] = $currTime;
	}
	elseif(($kernelSession['SESS_ID_TIME'] + COption::GetOptionInt("main", "session_id_ttl")) < $kernelSession['SESS_TIME'])
	{
		$compositeSessionManager = $application->getCompositeSessionManager();
		$compositeSessionManager->regenerateId();

		$kernelSession['SESS_ID_TIME'] = $currTime;
	}
}

define("BX_STARTED", true);

if (isset($kernelSession['BX_ADMIN_LOAD_AUTH']))
{
	define('ADMIN_SECTION_LOAD_AUTH', 1);
	unset($kernelSession['BX_ADMIN_LOAD_AUTH']);
}

$bRsaError = false;
$USER_LID = false;

if(!defined("NOT_CHECK_PERMISSIONS") || NOT_CHECK_PERMISSIONS!==true)
{
	$doLogout = isset($_REQUEST["logout"]) && (strtolower($_REQUEST["logout"]) == "yes");

	if($doLogout && $GLOBALS["USER"]->IsAuthorized())
	{
		$secureLogout = (\Bitrix\Main\Config\Option::get("main", "secure_logout", "N") == "Y");

		if(!$secureLogout || check_bitrix_sessid())
		{
			$GLOBALS["USER"]->Logout();
			LocalRedirect($GLOBALS["APPLICATION"]->GetCurPageParam('', array('logout', 'sessid')));
		}
	}

	// authorize by cookies
	if(!$GLOBALS["USER"]->IsAuthorized())
	{
		$GLOBALS["USER"]->LoginByCookies();
	}

	$arAuthResult = false;

	//http basic and digest authorization
	if(($httpAuth = $GLOBALS["USER"]->LoginByHttpAuth()) !== null)
	{
		$arAuthResult = $httpAuth;
		$GLOBALS["APPLICATION"]->SetAuthResult($arAuthResult);
	}

	//Authorize user from authorization html form
	//Only POST is accepted
	if(isset($_POST["AUTH_FORM"]) && $_POST["AUTH_FORM"] <> '')
	{
		if(COption::GetOptionString('main', 'use_encrypted_auth', 'N') == 'Y')
		{
			//possible encrypted user password
			$sec = new CRsaSecurity();
			if(($arKeys = $sec->LoadKeys()))
			{
				$sec->SetKeys($arKeys);
				$errno = $sec->AcceptFromForm(['USER_PASSWORD', 'USER_CONFIRM_PASSWORD', 'USER_CURRENT_PASSWORD']);
				if($errno == CRsaSecurity::ERROR_SESS_CHECK)
					$arAuthResult = array("MESSAGE"=>GetMessage("main_include_decode_pass_sess"), "TYPE"=>"ERROR");
				elseif($errno < 0)
					$arAuthResult = array("MESSAGE"=>GetMessage("main_include_decode_pass_err", array("#ERRCODE#"=>$errno)), "TYPE"=>"ERROR");

				if($errno < 0)
					$bRsaError = true;
			}
		}

		if (!$bRsaError)
		{
			if(!defined("ADMIN_SECTION") || ADMIN_SECTION !== true)
			{
				$USER_LID = SITE_ID;
			}

			if($_POST["TYPE"] == "AUTH")
			{
				$arAuthResult = $GLOBALS["USER"]->Login($_POST["USER_LOGIN"], $_POST["USER_PASSWORD"], $_POST["USER_REMEMBER"]);
			}
			elseif($_POST["TYPE"] == "OTP")
			{
				$arAuthResult = $GLOBALS["USER"]->LoginByOtp($_POST["USER_OTP"], $_POST["OTP_REMEMBER"], $_POST["captcha_word"], $_POST["captcha_sid"]);
			}
			elseif($_POST["TYPE"] == "SEND_PWD")
			{
				$arAuthResult = CUser::SendPassword($_POST["USER_LOGIN"], $_POST["USER_EMAIL"], $USER_LID, $_POST["captcha_word"], $_POST["captcha_sid"], $_POST["USER_PHONE_NUMBER"]);
			}
			elseif($_POST["TYPE"] == "CHANGE_PWD")
			{
				$arAuthResult = $GLOBALS["USER"]->ChangePassword($_POST["USER_LOGIN"], $_POST["USER_CHECKWORD"], $_POST["USER_PASSWORD"], $_POST["USER_CONFIRM_PASSWORD"], $USER_LID, $_POST["captcha_word"], $_POST["captcha_sid"], true, $_POST["USER_PHONE_NUMBER"], $_POST["USER_CURRENT_PASSWORD"]);
			}

			if($_POST["TYPE"] == "AUTH" || $_POST["TYPE"] == "OTP")
			{
				//special login form in the control panel
				if($arAuthResult === true && defined('ADMIN_SECTION') && ADMIN_SECTION === true)
				{
					//store cookies for next hit (see CMain::GetSpreadCookieHTML())
					$GLOBALS["APPLICATION"]->StoreCookies();
					$kernelSession['BX_ADMIN_LOAD_AUTH'] = true;

					// die() follows
					CMain::FinalActions('<script type="text/javascript">window.onload=function(){(window.BX || window.parent.BX).AUTHAGENT.setAuthResult(false);};</script>');
				}
			}
		}
		$GLOBALS["APPLICATION"]->SetAuthResult($arAuthResult);
	}
	elseif(!$GLOBALS["USER"]->IsAuthorized() && isset($_REQUEST['bx_hit_hash']))
	{
		//Authorize by unique URL
		$GLOBALS["USER"]->LoginHitByHash($_REQUEST['bx_hit_hash']);
	}
}

//logout or re-authorize the user if something importand has changed
$GLOBALS["USER"]->CheckAuthActions();

//magic short URI
if(defined("BX_CHECK_SHORT_URI") && BX_CHECK_SHORT_URI && CBXShortUri::CheckUri())
{
	//local redirect inside
	die();
}

//application password scope control
if(($applicationID = $GLOBALS["USER"]->getContext()->getApplicationId()) !== null)
{
	$appManager = Main\Authentication\ApplicationManager::getInstance();
	if($appManager->checkScope($applicationID) !== true)
	{
		$event = new Main\Event("main", "onApplicationScopeError", Array('APPLICATION_ID' => $applicationID));
		$event->send();

		$context->getResponse()->setStatus("403 Forbidden");
		$application->end();
	}
}

//define the site template
if(!defined("ADMIN_SECTION") || ADMIN_SECTION !== true)
{
	$siteTemplate = "";
	if(isset($_REQUEST["bitrix_preview_site_template"]) && is_string($_REQUEST["bitrix_preview_site_template"]) && $_REQUEST["bitrix_preview_site_template"] <> "" && $GLOBALS["USER"]->CanDoOperation('view_other_settings'))
	{
		//preview of site template
		$signer = new Bitrix\Main\Security\Sign\Signer();
		try
		{
			//protected by a sign
			$requestTemplate = $signer->unsign($_REQUEST["bitrix_preview_site_template"], "template_preview".bitrix_sessid());

			$aTemplates = CSiteTemplate::GetByID($requestTemplate);
			if($template = $aTemplates->Fetch())
			{
				$siteTemplate = $template["ID"];

				//preview of unsaved template
				if(isset($_GET['bx_template_preview_mode']) && $_GET['bx_template_preview_mode'] == 'Y' && $GLOBALS["USER"]->CanDoOperation('edit_other_settings'))
				{
					define("SITE_TEMPLATE_PREVIEW_MODE", true);
				}
			}
		}
		catch(\Bitrix\Main\Security\Sign\BadSignatureException $e)
		{
		}
	}
	if($siteTemplate == "")
	{
		$siteTemplate = CSite::GetCurTemplate();
	}
	define("SITE_TEMPLATE_ID", $siteTemplate);
	define("SITE_TEMPLATE_PATH", getLocalPath('templates/'.SITE_TEMPLATE_ID, BX_PERSONAL_ROOT));
}
else
{
	// prevents undefined constants
	define('SITE_TEMPLATE_ID', '.default');
	define('SITE_TEMPLATE_PATH', '/bitrix/templates/.default');
}

//magic parameters: show page creation time
if(isset($_GET["show_page_exec_time"]))
{
	if($_GET["show_page_exec_time"]=="Y" || $_GET["show_page_exec_time"]=="N")
		$kernelSession["SESS_SHOW_TIME_EXEC"] = $_GET["show_page_exec_time"];
}

//magic parameters: show included file processing time
if(isset($_GET["show_include_exec_time"]))
{
	if($_GET["show_include_exec_time"]=="Y" || $_GET["show_include_exec_time"]=="N")
		$kernelSession["SESS_SHOW_INCLUDE_TIME_EXEC"] = $_GET["show_include_exec_time"];
}

//magic parameters: show include areas
if(isset($_GET["bitrix_include_areas"]) && $_GET["bitrix_include_areas"] <> "")
	$GLOBALS["APPLICATION"]->SetShowIncludeAreas($_GET["bitrix_include_areas"]=="Y");

//magic sound
if($GLOBALS["USER"]->IsAuthorized())
{
	$cookie_prefix = COption::GetOptionString('main', 'cookie_name', 'BITRIX_SM');
	if(!isset($_COOKIE[$cookie_prefix.'_SOUND_LOGIN_PLAYED']))
		$GLOBALS["APPLICATION"]->set_cookie('SOUND_LOGIN_PLAYED', 'Y', 0);
}

//magic cache
\Bitrix\Main\Composite\Engine::shouldBeEnabled();

// should be before proactive filter on OnBeforeProlog
$userPassword = $_POST["USER_PASSWORD"] ?? null;
$userConfirmPassword = $_POST["USER_CONFIRM_PASSWORD"] ?? null;

foreach(GetModuleEvents("main", "OnBeforeProlog", true) as $arEvent)
{
	ExecuteModuleEventEx($arEvent);
}

if (!defined("NOT_CHECK_PERMISSIONS") || NOT_CHECK_PERMISSIONS !== true)
{
	//Register user from authorization html form
	//Only POST is accepted
	if (isset($_POST["AUTH_FORM"]) && $_POST["AUTH_FORM"] != '' && $_POST["TYPE"] == "REGISTRATION")
	{
		if (!$bRsaError)
		{
			if(COption::GetOptionString("main", "new_user_registration", "N") == "Y" && (!defined("ADMIN_SECTION") || ADMIN_SECTION !== true))
			{
				$arAuthResult = $GLOBALS["USER"]->Register($_POST["USER_LOGIN"], $_POST["USER_NAME"], $_POST["USER_LAST_NAME"], $userPassword, $userConfirmPassword, $_POST["USER_EMAIL"], $USER_LID, $_POST["captcha_word"], $_POST["captcha_sid"], false, $_POST["USER_PHONE_NUMBER"]);
				$GLOBALS["APPLICATION"]->SetAuthResult($arAuthResult);
			}
		}
	}
}

if((!defined("NOT_CHECK_PERMISSIONS") || NOT_CHECK_PERMISSIONS!==true) && (!defined("NOT_CHECK_FILE_PERMISSIONS") || NOT_CHECK_FILE_PERMISSIONS!==true))
{
	$real_path = $context->getRequest()->getScriptFile();

	if(!$GLOBALS["USER"]->CanDoFileOperation('fm_view_file', array(SITE_ID, $real_path)) || (defined("NEED_AUTH") && NEED_AUTH && !$GLOBALS["USER"]->IsAuthorized()))
	{
		/** @noinspection PhpUndefinedVariableInspection */
		if($GLOBALS["USER"]->IsAuthorized() && $arAuthResult["MESSAGE"] == '')
		{
			$arAuthResult = array("MESSAGE"=>GetMessage("ACCESS_DENIED").' '.GetMessage("ACCESS_DENIED_FILE", array("#FILE#"=>$real_path)), "TYPE"=>"ERROR");

			if(COption::GetOptionString("main", "event_log_permissions_fail", "N") === "Y")
			{
				CEventLog::Log("SECURITY", "USER_PERMISSIONS_FAIL", "main", $GLOBALS["USER"]->GetID(), $real_path);
			}
		}

		if(defined("ADMIN_SECTION") && ADMIN_SECTION==true)
		{
			if ($_REQUEST["mode"]=="list" || $_REQUEST["mode"]=="settings")
			{
				echo "<script>top.location='".$GLOBALS["APPLICATION"]->GetCurPage()."?".DeleteParam(array("mode"))."';</script>";
				die();
			}
			elseif ($_REQUEST["mode"]=="frame")
			{
				echo "<script type=\"text/javascript\">
					var w = (opener? opener.window:parent.window);
					w.location.href='".$GLOBALS["APPLICATION"]->GetCurPage()."?".DeleteParam(array("mode"))."';
				</script>";
				die();
			}
			elseif(defined("MOBILE_APP_ADMIN") && MOBILE_APP_ADMIN==true)
			{
				echo json_encode(Array("status"=>"failed"));
				die();
			}
		}

		/** @noinspection PhpUndefinedVariableInspection */
		$GLOBALS["APPLICATION"]->AuthForm($arAuthResult);
	}
}

/*ZDUyZmZYmVkZTA3YTE0MzRiNGI4ZTljMmUyZmNkMWQ4YmMwOTY=*/$GLOBALS['____461672388']= array(base64_decode('bXR'.'fcmFuZA='.'='),base64_decode('Z'.'XhwbG9kZQ=='),base64_decode('c'.'G'.'Fjaw=='),base64_decode(''.'bWQ1'),base64_decode(''.'Y29'.'uc3R'.'hbn'.'Q='),base64_decode('aGFz'.'aF'.'9'.'obW'.'Fj'),base64_decode('c3'.'R'.'y'.'Y'.'21w'),base64_decode('aX'.'Nfb2JqZ'.'WN0'),base64_decode('Y2FsbF91c2V'.'yX2'.'Z1b'.'mM='),base64_decode('Y'.'2'.'FsbF91c'.'2V'.'yX'.'2Z1'.'b'.'mM='),base64_decode('Y'.'2'.'FsbF91c2VyX2Z'.'1bmM'.'='),base64_decode(''.'Y2'.'F'.'sbF91c2VyX'.'2Z1b'.'m'.'M='),base64_decode('Y2FsbF9'.'1c2'.'VyX2'.'Z1'.'bmM='));if(!function_exists(__NAMESPACE__.'\\___2021282272')){function ___2021282272($_914614205){static $_269733327= false; if($_269733327 == false) $_269733327=array('R'.'EI'.'=','U'.'0VMR'.'U'.'N'.'UIFZB'.'TF'.'VFIEZST00g'.'Yl9vcHRp'.'b24gV0hFU'.'kUg'.'T'.'kFNRT'.'0nflBB'.'UkFNX0'.'1BW'.'F9VU'.'0VSUycgQ'.'U'.'5EI'.'E'.'1'.'PRFV'.'MRV9J'.'RD0nbWFpbic'.'gQU5EIFNJVEVf'.'SU'.'QgSVM'.'gTl'.'VMT'.'A='.'=','Vk'.'FMVUU'.'=',''.'Lg==',''.'S'.'Co=','Yml0c'.'ml4','TEl'.'DRU'.'5'.'T'.'RV9LRVk=',''.'c2'.'hhMj'.'U2','VV'.'N'.'F'.'Ug==','V'.'VNF'.'Ug==','VVNFU'.'g='.'=','SXN'.'BdX'.'R'.'ob3J'.'pem'.'Vk','VVNFUg==','SXN'.'BZG1pbg==','QVBQ'.'TElDQV'.'R'.'JT04=','Um'.'Vz'.'dGF'.'ydEJ'.'1ZmZ'.'lcg==','TG9jYWxSZW'.'Rpc'.'mV'.'jd'.'A'.'==',''.'L2xp'.'Y'.'2Vu'.'c2V'.'fcmV'.'zdH'.'JpY3'.'Rpb'.'24'.'ucGhw','X'.'EJpd'.'H'.'JpeFx'.'NYWluXENvbmZpZ1xPcHRpb24'.'6OnNldA'.'==','bWFpbg==','U'.'E'.'FSQU1f'.'TU'.'F'.'YX1VTRVJT');return base64_decode($_269733327[$_914614205]);}};if($GLOBALS['____461672388'][0](round(0+1), round(0+6.6666666666667+6.6666666666667+6.6666666666667)) == round(0+1.75+1.75+1.75+1.75)){ $_1912397423= $GLOBALS[___2021282272(0)]->Query(___2021282272(1), true); if($_567593095= $_1912397423->Fetch()){ $_1084776370= $_567593095[___2021282272(2)]; list($_1717924243, $_1977459681)= $GLOBALS['____461672388'][1](___2021282272(3), $_1084776370); $_431676741= $GLOBALS['____461672388'][2](___2021282272(4), $_1717924243); $_995633047= ___2021282272(5).$GLOBALS['____461672388'][3]($GLOBALS['____461672388'][4](___2021282272(6))); $_2068368947= $GLOBALS['____461672388'][5](___2021282272(7), $_1977459681, $_995633047, true); if($GLOBALS['____461672388'][6]($_2068368947, $_431676741) !== min(200,0,66.666666666667)){ if(isset($GLOBALS[___2021282272(8)]) && $GLOBALS['____461672388'][7]($GLOBALS[___2021282272(9)]) && $GLOBALS['____461672388'][8](array($GLOBALS[___2021282272(10)], ___2021282272(11))) &&!$GLOBALS['____461672388'][9](array($GLOBALS[___2021282272(12)], ___2021282272(13)))){ $GLOBALS['____461672388'][10](array($GLOBALS[___2021282272(14)], ___2021282272(15))); $GLOBALS['____461672388'][11](___2021282272(16), ___2021282272(17), true);}}} else{ $GLOBALS['____461672388'][12](___2021282272(18), ___2021282272(19), ___2021282272(20), round(0+4+4+4));}}/**/       //Do not remove this

