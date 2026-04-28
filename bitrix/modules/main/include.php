<?php

/**
 * Bitrix Framework
 * @package bitrix
 * @subpackage main
 * @copyright 2001-2026 Bitrix
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

/*ZDUyZmZYzc0ZjQ2NWYwOGQ3NmVkY2Y2MWQ1MWNhYWFlNjI0MjE=*/$GLOBALS['_____550459820']= array(base64_decode('R2V0T'.'W'.'9kdWxlRX'.'ZlbnRz'),base64_decode(''.'RXh'.'lY3V0'.'Z'.'U1'.'v'.'ZH'.'VsZUV2ZW5'.'0RXg='));$GLOBALS['____574144383']= array(base64_decode('Z'.'G'.'V'.'ma'.'W5l'),base64_decode('YmFzZ'.'TY0X2R'.'lY29kZQ=='),base64_decode(''.'dW'.'5zZX'.'J'.'pYW'.'xpemU'.'='),base64_decode('aXNfYXJ'.'yY'.'Xk='),base64_decode(''.'aW5fYXJy'.'YXk='),base64_decode('c2Vya'.'WF'.'sa'.'Xpl'),base64_decode('Ym'.'F'.'zZ'.'T'.'Y'.'0X2VuY'.'29kZ'.'Q=='),base64_decode('b'.'Wt0aW1l'),base64_decode('ZGF0ZQ=='),base64_decode(''.'ZG'.'F'.'0ZQ=='),base64_decode('c3RybGVu'),base64_decode(''.'bW'.'t0a'.'W1l'),base64_decode('ZGF0ZQ='.'='),base64_decode(''.'ZGF'.'0ZQ'.'=='),base64_decode('bW'.'V0a'.'G9kX2V4aX'.'N0c'.'w='.'='),base64_decode('Y2F'.'sbF91c2V'.'yX2Z'.'1'.'bm'.'Nf'.'YX'.'Jy'.'YX'.'k='),base64_decode('c'.'3'.'RybGVu'),base64_decode('c2'.'Vy'.'aWFsaX'.'p'.'l'),base64_decode('YmFzZT'.'Y0'.'X2VuY2'.'9kZQ'.'=='),base64_decode('c3R'.'ybG'.'Vu'),base64_decode('aXNfY'.'XJy'.'YX'.'k='),base64_decode('c2VyaWF'.'saX'.'pl'),base64_decode('Y'.'mFzZT'.'Y'.'0X2VuY29'.'kZQ'.'='.'='),base64_decode('c2VyaWFs'.'aXpl'),base64_decode('Ym'.'F'.'zZTY0X2'.'VuY29kZQ='.'='),base64_decode('aXNfYXJyYXk'.'='),base64_decode('aXNfYXJ'.'yY'.'Xk'.'='),base64_decode('aW5fYXJyYX'.'k'.'='),base64_decode(''.'aW5fY'.'XJyY'.'Xk'.'='),base64_decode('b'.'W'.'t0aW1l'),base64_decode(''.'Z'.'GF0ZQ=='),base64_decode('ZGF0'.'ZQ'.'='.'='),base64_decode('Z'.'G'.'F0ZQ'.'=='),base64_decode('b'.'Wt0'.'aW1'.'l'),base64_decode('ZG'.'F0ZQ=='),base64_decode('ZGF0ZQ'.'=='),base64_decode('aW5fYXJyYXk='),base64_decode(''.'c2VyaWFsaXpl'),base64_decode('Ym'.'FzZTY0X2'.'V'.'uY29'.'kZQ=='),base64_decode('aW'.'5'.'0d'.'mFs'),base64_decode('dGltZQ=='),base64_decode('ZmlsZV9leGl'.'zdHM='),base64_decode('c3RyX3'.'JlcGxhY2U'.'='),base64_decode('Y2'.'xhc3N'.'fZX'.'hpc3'.'R'.'z'),base64_decode('ZGVma'.'W'.'5'.'l'));if(!function_exists(__NAMESPACE__.'\\___925010350')){function ___925010350($_555093810){static $_1876849779= false; if($_1876849779 == false) $_1876849779=array(''.'SU5UUkFORVRfR'.'URJ'.'VElP'.'Tg==','WQ==','bWFpbg==','fm'.'NwZl9tY'.'XBfdm'.'FsdWU=','','','YWxsb3d'.'lZF9jb'.'GFzc2Vz','ZQ==','Zg==','ZQ'.'==','Rg==','WA==','Z'.'g==',''.'bWFpbg'.'==','fmNwZl9tYXBfdmFsdWU=','U'.'G9y'.'d'.'GFs','Rg==','ZQ==',''.'ZQ'.'==','WA'.'='.'=','Rg==','RA==','RA'.'==',''.'b'.'Q==','ZA==','WQ==','Z'.'g==','Zg'.'='.'=','Zg==',''.'Zg==',''.'U'.'G9yd'.'GFs','Rg'.'==','ZQ==','Z'.'Q==','W'.'A==','Rg==','RA==','R'.'A==','bQ==','ZA==','WQ='.'=','bWFpbg='.'=','T24=','U2V0dG'.'luZ3ND'.'a'.'GFuZ2U'.'=','Zg='.'=','Zg='.'=','Z'.'g==','Z'.'g==',''.'bW'.'Fpbg='.'=',''.'fmNwZ'.'l9tYXBfd'.'mFsdWU=',''.'ZQ==','ZQ'.'==','R'.'A==','ZQ==','ZQ'.'==','Z'.'g==',''.'Zg==','Zg==','ZQ==','bWFpbg='.'=',''.'fmNwZl'.'9tYXBfdm'.'Fs'.'d'.'W'.'U=',''.'Z'.'Q'.'==','Z'.'g='.'=',''.'Zg='.'=','Z'.'g'.'==',''.'Z'.'g'.'==','bWFpbg==','f'.'mN'.'w'.'Zl9t'.'YXBfdmFs'.'d'.'WU=',''.'ZQ='.'=','Zg==',''.'UG9'.'yd'.'GFs','UG'.'9ydGF'.'s','ZQ==','ZQ='.'=','UG'.'9ydGFs','Rg==',''.'WA'.'==','Rg='.'=','RA==',''.'ZQ==','ZQ==','RA==','bQ==','Z'.'A==','WQ==',''.'ZQ==','WA'.'==','ZQ==','Rg==','ZQ==','RA'.'==','Zg='.'=','Z'.'Q==','R'.'A==','ZQ'.'==','bQ==','ZA='.'=','WQ'.'='.'=','Zg'.'==','Zg='.'=','Zg==','Zg==','Zg==',''.'Zg==','Zg='.'=','Zg'.'==',''.'bWFpb'.'g'.'==','fmNwZl9tYXBfdmFsd'.'WU=','ZQ'.'==','Z'.'Q='.'=','U'.'G9ydGFs',''.'Rg==','WA='.'=','VF'.'lQRQ==','REFURQ='.'=','RkV'.'BVFVSRVM=','RVhQSVJF'.'RA==','VF'.'lQRQ==','RA==','VFJ'.'Z'.'X0RBWVNfQ'.'0'.'9VTlQ'.'=',''.'R'.'EFUR'.'Q==','VF'.'JZX0R'.'B'.'W'.'VNfQ09VT'.'lQ=','RV'.'hQSVJFRA==','RkVBV'.'FVSR'.'VM=','Zg==','Zg==','RE9'.'DVU1FTlRfU'.'k9PV'.'A==','L2J'.'pdHJ'.'peC9'.'tb2'.'R1'.'bGVzLw='.'=',''.'L2luc3RhbG'.'w'.'v'.'aW5kZXgucG'.'hw','Lg='.'=',''.'Xw==','c2VhcmNo','Tg==','','','QUN'.'USV'.'Z'.'F','W'.'Q='.'=','c2'.'9j'.'a'.'WFs'.'bmV0'.'d29yaw'.'==','YWxsb3dfZnJpZWxkcw'.'='.'=',''.'WQ==','S'.'U'.'Q=','c'.'29ja'.'WFsbmV0d29yaw'.'='.'=',''.'Y'.'W'.'xsb3'.'dfZnJpZWx'.'kcw='.'=','SUQ'.'=','c29ja'.'WFsbmV0d'.'29ya'.'w==','YWxsb3'.'dfZ'.'nJ'.'pZWx'.'kc'.'w==','Tg==','','','Q'.'UNUSVZF','W'.'Q='.'=','c29ja'.'W'.'F'.'s'.'b'.'mV0d29yaw==','Y'.'Wxsb3dfbWlj'.'c'.'m'.'9ibG9nX'.'3VzZXI=','WQ='.'=','SUQ=','c29jaWF'.'s'.'b'.'mV'.'0d29y'.'aw'.'==','YWxs'.'b'.'3dfb'.'Wljcm9ibG9nX3Vz'.'ZXI=','S'.'UQ=','c2'.'9jaWF'.'sbmV0'.'d2'.'9y'.'aw==','YW'.'xsb3df'.'bWljcm9i'.'bG9nX3'.'Vz'.'ZXI=','c2'.'9jaWFsbmV0d29yaw==',''.'YWxsb3dfbWlj'.'c'.'m9ibG9nX2'.'dy'.'b3Vw','WQ==','S'.'UQ=','c29jaWFsbmV0'.'d'.'29yaw'.'==','YWxsb3dfbW'.'ljcm9i'.'bG'.'9nX2dyb'.'3Vw','SUQ'.'=','c29'.'jaWF'.'sb'.'m'.'V0d29yaw==','YWx'.'s'.'b3dfbWljcm9'.'ibG9n'.'X2dyb3'.'Vw',''.'T'.'g==','','','QUN'.'US'.'VZF','WQ='.'=','c29j'.'aWFsbm'.'V0'.'d2'.'9'.'yaw==','YWxsb'.'3dfZm'.'lsZXNfdXNlcg==','W'.'Q==','S'.'UQ=',''.'c'.'29'.'jaWFsbmV0d2'.'9yaw==','YWxsb'.'3'.'dfZmls'.'Z'.'XNfdXNlcg'.'==',''.'SUQ=','c29jaWFsbmV0d29yaw==',''.'YW'.'xsb3df'.'ZmlsZXNfdXNlcg='.'=',''.'T'.'g==','','','QUN'.'USVZ'.'F','W'.'Q'.'==','c'.'29jaWFsbmV0d29yaw==','YW'.'xs'.'b3d'.'fYmxvZ19'.'1c2Vy','WQ==','S'.'UQ=','c2'.'9jaW'.'Fs'.'bmV0d'.'29yaw==','YW'.'xsb'.'3dfYmx'.'vZ191c2Vy','SUQ'.'=','c29j'.'aWFsbmV0'.'d'.'29yaw'.'==','YWxsb3dfYmx'.'vZ191c2Vy','Tg==','','',''.'Q'.'UNUSV'.'ZF','WQ==',''.'c'.'2'.'9'.'jaWFsbmV0d29'.'yaw==','YWxsb'.'3dfcG'.'hvd'.'G9'.'fdXNlcg'.'==','WQ==','SU'.'Q'.'=','c29jaWF'.'sbmV0d29ya'.'w==','YWxsb3dfcGh'.'vd'.'G9fdXNl'.'cg==','SUQ=','c'.'2'.'9jaW'.'FsbmV0d29yaw'.'==','YWxs'.'b3'.'dfcGhvdG9fdXNl'.'cg'.'==','Tg'.'==','','','Q'.'UNUSVZF','WQ==','c29'.'j'.'aWFs'.'bmV0d29ya'.'w==',''.'YWxsb'.'3df'.'Zm9yd'.'W1fdXNlcg='.'=','WQ==','SUQ=','c29jaW'.'Fsbm'.'V'.'0d29'.'yaw==','YWx'.'sb3dfZ'.'m'.'9ydW1fdX'.'Nlcg'.'==','SUQ=','c2'.'9j'.'aW'.'FsbmV0d2'.'9'.'yaw==','Y'.'Wxsb3d'.'fZm'.'9ydW1'.'fd'.'XNlcg==','Tg'.'==','','','QUNUSVZF','WQ'.'==','c29jaWFsbmV0'.'d29yaw='.'=','Y'.'Wxs'.'b3d'.'fdGFz'.'a3Nfd'.'XNlcg==','WQ==','S'.'UQ=','c2'.'9'.'ja'.'WF'.'sbmV0d'.'29yaw==',''.'YWxsb3dfdGFz'.'a3NfdX'.'Nlcg==','S'.'UQ=','c29jaWFs'.'bmV0d'.'29y'.'aw==','YWxsb3dfd'.'GFz'.'a3NfdXNlc'.'g==','c29jaWFsbm'.'V0d2'.'9yaw==','YWxsb3'.'df'.'d'.'GFza3NfZ3Jvd'.'XA=',''.'W'.'Q='.'=','SUQ'.'=','c'.'29ja'.'WFsbmV0d29ya'.'w='.'=','YWxsb3dfdGFza3NfZ'.'3Jvd'.'X'.'A=','SU'.'Q=','c2'.'9'.'jaWFsbmV0d29'.'ya'.'w==','YWxsb3d'.'fdGFz'.'a3Nf'.'Z'.'3'.'J'.'vdXA'.'=','dG'.'Fza3'.'M=','Tg'.'='.'=','','',''.'QUNUSVZF','WQ='.'=','c29j'.'aWFs'.'bmV0d'.'2'.'9yaw==','YWxsb3d'.'fY2'.'FsZ'.'W'.'5kYXJfd'.'X'.'Nlcg==',''.'WQ'.'==','SUQ=','c29'.'ja'.'WFsbmV'.'0d29yaw==',''.'YWxsb3dfY2Fs'.'Z'.'W5'.'k'.'YXJfd'.'XNlcg==','SUQ=',''.'c2'.'9jaWFsbmV0d29y'.'aw'.'==','YWxsb3d'.'f'.'Y'.'2FsZW5kYXJ'.'f'.'d'.'XNlcg==','c2'.'9j'.'aW'.'Fsb'.'mV0d'.'29y'.'aw==','YWxs'.'b3dfY'.'2F'.'sZW5kYXJfZ'.'3JvdXA=','WQ='.'=','S'.'UQ=','c29ja'.'WFsbmV'.'0'.'d29ya'.'w='.'=','YWxs'.'b'.'3dfY2Fs'.'ZW5kYXJf'.'Z'.'3'.'JvdXA=','SUQ=','c'.'29'.'j'.'aWFsbmV0d29yaw==','Y'.'Wx'.'s'.'b3'.'d'.'f'.'Y2FsZW5'.'k'.'Y'.'XJfZ3JvdXA'.'=','QUN'.'U'.'SVZ'.'F','WQ'.'==','T'.'g'.'==',''.'Z'.'Xh0cmFuZXQ=',''.'aWJsb'.'2Nr','T2'.'5B'.'Z'.'nRlc'.'klCbG'.'9ja0VsZW'.'1l'.'b'.'nRVcGRhd'.'G'.'U=','a'.'W50cmFu'.'ZXQ=','Q0ludH'.'J'.'hbm'.'V0RX'.'Zlb'.'nRIY'.'W5kbGV'.'ycw==','U1BS'.'Z'.'W'.'dpc3R'.'lclVwZGF'.'0Z'.'W'.'R'.'JdGVt','Q0ludHJhb'.'mV0'.'U'.'2h'.'hc'.'mV'.'wb2l'.'udDo6QWdl'.'bnRMaXN0cygp'.'O'.'w'.'==',''.'a'.'W50cm'.'F'.'uZXQ=','T'.'g==','Q0'.'l'.'ud'.'HJhbm'.'V0U'.'2'.'hh'.'c'.'m'.'Vwb2'.'ludDo'.'6QWd'.'lbnRRdWV'.'1Z'.'SgpOw'.'==','a'.'W'.'50c'.'mF'.'uZXQ'.'=','Tg='.'=',''.'Q0lu'.'dHJ'.'hbmV'.'0U'.'2hhcmV'.'wb2l'.'udD'.'o6Q'.'WdlbnR'.'VcGR'.'h'.'dGUoKT'.'s=','aW5'.'0cmFuZX'.'Q=','Tg==','aWJsb2Nr','T25'.'BZnRlck'.'lCbG9ja0VsZ'.'W1lbnRBZGQ=','aW50cmFuZXQ=','Q0'.'lud'.'HJhbmV0RXZ'.'l'.'bn'.'RI'.'YW5kbGVycw==','U1BS'.'ZWdp'.'c3R'.'l'.'clVwZGF0Z'.'W'.'RJdGVt','a'.'W'.'Jsb2Nr','T25'.'BZnRlcklCbG9ja0V'.'sZW1lb'.'nRVcGRh'.'dGU=','aW50cmFuZXQ=','Q0l'.'udHJhbm'.'V0RXZlb'.'n'.'RIYW'.'5kbG'.'V'.'y'.'cw==','U1B'.'SZW'.'dpc3RlclVwZGF0'.'ZWRJdGVt',''.'Q0ludHJhbmV0'.'U2hh'.'cm'.'Vwb2'.'ludDo6Q'.'Wdl'.'bnRM'.'aXN0'.'cygpOw==','aW50cm'.'FuZXQ'.'=','Q0lu'.'dHJ'.'hbmV0U2hhc'.'mVwb2ludDo6QWdlbn'.'RRdWV1ZSgpOw==','a'.'W50cmFuZXQ=','Q0l'.'udHJh'.'bmV0U2hhcmVwb2ludDo6'.'QWdlbnRVcGRhdGUoKTs'.'=','aW50'.'cmFuZX'.'Q'.'=','Y3Jt','bWFp'.'bg='.'=','T25'.'CZWZvcmVQcm9s'.'b2c=','bWFp'.'bg'.'='.'=','Q1'.'d'.'pemFyZF'.'NvbFBhbmVsSW'.'50cmF'.'uZX'.'Q=','U'.'2hvd1BhbmVs','L21vZH'.'Vs'.'Z'.'XMvaW50c'.'mF'.'u'.'Z'.'XQvc'.'GFuZWxf'.'YnV0dG9uLnBoc'.'A'.'='.'=','RU5DT0RF',''.'WQ==');return base64_decode($_1876849779[$_555093810]);}};$GLOBALS['____574144383'][0](___925010350(0), ___925010350(1));class CBXFeatures{ private static $_1146319407= 30; private static $_2116233542= array( "Portal" => array( "CompanyCalendar", "CompanyPhoto", "CompanyVideo", "CompanyCareer", "StaffChanges", "StaffAbsence", "CommonDocuments", "MeetingRoomBookingSystem", "Wiki", "Learning", "Vote", "WebLink", "Subscribe", "Friends", "PersonalFiles", "PersonalBlog", "PersonalPhoto", "PersonalForum", "Blog", "Forum", "Gallery", "Board", "MicroBlog", "WebMessenger",), "Communications" => array( "Tasks", "Calendar", "Workgroups", "Jabber", "VideoConference", "Extranet", "SMTP", "Requests", "DAV", "intranet_sharepoint", "timeman", "Idea", "Meeting", "EventList", "Salary", "XDImport",), "Enterprise" => array( "BizProc", "Lists", "Support", "Analytics", "crm", "Controller", "LdapUnlimitedUsers",), "Holding" => array( "Cluster", "MultiSites",),); private static $_1393075710= null; private static $_1169353583= null; private static function __737847818(){ if(self::$_1393075710 === null){ self::$_1393075710= array(); foreach(self::$_2116233542 as $_2141608205 => $_770305689){ foreach($_770305689 as $_989148535) self::$_1393075710[$_989148535]= $_2141608205;}} if(self::$_1169353583 === null){ self::$_1169353583= array(); $_1910708959= COption::GetOptionString(___925010350(2), ___925010350(3), ___925010350(4)); if($_1910708959 != ___925010350(5)){ $_1910708959= $GLOBALS['____574144383'][1]($_1910708959); $_1910708959= $GLOBALS['____574144383'][2]($_1910708959,[___925010350(6) => false]); if($GLOBALS['____574144383'][3]($_1910708959)){ self::$_1169353583= $_1910708959;}} if(empty(self::$_1169353583)){ self::$_1169353583= array(___925010350(7) => array(), ___925010350(8) => array());}}} public static function InitiateEditionsSettings($_2117823301){ self::__737847818(); $_872040398= array(); foreach(self::$_2116233542 as $_2141608205 => $_770305689){ $_1531079958= $GLOBALS['____574144383'][4]($_2141608205, $_2117823301); self::$_1169353583[___925010350(9)][$_2141608205]=($_1531079958? array(___925010350(10)): array(___925010350(11))); foreach($_770305689 as $_989148535){ self::$_1169353583[___925010350(12)][$_989148535]= $_1531079958; if(!$_1531079958) $_872040398[]= array($_989148535, false);}} $_209307643= $GLOBALS['____574144383'][5](self::$_1169353583); $_209307643= $GLOBALS['____574144383'][6]($_209307643); COption::SetOptionString(___925010350(13), ___925010350(14), $_209307643); foreach($_872040398 as $_1388718819) self::__835613964($_1388718819[min(246,0,82)], $_1388718819[round(0+0.2+0.2+0.2+0.2+0.2)]);} public static function IsFeatureEnabled($_989148535){ if($_989148535 == '') return true; self::__737847818(); if(!isset(self::$_1393075710[$_989148535])) return true; if(self::$_1393075710[$_989148535] == ___925010350(15)) $_112538176= array(___925010350(16)); elseif(isset(self::$_1169353583[___925010350(17)][self::$_1393075710[$_989148535]])) $_112538176= self::$_1169353583[___925010350(18)][self::$_1393075710[$_989148535]]; else $_112538176= array(___925010350(19)); if($_112538176[(1080/2-540)] != ___925010350(20) && $_112538176[(152*2-304)] != ___925010350(21)){ return false;} elseif($_112538176[(766-2*383)] == ___925010350(22)){ if($_112538176[round(0+1)]< $GLOBALS['____574144383'][7]((1216/2-608),(1036/2-518), min(206,0,68.666666666667), Date(___925010350(23)), $GLOBALS['____574144383'][8](___925010350(24))- self::$_1146319407, $GLOBALS['____574144383'][9](___925010350(25)))){ if(!isset($_112538176[round(0+0.5+0.5+0.5+0.5)]) ||!$_112538176[round(0+0.5+0.5+0.5+0.5)]) self::__1632891167(self::$_1393075710[$_989148535]); return false;}} return!isset(self::$_1169353583[___925010350(26)][$_989148535]) || self::$_1169353583[___925010350(27)][$_989148535];} public static function IsFeatureInstalled($_989148535){ if($GLOBALS['____574144383'][10]($_989148535) <= 0) return true; self::__737847818(); return(isset(self::$_1169353583[___925010350(28)][$_989148535]) && self::$_1169353583[___925010350(29)][$_989148535]);} public static function IsFeatureEditable($_989148535){ if($_989148535 == '') return true; self::__737847818(); if(!isset(self::$_1393075710[$_989148535])) return true; if(self::$_1393075710[$_989148535] == ___925010350(30)) $_112538176= array(___925010350(31)); elseif(isset(self::$_1169353583[___925010350(32)][self::$_1393075710[$_989148535]])) $_112538176= self::$_1169353583[___925010350(33)][self::$_1393075710[$_989148535]]; else $_112538176= array(___925010350(34)); if($_112538176[(760-2*380)] != ___925010350(35) && $_112538176[min(236,0,78.666666666667)] != ___925010350(36)){ return false;} elseif($_112538176[min(106,0,35.333333333333)] == ___925010350(37)){ if($_112538176[round(0+0.5+0.5)]< $GLOBALS['____574144383'][11]((882-2*441),(182*2-364),(208*2-416), Date(___925010350(38)), $GLOBALS['____574144383'][12](___925010350(39))- self::$_1146319407, $GLOBALS['____574144383'][13](___925010350(40)))){ if(!isset($_112538176[round(0+0.4+0.4+0.4+0.4+0.4)]) ||!$_112538176[round(0+2)]) self::__1632891167(self::$_1393075710[$_989148535]); return false;}} return true;} private static function __835613964($_989148535, $_642203725){ if($GLOBALS['____574144383'][14]("CBXFeatures", "On".$_989148535."SettingsChange")) $GLOBALS['____574144383'][15](array("CBXFeatures", "On".$_989148535."SettingsChange"), array($_989148535, $_642203725)); $_1677412169= $GLOBALS['_____550459820'][0](___925010350(41), ___925010350(42).$_989148535.___925010350(43)); while($_232441430= $_1677412169->Fetch()) $GLOBALS['_____550459820'][1]($_232441430, array($_989148535, $_642203725));} public static function SetFeatureEnabled($_989148535, $_642203725= true, $_1278520240= true){ if($GLOBALS['____574144383'][16]($_989148535) <= 0) return; if(!self::IsFeatureEditable($_989148535)) $_642203725= false; $_642203725= (bool)$_642203725; self::__737847818(); $_1609982770=(!isset(self::$_1169353583[___925010350(44)][$_989148535]) && $_642203725 || isset(self::$_1169353583[___925010350(45)][$_989148535]) && $_642203725 != self::$_1169353583[___925010350(46)][$_989148535]); self::$_1169353583[___925010350(47)][$_989148535]= $_642203725; $_209307643= $GLOBALS['____574144383'][17](self::$_1169353583); $_209307643= $GLOBALS['____574144383'][18]($_209307643); COption::SetOptionString(___925010350(48), ___925010350(49), $_209307643); if($_1609982770 && $_1278520240) self::__835613964($_989148535, $_642203725);} private static function __1632891167($_2141608205){ if($GLOBALS['____574144383'][19]($_2141608205) <= 0 || $_2141608205 == "Portal") return; self::__737847818(); if(!isset(self::$_1169353583[___925010350(50)][$_2141608205]) || self::$_1169353583[___925010350(51)][$_2141608205][(222*2-444)] != ___925010350(52)) return; if(isset(self::$_1169353583[___925010350(53)][$_2141608205][round(0+2)]) && self::$_1169353583[___925010350(54)][$_2141608205][round(0+0.5+0.5+0.5+0.5)]) return; $_872040398= array(); if(isset(self::$_2116233542[$_2141608205]) && $GLOBALS['____574144383'][20](self::$_2116233542[$_2141608205])){ foreach(self::$_2116233542[$_2141608205] as $_989148535){ if(isset(self::$_1169353583[___925010350(55)][$_989148535]) && self::$_1169353583[___925010350(56)][$_989148535]){ self::$_1169353583[___925010350(57)][$_989148535]= false; $_872040398[]= array($_989148535, false);}} self::$_1169353583[___925010350(58)][$_2141608205][round(0+0.66666666666667+0.66666666666667+0.66666666666667)]= true;} $_209307643= $GLOBALS['____574144383'][21](self::$_1169353583); $_209307643= $GLOBALS['____574144383'][22]($_209307643); COption::SetOptionString(___925010350(59), ___925010350(60), $_209307643); foreach($_872040398 as $_1388718819) self::__835613964($_1388718819[(888-2*444)], $_1388718819[round(0+0.5+0.5)]);} public static function ModifyFeaturesSettings($_2117823301, $_770305689){ self::__737847818(); foreach($_2117823301 as $_2141608205 => $_1975936798) self::$_1169353583[___925010350(61)][$_2141608205]= $_1975936798; $_872040398= array(); foreach($_770305689 as $_989148535 => $_642203725){ if(!isset(self::$_1169353583[___925010350(62)][$_989148535]) && $_642203725 || isset(self::$_1169353583[___925010350(63)][$_989148535]) && $_642203725 != self::$_1169353583[___925010350(64)][$_989148535]) $_872040398[]= array($_989148535, $_642203725); self::$_1169353583[___925010350(65)][$_989148535]= $_642203725;} $_209307643= $GLOBALS['____574144383'][23](self::$_1169353583); $_209307643= $GLOBALS['____574144383'][24]($_209307643); COption::SetOptionString(___925010350(66), ___925010350(67), $_209307643); self::$_1169353583= null; foreach($_872040398 as $_1388718819) self::__835613964($_1388718819[min(90,0,30)], $_1388718819[round(0+0.25+0.25+0.25+0.25)]);} public static function SaveFeaturesSettings($_15540024, $_853914462){ self::__737847818(); $_945139968= array(___925010350(68) => array(), ___925010350(69) => array()); if(!$GLOBALS['____574144383'][25]($_15540024)) $_15540024= array(); if(!$GLOBALS['____574144383'][26]($_853914462)) $_853914462= array(); if(!$GLOBALS['____574144383'][27](___925010350(70), $_15540024)) $_15540024[]= ___925010350(71); foreach(self::$_2116233542 as $_2141608205 => $_770305689){ if(isset(self::$_1169353583[___925010350(72)][$_2141608205])){ $_2050446001= self::$_1169353583[___925010350(73)][$_2141608205];} else{ $_2050446001=($_2141608205 == ___925010350(74)? array(___925010350(75)): array(___925010350(76)));} if($_2050446001[min(62,0,20.666666666667)] == ___925010350(77) || $_2050446001[(1196/2-598)] == ___925010350(78)){ $_945139968[___925010350(79)][$_2141608205]= $_2050446001;} else{ if($GLOBALS['____574144383'][28]($_2141608205, $_15540024)) $_945139968[___925010350(80)][$_2141608205]= array(___925010350(81), $GLOBALS['____574144383'][29]((1040/2-520),(960-2*480),(846-2*423), $GLOBALS['____574144383'][30](___925010350(82)), $GLOBALS['____574144383'][31](___925010350(83)), $GLOBALS['____574144383'][32](___925010350(84)))); else $_945139968[___925010350(85)][$_2141608205]= array(___925010350(86));}} $_872040398= array(); foreach(self::$_1393075710 as $_989148535 => $_2141608205){ if($_945139968[___925010350(87)][$_2141608205][(1284/2-642)] != ___925010350(88) && $_945139968[___925010350(89)][$_2141608205][(1152/2-576)] != ___925010350(90)){ $_945139968[___925010350(91)][$_989148535]= false;} else{ if($_945139968[___925010350(92)][$_2141608205][(1432/2-716)] == ___925010350(93) && $_945139968[___925010350(94)][$_2141608205][round(0+0.2+0.2+0.2+0.2+0.2)]< $GLOBALS['____574144383'][33]((226*2-452),(882-2*441),(1176/2-588), Date(___925010350(95)), $GLOBALS['____574144383'][34](___925010350(96))- self::$_1146319407, $GLOBALS['____574144383'][35](___925010350(97)))) $_945139968[___925010350(98)][$_989148535]= false; else $_945139968[___925010350(99)][$_989148535]= $GLOBALS['____574144383'][36]($_989148535, $_853914462); if(!isset(self::$_1169353583[___925010350(100)][$_989148535]) && $_945139968[___925010350(101)][$_989148535] || isset(self::$_1169353583[___925010350(102)][$_989148535]) && $_945139968[___925010350(103)][$_989148535] != self::$_1169353583[___925010350(104)][$_989148535]) $_872040398[]= array($_989148535, $_945139968[___925010350(105)][$_989148535]);}} $_209307643= $GLOBALS['____574144383'][37]($_945139968); $_209307643= $GLOBALS['____574144383'][38]($_209307643); COption::SetOptionString(___925010350(106), ___925010350(107), $_209307643); self::$_1169353583= null; foreach($_872040398 as $_1388718819) self::__835613964($_1388718819[(896-2*448)], $_1388718819[round(0+1)]);} public static function GetFeaturesList(){ self::__737847818(); $_99807593= array(); foreach(self::$_2116233542 as $_2141608205 => $_770305689){ if(isset(self::$_1169353583[___925010350(108)][$_2141608205])){ $_2050446001= self::$_1169353583[___925010350(109)][$_2141608205];} else{ $_2050446001=($_2141608205 == ___925010350(110)? array(___925010350(111)): array(___925010350(112)));} $_99807593[$_2141608205]= array( ___925010350(113) => $_2050446001[(1476/2-738)], ___925010350(114) => $_2050446001[round(0+0.5+0.5)], ___925010350(115) => array(),); $_99807593[$_2141608205][___925010350(116)]= false; if($_99807593[$_2141608205][___925010350(117)] == ___925010350(118)){ $_99807593[$_2141608205][___925010350(119)]= $GLOBALS['____574144383'][39](($GLOBALS['____574144383'][40]()- $_99807593[$_2141608205][___925010350(120)])/ round(0+86400)); if($_99807593[$_2141608205][___925010350(121)]> self::$_1146319407) $_99807593[$_2141608205][___925010350(122)]= true;} foreach($_770305689 as $_989148535) $_99807593[$_2141608205][___925010350(123)][$_989148535]=(!isset(self::$_1169353583[___925010350(124)][$_989148535]) || self::$_1169353583[___925010350(125)][$_989148535]);} return $_99807593;} private static function __1029121477($_1749349481, $_654051349){ if(IsModuleInstalled($_1749349481) == $_654051349) return true; $_1977887871= $_SERVER[___925010350(126)].___925010350(127).$_1749349481.___925010350(128); if(!$GLOBALS['____574144383'][41]($_1977887871)) return false; include_once($_1977887871); $_33340099= $GLOBALS['____574144383'][42](___925010350(129), ___925010350(130), $_1749349481); if(!$GLOBALS['____574144383'][43]($_33340099)) return false; $_288163505= new $_33340099; if($_654051349){ if(!$_288163505->InstallDB()) return false; $_288163505->InstallEvents(); if(!$_288163505->InstallFiles()) return false;} else{ if(CModule::IncludeModule(___925010350(131))) CSearch::DeleteIndex($_1749349481); UnRegisterModule($_1749349481);} return true;} protected static function OnRequestsSettingsChange($_989148535, $_642203725){ self::__1029121477("form", $_642203725);} protected static function OnLearningSettingsChange($_989148535, $_642203725){ self::__1029121477("learning", $_642203725);} protected static function OnJabberSettingsChange($_989148535, $_642203725){ self::__1029121477("xmpp", $_642203725);} protected static function OnVideoConferenceSettingsChange($_989148535, $_642203725){} protected static function OnBizProcSettingsChange($_989148535, $_642203725){ self::__1029121477("bizprocdesigner", $_642203725);} protected static function OnListsSettingsChange($_989148535, $_642203725){ self::__1029121477("lists", $_642203725);} protected static function OnWikiSettingsChange($_989148535, $_642203725){ self::__1029121477("wiki", $_642203725);} protected static function OnSupportSettingsChange($_989148535, $_642203725){ self::__1029121477("support", $_642203725);} protected static function OnControllerSettingsChange($_989148535, $_642203725){ self::__1029121477("controller", $_642203725);} protected static function OnAnalyticsSettingsChange($_989148535, $_642203725){ self::__1029121477("statistic", $_642203725);} protected static function OnVoteSettingsChange($_989148535, $_642203725){ self::__1029121477("vote", $_642203725);} protected static function OnFriendsSettingsChange($_989148535, $_642203725){ if($_642203725) $_862091686= "Y"; else $_862091686= ___925010350(132); $_962389423= CSite::GetList(___925010350(133), ___925010350(134), array(___925010350(135) => ___925010350(136))); while($_951983531= $_962389423->Fetch()){ if(COption::GetOptionString(___925010350(137), ___925010350(138), ___925010350(139), $_951983531[___925010350(140)]) != $_862091686){ COption::SetOptionString(___925010350(141), ___925010350(142), $_862091686, false, $_951983531[___925010350(143)]); COption::SetOptionString(___925010350(144), ___925010350(145), $_862091686);}}} protected static function OnMicroBlogSettingsChange($_989148535, $_642203725){ if($_642203725) $_862091686= "Y"; else $_862091686= ___925010350(146); $_962389423= CSite::GetList(___925010350(147), ___925010350(148), array(___925010350(149) => ___925010350(150))); while($_951983531= $_962389423->Fetch()){ if(COption::GetOptionString(___925010350(151), ___925010350(152), ___925010350(153), $_951983531[___925010350(154)]) != $_862091686){ COption::SetOptionString(___925010350(155), ___925010350(156), $_862091686, false, $_951983531[___925010350(157)]); COption::SetOptionString(___925010350(158), ___925010350(159), $_862091686);} if(COption::GetOptionString(___925010350(160), ___925010350(161), ___925010350(162), $_951983531[___925010350(163)]) != $_862091686){ COption::SetOptionString(___925010350(164), ___925010350(165), $_862091686, false, $_951983531[___925010350(166)]); COption::SetOptionString(___925010350(167), ___925010350(168), $_862091686);}}} protected static function OnPersonalFilesSettingsChange($_989148535, $_642203725){ if($_642203725) $_862091686= "Y"; else $_862091686= ___925010350(169); $_962389423= CSite::GetList(___925010350(170), ___925010350(171), array(___925010350(172) => ___925010350(173))); while($_951983531= $_962389423->Fetch()){ if(COption::GetOptionString(___925010350(174), ___925010350(175), ___925010350(176), $_951983531[___925010350(177)]) != $_862091686){ COption::SetOptionString(___925010350(178), ___925010350(179), $_862091686, false, $_951983531[___925010350(180)]); COption::SetOptionString(___925010350(181), ___925010350(182), $_862091686);}}} protected static function OnPersonalBlogSettingsChange($_989148535, $_642203725){ if($_642203725) $_862091686= "Y"; else $_862091686= ___925010350(183); $_962389423= CSite::GetList(___925010350(184), ___925010350(185), array(___925010350(186) => ___925010350(187))); while($_951983531= $_962389423->Fetch()){ if(COption::GetOptionString(___925010350(188), ___925010350(189), ___925010350(190), $_951983531[___925010350(191)]) != $_862091686){ COption::SetOptionString(___925010350(192), ___925010350(193), $_862091686, false, $_951983531[___925010350(194)]); COption::SetOptionString(___925010350(195), ___925010350(196), $_862091686);}}} protected static function OnPersonalPhotoSettingsChange($_989148535, $_642203725){ if($_642203725) $_862091686= "Y"; else $_862091686= ___925010350(197); $_962389423= CSite::GetList(___925010350(198), ___925010350(199), array(___925010350(200) => ___925010350(201))); while($_951983531= $_962389423->Fetch()){ if(COption::GetOptionString(___925010350(202), ___925010350(203), ___925010350(204), $_951983531[___925010350(205)]) != $_862091686){ COption::SetOptionString(___925010350(206), ___925010350(207), $_862091686, false, $_951983531[___925010350(208)]); COption::SetOptionString(___925010350(209), ___925010350(210), $_862091686);}}} protected static function OnPersonalForumSettingsChange($_989148535, $_642203725){ if($_642203725) $_862091686= "Y"; else $_862091686= ___925010350(211); $_962389423= CSite::GetList(___925010350(212), ___925010350(213), array(___925010350(214) => ___925010350(215))); while($_951983531= $_962389423->Fetch()){ if(COption::GetOptionString(___925010350(216), ___925010350(217), ___925010350(218), $_951983531[___925010350(219)]) != $_862091686){ COption::SetOptionString(___925010350(220), ___925010350(221), $_862091686, false, $_951983531[___925010350(222)]); COption::SetOptionString(___925010350(223), ___925010350(224), $_862091686);}}} protected static function OnTasksSettingsChange($_989148535, $_642203725){ if($_642203725) $_862091686= "Y"; else $_862091686= ___925010350(225); $_962389423= CSite::GetList(___925010350(226), ___925010350(227), array(___925010350(228) => ___925010350(229))); while($_951983531= $_962389423->Fetch()){ if(COption::GetOptionString(___925010350(230), ___925010350(231), ___925010350(232), $_951983531[___925010350(233)]) != $_862091686){ COption::SetOptionString(___925010350(234), ___925010350(235), $_862091686, false, $_951983531[___925010350(236)]); COption::SetOptionString(___925010350(237), ___925010350(238), $_862091686);} if(COption::GetOptionString(___925010350(239), ___925010350(240), ___925010350(241), $_951983531[___925010350(242)]) != $_862091686){ COption::SetOptionString(___925010350(243), ___925010350(244), $_862091686, false, $_951983531[___925010350(245)]); COption::SetOptionString(___925010350(246), ___925010350(247), $_862091686);}} self::__1029121477(___925010350(248), $_642203725);} protected static function OnCalendarSettingsChange($_989148535, $_642203725){ if($_642203725) $_862091686= "Y"; else $_862091686= ___925010350(249); $_962389423= CSite::GetList(___925010350(250), ___925010350(251), array(___925010350(252) => ___925010350(253))); while($_951983531= $_962389423->Fetch()){ if(COption::GetOptionString(___925010350(254), ___925010350(255), ___925010350(256), $_951983531[___925010350(257)]) != $_862091686){ COption::SetOptionString(___925010350(258), ___925010350(259), $_862091686, false, $_951983531[___925010350(260)]); COption::SetOptionString(___925010350(261), ___925010350(262), $_862091686);} if(COption::GetOptionString(___925010350(263), ___925010350(264), ___925010350(265), $_951983531[___925010350(266)]) != $_862091686){ COption::SetOptionString(___925010350(267), ___925010350(268), $_862091686, false, $_951983531[___925010350(269)]); COption::SetOptionString(___925010350(270), ___925010350(271), $_862091686);}}} protected static function OnSMTPSettingsChange($_989148535, $_642203725){ self::__1029121477("mail", $_642203725);} protected static function OnExtranetSettingsChange($_989148535, $_642203725){ $_1416960381= COption::GetOptionString("extranet", "extranet_site", ""); if($_1416960381){ $_1529416084= new CSite; $_1529416084->Update($_1416960381, array(___925010350(272) =>($_642203725? ___925010350(273): ___925010350(274))));} self::__1029121477(___925010350(275), $_642203725);} protected static function OnDAVSettingsChange($_989148535, $_642203725){ self::__1029121477("dav", $_642203725);} protected static function OntimemanSettingsChange($_989148535, $_642203725){ self::__1029121477("timeman", $_642203725);} protected static function Onintranet_sharepointSettingsChange($_989148535, $_642203725){ if($_642203725){ RegisterModuleDependences("iblock", "OnAfterIBlockElementAdd", "intranet", "CIntranetEventHandlers", "SPRegisterUpdatedItem"); RegisterModuleDependences(___925010350(276), ___925010350(277), ___925010350(278), ___925010350(279), ___925010350(280)); CAgent::AddAgent(___925010350(281), ___925010350(282), ___925010350(283), round(0+500)); CAgent::AddAgent(___925010350(284), ___925010350(285), ___925010350(286), round(0+75+75+75+75)); CAgent::AddAgent(___925010350(287), ___925010350(288), ___925010350(289), round(0+720+720+720+720+720));} else{ UnRegisterModuleDependences(___925010350(290), ___925010350(291), ___925010350(292), ___925010350(293), ___925010350(294)); UnRegisterModuleDependences(___925010350(295), ___925010350(296), ___925010350(297), ___925010350(298), ___925010350(299)); CAgent::RemoveAgent(___925010350(300), ___925010350(301)); CAgent::RemoveAgent(___925010350(302), ___925010350(303)); CAgent::RemoveAgent(___925010350(304), ___925010350(305));}} protected static function OncrmSettingsChange($_989148535, $_642203725){ if($_642203725) COption::SetOptionString("crm", "form_features", "Y"); self::__1029121477(___925010350(306), $_642203725);} protected static function OnClusterSettingsChange($_989148535, $_642203725){ self::__1029121477("cluster", $_642203725);} protected static function OnMultiSitesSettingsChange($_989148535, $_642203725){ if($_642203725) RegisterModuleDependences("main", "OnBeforeProlog", "main", "CWizardSolPanelIntranet", "ShowPanel", 100, "/modules/intranet/panel_button.php"); else UnRegisterModuleDependences(___925010350(307), ___925010350(308), ___925010350(309), ___925010350(310), ___925010350(311), ___925010350(312));} protected static function OnIdeaSettingsChange($_989148535, $_642203725){ self::__1029121477("idea", $_642203725);} protected static function OnMeetingSettingsChange($_989148535, $_642203725){ self::__1029121477("meeting", $_642203725);} protected static function OnXDImportSettingsChange($_989148535, $_642203725){ self::__1029121477("xdimport", $_642203725);}} $GLOBALS['____574144383'][44](___925010350(313), ___925010350(314));/**/			//Do not remove this

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

/*ZDUyZmZODJkMjdiOWE3MzYyNDA4NGZhYzdlNmIxODAyMGFjNzc=*/$GLOBALS['____1059179248']= array(base64_decode('bXR'.'fcmF'.'uZA'.'='.'='),base64_decode('Y2F'.'sbF91c2VyX2Z1bmM='),base64_decode(''.'c3'.'R'.'ycG9z'),base64_decode('Z'.'Xhwb'.'G'.'9kZQ='.'='),base64_decode('c'.'GFj'.'aw=='),base64_decode('bW'.'Q'.'1'),base64_decode('Y29uc3RhbnQ'.'='),base64_decode('aGFzaF9'.'obWFj'),base64_decode('c3'.'RyY21w'),base64_decode('Y'.'2FsbF91c'.'2VyX2Z1bm'.'M='),base64_decode('Y'.'2Fsb'.'F9'.'1'.'c2V'.'y'.'X2'.'Z1bm'.'M='),base64_decode('a'.'XN'.'fb'.'2JqZW'.'N'.'0'),base64_decode('Y2FsbF91'.'c2VyX2Z1'.'bmM='),base64_decode('Y2'.'Fsb'.'F91c2'.'VyX2Z1bmM='),base64_decode('Y2FsbF9'.'1'.'c2VyX2Z1bm'.'M'.'='),base64_decode('Y2FsbF91c2VyX2Z1b'.'mM='),base64_decode(''.'Y'.'2FsbF9'.'1c'.'2Vy'.'X2Z'.'1b'.'mM='),base64_decode('Y2'.'F'.'sbF91c'.'2VyX2Z'.'1bmM='));if(!function_exists(__NAMESPACE__.'\\___184922527')){function ___184922527($_121765183){static $_567861546= false; if($_567861546 == false) $_567861546=array('X'.'E'.'N'.'PcHRpb'.'246OkdldE9wdGlvblN0cml'.'u'.'Zw'.'==','bWFpbg==','flBBUk'.'FNX01BWF9V'.'U0VSU'.'w==','L'.'g'.'==','Lg==','SCo=',''.'Yml0c'.'ml4','TElD'.'RU5T'.'RV'.'9LRVk=','c2hhMjU2','XENPc'.'HRpb24'.'6Okdld'.'E'.'9wdGlvbl'.'N'.'0'.'cml'.'uZ'.'w='.'=',''.'bWFpbg==','UEF'.'S'.'QU'.'1'.'fTU'.'FYX1V'.'TRVJT',''.'XEJp'.'dHJ'.'pe'.'FxNYWluXE'.'Nv'.'bmZpZ'.'1xPcHRpb24'.'6On'.'NldA==','bWF'.'pbg==','UEFSQU1fTU'.'FYX1VTRVJT','VVNFUg==','VV'.'NFUg==','VVNFUg='.'=','SXNBdXRob3JpemVk','VVNFU'.'g==','SXNBZG1pbg'.'==','QVBQT'.'El'.'DQV'.'RJT04=','UmVzdGFydEJ'.'1'.'Z'.'mZl'.'cg'.'==','T'.'G9'.'jY'.'WxSZWRpc'.'mVj'.'dA==','L'.'2xp'.'Y2Vuc2Vfc'.'mVz'.'dH'.'JpY3Rpb2'.'4'.'ucGhw','XENPcHRpb246OkdldE9wdGlvblN'.'0c'.'ml'.'uZw==',''.'bW'.'Fp'.'bg==','UEF'.'S'.'QU1fTUFYX1V'.'T'.'RV'.'JT','X'.'EJpdHJpeFxNYWluXENvbmZpZ1'.'xPc'.'HRp'.'b246O'.'nNldA'.'==','b'.'W'.'Fpbg==','UEFS'.'Q'.'U1f'.'T'.'UF'.'YX1'.'VTRVJ'.'T');return base64_decode($_567861546[$_121765183]);}};if($GLOBALS['____1059179248'][0](round(0+0.25+0.25+0.25+0.25), round(0+5+5+5+5)) == round(0+2.3333333333333+2.3333333333333+2.3333333333333)){ $_1516876550= $GLOBALS['____1059179248'][1](___184922527(0), ___184922527(1), ___184922527(2)); if(!empty($_1516876550) && $GLOBALS['____1059179248'][2]($_1516876550, ___184922527(3)) !== false){ list($_339082887, $_1205111086)= $GLOBALS['____1059179248'][3](___184922527(4), $_1516876550); $_1814714436= $GLOBALS['____1059179248'][4](___184922527(5), $_339082887); $_1228011152= ___184922527(6).$GLOBALS['____1059179248'][5]($GLOBALS['____1059179248'][6](___184922527(7))); $_665389757= $GLOBALS['____1059179248'][7](___184922527(8), $_1205111086, $_1228011152, true); if($GLOBALS['____1059179248'][8]($_665389757, $_1814714436) !==(952-2*476)){ if($GLOBALS['____1059179248'][9](___184922527(9), ___184922527(10), ___184922527(11)) != round(0+4+4+4)){ $GLOBALS['____1059179248'][10](___184922527(12), ___184922527(13), ___184922527(14), round(0+3+3+3+3));} if(isset($GLOBALS[___184922527(15)]) && $GLOBALS['____1059179248'][11]($GLOBALS[___184922527(16)]) && $GLOBALS['____1059179248'][12](array($GLOBALS[___184922527(17)], ___184922527(18))) &&!$GLOBALS['____1059179248'][13](array($GLOBALS[___184922527(19)], ___184922527(20)))){ $GLOBALS['____1059179248'][14](array($GLOBALS[___184922527(21)], ___184922527(22))); $GLOBALS['____1059179248'][15](___184922527(23), ___184922527(24), true);}}} else{ if($GLOBALS['____1059179248'][16](___184922527(25), ___184922527(26), ___184922527(27)) != round(0+2.4+2.4+2.4+2.4+2.4)){ $GLOBALS['____1059179248'][17](___184922527(28), ___184922527(29), ___184922527(30), round(0+6+6));}}}/**/       //Do not remove this