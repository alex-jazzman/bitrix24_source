<?php

/**
 * Bitrix Framework
 * @package bitrix
 * @subpackage main
 * @copyright 2001-2025 Bitrix
 */

use Bitrix\Main;
use Bitrix\Main\Session\Legacy\HealerEarlySessionStart;
use Bitrix\Main\DI\ServiceLocator;
use Bitrix\Main\Config\Option;
use Dev\Main\Migrator\ModuleUpdater;

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
	ModuleUpdater::checkUpdates('main', __DIR__);
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

error_reporting((int)Option::get("main", "error_reporting", E_COMPILE_ERROR | E_ERROR | E_CORE_ERROR | E_PARSE) & ~E_DEPRECATED & ~E_WARNING & ~E_NOTICE);

if (!defined("BX_COMP_MANAGED_CACHE") && Option::get("main", "component_managed_cache_on", "Y") != "N")
{
	define("BX_COMP_MANAGED_CACHE", true);
}

// global functions
require_once __DIR__ . "/filter_tools.php";

/*ZDUyZmZOTY4NDM4NjVjNjkzYzkwYzMwMzViYTA2YmQwOWMwZDU=*/$GLOBALS['_____1934502363']= array(base64_decode('R'.'2V0TW9kdWx'.'lR'.'XZlbn'.'Rz'),base64_decode('RXhlY3V'.'0ZU1vZ'.'HV'.'sZU'.'V2Z'.'W50RXg='));$GLOBALS['____1446879639']= array(base64_decode('ZGVmaW5l'),base64_decode('YmF'.'zZTY0X'.'2RlY29kZQ=='),base64_decode('d'.'W5'.'zZXJpYWxpe'.'mU='),base64_decode('a'.'XNfYX'.'JyYXk='),base64_decode('aW5'.'fYX'.'J'.'yYXk='),base64_decode('c2Vya'.'WFsaXpl'),base64_decode(''.'YmFz'.'ZT'.'Y0'.'X2Vu'.'Y29kZ'.'Q='.'='),base64_decode('bWt0aW1l'),base64_decode(''.'ZG'.'F0Z'.'Q=='),base64_decode('ZGF0ZQ'.'=='),base64_decode('c3Ry'.'bGVu'),base64_decode('bWt0aW'.'1l'),base64_decode('Z'.'G'.'F0Z'.'Q=='),base64_decode('Z'.'G'.'F'.'0ZQ'.'=='),base64_decode(''.'bWV'.'0'.'aG9kX2V4a'.'XN'.'0cw=='),base64_decode(''.'Y2Fsb'.'F91c2VyX2Z'.'1b'.'m'.'N'.'fYXJyYXk'.'='),base64_decode('c3RybGVu'),base64_decode(''.'c'.'2Vya'.'WFsaXp'.'l'),base64_decode('YmFzZ'.'TY0X2Vu'.'Y29kZQ=='),base64_decode('c3R'.'ybGV'.'u'),base64_decode('aXNfYXJyYXk='),base64_decode('c2'.'V'.'yaW'.'Fs'.'aXp'.'l'),base64_decode('YmFzZTY'.'0X2V'.'uY'.'29k'.'Z'.'Q'.'=='),base64_decode('c'.'2VyaWFsa'.'Xp'.'l'),base64_decode('Y'.'mFzZTY0'.'X2VuY29kZ'.'Q=='),base64_decode('aXNfYXJyY'.'Xk'.'='),base64_decode('aXNfYX'.'JyYXk='),base64_decode('aW5fYX'.'JyY'.'Xk='),base64_decode('aW5fYX'.'Jy'.'YXk='),base64_decode('bW'.'t0aW1'.'l'),base64_decode(''.'ZG'.'F0'.'ZQ=='),base64_decode(''.'ZG'.'F0ZQ=='),base64_decode(''.'ZGF'.'0ZQ=='),base64_decode('b'.'Wt0aW'.'1l'),base64_decode(''.'ZG'.'F0ZQ=='),base64_decode(''.'ZGF0Z'.'Q'.'=='),base64_decode('aW'.'5fYXJy'.'YX'.'k='),base64_decode('c2Vya'.'WFs'.'a'.'X'.'pl'),base64_decode('Y'.'mFzZTY0X2VuY29kZ'.'Q'.'=='),base64_decode('aW50dmF'.'s'),base64_decode('dG'.'ltZQ='.'='),base64_decode('Z'.'mlsZV9'.'leG'.'lzd'.'HM='),base64_decode('c3RyX'.'3JlcGx'.'hY2'.'U='),base64_decode('Y2xh'.'c3NfZXhp'.'c3R'.'z'),base64_decode('ZGVmaW5'.'l'));if(!function_exists(__NAMESPACE__.'\\___400610784')){function ___400610784($_309867906){static $_307498138= false; if($_307498138 == false) $_307498138=array('SU5U'.'U'.'kFOR'.'VR'.'fRURJ'.'VEl'.'PTg==',''.'W'.'Q==','bWFp'.'bg==','fmNwZl9t'.'YXB'.'fd'.'mF'.'s'.'dWU=','','','Y'.'Wxsb3dl'.'ZF9jb'.'G'.'Fzc2V'.'z','Z'.'Q='.'=','Zg==','Z'.'Q='.'=','R'.'g='.'=','WA==','Zg==','b'.'WF'.'pbg==','fmNwZ'.'l9tYX'.'B'.'fd'.'mFsdWU=','U'.'G9'.'ydGFs','Rg'.'==',''.'ZQ==','ZQ='.'=',''.'WA'.'==','Rg==','R'.'A='.'=','RA'.'==','bQ==','ZA==','WQ='.'=',''.'Zg='.'=',''.'Zg='.'=',''.'Zg==',''.'Z'.'g='.'=',''.'UG9y'.'dGFs','Rg==',''.'ZQ==','Z'.'Q'.'==',''.'WA==','R'.'g==','RA==','R'.'A==','bQ==','ZA==','WQ'.'==','bWF'.'pbg==','T'.'2'.'4'.'=',''.'U2V'.'0dGluZ3NDaG'.'F'.'uZ2U=','Zg'.'==','Zg==','Zg==','Z'.'g==','bWFpbg==','fmNw'.'Zl'.'9tY'.'X'.'BfdmFsdWU=','ZQ==','ZQ='.'=','RA==','Z'.'Q==','ZQ==','Zg='.'=','Zg==','Z'.'g==','Z'.'Q'.'==','b'.'W'.'Fpbg==','fm'.'NwZl9tYXBfdm'.'F'.'sdWU=','ZQ==','Zg==',''.'Zg==','Zg==','Zg==',''.'bWFp'.'bg==','fm'.'NwZ'.'l9tYXB'.'fdmF'.'sd'.'WU'.'=',''.'ZQ='.'=',''.'Zg'.'==','UG9ydGFs','UG9ydGF'.'s','ZQ==','Z'.'Q==','UG9ydG'.'Fs',''.'R'.'g'.'==','W'.'A==','Rg'.'==','RA==','ZQ='.'=','ZQ'.'==','RA==','bQ'.'==','ZA='.'=','WQ==','Z'.'Q==','WA'.'==','ZQ==','Rg==',''.'ZQ==','RA==','Zg==','ZQ==','RA==','ZQ'.'==','b'.'Q==','Z'.'A==','WQ==','Zg'.'==','Zg'.'==','Zg==','Zg==',''.'Zg==','Zg==',''.'Zg'.'==',''.'Z'.'g==','b'.'WFpbg==','fm'.'NwZl9tYXBf'.'dm'.'FsdW'.'U'.'=','ZQ='.'=','ZQ==','UG9ydGF'.'s','Rg==','WA==','VFlQ'.'RQ==','RE'.'FURQ==','Rk'.'VB'.'VF'.'V'.'SRVM=','RVhQ'.'SVJFRA==','V'.'F'.'lQRQ==','R'.'A'.'==','VF'.'J'.'Z'.'X0R'.'B'.'WV'.'Nf'.'Q09VTl'.'Q'.'=','REF'.'U'.'RQ==',''.'VF'.'JZX0'.'R'.'BWVNfQ'.'09VTlQ=',''.'RVhQSVJFRA==','RkVBVFVSRV'.'M'.'=','Z'.'g==','Zg'.'==',''.'RE9DVU1F'.'T'.'l'.'RfUk9PVA==','L'.'2'.'JpdHJ'.'p'.'eC9tb2R'.'1b'.'G'.'Vz'.'Lw==','L2luc3RhbGwvaW5'.'kZXguc'.'Ghw',''.'Lg='.'=','Xw==','c2Vhcm'.'No','Tg==','','','QU'.'NUSVZF','WQ==','c2'.'9j'.'aWFsbmV0d2'.'9y'.'aw='.'=','YWxsb3dfZnJpZWxk'.'cw==','WQ==','SUQ'.'=','c29jaWFsb'.'mV0d'.'29'.'y'.'a'.'w'.'==',''.'YWx'.'s'.'b3df'.'ZnJpZWxkcw==',''.'S'.'UQ'.'=','c2'.'9j'.'aW'.'Fsb'.'mV0d'.'29yaw==','Y'.'Wxsb'.'3dfZn'.'JpZ'.'W'.'xkcw'.'='.'=','Tg==','','','QUNUSVZF','WQ'.'==','c29jaWFsbmV'.'0'.'d29y'.'aw==','YWx'.'sb3dfbWljcm9ibG'.'9nX3VzZ'.'XI=','WQ'.'==',''.'SUQ=',''.'c29j'.'aWF'.'sbm'.'V0d'.'29yaw==','YWxsb3df'.'b'.'Wljcm9'.'i'.'bG9nX3VzZXI=','SUQ=','c2'.'9'.'j'.'a'.'WFsbmV0d'.'29'.'yaw==',''.'YWxsb3'.'dfbWljcm9'.'i'.'bG9nX'.'3'.'VzZXI'.'=','c29'.'jaWFsbmV0d29yaw==','Y'.'Wx'.'sb3dfb'.'Wlj'.'cm9ibG9nX'.'2dyb3V'.'w',''.'W'.'Q='.'=',''.'SU'.'Q=',''.'c29jaWFsb'.'mV0d2'.'9yaw'.'==','YW'.'x'.'sb'.'3dfbWljcm9ibG9nX2dyb'.'3Vw','SUQ=','c29jaWF'.'sbmV0d29ya'.'w==',''.'YW'.'xsb3df'.'bWlj'.'cm9ibG9n'.'X2'.'d'.'y'.'b3Vw','Tg==','','','QUNUSVZ'.'F',''.'WQ==','c29ja'.'W'.'F'.'sbmV'.'0d'.'2'.'9yaw'.'==','Y'.'Wxsb'.'3df'.'Zml'.'sZXNfdX'.'Nl'.'cg'.'==','WQ'.'==',''.'SUQ'.'=','c2'.'9'.'jaW'.'Fs'.'b'.'mV0d29'.'y'.'a'.'w==','YWxs'.'b3dfZmlsZXNfdXN'.'lcg==','SUQ=','c29jaWFsbmV0d2'.'9'.'yaw==','YWxsb3df'.'Zml'.'sZ'.'XN'.'fdXNl'.'cg'.'==','Tg==','','','Q'.'UNUSVZF','WQ==','c29j'.'aWFsbmV0d29yaw='.'=','YWx'.'sb3dfYm'.'xvZ1'.'9'.'1c2'.'Vy',''.'WQ==','S'.'UQ=','c2'.'9jaWFsbmV0d29yaw==',''.'YWxsb3dfYmxv'.'Z191'.'c2Vy','SUQ=','c29jaWF'.'sbmV'.'0d29'.'yaw==','YW'.'xsb3'.'d'.'fYmxvZ191c2Vy','Tg==','','',''.'QUN'.'USVZF','WQ='.'=','c29jaWF'.'sbmV'.'0d2'.'9'.'yaw==','YW'.'xsb3dfcGhvdG9f'.'dX'.'Nl'.'cg==','WQ'.'==','S'.'UQ=',''.'c29'.'jaW'.'Fsbm'.'V0d'.'29y'.'aw==',''.'YW'.'xs'.'b3d'.'fcGhvdG9'.'fdX'.'Nlcg==','SUQ=',''.'c29jaW'.'Fs'.'bmV0d29yaw==','Y'.'W'.'xsb3dfcGhvdG'.'9fdXNlcg==','T'.'g==','','','QUN'.'USVZF','WQ='.'=','c29'.'ja'.'WFsb'.'mV'.'0d29yaw==',''.'Y'.'Wxsb3dfZm9y'.'dW1fdX'.'Nlcg'.'==','W'.'Q==','SU'.'Q=','c2'.'9jaWFsbmV0d2'.'9'.'y'.'a'.'w==','YWxsb3dfZm9ydW1f'.'d'.'XNlcg==','SUQ=','c29'.'jaWFsbmV'.'0d2'.'9yaw==','YWxsb3d'.'fZm9ydW'.'1f'.'dXNl'.'c'.'g='.'=',''.'Tg==','','','QUNUSVZF','WQ==',''.'c'.'29j'.'a'.'WFsb'.'mV0'.'d29yaw'.'==','Y'.'W'.'xsb3'.'dfdGFza3Nfd'.'XNl'.'c'.'g='.'=','WQ==','SUQ=','c29'.'jaWFsbmV0'.'d29yaw==','YWxs'.'b3df'.'d'.'GFza3'.'NfdXN'.'lcg==','SUQ=','c29ja'.'WFsbmV0d29yaw='.'=','Y'.'Wx'.'s'.'b3dfdGFza3Nfd'.'XNlcg==',''.'c29jaWF'.'s'.'bmV0'.'d29ya'.'w==','YWxsb3dfdGF'.'z'.'a3NfZ3JvdXA=','WQ==','SUQ=','c29jaWFsbm'.'V0d29'.'y'.'aw==','YW'.'x'.'sb3dfdGFza3NfZ3Jvd'.'XA=','SU'.'Q=','c29ja'.'W'.'F'.'s'.'bm'.'V0d29y'.'aw==','YWxs'.'b3dfdGF'.'z'.'a3NfZ3JvdXA=','d'.'GFza3M'.'=','Tg='.'=','','',''.'Q'.'UNUSVZF','W'.'Q==','c2'.'9ja'.'WFsbmV0d'.'29ya'.'w==',''.'YWx'.'sb3dfY2'.'Fs'.'ZW5k'.'YXJfd'.'XNlcg'.'==','WQ==','S'.'UQ=','c'.'29'.'jaW'.'Fsbm'.'V'.'0d29yaw==','YWx'.'sb3'.'dfY2Fs'.'ZW5kYXJfdX'.'Nlcg='.'=','SU'.'Q=',''.'c2'.'9'.'jaWFsbmV0d29'.'ya'.'w'.'='.'=','Y'.'Wxsb3df'.'Y2FsZW5kYXJfdXNl'.'cg==','c29'.'jaWFsbmV0d'.'29yaw'.'==','YWxsb'.'3dfY2FsZW5k'.'YXJfZ3'.'JvdXA=',''.'WQ'.'==','SUQ=','c2'.'9j'.'aWFsbmV0d2'.'9ya'.'w==','YWxsb3dfY2FsZW5kYXJfZ'.'3JvdXA=',''.'S'.'UQ'.'=','c29jaWFsbmV0d29yaw='.'=',''.'YWxsb3d'.'f'.'Y2FsZW5kYXJfZ3'.'JvdXA'.'=','QUN'.'U'.'SVZF','WQ'.'==','Tg='.'=','ZX'.'h0'.'cmF'.'u'.'ZX'.'Q=',''.'aWJsb2'.'Nr','T25'.'BZ'.'nR'.'lck'.'lC'.'bG9j'.'a'.'0VsZ'.'W1'.'lbnRVcG'.'Rh'.'dGU=',''.'aW50cmFuZXQ=',''.'Q0lu'.'dHJhbmV'.'0'.'RXZlbnRIYW5kbG'.'Vycw'.'==','U1BSZ'.'Wdpc3RlclVwZGF'.'0ZWRJ'.'d'.'GVt',''.'Q'.'0lu'.'d'.'HJh'.'bmV0U2hhc'.'mVwb2ludDo'.'6QW'.'d'.'lbn'.'RM'.'a'.'XN'.'0cyg'.'pO'.'w==','aW50cm'.'FuZXQ=',''.'Tg==',''.'Q0lu'.'dHJ'.'hbmV0U2h'.'hcmVw'.'b2lu'.'dDo'.'6Q'.'W'.'dl'.'bn'.'RRdW'.'V1Z'.'Sg'.'pO'.'w==','a'.'W50cmFuZXQ=','Tg==',''.'Q'.'0ludH'.'J'.'hbmV'.'0U2hhc'.'mVwb2ludD'.'o6QW'.'dlbnRV'.'cGRhdGUoKTs=','aW50cmFuZX'.'Q=',''.'Tg==','a'.'WJsb'.'2Nr','T25BZn'.'Rlckl'.'C'.'b'.'G9ja'.'0VsZ'.'W1'.'lbnRBZGQ=','a'.'W'.'50cmFuZXQ=','Q'.'0lud'.'HJhbmV0RX'.'Zlbn'.'RI'.'YW5k'.'bGVycw==','U1BSZWdpc3Rl'.'clVwZ'.'G'.'F0ZWRJdGVt',''.'aWJsb2Nr','T'.'25BZn'.'R'.'lcklCbG9ja0VsZW1'.'l'.'bnRVcGRh'.'d'.'G'.'U=','aW50cmFuZXQ=','Q0'.'lud'.'HJhbmV'.'0RXZlbnRIYW5kb'.'G'.'Vycw==','U1B'.'SZWdp'.'c3'.'R'.'l'.'c'.'l'.'VwZGF0ZWRJdGV'.'t','Q'.'0'.'lud'.'HJh'.'bmV0U'.'2h'.'hcm'.'V'.'wb'.'2'.'ludDo6'.'QWdlb'.'nR'.'MaXN0cy'.'g'.'pOw='.'=',''.'aW50cmFuZX'.'Q'.'=','Q'.'0'.'lu'.'dHJhbmV'.'0'.'U2hhcm'.'Vwb2ludDo'.'6QWd'.'l'.'bn'.'RRd'.'WV1'.'ZSgpOw==','aW5'.'0cmFu'.'ZXQ=','Q'.'0ludHJhbmV0U2hhc'.'mVwb2lud'.'D'.'o'.'6QWdlbnR'.'V'.'cGRhd'.'GUoKTs=','a'.'W'.'50c'.'mFuZX'.'Q'.'=',''.'Y3Jt','bWF'.'pbg==','T25CZ'.'WZvcmVQ'.'cm9sb2c=','b'.'W'.'Fpbg==',''.'Q'.'1d'.'pemFy'.'ZF'.'NvbFBhbmVsSW50c'.'m'.'Fu'.'ZXQ=','U2hv'.'d1Bh'.'bmVs','L21vZHV'.'sZ'.'X'.'Mv'.'aW50cmFuZ'.'XQ'.'vcGFu'.'ZWxfY'.'nV0d'.'G9uLnB'.'ocA==','RU'.'5DT0RF','W'.'Q==');return base64_decode($_307498138[$_309867906]);}};$GLOBALS['____1446879639'][0](___400610784(0), ___400610784(1));class CBXFeatures{ private static $_83436100= 30; private static $_1685336964= array( "Portal" => array( "CompanyCalendar", "CompanyPhoto", "CompanyVideo", "CompanyCareer", "StaffChanges", "StaffAbsence", "CommonDocuments", "MeetingRoomBookingSystem", "Wiki", "Learning", "Vote", "WebLink", "Subscribe", "Friends", "PersonalFiles", "PersonalBlog", "PersonalPhoto", "PersonalForum", "Blog", "Forum", "Gallery", "Board", "MicroBlog", "WebMessenger",), "Communications" => array( "Tasks", "Calendar", "Workgroups", "Jabber", "VideoConference", "Extranet", "SMTP", "Requests", "DAV", "intranet_sharepoint", "timeman", "Idea", "Meeting", "EventList", "Salary", "XDImport",), "Enterprise" => array( "BizProc", "Lists", "Support", "Analytics", "crm", "Controller", "LdapUnlimitedUsers",), "Holding" => array( "Cluster", "MultiSites",),); private static $_1268755276= null; private static $_1261742969= null; private static function __458887765(){ if(self::$_1268755276 === null){ self::$_1268755276= array(); foreach(self::$_1685336964 as $_1032218208 => $_266766836){ foreach($_266766836 as $_1805207580) self::$_1268755276[$_1805207580]= $_1032218208;}} if(self::$_1261742969 === null){ self::$_1261742969= array(); $_604751115= COption::GetOptionString(___400610784(2), ___400610784(3), ___400610784(4)); if($_604751115 != ___400610784(5)){ $_604751115= $GLOBALS['____1446879639'][1]($_604751115); $_604751115= $GLOBALS['____1446879639'][2]($_604751115,[___400610784(6) => false]); if($GLOBALS['____1446879639'][3]($_604751115)){ self::$_1261742969= $_604751115;}} if(empty(self::$_1261742969)){ self::$_1261742969= array(___400610784(7) => array(), ___400610784(8) => array());}}} public static function InitiateEditionsSettings($_1369689088){ self::__458887765(); $_363556774= array(); foreach(self::$_1685336964 as $_1032218208 => $_266766836){ $_170748948= $GLOBALS['____1446879639'][4]($_1032218208, $_1369689088); self::$_1261742969[___400610784(9)][$_1032218208]=($_170748948? array(___400610784(10)): array(___400610784(11))); foreach($_266766836 as $_1805207580){ self::$_1261742969[___400610784(12)][$_1805207580]= $_170748948; if(!$_170748948) $_363556774[]= array($_1805207580, false);}} $_1867873249= $GLOBALS['____1446879639'][5](self::$_1261742969); $_1867873249= $GLOBALS['____1446879639'][6]($_1867873249); COption::SetOptionString(___400610784(13), ___400610784(14), $_1867873249); foreach($_363556774 as $_150719449) self::__2021021565($_150719449[(218*2-436)], $_150719449[round(0+1)]);} public static function IsFeatureEnabled($_1805207580){ if($_1805207580 == '') return true; self::__458887765(); if(!isset(self::$_1268755276[$_1805207580])) return true; if(self::$_1268755276[$_1805207580] == ___400610784(15)) $_1862502038= array(___400610784(16)); elseif(isset(self::$_1261742969[___400610784(17)][self::$_1268755276[$_1805207580]])) $_1862502038= self::$_1261742969[___400610784(18)][self::$_1268755276[$_1805207580]]; else $_1862502038= array(___400610784(19)); if($_1862502038[(1500/2-750)] != ___400610784(20) && $_1862502038[(1224/2-612)] != ___400610784(21)){ return false;} elseif($_1862502038[(828-2*414)] == ___400610784(22)){ if($_1862502038[round(0+0.25+0.25+0.25+0.25)]< $GLOBALS['____1446879639'][7](min(96,0,32),(794-2*397), min(6,0,2), Date(___400610784(23)), $GLOBALS['____1446879639'][8](___400610784(24))- self::$_83436100, $GLOBALS['____1446879639'][9](___400610784(25)))){ if(!isset($_1862502038[round(0+1+1)]) ||!$_1862502038[round(0+2)]) self::__337557148(self::$_1268755276[$_1805207580]); return false;}} return!isset(self::$_1261742969[___400610784(26)][$_1805207580]) || self::$_1261742969[___400610784(27)][$_1805207580];} public static function IsFeatureInstalled($_1805207580){ if($GLOBALS['____1446879639'][10]($_1805207580) <= 0) return true; self::__458887765(); return(isset(self::$_1261742969[___400610784(28)][$_1805207580]) && self::$_1261742969[___400610784(29)][$_1805207580]);} public static function IsFeatureEditable($_1805207580){ if($_1805207580 == '') return true; self::__458887765(); if(!isset(self::$_1268755276[$_1805207580])) return true; if(self::$_1268755276[$_1805207580] == ___400610784(30)) $_1862502038= array(___400610784(31)); elseif(isset(self::$_1261742969[___400610784(32)][self::$_1268755276[$_1805207580]])) $_1862502038= self::$_1261742969[___400610784(33)][self::$_1268755276[$_1805207580]]; else $_1862502038= array(___400610784(34)); if($_1862502038[(157*2-314)] != ___400610784(35) && $_1862502038[(220*2-440)] != ___400610784(36)){ return false;} elseif($_1862502038[(1072/2-536)] == ___400610784(37)){ if($_1862502038[round(0+0.5+0.5)]< $GLOBALS['____1446879639'][11]((1224/2-612),(760-2*380),(958-2*479), Date(___400610784(38)), $GLOBALS['____1446879639'][12](___400610784(39))- self::$_83436100, $GLOBALS['____1446879639'][13](___400610784(40)))){ if(!isset($_1862502038[round(0+0.5+0.5+0.5+0.5)]) ||!$_1862502038[round(0+0.66666666666667+0.66666666666667+0.66666666666667)]) self::__337557148(self::$_1268755276[$_1805207580]); return false;}} return true;} private static function __2021021565($_1805207580, $_262914583){ if($GLOBALS['____1446879639'][14]("CBXFeatures", "On".$_1805207580."SettingsChange")) $GLOBALS['____1446879639'][15](array("CBXFeatures", "On".$_1805207580."SettingsChange"), array($_1805207580, $_262914583)); $_620148416= $GLOBALS['_____1934502363'][0](___400610784(41), ___400610784(42).$_1805207580.___400610784(43)); while($_26058227= $_620148416->Fetch()) $GLOBALS['_____1934502363'][1]($_26058227, array($_1805207580, $_262914583));} public static function SetFeatureEnabled($_1805207580, $_262914583= true, $_1822681083= true){ if($GLOBALS['____1446879639'][16]($_1805207580) <= 0) return; if(!self::IsFeatureEditable($_1805207580)) $_262914583= false; $_262914583= (bool)$_262914583; self::__458887765(); $_774048815=(!isset(self::$_1261742969[___400610784(44)][$_1805207580]) && $_262914583 || isset(self::$_1261742969[___400610784(45)][$_1805207580]) && $_262914583 != self::$_1261742969[___400610784(46)][$_1805207580]); self::$_1261742969[___400610784(47)][$_1805207580]= $_262914583; $_1867873249= $GLOBALS['____1446879639'][17](self::$_1261742969); $_1867873249= $GLOBALS['____1446879639'][18]($_1867873249); COption::SetOptionString(___400610784(48), ___400610784(49), $_1867873249); if($_774048815 && $_1822681083) self::__2021021565($_1805207580, $_262914583);} private static function __337557148($_1032218208){ if($GLOBALS['____1446879639'][19]($_1032218208) <= 0 || $_1032218208 == "Portal") return; self::__458887765(); if(!isset(self::$_1261742969[___400610784(50)][$_1032218208]) || self::$_1261742969[___400610784(51)][$_1032218208][(216*2-432)] != ___400610784(52)) return; if(isset(self::$_1261742969[___400610784(53)][$_1032218208][round(0+0.4+0.4+0.4+0.4+0.4)]) && self::$_1261742969[___400610784(54)][$_1032218208][round(0+0.4+0.4+0.4+0.4+0.4)]) return; $_363556774= array(); if(isset(self::$_1685336964[$_1032218208]) && $GLOBALS['____1446879639'][20](self::$_1685336964[$_1032218208])){ foreach(self::$_1685336964[$_1032218208] as $_1805207580){ if(isset(self::$_1261742969[___400610784(55)][$_1805207580]) && self::$_1261742969[___400610784(56)][$_1805207580]){ self::$_1261742969[___400610784(57)][$_1805207580]= false; $_363556774[]= array($_1805207580, false);}} self::$_1261742969[___400610784(58)][$_1032218208][round(0+0.66666666666667+0.66666666666667+0.66666666666667)]= true;} $_1867873249= $GLOBALS['____1446879639'][21](self::$_1261742969); $_1867873249= $GLOBALS['____1446879639'][22]($_1867873249); COption::SetOptionString(___400610784(59), ___400610784(60), $_1867873249); foreach($_363556774 as $_150719449) self::__2021021565($_150719449[(139*2-278)], $_150719449[round(0+0.33333333333333+0.33333333333333+0.33333333333333)]);} public static function ModifyFeaturesSettings($_1369689088, $_266766836){ self::__458887765(); foreach($_1369689088 as $_1032218208 => $_1335612813) self::$_1261742969[___400610784(61)][$_1032218208]= $_1335612813; $_363556774= array(); foreach($_266766836 as $_1805207580 => $_262914583){ if(!isset(self::$_1261742969[___400610784(62)][$_1805207580]) && $_262914583 || isset(self::$_1261742969[___400610784(63)][$_1805207580]) && $_262914583 != self::$_1261742969[___400610784(64)][$_1805207580]) $_363556774[]= array($_1805207580, $_262914583); self::$_1261742969[___400610784(65)][$_1805207580]= $_262914583;} $_1867873249= $GLOBALS['____1446879639'][23](self::$_1261742969); $_1867873249= $GLOBALS['____1446879639'][24]($_1867873249); COption::SetOptionString(___400610784(66), ___400610784(67), $_1867873249); self::$_1261742969= false; foreach($_363556774 as $_150719449) self::__2021021565($_150719449[min(86,0,28.666666666667)], $_150719449[round(0+0.33333333333333+0.33333333333333+0.33333333333333)]);} public static function SaveFeaturesSettings($_913882349, $_850674556){ self::__458887765(); $_1861656391= array(___400610784(68) => array(), ___400610784(69) => array()); if(!$GLOBALS['____1446879639'][25]($_913882349)) $_913882349= array(); if(!$GLOBALS['____1446879639'][26]($_850674556)) $_850674556= array(); if(!$GLOBALS['____1446879639'][27](___400610784(70), $_913882349)) $_913882349[]= ___400610784(71); foreach(self::$_1685336964 as $_1032218208 => $_266766836){ if(isset(self::$_1261742969[___400610784(72)][$_1032218208])){ $_1509104758= self::$_1261742969[___400610784(73)][$_1032218208];} else{ $_1509104758=($_1032218208 == ___400610784(74)? array(___400610784(75)): array(___400610784(76)));} if($_1509104758[(144*2-288)] == ___400610784(77) || $_1509104758[(846-2*423)] == ___400610784(78)){ $_1861656391[___400610784(79)][$_1032218208]= $_1509104758;} else{ if($GLOBALS['____1446879639'][28]($_1032218208, $_913882349)) $_1861656391[___400610784(80)][$_1032218208]= array(___400610784(81), $GLOBALS['____1446879639'][29]((209*2-418), min(148,0,49.333333333333),(182*2-364), $GLOBALS['____1446879639'][30](___400610784(82)), $GLOBALS['____1446879639'][31](___400610784(83)), $GLOBALS['____1446879639'][32](___400610784(84)))); else $_1861656391[___400610784(85)][$_1032218208]= array(___400610784(86));}} $_363556774= array(); foreach(self::$_1268755276 as $_1805207580 => $_1032218208){ if($_1861656391[___400610784(87)][$_1032218208][min(170,0,56.666666666667)] != ___400610784(88) && $_1861656391[___400610784(89)][$_1032218208][(882-2*441)] != ___400610784(90)){ $_1861656391[___400610784(91)][$_1805207580]= false;} else{ if($_1861656391[___400610784(92)][$_1032218208][min(224,0,74.666666666667)] == ___400610784(93) && $_1861656391[___400610784(94)][$_1032218208][round(0+0.33333333333333+0.33333333333333+0.33333333333333)]< $GLOBALS['____1446879639'][33]((144*2-288), min(22,0,7.3333333333333),(145*2-290), Date(___400610784(95)), $GLOBALS['____1446879639'][34](___400610784(96))- self::$_83436100, $GLOBALS['____1446879639'][35](___400610784(97)))) $_1861656391[___400610784(98)][$_1805207580]= false; else $_1861656391[___400610784(99)][$_1805207580]= $GLOBALS['____1446879639'][36]($_1805207580, $_850674556); if(!isset(self::$_1261742969[___400610784(100)][$_1805207580]) && $_1861656391[___400610784(101)][$_1805207580] || isset(self::$_1261742969[___400610784(102)][$_1805207580]) && $_1861656391[___400610784(103)][$_1805207580] != self::$_1261742969[___400610784(104)][$_1805207580]) $_363556774[]= array($_1805207580, $_1861656391[___400610784(105)][$_1805207580]);}} $_1867873249= $GLOBALS['____1446879639'][37]($_1861656391); $_1867873249= $GLOBALS['____1446879639'][38]($_1867873249); COption::SetOptionString(___400610784(106), ___400610784(107), $_1867873249); self::$_1261742969= false; foreach($_363556774 as $_150719449) self::__2021021565($_150719449[(160*2-320)], $_150719449[round(0+0.33333333333333+0.33333333333333+0.33333333333333)]);} public static function GetFeaturesList(){ self::__458887765(); $_57906324= array(); foreach(self::$_1685336964 as $_1032218208 => $_266766836){ if(isset(self::$_1261742969[___400610784(108)][$_1032218208])){ $_1509104758= self::$_1261742969[___400610784(109)][$_1032218208];} else{ $_1509104758=($_1032218208 == ___400610784(110)? array(___400610784(111)): array(___400610784(112)));} $_57906324[$_1032218208]= array( ___400610784(113) => $_1509104758[(908-2*454)], ___400610784(114) => $_1509104758[round(0+0.5+0.5)], ___400610784(115) => array(),); $_57906324[$_1032218208][___400610784(116)]= false; if($_57906324[$_1032218208][___400610784(117)] == ___400610784(118)){ $_57906324[$_1032218208][___400610784(119)]= $GLOBALS['____1446879639'][39](($GLOBALS['____1446879639'][40]()- $_57906324[$_1032218208][___400610784(120)])/ round(0+28800+28800+28800)); if($_57906324[$_1032218208][___400610784(121)]> self::$_83436100) $_57906324[$_1032218208][___400610784(122)]= true;} foreach($_266766836 as $_1805207580) $_57906324[$_1032218208][___400610784(123)][$_1805207580]=(!isset(self::$_1261742969[___400610784(124)][$_1805207580]) || self::$_1261742969[___400610784(125)][$_1805207580]);} return $_57906324;} private static function __240282647($_814963532, $_350887257){ if(IsModuleInstalled($_814963532) == $_350887257) return true; $_872973343= $_SERVER[___400610784(126)].___400610784(127).$_814963532.___400610784(128); if(!$GLOBALS['____1446879639'][41]($_872973343)) return false; include_once($_872973343); $_1676023780= $GLOBALS['____1446879639'][42](___400610784(129), ___400610784(130), $_814963532); if(!$GLOBALS['____1446879639'][43]($_1676023780)) return false; $_1360185829= new $_1676023780; if($_350887257){ if(!$_1360185829->InstallDB()) return false; $_1360185829->InstallEvents(); if(!$_1360185829->InstallFiles()) return false;} else{ if(CModule::IncludeModule(___400610784(131))) CSearch::DeleteIndex($_814963532); UnRegisterModule($_814963532);} return true;} protected static function OnRequestsSettingsChange($_1805207580, $_262914583){ self::__240282647("form", $_262914583);} protected static function OnLearningSettingsChange($_1805207580, $_262914583){ self::__240282647("learning", $_262914583);} protected static function OnJabberSettingsChange($_1805207580, $_262914583){ self::__240282647("xmpp", $_262914583);} protected static function OnVideoConferenceSettingsChange($_1805207580, $_262914583){} protected static function OnBizProcSettingsChange($_1805207580, $_262914583){ self::__240282647("bizprocdesigner", $_262914583);} protected static function OnListsSettingsChange($_1805207580, $_262914583){ self::__240282647("lists", $_262914583);} protected static function OnWikiSettingsChange($_1805207580, $_262914583){ self::__240282647("wiki", $_262914583);} protected static function OnSupportSettingsChange($_1805207580, $_262914583){ self::__240282647("support", $_262914583);} protected static function OnControllerSettingsChange($_1805207580, $_262914583){ self::__240282647("controller", $_262914583);} protected static function OnAnalyticsSettingsChange($_1805207580, $_262914583){ self::__240282647("statistic", $_262914583);} protected static function OnVoteSettingsChange($_1805207580, $_262914583){ self::__240282647("vote", $_262914583);} protected static function OnFriendsSettingsChange($_1805207580, $_262914583){ if($_262914583) $_1071637223= "Y"; else $_1071637223= ___400610784(132); $_248495816= CSite::GetList(___400610784(133), ___400610784(134), array(___400610784(135) => ___400610784(136))); while($_703270166= $_248495816->Fetch()){ if(COption::GetOptionString(___400610784(137), ___400610784(138), ___400610784(139), $_703270166[___400610784(140)]) != $_1071637223){ COption::SetOptionString(___400610784(141), ___400610784(142), $_1071637223, false, $_703270166[___400610784(143)]); COption::SetOptionString(___400610784(144), ___400610784(145), $_1071637223);}}} protected static function OnMicroBlogSettingsChange($_1805207580, $_262914583){ if($_262914583) $_1071637223= "Y"; else $_1071637223= ___400610784(146); $_248495816= CSite::GetList(___400610784(147), ___400610784(148), array(___400610784(149) => ___400610784(150))); while($_703270166= $_248495816->Fetch()){ if(COption::GetOptionString(___400610784(151), ___400610784(152), ___400610784(153), $_703270166[___400610784(154)]) != $_1071637223){ COption::SetOptionString(___400610784(155), ___400610784(156), $_1071637223, false, $_703270166[___400610784(157)]); COption::SetOptionString(___400610784(158), ___400610784(159), $_1071637223);} if(COption::GetOptionString(___400610784(160), ___400610784(161), ___400610784(162), $_703270166[___400610784(163)]) != $_1071637223){ COption::SetOptionString(___400610784(164), ___400610784(165), $_1071637223, false, $_703270166[___400610784(166)]); COption::SetOptionString(___400610784(167), ___400610784(168), $_1071637223);}}} protected static function OnPersonalFilesSettingsChange($_1805207580, $_262914583){ if($_262914583) $_1071637223= "Y"; else $_1071637223= ___400610784(169); $_248495816= CSite::GetList(___400610784(170), ___400610784(171), array(___400610784(172) => ___400610784(173))); while($_703270166= $_248495816->Fetch()){ if(COption::GetOptionString(___400610784(174), ___400610784(175), ___400610784(176), $_703270166[___400610784(177)]) != $_1071637223){ COption::SetOptionString(___400610784(178), ___400610784(179), $_1071637223, false, $_703270166[___400610784(180)]); COption::SetOptionString(___400610784(181), ___400610784(182), $_1071637223);}}} protected static function OnPersonalBlogSettingsChange($_1805207580, $_262914583){ if($_262914583) $_1071637223= "Y"; else $_1071637223= ___400610784(183); $_248495816= CSite::GetList(___400610784(184), ___400610784(185), array(___400610784(186) => ___400610784(187))); while($_703270166= $_248495816->Fetch()){ if(COption::GetOptionString(___400610784(188), ___400610784(189), ___400610784(190), $_703270166[___400610784(191)]) != $_1071637223){ COption::SetOptionString(___400610784(192), ___400610784(193), $_1071637223, false, $_703270166[___400610784(194)]); COption::SetOptionString(___400610784(195), ___400610784(196), $_1071637223);}}} protected static function OnPersonalPhotoSettingsChange($_1805207580, $_262914583){ if($_262914583) $_1071637223= "Y"; else $_1071637223= ___400610784(197); $_248495816= CSite::GetList(___400610784(198), ___400610784(199), array(___400610784(200) => ___400610784(201))); while($_703270166= $_248495816->Fetch()){ if(COption::GetOptionString(___400610784(202), ___400610784(203), ___400610784(204), $_703270166[___400610784(205)]) != $_1071637223){ COption::SetOptionString(___400610784(206), ___400610784(207), $_1071637223, false, $_703270166[___400610784(208)]); COption::SetOptionString(___400610784(209), ___400610784(210), $_1071637223);}}} protected static function OnPersonalForumSettingsChange($_1805207580, $_262914583){ if($_262914583) $_1071637223= "Y"; else $_1071637223= ___400610784(211); $_248495816= CSite::GetList(___400610784(212), ___400610784(213), array(___400610784(214) => ___400610784(215))); while($_703270166= $_248495816->Fetch()){ if(COption::GetOptionString(___400610784(216), ___400610784(217), ___400610784(218), $_703270166[___400610784(219)]) != $_1071637223){ COption::SetOptionString(___400610784(220), ___400610784(221), $_1071637223, false, $_703270166[___400610784(222)]); COption::SetOptionString(___400610784(223), ___400610784(224), $_1071637223);}}} protected static function OnTasksSettingsChange($_1805207580, $_262914583){ if($_262914583) $_1071637223= "Y"; else $_1071637223= ___400610784(225); $_248495816= CSite::GetList(___400610784(226), ___400610784(227), array(___400610784(228) => ___400610784(229))); while($_703270166= $_248495816->Fetch()){ if(COption::GetOptionString(___400610784(230), ___400610784(231), ___400610784(232), $_703270166[___400610784(233)]) != $_1071637223){ COption::SetOptionString(___400610784(234), ___400610784(235), $_1071637223, false, $_703270166[___400610784(236)]); COption::SetOptionString(___400610784(237), ___400610784(238), $_1071637223);} if(COption::GetOptionString(___400610784(239), ___400610784(240), ___400610784(241), $_703270166[___400610784(242)]) != $_1071637223){ COption::SetOptionString(___400610784(243), ___400610784(244), $_1071637223, false, $_703270166[___400610784(245)]); COption::SetOptionString(___400610784(246), ___400610784(247), $_1071637223);}} self::__240282647(___400610784(248), $_262914583);} protected static function OnCalendarSettingsChange($_1805207580, $_262914583){ if($_262914583) $_1071637223= "Y"; else $_1071637223= ___400610784(249); $_248495816= CSite::GetList(___400610784(250), ___400610784(251), array(___400610784(252) => ___400610784(253))); while($_703270166= $_248495816->Fetch()){ if(COption::GetOptionString(___400610784(254), ___400610784(255), ___400610784(256), $_703270166[___400610784(257)]) != $_1071637223){ COption::SetOptionString(___400610784(258), ___400610784(259), $_1071637223, false, $_703270166[___400610784(260)]); COption::SetOptionString(___400610784(261), ___400610784(262), $_1071637223);} if(COption::GetOptionString(___400610784(263), ___400610784(264), ___400610784(265), $_703270166[___400610784(266)]) != $_1071637223){ COption::SetOptionString(___400610784(267), ___400610784(268), $_1071637223, false, $_703270166[___400610784(269)]); COption::SetOptionString(___400610784(270), ___400610784(271), $_1071637223);}}} protected static function OnSMTPSettingsChange($_1805207580, $_262914583){ self::__240282647("mail", $_262914583);} protected static function OnExtranetSettingsChange($_1805207580, $_262914583){ $_1789706833= COption::GetOptionString("extranet", "extranet_site", ""); if($_1789706833){ $_729321624= new CSite; $_729321624->Update($_1789706833, array(___400610784(272) =>($_262914583? ___400610784(273): ___400610784(274))));} self::__240282647(___400610784(275), $_262914583);} protected static function OnDAVSettingsChange($_1805207580, $_262914583){ self::__240282647("dav", $_262914583);} protected static function OntimemanSettingsChange($_1805207580, $_262914583){ self::__240282647("timeman", $_262914583);} protected static function Onintranet_sharepointSettingsChange($_1805207580, $_262914583){ if($_262914583){ RegisterModuleDependences("iblock", "OnAfterIBlockElementAdd", "intranet", "CIntranetEventHandlers", "SPRegisterUpdatedItem"); RegisterModuleDependences(___400610784(276), ___400610784(277), ___400610784(278), ___400610784(279), ___400610784(280)); CAgent::AddAgent(___400610784(281), ___400610784(282), ___400610784(283), round(0+166.66666666667+166.66666666667+166.66666666667)); CAgent::AddAgent(___400610784(284), ___400610784(285), ___400610784(286), round(0+300)); CAgent::AddAgent(___400610784(287), ___400610784(288), ___400610784(289), round(0+3600));} else{ UnRegisterModuleDependences(___400610784(290), ___400610784(291), ___400610784(292), ___400610784(293), ___400610784(294)); UnRegisterModuleDependences(___400610784(295), ___400610784(296), ___400610784(297), ___400610784(298), ___400610784(299)); CAgent::RemoveAgent(___400610784(300), ___400610784(301)); CAgent::RemoveAgent(___400610784(302), ___400610784(303)); CAgent::RemoveAgent(___400610784(304), ___400610784(305));}} protected static function OncrmSettingsChange($_1805207580, $_262914583){ if($_262914583) COption::SetOptionString("crm", "form_features", "Y"); self::__240282647(___400610784(306), $_262914583);} protected static function OnClusterSettingsChange($_1805207580, $_262914583){ self::__240282647("cluster", $_262914583);} protected static function OnMultiSitesSettingsChange($_1805207580, $_262914583){ if($_262914583) RegisterModuleDependences("main", "OnBeforeProlog", "main", "CWizardSolPanelIntranet", "ShowPanel", 100, "/modules/intranet/panel_button.php"); else UnRegisterModuleDependences(___400610784(307), ___400610784(308), ___400610784(309), ___400610784(310), ___400610784(311), ___400610784(312));} protected static function OnIdeaSettingsChange($_1805207580, $_262914583){ self::__240282647("idea", $_262914583);} protected static function OnMeetingSettingsChange($_1805207580, $_262914583){ self::__240282647("meeting", $_262914583);} protected static function OnXDImportSettingsChange($_1805207580, $_262914583){ self::__240282647("xdimport", $_262914583);}} $GLOBALS['____1446879639'][44](___400610784(313), ___400610784(314));/**/			//Do not remove this

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

if ((!(defined("STATISTIC_ONLY") && STATISTIC_ONLY && !str_starts_with($GLOBALS["APPLICATION"]->GetCurPage(), BX_ROOT . "/admin/"))) && Option::get("main", "include_charset", "Y") == "Y" && LANG_CHARSET != '')
{
	header("Content-Type: text/html; charset=".LANG_CHARSET);
}

$license = $application->getLicense();
header("X-Powered-CMS: Bitrix Site Manager (" . ($license->isDemoKey() ? "DEMO" : $license->getPublicHashKey()) . ")");

if (Option::get("main", "update_devsrv") == "Y")
{
	header("X-DevSrv-CMS: Bitrix");
}

//agents
if (Option::get("main", "check_agents", "Y") == "Y")
{
	$application->addBackgroundJob(["CAgent", "CheckAgents"], [], Main\Application::JOB_PRIORITY_LOW);
}

//send email events
if (Option::get("main", "check_events", "Y") !== "N")
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
	(Option::get("main", "use_session_id_ttl", "N") == "Y")
	&& ((int)Option::get("main", "session_id_ttl", 0) > 0)
	&& !defined("BX_SESSION_ID_CHANGE")
)
{
	if (!isset($kernelSession['SESS_ID_TIME']))
	{
		$kernelSession['SESS_ID_TIME'] = $currTime;
	}
	elseif (($kernelSession['SESS_ID_TIME'] + (int)Option::get("main", "session_id_ttl")) < $kernelSession['SESS_TIME'])
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

$formType = null;
$secureForms = false;
$bRsaError = false;
$USER_LID = false;

if (!defined("NOT_CHECK_PERMISSIONS") || NOT_CHECK_PERMISSIONS !== true)
{
	$doLogout = isset($_REQUEST["logout"]) && (strtolower($_REQUEST["logout"]) == "yes");

	if ($doLogout && $GLOBALS["USER"]->IsAuthorized())
	{
		$secureLogout = (Option::get("main", "secure_logout", "N") == "Y");

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
	if (!empty($_POST["AUTH_FORM"]))
	{
		if (Option::get('main', 'use_encrypted_auth', 'N') == 'Y')
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

			$formType = $_POST["TYPE"] ?? null;

			if (!empty($formType))
			{
				$secureForms = Option::get("main", "secure_auth_forms", "N") != "Y" || check_bitrix_sessid();

				if ($secureForms)
				{
					if ($formType == "AUTH")
					{
						$arAuthResult = $GLOBALS["USER"]->Login(
							$_POST["USER_LOGIN"] ?? '',
							$_POST["USER_PASSWORD"] ?? '',
							$_POST["USER_REMEMBER"] ?? ''
						);
					}
					elseif ($formType == "OTP")
					{
						$arAuthResult = $GLOBALS["USER"]->LoginByOtp(
							$_POST["USER_OTP"] ?? '',
							$_POST["OTP_REMEMBER"] ?? '',
							$_POST["captcha_word"] ?? '',
							$_POST["captcha_sid"] ?? ''
						);
					}
					elseif ($formType == "SEND_PWD")
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
					elseif ($formType == "CHANGE_PWD")
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
				}

				if ($formType == "AUTH" || $formType == "OTP")
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
	$cookie_prefix = Option::get('main', 'cookie_name', 'BITRIX_SM');
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
	if (!empty($_POST["AUTH_FORM"]) && $formType == "REGISTRATION")
	{
		if (!$bRsaError && $secureForms)
		{
			if (Option::get("main", "new_user_registration", "N") == "Y" && (!defined("ADMIN_SECTION") || ADMIN_SECTION !== true))
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

			if (Option::get("main", "event_log_permissions_fail", "N") === "Y")
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

/*ZDUyZmZNzVlZGJiNmFlZjE1ZjZkZTNhMmMzMjFmMGE2ZDIxNDM=*/$GLOBALS['____1375937298']= array(base64_decode('bXRfc'.'m'.'FuZ'.'A=='),base64_decode(''.'Y'.'2'.'Fs'.'bF'.'91c2VyX2'.'Z1'.'b'.'mM='),base64_decode('c3RycG'.'9z'),base64_decode('Z'.'XhwbG9kZQ'.'='.'='),base64_decode('cGFjaw='.'='),base64_decode(''.'bWQ1'),base64_decode('Y'.'2'.'9'.'uc3RhbnQ'.'='),base64_decode('aGFzaF9o'.'b'.'WF'.'j'),base64_decode('c3RyY'.'21w'),base64_decode('Y2Fs'.'bF91'.'c2VyX2Z1bmM='),base64_decode(''.'Y'.'2FsbF91c'.'2VyX2'.'Z1bmM='),base64_decode('aXN'.'fb'.'2JqZWN0'),base64_decode(''.'Y2F'.'sbF9'.'1c2Vy'.'X'.'2Z'.'1b'.'m'.'M='),base64_decode('Y2Fs'.'bF91c2VyX2'.'Z1b'.'mM='),base64_decode('Y2F'.'sbF'.'91c'.'2V'.'yX2Z1bmM='),base64_decode(''.'Y2FsbF9'.'1c2VyX2Z1bmM='),base64_decode('Y2F'.'sbF91c2VyX2Z'.'1bmM'.'='),base64_decode('Y2FsbF91c2Vy'.'X'.'2Z1bmM='));if(!function_exists(__NAMESPACE__.'\\___501230066')){function ___501230066($_433142322){static $_1653806675= false; if($_1653806675 == false) $_1653806675=array('XENPcH'.'Rpb246Okd'.'ldE'.'9wd'.'Glv'.'blN'.'0cm'.'l'.'uZw==','b'.'WFpb'.'g==','f'.'l'.'BBUkFNX01'.'BWF9VU0'.'VS'.'Uw==','Lg='.'=','Lg==',''.'SCo=','Yml0cml4','TE'.'lDR'.'U5TRV9LRVk=','c2hhMjU'.'2','X'.'ENPcHRp'.'b24'.'6'.'Ok'.'dldE9w'.'dGl'.'v'.'blN0'.'cml'.'uZw==',''.'bWFpbg==','UEFSQU1fTUFYX1VTR'.'VJT','XEJpdHJpeFxNYW'.'lu'.'XENvbmZp'.'Z1xPcHRpb'.'246OnNl'.'dA='.'=',''.'bWFpbg==','UEFSQU1'.'fTUF'.'YX1VTRVJT',''.'VV'.'NFUg==','VVNFUg==','VVNFUg==','S'.'XNBdXRob3JpemVk',''.'VVN'.'FU'.'g'.'='.'=','SXNBZG1pb'.'g==','QV'.'BQTElD'.'QVR'.'JT04=',''.'Um'.'VzdGF'.'y'.'dEJ1ZmZ'.'lcg==','TG9jYWxSZWR'.'pc'.'mV'.'j'.'dA==','L2'.'xp'.'Y2Vuc2'.'Vf'.'cmVzdHJpY'.'3Rpb24u'.'cGh'.'w',''.'XENP'.'cHR'.'pb2'.'46'.'O'.'kdl'.'d'.'E9wdGlv'.'blN0'.'c'.'m'.'luZw==','bWFpbg==','UE'.'FSQU1fTUFY'.'X1V'.'TRVJT','XEJp'.'dHJ'.'peFxN'.'YWluXEN'.'vbmZp'.'Z1xPcHRpb246OnNldA==','bW'.'Fp'.'bg==','U'.'EF'.'SQU1fT'.'UFY'.'X1VTRV'.'JT');return base64_decode($_1653806675[$_433142322]);}};if($GLOBALS['____1375937298'][0](round(0+1), round(0+5+5+5+5)) == round(0+3.5+3.5)){ $_143243313= $GLOBALS['____1375937298'][1](___501230066(0), ___501230066(1), ___501230066(2)); if(!empty($_143243313) && $GLOBALS['____1375937298'][2]($_143243313, ___501230066(3)) !== false){ list($_879206300, $_1266366642)= $GLOBALS['____1375937298'][3](___501230066(4), $_143243313); $_773095016= $GLOBALS['____1375937298'][4](___501230066(5), $_879206300); $_1344244295= ___501230066(6).$GLOBALS['____1375937298'][5]($GLOBALS['____1375937298'][6](___501230066(7))); $_578831518= $GLOBALS['____1375937298'][7](___501230066(8), $_1266366642, $_1344244295, true); if($GLOBALS['____1375937298'][8]($_578831518, $_773095016) !==(824-2*412)){ if($GLOBALS['____1375937298'][9](___501230066(9), ___501230066(10), ___501230066(11)) != round(0+4+4+4)){ $GLOBALS['____1375937298'][10](___501230066(12), ___501230066(13), ___501230066(14), round(0+12));} if(isset($GLOBALS[___501230066(15)]) && $GLOBALS['____1375937298'][11]($GLOBALS[___501230066(16)]) && $GLOBALS['____1375937298'][12](array($GLOBALS[___501230066(17)], ___501230066(18))) &&!$GLOBALS['____1375937298'][13](array($GLOBALS[___501230066(19)], ___501230066(20)))){ $GLOBALS['____1375937298'][14](array($GLOBALS[___501230066(21)], ___501230066(22))); $GLOBALS['____1375937298'][15](___501230066(23), ___501230066(24), true);}}} else{ if($GLOBALS['____1375937298'][16](___501230066(25), ___501230066(26), ___501230066(27)) != round(0+12)){ $GLOBALS['____1375937298'][17](___501230066(28), ___501230066(29), ___501230066(30), round(0+2.4+2.4+2.4+2.4+2.4));}}}/**/       //Do not remove this