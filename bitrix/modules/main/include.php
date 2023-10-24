<?php

/**
 * Bitrix Framework
 * @package bitrix
 * @subpackage main
 * @copyright 2001-2023 Bitrix
 */

use Bitrix\Main;
use Bitrix\Main\Session\Legacy\HealerEarlySessionStart;

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

if (class_exists('\Dev\Main\Migrator\ModuleUpdater'))
{
	\Dev\Main\Migrator\ModuleUpdater::checkUpdates('main', __DIR__);
}

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

if (!defined("BX_COMP_MANAGED_CACHE") && COption::GetOptionString("main", "component_managed_cache_on", "Y") <> "N")
{
	define("BX_COMP_MANAGED_CACHE", true);
}

// global functions
require_once(__DIR__."/filter_tools.php");

/*ZDUyZmZNDBlYzUyMjk3MTMxNzJiMmZlNzcwMmMwZWFlNGIxYjQ=*/$GLOBALS['_____1528811597']= array(base64_decode(''.'R2V0TW'.'9k'.'dWxlRX'.'Zl'.'b'.'nRz'),base64_decode(''.'RXh'.'lY3V0Z'.'U1'.'vZHVs'.'ZU'.'V2ZW50RXg='));$GLOBALS['____577777957']= array(base64_decode('ZGVm'.'aW5l'),base64_decode('YmFzZTY0X2'.'RlY'.'2'.'9kZQ=='),base64_decode('dW5zZ'.'XJpYWx'.'pem'.'U='),base64_decode('aXNfYXJyY'.'X'.'k='),base64_decode(''.'aW'.'5fY'.'XJyYXk='),base64_decode('c2V'.'y'.'aWFsaXpl'),base64_decode('YmFzZ'.'TY0X'.'2Vu'.'Y29kZQ='.'='),base64_decode('bWt'.'0a'.'W'.'1l'),base64_decode('ZGF'.'0'.'ZQ=='),base64_decode('ZG'.'F'.'0ZQ=='),base64_decode(''.'c3Ryb'.'G'.'V'.'u'),base64_decode('bWt0aW'.'1'.'l'),base64_decode('ZG'.'F0Z'.'Q=='),base64_decode('ZGF0ZQ'.'=='),base64_decode('b'.'WV0aG9kX2V4aXN0cw'.'=='),base64_decode('Y2F'.'sb'.'F91c2VyX'.'2'.'Z'.'1bmNf'.'YX'.'Jy'.'YXk='),base64_decode(''.'c3Ry'.'b'.'GV'.'u'),base64_decode('c2V'.'yaWF'.'saXpl'),base64_decode(''.'YmFzZTY'.'0X2VuY29'.'kZ'.'Q'.'=='),base64_decode('c3RybGVu'),base64_decode(''.'aXNfYXJyYXk='),base64_decode('c2Vya'.'W'.'FsaXpl'),base64_decode('YmFzZTY0X2V'.'uY29kZQ=='),base64_decode('c2Vya'.'WFs'.'aXpl'),base64_decode('Ym'.'F'.'zZTY0X2VuY2'.'9kZQ=='),base64_decode('aXNf'.'YXJyYXk='),base64_decode('aXN'.'f'.'Y'.'XJ'.'yY'.'Xk='),base64_decode('aW5fYXJyYX'.'k='),base64_decode(''.'a'.'W5fYXJyYXk='),base64_decode('bWt0aW1l'),base64_decode('Z'.'GF'.'0Z'.'Q=='),base64_decode('ZGF'.'0ZQ'.'=='),base64_decode(''.'ZGF0'.'ZQ'.'='.'='),base64_decode('bWt'.'0'.'aW1l'),base64_decode('ZGF0ZQ'.'=='),base64_decode('ZGF0'.'ZQ=='),base64_decode(''.'aW5'.'fYXJ'.'yYXk='),base64_decode('c2'.'Vya'.'WFsaXpl'),base64_decode('Y'.'mF'.'z'.'Z'.'TY0'.'X'.'2VuY29kZ'.'Q=='),base64_decode('aW50d'.'mF'.'s'),base64_decode('dGltZQ'.'=='),base64_decode('Zm'.'lsZ'.'V9leGlzd'.'HM='),base64_decode('c3RyX3'.'JlcGxhY'.'2'.'U='),base64_decode('Y2xhc3NfZXhpc'.'3Rz'),base64_decode('ZGV'.'maW5l'));if(!function_exists(__NAMESPACE__.'\\___1097463118')){function ___1097463118($_1488011204){static $_1200977847= false; if($_1200977847 == false) $_1200977847=array(''.'SU'.'5UUkFOR'.'VRfR'.'U'.'R'.'J'.'VElPTg='.'=','WQ='.'=','bWFpbg==','fmNwZl9'.'t'.'YXB'.'f'.'dmF'.'s'.'dWU=','','',''.'YWxsb3'.'dlZF9jbGFz'.'c2Vz','ZQ==','Zg'.'==','ZQ'.'==',''.'Rg==',''.'WA'.'==','Zg==',''.'bWFp'.'bg='.'=','fmNwZl'.'9tY'.'XBf'.'d'.'mFsdWU=','UG9ydG'.'Fs','Rg==','Z'.'Q==','ZQ==','WA'.'==','Rg==','RA==','RA'.'==','bQ'.'==','ZA==','WQ==','Zg==','Z'.'g==','Zg==','Zg==',''.'UG9'.'ydG'.'F'.'s','Rg==','Z'.'Q==','ZQ==','W'.'A==','R'.'g'.'==','RA==','R'.'A='.'=',''.'b'.'Q==','Z'.'A==','WQ==',''.'bWFp'.'bg==',''.'T'.'24=','U2V0'.'dGluZ'.'3NDaGF'.'uZ'.'2U=','Zg==',''.'Zg==','Z'.'g==','Zg='.'=','bWFp'.'bg==','fm'.'NwZl9tYX'.'Bfd'.'mFsdW'.'U=','ZQ'.'==','ZQ==',''.'R'.'A==','Z'.'Q==','ZQ'.'==','Z'.'g==','Zg==','Zg==','ZQ==','bWFpbg'.'==','fmNwZl9t'.'YX'.'Bfd'.'mFsdW'.'U=','ZQ==','Zg'.'==','Zg==','Zg==',''.'Zg==','b'.'W'.'Fpbg==','fm'.'Nw'.'Zl9tYXBfd'.'mF'.'sdWU=','Z'.'Q='.'=','Zg'.'==','UG9'.'yd'.'GFs',''.'UG'.'9'.'ydGFs',''.'Z'.'Q==','ZQ='.'=','UG9y'.'dGFs','R'.'g='.'=','WA='.'=','Rg==','RA==','ZQ==','Z'.'Q==','R'.'A'.'==','bQ'.'==','ZA'.'==','W'.'Q==','ZQ==','W'.'A==','ZQ='.'=','Rg==','ZQ'.'==','RA==','Z'.'g='.'=','ZQ==',''.'RA='.'=',''.'Z'.'Q==',''.'b'.'Q==','ZA==','WQ==','Z'.'g==',''.'Zg='.'=','Zg'.'='.'=','Zg==','Zg==','Zg='.'=','Zg==','Zg==',''.'b'.'WFpbg='.'=','f'.'mNw'.'Z'.'l9tYXBfdmFs'.'dW'.'U'.'=','ZQ==','Z'.'Q==','UG9'.'ydGFs','Rg==','WA='.'=','V'.'FlQRQ==','REFURQ==','RkVBVFVSRVM=','RV'.'hQS'.'VJ'.'FRA==','VFlQRQ==','RA==',''.'V'.'FJZX0R'.'BWVNfQ'.'09VTlQ=',''.'REFU'.'RQ==',''.'VF'.'JZX0RBWVNf'.'Q0'.'9'.'V'.'TlQ=','RVhQSVJFRA==','RkVBVFVSRVM=','Zg==',''.'Zg==','RE'.'9'.'DVU'.'1FTlRfU'.'k'.'9P'.'V'.'A==',''.'L2JpdH'.'JpeC9'.'tb2R1bGVzLw'.'==','L2luc'.'3Rh'.'bG'.'wvaW5kZXgu'.'c'.'Ghw','Lg==','Xw='.'=','c2Vh'.'cmNo','T'.'g==','','','QU'.'NUSVZF','WQ'.'==','c29jaWFs'.'b'.'mV0d29yaw'.'==','YWxs'.'b3df'.'ZnJ'.'pZWxk'.'cw='.'=','WQ==','SUQ=','c29j'.'a'.'WFsbm'.'V0d2'.'9ya'.'w==',''.'YW'.'xsb3df'.'Z'.'nJpZ'.'Wxkcw==','SU'.'Q=','c'.'29jaW'.'FsbmV0d2'.'9yaw==','YWxsb3dfZ'.'nJ'.'p'.'Z'.'Wxkcw==','Tg==','','','QUNUSVZF','WQ==','c29jaWFsbmV0'.'d29yaw'.'==','YW'.'x'.'sb3'.'dfbWljcm9'.'ibG9nX3Vz'.'ZX'.'I=','W'.'Q==','S'.'UQ'.'=',''.'c'.'29j'.'aWFsbmV0d29ya'.'w==','YWxsb3'.'dfbW'.'ljcm9ibG9nX3V'.'zZX'.'I=','SU'.'Q=','c29jaW'.'Fsb'.'mV0d29yaw==','YWx'.'sb3dfb'.'Wlj'.'c'.'m9'.'ibG9n'.'X3V'.'zZX'.'I=','c2'.'9'.'j'.'a'.'WFsbmV0d29yaw='.'=','YWxsb3dfbW'.'ljc'.'m'.'9ibG9'.'nX2dyb'.'3Vw','WQ'.'==','S'.'UQ=','c29jaWFsbmV'.'0d29ya'.'w==','Y'.'W'.'x'.'sb3dfbWljcm'.'9i'.'b'.'G9'.'nX2dyb3Vw','SU'.'Q=',''.'c'.'29jaWF'.'sbmV0d29'.'ya'.'w==',''.'Y'.'W'.'xsb3dfbWljc'.'m9ib'.'G9n'.'X2dyb'.'3Vw','Tg'.'='.'=','','','QUNU'.'SVZF','WQ==','c2'.'9jaWF'.'sbm'.'V0d'.'29'.'yaw==','YWx'.'sb'.'3dfZmlsZ'.'XNf'.'dXNlcg==','WQ==',''.'S'.'UQ'.'=','c29jaWFs'.'bm'.'V0d29yaw==','YWx'.'sb3d'.'fZmlsZXNfdXNlcg==','SUQ=',''.'c29ja'.'WF'.'sbmV0d'.'29'.'y'.'aw==','YWxsb3df'.'Zmls'.'ZXNf'.'dXNlcg==','Tg'.'==','','',''.'QU'.'NUSVZ'.'F','W'.'Q'.'==','c29jaWF'.'sbmV0d29'.'yaw'.'==','YWxsb'.'3'.'d'.'fYmx'.'vZ191c2Vy','WQ==','SUQ=','c29j'.'aWFsbmV0d29yaw==','YWxs'.'b3d'.'fYmxvZ1'.'91'.'c2Vy','SUQ=','c29ja'.'W'.'Fs'.'bmV0d'.'29yaw='.'=','Y'.'W'.'xsb3dfYmx'.'vZ191c2Vy','Tg==','','',''.'QUNUSVZF','W'.'Q==',''.'c29ja'.'WFsbmV0d29'.'y'.'aw'.'==','YWxsb3dfcG'.'hvd'.'G9fdXNlc'.'g==','WQ='.'=','SUQ=','c29jaW'.'Fsbm'.'V'.'0'.'d29ya'.'w='.'=',''.'YWxsb'.'3dfc'.'Ghv'.'dG9fdX'.'Nlcg==','S'.'UQ=','c29'.'jaWFsbm'.'V'.'0d'.'29yaw==','Y'.'Wxsb'.'3dfc'.'GhvdG'.'9fdXN'.'lcg==','Tg==','','','Q'.'UNUS'.'VZF','WQ==','c29jaW'.'Fs'.'b'.'mV0d29ya'.'w==','YWxsb3dfZm9ydW'.'1fdXNlcg='.'=','WQ==','S'.'UQ=','c29'.'ja'.'WFsb'.'mV0d29y'.'aw==','YWxsb3df'.'Z'.'m'.'9ydW1f'.'dX'.'Nlcg==','SUQ=','c29jaWFsbmV0d2'.'9yaw==','YWx'.'sb3dfZm9yd'.'W1fdXNlc'.'g==',''.'Tg='.'=','','','QUNUSVZ'.'F','WQ==','c29'.'j'.'a'.'WFsbmV0d2'.'9y'.'aw==','YWxs'.'b3df'.'dGFza3NfdXNlc'.'g==','W'.'Q==',''.'SUQ=','c29jaW'.'FsbmV0d29y'.'aw==','Y'.'W'.'xs'.'b3dfdGFza3N'.'fdX'.'N'.'lcg==','SUQ=','c29'.'ja'.'WFsbmV0'.'d29yaw='.'=',''.'YWxsb3dfdGFz'.'a3'.'NfdXNlcg==',''.'c2'.'9ja'.'WFsbmV0d29yaw==','YWxsb3'.'df'.'dG'.'Fza3NfZ3'.'J'.'vdX'.'A=','WQ==','SUQ=',''.'c29jaWFs'.'bmV0d29'.'yaw==','YWx'.'sb3'.'df'.'dGFz'.'a3NfZ3'.'JvdXA=',''.'S'.'U'.'Q=',''.'c'.'2'.'9jaWFsbmV0d29'.'yaw='.'=','YWxsb3dfdGFza3N'.'fZ3JvdX'.'A=','dG'.'Fza3M=','Tg==','','','QUNU'.'SVZF','WQ==','c29'.'j'.'aWFsbm'.'V0d29'.'ya'.'w==','YWxsb3dfY2FsZW5kYX'.'Jf'.'dXNlcg==','WQ==',''.'SUQ=','c29jaWFs'.'bmV0d'.'2'.'9yaw='.'=','YWx'.'sb3df'.'Y2FsZW5kYXJfdXNlc'.'g==','SU'.'Q=',''.'c29jaWFsbmV0'.'d'.'29yaw==','YWx'.'sb'.'3dfY2FsZW5kY'.'XJfdXNlcg==','c29ja'.'W'.'Fsb'.'mV0d'.'29yaw==','YWxsb3dfY2FsZW5kYXJf'.'Z'.'3Jv'.'dXA=','WQ==','SUQ=','c'.'2'.'9'.'j'.'aW'.'FsbmV0d'.'29'.'yaw'.'==','YWxsb'.'3'.'dfY2FsZW5kYXJfZ3J'.'vdXA=',''.'SUQ=','c29'.'jaWFs'.'bmV0d29ya'.'w==','YWxsb3'.'dfY2'.'F'.'sZW5kY'.'XJfZ3Jvd'.'X'.'A=','QU'.'NU'.'S'.'VZF','W'.'Q==','Tg'.'==','ZX'.'h0cmF'.'uZX'.'Q=',''.'a'.'WJsb2Nr','T25BZnRlcklCbG9ja0V'.'sZW1lbnRVcG'.'R'.'hdGU=',''.'aW'.'50c'.'m'.'FuZXQ=','Q0ludHJhbmV0RXZlbnRIYW5'.'kbGVycw==','U1BS'.'ZWdpc3RlclVwZGF0ZWRJ'.'d'.'GV'.'t','Q0lud'.'HJh'.'bm'.'V0'.'U2hhcmVwb2lu'.'dDo6'.'QWd'.'lb'.'nRMaXN0cygpOw'.'==','aW50cmF'.'uZXQ=','Tg'.'==',''.'Q0'.'l'.'udHJhbmV'.'0'.'U2hhcm'.'Vwb'.'2lud'.'Do6Q'.'Wd'.'lb'.'nRR'.'dWV1Z'.'Sgp'.'Ow'.'==','aW5'.'0c'.'mFuZXQ=','Tg'.'='.'=','Q0l'.'udHJh'.'bm'.'V0U2hh'.'c'.'mVw'.'b2lud'.'Do6QWdl'.'b'.'nRVcGRh'.'dGUoKTs=',''.'aW50cmF'.'uZXQ=','Tg'.'==',''.'a'.'WJsb2N'.'r','T25BZnR'.'l'.'c'.'k'.'lCbG9ja0VsZ'.'W1l'.'bnR'.'BZGQ=','aW'.'50cmF'.'u'.'ZXQ=','Q0ludHJhbmV0RXZlb'.'nRI'.'YW5k'.'bGVycw==','U1BS'.'ZWdpc3Rlcl'.'VwZGF'.'0ZW'.'RJd'.'GVt','aWJsb2Nr',''.'T25BZ'.'nRlcklCbG9ja0Vs'.'Z'.'W1'.'lbn'.'RVcGRhdGU=','a'.'W50c'.'mFuZX'.'Q=','Q0l'.'ud'.'HJ'.'hbmV0R'.'XZlbnR'.'IY'.'W'.'5k'.'bGVycw==','U1BSZWdpc3Rl'.'c'.'l'.'VwZGF0'.'ZWRJd'.'GVt','Q'.'0lud'.'H'.'J'.'hb'.'mV0U'.'2hhcmVwb'.'2'.'lu'.'dDo6QWdl'.'bnRMaX'.'N0cygpOw'.'==','a'.'W5'.'0cmFuZX'.'Q=',''.'Q0ludHJh'.'b'.'mV0U'.'2hhcmV'.'w'.'b2ludDo'.'6'.'Q'.'Wdl'.'bnRRdWV'.'1Z'.'SgpOw='.'=',''.'aW50c'.'mFuZX'.'Q'.'=','Q0l'.'udH'.'JhbmV0U2'.'hhcmV'.'wb2ludDo6QWdlbnRVcGRhdGUoKTs=','aW'.'50c'.'mFu'.'ZX'.'Q=','Y3Jt','bWF'.'pb'.'g==','T'.'25CZW'.'Z'.'vcmVQcm9sb2c=','bWFp'.'bg'.'==',''.'Q1'.'d'.'pemF'.'yZFNvbFBhbmVsSW'.'50'.'cmFuZXQ'.'=','U2hvd1B'.'hbmVs','L21vZH'.'VsZXMv'.'aW50cm'.'F'.'uZXQvcGFu'.'Z'.'Wx'.'fY'.'nV0dG9'.'uLn'.'Boc'.'A==','RU5DT0RF',''.'WQ==');return base64_decode($_1200977847[$_1488011204]);}};$GLOBALS['____577777957'][0](___1097463118(0), ___1097463118(1));class CBXFeatures{ private static $_972570104= 30; private static $_1290165132= array( "Portal" => array( "CompanyCalendar", "CompanyPhoto", "CompanyVideo", "CompanyCareer", "StaffChanges", "StaffAbsence", "CommonDocuments", "MeetingRoomBookingSystem", "Wiki", "Learning", "Vote", "WebLink", "Subscribe", "Friends", "PersonalFiles", "PersonalBlog", "PersonalPhoto", "PersonalForum", "Blog", "Forum", "Gallery", "Board", "MicroBlog", "WebMessenger",), "Communications" => array( "Tasks", "Calendar", "Workgroups", "Jabber", "VideoConference", "Extranet", "SMTP", "Requests", "DAV", "intranet_sharepoint", "timeman", "Idea", "Meeting", "EventList", "Salary", "XDImport",), "Enterprise" => array( "BizProc", "Lists", "Support", "Analytics", "crm", "Controller", "LdapUnlimitedUsers",), "Holding" => array( "Cluster", "MultiSites",),); private static $_1983669136= null; private static $_123581324= null; private static function __558670781(){ if(self::$_1983669136 === null){ self::$_1983669136= array(); foreach(self::$_1290165132 as $_24426823 => $_1549719817){ foreach($_1549719817 as $_1354970373) self::$_1983669136[$_1354970373]= $_24426823;}} if(self::$_123581324 === null){ self::$_123581324= array(); $_994469104= COption::GetOptionString(___1097463118(2), ___1097463118(3), ___1097463118(4)); if($_994469104 != ___1097463118(5)){ $_994469104= $GLOBALS['____577777957'][1]($_994469104); $_994469104= $GLOBALS['____577777957'][2]($_994469104,[___1097463118(6) => false]); if($GLOBALS['____577777957'][3]($_994469104)){ self::$_123581324= $_994469104;}} if(empty(self::$_123581324)){ self::$_123581324= array(___1097463118(7) => array(), ___1097463118(8) => array());}}} public static function InitiateEditionsSettings($_1545401412){ self::__558670781(); $_968812609= array(); foreach(self::$_1290165132 as $_24426823 => $_1549719817){ $_924251534= $GLOBALS['____577777957'][4]($_24426823, $_1545401412); self::$_123581324[___1097463118(9)][$_24426823]=($_924251534? array(___1097463118(10)): array(___1097463118(11))); foreach($_1549719817 as $_1354970373){ self::$_123581324[___1097463118(12)][$_1354970373]= $_924251534; if(!$_924251534) $_968812609[]= array($_1354970373, false);}} $_593490470= $GLOBALS['____577777957'][5](self::$_123581324); $_593490470= $GLOBALS['____577777957'][6]($_593490470); COption::SetOptionString(___1097463118(13), ___1097463118(14), $_593490470); foreach($_968812609 as $_1258652917) self::__666487243($_1258652917[(906-2*453)], $_1258652917[round(0+0.5+0.5)]);} public static function IsFeatureEnabled($_1354970373){ if($_1354970373 == '') return true; self::__558670781(); if(!isset(self::$_1983669136[$_1354970373])) return true; if(self::$_1983669136[$_1354970373] == ___1097463118(15)) $_267705809= array(___1097463118(16)); elseif(isset(self::$_123581324[___1097463118(17)][self::$_1983669136[$_1354970373]])) $_267705809= self::$_123581324[___1097463118(18)][self::$_1983669136[$_1354970373]]; else $_267705809= array(___1097463118(19)); if($_267705809[(894-2*447)] != ___1097463118(20) && $_267705809[min(234,0,78)] != ___1097463118(21)){ return false;} elseif($_267705809[(1012/2-506)] == ___1097463118(22)){ if($_267705809[round(0+0.33333333333333+0.33333333333333+0.33333333333333)]< $GLOBALS['____577777957'][7]((860-2*430),(1344/2-672),(948-2*474), Date(___1097463118(23)), $GLOBALS['____577777957'][8](___1097463118(24))- self::$_972570104, $GLOBALS['____577777957'][9](___1097463118(25)))){ if(!isset($_267705809[round(0+0.4+0.4+0.4+0.4+0.4)]) ||!$_267705809[round(0+0.66666666666667+0.66666666666667+0.66666666666667)]) self::__418148409(self::$_1983669136[$_1354970373]); return false;}} return!isset(self::$_123581324[___1097463118(26)][$_1354970373]) || self::$_123581324[___1097463118(27)][$_1354970373];} public static function IsFeatureInstalled($_1354970373){ if($GLOBALS['____577777957'][10]($_1354970373) <= 0) return true; self::__558670781(); return(isset(self::$_123581324[___1097463118(28)][$_1354970373]) && self::$_123581324[___1097463118(29)][$_1354970373]);} public static function IsFeatureEditable($_1354970373){ if($_1354970373 == '') return true; self::__558670781(); if(!isset(self::$_1983669136[$_1354970373])) return true; if(self::$_1983669136[$_1354970373] == ___1097463118(30)) $_267705809= array(___1097463118(31)); elseif(isset(self::$_123581324[___1097463118(32)][self::$_1983669136[$_1354970373]])) $_267705809= self::$_123581324[___1097463118(33)][self::$_1983669136[$_1354970373]]; else $_267705809= array(___1097463118(34)); if($_267705809[(858-2*429)] != ___1097463118(35) && $_267705809[(183*2-366)] != ___1097463118(36)){ return false;} elseif($_267705809[(1084/2-542)] == ___1097463118(37)){ if($_267705809[round(0+0.5+0.5)]< $GLOBALS['____577777957'][11]((1028/2-514),(188*2-376),(1368/2-684), Date(___1097463118(38)), $GLOBALS['____577777957'][12](___1097463118(39))- self::$_972570104, $GLOBALS['____577777957'][13](___1097463118(40)))){ if(!isset($_267705809[round(0+0.66666666666667+0.66666666666667+0.66666666666667)]) ||!$_267705809[round(0+1+1)]) self::__418148409(self::$_1983669136[$_1354970373]); return false;}} return true;} private static function __666487243($_1354970373, $_297575965){ if($GLOBALS['____577777957'][14]("CBXFeatures", "On".$_1354970373."SettingsChange")) $GLOBALS['____577777957'][15](array("CBXFeatures", "On".$_1354970373."SettingsChange"), array($_1354970373, $_297575965)); $_1798904299= $GLOBALS['_____1528811597'][0](___1097463118(41), ___1097463118(42).$_1354970373.___1097463118(43)); while($_428697971= $_1798904299->Fetch()) $GLOBALS['_____1528811597'][1]($_428697971, array($_1354970373, $_297575965));} public static function SetFeatureEnabled($_1354970373, $_297575965= true, $_1883453908= true){ if($GLOBALS['____577777957'][16]($_1354970373) <= 0) return; if(!self::IsFeatureEditable($_1354970373)) $_297575965= false; $_297575965= (bool)$_297575965; self::__558670781(); $_1210789691=(!isset(self::$_123581324[___1097463118(44)][$_1354970373]) && $_297575965 || isset(self::$_123581324[___1097463118(45)][$_1354970373]) && $_297575965 != self::$_123581324[___1097463118(46)][$_1354970373]); self::$_123581324[___1097463118(47)][$_1354970373]= $_297575965; $_593490470= $GLOBALS['____577777957'][17](self::$_123581324); $_593490470= $GLOBALS['____577777957'][18]($_593490470); COption::SetOptionString(___1097463118(48), ___1097463118(49), $_593490470); if($_1210789691 && $_1883453908) self::__666487243($_1354970373, $_297575965);} private static function __418148409($_24426823){ if($GLOBALS['____577777957'][19]($_24426823) <= 0 || $_24426823 == "Portal") return; self::__558670781(); if(!isset(self::$_123581324[___1097463118(50)][$_24426823]) || self::$_123581324[___1097463118(51)][$_24426823][(836-2*418)] != ___1097463118(52)) return; if(isset(self::$_123581324[___1097463118(53)][$_24426823][round(0+1+1)]) && self::$_123581324[___1097463118(54)][$_24426823][round(0+1+1)]) return; $_968812609= array(); if(isset(self::$_1290165132[$_24426823]) && $GLOBALS['____577777957'][20](self::$_1290165132[$_24426823])){ foreach(self::$_1290165132[$_24426823] as $_1354970373){ if(isset(self::$_123581324[___1097463118(55)][$_1354970373]) && self::$_123581324[___1097463118(56)][$_1354970373]){ self::$_123581324[___1097463118(57)][$_1354970373]= false; $_968812609[]= array($_1354970373, false);}} self::$_123581324[___1097463118(58)][$_24426823][round(0+0.4+0.4+0.4+0.4+0.4)]= true;} $_593490470= $GLOBALS['____577777957'][21](self::$_123581324); $_593490470= $GLOBALS['____577777957'][22]($_593490470); COption::SetOptionString(___1097463118(59), ___1097463118(60), $_593490470); foreach($_968812609 as $_1258652917) self::__666487243($_1258652917[(762-2*381)], $_1258652917[round(0+0.5+0.5)]);} public static function ModifyFeaturesSettings($_1545401412, $_1549719817){ self::__558670781(); foreach($_1545401412 as $_24426823 => $_1837460683) self::$_123581324[___1097463118(61)][$_24426823]= $_1837460683; $_968812609= array(); foreach($_1549719817 as $_1354970373 => $_297575965){ if(!isset(self::$_123581324[___1097463118(62)][$_1354970373]) && $_297575965 || isset(self::$_123581324[___1097463118(63)][$_1354970373]) && $_297575965 != self::$_123581324[___1097463118(64)][$_1354970373]) $_968812609[]= array($_1354970373, $_297575965); self::$_123581324[___1097463118(65)][$_1354970373]= $_297575965;} $_593490470= $GLOBALS['____577777957'][23](self::$_123581324); $_593490470= $GLOBALS['____577777957'][24]($_593490470); COption::SetOptionString(___1097463118(66), ___1097463118(67), $_593490470); self::$_123581324= false; foreach($_968812609 as $_1258652917) self::__666487243($_1258652917[min(84,0,28)], $_1258652917[round(0+0.5+0.5)]);} public static function SaveFeaturesSettings($_1806661577, $_1015213115){ self::__558670781(); $_1411391950= array(___1097463118(68) => array(), ___1097463118(69) => array()); if(!$GLOBALS['____577777957'][25]($_1806661577)) $_1806661577= array(); if(!$GLOBALS['____577777957'][26]($_1015213115)) $_1015213115= array(); if(!$GLOBALS['____577777957'][27](___1097463118(70), $_1806661577)) $_1806661577[]= ___1097463118(71); foreach(self::$_1290165132 as $_24426823 => $_1549719817){ if(isset(self::$_123581324[___1097463118(72)][$_24426823])){ $_380551111= self::$_123581324[___1097463118(73)][$_24426823];} else{ $_380551111=($_24426823 == ___1097463118(74)? array(___1097463118(75)): array(___1097463118(76)));} if($_380551111[(154*2-308)] == ___1097463118(77) || $_380551111[(172*2-344)] == ___1097463118(78)){ $_1411391950[___1097463118(79)][$_24426823]= $_380551111;} else{ if($GLOBALS['____577777957'][28]($_24426823, $_1806661577)) $_1411391950[___1097463118(80)][$_24426823]= array(___1097463118(81), $GLOBALS['____577777957'][29]((249*2-498),(974-2*487),(768-2*384), $GLOBALS['____577777957'][30](___1097463118(82)), $GLOBALS['____577777957'][31](___1097463118(83)), $GLOBALS['____577777957'][32](___1097463118(84)))); else $_1411391950[___1097463118(85)][$_24426823]= array(___1097463118(86));}} $_968812609= array(); foreach(self::$_1983669136 as $_1354970373 => $_24426823){ if($_1411391950[___1097463118(87)][$_24426823][(187*2-374)] != ___1097463118(88) && $_1411391950[___1097463118(89)][$_24426823][(1012/2-506)] != ___1097463118(90)){ $_1411391950[___1097463118(91)][$_1354970373]= false;} else{ if($_1411391950[___1097463118(92)][$_24426823][(226*2-452)] == ___1097463118(93) && $_1411391950[___1097463118(94)][$_24426823][round(0+0.33333333333333+0.33333333333333+0.33333333333333)]< $GLOBALS['____577777957'][33]((884-2*442),(760-2*380),(854-2*427), Date(___1097463118(95)), $GLOBALS['____577777957'][34](___1097463118(96))- self::$_972570104, $GLOBALS['____577777957'][35](___1097463118(97)))) $_1411391950[___1097463118(98)][$_1354970373]= false; else $_1411391950[___1097463118(99)][$_1354970373]= $GLOBALS['____577777957'][36]($_1354970373, $_1015213115); if(!isset(self::$_123581324[___1097463118(100)][$_1354970373]) && $_1411391950[___1097463118(101)][$_1354970373] || isset(self::$_123581324[___1097463118(102)][$_1354970373]) && $_1411391950[___1097463118(103)][$_1354970373] != self::$_123581324[___1097463118(104)][$_1354970373]) $_968812609[]= array($_1354970373, $_1411391950[___1097463118(105)][$_1354970373]);}} $_593490470= $GLOBALS['____577777957'][37]($_1411391950); $_593490470= $GLOBALS['____577777957'][38]($_593490470); COption::SetOptionString(___1097463118(106), ___1097463118(107), $_593490470); self::$_123581324= false; foreach($_968812609 as $_1258652917) self::__666487243($_1258652917[min(6,0,2)], $_1258652917[round(0+0.2+0.2+0.2+0.2+0.2)]);} public static function GetFeaturesList(){ self::__558670781(); $_1679209149= array(); foreach(self::$_1290165132 as $_24426823 => $_1549719817){ if(isset(self::$_123581324[___1097463118(108)][$_24426823])){ $_380551111= self::$_123581324[___1097463118(109)][$_24426823];} else{ $_380551111=($_24426823 == ___1097463118(110)? array(___1097463118(111)): array(___1097463118(112)));} $_1679209149[$_24426823]= array( ___1097463118(113) => $_380551111[(202*2-404)], ___1097463118(114) => $_380551111[round(0+0.25+0.25+0.25+0.25)], ___1097463118(115) => array(),); $_1679209149[$_24426823][___1097463118(116)]= false; if($_1679209149[$_24426823][___1097463118(117)] == ___1097463118(118)){ $_1679209149[$_24426823][___1097463118(119)]= $GLOBALS['____577777957'][39](($GLOBALS['____577777957'][40]()- $_1679209149[$_24426823][___1097463118(120)])/ round(0+86400)); if($_1679209149[$_24426823][___1097463118(121)]> self::$_972570104) $_1679209149[$_24426823][___1097463118(122)]= true;} foreach($_1549719817 as $_1354970373) $_1679209149[$_24426823][___1097463118(123)][$_1354970373]=(!isset(self::$_123581324[___1097463118(124)][$_1354970373]) || self::$_123581324[___1097463118(125)][$_1354970373]);} return $_1679209149;} private static function __859860037($_433186509, $_66732730){ if(IsModuleInstalled($_433186509) == $_66732730) return true; $_268407514= $_SERVER[___1097463118(126)].___1097463118(127).$_433186509.___1097463118(128); if(!$GLOBALS['____577777957'][41]($_268407514)) return false; include_once($_268407514); $_1217678777= $GLOBALS['____577777957'][42](___1097463118(129), ___1097463118(130), $_433186509); if(!$GLOBALS['____577777957'][43]($_1217678777)) return false; $_948618584= new $_1217678777; if($_66732730){ if(!$_948618584->InstallDB()) return false; $_948618584->InstallEvents(); if(!$_948618584->InstallFiles()) return false;} else{ if(CModule::IncludeModule(___1097463118(131))) CSearch::DeleteIndex($_433186509); UnRegisterModule($_433186509);} return true;} protected static function OnRequestsSettingsChange($_1354970373, $_297575965){ self::__859860037("form", $_297575965);} protected static function OnLearningSettingsChange($_1354970373, $_297575965){ self::__859860037("learning", $_297575965);} protected static function OnJabberSettingsChange($_1354970373, $_297575965){ self::__859860037("xmpp", $_297575965);} protected static function OnVideoConferenceSettingsChange($_1354970373, $_297575965){ self::__859860037("video", $_297575965);} protected static function OnBizProcSettingsChange($_1354970373, $_297575965){ self::__859860037("bizprocdesigner", $_297575965);} protected static function OnListsSettingsChange($_1354970373, $_297575965){ self::__859860037("lists", $_297575965);} protected static function OnWikiSettingsChange($_1354970373, $_297575965){ self::__859860037("wiki", $_297575965);} protected static function OnSupportSettingsChange($_1354970373, $_297575965){ self::__859860037("support", $_297575965);} protected static function OnControllerSettingsChange($_1354970373, $_297575965){ self::__859860037("controller", $_297575965);} protected static function OnAnalyticsSettingsChange($_1354970373, $_297575965){ self::__859860037("statistic", $_297575965);} protected static function OnVoteSettingsChange($_1354970373, $_297575965){ self::__859860037("vote", $_297575965);} protected static function OnFriendsSettingsChange($_1354970373, $_297575965){ if($_297575965) $_239793338= "Y"; else $_239793338= ___1097463118(132); $_1890136856= CSite::GetList(___1097463118(133), ___1097463118(134), array(___1097463118(135) => ___1097463118(136))); while($_1583807984= $_1890136856->Fetch()){ if(COption::GetOptionString(___1097463118(137), ___1097463118(138), ___1097463118(139), $_1583807984[___1097463118(140)]) != $_239793338){ COption::SetOptionString(___1097463118(141), ___1097463118(142), $_239793338, false, $_1583807984[___1097463118(143)]); COption::SetOptionString(___1097463118(144), ___1097463118(145), $_239793338);}}} protected static function OnMicroBlogSettingsChange($_1354970373, $_297575965){ if($_297575965) $_239793338= "Y"; else $_239793338= ___1097463118(146); $_1890136856= CSite::GetList(___1097463118(147), ___1097463118(148), array(___1097463118(149) => ___1097463118(150))); while($_1583807984= $_1890136856->Fetch()){ if(COption::GetOptionString(___1097463118(151), ___1097463118(152), ___1097463118(153), $_1583807984[___1097463118(154)]) != $_239793338){ COption::SetOptionString(___1097463118(155), ___1097463118(156), $_239793338, false, $_1583807984[___1097463118(157)]); COption::SetOptionString(___1097463118(158), ___1097463118(159), $_239793338);} if(COption::GetOptionString(___1097463118(160), ___1097463118(161), ___1097463118(162), $_1583807984[___1097463118(163)]) != $_239793338){ COption::SetOptionString(___1097463118(164), ___1097463118(165), $_239793338, false, $_1583807984[___1097463118(166)]); COption::SetOptionString(___1097463118(167), ___1097463118(168), $_239793338);}}} protected static function OnPersonalFilesSettingsChange($_1354970373, $_297575965){ if($_297575965) $_239793338= "Y"; else $_239793338= ___1097463118(169); $_1890136856= CSite::GetList(___1097463118(170), ___1097463118(171), array(___1097463118(172) => ___1097463118(173))); while($_1583807984= $_1890136856->Fetch()){ if(COption::GetOptionString(___1097463118(174), ___1097463118(175), ___1097463118(176), $_1583807984[___1097463118(177)]) != $_239793338){ COption::SetOptionString(___1097463118(178), ___1097463118(179), $_239793338, false, $_1583807984[___1097463118(180)]); COption::SetOptionString(___1097463118(181), ___1097463118(182), $_239793338);}}} protected static function OnPersonalBlogSettingsChange($_1354970373, $_297575965){ if($_297575965) $_239793338= "Y"; else $_239793338= ___1097463118(183); $_1890136856= CSite::GetList(___1097463118(184), ___1097463118(185), array(___1097463118(186) => ___1097463118(187))); while($_1583807984= $_1890136856->Fetch()){ if(COption::GetOptionString(___1097463118(188), ___1097463118(189), ___1097463118(190), $_1583807984[___1097463118(191)]) != $_239793338){ COption::SetOptionString(___1097463118(192), ___1097463118(193), $_239793338, false, $_1583807984[___1097463118(194)]); COption::SetOptionString(___1097463118(195), ___1097463118(196), $_239793338);}}} protected static function OnPersonalPhotoSettingsChange($_1354970373, $_297575965){ if($_297575965) $_239793338= "Y"; else $_239793338= ___1097463118(197); $_1890136856= CSite::GetList(___1097463118(198), ___1097463118(199), array(___1097463118(200) => ___1097463118(201))); while($_1583807984= $_1890136856->Fetch()){ if(COption::GetOptionString(___1097463118(202), ___1097463118(203), ___1097463118(204), $_1583807984[___1097463118(205)]) != $_239793338){ COption::SetOptionString(___1097463118(206), ___1097463118(207), $_239793338, false, $_1583807984[___1097463118(208)]); COption::SetOptionString(___1097463118(209), ___1097463118(210), $_239793338);}}} protected static function OnPersonalForumSettingsChange($_1354970373, $_297575965){ if($_297575965) $_239793338= "Y"; else $_239793338= ___1097463118(211); $_1890136856= CSite::GetList(___1097463118(212), ___1097463118(213), array(___1097463118(214) => ___1097463118(215))); while($_1583807984= $_1890136856->Fetch()){ if(COption::GetOptionString(___1097463118(216), ___1097463118(217), ___1097463118(218), $_1583807984[___1097463118(219)]) != $_239793338){ COption::SetOptionString(___1097463118(220), ___1097463118(221), $_239793338, false, $_1583807984[___1097463118(222)]); COption::SetOptionString(___1097463118(223), ___1097463118(224), $_239793338);}}} protected static function OnTasksSettingsChange($_1354970373, $_297575965){ if($_297575965) $_239793338= "Y"; else $_239793338= ___1097463118(225); $_1890136856= CSite::GetList(___1097463118(226), ___1097463118(227), array(___1097463118(228) => ___1097463118(229))); while($_1583807984= $_1890136856->Fetch()){ if(COption::GetOptionString(___1097463118(230), ___1097463118(231), ___1097463118(232), $_1583807984[___1097463118(233)]) != $_239793338){ COption::SetOptionString(___1097463118(234), ___1097463118(235), $_239793338, false, $_1583807984[___1097463118(236)]); COption::SetOptionString(___1097463118(237), ___1097463118(238), $_239793338);} if(COption::GetOptionString(___1097463118(239), ___1097463118(240), ___1097463118(241), $_1583807984[___1097463118(242)]) != $_239793338){ COption::SetOptionString(___1097463118(243), ___1097463118(244), $_239793338, false, $_1583807984[___1097463118(245)]); COption::SetOptionString(___1097463118(246), ___1097463118(247), $_239793338);}} self::__859860037(___1097463118(248), $_297575965);} protected static function OnCalendarSettingsChange($_1354970373, $_297575965){ if($_297575965) $_239793338= "Y"; else $_239793338= ___1097463118(249); $_1890136856= CSite::GetList(___1097463118(250), ___1097463118(251), array(___1097463118(252) => ___1097463118(253))); while($_1583807984= $_1890136856->Fetch()){ if(COption::GetOptionString(___1097463118(254), ___1097463118(255), ___1097463118(256), $_1583807984[___1097463118(257)]) != $_239793338){ COption::SetOptionString(___1097463118(258), ___1097463118(259), $_239793338, false, $_1583807984[___1097463118(260)]); COption::SetOptionString(___1097463118(261), ___1097463118(262), $_239793338);} if(COption::GetOptionString(___1097463118(263), ___1097463118(264), ___1097463118(265), $_1583807984[___1097463118(266)]) != $_239793338){ COption::SetOptionString(___1097463118(267), ___1097463118(268), $_239793338, false, $_1583807984[___1097463118(269)]); COption::SetOptionString(___1097463118(270), ___1097463118(271), $_239793338);}}} protected static function OnSMTPSettingsChange($_1354970373, $_297575965){ self::__859860037("mail", $_297575965);} protected static function OnExtranetSettingsChange($_1354970373, $_297575965){ $_40176252= COption::GetOptionString("extranet", "extranet_site", ""); if($_40176252){ $_248473197= new CSite; $_248473197->Update($_40176252, array(___1097463118(272) =>($_297575965? ___1097463118(273): ___1097463118(274))));} self::__859860037(___1097463118(275), $_297575965);} protected static function OnDAVSettingsChange($_1354970373, $_297575965){ self::__859860037("dav", $_297575965);} protected static function OntimemanSettingsChange($_1354970373, $_297575965){ self::__859860037("timeman", $_297575965);} protected static function Onintranet_sharepointSettingsChange($_1354970373, $_297575965){ if($_297575965){ RegisterModuleDependences("iblock", "OnAfterIBlockElementAdd", "intranet", "CIntranetEventHandlers", "SPRegisterUpdatedItem"); RegisterModuleDependences(___1097463118(276), ___1097463118(277), ___1097463118(278), ___1097463118(279), ___1097463118(280)); CAgent::AddAgent(___1097463118(281), ___1097463118(282), ___1097463118(283), round(0+250+250)); CAgent::AddAgent(___1097463118(284), ___1097463118(285), ___1097463118(286), round(0+60+60+60+60+60)); CAgent::AddAgent(___1097463118(287), ___1097463118(288), ___1097463118(289), round(0+3600));} else{ UnRegisterModuleDependences(___1097463118(290), ___1097463118(291), ___1097463118(292), ___1097463118(293), ___1097463118(294)); UnRegisterModuleDependences(___1097463118(295), ___1097463118(296), ___1097463118(297), ___1097463118(298), ___1097463118(299)); CAgent::RemoveAgent(___1097463118(300), ___1097463118(301)); CAgent::RemoveAgent(___1097463118(302), ___1097463118(303)); CAgent::RemoveAgent(___1097463118(304), ___1097463118(305));}} protected static function OncrmSettingsChange($_1354970373, $_297575965){ if($_297575965) COption::SetOptionString("crm", "form_features", "Y"); self::__859860037(___1097463118(306), $_297575965);} protected static function OnClusterSettingsChange($_1354970373, $_297575965){ self::__859860037("cluster", $_297575965);} protected static function OnMultiSitesSettingsChange($_1354970373, $_297575965){ if($_297575965) RegisterModuleDependences("main", "OnBeforeProlog", "main", "CWizardSolPanelIntranet", "ShowPanel", 100, "/modules/intranet/panel_button.php"); else UnRegisterModuleDependences(___1097463118(307), ___1097463118(308), ___1097463118(309), ___1097463118(310), ___1097463118(311), ___1097463118(312));} protected static function OnIdeaSettingsChange($_1354970373, $_297575965){ self::__859860037("idea", $_297575965);} protected static function OnMeetingSettingsChange($_1354970373, $_297575965){ self::__859860037("meeting", $_297575965);} protected static function OnXDImportSettingsChange($_1354970373, $_297575965){ self::__859860037("xdimport", $_297575965);}} $GLOBALS['____577777957'][44](___1097463118(313), ___1097463118(314));/**/			//Do not remove this

require_once(__DIR__."/autoload.php");

// Component 2.0 template engines
$GLOBALS['arCustomTemplateEngines'] = [];

// User fields manager
$GLOBALS['USER_FIELD_MANAGER'] = new CUserTypeManager;

// todo: remove global
$GLOBALS['BX_MENU_CUSTOM'] = CMenuCustom::getInstance();

if (file_exists(($_fname = __DIR__."/classes/general/update_db_updater.php")))
{
	$US_HOST_PROCESS_MAIN = false;
	include($_fname);
}

if (file_exists(($_fname = $_SERVER["DOCUMENT_ROOT"]."/bitrix/init.php")))
{
	include_once($_fname);
}

if (($_fname = getLocalPath("php_interface/init.php", BX_PERSONAL_ROOT)) !== false)
{
	include_once($_SERVER["DOCUMENT_ROOT"].$_fname);
}

if (($_fname = getLocalPath("php_interface/".SITE_ID."/init.php", BX_PERSONAL_ROOT)) !== false)
{
	include_once($_SERVER["DOCUMENT_ROOT"].$_fname);
}

//global var, is used somewhere
$GLOBALS["sDocPath"] = $GLOBALS["APPLICATION"]->GetCurPage();

if ((!(defined("STATISTIC_ONLY") && STATISTIC_ONLY && mb_substr($GLOBALS["APPLICATION"]->GetCurPage(), 0, mb_strlen(BX_ROOT."/admin/")) != BX_ROOT."/admin/")) && COption::GetOptionString("main", "include_charset", "Y")=="Y" && LANG_CHARSET <> '')
{
	header("Content-Type: text/html; charset=".LANG_CHARSET);
}

if (COption::GetOptionString("main", "set_p3p_header", "Y")=="Y")
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
	$application->addBackgroundJob(["CAgent", "CheckAgents"], [], \Bitrix\Main\Application::JOB_PRIORITY_LOW);
}

//send email events
if (COption::GetOptionString("main", "check_events", "Y") !== "N")
{
	$application->addBackgroundJob(['\Bitrix\Main\Mail\EventManager', 'checkEvents'], [], \Bitrix\Main\Application::JOB_PRIORITY_LOW-1);
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

if (!defined("NOT_CHECK_PERMISSIONS") || NOT_CHECK_PERMISSIONS!==true)
{
	$doLogout = isset($_REQUEST["logout"]) && (strtolower($_REQUEST["logout"]) == "yes");

	if ($doLogout && $GLOBALS["USER"]->IsAuthorized())
	{
		$secureLogout = (\Bitrix\Main\Config\Option::get("main", "secure_logout", "N") == "Y");

		if (!$secureLogout || check_bitrix_sessid())
		{
			$GLOBALS["USER"]->Logout();
			LocalRedirect($GLOBALS["APPLICATION"]->GetCurPageParam('', array('logout', 'sessid')));
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
	if (isset($_POST["AUTH_FORM"]) && $_POST["AUTH_FORM"] <> '')
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
					$arAuthResult = array("MESSAGE"=>GetMessage("main_include_decode_pass_sess"), "TYPE"=>"ERROR");
				}
				elseif ($errno < 0)
				{
					$arAuthResult = array("MESSAGE"=>GetMessage("main_include_decode_pass_err", array("#ERRCODE#"=>$errno)), "TYPE"=>"ERROR");
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
					CMain::FinalActions('<script type="text/javascript">window.onload=function(){(window.BX || window.parent.BX).AUTHAGENT.setAuthResult(false);};</script>');
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
		$event = new Main\Event("main", "onApplicationScopeError", Array('APPLICATION_ID' => $applicationID));
		$event->send();

		$context->getResponse()->setStatus("403 Forbidden");
		$application->end();
	}
}

//define the site template
if (!defined("ADMIN_SECTION") || ADMIN_SECTION !== true)
{
	$siteTemplate = "";
	if (isset($_REQUEST["bitrix_preview_site_template"]) && is_string($_REQUEST["bitrix_preview_site_template"]) && $_REQUEST["bitrix_preview_site_template"] <> "" && $GLOBALS["USER"]->CanDoOperation('view_other_settings'))
	{
		//preview of site template
		$signer = new Bitrix\Main\Security\Sign\Signer();
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
		catch(\Bitrix\Main\Security\Sign\BadSignatureException $e)
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
	if ($_GET["show_page_exec_time"]=="Y" || $_GET["show_page_exec_time"]=="N")
	{
		$kernelSession["SESS_SHOW_TIME_EXEC"] = $_GET["show_page_exec_time"];
	}
}

//magic parameters: show included file processing time
if (isset($_GET["show_include_exec_time"]))
{
	if ($_GET["show_include_exec_time"]=="Y" || $_GET["show_include_exec_time"]=="N")
	{
		$kernelSession["SESS_SHOW_INCLUDE_TIME_EXEC"] = $_GET["show_include_exec_time"];
	}
}

//magic parameters: show include areas
if (isset($_GET["bitrix_include_areas"]) && $_GET["bitrix_include_areas"] <> "")
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

if ((!defined("NOT_CHECK_PERMISSIONS") || NOT_CHECK_PERMISSIONS!==true) && (!defined("NOT_CHECK_FILE_PERMISSIONS") || NOT_CHECK_FILE_PERMISSIONS!==true))
{
	$real_path = $context->getRequest()->getScriptFile();

	if (!$GLOBALS["USER"]->CanDoFileOperation('fm_view_file', array(SITE_ID, $real_path)) || (defined("NEED_AUTH") && NEED_AUTH && !$GLOBALS["USER"]->IsAuthorized()))
	{
		if ($GLOBALS["USER"]->IsAuthorized() && $arAuthResult["MESSAGE"] == '')
		{
			$arAuthResult = array("MESSAGE"=>GetMessage("ACCESS_DENIED").' '.GetMessage("ACCESS_DENIED_FILE", array("#FILE#"=>$real_path)), "TYPE"=>"ERROR");

			if (COption::GetOptionString("main", "event_log_permissions_fail", "N") === "Y")
			{
				CEventLog::Log("SECURITY", "USER_PERMISSIONS_FAIL", "main", $GLOBALS["USER"]->GetID(), $real_path);
			}
		}

		if (defined("ADMIN_SECTION") && ADMIN_SECTION === true)
		{
			if (isset($_REQUEST["mode"]) && ($_REQUEST["mode"] === "list" || $_REQUEST["mode"] === "settings"))
			{
				echo "<script>top.location='".$GLOBALS["APPLICATION"]->GetCurPage()."?".DeleteParam(array("mode"))."';</script>";
				die();
			}
			elseif (isset($_REQUEST["mode"]) && $_REQUEST["mode"] === "frame")
			{
				echo "<script type=\"text/javascript\">
					var w = (opener? opener.window:parent.window);
					w.location.href='".$GLOBALS["APPLICATION"]->GetCurPage()."?".DeleteParam(array("mode"))."';
				</script>";
				die();
			}
			elseif (defined("MOBILE_APP_ADMIN") && MOBILE_APP_ADMIN === true)
			{
				echo json_encode(Array("status"=>"failed"));
				die();
			}
		}

		/** @noinspection PhpUndefinedVariableInspection */
		$GLOBALS["APPLICATION"]->AuthForm($arAuthResult);
	}
}

/*ZDUyZmZMjk2MzM4MTE1NTNhZTBjNjJjMWVjYTMzMGRjZTk0YWY=*/$GLOBALS['____155221506']= array(base64_decode('bX'.'RfcmFuZA=='),base64_decode('ZXh'.'wb'.'G9kZQ='.'='),base64_decode('cGFja'.'w'.'='.'='),base64_decode('bWQ'.'1'),base64_decode(''.'Y'.'2'.'9uc'.'3R'.'hbnQ='),base64_decode('a'.'GFzaF9obWFj'),base64_decode('c3Ry'.'Y21w'),base64_decode(''.'aX'.'Nfb2'.'JqZWN'.'0'),base64_decode(''.'Y2'.'FsbF91c2VyX'.'2Z1bmM='),base64_decode('Y2FsbF'.'91c'.'2'.'VyX2'.'Z1bmM='),base64_decode('Y'.'2'.'Fs'.'bF91'.'c2V'.'yX2Z1bmM='),base64_decode('Y2'.'FsbF9'.'1c2Vy'.'X2Z1bmM='),base64_decode(''.'Y'.'2F'.'sb'.'F91c2VyX2Z'.'1bmM='));if(!function_exists(__NAMESPACE__.'\\___788028444')){function ___788028444($_526885801){static $_201088593= false; if($_201088593 == false) $_201088593=array(''.'REI=',''.'U0'.'V'.'MR'.'UNUIFZB'.'TFVFI'.'EZST00gYl9v'.'cH'.'R'.'p'.'b24gV0hFU'.'kU'.'gTkFNR'.'T'.'0n'.'f'.'lBBU'.'kFNX'.'01BWF9VU0VSUycgQU5'.'EIE1PRF'.'VMRV9JR'.'D0nb'.'WFpbicgQ'.'U'.'5E'.'I'.'FNJVEVfSUQgS'.'VMgTl'.'VMTA='.'=','VkFMVUU=',''.'Lg==','SCo=','Yml0cml4','TEl'.'DRU5'.'TRV9L'.'RVk'.'=','c2hhMjU2','VVNFUg==','VVNF'.'Ug==','VVNFU'.'g==','SXN'.'BdXR'.'ob3JpemVk','VVNFUg'.'==','SXNBZG1pbg='.'=',''.'QVBQ'.'TElD'.'Q'.'V'.'RJT04=','Um'.'VzdG'.'F'.'ydE'.'J1ZmZlc'.'g==','TG9jYW'.'xSZ'.'WRpc'.'mV'.'j'.'dA==','L'.'2'.'xpY'.'2Vuc2'.'VfcmV'.'z'.'dHJpY'.'3R'.'p'.'b24'.'ucGhw','XE'.'JpdHJp'.'eFxNYWlu'.'X'.'ENv'.'bmZpZ'.'1xPcHRpb246OnNl'.'dA'.'==','b'.'WFpbg==','UE'.'FSQ'.'U1fTU'.'FY'.'X'.'1VTR'.'VJT');return base64_decode($_201088593[$_526885801]);}};if($GLOBALS['____155221506'][0](round(0+0.2+0.2+0.2+0.2+0.2), round(0+5+5+5+5)) == round(0+2.3333333333333+2.3333333333333+2.3333333333333)){ $_912184823= $GLOBALS[___788028444(0)]->Query(___788028444(1), true); if($_758130491= $_912184823->Fetch()){ $_863402780= $_758130491[___788028444(2)]; list($_1071048978, $_1331314681)= $GLOBALS['____155221506'][1](___788028444(3), $_863402780); $_1724051181= $GLOBALS['____155221506'][2](___788028444(4), $_1071048978); $_2142741606= ___788028444(5).$GLOBALS['____155221506'][3]($GLOBALS['____155221506'][4](___788028444(6))); $_1098059425= $GLOBALS['____155221506'][5](___788028444(7), $_1331314681, $_2142741606, true); if($GLOBALS['____155221506'][6]($_1098059425, $_1724051181) !==(834-2*417)){ if(isset($GLOBALS[___788028444(8)]) && $GLOBALS['____155221506'][7]($GLOBALS[___788028444(9)]) && $GLOBALS['____155221506'][8](array($GLOBALS[___788028444(10)], ___788028444(11))) &&!$GLOBALS['____155221506'][9](array($GLOBALS[___788028444(12)], ___788028444(13)))){ $GLOBALS['____155221506'][10](array($GLOBALS[___788028444(14)], ___788028444(15))); $GLOBALS['____155221506'][11](___788028444(16), ___788028444(17), true);}}} else{ $GLOBALS['____155221506'][12](___788028444(18), ___788028444(19), ___788028444(20), round(0+2.4+2.4+2.4+2.4+2.4));}}/**/       //Do not remove this

