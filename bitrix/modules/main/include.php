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

/*ZDUyZmZZjExYTVkYzU5NWExZWJjY2MwZjdjZGQ2YmVkY2Y1MTI=*/$GLOBALS['_____808400039']= array(base64_decode('R2V'.'0'.'TW9k'.'dWxlR'.'XZ'.'l'.'bnRz'),base64_decode('RX'.'hlY3V0'.'ZU1vZHV'.'sZUV2'.'ZW50RXg='));$GLOBALS['____156149863']= array(base64_decode('ZGVmaW'.'5'.'l'),base64_decode('YmFzZTY0X2'.'R'.'l'.'Y29'.'kZQ='.'='),base64_decode('dW5'.'zZXJpYWxpemU='),base64_decode('aXNf'.'YXJyY'.'Xk='),base64_decode(''.'a'.'W'.'5fY'.'XJ'.'yYXk='),base64_decode('c2VyaWFsaXpl'),base64_decode('Ym'.'FzZTY'.'0X2Vu'.'Y'.'29'.'kZQ=='),base64_decode('b'.'Wt0aW'.'1l'),base64_decode('ZG'.'F0ZQ='.'='),base64_decode('ZGF'.'0'.'Z'.'Q=='),base64_decode('c3R'.'yb'.'GVu'),base64_decode('bWt0a'.'W1l'),base64_decode('Z'.'GF'.'0'.'ZQ'.'=='),base64_decode('Z'.'GF0'.'ZQ'.'=='),base64_decode('bWV0a'.'G'.'9'.'kX2'.'V4'.'aXN0c'.'w=='),base64_decode(''.'Y2FsbF'.'91c2VyX2Z1b'.'mN'.'fYXJ'.'y'.'YXk='),base64_decode('c3RybGVu'),base64_decode('c'.'2'.'VyaWFsaX'.'p'.'l'),base64_decode('YmF'.'z'.'ZTY0'.'X2VuY'.'2'.'9k'.'ZQ=='),base64_decode('c3'.'RybGVu'),base64_decode('aXNfYX'.'Jy'.'YX'.'k'.'='),base64_decode(''.'c2VyaWFs'.'aX'.'pl'),base64_decode('YmFzZ'.'TY0'.'X2VuY'.'29kZ'.'Q=='),base64_decode('c'.'2V'.'yaWFsaXpl'),base64_decode('Ym'.'FzZTY0X2VuY2'.'9kZQ=='),base64_decode(''.'aX'.'NfYX'.'J'.'yYXk'.'='),base64_decode(''.'a'.'XNf'.'YXJyY'.'Xk='),base64_decode('aW'.'5fY'.'XJy'.'YXk='),base64_decode('aW5f'.'YXJyYX'.'k='),base64_decode('bWt0aW'.'1l'),base64_decode('ZGF0ZQ'.'=='),base64_decode('Z'.'G'.'F'.'0ZQ=='),base64_decode('ZG'.'F0ZQ=='),base64_decode('bW'.'t0aW1l'),base64_decode('ZGF0ZQ=='),base64_decode(''.'Z'.'GF0ZQ=='),base64_decode('aW5fYXJ'.'yYX'.'k='),base64_decode('c2VyaWFsa'.'Xpl'),base64_decode('YmFzZTY'.'0X2Vu'.'Y29'.'kZQ'.'=='),base64_decode('aW50dmF'.'s'),base64_decode('d'.'Gl'.'tZQ=='),base64_decode('Z'.'m'.'ls'.'ZV9leGlzdHM='),base64_decode('c3RyX3JlcGxhY'.'2'.'U'.'='),base64_decode('Y2'.'xh'.'c3'.'NfZX'.'hp'.'c3Rz'),base64_decode('ZGVm'.'aW'.'5'.'l'));if(!function_exists(__NAMESPACE__.'\\___38472048')){function ___38472048($_1050975774){static $_537332963= false; if($_537332963 == false) $_537332963=array(''.'SU5U'.'Uk'.'FORVRf'.'RUR'.'JVElPTg==','W'.'Q==','bWFpb'.'g==','fmNwZ'.'l9tYXBf'.'dmFsd'.'WU=','','','YWxsb3'.'dl'.'Z'.'F9jbGFzc'.'2Vz','ZQ==','Z'.'g'.'==','ZQ==','Rg==','WA'.'==','Z'.'g==','bWFpbg'.'==','fm'.'NwZl9tYXBfd'.'mF'.'sdWU=',''.'UG'.'9ydGFs','R'.'g==',''.'ZQ==','ZQ==',''.'WA'.'==','Rg='.'=','R'.'A==','RA'.'==',''.'bQ='.'=','ZA==',''.'WQ==','Z'.'g'.'==','Zg==','Zg==',''.'Zg==',''.'U'.'G9y'.'dGFs','Rg==','ZQ==','Z'.'Q==','W'.'A'.'==','Rg='.'=','RA==','R'.'A'.'==','bQ='.'=','ZA==','WQ==','bWFpbg==',''.'T24'.'=',''.'U2V0dGlu'.'Z3NDaG'.'F'.'uZ2U=','Zg='.'=','Zg==',''.'Zg==','Zg'.'==','bW'.'Fpbg='.'=','fmNwZ'.'l9t'.'YXBf'.'dm'.'Fs'.'d'.'W'.'U=','ZQ='.'=','ZQ==','R'.'A==',''.'Z'.'Q'.'==','ZQ==','Zg='.'=','Zg==',''.'Zg==','Z'.'Q==','bW'.'Fpb'.'g==','fmNwZl9tYX'.'Bf'.'dmFsdWU=','ZQ='.'=','Zg'.'==','Zg==',''.'Zg='.'=','Zg==','bWFpb'.'g='.'=','f'.'mNwZl'.'9tY'.'XBfdmFsdWU=','ZQ='.'=','Zg='.'=','UG9ydGFs',''.'UG9ydG'.'Fs','Z'.'Q'.'==','ZQ='.'=','UG'.'9'.'ydGF'.'s','Rg'.'==','W'.'A'.'==',''.'Rg==','RA='.'=','ZQ==','ZQ'.'==','RA==',''.'bQ==','ZA==',''.'W'.'Q'.'==','ZQ'.'='.'=','WA==','ZQ='.'=','R'.'g'.'==','ZQ='.'=','R'.'A'.'==',''.'Zg==','ZQ==','RA==','ZQ'.'='.'=',''.'bQ'.'==','Z'.'A==','W'.'Q==',''.'Zg==','Zg'.'='.'=','Zg'.'==','Z'.'g==',''.'Zg='.'=','Zg==',''.'Zg='.'=','Z'.'g==','bWFp'.'b'.'g='.'=','fm'.'N'.'wZl9tYXBfdmFsdWU=','Z'.'Q==',''.'ZQ'.'==','UG9ydGFs','Rg==','WA='.'=','VFlQ'.'RQ==','REFU'.'R'.'Q==','Rk'.'VBVFVSRVM=','R'.'VhQSVJ'.'FRA='.'=','VFl'.'QRQ==',''.'R'.'A==','VFJZ'.'X0RBWVNfQ'.'09'.'VTlQ=','REFURQ==','VFJ'.'Z'.'X0RB'.'W'.'VNfQ09VTl'.'Q=','RVhQSV'.'JFRA==','RkVBV'.'FV'.'SRVM=','Zg==','Zg==','RE'.'9DVU1FTlRfUk9PVA==','L2JpdH'.'JpeC'.'9t'.'b2R1b'.'GVz'.'L'.'w='.'=','L'.'2luc3R'.'hb'.'G'.'wva'.'W5k'.'ZXgu'.'cGhw','L'.'g==','Xw==','c2'.'VhcmNo','Tg==','','','QUNU'.'SVZ'.'F','WQ==','c29j'.'aWFs'.'bmV0d2'.'9'.'yaw==','YWxsb3'.'dfZnJpZ'.'Wxkcw='.'=',''.'W'.'Q==','SUQ=','c29j'.'aWFs'.'bmV0d29yaw'.'==','YWxsb3dfZnJpZ'.'W'.'xkc'.'w==',''.'S'.'UQ=','c29ja'.'WF'.'s'.'bmV0d'.'2'.'9'.'yaw'.'==',''.'YWxsb3df'.'Z'.'nJpZWxk'.'c'.'w='.'=',''.'Tg='.'=','','','QU'.'NUSVZF','WQ==','c29jaWFs'.'bmV'.'0d29yaw==','YWxsb3df'.'bW'.'lj'.'c'.'m9'.'i'.'bG9nX3VzZXI'.'=','WQ==','SUQ'.'=','c29jaWFsbm'.'V0'.'d29yaw='.'=','YW'.'xsb3df'.'bWljcm9i'.'bG9nX3VzZXI=','SUQ=','c29jaWFsb'.'mV'.'0d'.'29y'.'aw==','YWx'.'sb3dfbWlj'.'cm9ibG9nX3VzZXI=','c'.'29jaWFsb'.'mV0'.'d29yaw='.'=',''.'YW'.'x'.'s'.'b3d'.'fbW'.'ljcm9'.'i'.'bG9nX2dyb3Vw',''.'WQ==','S'.'UQ'.'=','c29jaWFsbmV0d2'.'9yaw==','YWx'.'sb'.'3dfbWljcm9ibG9nX'.'2dy'.'b3V'.'w','SUQ=',''.'c29'.'jaW'.'F'.'sb'.'mV0'.'d29y'.'aw==','YWx'.'sb3dfbWlj'.'cm'.'9'.'ibG9nX2dyb3V'.'w',''.'Tg==','','','QUNUSVZ'.'F','WQ==','c2'.'9j'.'aWFsb'.'m'.'V0'.'d29y'.'aw='.'=','YW'.'xsb3dfZm'.'lsZX'.'NfdXNlcg==',''.'WQ==','SUQ=','c2'.'9'.'jaWFsbmV'.'0d29'.'yaw==','YWxsb3dfZm'.'lsZ'.'XNfdXNlcg'.'='.'=','SUQ'.'=','c29jaWFsbmV0d29yaw'.'='.'=','YWxsb3'.'dfZm'.'lsZXNf'.'dX'.'Nlcg==','Tg'.'==','','','Q'.'UNU'.'S'.'VZF',''.'WQ==','c29jaWFsbm'.'V0'.'d29yaw'.'==','Y'.'Wx'.'s'.'b'.'3dfY'.'mx'.'vZ191c2'.'Vy','WQ'.'==','SU'.'Q'.'=','c29j'.'aW'.'FsbmV0d'.'2'.'9yaw='.'=','Y'.'Wxs'.'b3dfYmxv'.'Z19'.'1c2V'.'y','SUQ=',''.'c29jaW'.'Fsbm'.'V0d2'.'9ya'.'w==','Y'.'Wx'.'s'.'b3'.'dfYmxvZ191c2Vy',''.'T'.'g==','','','QUN'.'USVZF','WQ==',''.'c29j'.'aWFsbmV0d29yaw==','YWxsb3d'.'fcGhv'.'dG9fdXN'.'lcg='.'=',''.'WQ==','SU'.'Q=','c2'.'9ja'.'WFsbm'.'V0d29yaw==','Y'.'Wxsb'.'3dfc'.'Ghvd'.'G9fdXN'.'l'.'cg==','SU'.'Q=','c29jaWF'.'s'.'bmV'.'0d2'.'9yaw==',''.'Y'.'Wxsb'.'3dfcG'.'hvdG'.'9fdXN'.'lc'.'g==','Tg='.'=','','','QUN'.'USVZF','WQ='.'=','c'.'29jaWFsbmV0d29yaw'.'='.'=',''.'YWxsb3dfZm9ydW1'.'f'.'dXN'.'lcg==',''.'WQ'.'==','SUQ=','c29jaWFsbmV0d2'.'9yaw==',''.'YWxsb'.'3dfZm9ydW1fdXNlcg==','SUQ=','c29ja'.'WFsbmV0d29yaw==',''.'YW'.'xsb3dfZm9ydW'.'1fdX'.'Nlcg==','T'.'g==','','',''.'QUNUSVZF','W'.'Q='.'=','c29j'.'aW'.'FsbmV0d29y'.'aw==','YWxsb3df'.'dG'.'Fza3NfdXNlc'.'g==','WQ'.'==','SUQ=','c29jaWFsbmV'.'0d29yaw'.'==',''.'YW'.'x'.'sb3df'.'dGFza3N'.'fdX'.'Nl'.'cg='.'=','SUQ=','c29jaW'.'FsbmV'.'0d29y'.'aw==',''.'YWx'.'sb3dfdGF'.'za3NfdXN'.'lcg==','c29jaWF'.'sbmV0d'.'29yaw'.'==',''.'YWxsb3dfdGFza3N'.'fZ3JvdXA=','WQ='.'=','SU'.'Q=','c29jaW'.'FsbmV0d'.'29yaw==','YWxsb3dfdGFza'.'3N'.'fZ3JvdXA=','SUQ=','c29ja'.'WFsbmV0'.'d29yaw'.'==','Y'.'Wxsb3'.'dfdGFza'.'3'.'NfZ3JvdX'.'A=',''.'dGFza3M=','Tg='.'=','','','QUNUSV'.'ZF','W'.'Q==','c'.'2'.'9jaW'.'Fsb'.'mV0d29'.'y'.'aw==','YWxsb3dfY2Fs'.'Z'.'W5'.'kYXJf'.'d'.'XNlcg==','WQ==','SU'.'Q=','c'.'29j'.'aWFsbmV0d29ya'.'w='.'=','YWxsb3dfY2'.'F'.'sZW5'.'kYXJfdXNlcg==',''.'SUQ'.'=',''.'c'.'2'.'9'.'j'.'aWF'.'sbmV0d29ya'.'w'.'==','Y'.'Wxsb3df'.'Y'.'2FsZW5kYXJfdXN'.'lcg==',''.'c29ja'.'WFs'.'b'.'mV'.'0'.'d2'.'9ya'.'w==','YW'.'xsb3dfY2FsZW5k'.'YXJ'.'fZ3JvdXA=',''.'WQ==','SUQ'.'=','c'.'29jaWFsbmV0d2'.'9yaw'.'==','YWxsb3dfY2FsZW5kYXJfZ3'.'JvdX'.'A'.'=','SUQ=','c2'.'9jaWFs'.'bmV0d29yaw==','YWxsb3dfY2Fs'.'Z'.'W5'.'kY'.'XJfZ3JvdXA=','QUNUSV'.'Z'.'F','WQ==','Tg'.'==','ZXh0cmFuZ'.'XQ=','a'.'WJsb2Nr','T25'.'B'.'ZnRlcklCbG9ja0VsZW1l'.'bnR'.'VcGRhdG'.'U=','aW50cmFuZ'.'XQ=','Q0ludHJ'.'hbmV0RXZl'.'bnRIYW5kb'.'GV'.'y'.'cw==','U1BSZW'.'d'.'p'.'c3RlclVw'.'ZGF0'.'ZWR'.'JdGVt','Q0l'.'udHJ'.'h'.'bmV'.'0U2h'.'h'.'cm'.'Vwb'.'2ludDo6QWdlbnR'.'M'.'aXN'.'0cygpOw==','aW5'.'0cmFuZXQ=',''.'Tg='.'=','Q0l'.'udHJhbmV0U2h'.'h'.'cmVwb'.'2ludD'.'o6QWdl'.'bnR'.'RdWV1ZSgpOw='.'=','aW50'.'cmF'.'uZXQ'.'=','Tg'.'==','Q0'.'lu'.'d'.'H'.'Jh'.'bmV0U2h'.'hc'.'mVwb2lud'.'Do6'.'Q'.'Wdlbn'.'RV'.'cGRhdGUoKTs=','aW'.'5'.'0cm'.'F'.'uZXQ=',''.'T'.'g==','aWJsb2Nr','T25BZ'.'nRlc'.'klCbG9'.'ja0V'.'sZW1lbnRBZGQ=','aW50cmF'.'uZX'.'Q=','Q0l'.'udH'.'Jhb'.'mV0RXZ'.'lb'.'nRI'.'YW5kbGVy'.'c'.'w==',''.'U1'.'BSZW'.'d'.'p'.'c3Rl'.'clV'.'wZGF0ZWRJd'.'GVt','a'.'WJsb2Nr','T25BZnRlcklCbG9'.'ja0VsZW1lbnRVcGR'.'hd'.'GU=',''.'aW50cmFuZX'.'Q=','Q0lu'.'dH'.'Jhbm'.'V'.'0RXZ'.'lbn'.'RIYW5'.'kbGVycw'.'==','U1'.'BSZWdp'.'c'.'3R'.'lclVwZGF0Z'.'WRJ'.'dGV'.'t',''.'Q0ludH'.'JhbmV0U2h'.'hcmVwb2ludDo6QW'.'dlb'.'n'.'RMaX'.'N0c'.'ygpOw='.'=','aW50cm'.'F'.'uZXQ=','Q0l'.'udHJ'.'hbm'.'V0'.'U2hhcm'.'Vw'.'b'.'2'.'ludDo6QW'.'dlbnR'.'R'.'dW'.'V1'.'ZS'.'gpOw==','a'.'W50'.'cmFuZX'.'Q=','Q0ludH'.'Jh'.'bm'.'V0U2hhcm'.'Vwb2ludD'.'o6'.'QWd'.'lb'.'nRVcGRhd'.'GUoKTs=','aW'.'50cmFuZX'.'Q=',''.'Y3Jt',''.'bWFpbg='.'=','T25CZWZv'.'cmVQcm'.'9'.'s'.'b2'.'c=','b'.'WFpbg==','Q1dpemFy'.'ZFN'.'vb'.'FBhbmVsS'.'W50'.'c'.'mFu'.'ZXQ'.'=','U2hvd1B'.'hb'.'m'.'Vs','L2'.'1vZHVsZXMv'.'aW50'.'cmFuZXQv'.'cGF'.'u'.'Z'.'W'.'xfY'.'nV0dG9uLnBocA='.'=','RU'.'5'.'D'.'T'.'0RF','WQ==');return base64_decode($_537332963[$_1050975774]);}};$GLOBALS['____156149863'][0](___38472048(0), ___38472048(1));class CBXFeatures{ private static $_691589434= 30; private static $_1318428844= array( "Portal" => array( "CompanyCalendar", "CompanyPhoto", "CompanyVideo", "CompanyCareer", "StaffChanges", "StaffAbsence", "CommonDocuments", "MeetingRoomBookingSystem", "Wiki", "Learning", "Vote", "WebLink", "Subscribe", "Friends", "PersonalFiles", "PersonalBlog", "PersonalPhoto", "PersonalForum", "Blog", "Forum", "Gallery", "Board", "MicroBlog", "WebMessenger",), "Communications" => array( "Tasks", "Calendar", "Workgroups", "Jabber", "VideoConference", "Extranet", "SMTP", "Requests", "DAV", "intranet_sharepoint", "timeman", "Idea", "Meeting", "EventList", "Salary", "XDImport",), "Enterprise" => array( "BizProc", "Lists", "Support", "Analytics", "crm", "Controller", "LdapUnlimitedUsers",), "Holding" => array( "Cluster", "MultiSites",),); private static $_514634986= null; private static $_1953959253= null; private static function __1901021703(){ if(self::$_514634986 === null){ self::$_514634986= array(); foreach(self::$_1318428844 as $_1799614104 => $_1740401223){ foreach($_1740401223 as $_1099266676) self::$_514634986[$_1099266676]= $_1799614104;}} if(self::$_1953959253 === null){ self::$_1953959253= array(); $_1841466524= COption::GetOptionString(___38472048(2), ___38472048(3), ___38472048(4)); if($_1841466524 != ___38472048(5)){ $_1841466524= $GLOBALS['____156149863'][1]($_1841466524); $_1841466524= $GLOBALS['____156149863'][2]($_1841466524,[___38472048(6) => false]); if($GLOBALS['____156149863'][3]($_1841466524)){ self::$_1953959253= $_1841466524;}} if(empty(self::$_1953959253)){ self::$_1953959253= array(___38472048(7) => array(), ___38472048(8) => array());}}} public static function InitiateEditionsSettings($_1838417299){ self::__1901021703(); $_2106545222= array(); foreach(self::$_1318428844 as $_1799614104 => $_1740401223){ $_424754989= $GLOBALS['____156149863'][4]($_1799614104, $_1838417299); self::$_1953959253[___38472048(9)][$_1799614104]=($_424754989? array(___38472048(10)): array(___38472048(11))); foreach($_1740401223 as $_1099266676){ self::$_1953959253[___38472048(12)][$_1099266676]= $_424754989; if(!$_424754989) $_2106545222[]= array($_1099266676, false);}} $_512231369= $GLOBALS['____156149863'][5](self::$_1953959253); $_512231369= $GLOBALS['____156149863'][6]($_512231369); COption::SetOptionString(___38472048(13), ___38472048(14), $_512231369); foreach($_2106545222 as $_1634659466) self::__949632054($_1634659466[(132*2-264)], $_1634659466[round(0+0.5+0.5)]);} public static function IsFeatureEnabled($_1099266676){ if($_1099266676 == '') return true; self::__1901021703(); if(!isset(self::$_514634986[$_1099266676])) return true; if(self::$_514634986[$_1099266676] == ___38472048(15)) $_1903352289= array(___38472048(16)); elseif(isset(self::$_1953959253[___38472048(17)][self::$_514634986[$_1099266676]])) $_1903352289= self::$_1953959253[___38472048(18)][self::$_514634986[$_1099266676]]; else $_1903352289= array(___38472048(19)); if($_1903352289[(894-2*447)] != ___38472048(20) && $_1903352289[min(192,0,64)] != ___38472048(21)){ return false;} elseif($_1903352289[(162*2-324)] == ___38472048(22)){ if($_1903352289[round(0+1)]< $GLOBALS['____156149863'][7]((1260/2-630), min(34,0,11.333333333333),(814-2*407), Date(___38472048(23)), $GLOBALS['____156149863'][8](___38472048(24))- self::$_691589434, $GLOBALS['____156149863'][9](___38472048(25)))){ if(!isset($_1903352289[round(0+0.5+0.5+0.5+0.5)]) ||!$_1903352289[round(0+0.4+0.4+0.4+0.4+0.4)]) self::__590009421(self::$_514634986[$_1099266676]); return false;}} return!isset(self::$_1953959253[___38472048(26)][$_1099266676]) || self::$_1953959253[___38472048(27)][$_1099266676];} public static function IsFeatureInstalled($_1099266676){ if($GLOBALS['____156149863'][10]($_1099266676) <= 0) return true; self::__1901021703(); return(isset(self::$_1953959253[___38472048(28)][$_1099266676]) && self::$_1953959253[___38472048(29)][$_1099266676]);} public static function IsFeatureEditable($_1099266676){ if($_1099266676 == '') return true; self::__1901021703(); if(!isset(self::$_514634986[$_1099266676])) return true; if(self::$_514634986[$_1099266676] == ___38472048(30)) $_1903352289= array(___38472048(31)); elseif(isset(self::$_1953959253[___38472048(32)][self::$_514634986[$_1099266676]])) $_1903352289= self::$_1953959253[___38472048(33)][self::$_514634986[$_1099266676]]; else $_1903352289= array(___38472048(34)); if($_1903352289[(1168/2-584)] != ___38472048(35) && $_1903352289[(172*2-344)] != ___38472048(36)){ return false;} elseif($_1903352289[min(4,0,1.3333333333333)] == ___38472048(37)){ if($_1903352289[round(0+1)]< $GLOBALS['____156149863'][11]((978-2*489),(1492/2-746), min(146,0,48.666666666667), Date(___38472048(38)), $GLOBALS['____156149863'][12](___38472048(39))- self::$_691589434, $GLOBALS['____156149863'][13](___38472048(40)))){ if(!isset($_1903352289[round(0+0.4+0.4+0.4+0.4+0.4)]) ||!$_1903352289[round(0+2)]) self::__590009421(self::$_514634986[$_1099266676]); return false;}} return true;} private static function __949632054($_1099266676, $_351444126){ if($GLOBALS['____156149863'][14]("CBXFeatures", "On".$_1099266676."SettingsChange")) $GLOBALS['____156149863'][15](array("CBXFeatures", "On".$_1099266676."SettingsChange"), array($_1099266676, $_351444126)); $_1973835765= $GLOBALS['_____808400039'][0](___38472048(41), ___38472048(42).$_1099266676.___38472048(43)); while($_1569521004= $_1973835765->Fetch()) $GLOBALS['_____808400039'][1]($_1569521004, array($_1099266676, $_351444126));} public static function SetFeatureEnabled($_1099266676, $_351444126= true, $_73213477= true){ if($GLOBALS['____156149863'][16]($_1099266676) <= 0) return; if(!self::IsFeatureEditable($_1099266676)) $_351444126= false; $_351444126= (bool)$_351444126; self::__1901021703(); $_1364143966=(!isset(self::$_1953959253[___38472048(44)][$_1099266676]) && $_351444126 || isset(self::$_1953959253[___38472048(45)][$_1099266676]) && $_351444126 != self::$_1953959253[___38472048(46)][$_1099266676]); self::$_1953959253[___38472048(47)][$_1099266676]= $_351444126; $_512231369= $GLOBALS['____156149863'][17](self::$_1953959253); $_512231369= $GLOBALS['____156149863'][18]($_512231369); COption::SetOptionString(___38472048(48), ___38472048(49), $_512231369); if($_1364143966 && $_73213477) self::__949632054($_1099266676, $_351444126);} private static function __590009421($_1799614104){ if($GLOBALS['____156149863'][19]($_1799614104) <= 0 || $_1799614104 == "Portal") return; self::__1901021703(); if(!isset(self::$_1953959253[___38472048(50)][$_1799614104]) || self::$_1953959253[___38472048(51)][$_1799614104][min(130,0,43.333333333333)] != ___38472048(52)) return; if(isset(self::$_1953959253[___38472048(53)][$_1799614104][round(0+2)]) && self::$_1953959253[___38472048(54)][$_1799614104][round(0+0.66666666666667+0.66666666666667+0.66666666666667)]) return; $_2106545222= array(); if(isset(self::$_1318428844[$_1799614104]) && $GLOBALS['____156149863'][20](self::$_1318428844[$_1799614104])){ foreach(self::$_1318428844[$_1799614104] as $_1099266676){ if(isset(self::$_1953959253[___38472048(55)][$_1099266676]) && self::$_1953959253[___38472048(56)][$_1099266676]){ self::$_1953959253[___38472048(57)][$_1099266676]= false; $_2106545222[]= array($_1099266676, false);}} self::$_1953959253[___38472048(58)][$_1799614104][round(0+0.4+0.4+0.4+0.4+0.4)]= true;} $_512231369= $GLOBALS['____156149863'][21](self::$_1953959253); $_512231369= $GLOBALS['____156149863'][22]($_512231369); COption::SetOptionString(___38472048(59), ___38472048(60), $_512231369); foreach($_2106545222 as $_1634659466) self::__949632054($_1634659466[min(222,0,74)], $_1634659466[round(0+0.33333333333333+0.33333333333333+0.33333333333333)]);} public static function ModifyFeaturesSettings($_1838417299, $_1740401223){ self::__1901021703(); foreach($_1838417299 as $_1799614104 => $_790558705) self::$_1953959253[___38472048(61)][$_1799614104]= $_790558705; $_2106545222= array(); foreach($_1740401223 as $_1099266676 => $_351444126){ if(!isset(self::$_1953959253[___38472048(62)][$_1099266676]) && $_351444126 || isset(self::$_1953959253[___38472048(63)][$_1099266676]) && $_351444126 != self::$_1953959253[___38472048(64)][$_1099266676]) $_2106545222[]= array($_1099266676, $_351444126); self::$_1953959253[___38472048(65)][$_1099266676]= $_351444126;} $_512231369= $GLOBALS['____156149863'][23](self::$_1953959253); $_512231369= $GLOBALS['____156149863'][24]($_512231369); COption::SetOptionString(___38472048(66), ___38472048(67), $_512231369); self::$_1953959253= false; foreach($_2106545222 as $_1634659466) self::__949632054($_1634659466[(141*2-282)], $_1634659466[round(0+0.25+0.25+0.25+0.25)]);} public static function SaveFeaturesSettings($_1696445343, $_791669335){ self::__1901021703(); $_1924044650= array(___38472048(68) => array(), ___38472048(69) => array()); if(!$GLOBALS['____156149863'][25]($_1696445343)) $_1696445343= array(); if(!$GLOBALS['____156149863'][26]($_791669335)) $_791669335= array(); if(!$GLOBALS['____156149863'][27](___38472048(70), $_1696445343)) $_1696445343[]= ___38472048(71); foreach(self::$_1318428844 as $_1799614104 => $_1740401223){ if(isset(self::$_1953959253[___38472048(72)][$_1799614104])){ $_1871516711= self::$_1953959253[___38472048(73)][$_1799614104];} else{ $_1871516711=($_1799614104 == ___38472048(74)? array(___38472048(75)): array(___38472048(76)));} if($_1871516711[min(90,0,30)] == ___38472048(77) || $_1871516711[(872-2*436)] == ___38472048(78)){ $_1924044650[___38472048(79)][$_1799614104]= $_1871516711;} else{ if($GLOBALS['____156149863'][28]($_1799614104, $_1696445343)) $_1924044650[___38472048(80)][$_1799614104]= array(___38472048(81), $GLOBALS['____156149863'][29]((1204/2-602),(1332/2-666),(798-2*399), $GLOBALS['____156149863'][30](___38472048(82)), $GLOBALS['____156149863'][31](___38472048(83)), $GLOBALS['____156149863'][32](___38472048(84)))); else $_1924044650[___38472048(85)][$_1799614104]= array(___38472048(86));}} $_2106545222= array(); foreach(self::$_514634986 as $_1099266676 => $_1799614104){ if($_1924044650[___38472048(87)][$_1799614104][(137*2-274)] != ___38472048(88) && $_1924044650[___38472048(89)][$_1799614104][(1108/2-554)] != ___38472048(90)){ $_1924044650[___38472048(91)][$_1099266676]= false;} else{ if($_1924044650[___38472048(92)][$_1799614104][(988-2*494)] == ___38472048(93) && $_1924044650[___38472048(94)][$_1799614104][round(0+0.5+0.5)]< $GLOBALS['____156149863'][33]((826-2*413),(924-2*462),(1080/2-540), Date(___38472048(95)), $GLOBALS['____156149863'][34](___38472048(96))- self::$_691589434, $GLOBALS['____156149863'][35](___38472048(97)))) $_1924044650[___38472048(98)][$_1099266676]= false; else $_1924044650[___38472048(99)][$_1099266676]= $GLOBALS['____156149863'][36]($_1099266676, $_791669335); if(!isset(self::$_1953959253[___38472048(100)][$_1099266676]) && $_1924044650[___38472048(101)][$_1099266676] || isset(self::$_1953959253[___38472048(102)][$_1099266676]) && $_1924044650[___38472048(103)][$_1099266676] != self::$_1953959253[___38472048(104)][$_1099266676]) $_2106545222[]= array($_1099266676, $_1924044650[___38472048(105)][$_1099266676]);}} $_512231369= $GLOBALS['____156149863'][37]($_1924044650); $_512231369= $GLOBALS['____156149863'][38]($_512231369); COption::SetOptionString(___38472048(106), ___38472048(107), $_512231369); self::$_1953959253= false; foreach($_2106545222 as $_1634659466) self::__949632054($_1634659466[(153*2-306)], $_1634659466[round(0+0.2+0.2+0.2+0.2+0.2)]);} public static function GetFeaturesList(){ self::__1901021703(); $_977925505= array(); foreach(self::$_1318428844 as $_1799614104 => $_1740401223){ if(isset(self::$_1953959253[___38472048(108)][$_1799614104])){ $_1871516711= self::$_1953959253[___38472048(109)][$_1799614104];} else{ $_1871516711=($_1799614104 == ___38472048(110)? array(___38472048(111)): array(___38472048(112)));} $_977925505[$_1799614104]= array( ___38472048(113) => $_1871516711[min(216,0,72)], ___38472048(114) => $_1871516711[round(0+0.2+0.2+0.2+0.2+0.2)], ___38472048(115) => array(),); $_977925505[$_1799614104][___38472048(116)]= false; if($_977925505[$_1799614104][___38472048(117)] == ___38472048(118)){ $_977925505[$_1799614104][___38472048(119)]= $GLOBALS['____156149863'][39](($GLOBALS['____156149863'][40]()- $_977925505[$_1799614104][___38472048(120)])/ round(0+43200+43200)); if($_977925505[$_1799614104][___38472048(121)]> self::$_691589434) $_977925505[$_1799614104][___38472048(122)]= true;} foreach($_1740401223 as $_1099266676) $_977925505[$_1799614104][___38472048(123)][$_1099266676]=(!isset(self::$_1953959253[___38472048(124)][$_1099266676]) || self::$_1953959253[___38472048(125)][$_1099266676]);} return $_977925505;} private static function __1051073809($_1797934566, $_468376567){ if(IsModuleInstalled($_1797934566) == $_468376567) return true; $_1367131144= $_SERVER[___38472048(126)].___38472048(127).$_1797934566.___38472048(128); if(!$GLOBALS['____156149863'][41]($_1367131144)) return false; include_once($_1367131144); $_562288853= $GLOBALS['____156149863'][42](___38472048(129), ___38472048(130), $_1797934566); if(!$GLOBALS['____156149863'][43]($_562288853)) return false; $_905172557= new $_562288853; if($_468376567){ if(!$_905172557->InstallDB()) return false; $_905172557->InstallEvents(); if(!$_905172557->InstallFiles()) return false;} else{ if(CModule::IncludeModule(___38472048(131))) CSearch::DeleteIndex($_1797934566); UnRegisterModule($_1797934566);} return true;} protected static function OnRequestsSettingsChange($_1099266676, $_351444126){ self::__1051073809("form", $_351444126);} protected static function OnLearningSettingsChange($_1099266676, $_351444126){ self::__1051073809("learning", $_351444126);} protected static function OnJabberSettingsChange($_1099266676, $_351444126){ self::__1051073809("xmpp", $_351444126);} protected static function OnVideoConferenceSettingsChange($_1099266676, $_351444126){} protected static function OnBizProcSettingsChange($_1099266676, $_351444126){ self::__1051073809("bizprocdesigner", $_351444126);} protected static function OnListsSettingsChange($_1099266676, $_351444126){ self::__1051073809("lists", $_351444126);} protected static function OnWikiSettingsChange($_1099266676, $_351444126){ self::__1051073809("wiki", $_351444126);} protected static function OnSupportSettingsChange($_1099266676, $_351444126){ self::__1051073809("support", $_351444126);} protected static function OnControllerSettingsChange($_1099266676, $_351444126){ self::__1051073809("controller", $_351444126);} protected static function OnAnalyticsSettingsChange($_1099266676, $_351444126){ self::__1051073809("statistic", $_351444126);} protected static function OnVoteSettingsChange($_1099266676, $_351444126){ self::__1051073809("vote", $_351444126);} protected static function OnFriendsSettingsChange($_1099266676, $_351444126){ if($_351444126) $_1347385821= "Y"; else $_1347385821= ___38472048(132); $_1137706004= CSite::GetList(___38472048(133), ___38472048(134), array(___38472048(135) => ___38472048(136))); while($_622474434= $_1137706004->Fetch()){ if(COption::GetOptionString(___38472048(137), ___38472048(138), ___38472048(139), $_622474434[___38472048(140)]) != $_1347385821){ COption::SetOptionString(___38472048(141), ___38472048(142), $_1347385821, false, $_622474434[___38472048(143)]); COption::SetOptionString(___38472048(144), ___38472048(145), $_1347385821);}}} protected static function OnMicroBlogSettingsChange($_1099266676, $_351444126){ if($_351444126) $_1347385821= "Y"; else $_1347385821= ___38472048(146); $_1137706004= CSite::GetList(___38472048(147), ___38472048(148), array(___38472048(149) => ___38472048(150))); while($_622474434= $_1137706004->Fetch()){ if(COption::GetOptionString(___38472048(151), ___38472048(152), ___38472048(153), $_622474434[___38472048(154)]) != $_1347385821){ COption::SetOptionString(___38472048(155), ___38472048(156), $_1347385821, false, $_622474434[___38472048(157)]); COption::SetOptionString(___38472048(158), ___38472048(159), $_1347385821);} if(COption::GetOptionString(___38472048(160), ___38472048(161), ___38472048(162), $_622474434[___38472048(163)]) != $_1347385821){ COption::SetOptionString(___38472048(164), ___38472048(165), $_1347385821, false, $_622474434[___38472048(166)]); COption::SetOptionString(___38472048(167), ___38472048(168), $_1347385821);}}} protected static function OnPersonalFilesSettingsChange($_1099266676, $_351444126){ if($_351444126) $_1347385821= "Y"; else $_1347385821= ___38472048(169); $_1137706004= CSite::GetList(___38472048(170), ___38472048(171), array(___38472048(172) => ___38472048(173))); while($_622474434= $_1137706004->Fetch()){ if(COption::GetOptionString(___38472048(174), ___38472048(175), ___38472048(176), $_622474434[___38472048(177)]) != $_1347385821){ COption::SetOptionString(___38472048(178), ___38472048(179), $_1347385821, false, $_622474434[___38472048(180)]); COption::SetOptionString(___38472048(181), ___38472048(182), $_1347385821);}}} protected static function OnPersonalBlogSettingsChange($_1099266676, $_351444126){ if($_351444126) $_1347385821= "Y"; else $_1347385821= ___38472048(183); $_1137706004= CSite::GetList(___38472048(184), ___38472048(185), array(___38472048(186) => ___38472048(187))); while($_622474434= $_1137706004->Fetch()){ if(COption::GetOptionString(___38472048(188), ___38472048(189), ___38472048(190), $_622474434[___38472048(191)]) != $_1347385821){ COption::SetOptionString(___38472048(192), ___38472048(193), $_1347385821, false, $_622474434[___38472048(194)]); COption::SetOptionString(___38472048(195), ___38472048(196), $_1347385821);}}} protected static function OnPersonalPhotoSettingsChange($_1099266676, $_351444126){ if($_351444126) $_1347385821= "Y"; else $_1347385821= ___38472048(197); $_1137706004= CSite::GetList(___38472048(198), ___38472048(199), array(___38472048(200) => ___38472048(201))); while($_622474434= $_1137706004->Fetch()){ if(COption::GetOptionString(___38472048(202), ___38472048(203), ___38472048(204), $_622474434[___38472048(205)]) != $_1347385821){ COption::SetOptionString(___38472048(206), ___38472048(207), $_1347385821, false, $_622474434[___38472048(208)]); COption::SetOptionString(___38472048(209), ___38472048(210), $_1347385821);}}} protected static function OnPersonalForumSettingsChange($_1099266676, $_351444126){ if($_351444126) $_1347385821= "Y"; else $_1347385821= ___38472048(211); $_1137706004= CSite::GetList(___38472048(212), ___38472048(213), array(___38472048(214) => ___38472048(215))); while($_622474434= $_1137706004->Fetch()){ if(COption::GetOptionString(___38472048(216), ___38472048(217), ___38472048(218), $_622474434[___38472048(219)]) != $_1347385821){ COption::SetOptionString(___38472048(220), ___38472048(221), $_1347385821, false, $_622474434[___38472048(222)]); COption::SetOptionString(___38472048(223), ___38472048(224), $_1347385821);}}} protected static function OnTasksSettingsChange($_1099266676, $_351444126){ if($_351444126) $_1347385821= "Y"; else $_1347385821= ___38472048(225); $_1137706004= CSite::GetList(___38472048(226), ___38472048(227), array(___38472048(228) => ___38472048(229))); while($_622474434= $_1137706004->Fetch()){ if(COption::GetOptionString(___38472048(230), ___38472048(231), ___38472048(232), $_622474434[___38472048(233)]) != $_1347385821){ COption::SetOptionString(___38472048(234), ___38472048(235), $_1347385821, false, $_622474434[___38472048(236)]); COption::SetOptionString(___38472048(237), ___38472048(238), $_1347385821);} if(COption::GetOptionString(___38472048(239), ___38472048(240), ___38472048(241), $_622474434[___38472048(242)]) != $_1347385821){ COption::SetOptionString(___38472048(243), ___38472048(244), $_1347385821, false, $_622474434[___38472048(245)]); COption::SetOptionString(___38472048(246), ___38472048(247), $_1347385821);}} self::__1051073809(___38472048(248), $_351444126);} protected static function OnCalendarSettingsChange($_1099266676, $_351444126){ if($_351444126) $_1347385821= "Y"; else $_1347385821= ___38472048(249); $_1137706004= CSite::GetList(___38472048(250), ___38472048(251), array(___38472048(252) => ___38472048(253))); while($_622474434= $_1137706004->Fetch()){ if(COption::GetOptionString(___38472048(254), ___38472048(255), ___38472048(256), $_622474434[___38472048(257)]) != $_1347385821){ COption::SetOptionString(___38472048(258), ___38472048(259), $_1347385821, false, $_622474434[___38472048(260)]); COption::SetOptionString(___38472048(261), ___38472048(262), $_1347385821);} if(COption::GetOptionString(___38472048(263), ___38472048(264), ___38472048(265), $_622474434[___38472048(266)]) != $_1347385821){ COption::SetOptionString(___38472048(267), ___38472048(268), $_1347385821, false, $_622474434[___38472048(269)]); COption::SetOptionString(___38472048(270), ___38472048(271), $_1347385821);}}} protected static function OnSMTPSettingsChange($_1099266676, $_351444126){ self::__1051073809("mail", $_351444126);} protected static function OnExtranetSettingsChange($_1099266676, $_351444126){ $_1142480016= COption::GetOptionString("extranet", "extranet_site", ""); if($_1142480016){ $_1906871392= new CSite; $_1906871392->Update($_1142480016, array(___38472048(272) =>($_351444126? ___38472048(273): ___38472048(274))));} self::__1051073809(___38472048(275), $_351444126);} protected static function OnDAVSettingsChange($_1099266676, $_351444126){ self::__1051073809("dav", $_351444126);} protected static function OntimemanSettingsChange($_1099266676, $_351444126){ self::__1051073809("timeman", $_351444126);} protected static function Onintranet_sharepointSettingsChange($_1099266676, $_351444126){ if($_351444126){ RegisterModuleDependences("iblock", "OnAfterIBlockElementAdd", "intranet", "CIntranetEventHandlers", "SPRegisterUpdatedItem"); RegisterModuleDependences(___38472048(276), ___38472048(277), ___38472048(278), ___38472048(279), ___38472048(280)); CAgent::AddAgent(___38472048(281), ___38472048(282), ___38472048(283), round(0+100+100+100+100+100)); CAgent::AddAgent(___38472048(284), ___38472048(285), ___38472048(286), round(0+300)); CAgent::AddAgent(___38472048(287), ___38472048(288), ___38472048(289), round(0+720+720+720+720+720));} else{ UnRegisterModuleDependences(___38472048(290), ___38472048(291), ___38472048(292), ___38472048(293), ___38472048(294)); UnRegisterModuleDependences(___38472048(295), ___38472048(296), ___38472048(297), ___38472048(298), ___38472048(299)); CAgent::RemoveAgent(___38472048(300), ___38472048(301)); CAgent::RemoveAgent(___38472048(302), ___38472048(303)); CAgent::RemoveAgent(___38472048(304), ___38472048(305));}} protected static function OncrmSettingsChange($_1099266676, $_351444126){ if($_351444126) COption::SetOptionString("crm", "form_features", "Y"); self::__1051073809(___38472048(306), $_351444126);} protected static function OnClusterSettingsChange($_1099266676, $_351444126){ self::__1051073809("cluster", $_351444126);} protected static function OnMultiSitesSettingsChange($_1099266676, $_351444126){ if($_351444126) RegisterModuleDependences("main", "OnBeforeProlog", "main", "CWizardSolPanelIntranet", "ShowPanel", 100, "/modules/intranet/panel_button.php"); else UnRegisterModuleDependences(___38472048(307), ___38472048(308), ___38472048(309), ___38472048(310), ___38472048(311), ___38472048(312));} protected static function OnIdeaSettingsChange($_1099266676, $_351444126){ self::__1051073809("idea", $_351444126);} protected static function OnMeetingSettingsChange($_1099266676, $_351444126){ self::__1051073809("meeting", $_351444126);} protected static function OnXDImportSettingsChange($_1099266676, $_351444126){ self::__1051073809("xdimport", $_351444126);}} $GLOBALS['____156149863'][44](___38472048(313), ___38472048(314));/**/			//Do not remove this

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

/*ZDUyZmZYzUwYzAxYzVlMGE1ZGQxZjQxODcyODc3YzVjNTQ4ZjU=*/$GLOBALS['____1685332841']= array(base64_decode('b'.'XRf'.'cmFuZ'.'A='.'='),base64_decode(''.'Y2FsbF91c'.'2Vy'.'X2'.'Z'.'1bmM='),base64_decode('c3'.'Ry'.'cG9'.'z'),base64_decode('ZXh'.'wbG9kZQ'.'=='),base64_decode('c'.'GFjaw='.'='),base64_decode(''.'bWQ'.'1'),base64_decode('Y29uc'.'3R'.'hbnQ='),base64_decode(''.'aGF'.'zaF'.'9o'.'bWF'.'j'),base64_decode('c3RyY'.'21w'),base64_decode('Y2FsbF91'.'c'.'2VyX'.'2'.'Z'.'1'.'bmM'.'='),base64_decode('Y2FsbF9'.'1'.'c2'.'V'.'yX2Z'.'1bmM='),base64_decode('aXNfb2J'.'qZWN0'),base64_decode(''.'Y2Fsb'.'F91c2VyX2Z'.'1'.'bmM='),base64_decode(''.'Y2FsbF91c2'.'VyX'.'2Z1bm'.'M='),base64_decode(''.'Y2FsbF91c2V'.'yX2Z1bmM='),base64_decode('Y2FsbF91c'.'2Vy'.'X2Z'.'1b'.'mM'.'='),base64_decode('Y2'.'Fs'.'bF91c2'.'VyX'.'2'.'Z1b'.'mM='),base64_decode(''.'Y2'.'FsbF91c2VyX2Z1'.'b'.'mM='));if(!function_exists(__NAMESPACE__.'\\___737080378')){function ___737080378($_547531797){static $_104976454= false; if($_104976454 == false) $_104976454=array('X'.'ENP'.'c'.'H'.'R'.'p'.'b2'.'4'.'6'.'O'.'kdld'.'E9wd'.'Glvbl'.'N0c'.'m'.'luZw==','bW'.'Fp'.'bg==','flBBU'.'kFN'.'X01'.'BWF9V'.'U0VSUw'.'==','Lg==','Lg='.'=','SCo=',''.'Ym'.'l'.'0cml4','TElDR'.'U'.'5TR'.'V9LR'.'Vk=','c'.'2hhM'.'jU2',''.'XENPc'.'H'.'Rpb2'.'46OkdldE'.'9'.'wdGlv'.'blN0c'.'m'.'luZw==','b'.'WFpbg'.'==','UEFSQU'.'1fTUFYX1'.'VTRVJT',''.'XE'.'Jpd'.'HJpeFx'.'NYW'.'luX'.'ENvbmZpZ'.'1xPcHRpb24'.'6'.'OnNld'.'A='.'=','bW'.'Fpbg==','UEFS'.'QU1f'.'T'.'UFYX1VTRVJT',''.'V'.'VNF'.'Ug='.'=','VVNFU'.'g'.'==','VVNF'.'Ug==','SXNBd'.'X'.'R'.'o'.'b3JpemV'.'k','VVN'.'FUg'.'='.'=',''.'S'.'X'.'NBZG'.'1pbg==',''.'Q'.'V'.'BQT'.'ElDQVRJT04=','Um'.'VzdGFydEJ1ZmZlcg='.'=','TG'.'9jYWxSZW'.'Rpcm'.'VjdA==',''.'L2xpY2'.'V'.'uc2VfcmV'.'zdHJpY3Rpb24'.'ucGhw',''.'XENPcHRpb'.'246O'.'k'.'dld'.'E9wdGlvblN0c'.'mluZw==','bWFp'.'b'.'g==','UE'.'FSQU'.'1f'.'TU'.'FYX'.'1VTRVJT','XEJpdHJ'.'pe'.'FxNYWluX'.'ENvbmZ'.'pZ1x'.'PcHRpb2'.'4'.'6OnNl'.'dA='.'=','bW'.'Fp'.'bg='.'=','UEFSQU1f'.'TUFYX1VT'.'RVJ'.'T');return base64_decode($_104976454[$_547531797]);}};if($GLOBALS['____1685332841'][0](round(0+1), round(0+4+4+4+4+4)) == round(0+1.75+1.75+1.75+1.75)){ $_999841087= $GLOBALS['____1685332841'][1](___737080378(0), ___737080378(1), ___737080378(2)); if(!empty($_999841087) && $GLOBALS['____1685332841'][2]($_999841087, ___737080378(3)) !== false){ list($_484339620, $_1104606269)= $GLOBALS['____1685332841'][3](___737080378(4), $_999841087); $_604079271= $GLOBALS['____1685332841'][4](___737080378(5), $_484339620); $_34208548= ___737080378(6).$GLOBALS['____1685332841'][5]($GLOBALS['____1685332841'][6](___737080378(7))); $_41461302= $GLOBALS['____1685332841'][7](___737080378(8), $_1104606269, $_34208548, true); if($GLOBALS['____1685332841'][8]($_41461302, $_604079271) !==(191*2-382)){ if($GLOBALS['____1685332841'][9](___737080378(9), ___737080378(10), ___737080378(11)) != round(0+2.4+2.4+2.4+2.4+2.4)){ $GLOBALS['____1685332841'][10](___737080378(12), ___737080378(13), ___737080378(14), round(0+6+6));} if(isset($GLOBALS[___737080378(15)]) && $GLOBALS['____1685332841'][11]($GLOBALS[___737080378(16)]) && $GLOBALS['____1685332841'][12](array($GLOBALS[___737080378(17)], ___737080378(18))) &&!$GLOBALS['____1685332841'][13](array($GLOBALS[___737080378(19)], ___737080378(20)))){ $GLOBALS['____1685332841'][14](array($GLOBALS[___737080378(21)], ___737080378(22))); $GLOBALS['____1685332841'][15](___737080378(23), ___737080378(24), true);}}} else{ if($GLOBALS['____1685332841'][16](___737080378(25), ___737080378(26), ___737080378(27)) != round(0+3+3+3+3)){ $GLOBALS['____1685332841'][17](___737080378(28), ___737080378(29), ___737080378(30), round(0+12));}}}/**/       //Do not remove this

