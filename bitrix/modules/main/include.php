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

error_reporting(COption::GetOptionInt("main", "error_reporting", E_COMPILE_ERROR | E_ERROR | E_CORE_ERROR | E_PARSE) & ~E_STRICT & ~E_DEPRECATED & ~E_WARNING & ~E_NOTICE);

if (!defined("BX_COMP_MANAGED_CACHE") && COption::GetOptionString("main", "component_managed_cache_on", "Y") != "N")
{
	define("BX_COMP_MANAGED_CACHE", true);
}

// global functions
require_once __DIR__ . "/filter_tools.php";

/*ZDUyZmZYWFmOThmODAzNWVhYjE2OGY4Zjg0NTA1OTI5Njg5ZTY=*/$GLOBALS['_____2105168098']= array(base64_decode('R2V0TW9'.'kd'.'WxlRXZl'.'bn'.'Rz'),base64_decode(''.'R'.'XhlY3'.'V0'.'ZU1vZHVsZUV'.'2'.'ZW50RX'.'g='));$GLOBALS['____1338047942']= array(base64_decode(''.'ZG'.'V'.'maW'.'5'.'l'),base64_decode('Ym'.'FzZTY0X2RlY29'.'kZ'.'Q='.'='),base64_decode('d'.'W5'.'zZXJ'.'pYWx'.'pe'.'mU='),base64_decode('aXNfYXJyYXk='),base64_decode('aW5fYXJyYXk='),base64_decode('c2V'.'yaWFsa'.'Xpl'),base64_decode('YmFz'.'ZTY0X'.'2V'.'u'.'Y29kZQ='.'='),base64_decode('bWt'.'0aW'.'1l'),base64_decode('ZGF0ZQ=='),base64_decode('Z'.'GF0'.'ZQ'.'=='),base64_decode(''.'c3RybG'.'V'.'u'),base64_decode('b'.'Wt'.'0'.'aW'.'1l'),base64_decode('ZGF0ZQ='.'='),base64_decode('ZGF0ZQ=='),base64_decode('bWV'.'0aG9'.'kX'.'2V4aXN0'.'cw'.'=='),base64_decode('Y2Fsb'.'F9'.'1c2V'.'yX2Z'.'1bm'.'NfY'.'XJyYXk'.'='),base64_decode('c3RybGVu'),base64_decode('c2Vy'.'aWFsa'.'Xpl'),base64_decode('YmFzZ'.'T'.'Y0X2VuY29kZQ=='),base64_decode('c3'.'Ryb'.'GV'.'u'),base64_decode('aXNf'.'YXJyYX'.'k'.'='),base64_decode(''.'c2VyaWFsa'.'Xpl'),base64_decode('YmFzZTY0'.'X2Vu'.'Y29k'.'ZQ=='),base64_decode('c2VyaWFsaXpl'),base64_decode('Y'.'m'.'F'.'z'.'Z'.'TY0X2Vu'.'Y29kZ'.'Q=='),base64_decode('aX'.'NfYXJ'.'yYXk='),base64_decode(''.'aXNfYXJyYXk='),base64_decode('a'.'W'.'5'.'f'.'YXJyYXk='),base64_decode(''.'aW5'.'fYX'.'JyYXk='),base64_decode('bWt0aW1'.'l'),base64_decode('ZG'.'F'.'0'.'ZQ=='),base64_decode('ZGF'.'0ZQ=='),base64_decode(''.'ZGF0ZQ=='),base64_decode(''.'b'.'W'.'t0aW1'.'l'),base64_decode('ZGF0ZQ=='),base64_decode(''.'Z'.'GF0ZQ=='),base64_decode('aW5fYXJyYXk'.'='),base64_decode('c'.'2'.'V'.'ya'.'WFsaXpl'),base64_decode(''.'YmFzZTY0X'.'2VuY29kZQ'.'=='),base64_decode('aW50dmFs'),base64_decode('dGltZQ'.'='.'='),base64_decode(''.'Zm'.'ls'.'ZV'.'9'.'l'.'eGl'.'z'.'dHM='),base64_decode(''.'c3RyX3J'.'l'.'cGx'.'hY'.'2U='),base64_decode('Y2xhc3NfZXhpc3'.'Rz'),base64_decode('ZGVmaW5l'));if(!function_exists(__NAMESPACE__.'\\___1412670749')){function ___1412670749($_1821123413){static $_545780223= false; if($_545780223 == false) $_545780223=array('SU5'.'U'.'UkFORVR'.'fRUR'.'JVE'.'lPTg'.'='.'=',''.'W'.'Q==','bWF'.'pbg==',''.'fmNwZl9tYXBfd'.'mFs'.'dW'.'U=','','','YWxsb3dlZF'.'9jbG'.'Fzc2'.'Vz','ZQ==','Zg==',''.'ZQ==','Rg'.'='.'=','WA==','Zg==','bWFpb'.'g==','fmNw'.'Zl9'.'tYXB'.'fd'.'mFs'.'dW'.'U=','UG'.'9ydGFs','Rg==','ZQ==','Z'.'Q='.'=','WA'.'==',''.'Rg==','RA'.'==','R'.'A==','bQ'.'==','ZA==','W'.'Q==',''.'Zg==','Z'.'g==',''.'Zg='.'=','Zg==','UG9ydGFs','Rg'.'==','Z'.'Q'.'='.'=','ZQ='.'=','WA='.'=','Rg==','RA==',''.'RA==','bQ==',''.'ZA==','WQ==',''.'bWFpbg==','T24=','U2V'.'0d'.'G'.'lu'.'Z3NDaGF'.'u'.'Z2U=',''.'Zg==','Zg'.'==','Zg='.'=','Zg'.'='.'=','bWFpbg'.'==','fmN'.'wZ'.'l9tYXBf'.'dmFsdWU'.'=','Z'.'Q'.'='.'=','ZQ'.'='.'=',''.'RA==','ZQ='.'=','ZQ='.'=',''.'Zg==',''.'Zg==','Zg==','Z'.'Q==','bWF'.'p'.'bg==','fmN'.'wZ'.'l'.'9tYXBfdmF'.'sdWU=',''.'ZQ==','Zg'.'==','Zg'.'='.'=',''.'Z'.'g==',''.'Zg==','b'.'W'.'F'.'p'.'bg==','f'.'mNwZ'.'l'.'9tYX'.'BfdmF'.'s'.'d'.'WU=','ZQ==','Zg==',''.'U'.'G9y'.'dGF'.'s','UG'.'9y'.'dGF'.'s','Z'.'Q'.'==','ZQ==','UG9y'.'dG'.'Fs',''.'R'.'g==','WA==','Rg='.'=','RA==','ZQ==','Z'.'Q==','RA==',''.'bQ==','ZA==','WQ==','ZQ==','WA==',''.'ZQ==','Rg==','ZQ==','RA==','Zg==',''.'ZQ==','R'.'A==',''.'Z'.'Q==','bQ==','ZA==','WQ==','Zg'.'==','Z'.'g==',''.'Zg'.'==',''.'Zg='.'=','Zg==','Z'.'g'.'==','Zg='.'=','Zg==','bWFpbg==','f'.'mNw'.'Zl9tYXBf'.'dmFsd'.'WU'.'=','Z'.'Q==','ZQ==','UG9yd'.'GFs',''.'R'.'g==',''.'WA==','VFlQRQ==','REFURQ==',''.'R'.'kVBVFV'.'SRVM=',''.'RVhQSVJFRA==','VFlQRQ==','R'.'A==',''.'VF'.'JZX0'.'RBWVNfQ0'.'9'.'VT'.'lQ=','R'.'EFURQ==','VFJZX0RBW'.'V'.'NfQ09VTlQ=','RVhQSVJFR'.'A==','RkVB'.'V'.'FVS'.'RVM=','Z'.'g'.'==','Zg==','RE9D'.'VU1F'.'TlRf'.'Uk9PVA==','L2Jp'.'dHJpeC9tb2R1bGVzLw==','L'.'2'.'luc3RhbGwv'.'aW5kZXgu'.'cGhw','Lg='.'=','X'.'w==',''.'c2'.'Vhcm'.'No','T'.'g==','','','QUNU'.'SVZ'.'F','WQ==',''.'c'.'29jaWFsbmV0d29y'.'aw='.'=',''.'YWxsb3dfZ'.'nJpZWxk'.'cw==','WQ==','SUQ=','c29jaWFsbm'.'V0d'.'29yaw==','YWxs'.'b3dfZnJpZWxk'.'cw==','SUQ=','c'.'29'.'j'.'a'.'W'.'FsbmV0d'.'29yaw='.'=','YWxsb3d'.'fZn'.'JpZ'.'Wxkc'.'w==',''.'Tg==','','',''.'Q'.'UNUSVZF','W'.'Q==','c29j'.'aWFsbmV0d'.'29ya'.'w'.'==','YWxsb3df'.'bWlj'.'cm9i'.'b'.'G9nX3VzZXI'.'=','W'.'Q==','SUQ'.'=','c2'.'9ja'.'WFs'.'b'.'mV0'.'d29ya'.'w==','YWxs'.'b'.'3df'.'b'.'Wljcm9'.'ibG9'.'nX3V'.'z'.'ZXI=',''.'SUQ=',''.'c29j'.'aW'.'FsbmV'.'0d29yaw==','YWx'.'s'.'b3df'.'bWljcm'.'9ibG9'.'nX3V'.'zZXI=','c29j'.'aWFsbmV0d29y'.'aw==','YWxsb3'.'dfbWljcm9'.'ibG9nX2dy'.'b'.'3V'.'w','WQ==','SU'.'Q=',''.'c29ja'.'WFsbmV0d29'.'yaw==','Y'.'Wxsb'.'3dfb'.'Wljcm9ibG9nX2d'.'yb'.'3Vw','SU'.'Q'.'=',''.'c29jaWFsbmV0d2'.'9yaw==','YWxsb3dfbWljcm'.'9ibG'.'9nX2dyb'.'3V'.'w','Tg==','','','QUNU'.'S'.'VZF','WQ'.'==','c'.'29jaWFsbmV0d29yaw==',''.'YWxsb3'.'d'.'fZ'.'m'.'lsZXNfdXN'.'lcg==','W'.'Q='.'=','S'.'UQ=','c2'.'9jaW'.'Fsbm'.'V0d2'.'9yaw='.'=',''.'Y'.'Wxsb3d'.'f'.'ZmlsZXNfdXNlcg='.'=','SUQ=','c2'.'9j'.'aW'.'Fs'.'bmV'.'0'.'d29yaw'.'==','YW'.'xsb3dfZmlsZXNf'.'dXNlc'.'g==','T'.'g==','','','QU'.'NUS'.'VZ'.'F','WQ='.'=',''.'c'.'29jaW'.'FsbmV0d29ya'.'w'.'==','YWx'.'sb3df'.'YmxvZ1'.'91c2Vy','WQ'.'==','SU'.'Q=','c29jaWF'.'sbmV0d29yaw==','YWxsb3'.'d'.'fY'.'mxvZ191c2Vy',''.'SUQ=','c'.'29'.'jaWFsbmV0d'.'29yaw='.'=',''.'YWxsb3'.'d'.'f'.'Y'.'mxvZ191c2Vy','Tg='.'=','','','QU'.'N'.'USVZ'.'F','WQ'.'==','c'.'29'.'jaWFsb'.'mV0'.'d29'.'yaw==','YWxsb3'.'d'.'f'.'cG'.'hvd'.'G9fdXNlcg==','WQ'.'==','SUQ=',''.'c2'.'9jaWFs'.'bmV0d29yaw==','YWxsb3df'.'cG'.'hvdG'.'9fdX'.'Nlcg'.'==','SU'.'Q=','c29jaWF'.'sbm'.'V0d29'.'yaw==','YWxsb3dfcGhvdG9fdXN'.'lc'.'g'.'==','T'.'g'.'='.'=','','','QUN'.'USVZ'.'F',''.'WQ==','c'.'29jaW'.'FsbmV0d'.'2'.'9yaw==','YWxsb3dfZm9ydW1f'.'dXN'.'lcg'.'==','WQ==','SUQ=','c29jaWFsbm'.'V0d29'.'yaw==','YWxsb3'.'dfZ'.'m9ydW1fd'.'XNlcg==','SU'.'Q=','c29jaWFsbmV0d29yaw'.'==','YWxsb3'.'dfZ'.'m9yd'.'W1fdXNlcg='.'=','Tg='.'=','','','QUNUSV'.'Z'.'F','WQ==','c2'.'9jaW'.'F'.'sbmV0d29yaw==',''.'YWxsb3'.'dfdG'.'Fza'.'3NfdXN'.'l'.'c'.'g='.'=','WQ==',''.'S'.'UQ=','c29'.'jaW'.'FsbmV0'.'d29yaw'.'='.'=','YWx'.'s'.'b3'.'dfdGFza3NfdX'.'Nlcg==','SUQ=',''.'c29ja'.'W'.'F'.'sbmV0d'.'2'.'9yaw'.'==','YW'.'xsb3'.'d'.'fdGF'.'za'.'3Nf'.'d'.'XNlcg==','c29ja'.'W'.'F'.'sbmV0d2'.'9yaw'.'==','YW'.'xsb3dfdGFz'.'a3N'.'fZ3Jvd'.'XA=',''.'WQ='.'=','SU'.'Q=','c29'.'jaWF'.'sb'.'mV0d29yaw==','YWxsb3dfd'.'GF'.'za'.'3NfZ3Jvd'.'X'.'A'.'=',''.'SUQ=','c29jaW'.'Fs'.'bmV0d29'.'yaw==',''.'YWxsb'.'3dfdGFza3NfZ3'.'Jv'.'d'.'XA=','dG'.'Fza3M=','Tg'.'==','','','QUNUSVZ'.'F','WQ==','c29ja'.'WFsbmV0d'.'29yaw==','YWxs'.'b3dfY2F'.'sZW5'.'k'.'YXJfdXNlc'.'g==','WQ==','SUQ'.'=','c'.'29jaWFsb'.'mV0d2'.'9y'.'aw='.'=','YWxsb3'.'dfY2FsZW5kY'.'XJ'.'fdXN'.'lcg='.'=','SUQ'.'=',''.'c'.'29ja'.'WFsbmV'.'0d29ya'.'w'.'==','YWxsb'.'3df'.'Y2FsZW5'.'k'.'YXJfdX'.'Nlc'.'g==','c'.'29'.'jaWFsb'.'m'.'V'.'0d29ya'.'w==','YWxsb3d'.'fY2FsZ'.'W5kY'.'XJ'.'f'.'Z'.'3JvdXA=','WQ'.'==','SUQ'.'=','c'.'29'.'jaWFsbm'.'V0d29yaw==','Y'.'Wxsb3d'.'fY2FsZW'.'5'.'kYXJf'.'Z'.'3Jvd'.'X'.'A=','SU'.'Q=','c29jaWFsbm'.'V0d29yaw==','YWxsb'.'3dfY2'.'Fs'.'ZW5kYXJf'.'Z3'.'JvdXA=','QUN'.'USVZF','WQ'.'='.'=','T'.'g'.'==',''.'Z'.'Xh0c'.'mF'.'u'.'ZXQ=',''.'aWJsb2'.'Nr','T25BZn'.'R'.'lcklCbG9ja0VsZW1lbnRVc'.'GRhdGU'.'=','aW'.'50'.'cmFuZXQ'.'=',''.'Q0ludHJhbmV0R'.'X'.'Zl'.'b'.'nRIY'.'W5kbG'.'Vyc'.'w'.'==','U1BSZWdpc3RlclVwZ'.'GF'.'0ZWRJ'.'dGVt','Q0l'.'udHJh'.'bmV0U2hhcmVwb2ludDo6QWdlbnRM'.'aXN0c'.'y'.'gpOw==','aW5'.'0c'.'m'.'FuZXQ=','Tg'.'==','Q0'.'l'.'udHJh'.'bmV0U'.'2hhcmVw'.'b2ludDo'.'6'.'QWdlbnRRdW'.'V1ZSgpOw==','aW50cm'.'FuZXQ'.'=','T'.'g==','Q0ludHJ'.'h'.'bm'.'V'.'0U2hhcmVwb2l'.'ud'.'D'.'o6Q'.'Wdlb'.'nRV'.'c'.'GRhdGUoKTs=','aW50'.'cmFuZXQ=','Tg==',''.'a'.'WJsb2'.'Nr','T25BZnRlck'.'lCbG9'.'ja0VsZW1lbn'.'RBZGQ=','aW5'.'0c'.'mFuZXQ=','Q0l'.'udH'.'J'.'h'.'b'.'mV'.'0'.'RX'.'Z'.'lb'.'n'.'RIYW5kb'.'GVycw'.'==','U'.'1B'.'SZWdpc3'.'Rlcl'.'V'.'wZGF'.'0'.'ZWRJd'.'GVt',''.'aWJ'.'sb2Nr','T25BZn'.'R'.'lcklCbG9'.'ja0VsZW1lb'.'nR'.'Vc'.'GRhdGU=','a'.'W'.'50'.'cmFuZXQ'.'=',''.'Q'.'0ludHJh'.'bmV0R'.'XZlbn'.'RIYW5kbGVycw==','U1BSZW'.'d'.'pc3RlclVw'.'Z'.'GF0ZW'.'R'.'JdGVt',''.'Q0'.'lud'.'HJhbmV0U2hh'.'cm'.'Vwb2ludDo6QWdlbnRMa'.'XN'.'0cy'.'gpOw==','aW50c'.'mFu'.'ZXQ=','Q0ludHJh'.'b'.'mV'.'0U'.'2hhcmVwb2'.'lu'.'d'.'Do6'.'QWd'.'lb'.'nRR'.'d'.'W'.'V1'.'ZSg'.'pOw==','aW50cmFuZXQ=','Q0'.'ludHJ'.'h'.'b'.'mV0'.'U2hhcmVwb2ludDo6QW'.'dl'.'bnR'.'V'.'cG'.'Rhd'.'G'.'UoKTs'.'=','aW'.'50cmFuZXQ'.'=','Y3Jt','bWF'.'pbg='.'=','T'.'2'.'5CZWZv'.'cmVQcm9'.'sb2c=',''.'b'.'WFp'.'bg='.'=',''.'Q1dp'.'e'.'mFyZF'.'NvbFBh'.'bmVsSW50cmFuZXQ=','U2hvd1'.'Bhbm'.'Vs','L'.'21vZHV'.'sZXMvaW50cmFuZX'.'Qvc'.'GFuZWxfYn'.'V'.'0d'.'G9'.'uLnB'.'oc'.'A==','RU5D'.'T0R'.'F','WQ==');return base64_decode($_545780223[$_1821123413]);}};$GLOBALS['____1338047942'][0](___1412670749(0), ___1412670749(1));class CBXFeatures{ private static $_252079112= 30; private static $_2122616441= array( "Portal" => array( "CompanyCalendar", "CompanyPhoto", "CompanyVideo", "CompanyCareer", "StaffChanges", "StaffAbsence", "CommonDocuments", "MeetingRoomBookingSystem", "Wiki", "Learning", "Vote", "WebLink", "Subscribe", "Friends", "PersonalFiles", "PersonalBlog", "PersonalPhoto", "PersonalForum", "Blog", "Forum", "Gallery", "Board", "MicroBlog", "WebMessenger",), "Communications" => array( "Tasks", "Calendar", "Workgroups", "Jabber", "VideoConference", "Extranet", "SMTP", "Requests", "DAV", "intranet_sharepoint", "timeman", "Idea", "Meeting", "EventList", "Salary", "XDImport",), "Enterprise" => array( "BizProc", "Lists", "Support", "Analytics", "crm", "Controller", "LdapUnlimitedUsers",), "Holding" => array( "Cluster", "MultiSites",),); private static $_2096028057= null; private static $_968959662= null; private static function __2106553229(){ if(self::$_2096028057 === null){ self::$_2096028057= array(); foreach(self::$_2122616441 as $_2074882924 => $_1128511397){ foreach($_1128511397 as $_1437175475) self::$_2096028057[$_1437175475]= $_2074882924;}} if(self::$_968959662 === null){ self::$_968959662= array(); $_1908923488= COption::GetOptionString(___1412670749(2), ___1412670749(3), ___1412670749(4)); if($_1908923488 != ___1412670749(5)){ $_1908923488= $GLOBALS['____1338047942'][1]($_1908923488); $_1908923488= $GLOBALS['____1338047942'][2]($_1908923488,[___1412670749(6) => false]); if($GLOBALS['____1338047942'][3]($_1908923488)){ self::$_968959662= $_1908923488;}} if(empty(self::$_968959662)){ self::$_968959662= array(___1412670749(7) => array(), ___1412670749(8) => array());}}} public static function InitiateEditionsSettings($_1428104184){ self::__2106553229(); $_302770584= array(); foreach(self::$_2122616441 as $_2074882924 => $_1128511397){ $_508732240= $GLOBALS['____1338047942'][4]($_2074882924, $_1428104184); self::$_968959662[___1412670749(9)][$_2074882924]=($_508732240? array(___1412670749(10)): array(___1412670749(11))); foreach($_1128511397 as $_1437175475){ self::$_968959662[___1412670749(12)][$_1437175475]= $_508732240; if(!$_508732240) $_302770584[]= array($_1437175475, false);}} $_2095007435= $GLOBALS['____1338047942'][5](self::$_968959662); $_2095007435= $GLOBALS['____1338047942'][6]($_2095007435); COption::SetOptionString(___1412670749(13), ___1412670749(14), $_2095007435); foreach($_302770584 as $_1298763613) self::__926646116($_1298763613[(814-2*407)], $_1298763613[round(0+0.5+0.5)]);} public static function IsFeatureEnabled($_1437175475){ if($_1437175475 == '') return true; self::__2106553229(); if(!isset(self::$_2096028057[$_1437175475])) return true; if(self::$_2096028057[$_1437175475] == ___1412670749(15)) $_2124796530= array(___1412670749(16)); elseif(isset(self::$_968959662[___1412670749(17)][self::$_2096028057[$_1437175475]])) $_2124796530= self::$_968959662[___1412670749(18)][self::$_2096028057[$_1437175475]]; else $_2124796530= array(___1412670749(19)); if($_2124796530[(816-2*408)] != ___1412670749(20) && $_2124796530[min(226,0,75.333333333333)] != ___1412670749(21)){ return false;} elseif($_2124796530[(1268/2-634)] == ___1412670749(22)){ if($_2124796530[round(0+0.5+0.5)]< $GLOBALS['____1338047942'][7]((1056/2-528),(938-2*469),(135*2-270), Date(___1412670749(23)), $GLOBALS['____1338047942'][8](___1412670749(24))- self::$_252079112, $GLOBALS['____1338047942'][9](___1412670749(25)))){ if(!isset($_2124796530[round(0+0.66666666666667+0.66666666666667+0.66666666666667)]) ||!$_2124796530[round(0+1+1)]) self::__12405654(self::$_2096028057[$_1437175475]); return false;}} return!isset(self::$_968959662[___1412670749(26)][$_1437175475]) || self::$_968959662[___1412670749(27)][$_1437175475];} public static function IsFeatureInstalled($_1437175475){ if($GLOBALS['____1338047942'][10]($_1437175475) <= 0) return true; self::__2106553229(); return(isset(self::$_968959662[___1412670749(28)][$_1437175475]) && self::$_968959662[___1412670749(29)][$_1437175475]);} public static function IsFeatureEditable($_1437175475){ if($_1437175475 == '') return true; self::__2106553229(); if(!isset(self::$_2096028057[$_1437175475])) return true; if(self::$_2096028057[$_1437175475] == ___1412670749(30)) $_2124796530= array(___1412670749(31)); elseif(isset(self::$_968959662[___1412670749(32)][self::$_2096028057[$_1437175475]])) $_2124796530= self::$_968959662[___1412670749(33)][self::$_2096028057[$_1437175475]]; else $_2124796530= array(___1412670749(34)); if($_2124796530[(1364/2-682)] != ___1412670749(35) && $_2124796530[min(198,0,66)] != ___1412670749(36)){ return false;} elseif($_2124796530[(207*2-414)] == ___1412670749(37)){ if($_2124796530[round(0+0.5+0.5)]< $GLOBALS['____1338047942'][11]((838-2*419),(854-2*427),(142*2-284), Date(___1412670749(38)), $GLOBALS['____1338047942'][12](___1412670749(39))- self::$_252079112, $GLOBALS['____1338047942'][13](___1412670749(40)))){ if(!isset($_2124796530[round(0+0.66666666666667+0.66666666666667+0.66666666666667)]) ||!$_2124796530[round(0+1+1)]) self::__12405654(self::$_2096028057[$_1437175475]); return false;}} return true;} private static function __926646116($_1437175475, $_955041766){ if($GLOBALS['____1338047942'][14]("CBXFeatures", "On".$_1437175475."SettingsChange")) $GLOBALS['____1338047942'][15](array("CBXFeatures", "On".$_1437175475."SettingsChange"), array($_1437175475, $_955041766)); $_42627350= $GLOBALS['_____2105168098'][0](___1412670749(41), ___1412670749(42).$_1437175475.___1412670749(43)); while($_1311695291= $_42627350->Fetch()) $GLOBALS['_____2105168098'][1]($_1311695291, array($_1437175475, $_955041766));} public static function SetFeatureEnabled($_1437175475, $_955041766= true, $_485487694= true){ if($GLOBALS['____1338047942'][16]($_1437175475) <= 0) return; if(!self::IsFeatureEditable($_1437175475)) $_955041766= false; $_955041766= (bool)$_955041766; self::__2106553229(); $_559088220=(!isset(self::$_968959662[___1412670749(44)][$_1437175475]) && $_955041766 || isset(self::$_968959662[___1412670749(45)][$_1437175475]) && $_955041766 != self::$_968959662[___1412670749(46)][$_1437175475]); self::$_968959662[___1412670749(47)][$_1437175475]= $_955041766; $_2095007435= $GLOBALS['____1338047942'][17](self::$_968959662); $_2095007435= $GLOBALS['____1338047942'][18]($_2095007435); COption::SetOptionString(___1412670749(48), ___1412670749(49), $_2095007435); if($_559088220 && $_485487694) self::__926646116($_1437175475, $_955041766);} private static function __12405654($_2074882924){ if($GLOBALS['____1338047942'][19]($_2074882924) <= 0 || $_2074882924 == "Portal") return; self::__2106553229(); if(!isset(self::$_968959662[___1412670749(50)][$_2074882924]) || self::$_968959662[___1412670749(51)][$_2074882924][min(28,0,9.3333333333333)] != ___1412670749(52)) return; if(isset(self::$_968959662[___1412670749(53)][$_2074882924][round(0+2)]) && self::$_968959662[___1412670749(54)][$_2074882924][round(0+1+1)]) return; $_302770584= array(); if(isset(self::$_2122616441[$_2074882924]) && $GLOBALS['____1338047942'][20](self::$_2122616441[$_2074882924])){ foreach(self::$_2122616441[$_2074882924] as $_1437175475){ if(isset(self::$_968959662[___1412670749(55)][$_1437175475]) && self::$_968959662[___1412670749(56)][$_1437175475]){ self::$_968959662[___1412670749(57)][$_1437175475]= false; $_302770584[]= array($_1437175475, false);}} self::$_968959662[___1412670749(58)][$_2074882924][round(0+1+1)]= true;} $_2095007435= $GLOBALS['____1338047942'][21](self::$_968959662); $_2095007435= $GLOBALS['____1338047942'][22]($_2095007435); COption::SetOptionString(___1412670749(59), ___1412670749(60), $_2095007435); foreach($_302770584 as $_1298763613) self::__926646116($_1298763613[(1428/2-714)], $_1298763613[round(0+0.25+0.25+0.25+0.25)]);} public static function ModifyFeaturesSettings($_1428104184, $_1128511397){ self::__2106553229(); foreach($_1428104184 as $_2074882924 => $_1250409973) self::$_968959662[___1412670749(61)][$_2074882924]= $_1250409973; $_302770584= array(); foreach($_1128511397 as $_1437175475 => $_955041766){ if(!isset(self::$_968959662[___1412670749(62)][$_1437175475]) && $_955041766 || isset(self::$_968959662[___1412670749(63)][$_1437175475]) && $_955041766 != self::$_968959662[___1412670749(64)][$_1437175475]) $_302770584[]= array($_1437175475, $_955041766); self::$_968959662[___1412670749(65)][$_1437175475]= $_955041766;} $_2095007435= $GLOBALS['____1338047942'][23](self::$_968959662); $_2095007435= $GLOBALS['____1338047942'][24]($_2095007435); COption::SetOptionString(___1412670749(66), ___1412670749(67), $_2095007435); self::$_968959662= false; foreach($_302770584 as $_1298763613) self::__926646116($_1298763613[(178*2-356)], $_1298763613[round(0+1)]);} public static function SaveFeaturesSettings($_2090176796, $_469425925){ self::__2106553229(); $_724062651= array(___1412670749(68) => array(), ___1412670749(69) => array()); if(!$GLOBALS['____1338047942'][25]($_2090176796)) $_2090176796= array(); if(!$GLOBALS['____1338047942'][26]($_469425925)) $_469425925= array(); if(!$GLOBALS['____1338047942'][27](___1412670749(70), $_2090176796)) $_2090176796[]= ___1412670749(71); foreach(self::$_2122616441 as $_2074882924 => $_1128511397){ if(isset(self::$_968959662[___1412670749(72)][$_2074882924])){ $_1988211864= self::$_968959662[___1412670749(73)][$_2074882924];} else{ $_1988211864=($_2074882924 == ___1412670749(74)? array(___1412670749(75)): array(___1412670749(76)));} if($_1988211864[(826-2*413)] == ___1412670749(77) || $_1988211864[(962-2*481)] == ___1412670749(78)){ $_724062651[___1412670749(79)][$_2074882924]= $_1988211864;} else{ if($GLOBALS['____1338047942'][28]($_2074882924, $_2090176796)) $_724062651[___1412670749(80)][$_2074882924]= array(___1412670749(81), $GLOBALS['____1338047942'][29]((150*2-300),(1116/2-558), min(68,0,22.666666666667), $GLOBALS['____1338047942'][30](___1412670749(82)), $GLOBALS['____1338047942'][31](___1412670749(83)), $GLOBALS['____1338047942'][32](___1412670749(84)))); else $_724062651[___1412670749(85)][$_2074882924]= array(___1412670749(86));}} $_302770584= array(); foreach(self::$_2096028057 as $_1437175475 => $_2074882924){ if($_724062651[___1412670749(87)][$_2074882924][min(250,0,83.333333333333)] != ___1412670749(88) && $_724062651[___1412670749(89)][$_2074882924][(238*2-476)] != ___1412670749(90)){ $_724062651[___1412670749(91)][$_1437175475]= false;} else{ if($_724062651[___1412670749(92)][$_2074882924][(888-2*444)] == ___1412670749(93) && $_724062651[___1412670749(94)][$_2074882924][round(0+0.33333333333333+0.33333333333333+0.33333333333333)]< $GLOBALS['____1338047942'][33]((840-2*420), min(234,0,78),(1436/2-718), Date(___1412670749(95)), $GLOBALS['____1338047942'][34](___1412670749(96))- self::$_252079112, $GLOBALS['____1338047942'][35](___1412670749(97)))) $_724062651[___1412670749(98)][$_1437175475]= false; else $_724062651[___1412670749(99)][$_1437175475]= $GLOBALS['____1338047942'][36]($_1437175475, $_469425925); if(!isset(self::$_968959662[___1412670749(100)][$_1437175475]) && $_724062651[___1412670749(101)][$_1437175475] || isset(self::$_968959662[___1412670749(102)][$_1437175475]) && $_724062651[___1412670749(103)][$_1437175475] != self::$_968959662[___1412670749(104)][$_1437175475]) $_302770584[]= array($_1437175475, $_724062651[___1412670749(105)][$_1437175475]);}} $_2095007435= $GLOBALS['____1338047942'][37]($_724062651); $_2095007435= $GLOBALS['____1338047942'][38]($_2095007435); COption::SetOptionString(___1412670749(106), ___1412670749(107), $_2095007435); self::$_968959662= false; foreach($_302770584 as $_1298763613) self::__926646116($_1298763613[(876-2*438)], $_1298763613[round(0+0.2+0.2+0.2+0.2+0.2)]);} public static function GetFeaturesList(){ self::__2106553229(); $_263619322= array(); foreach(self::$_2122616441 as $_2074882924 => $_1128511397){ if(isset(self::$_968959662[___1412670749(108)][$_2074882924])){ $_1988211864= self::$_968959662[___1412670749(109)][$_2074882924];} else{ $_1988211864=($_2074882924 == ___1412670749(110)? array(___1412670749(111)): array(___1412670749(112)));} $_263619322[$_2074882924]= array( ___1412670749(113) => $_1988211864[(816-2*408)], ___1412670749(114) => $_1988211864[round(0+0.5+0.5)], ___1412670749(115) => array(),); $_263619322[$_2074882924][___1412670749(116)]= false; if($_263619322[$_2074882924][___1412670749(117)] == ___1412670749(118)){ $_263619322[$_2074882924][___1412670749(119)]= $GLOBALS['____1338047942'][39](($GLOBALS['____1338047942'][40]()- $_263619322[$_2074882924][___1412670749(120)])/ round(0+28800+28800+28800)); if($_263619322[$_2074882924][___1412670749(121)]> self::$_252079112) $_263619322[$_2074882924][___1412670749(122)]= true;} foreach($_1128511397 as $_1437175475) $_263619322[$_2074882924][___1412670749(123)][$_1437175475]=(!isset(self::$_968959662[___1412670749(124)][$_1437175475]) || self::$_968959662[___1412670749(125)][$_1437175475]);} return $_263619322;} private static function __1615161372($_1297966812, $_1414728284){ if(IsModuleInstalled($_1297966812) == $_1414728284) return true; $_395496693= $_SERVER[___1412670749(126)].___1412670749(127).$_1297966812.___1412670749(128); if(!$GLOBALS['____1338047942'][41]($_395496693)) return false; include_once($_395496693); $_54617829= $GLOBALS['____1338047942'][42](___1412670749(129), ___1412670749(130), $_1297966812); if(!$GLOBALS['____1338047942'][43]($_54617829)) return false; $_931642328= new $_54617829; if($_1414728284){ if(!$_931642328->InstallDB()) return false; $_931642328->InstallEvents(); if(!$_931642328->InstallFiles()) return false;} else{ if(CModule::IncludeModule(___1412670749(131))) CSearch::DeleteIndex($_1297966812); UnRegisterModule($_1297966812);} return true;} protected static function OnRequestsSettingsChange($_1437175475, $_955041766){ self::__1615161372("form", $_955041766);} protected static function OnLearningSettingsChange($_1437175475, $_955041766){ self::__1615161372("learning", $_955041766);} protected static function OnJabberSettingsChange($_1437175475, $_955041766){ self::__1615161372("xmpp", $_955041766);} protected static function OnVideoConferenceSettingsChange($_1437175475, $_955041766){} protected static function OnBizProcSettingsChange($_1437175475, $_955041766){ self::__1615161372("bizprocdesigner", $_955041766);} protected static function OnListsSettingsChange($_1437175475, $_955041766){ self::__1615161372("lists", $_955041766);} protected static function OnWikiSettingsChange($_1437175475, $_955041766){ self::__1615161372("wiki", $_955041766);} protected static function OnSupportSettingsChange($_1437175475, $_955041766){ self::__1615161372("support", $_955041766);} protected static function OnControllerSettingsChange($_1437175475, $_955041766){ self::__1615161372("controller", $_955041766);} protected static function OnAnalyticsSettingsChange($_1437175475, $_955041766){ self::__1615161372("statistic", $_955041766);} protected static function OnVoteSettingsChange($_1437175475, $_955041766){ self::__1615161372("vote", $_955041766);} protected static function OnFriendsSettingsChange($_1437175475, $_955041766){ if($_955041766) $_344411124= "Y"; else $_344411124= ___1412670749(132); $_2014927237= CSite::GetList(___1412670749(133), ___1412670749(134), array(___1412670749(135) => ___1412670749(136))); while($_391468573= $_2014927237->Fetch()){ if(COption::GetOptionString(___1412670749(137), ___1412670749(138), ___1412670749(139), $_391468573[___1412670749(140)]) != $_344411124){ COption::SetOptionString(___1412670749(141), ___1412670749(142), $_344411124, false, $_391468573[___1412670749(143)]); COption::SetOptionString(___1412670749(144), ___1412670749(145), $_344411124);}}} protected static function OnMicroBlogSettingsChange($_1437175475, $_955041766){ if($_955041766) $_344411124= "Y"; else $_344411124= ___1412670749(146); $_2014927237= CSite::GetList(___1412670749(147), ___1412670749(148), array(___1412670749(149) => ___1412670749(150))); while($_391468573= $_2014927237->Fetch()){ if(COption::GetOptionString(___1412670749(151), ___1412670749(152), ___1412670749(153), $_391468573[___1412670749(154)]) != $_344411124){ COption::SetOptionString(___1412670749(155), ___1412670749(156), $_344411124, false, $_391468573[___1412670749(157)]); COption::SetOptionString(___1412670749(158), ___1412670749(159), $_344411124);} if(COption::GetOptionString(___1412670749(160), ___1412670749(161), ___1412670749(162), $_391468573[___1412670749(163)]) != $_344411124){ COption::SetOptionString(___1412670749(164), ___1412670749(165), $_344411124, false, $_391468573[___1412670749(166)]); COption::SetOptionString(___1412670749(167), ___1412670749(168), $_344411124);}}} protected static function OnPersonalFilesSettingsChange($_1437175475, $_955041766){ if($_955041766) $_344411124= "Y"; else $_344411124= ___1412670749(169); $_2014927237= CSite::GetList(___1412670749(170), ___1412670749(171), array(___1412670749(172) => ___1412670749(173))); while($_391468573= $_2014927237->Fetch()){ if(COption::GetOptionString(___1412670749(174), ___1412670749(175), ___1412670749(176), $_391468573[___1412670749(177)]) != $_344411124){ COption::SetOptionString(___1412670749(178), ___1412670749(179), $_344411124, false, $_391468573[___1412670749(180)]); COption::SetOptionString(___1412670749(181), ___1412670749(182), $_344411124);}}} protected static function OnPersonalBlogSettingsChange($_1437175475, $_955041766){ if($_955041766) $_344411124= "Y"; else $_344411124= ___1412670749(183); $_2014927237= CSite::GetList(___1412670749(184), ___1412670749(185), array(___1412670749(186) => ___1412670749(187))); while($_391468573= $_2014927237->Fetch()){ if(COption::GetOptionString(___1412670749(188), ___1412670749(189), ___1412670749(190), $_391468573[___1412670749(191)]) != $_344411124){ COption::SetOptionString(___1412670749(192), ___1412670749(193), $_344411124, false, $_391468573[___1412670749(194)]); COption::SetOptionString(___1412670749(195), ___1412670749(196), $_344411124);}}} protected static function OnPersonalPhotoSettingsChange($_1437175475, $_955041766){ if($_955041766) $_344411124= "Y"; else $_344411124= ___1412670749(197); $_2014927237= CSite::GetList(___1412670749(198), ___1412670749(199), array(___1412670749(200) => ___1412670749(201))); while($_391468573= $_2014927237->Fetch()){ if(COption::GetOptionString(___1412670749(202), ___1412670749(203), ___1412670749(204), $_391468573[___1412670749(205)]) != $_344411124){ COption::SetOptionString(___1412670749(206), ___1412670749(207), $_344411124, false, $_391468573[___1412670749(208)]); COption::SetOptionString(___1412670749(209), ___1412670749(210), $_344411124);}}} protected static function OnPersonalForumSettingsChange($_1437175475, $_955041766){ if($_955041766) $_344411124= "Y"; else $_344411124= ___1412670749(211); $_2014927237= CSite::GetList(___1412670749(212), ___1412670749(213), array(___1412670749(214) => ___1412670749(215))); while($_391468573= $_2014927237->Fetch()){ if(COption::GetOptionString(___1412670749(216), ___1412670749(217), ___1412670749(218), $_391468573[___1412670749(219)]) != $_344411124){ COption::SetOptionString(___1412670749(220), ___1412670749(221), $_344411124, false, $_391468573[___1412670749(222)]); COption::SetOptionString(___1412670749(223), ___1412670749(224), $_344411124);}}} protected static function OnTasksSettingsChange($_1437175475, $_955041766){ if($_955041766) $_344411124= "Y"; else $_344411124= ___1412670749(225); $_2014927237= CSite::GetList(___1412670749(226), ___1412670749(227), array(___1412670749(228) => ___1412670749(229))); while($_391468573= $_2014927237->Fetch()){ if(COption::GetOptionString(___1412670749(230), ___1412670749(231), ___1412670749(232), $_391468573[___1412670749(233)]) != $_344411124){ COption::SetOptionString(___1412670749(234), ___1412670749(235), $_344411124, false, $_391468573[___1412670749(236)]); COption::SetOptionString(___1412670749(237), ___1412670749(238), $_344411124);} if(COption::GetOptionString(___1412670749(239), ___1412670749(240), ___1412670749(241), $_391468573[___1412670749(242)]) != $_344411124){ COption::SetOptionString(___1412670749(243), ___1412670749(244), $_344411124, false, $_391468573[___1412670749(245)]); COption::SetOptionString(___1412670749(246), ___1412670749(247), $_344411124);}} self::__1615161372(___1412670749(248), $_955041766);} protected static function OnCalendarSettingsChange($_1437175475, $_955041766){ if($_955041766) $_344411124= "Y"; else $_344411124= ___1412670749(249); $_2014927237= CSite::GetList(___1412670749(250), ___1412670749(251), array(___1412670749(252) => ___1412670749(253))); while($_391468573= $_2014927237->Fetch()){ if(COption::GetOptionString(___1412670749(254), ___1412670749(255), ___1412670749(256), $_391468573[___1412670749(257)]) != $_344411124){ COption::SetOptionString(___1412670749(258), ___1412670749(259), $_344411124, false, $_391468573[___1412670749(260)]); COption::SetOptionString(___1412670749(261), ___1412670749(262), $_344411124);} if(COption::GetOptionString(___1412670749(263), ___1412670749(264), ___1412670749(265), $_391468573[___1412670749(266)]) != $_344411124){ COption::SetOptionString(___1412670749(267), ___1412670749(268), $_344411124, false, $_391468573[___1412670749(269)]); COption::SetOptionString(___1412670749(270), ___1412670749(271), $_344411124);}}} protected static function OnSMTPSettingsChange($_1437175475, $_955041766){ self::__1615161372("mail", $_955041766);} protected static function OnExtranetSettingsChange($_1437175475, $_955041766){ $_1998157554= COption::GetOptionString("extranet", "extranet_site", ""); if($_1998157554){ $_1342615457= new CSite; $_1342615457->Update($_1998157554, array(___1412670749(272) =>($_955041766? ___1412670749(273): ___1412670749(274))));} self::__1615161372(___1412670749(275), $_955041766);} protected static function OnDAVSettingsChange($_1437175475, $_955041766){ self::__1615161372("dav", $_955041766);} protected static function OntimemanSettingsChange($_1437175475, $_955041766){ self::__1615161372("timeman", $_955041766);} protected static function Onintranet_sharepointSettingsChange($_1437175475, $_955041766){ if($_955041766){ RegisterModuleDependences("iblock", "OnAfterIBlockElementAdd", "intranet", "CIntranetEventHandlers", "SPRegisterUpdatedItem"); RegisterModuleDependences(___1412670749(276), ___1412670749(277), ___1412670749(278), ___1412670749(279), ___1412670749(280)); CAgent::AddAgent(___1412670749(281), ___1412670749(282), ___1412670749(283), round(0+166.66666666667+166.66666666667+166.66666666667)); CAgent::AddAgent(___1412670749(284), ___1412670749(285), ___1412670749(286), round(0+150+150)); CAgent::AddAgent(___1412670749(287), ___1412670749(288), ___1412670749(289), round(0+1800+1800));} else{ UnRegisterModuleDependences(___1412670749(290), ___1412670749(291), ___1412670749(292), ___1412670749(293), ___1412670749(294)); UnRegisterModuleDependences(___1412670749(295), ___1412670749(296), ___1412670749(297), ___1412670749(298), ___1412670749(299)); CAgent::RemoveAgent(___1412670749(300), ___1412670749(301)); CAgent::RemoveAgent(___1412670749(302), ___1412670749(303)); CAgent::RemoveAgent(___1412670749(304), ___1412670749(305));}} protected static function OncrmSettingsChange($_1437175475, $_955041766){ if($_955041766) COption::SetOptionString("crm", "form_features", "Y"); self::__1615161372(___1412670749(306), $_955041766);} protected static function OnClusterSettingsChange($_1437175475, $_955041766){ self::__1615161372("cluster", $_955041766);} protected static function OnMultiSitesSettingsChange($_1437175475, $_955041766){ if($_955041766) RegisterModuleDependences("main", "OnBeforeProlog", "main", "CWizardSolPanelIntranet", "ShowPanel", 100, "/modules/intranet/panel_button.php"); else UnRegisterModuleDependences(___1412670749(307), ___1412670749(308), ___1412670749(309), ___1412670749(310), ___1412670749(311), ___1412670749(312));} protected static function OnIdeaSettingsChange($_1437175475, $_955041766){ self::__1615161372("idea", $_955041766);} protected static function OnMeetingSettingsChange($_1437175475, $_955041766){ self::__1615161372("meeting", $_955041766);} protected static function OnXDImportSettingsChange($_1437175475, $_955041766){ self::__1615161372("xdimport", $_955041766);}} $GLOBALS['____1338047942'][44](___1412670749(313), ___1412670749(314));/**/			//Do not remove this

// Component 2.0 template engines
$GLOBALS['arCustomTemplateEngines'] = [];

// User fields manager
$GLOBALS['USER_FIELD_MANAGER'] = new CUserTypeManager;

// todo: remove global
$GLOBALS['BX_MENU_CUSTOM'] = CMenuCustom::getInstance();

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

if (COption::GetOptionString("main", "set_p3p_header", "Y") == "Y")
{
	header("P3P: policyref=\"/bitrix/p3p.xml\", CP=\"NON DSP COR CUR ADM DEV PSA PSD OUR UNR BUS UNI COM NAV INT DEM STA\"");
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
		&& $kernelSession["BX_SESSION_SIGN"] != bitrix_sess_sign()
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

	define("SITE_TEMPLATE_PATH", getLocalPath('templates/'.SITE_TEMPLATE_ID, BX_PERSONAL_ROOT));
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
		if ($GLOBALS["USER"]->IsAuthorized() && $arAuthResult["MESSAGE"] == '')
		{
			$arAuthResult = ["MESSAGE" => GetMessage("ACCESS_DENIED").' '.GetMessage("ACCESS_DENIED_FILE", ["#FILE#" => $real_path]), "TYPE" => "ERROR"];

			if (COption::GetOptionString("main", "event_log_permissions_fail", "N") === "Y")
			{
				CEventLog::Log("SECURITY", "USER_PERMISSIONS_FAIL", "main", $GLOBALS["USER"]->GetID(), $real_path);
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

/*ZDUyZmZNDQ3ZTBmNjljMWM3OGVlMGM4ZThiZjE4Y2JkZWI4NzQ=*/$GLOBALS['____1312197396']= array(base64_decode('b'.'XRf'.'cmF'.'uZA'.'='.'='),base64_decode('Y'.'2F'.'s'.'bF'.'91c2Vy'.'X2'.'Z1bm'.'M='),base64_decode('c3'.'Ryc'.'G9z'),base64_decode('ZXhw'.'bG'.'9kZ'.'Q='.'='),base64_decode('cG'.'Fja'.'w=='),base64_decode('bWQ1'),base64_decode(''.'Y29'.'u'.'c'.'3Rh'.'bnQ='),base64_decode('aGFzaF9obW'.'Fj'),base64_decode(''.'c3'.'RyY21w'),base64_decode(''.'Y'.'2FsbF'.'91c2V'.'yX2'.'Z1bmM='),base64_decode('Y'.'2FsbF91c2VyX2'.'Z'.'1bm'.'M='),base64_decode('aXNfb2JqZ'.'WN0'),base64_decode('Y2FsbF91'.'c2V'.'yX2Z1bmM'.'='),base64_decode(''.'Y2FsbF91c2VyX2Z1bmM='),base64_decode('Y2Fs'.'bF91'.'c2VyX2Z1bmM='),base64_decode('Y2Fs'.'bF91c2'.'VyX2Z1bmM='),base64_decode('Y2'.'F'.'sbF9'.'1'.'c2'.'VyX2Z1'.'bmM='),base64_decode('Y2Fs'.'bF9'.'1c2VyX2Z'.'1bmM='));if(!function_exists(__NAMESPACE__.'\\___1708497399')){function ___1708497399($_441044725){static $_179374095= false; if($_179374095 == false) $_179374095=array('XEN'.'PcHRpb2'.'46Okd'.'ldE'.'9w'.'dGlvblN0cm'.'l'.'uZw==','b'.'W'.'F'.'pbg'.'==','flBBUkFN'.'X'.'01BWF9'.'VU0VS'.'Uw==','L'.'g==','L'.'g==','SC'.'o=','Yml0c'.'ml4','TElDRU5TRV9LRVk'.'=','c2h'.'h'.'MjU2','XE'.'NP'.'cHRpb246OkdldE9wdGlvb'.'lN0c'.'mluZw='.'=',''.'bWFpbg'.'==','UE'.'FSQ'.'U1fTUF'.'YX'.'1VTRVJT','X'.'EJpdHJpeF'.'xNYWl'.'uXENvbmZp'.'Z'.'1'.'xPcH'.'Rpb24'.'6OnNldA==','bWFp'.'bg='.'=','U'.'EFSQ'.'U1f'.'T'.'UFYX1VTR'.'V'.'JT','VVNFUg='.'=','VVNFU'.'g==',''.'V'.'VNFUg==','S'.'XNBdXR'.'ob3JpemV'.'k',''.'VVN'.'FUg==','SXN'.'BZG1pbg='.'=','QVB'.'QTEl'.'D'.'Q'.'VRJT04=',''.'UmVzdGFy'.'dEJ1ZmZlcg==','T'.'G'.'9j'.'YWxSZWRpcmVjdA==',''.'L2xp'.'Y'.'2'.'Vu'.'c2V'.'fcmVzdH'.'J'.'pY3Rp'.'b24ucGhw',''.'XE'.'NPcHR'.'pb2'.'46Okd'.'ld'.'E9'.'wdGlvblN0cml'.'uZ'.'w'.'==','bWFpbg==','U'.'EFSQU1'.'fTUF'.'Y'.'X1'.'VTRVJT','XEJpdH'.'J'.'p'.'eFxNYWluXENvb'.'m'.'ZpZ1xPcH'.'Rpb24'.'6OnNl'.'dA'.'==','bWFpbg==','UE'.'FSQU1fTU'.'F'.'YX1VTR'.'V'.'JT');return base64_decode($_179374095[$_441044725]);}};if($GLOBALS['____1312197396'][0](round(0+0.2+0.2+0.2+0.2+0.2), round(0+20)) == round(0+1.4+1.4+1.4+1.4+1.4)){ $_615623891= $GLOBALS['____1312197396'][1](___1708497399(0), ___1708497399(1), ___1708497399(2)); if(!empty($_615623891) && $GLOBALS['____1312197396'][2]($_615623891, ___1708497399(3)) !== false){ list($_900539712, $_400069739)= $GLOBALS['____1312197396'][3](___1708497399(4), $_615623891); $_159873970= $GLOBALS['____1312197396'][4](___1708497399(5), $_900539712); $_915935629= ___1708497399(6).$GLOBALS['____1312197396'][5]($GLOBALS['____1312197396'][6](___1708497399(7))); $_647953853= $GLOBALS['____1312197396'][7](___1708497399(8), $_400069739, $_915935629, true); if($GLOBALS['____1312197396'][8]($_647953853, $_159873970) !==(1096/2-548)){ if($GLOBALS['____1312197396'][9](___1708497399(9), ___1708497399(10), ___1708497399(11)) != round(0+12)){ $GLOBALS['____1312197396'][10](___1708497399(12), ___1708497399(13), ___1708497399(14), round(0+12));} if(isset($GLOBALS[___1708497399(15)]) && $GLOBALS['____1312197396'][11]($GLOBALS[___1708497399(16)]) && $GLOBALS['____1312197396'][12](array($GLOBALS[___1708497399(17)], ___1708497399(18))) &&!$GLOBALS['____1312197396'][13](array($GLOBALS[___1708497399(19)], ___1708497399(20)))){ $GLOBALS['____1312197396'][14](array($GLOBALS[___1708497399(21)], ___1708497399(22))); $GLOBALS['____1312197396'][15](___1708497399(23), ___1708497399(24), true);}}} else{ if($GLOBALS['____1312197396'][16](___1708497399(25), ___1708497399(26), ___1708497399(27)) != round(0+3+3+3+3)){ $GLOBALS['____1312197396'][17](___1708497399(28), ___1708497399(29), ___1708497399(30), round(0+4+4+4));}}}/**/       //Do not remove this

