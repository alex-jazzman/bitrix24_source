<?php

/**
 * Bitrix Framework
 * @package bitrix
 * @subpackage main
 * @copyright 2001-2024 Bitrix
 */

use Bitrix\Main;
use Bitrix\Main\Session\Legacy\HealerEarlySessionStart;
use Bitrix\Main\DI\ServiceLocator;

require_once __DIR__ . "/start.php";

$application = Main\HttpApplication::getInstance();
$application->initializeExtendedKernel([
	"get" => $_GET,
	"post" => $_POST,
	"files" => $_FILES,
	"cookie" => $_COOKIE,
	"server" => $_SERVER,
	"env" => $_ENV
]);

if (class_exists('\Dev\Main\Migrator\ModuleUpdater'))
{
	\Dev\Main\Migrator\ModuleUpdater::checkUpdates('main', __DIR__);
}

if (!Main\ModuleManager::isModuleInstalled('bitrix24'))
{
	// wwall rules
	(new Main\Security\W\WWall)->handle();

	$application->addBackgroundJob([
		Main\Security\W\WWall::class, 'refreshRules'
	]);

	// vendor security notifications
	$application->addBackgroundJob([
		Main\Security\Notifications\VendorNotifier::class, 'refreshNotifications'
	]);
}

if (defined('SITE_ID'))
{
	define('LANG', SITE_ID);
}

$context = $application->getContext();
$context->initializeCulture(defined('LANG') ? LANG : null, defined('LANGUAGE_ID') ? LANGUAGE_ID : null);

// needs to be after culture initialization
$application->start();

// Register main's services
ServiceLocator::getInstance()->registerByModuleSettings('main');

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
if (!defined('SITE_SERVER_NAME'))
{
	define('SITE_SERVER_NAME', ($site ? $site->getServerName() : ''));
}
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

error_reporting(COption::GetOptionInt("main", "error_reporting", E_COMPILE_ERROR | E_ERROR | E_CORE_ERROR | E_PARSE) & ~E_DEPRECATED & ~E_WARNING & ~E_NOTICE);

if (!defined("BX_COMP_MANAGED_CACHE") && COption::GetOptionString("main", "component_managed_cache_on", "Y") != "N")
{
	define("BX_COMP_MANAGED_CACHE", true);
}

// global functions
require_once __DIR__ . "/filter_tools.php";

/*ZDUyZmZYTRmMDc3MWNlZjBmNzFhYTA3NzkwZDA2YWQ4MzI3MzM=*/$GLOBALS['_____1461195264']= array(base64_decode(''.'R'.'2V0'.'TW9k'.'dW'.'xlRXZlbnR'.'z'),base64_decode('RXhlY3V0ZU1vZHVs'.'ZUV2ZW50R'.'Xg='));$GLOBALS['____851834109']= array(base64_decode('Z'.'GVmaW5l'),base64_decode('Ym'.'FzZ'.'TY0'.'X2R'.'lY29kZQ=='),base64_decode('dW5zZXJpYWxp'.'emU='),base64_decode('a'.'XNf'.'Y'.'XJy'.'YXk='),base64_decode('aW5fYXJyYXk='),base64_decode('c2V'.'yaWFsaXp'.'l'),base64_decode('YmFzZ'.'TY0X2V'.'uY2'.'9k'.'ZQ'.'=='),base64_decode('bWt0'.'aW1l'),base64_decode('ZGF0'.'ZQ=='),base64_decode('ZGF0ZQ=='),base64_decode(''.'c'.'3'.'Ry'.'bGVu'),base64_decode('bWt0'.'aW1l'),base64_decode(''.'ZGF0ZQ=='),base64_decode('ZG'.'F0'.'ZQ='.'='),base64_decode(''.'bWV'.'0aG9kX2V4aXN0'.'cw='.'='),base64_decode(''.'Y2Fs'.'bF'.'91c2VyX'.'2Z1b'.'mNfY'.'XJyYX'.'k='),base64_decode(''.'c3RybG'.'V'.'u'),base64_decode('c2V'.'ya'.'WFsaXpl'),base64_decode('YmFzZ'.'T'.'Y0X2Vu'.'Y29k'.'ZQ='.'='),base64_decode('c3Ryb'.'G'.'Vu'),base64_decode('aXNfYXJyYXk'.'='),base64_decode('c2Vy'.'a'.'W'.'Fsa'.'Xpl'),base64_decode('Y'.'mFzZTY0X2Vu'.'Y2'.'9'.'kZQ=='),base64_decode('c2VyaWF'.'saXpl'),base64_decode('Y'.'mFzZT'.'Y0X2'.'V'.'uY'.'2'.'9kZQ=='),base64_decode('aX'.'NfYXJyYXk='),base64_decode('aXNfYX'.'JyYX'.'k='),base64_decode('a'.'W5f'.'YXJyYXk'.'='),base64_decode('aW5f'.'YX'.'Jy'.'YX'.'k='),base64_decode('bWt0a'.'W1l'),base64_decode('ZG'.'F0ZQ'.'=='),base64_decode('ZGF0ZQ=='),base64_decode('ZGF0'.'ZQ'.'=='),base64_decode('bWt0aW1l'),base64_decode('ZGF0'.'Z'.'Q='.'='),base64_decode('ZGF'.'0'.'ZQ'.'=='),base64_decode('aW'.'5f'.'Y'.'X'.'JyYXk='),base64_decode(''.'c2Vy'.'aWFs'.'aX'.'p'.'l'),base64_decode(''.'YmFzZTY0X2VuY29k'.'Z'.'Q=='),base64_decode(''.'aW'.'50'.'d'.'mFs'),base64_decode('dGltZ'.'Q=='),base64_decode(''.'Z'.'ml'.'s'.'ZV'.'9l'.'eGlzdHM='),base64_decode('c3RyX3'.'JlcG'.'xh'.'Y2'.'U='),base64_decode('Y2xhc3'.'NfZXhp'.'c3R'.'z'),base64_decode('ZG'.'V'.'maW5l'));if(!function_exists(__NAMESPACE__.'\\___1326709325')){function ___1326709325($_611730625){static $_1955605247= false; if($_1955605247 == false) $_1955605247=array(''.'S'.'U5U'.'U'.'kFORVRfRUR'.'J'.'VElPTg==',''.'WQ==','bWFpb'.'g==','fm'.'NwZl9t'.'YXBf'.'d'.'mFsd'.'WU=','','','Y'.'Wxsb3dlZF9jbGFzc2Vz','ZQ==','Zg='.'=','ZQ='.'=','Rg==','WA==','Z'.'g'.'==',''.'bWFpbg'.'==','fmNwZ'.'l9tYXBfdmFsdW'.'U'.'=',''.'UG9ydGFs',''.'R'.'g==','ZQ==','ZQ'.'==','WA==','R'.'g==','RA='.'=','RA==',''.'bQ==','ZA==','W'.'Q==','Zg==','Zg'.'='.'=','Zg='.'=','Zg==','UG9yd'.'GFs','Rg='.'=',''.'ZQ==','ZQ==','WA==','Rg==','RA==','RA='.'=','bQ='.'=',''.'Z'.'A==','WQ==','bWFpbg==','T'.'24=','U2'.'V0dG'.'luZ3N'.'DaGFuZ2U=','Zg'.'==','Zg==','Zg==','Zg==','bW'.'Fpbg==','f'.'m'.'NwZl9'.'tY'.'XBfdm'.'Fs'.'dWU'.'=','ZQ'.'==','Z'.'Q==','RA'.'==','ZQ==','ZQ'.'==','Zg==','Z'.'g'.'==',''.'Zg='.'=',''.'Z'.'Q'.'='.'=','bWFpbg'.'='.'=',''.'fmNw'.'Zl9tYXB'.'f'.'dmFsdWU=','ZQ'.'='.'=','Zg==','Zg==','Zg='.'=','Zg='.'=','bWFpb'.'g==','fm'.'N'.'wZ'.'l9t'.'YXBfd'.'mFsdWU=','ZQ==','Zg==','UG'.'9ydGFs','UG9ydGFs','ZQ='.'=','ZQ'.'==','UG9yd'.'G'.'Fs','Rg'.'='.'=','WA='.'=','Rg='.'=','RA='.'=','ZQ'.'='.'=','Z'.'Q==','RA='.'=',''.'bQ==','ZA==','W'.'Q'.'='.'=','Z'.'Q==','WA==','ZQ==','Rg'.'==','ZQ==','RA==','Z'.'g==','Z'.'Q==','RA==','ZQ='.'=','bQ==',''.'ZA==','WQ==','Zg==','Zg==','Zg='.'=',''.'Zg==','Zg==',''.'Z'.'g'.'==','Zg==','Z'.'g==',''.'bWFp'.'bg==','fmNwZl9'.'tY'.'XBfdmFsd'.'WU=','ZQ='.'=','ZQ==',''.'U'.'G9y'.'dGFs','Rg==',''.'W'.'A==','VFl'.'QRQ==','REFU'.'RQ'.'==',''.'R'.'kVBV'.'F'.'V'.'SR'.'VM=','R'.'VhQSVJ'.'FRA==','VF'.'lQRQ==','RA==','VFJZX0R'.'B'.'WVNfQ'.'09VTlQ=','REFU'.'RQ==','VFJZX0RB'.'WVNfQ09'.'VTlQ'.'=','RVhQ'.'SVJFRA==','RkVBVF'.'VSRVM=','Zg==','Zg==','RE9DVU1FT'.'lR'.'fUk9'.'PVA==','L2Jpd'.'H'.'Jp'.'eC9t'.'b2R1b'.'GVzL'.'w==','L2luc3'.'Rh'.'b'.'G'.'wvaW5kZX'.'guc'.'G'.'hw','Lg==','Xw==','c2VhcmNo','Tg==','','','Q'.'UNU'.'SVZF','WQ==','c2'.'9'.'j'.'aW'.'Fsb'.'mV'.'0d'.'29yaw==','YWxsb'.'3dfZnJpZWxkcw==','W'.'Q==','SUQ=','c29jaWFsbmV'.'0d'.'29'.'yaw==','YW'.'x'.'sb'.'3dfZnJp'.'Z'.'Wx'.'kcw==',''.'SUQ=','c29j'.'aWF'.'sb'.'mV0'.'d2'.'9yaw==','YWxsb3dfZn'.'JpZWxkc'.'w==','Tg'.'='.'=','','','QUNUSVZF','W'.'Q==','c'.'29'.'jaWFsb'.'mV0'.'d'.'2'.'9yaw==','YWx'.'sb3'.'dfbWljc'.'m9i'.'b'.'G9nX'.'3V'.'zZX'.'I=','WQ==','SUQ'.'=','c2'.'9j'.'aWFsb'.'mV0d2'.'9yaw==','Y'.'W'.'xsb3df'.'bWljcm9i'.'bG'.'9nX3'.'VzZ'.'XI'.'=','SUQ'.'=','c29ja'.'WFsbm'.'V0'.'d29'.'yaw==','YWx'.'sb3df'.'bWl'.'jcm9ib'.'G9nX3VzZXI=','c29jaWFsbmV'.'0d29yaw==','Y'.'Wx'.'sb3dfbWljcm9ib'.'G9nX'.'2dyb3V'.'w','WQ==','SUQ=','c29jaWFsbmV0d29yaw==','YWxsb'.'3'.'df'.'bWl'.'jcm'.'9ibG'.'9nX2dyb3Vw','SUQ=','c'.'29j'.'aWFsbmV0d29y'.'aw==','Y'.'Wxsb3dfbWljc'.'m9i'.'bG9nX2d'.'y'.'b3Vw',''.'Tg==','','','Q'.'UN'.'USV'.'ZF','WQ==','c29ja'.'WFsbmV0'.'d'.'29yaw==','YWxs'.'b3df'.'Zmls'.'ZXNfdXNlcg==',''.'WQ==','SU'.'Q'.'=','c2'.'9j'.'aWFsb'.'mV0d29ya'.'w'.'='.'=',''.'YWxsb3dfZmlsZXNfd'.'XN'.'lcg==','SUQ=','c29jaW'.'Fs'.'bmV0'.'d2'.'9yaw'.'==','YWxsb3d'.'fZmlsZ'.'XNf'.'dXNl'.'cg'.'==','T'.'g='.'=','','','QUNUSVZF',''.'W'.'Q==','c29ja'.'WF'.'sbmV0'.'d29yaw==','YWxs'.'b'.'3dfY'.'m'.'x'.'vZ191c2Vy','WQ==','SU'.'Q'.'=',''.'c29jaW'.'F'.'sbmV0d29'.'yaw='.'=','YWxs'.'b3df'.'YmxvZ'.'191c2Vy','SUQ=','c29jaWFs'.'bm'.'V0d29yaw==','YWx'.'sb3d'.'fYm'.'xvZ191c'.'2Vy','Tg==','','','QU'.'NUSVZF','WQ==','c29jaWF'.'sbmV0d29yaw==','YW'.'x'.'sb3d'.'fc'.'Ghvd'.'G9'.'fdXNlcg'.'==','W'.'Q'.'='.'=','SUQ=',''.'c'.'29jaW'.'F'.'sbmV0d29yaw==','YWxsb3dfcGhvdG9'.'fdXNlcg==','SUQ'.'=','c2'.'9jaWFsbmV0d29yaw'.'==','YWxsb3dfcG'.'h'.'vdG9fdXNlcg==','Tg'.'==','','',''.'QU'.'NUSVZF','W'.'Q==','c29jaW'.'FsbmV0d29yaw==',''.'Y'.'W'.'xsb3dfZm9'.'yd'.'W1'.'fdXNl'.'cg==','W'.'Q==','SUQ=','c29ja'.'WFsbmV'.'0d29yaw'.'==','YWx'.'sb3df'.'Zm9'.'ydW'.'1fdXN'.'lcg==','SUQ=','c29jaWFsb'.'mV0d29yaw='.'=','YWxsb3dfZm'.'9'.'y'.'dW1fdXN'.'l'.'cg==',''.'Tg'.'==','','','QUNUS'.'VZF','WQ==',''.'c29'.'jaWFsb'.'m'.'V0d29yaw='.'=','YWxsb3'.'dfdG'.'Fza3'.'NfdX'.'Nlc'.'g==','W'.'Q==','SUQ=','c'.'29jaWF'.'sbm'.'V0d29yaw='.'=','YWxs'.'b3'.'dfd'.'G'.'Fza3N'.'fdXNlc'.'g==','SUQ=',''.'c29jaWFsbmV0d29yaw'.'==','YWx'.'sb'.'3d'.'fdGFza3'.'N'.'fdXNl'.'cg='.'=','c29j'.'aWFsbm'.'V0d29yaw==','YWxsb3df'.'dGF'.'za3N'.'fZ3J'.'vdXA=','WQ==',''.'SUQ=','c29'.'ja'.'WFsbmV'.'0'.'d29yaw='.'=','YWxsb3dfd'.'GFza3NfZ3JvdX'.'A=',''.'SUQ=','c29j'.'a'.'WFsb'.'mV0d29y'.'aw==','YW'.'xsb3dfd'.'GFz'.'a3NfZ3'.'Jv'.'d'.'XA=',''.'d'.'GF'.'za3M'.'=','Tg==','','','QU'.'NUS'.'V'.'ZF','WQ==','c'.'29jaWFsb'.'mV0d29'.'ya'.'w'.'='.'=','YWxs'.'b3d'.'fY2FsZW5kYXJfdXNlcg==',''.'WQ'.'='.'=','SUQ'.'=','c29ja'.'W'.'Fsb'.'m'.'V0d2'.'9'.'yaw==','YWx'.'s'.'b3'.'dfY2FsZW'.'5kY'.'XJfdXN'.'lc'.'g==',''.'SUQ=','c29jaWF'.'sbmV0d29yaw==','YW'.'xsb3dfY2FsZW5'.'kY'.'XJ'.'fdXN'.'lcg='.'=','c2'.'9jaWFsbmV0d29yaw==',''.'YWxsb3dfY2F'.'sZW'.'5kY'.'XJf'.'Z3JvdXA=','WQ'.'==','SUQ=','c29jaWFsbmV0'.'d29yaw'.'==','YWxs'.'b3dfY2FsZW'.'5kYXJfZ3JvdXA'.'=','SUQ'.'=','c2'.'9'.'jaWFs'.'bmV'.'0'.'d'.'29'.'y'.'aw==',''.'YWxsb3dfY2F'.'sZW5'.'kYXJfZ3Jvd'.'X'.'A=','QU'.'NU'.'SV'.'Z'.'F','WQ==',''.'Tg==',''.'ZXh'.'0cmF'.'uZX'.'Q=','aWJs'.'b2Nr','T25B'.'ZnRlckl'.'CbG9ja0VsZW'.'1'.'lbn'.'RVcGRhdGU=','aW'.'50cmFuZXQ'.'=','Q0lu'.'dHJhbmV0RX'.'Zlbn'.'RIYW5kbG'.'Vycw==','U1'.'BSZ'.'Wd'.'pc'.'3RlclVwZGF0'.'ZWRJdGV'.'t','Q0'.'ludHJhb'.'mV0U2h'.'hcmV'.'wb2lud'.'Do6'.'QWdlbnRMaXN0cygpOw==','aW5'.'0cmFuZXQ=','Tg==','Q0'.'l'.'udHJhb'.'mV0U2hhcmV'.'wb2l'.'udDo6Q'.'WdlbnR'.'R'.'d'.'WV1'.'ZSgp'.'O'.'w==','aW5'.'0cmFuZXQ=','Tg==','Q'.'0lud'.'HJhbm'.'V0U'.'2'.'hhcmVwb'.'2lu'.'d'.'Do6Q'.'Wdlbn'.'RVcGRhdG'.'U'.'oKT'.'s=','aW'.'50c'.'mFuZ'.'XQ'.'=','Tg==','aWJsb2'.'Nr','T25B'.'Z'.'nR'.'lckl'.'CbG'.'9ja0Vs'.'Z'.'W'.'1'.'lbnRBZG'.'Q=','aW50'.'c'.'mFuZXQ=','Q0l'.'udHJh'.'bmV'.'0'.'R'.'XZl'.'bnRIYW5kbGVyc'.'w='.'=','U'.'1'.'BSZWdpc3Rlcl'.'VwZGF0ZWR'.'J'.'dG'.'V'.'t','aWJ'.'sb2Nr','T25BZ'.'nRlcklC'.'bG9ja0'.'VsZ'.'W1lb'.'nRV'.'cGRhdGU'.'=','aW50'.'cmF'.'uZXQ'.'=','Q0ludHJh'.'b'.'mV0RX'.'ZlbnRIYW5kbG'.'Vyc'.'w==','U1'.'BSZWd'.'pc3Rlcl'.'Vw'.'ZGF0ZWRJdGVt','Q'.'0lud'.'H'.'J'.'hbm'.'V0U2hhc'.'mVwb'.'2ludD'.'o6QWd'.'lbnRMaXN0cy'.'gp'.'Ow'.'==',''.'a'.'W50cmFuZ'.'X'.'Q=','Q0ludHJ'.'h'.'bm'.'V0U'.'2hhc'.'mVwb2ludDo'.'6Q'.'Wdlb'.'nRRdWV'.'1ZSgpOw==','aW50cmF'.'uZXQ'.'=','Q0'.'lu'.'dHJhbm'.'V'.'0U2hh'.'cmVwb2ludDo6QWdlbnRVcGRhd'.'GUoK'.'T'.'s=',''.'aW50cm'.'F'.'uZX'.'Q=','Y3'.'J'.'t','bWFpbg='.'=','T2'.'5CZW'.'Z'.'vcmVQcm9sb2c=','b'.'WF'.'pbg==','Q1dpemF'.'y'.'ZFNvbFBhbm'.'VsSW'.'50c'.'m'.'FuZX'.'Q'.'=','U2hvd1Bhbm'.'Vs',''.'L21v'.'ZH'.'V'.'sZXM'.'v'.'aW'.'5'.'0c'.'mFuZXQvc'.'GFuZWxfYn'.'V0'.'dG'.'9uLnBocA==',''.'RU5DT0'.'RF','WQ==');return base64_decode($_1955605247[$_611730625]);}};$GLOBALS['____851834109'][0](___1326709325(0), ___1326709325(1));class CBXFeatures{ private static $_1452026573= 30; private static $_292697024= array( "Portal" => array( "CompanyCalendar", "CompanyPhoto", "CompanyVideo", "CompanyCareer", "StaffChanges", "StaffAbsence", "CommonDocuments", "MeetingRoomBookingSystem", "Wiki", "Learning", "Vote", "WebLink", "Subscribe", "Friends", "PersonalFiles", "PersonalBlog", "PersonalPhoto", "PersonalForum", "Blog", "Forum", "Gallery", "Board", "MicroBlog", "WebMessenger",), "Communications" => array( "Tasks", "Calendar", "Workgroups", "Jabber", "VideoConference", "Extranet", "SMTP", "Requests", "DAV", "intranet_sharepoint", "timeman", "Idea", "Meeting", "EventList", "Salary", "XDImport",), "Enterprise" => array( "BizProc", "Lists", "Support", "Analytics", "crm", "Controller", "LdapUnlimitedUsers",), "Holding" => array( "Cluster", "MultiSites",),); private static $_202573608= null; private static $_1501783212= null; private static function __287986630(){ if(self::$_202573608 === null){ self::$_202573608= array(); foreach(self::$_292697024 as $_1599389219 => $_1700387069){ foreach($_1700387069 as $_1132646707) self::$_202573608[$_1132646707]= $_1599389219;}} if(self::$_1501783212 === null){ self::$_1501783212= array(); $_1012823440= COption::GetOptionString(___1326709325(2), ___1326709325(3), ___1326709325(4)); if($_1012823440 != ___1326709325(5)){ $_1012823440= $GLOBALS['____851834109'][1]($_1012823440); $_1012823440= $GLOBALS['____851834109'][2]($_1012823440,[___1326709325(6) => false]); if($GLOBALS['____851834109'][3]($_1012823440)){ self::$_1501783212= $_1012823440;}} if(empty(self::$_1501783212)){ self::$_1501783212= array(___1326709325(7) => array(), ___1326709325(8) => array());}}} public static function InitiateEditionsSettings($_1507760451){ self::__287986630(); $_1064370505= array(); foreach(self::$_292697024 as $_1599389219 => $_1700387069){ $_843232623= $GLOBALS['____851834109'][4]($_1599389219, $_1507760451); self::$_1501783212[___1326709325(9)][$_1599389219]=($_843232623? array(___1326709325(10)): array(___1326709325(11))); foreach($_1700387069 as $_1132646707){ self::$_1501783212[___1326709325(12)][$_1132646707]= $_843232623; if(!$_843232623) $_1064370505[]= array($_1132646707, false);}} $_600213877= $GLOBALS['____851834109'][5](self::$_1501783212); $_600213877= $GLOBALS['____851834109'][6]($_600213877); COption::SetOptionString(___1326709325(13), ___1326709325(14), $_600213877); foreach($_1064370505 as $_244556825) self::__442506546($_244556825[(1352/2-676)], $_244556825[round(0+1)]);} public static function IsFeatureEnabled($_1132646707){ if($_1132646707 == '') return true; self::__287986630(); if(!isset(self::$_202573608[$_1132646707])) return true; if(self::$_202573608[$_1132646707] == ___1326709325(15)) $_2046005379= array(___1326709325(16)); elseif(isset(self::$_1501783212[___1326709325(17)][self::$_202573608[$_1132646707]])) $_2046005379= self::$_1501783212[___1326709325(18)][self::$_202573608[$_1132646707]]; else $_2046005379= array(___1326709325(19)); if($_2046005379[(1164/2-582)] != ___1326709325(20) && $_2046005379[min(24,0,8)] != ___1326709325(21)){ return false;} elseif($_2046005379[(1096/2-548)] == ___1326709325(22)){ if($_2046005379[round(0+0.33333333333333+0.33333333333333+0.33333333333333)]< $GLOBALS['____851834109'][7]((776-2*388),(219*2-438),(788-2*394), Date(___1326709325(23)), $GLOBALS['____851834109'][8](___1326709325(24))- self::$_1452026573, $GLOBALS['____851834109'][9](___1326709325(25)))){ if(!isset($_2046005379[round(0+0.5+0.5+0.5+0.5)]) ||!$_2046005379[round(0+1+1)]) self::__612588983(self::$_202573608[$_1132646707]); return false;}} return!isset(self::$_1501783212[___1326709325(26)][$_1132646707]) || self::$_1501783212[___1326709325(27)][$_1132646707];} public static function IsFeatureInstalled($_1132646707){ if($GLOBALS['____851834109'][10]($_1132646707) <= 0) return true; self::__287986630(); return(isset(self::$_1501783212[___1326709325(28)][$_1132646707]) && self::$_1501783212[___1326709325(29)][$_1132646707]);} public static function IsFeatureEditable($_1132646707){ if($_1132646707 == '') return true; self::__287986630(); if(!isset(self::$_202573608[$_1132646707])) return true; if(self::$_202573608[$_1132646707] == ___1326709325(30)) $_2046005379= array(___1326709325(31)); elseif(isset(self::$_1501783212[___1326709325(32)][self::$_202573608[$_1132646707]])) $_2046005379= self::$_1501783212[___1326709325(33)][self::$_202573608[$_1132646707]]; else $_2046005379= array(___1326709325(34)); if($_2046005379[min(212,0,70.666666666667)] != ___1326709325(35) && $_2046005379[(1100/2-550)] != ___1326709325(36)){ return false;} elseif($_2046005379[(162*2-324)] == ___1326709325(37)){ if($_2046005379[round(0+0.33333333333333+0.33333333333333+0.33333333333333)]< $GLOBALS['____851834109'][11]((180*2-360),(1040/2-520),(184*2-368), Date(___1326709325(38)), $GLOBALS['____851834109'][12](___1326709325(39))- self::$_1452026573, $GLOBALS['____851834109'][13](___1326709325(40)))){ if(!isset($_2046005379[round(0+0.66666666666667+0.66666666666667+0.66666666666667)]) ||!$_2046005379[round(0+1+1)]) self::__612588983(self::$_202573608[$_1132646707]); return false;}} return true;} private static function __442506546($_1132646707, $_1952377408){ if($GLOBALS['____851834109'][14]("CBXFeatures", "On".$_1132646707."SettingsChange")) $GLOBALS['____851834109'][15](array("CBXFeatures", "On".$_1132646707."SettingsChange"), array($_1132646707, $_1952377408)); $_2033291435= $GLOBALS['_____1461195264'][0](___1326709325(41), ___1326709325(42).$_1132646707.___1326709325(43)); while($_193790354= $_2033291435->Fetch()) $GLOBALS['_____1461195264'][1]($_193790354, array($_1132646707, $_1952377408));} public static function SetFeatureEnabled($_1132646707, $_1952377408= true, $_1052076973= true){ if($GLOBALS['____851834109'][16]($_1132646707) <= 0) return; if(!self::IsFeatureEditable($_1132646707)) $_1952377408= false; $_1952377408= (bool)$_1952377408; self::__287986630(); $_1886218608=(!isset(self::$_1501783212[___1326709325(44)][$_1132646707]) && $_1952377408 || isset(self::$_1501783212[___1326709325(45)][$_1132646707]) && $_1952377408 != self::$_1501783212[___1326709325(46)][$_1132646707]); self::$_1501783212[___1326709325(47)][$_1132646707]= $_1952377408; $_600213877= $GLOBALS['____851834109'][17](self::$_1501783212); $_600213877= $GLOBALS['____851834109'][18]($_600213877); COption::SetOptionString(___1326709325(48), ___1326709325(49), $_600213877); if($_1886218608 && $_1052076973) self::__442506546($_1132646707, $_1952377408);} private static function __612588983($_1599389219){ if($GLOBALS['____851834109'][19]($_1599389219) <= 0 || $_1599389219 == "Portal") return; self::__287986630(); if(!isset(self::$_1501783212[___1326709325(50)][$_1599389219]) || self::$_1501783212[___1326709325(51)][$_1599389219][(808-2*404)] != ___1326709325(52)) return; if(isset(self::$_1501783212[___1326709325(53)][$_1599389219][round(0+0.4+0.4+0.4+0.4+0.4)]) && self::$_1501783212[___1326709325(54)][$_1599389219][round(0+0.5+0.5+0.5+0.5)]) return; $_1064370505= array(); if(isset(self::$_292697024[$_1599389219]) && $GLOBALS['____851834109'][20](self::$_292697024[$_1599389219])){ foreach(self::$_292697024[$_1599389219] as $_1132646707){ if(isset(self::$_1501783212[___1326709325(55)][$_1132646707]) && self::$_1501783212[___1326709325(56)][$_1132646707]){ self::$_1501783212[___1326709325(57)][$_1132646707]= false; $_1064370505[]= array($_1132646707, false);}} self::$_1501783212[___1326709325(58)][$_1599389219][round(0+0.5+0.5+0.5+0.5)]= true;} $_600213877= $GLOBALS['____851834109'][21](self::$_1501783212); $_600213877= $GLOBALS['____851834109'][22]($_600213877); COption::SetOptionString(___1326709325(59), ___1326709325(60), $_600213877); foreach($_1064370505 as $_244556825) self::__442506546($_244556825[(159*2-318)], $_244556825[round(0+1)]);} public static function ModifyFeaturesSettings($_1507760451, $_1700387069){ self::__287986630(); foreach($_1507760451 as $_1599389219 => $_550445503) self::$_1501783212[___1326709325(61)][$_1599389219]= $_550445503; $_1064370505= array(); foreach($_1700387069 as $_1132646707 => $_1952377408){ if(!isset(self::$_1501783212[___1326709325(62)][$_1132646707]) && $_1952377408 || isset(self::$_1501783212[___1326709325(63)][$_1132646707]) && $_1952377408 != self::$_1501783212[___1326709325(64)][$_1132646707]) $_1064370505[]= array($_1132646707, $_1952377408); self::$_1501783212[___1326709325(65)][$_1132646707]= $_1952377408;} $_600213877= $GLOBALS['____851834109'][23](self::$_1501783212); $_600213877= $GLOBALS['____851834109'][24]($_600213877); COption::SetOptionString(___1326709325(66), ___1326709325(67), $_600213877); self::$_1501783212= false; foreach($_1064370505 as $_244556825) self::__442506546($_244556825[min(114,0,38)], $_244556825[round(0+0.33333333333333+0.33333333333333+0.33333333333333)]);} public static function SaveFeaturesSettings($_2079028528, $_426736917){ self::__287986630(); $_1498047950= array(___1326709325(68) => array(), ___1326709325(69) => array()); if(!$GLOBALS['____851834109'][25]($_2079028528)) $_2079028528= array(); if(!$GLOBALS['____851834109'][26]($_426736917)) $_426736917= array(); if(!$GLOBALS['____851834109'][27](___1326709325(70), $_2079028528)) $_2079028528[]= ___1326709325(71); foreach(self::$_292697024 as $_1599389219 => $_1700387069){ if(isset(self::$_1501783212[___1326709325(72)][$_1599389219])){ $_1508768558= self::$_1501783212[___1326709325(73)][$_1599389219];} else{ $_1508768558=($_1599389219 == ___1326709325(74)? array(___1326709325(75)): array(___1326709325(76)));} if($_1508768558[(237*2-474)] == ___1326709325(77) || $_1508768558[(770-2*385)] == ___1326709325(78)){ $_1498047950[___1326709325(79)][$_1599389219]= $_1508768558;} else{ if($GLOBALS['____851834109'][28]($_1599389219, $_2079028528)) $_1498047950[___1326709325(80)][$_1599389219]= array(___1326709325(81), $GLOBALS['____851834109'][29](min(78,0,26),(143*2-286),(916-2*458), $GLOBALS['____851834109'][30](___1326709325(82)), $GLOBALS['____851834109'][31](___1326709325(83)), $GLOBALS['____851834109'][32](___1326709325(84)))); else $_1498047950[___1326709325(85)][$_1599389219]= array(___1326709325(86));}} $_1064370505= array(); foreach(self::$_202573608 as $_1132646707 => $_1599389219){ if($_1498047950[___1326709325(87)][$_1599389219][(758-2*379)] != ___1326709325(88) && $_1498047950[___1326709325(89)][$_1599389219][(818-2*409)] != ___1326709325(90)){ $_1498047950[___1326709325(91)][$_1132646707]= false;} else{ if($_1498047950[___1326709325(92)][$_1599389219][(906-2*453)] == ___1326709325(93) && $_1498047950[___1326709325(94)][$_1599389219][round(0+0.25+0.25+0.25+0.25)]< $GLOBALS['____851834109'][33]((159*2-318),(768-2*384),(842-2*421), Date(___1326709325(95)), $GLOBALS['____851834109'][34](___1326709325(96))- self::$_1452026573, $GLOBALS['____851834109'][35](___1326709325(97)))) $_1498047950[___1326709325(98)][$_1132646707]= false; else $_1498047950[___1326709325(99)][$_1132646707]= $GLOBALS['____851834109'][36]($_1132646707, $_426736917); if(!isset(self::$_1501783212[___1326709325(100)][$_1132646707]) && $_1498047950[___1326709325(101)][$_1132646707] || isset(self::$_1501783212[___1326709325(102)][$_1132646707]) && $_1498047950[___1326709325(103)][$_1132646707] != self::$_1501783212[___1326709325(104)][$_1132646707]) $_1064370505[]= array($_1132646707, $_1498047950[___1326709325(105)][$_1132646707]);}} $_600213877= $GLOBALS['____851834109'][37]($_1498047950); $_600213877= $GLOBALS['____851834109'][38]($_600213877); COption::SetOptionString(___1326709325(106), ___1326709325(107), $_600213877); self::$_1501783212= false; foreach($_1064370505 as $_244556825) self::__442506546($_244556825[(854-2*427)], $_244556825[round(0+1)]);} public static function GetFeaturesList(){ self::__287986630(); $_988382027= array(); foreach(self::$_292697024 as $_1599389219 => $_1700387069){ if(isset(self::$_1501783212[___1326709325(108)][$_1599389219])){ $_1508768558= self::$_1501783212[___1326709325(109)][$_1599389219];} else{ $_1508768558=($_1599389219 == ___1326709325(110)? array(___1326709325(111)): array(___1326709325(112)));} $_988382027[$_1599389219]= array( ___1326709325(113) => $_1508768558[(208*2-416)], ___1326709325(114) => $_1508768558[round(0+0.33333333333333+0.33333333333333+0.33333333333333)], ___1326709325(115) => array(),); $_988382027[$_1599389219][___1326709325(116)]= false; if($_988382027[$_1599389219][___1326709325(117)] == ___1326709325(118)){ $_988382027[$_1599389219][___1326709325(119)]= $GLOBALS['____851834109'][39](($GLOBALS['____851834109'][40]()- $_988382027[$_1599389219][___1326709325(120)])/ round(0+21600+21600+21600+21600)); if($_988382027[$_1599389219][___1326709325(121)]> self::$_1452026573) $_988382027[$_1599389219][___1326709325(122)]= true;} foreach($_1700387069 as $_1132646707) $_988382027[$_1599389219][___1326709325(123)][$_1132646707]=(!isset(self::$_1501783212[___1326709325(124)][$_1132646707]) || self::$_1501783212[___1326709325(125)][$_1132646707]);} return $_988382027;} private static function __2142786170($_392884773, $_772326020){ if(IsModuleInstalled($_392884773) == $_772326020) return true; $_438840033= $_SERVER[___1326709325(126)].___1326709325(127).$_392884773.___1326709325(128); if(!$GLOBALS['____851834109'][41]($_438840033)) return false; include_once($_438840033); $_1220855110= $GLOBALS['____851834109'][42](___1326709325(129), ___1326709325(130), $_392884773); if(!$GLOBALS['____851834109'][43]($_1220855110)) return false; $_815940766= new $_1220855110; if($_772326020){ if(!$_815940766->InstallDB()) return false; $_815940766->InstallEvents(); if(!$_815940766->InstallFiles()) return false;} else{ if(CModule::IncludeModule(___1326709325(131))) CSearch::DeleteIndex($_392884773); UnRegisterModule($_392884773);} return true;} protected static function OnRequestsSettingsChange($_1132646707, $_1952377408){ self::__2142786170("form", $_1952377408);} protected static function OnLearningSettingsChange($_1132646707, $_1952377408){ self::__2142786170("learning", $_1952377408);} protected static function OnJabberSettingsChange($_1132646707, $_1952377408){ self::__2142786170("xmpp", $_1952377408);} protected static function OnVideoConferenceSettingsChange($_1132646707, $_1952377408){} protected static function OnBizProcSettingsChange($_1132646707, $_1952377408){ self::__2142786170("bizprocdesigner", $_1952377408);} protected static function OnListsSettingsChange($_1132646707, $_1952377408){ self::__2142786170("lists", $_1952377408);} protected static function OnWikiSettingsChange($_1132646707, $_1952377408){ self::__2142786170("wiki", $_1952377408);} protected static function OnSupportSettingsChange($_1132646707, $_1952377408){ self::__2142786170("support", $_1952377408);} protected static function OnControllerSettingsChange($_1132646707, $_1952377408){ self::__2142786170("controller", $_1952377408);} protected static function OnAnalyticsSettingsChange($_1132646707, $_1952377408){ self::__2142786170("statistic", $_1952377408);} protected static function OnVoteSettingsChange($_1132646707, $_1952377408){ self::__2142786170("vote", $_1952377408);} protected static function OnFriendsSettingsChange($_1132646707, $_1952377408){ if($_1952377408) $_1370823012= "Y"; else $_1370823012= ___1326709325(132); $_1318282688= CSite::GetList(___1326709325(133), ___1326709325(134), array(___1326709325(135) => ___1326709325(136))); while($_837952038= $_1318282688->Fetch()){ if(COption::GetOptionString(___1326709325(137), ___1326709325(138), ___1326709325(139), $_837952038[___1326709325(140)]) != $_1370823012){ COption::SetOptionString(___1326709325(141), ___1326709325(142), $_1370823012, false, $_837952038[___1326709325(143)]); COption::SetOptionString(___1326709325(144), ___1326709325(145), $_1370823012);}}} protected static function OnMicroBlogSettingsChange($_1132646707, $_1952377408){ if($_1952377408) $_1370823012= "Y"; else $_1370823012= ___1326709325(146); $_1318282688= CSite::GetList(___1326709325(147), ___1326709325(148), array(___1326709325(149) => ___1326709325(150))); while($_837952038= $_1318282688->Fetch()){ if(COption::GetOptionString(___1326709325(151), ___1326709325(152), ___1326709325(153), $_837952038[___1326709325(154)]) != $_1370823012){ COption::SetOptionString(___1326709325(155), ___1326709325(156), $_1370823012, false, $_837952038[___1326709325(157)]); COption::SetOptionString(___1326709325(158), ___1326709325(159), $_1370823012);} if(COption::GetOptionString(___1326709325(160), ___1326709325(161), ___1326709325(162), $_837952038[___1326709325(163)]) != $_1370823012){ COption::SetOptionString(___1326709325(164), ___1326709325(165), $_1370823012, false, $_837952038[___1326709325(166)]); COption::SetOptionString(___1326709325(167), ___1326709325(168), $_1370823012);}}} protected static function OnPersonalFilesSettingsChange($_1132646707, $_1952377408){ if($_1952377408) $_1370823012= "Y"; else $_1370823012= ___1326709325(169); $_1318282688= CSite::GetList(___1326709325(170), ___1326709325(171), array(___1326709325(172) => ___1326709325(173))); while($_837952038= $_1318282688->Fetch()){ if(COption::GetOptionString(___1326709325(174), ___1326709325(175), ___1326709325(176), $_837952038[___1326709325(177)]) != $_1370823012){ COption::SetOptionString(___1326709325(178), ___1326709325(179), $_1370823012, false, $_837952038[___1326709325(180)]); COption::SetOptionString(___1326709325(181), ___1326709325(182), $_1370823012);}}} protected static function OnPersonalBlogSettingsChange($_1132646707, $_1952377408){ if($_1952377408) $_1370823012= "Y"; else $_1370823012= ___1326709325(183); $_1318282688= CSite::GetList(___1326709325(184), ___1326709325(185), array(___1326709325(186) => ___1326709325(187))); while($_837952038= $_1318282688->Fetch()){ if(COption::GetOptionString(___1326709325(188), ___1326709325(189), ___1326709325(190), $_837952038[___1326709325(191)]) != $_1370823012){ COption::SetOptionString(___1326709325(192), ___1326709325(193), $_1370823012, false, $_837952038[___1326709325(194)]); COption::SetOptionString(___1326709325(195), ___1326709325(196), $_1370823012);}}} protected static function OnPersonalPhotoSettingsChange($_1132646707, $_1952377408){ if($_1952377408) $_1370823012= "Y"; else $_1370823012= ___1326709325(197); $_1318282688= CSite::GetList(___1326709325(198), ___1326709325(199), array(___1326709325(200) => ___1326709325(201))); while($_837952038= $_1318282688->Fetch()){ if(COption::GetOptionString(___1326709325(202), ___1326709325(203), ___1326709325(204), $_837952038[___1326709325(205)]) != $_1370823012){ COption::SetOptionString(___1326709325(206), ___1326709325(207), $_1370823012, false, $_837952038[___1326709325(208)]); COption::SetOptionString(___1326709325(209), ___1326709325(210), $_1370823012);}}} protected static function OnPersonalForumSettingsChange($_1132646707, $_1952377408){ if($_1952377408) $_1370823012= "Y"; else $_1370823012= ___1326709325(211); $_1318282688= CSite::GetList(___1326709325(212), ___1326709325(213), array(___1326709325(214) => ___1326709325(215))); while($_837952038= $_1318282688->Fetch()){ if(COption::GetOptionString(___1326709325(216), ___1326709325(217), ___1326709325(218), $_837952038[___1326709325(219)]) != $_1370823012){ COption::SetOptionString(___1326709325(220), ___1326709325(221), $_1370823012, false, $_837952038[___1326709325(222)]); COption::SetOptionString(___1326709325(223), ___1326709325(224), $_1370823012);}}} protected static function OnTasksSettingsChange($_1132646707, $_1952377408){ if($_1952377408) $_1370823012= "Y"; else $_1370823012= ___1326709325(225); $_1318282688= CSite::GetList(___1326709325(226), ___1326709325(227), array(___1326709325(228) => ___1326709325(229))); while($_837952038= $_1318282688->Fetch()){ if(COption::GetOptionString(___1326709325(230), ___1326709325(231), ___1326709325(232), $_837952038[___1326709325(233)]) != $_1370823012){ COption::SetOptionString(___1326709325(234), ___1326709325(235), $_1370823012, false, $_837952038[___1326709325(236)]); COption::SetOptionString(___1326709325(237), ___1326709325(238), $_1370823012);} if(COption::GetOptionString(___1326709325(239), ___1326709325(240), ___1326709325(241), $_837952038[___1326709325(242)]) != $_1370823012){ COption::SetOptionString(___1326709325(243), ___1326709325(244), $_1370823012, false, $_837952038[___1326709325(245)]); COption::SetOptionString(___1326709325(246), ___1326709325(247), $_1370823012);}} self::__2142786170(___1326709325(248), $_1952377408);} protected static function OnCalendarSettingsChange($_1132646707, $_1952377408){ if($_1952377408) $_1370823012= "Y"; else $_1370823012= ___1326709325(249); $_1318282688= CSite::GetList(___1326709325(250), ___1326709325(251), array(___1326709325(252) => ___1326709325(253))); while($_837952038= $_1318282688->Fetch()){ if(COption::GetOptionString(___1326709325(254), ___1326709325(255), ___1326709325(256), $_837952038[___1326709325(257)]) != $_1370823012){ COption::SetOptionString(___1326709325(258), ___1326709325(259), $_1370823012, false, $_837952038[___1326709325(260)]); COption::SetOptionString(___1326709325(261), ___1326709325(262), $_1370823012);} if(COption::GetOptionString(___1326709325(263), ___1326709325(264), ___1326709325(265), $_837952038[___1326709325(266)]) != $_1370823012){ COption::SetOptionString(___1326709325(267), ___1326709325(268), $_1370823012, false, $_837952038[___1326709325(269)]); COption::SetOptionString(___1326709325(270), ___1326709325(271), $_1370823012);}}} protected static function OnSMTPSettingsChange($_1132646707, $_1952377408){ self::__2142786170("mail", $_1952377408);} protected static function OnExtranetSettingsChange($_1132646707, $_1952377408){ $_994570034= COption::GetOptionString("extranet", "extranet_site", ""); if($_994570034){ $_1376895456= new CSite; $_1376895456->Update($_994570034, array(___1326709325(272) =>($_1952377408? ___1326709325(273): ___1326709325(274))));} self::__2142786170(___1326709325(275), $_1952377408);} protected static function OnDAVSettingsChange($_1132646707, $_1952377408){ self::__2142786170("dav", $_1952377408);} protected static function OntimemanSettingsChange($_1132646707, $_1952377408){ self::__2142786170("timeman", $_1952377408);} protected static function Onintranet_sharepointSettingsChange($_1132646707, $_1952377408){ if($_1952377408){ RegisterModuleDependences("iblock", "OnAfterIBlockElementAdd", "intranet", "CIntranetEventHandlers", "SPRegisterUpdatedItem"); RegisterModuleDependences(___1326709325(276), ___1326709325(277), ___1326709325(278), ___1326709325(279), ___1326709325(280)); CAgent::AddAgent(___1326709325(281), ___1326709325(282), ___1326709325(283), round(0+100+100+100+100+100)); CAgent::AddAgent(___1326709325(284), ___1326709325(285), ___1326709325(286), round(0+75+75+75+75)); CAgent::AddAgent(___1326709325(287), ___1326709325(288), ___1326709325(289), round(0+900+900+900+900));} else{ UnRegisterModuleDependences(___1326709325(290), ___1326709325(291), ___1326709325(292), ___1326709325(293), ___1326709325(294)); UnRegisterModuleDependences(___1326709325(295), ___1326709325(296), ___1326709325(297), ___1326709325(298), ___1326709325(299)); CAgent::RemoveAgent(___1326709325(300), ___1326709325(301)); CAgent::RemoveAgent(___1326709325(302), ___1326709325(303)); CAgent::RemoveAgent(___1326709325(304), ___1326709325(305));}} protected static function OncrmSettingsChange($_1132646707, $_1952377408){ if($_1952377408) COption::SetOptionString("crm", "form_features", "Y"); self::__2142786170(___1326709325(306), $_1952377408);} protected static function OnClusterSettingsChange($_1132646707, $_1952377408){ self::__2142786170("cluster", $_1952377408);} protected static function OnMultiSitesSettingsChange($_1132646707, $_1952377408){ if($_1952377408) RegisterModuleDependences("main", "OnBeforeProlog", "main", "CWizardSolPanelIntranet", "ShowPanel", 100, "/modules/intranet/panel_button.php"); else UnRegisterModuleDependences(___1326709325(307), ___1326709325(308), ___1326709325(309), ___1326709325(310), ___1326709325(311), ___1326709325(312));} protected static function OnIdeaSettingsChange($_1132646707, $_1952377408){ self::__2142786170("idea", $_1952377408);} protected static function OnMeetingSettingsChange($_1132646707, $_1952377408){ self::__2142786170("meeting", $_1952377408);} protected static function OnXDImportSettingsChange($_1132646707, $_1952377408){ self::__2142786170("xdimport", $_1952377408);}} $GLOBALS['____851834109'][44](___1326709325(313), ___1326709325(314));/**/			//Do not remove this

// Component 2.0 template engines
$GLOBALS['arCustomTemplateEngines'] = [];

// User fields manager
$GLOBALS['USER_FIELD_MANAGER'] = new CUserTypeManager;

if (file_exists(($_fname = __DIR__ . "/classes/general/update_db_updater.php")))
{
	$US_HOST_PROCESS_MAIN = false;
	include $_fname;
}

if (($_fname = getLocalPath("init.php")) !== false)
{
	include_once $_SERVER["DOCUMENT_ROOT"] . $_fname;
}

if (($_fname = getLocalPath("php_interface/init.php", BX_PERSONAL_ROOT)) !== false)
{
	include_once $_SERVER["DOCUMENT_ROOT"] . $_fname;
}

if (($_fname = getLocalPath("php_interface/" . SITE_ID . "/init.php", BX_PERSONAL_ROOT)) !== false)
{
	include_once $_SERVER["DOCUMENT_ROOT"] . $_fname;
}

if ((!(defined("STATISTIC_ONLY") && STATISTIC_ONLY && !str_starts_with($GLOBALS["APPLICATION"]->GetCurPage(), BX_ROOT . "/admin/"))) && COption::GetOptionString("main", "include_charset", "Y") == "Y" && LANG_CHARSET != '')
{
	header("Content-Type: text/html; charset=".LANG_CHARSET);
}

$license = $application->getLicense();
header("X-Powered-CMS: Bitrix Site Manager (" . ($license->isDemoKey() ? "DEMO" : $license->getPublicHashKey()) . ")");

if (COption::GetOptionString("main", "update_devsrv", "") == "Y")
{
	header("X-DevSrv-CMS: Bitrix");
}

//agents
if (COption::GetOptionString("main", "check_agents", "Y") == "Y")
{
	$application->addBackgroundJob(["CAgent", "CheckAgents"], [], Main\Application::JOB_PRIORITY_LOW);
}

//send email events
if (COption::GetOptionString("main", "check_events", "Y") !== "N")
{
	$application->addBackgroundJob(['\Bitrix\Main\Mail\EventManager', 'checkEvents'], [], Main\Application::JOB_PRIORITY_LOW - 1);
}

$healerOfEarlySessionStart = new HealerEarlySessionStart();
$healerOfEarlySessionStart->process($application->getKernelSession());

$kernelSession = $application->getKernelSession();
$kernelSession->start();
$application->getSessionLocalStorageManager()->setUniqueId($kernelSession->getId());

foreach (GetModuleEvents("main", "OnPageStart", true) as $arEvent)
{
	ExecuteModuleEventEx($arEvent);
}

//define global user object
$GLOBALS["USER"] = new CUser;

//session control from group policy
$arPolicy = $GLOBALS["USER"]->GetSecurityPolicy();
$currTime = time();
if (
	(
		//IP address changed
		$kernelSession['SESS_IP']
		&& $arPolicy["SESSION_IP_MASK"] != ''
		&& (
			(ip2long($arPolicy["SESSION_IP_MASK"]) & ip2long($kernelSession['SESS_IP']))
			!=
			(ip2long($arPolicy["SESSION_IP_MASK"]) & ip2long($_SERVER['REMOTE_ADDR']))
		)
	)
	||
	(
		//session timeout
		$arPolicy["SESSION_TIMEOUT"] > 0
		&& $kernelSession['SESS_TIME'] > 0
		&& ($currTime - $arPolicy["SESSION_TIMEOUT"] * 60) > $kernelSession['SESS_TIME']
	)
	||
	(
		//signed session
		isset($kernelSession["BX_SESSION_SIGN"])
		&& $kernelSession["BX_SESSION_SIGN"] !== bitrix_sess_sign()
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
$kernelSession['SESS_IP'] = $_SERVER['REMOTE_ADDR'] ?? null;
if (empty($kernelSession['SESS_TIME']))
{
	$kernelSession['SESS_TIME'] = $currTime;
}
elseif (($currTime - $kernelSession['SESS_TIME']) > 60)
{
	$kernelSession['SESS_TIME'] = $currTime;
}
if (!isset($kernelSession["BX_SESSION_SIGN"]))
{
	$kernelSession["BX_SESSION_SIGN"] = bitrix_sess_sign();
}

//session control from security module
if (
	(COption::GetOptionString("main", "use_session_id_ttl", "N") == "Y")
	&& (COption::GetOptionInt("main", "session_id_ttl", 0) > 0)
	&& !defined("BX_SESSION_ID_CHANGE")
)
{
	if (!isset($kernelSession['SESS_ID_TIME']))
	{
		$kernelSession['SESS_ID_TIME'] = $currTime;
	}
	elseif (($kernelSession['SESS_ID_TIME'] + COption::GetOptionInt("main", "session_id_ttl")) < $kernelSession['SESS_TIME'])
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

if (!defined("NOT_CHECK_PERMISSIONS") || NOT_CHECK_PERMISSIONS !== true)
{
	$doLogout = isset($_REQUEST["logout"]) && (strtolower($_REQUEST["logout"]) == "yes");

	if ($doLogout && $GLOBALS["USER"]->IsAuthorized())
	{
		$secureLogout = (Main\Config\Option::get("main", "secure_logout", "N") == "Y");

		if (!$secureLogout || check_bitrix_sessid())
		{
			$GLOBALS["USER"]->Logout();

			//store cookies for next hit (see CMain::GetSpreadCookieHTML())
			$GLOBALS["APPLICATION"]->StoreCookies();

			LocalRedirect($GLOBALS["APPLICATION"]->GetCurPageParam('', ['logout', 'sessid']));
		}
	}

	// authorize by cookies
	if (!$GLOBALS["USER"]->IsAuthorized())
	{
		$GLOBALS["USER"]->LoginByCookies();
	}

	$arAuthResult = false;

	//http basic and digest authorization
	if (($httpAuth = $GLOBALS["USER"]->LoginByHttpAuth()) !== null)
	{
		$arAuthResult = $httpAuth;
		$GLOBALS["APPLICATION"]->SetAuthResult($arAuthResult);
	}

	//Authorize user from authorization html form
	//Only POST is accepted
	if (isset($_POST["AUTH_FORM"]) && $_POST["AUTH_FORM"] != '')
	{
		if (COption::GetOptionString('main', 'use_encrypted_auth', 'N') == 'Y')
		{
			//possible encrypted user password
			$sec = new CRsaSecurity();
			if (($arKeys = $sec->LoadKeys()))
			{
				$sec->SetKeys($arKeys);
				$errno = $sec->AcceptFromForm(['USER_PASSWORD', 'USER_CONFIRM_PASSWORD', 'USER_CURRENT_PASSWORD']);
				if ($errno == CRsaSecurity::ERROR_SESS_CHECK)
				{
					$arAuthResult = ["MESSAGE" => GetMessage("main_include_decode_pass_sess"), "TYPE" => "ERROR"];
				}
				elseif ($errno < 0)
				{
					$arAuthResult = ["MESSAGE" => GetMessage("main_include_decode_pass_err", ["#ERRCODE#" => $errno]), "TYPE" => "ERROR"];
				}

				if ($errno < 0)
				{
					$bRsaError = true;
				}
			}
		}

		if (!$bRsaError)
		{
			if (!defined("ADMIN_SECTION") || ADMIN_SECTION !== true)
			{
				$USER_LID = SITE_ID;
			}

			$_POST["TYPE"] = $_POST["TYPE"] ?? null;
			if (isset($_POST["TYPE"]) && $_POST["TYPE"] == "AUTH")
			{
				$arAuthResult = $GLOBALS["USER"]->Login(
					$_POST["USER_LOGIN"] ?? '',
					$_POST["USER_PASSWORD"] ?? '',
					$_POST["USER_REMEMBER"] ?? ''
				);
			}
			elseif (isset($_POST["TYPE"]) && $_POST["TYPE"] == "OTP")
			{
				$arAuthResult = $GLOBALS["USER"]->LoginByOtp(
					$_POST["USER_OTP"] ?? '',
					$_POST["OTP_REMEMBER"] ?? '',
					$_POST["captcha_word"] ?? '',
					$_POST["captcha_sid"] ?? ''
				);
			}
			elseif (isset($_POST["TYPE"]) && $_POST["TYPE"] == "SEND_PWD")
			{
				$arAuthResult = CUser::SendPassword(
					$_POST["USER_LOGIN"] ?? '',
					$_POST["USER_EMAIL"] ?? '',
					$USER_LID,
					$_POST["captcha_word"] ?? '',
					$_POST["captcha_sid"] ?? '',
					$_POST["USER_PHONE_NUMBER"] ?? ''
				);
			}
			elseif (isset($_POST["TYPE"]) && $_POST["TYPE"] == "CHANGE_PWD")
			{
				$arAuthResult = $GLOBALS["USER"]->ChangePassword(
					$_POST["USER_LOGIN"] ?? '',
					$_POST["USER_CHECKWORD"] ?? '',
					$_POST["USER_PASSWORD"] ?? '',
					$_POST["USER_CONFIRM_PASSWORD"] ?? '',
					$USER_LID,
					$_POST["captcha_word"] ?? '',
					$_POST["captcha_sid"] ?? '',
					true,
					$_POST["USER_PHONE_NUMBER"] ?? '',
					$_POST["USER_CURRENT_PASSWORD"] ?? ''
				);
			}

			if ($_POST["TYPE"] == "AUTH" || $_POST["TYPE"] == "OTP")
			{
				//special login form in the control panel
				if ($arAuthResult === true && defined('ADMIN_SECTION') && ADMIN_SECTION === true)
				{
					//store cookies for next hit (see CMain::GetSpreadCookieHTML())
					$GLOBALS["APPLICATION"]->StoreCookies();
					$kernelSession['BX_ADMIN_LOAD_AUTH'] = true;

					// die() follows
					CMain::FinalActions('<script>window.onload=function(){(window.BX || window.parent.BX).AUTHAGENT.setAuthResult(false);};</script>');
				}
			}
		}
		$GLOBALS["APPLICATION"]->SetAuthResult($arAuthResult);
	}
	elseif (!$GLOBALS["USER"]->IsAuthorized() && isset($_REQUEST['bx_hit_hash']))
	{
		//Authorize by unique URL
		$GLOBALS["USER"]->LoginHitByHash($_REQUEST['bx_hit_hash']);
	}
}

//logout or re-authorize the user if something importand has changed
$GLOBALS["USER"]->CheckAuthActions();

//magic short URI
if (defined("BX_CHECK_SHORT_URI") && BX_CHECK_SHORT_URI && CBXShortUri::CheckUri())
{
	//local redirect inside
	die();
}

//application password scope control
if (($applicationID = $GLOBALS["USER"]->getContext()->getApplicationId()) !== null)
{
	$appManager = Main\Authentication\ApplicationManager::getInstance();
	if ($appManager->checkScope($applicationID) !== true)
	{
		$event = new Main\Event("main", "onApplicationScopeError", ['APPLICATION_ID' => $applicationID]);
		$event->send();

		$context->getResponse()->setStatus("403 Forbidden");
		$application->end();
	}
}

//define the site template
if (!defined("ADMIN_SECTION") || ADMIN_SECTION !== true)
{
	$siteTemplate = "";
	if (!empty($_REQUEST["bitrix_preview_site_template"]) && is_string($_REQUEST["bitrix_preview_site_template"]) && $GLOBALS["USER"]->CanDoOperation('view_other_settings'))
	{
		//preview of site template
		$signer = new Main\Security\Sign\Signer();
		try
		{
			//protected by a sign
			$requestTemplate = $signer->unsign($_REQUEST["bitrix_preview_site_template"], "template_preview".bitrix_sessid());

			$aTemplates = CSiteTemplate::GetByID($requestTemplate);
			if ($template = $aTemplates->Fetch())
			{
				$siteTemplate = $template["ID"];

				//preview of unsaved template
				if (isset($_GET['bx_template_preview_mode']) && $_GET['bx_template_preview_mode'] == 'Y' && $GLOBALS["USER"]->CanDoOperation('edit_other_settings'))
				{
					define("SITE_TEMPLATE_PREVIEW_MODE", true);
				}
			}
		}
		catch (Main\Security\Sign\BadSignatureException)
		{
		}
	}
	if ($siteTemplate == "")
	{
		$siteTemplate = CSite::GetCurTemplate();
	}

	if (!defined('SITE_TEMPLATE_ID'))
	{
		define("SITE_TEMPLATE_ID", $siteTemplate);
	}

	if (!defined('SITE_TEMPLATE_PATH'))
	{
		define("SITE_TEMPLATE_PATH", getLocalPath('templates/'.SITE_TEMPLATE_ID, BX_PERSONAL_ROOT));
	}
}
else
{
	// prevents undefined constants
	if (!defined('SITE_TEMPLATE_ID'))
	{
		define('SITE_TEMPLATE_ID', '.default');
	}

	define('SITE_TEMPLATE_PATH', '/bitrix/templates/.default');
}

//magic parameters: show page creation time
if (isset($_GET["show_page_exec_time"]))
{
	if ($_GET["show_page_exec_time"] == "Y" || $_GET["show_page_exec_time"] == "N")
	{
		$kernelSession["SESS_SHOW_TIME_EXEC"] = $_GET["show_page_exec_time"];
	}
}

//magic parameters: show included file processing time
if (isset($_GET["show_include_exec_time"]))
{
	if ($_GET["show_include_exec_time"] == "Y" || $_GET["show_include_exec_time"] == "N")
	{
		$kernelSession["SESS_SHOW_INCLUDE_TIME_EXEC"] = $_GET["show_include_exec_time"];
	}
}

//magic parameters: show include areas
if (!empty($_GET["bitrix_include_areas"]))
{
	$GLOBALS["APPLICATION"]->SetShowIncludeAreas($_GET["bitrix_include_areas"]=="Y");
}

//magic sound
if ($GLOBALS["USER"]->IsAuthorized())
{
	$cookie_prefix = COption::GetOptionString('main', 'cookie_name', 'BITRIX_SM');
	if (!isset($_COOKIE[$cookie_prefix.'_SOUND_LOGIN_PLAYED']))
	{
		$GLOBALS["APPLICATION"]->set_cookie('SOUND_LOGIN_PLAYED', 'Y', 0);
	}
}

//magic cache
Main\Composite\Engine::shouldBeEnabled();

// should be before proactive filter on OnBeforeProlog
$userPassword = $_POST["USER_PASSWORD"] ?? null;
$userConfirmPassword = $_POST["USER_CONFIRM_PASSWORD"] ?? null;

foreach(GetModuleEvents("main", "OnBeforeProlog", true) as $arEvent)
{
	ExecuteModuleEventEx($arEvent);
}

// need to reinit
$GLOBALS["APPLICATION"]->SetCurPage(false);

if (!defined("NOT_CHECK_PERMISSIONS") || NOT_CHECK_PERMISSIONS !== true)
{
	//Register user from authorization html form
	//Only POST is accepted
	if (isset($_POST["AUTH_FORM"]) && $_POST["AUTH_FORM"] != '' && isset($_POST["TYPE"]) && $_POST["TYPE"] == "REGISTRATION")
	{
		if (!$bRsaError)
		{
			if (COption::GetOptionString("main", "new_user_registration", "N") == "Y" && (!defined("ADMIN_SECTION") || ADMIN_SECTION !== true))
			{
				$arAuthResult = $GLOBALS["USER"]->Register(
					$_POST["USER_LOGIN"] ?? '',
					$_POST["USER_NAME"] ?? '',
					$_POST["USER_LAST_NAME"] ?? '',
					$userPassword,
					$userConfirmPassword,
					$_POST["USER_EMAIL"] ?? '',
					$USER_LID,
					$_POST["captcha_word"] ?? '',
					$_POST["captcha_sid"] ?? '',
					false,
					$_POST["USER_PHONE_NUMBER"] ?? ''
				);

				$GLOBALS["APPLICATION"]->SetAuthResult($arAuthResult);
			}
		}
	}
}

if ((!defined("NOT_CHECK_PERMISSIONS") || NOT_CHECK_PERMISSIONS !== true) && (!defined("NOT_CHECK_FILE_PERMISSIONS") || NOT_CHECK_FILE_PERMISSIONS !== true))
{
	$real_path = $context->getRequest()->getScriptFile();

	if (!$GLOBALS["USER"]->CanDoFileOperation('fm_view_file', [SITE_ID, $real_path]) || (defined("NEED_AUTH") && NEED_AUTH && !$GLOBALS["USER"]->IsAuthorized()))
	{
		if ($GLOBALS["USER"]->IsAuthorized() && empty($arAuthResult["MESSAGE"]))
		{
			$arAuthResult = ["MESSAGE" => GetMessage("ACCESS_DENIED").' '.GetMessage("ACCESS_DENIED_FILE", ["#FILE#" => $real_path]), "TYPE" => "ERROR"];

			if (COption::GetOptionString("main", "event_log_permissions_fail", "N") === "Y")
			{
				CEventLog::Log(CEventLog::SEVERITY_SECURITY, "USER_PERMISSIONS_FAIL", "main", $GLOBALS["USER"]->GetID(), $real_path);
			}
		}

		if (defined("ADMIN_SECTION") && ADMIN_SECTION === true)
		{
			if (isset($_REQUEST["mode"]) && ($_REQUEST["mode"] === "list" || $_REQUEST["mode"] === "settings"))
			{
				echo "<script>top.location='".$GLOBALS["APPLICATION"]->GetCurPage()."?".DeleteParam(["mode"])."';</script>";
				die();
			}
			elseif (isset($_REQUEST["mode"]) && $_REQUEST["mode"] === "frame")
			{
				echo "<script>
					const w = (opener? opener.window:parent.window);
					w.location.href='" .$GLOBALS["APPLICATION"]->GetCurPage()."?".DeleteParam(["mode"])."';
				</script>";
				die();
			}
			elseif (defined("MOBILE_APP_ADMIN") && MOBILE_APP_ADMIN === true)
			{
				echo json_encode(["status" => "failed"]);
				die();
			}
		}

		/** @noinspection PhpUndefinedVariableInspection */
		$GLOBALS["APPLICATION"]->AuthForm($arAuthResult);
	}
}

/*ZDUyZmZY2FkYWIzYzZiNDBmODkyYmM0YWEwYTQyM2Q3NTZjMWQ=*/$GLOBALS['____246747087']= array(base64_decode(''.'bX'.'R'.'fcmFuZA'.'=='),base64_decode(''.'Y2FsbF91c2VyX2Z1b'.'mM='),base64_decode('c3RycG9'.'z'),base64_decode('ZXhwbG9kZQ=='),base64_decode('cGF'.'jaw=='),base64_decode('bWQ1'),base64_decode('Y29uc'.'3R'.'hbnQ='),base64_decode('a'.'GF'.'zaF9obWF'.'j'),base64_decode('c3RyY21w'),base64_decode('Y'.'2FsbF91c2VyX2Z'.'1bm'.'M='),base64_decode('Y2FsbF91c2VyX'.'2Z'.'1'.'bm'.'M='),base64_decode('aXNfb2JqZWN0'),base64_decode('Y2'.'F'.'sbF'.'9'.'1'.'c'.'2VyX2'.'Z1'.'bmM'.'='),base64_decode('Y2Fsb'.'F'.'9'.'1'.'c2VyX2Z1bmM='),base64_decode(''.'Y2'.'FsbF9'.'1c2VyX2Z1bm'.'M='),base64_decode('Y2Fsb'.'F9'.'1c2VyX2Z'.'1b'.'mM='),base64_decode('Y2FsbF'.'9'.'1c2VyX2'.'Z1bmM'.'='),base64_decode('Y2Fsb'.'F91'.'c2V'.'yX2'.'Z1'.'bmM='));if(!function_exists(__NAMESPACE__.'\\___72147256')){function ___72147256($_1672549092){static $_897732648= false; if($_897732648 == false) $_897732648=array('XENP'.'cH'.'R'.'pb246Ok'.'dldE9wdGlvb'.'lN0cmluZ'.'w'.'==','b'.'W'.'Fpbg'.'='.'=',''.'flB'.'B'.'UkFNX01BWF9'.'VU0VSUw==','Lg='.'=','L'.'g='.'=',''.'SCo=',''.'Yml0cml4','TElDRU5TR'.'V9LRVk=',''.'c2hhMj'.'U2','XENPcHR'.'pb24'.'6'.'O'.'kdld'.'E9wdG'.'l'.'vblN0cml'.'uZw==','bWFpbg='.'=',''.'UEFSQ'.'U1f'.'TUF'.'YX1VTRVJT','XE'.'Jp'.'dH'.'Jp'.'eFxNYWluXENv'.'b'.'m'.'ZpZ'.'1xP'.'cH'.'R'.'pb'.'24'.'6OnNldA==','bWFp'.'bg'.'==','UEFSQU1fTUFY'.'X'.'1VT'.'RVJ'.'T','VVNFUg='.'=','VV'.'NFUg==','V'.'V'.'NFU'.'g'.'==','SXNBdX'.'R'.'o'.'b'.'3Jp'.'emVk','VVNFUg='.'=',''.'SX'.'NB'.'ZG1pb'.'g==','QVBQ'.'TElDQVRJT'.'04=','UmVzdGFy'.'dEJ1ZmZ'.'lcg==','TG9'.'jYWx'.'SZWRpcm'.'V'.'j'.'dA==','L2x'.'pY2Vuc2Vfcm'.'VzdHJ'.'pY3Rpb24ucG'.'hw','XENPcHRpb2'.'46Ok'.'dldE'.'9wdGlvblN'.'0cmlu'.'Zw==',''.'bW'.'F'.'p'.'bg==',''.'UEFSQ'.'U1'.'fTUFY'.'X1VT'.'RVJT','XEJp'.'dHJpeFxNYWluX'.'ENvbmZ'.'pZ1x'.'PcHR'.'pb246'.'OnNldA'.'==','bWFp'.'bg='.'=','UE'.'F'.'SQU1fTUFYX1VT'.'RV'.'JT');return base64_decode($_897732648[$_1672549092]);}};if($GLOBALS['____246747087'][0](round(0+0.2+0.2+0.2+0.2+0.2), round(0+5+5+5+5)) == round(0+3.5+3.5)){ $_755726042= $GLOBALS['____246747087'][1](___72147256(0), ___72147256(1), ___72147256(2)); if(!empty($_755726042) && $GLOBALS['____246747087'][2]($_755726042, ___72147256(3)) !== false){ list($_1553362937, $_725103437)= $GLOBALS['____246747087'][3](___72147256(4), $_755726042); $_200794083= $GLOBALS['____246747087'][4](___72147256(5), $_1553362937); $_964355046= ___72147256(6).$GLOBALS['____246747087'][5]($GLOBALS['____246747087'][6](___72147256(7))); $_1409913971= $GLOBALS['____246747087'][7](___72147256(8), $_725103437, $_964355046, true); if($GLOBALS['____246747087'][8]($_1409913971, $_200794083) !==(1084/2-542)){ if($GLOBALS['____246747087'][9](___72147256(9), ___72147256(10), ___72147256(11)) != round(0+2.4+2.4+2.4+2.4+2.4)){ $GLOBALS['____246747087'][10](___72147256(12), ___72147256(13), ___72147256(14), round(0+2.4+2.4+2.4+2.4+2.4));} if(isset($GLOBALS[___72147256(15)]) && $GLOBALS['____246747087'][11]($GLOBALS[___72147256(16)]) && $GLOBALS['____246747087'][12](array($GLOBALS[___72147256(17)], ___72147256(18))) &&!$GLOBALS['____246747087'][13](array($GLOBALS[___72147256(19)], ___72147256(20)))){ $GLOBALS['____246747087'][14](array($GLOBALS[___72147256(21)], ___72147256(22))); $GLOBALS['____246747087'][15](___72147256(23), ___72147256(24), true);}}} else{ if($GLOBALS['____246747087'][16](___72147256(25), ___72147256(26), ___72147256(27)) != round(0+12)){ $GLOBALS['____246747087'][17](___72147256(28), ___72147256(29), ___72147256(30), round(0+4+4+4));}}}/**/       //Do not remove this