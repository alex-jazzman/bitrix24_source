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

/*ZDUyZmZODY0ZTA5NGNkMWY5YWMwZmI0MGUzZmE5MmFlMWE5YTI=*/$GLOBALS['_____1234527744']= array(base64_decode('R2'.'V0'.'T'.'W9k'.'dW'.'xlR'.'X'.'ZlbnRz'),base64_decode('R'.'Xhl'.'Y'.'3V0'.'ZU1'.'vZHVs'.'ZUV2ZW'.'50'.'RXg='));$GLOBALS['____548304171']= array(base64_decode('ZGV'.'maW'.'5l'),base64_decode('Ym'.'F'.'zZTY'.'0X2RlY'.'29k'.'ZQ='.'='),base64_decode('d'.'W5'.'z'.'ZXJpYW'.'xpemU='),base64_decode('aX'.'NfYXJyYXk='),base64_decode('a'.'W5f'.'YXJyYXk='),base64_decode(''.'c2VyaWFsaXpl'),base64_decode(''.'Y'.'mFzZT'.'Y0X2V'.'uY29'.'kZQ=='),base64_decode('bWt0aW1l'),base64_decode('ZG'.'F0'.'ZQ='.'='),base64_decode('Z'.'GF0ZQ=='),base64_decode('c3RybGVu'),base64_decode('bWt0a'.'W1l'),base64_decode('ZGF0Z'.'Q'.'=='),base64_decode('ZGF0Z'.'Q=='),base64_decode(''.'bWV0aG9kX2V4aXN0cw=='),base64_decode('Y'.'2FsbF91c2Vy'.'X2Z'.'1bmNfY'.'X'.'JyYXk='),base64_decode('c3Ry'.'b'.'GVu'),base64_decode('c'.'2VyaWF'.'saXpl'),base64_decode('YmFz'.'ZTY'.'0X2VuY29kZ'.'Q=='),base64_decode(''.'c3RybGVu'),base64_decode(''.'aX'.'Nf'.'YXJyYXk='),base64_decode('c'.'2Vya'.'W'.'FsaX'.'pl'),base64_decode('YmFzZTY0'.'X2VuY2'.'9kZ'.'Q=='),base64_decode('c2'.'VyaWFsaX'.'pl'),base64_decode(''.'YmFzZ'.'TY0X2V'.'uY'.'2'.'9kZQ='.'='),base64_decode('aX'.'N'.'fY'.'X'.'J'.'yYXk='),base64_decode('aX'.'Nf'.'YXJyYXk'.'='),base64_decode(''.'aW'.'5f'.'YXJyY'.'Xk='),base64_decode('aW'.'5fYXJy'.'YX'.'k='),base64_decode(''.'b'.'Wt0'.'aW1l'),base64_decode(''.'ZG'.'F0Z'.'Q=='),base64_decode('Z'.'GF0ZQ=='),base64_decode('Z'.'GF0ZQ=='),base64_decode(''.'bWt0aW1l'),base64_decode('ZGF0ZQ'.'=='),base64_decode('ZGF0Z'.'Q=='),base64_decode('aW5'.'fYX'.'JyY'.'Xk'.'='),base64_decode('c2Vy'.'a'.'WF'.'saXpl'),base64_decode(''.'Ym'.'F'.'zZ'.'TY0'.'X2Vu'.'Y2'.'9kZ'.'Q='.'='),base64_decode('a'.'W50dm'.'Fs'),base64_decode(''.'d'.'GltZ'.'Q=='),base64_decode('ZmlsZV9leG'.'lzdH'.'M='),base64_decode('c3RyX3Jlc'.'GxhY2U='),base64_decode('Y2x'.'h'.'c3NfZ'.'Xhpc'.'3R'.'z'),base64_decode('ZGVmaW'.'5l'));if(!function_exists(__NAMESPACE__.'\\___270199539')){function ___270199539($_1858127723){static $_1138722882= false; if($_1138722882 == false) $_1138722882=array(''.'SU5UUk'.'FORV'.'RfRURJVE'.'lPT'.'g==','WQ==','b'.'WFp'.'b'.'g==','fm'.'NwZ'.'l'.'9tYXB'.'fdmFsdWU=','','','YW'.'x'.'sb'.'3d'.'lZ'.'F9jbGFzc2Vz',''.'Z'.'Q==','Zg==','ZQ==','Rg==','WA==','Z'.'g==','bWFpbg==','fm'.'N'.'wZl9tY'.'X'.'BfdmFsdW'.'U'.'=',''.'UG9ydG'.'Fs','Rg==',''.'ZQ'.'='.'=','ZQ==','WA==','Rg==','RA==','RA'.'==','bQ'.'==',''.'Z'.'A==','W'.'Q==','Zg==','Zg='.'=',''.'Zg==','Zg==','UG9'.'ydGF'.'s','R'.'g==','ZQ'.'==','ZQ='.'=',''.'WA'.'==','R'.'g==','RA'.'==','RA==','bQ'.'==','ZA==','WQ==',''.'b'.'WFpb'.'g='.'=','T24'.'=','U2V0dGluZ3'.'N'.'DaGFuZ2U=',''.'Zg'.'==','Zg==','Zg==','Z'.'g==','bWFpbg==','fm'.'NwZl9tYXBf'.'dmFsdW'.'U=','ZQ==','ZQ'.'==','RA==','ZQ'.'==','ZQ==','Zg'.'==','Zg==','Zg==',''.'ZQ==','bW'.'Fpbg==','fmNwZ'.'l9t'.'YXBf'.'dmFsdWU=',''.'ZQ==','Zg==','Zg==','Z'.'g==','Zg==','bW'.'Fpbg='.'=','fmNwZ'.'l9t'.'YXB'.'fdmFsdWU=','ZQ==','Zg'.'==','UG9ydGFs','UG9ydGFs',''.'Z'.'Q==','ZQ='.'=','UG9'.'y'.'dGFs',''.'Rg==','WA'.'==','Rg'.'==','RA==','ZQ==','ZQ='.'=','RA='.'=','bQ==','ZA==','W'.'Q='.'=','ZQ'.'==','WA'.'='.'=',''.'ZQ='.'=',''.'Rg==','ZQ'.'==','R'.'A==',''.'Zg==','ZQ==','R'.'A==','Z'.'Q==',''.'bQ==','ZA==','WQ==',''.'Zg==','Zg==','Zg'.'==',''.'Z'.'g==','Zg==','Z'.'g==','Z'.'g==','Z'.'g==','b'.'WF'.'pb'.'g==','fmN'.'w'.'Zl9tYXBfdmFsdWU=',''.'ZQ==','ZQ==',''.'U'.'G'.'9y'.'dGFs','Rg==','WA='.'=','VFlQRQ'.'==','R'.'EFURQ==',''.'R'.'k'.'V'.'BVFVSRVM=','RVhQSVJFRA==',''.'V'.'FlQ'.'RQ==',''.'R'.'A'.'==','VFJ'.'ZX'.'0'.'RB'.'WVN'.'fQ09VTl'.'Q=','RE'.'FURQ==','V'.'FJZX0R'.'BWVNfQ09'.'VTlQ=','RVh'.'Q'.'S'.'V'.'J'.'F'.'R'.'A='.'=','RkVB'.'V'.'F'.'VSRVM=','Z'.'g'.'='.'=','Zg==','RE9DVU1FTlRfUk9P'.'VA==','L'.'2JpdHJ'.'pe'.'C9tb2R'.'1'.'bGVzLw'.'==','L2l'.'uc3RhbGw'.'vaW5k'.'ZXgucGh'.'w','Lg==','Xw'.'='.'=','c2'.'Vh'.'cmN'.'o','Tg'.'='.'=','','','Q'.'U'.'NUSVZF','WQ'.'='.'=','c2'.'9ja'.'WFs'.'bmV0d'.'29ya'.'w==','YWxsb3'.'dfZn'.'JpZ'.'Wxkcw==','WQ==',''.'S'.'UQ=','c'.'29j'.'aW'.'Fsb'.'mV0d29yaw==',''.'YWxsb3dfZnJpZWxkcw==','SUQ=','c'.'29jaWFsbmV0'.'d29'.'y'.'aw='.'=','YWxs'.'b3'.'d'.'fZnJpZWx'.'kcw='.'=','Tg==','','','Q'.'UNUSVZF','W'.'Q==','c'.'29'.'jaWFsb'.'mV0d29yaw==','YW'.'xs'.'b3d'.'fbWljc'.'m9'.'ibG9nX3VzZX'.'I=','WQ==','SUQ=','c29jaWF'.'sb'.'mV0d'.'29yaw==','YWxsb3dfbWljc'.'m9ibG9n'.'X3VzZXI=','SU'.'Q'.'=',''.'c29ja'.'WFsbmV'.'0d29yaw='.'=','YWxsb3'.'d'.'f'.'bWljcm9ibG'.'9n'.'X3V'.'z'.'ZX'.'I=',''.'c2'.'9jaWFs'.'bmV0'.'d29'.'y'.'a'.'w==','YWxsb3dfbW'.'ljc'.'m9ibG9nX2'.'dy'.'b3Vw','W'.'Q==',''.'S'.'UQ'.'=','c2'.'9jaWFsb'.'m'.'V0d2'.'9yaw==','YWxsb3dfbWl'.'jc'.'m9ib'.'G9nX2dyb3Vw','S'.'UQ'.'=','c2'.'9'.'jaWFsbmV0d29ya'.'w==','Y'.'W'.'xs'.'b3dfbWlj'.'cm9ib'.'G9n'.'X'.'2dy'.'b3Vw',''.'Tg==','','','QUNUSV'.'ZF','W'.'Q==','c29jaW'.'Fsbm'.'V0'.'d29yaw='.'=','YWxsb3dfZ'.'mlsZXNfdXN'.'lcg'.'==',''.'WQ==','SUQ=',''.'c'.'2'.'9jaWFsbmV0d2'.'9yaw==','YWxs'.'b3df'.'ZmlsZXNfdXNl'.'cg==','SUQ=','c2'.'9'.'j'.'aWFs'.'bmV0d29yaw'.'==','YWxsb3df'.'ZmlsZXNfdX'.'Nlc'.'g'.'==','T'.'g='.'=','','',''.'Q'.'UNUSVZF','WQ'.'==',''.'c'.'29jaWFsbmV0d2'.'9y'.'aw==','YWx'.'s'.'b3'.'dfYmxvZ191'.'c'.'2Vy','WQ'.'==','SUQ=','c29jaWFsbmV0'.'d29yaw'.'==','Y'.'Wx'.'sb3dfYmx'.'vZ191'.'c'.'2V'.'y','SUQ=',''.'c29ja'.'WFsbm'.'V'.'0d29yaw='.'=',''.'Y'.'Wxsb3d'.'fYmxvZ19'.'1c2'.'Vy',''.'Tg==','','','QUNUSV'.'ZF','WQ==','c29'.'jaWFsbmV0d29yaw==','YWxsb3dfcGhvdG9fd'.'XN'.'lcg==','WQ'.'==','SUQ=','c29jaWFsbmV0'.'d2'.'9'.'yaw==','YW'.'xsb3dfcGhvd'.'G9fdXNlcg'.'==','S'.'UQ=','c29j'.'aWF'.'sb'.'m'.'V0d29yaw==','YWxsb3dfcGhvdG9'.'fdXNl'.'cg==',''.'Tg==','','','QUNU'.'S'.'VZF','WQ==','c29'.'jaWFs'.'bmV0d29ya'.'w'.'==','YW'.'xsb3dfZm'.'9ydW1fdXNlcg==','W'.'Q==',''.'S'.'UQ=','c2'.'9j'.'aWFsbmV'.'0d29yaw==','YWxsb'.'3dfZm9ydW1fdXNlcg='.'=',''.'SU'.'Q=',''.'c2'.'9j'.'aWF'.'sbmV0d2'.'9yaw==',''.'YWxsb3d'.'f'.'Zm9ydW'.'1fdXNl'.'c'.'g='.'=','T'.'g='.'=','','','QUNU'.'SVZ'.'F','W'.'Q==','c29j'.'aWF'.'sbmV0d29yaw==','YWxsb3'.'d'.'fd'.'GF'.'za3'.'NfdX'.'Nlcg'.'==','WQ'.'==',''.'S'.'U'.'Q=','c29'.'jaW'.'FsbmV'.'0'.'d'.'29'.'yaw==','YWxsb3df'.'dG'.'Fza3Nfd'.'X'.'Nl'.'cg='.'=','SUQ=',''.'c'.'29jaWFsb'.'mV0d'.'29yaw==','YWxsb3dfdGFza3NfdXN'.'lcg='.'=',''.'c29'.'jaWFsbmV'.'0d29yaw==','YWx'.'sb3dfdGF'.'za'.'3NfZ3Jvd'.'XA=','W'.'Q==',''.'SUQ=',''.'c'.'2'.'9jaWF'.'s'.'bmV0d2'.'9yaw==','YWxsb3'.'dfdGFza3NfZ3JvdX'.'A=','S'.'UQ=','c29jaW'.'FsbmV0d29yaw==','YWxsb3dfdG'.'Fz'.'a'.'3NfZ3JvdXA=','dGFza'.'3'.'M=',''.'T'.'g==','','','QU'.'NU'.'SVZF','WQ'.'==','c29jaWFsb'.'m'.'V0d29yaw==','YWxs'.'b3d'.'f'.'Y2FsZW'.'5kY'.'XJfdXNlcg==','W'.'Q'.'==','SUQ=','c'.'29j'.'aWFsbmV0'.'d29yaw==','YWxsb3dfY2'.'FsZW5k'.'YX'.'Jfd'.'XN'.'l'.'cg==','S'.'UQ=','c29jaWF'.'sbm'.'V0d29'.'y'.'aw==','YWxsb3dfY2'.'FsZW5'.'k'.'YXJ'.'f'.'dXNlcg==','c29'.'ja'.'W'.'F'.'s'.'bmV0d29yaw==','YWxsb3dfY2F'.'sZW5kYXJ'.'fZ3JvdXA=','WQ==','S'.'UQ=','c2'.'9jaW'.'FsbmV0d2'.'9ya'.'w='.'=',''.'YW'.'xs'.'b3dfY2FsZW5kYXJfZ3Jvd'.'XA'.'=','SU'.'Q=','c'.'29j'.'aWFsbmV0d2'.'9yaw==','YWxsb3dfY2FsZW5kY'.'XJfZ3JvdXA=','QUNUS'.'VZF','WQ'.'==','Tg='.'=','ZXh0'.'cm'.'FuZX'.'Q=','aW'.'Jsb2Nr',''.'T25'.'BZnRlc'.'klC'.'bG9ja'.'0'.'VsZ'.'W'.'1lbnRVcGRhdGU=','aW'.'50'.'cm'.'FuZXQ=','Q0ludHJhb'.'mV0'.'R'.'X'.'Zlb'.'n'.'RIY'.'W5k'.'bG'.'Vycw='.'=',''.'U'.'1BSZWdp'.'c3RlclVwZG'.'F'.'0ZWRJdGV'.'t',''.'Q0lu'.'d'.'HJhb'.'mV0U2hhcmVwb2'.'ludDo'.'6Q'.'WdlbnRM'.'aXN0c'.'ygpOw'.'='.'=','aW5'.'0c'.'mFuZXQ=',''.'Tg='.'=','Q0l'.'udHJhb'.'mV0'.'U2'.'hhcmV'.'wb2l'.'udDo6QWdlbnRRdWV1ZSgp'.'Ow==','a'.'W'.'50c'.'mF'.'u'.'ZXQ'.'=','Tg==','Q0'.'lud'.'HJ'.'hbmV0U2hhcm'.'Vwb2ludDo6'.'QWd'.'lbnRVcGR'.'hdGU'.'o'.'K'.'T'.'s=',''.'aW50cmFuZX'.'Q=','Tg='.'=','a'.'W'.'J'.'sb2Nr','T25BZnRlcklCbG9'.'j'.'a'.'0'.'VsZW1lbn'.'R'.'BZGQ=','aW'.'50cm'.'Fu'.'ZXQ=',''.'Q0l'.'ud'.'HJh'.'bmV0RX'.'Z'.'lb'.'nRIY'.'W5kbGVyc'.'w==','U'.'1BSZW'.'dpc3'.'Rl'.'clVwZGF'.'0ZWR'.'JdG'.'Vt','aWJs'.'b'.'2Nr','T25BZ'.'nRlc'.'klCbG9ja'.'0VsZW'.'1lbnRVcGRhdG'.'U=','aW50cm'.'FuZX'.'Q'.'=','Q0lu'.'d'.'HJ'.'h'.'bmV0RX'.'ZlbnR'.'IYW'.'5kbGV'.'yc'.'w='.'=','U'.'1'.'BSZWdp'.'c3RlclVwZGF0ZWRJdGVt','Q0ludHJhbmV0U2hhcm'.'Vwb2ludDo6QWdlbnRMaXN0'.'cygpOw==',''.'aW5'.'0cmFu'.'ZXQ=','Q0ludHJhb'.'m'.'V0U'.'2hhcm'.'Vwb2'.'ludDo6QWdl'.'bn'.'RR'.'dWV1ZSgp'.'O'.'w==','aW50cmFuZ'.'X'.'Q=','Q0ludHJhbmV'.'0U2'.'hhcm'.'Vwb2'.'ludDo6QWdlbnRV'.'cGRhdGU'.'o'.'KTs'.'=','a'.'W50cmF'.'u'.'Z'.'XQ=',''.'Y3Jt','bWFpbg==','T25CZWZv'.'cmVQ'.'cm9sb2c=','bW'.'Fpbg==','Q1'.'d'.'pemFyZFNvbFB'.'hbm'.'Vs'.'S'.'W50cm'.'FuZ'.'XQ=','U2hv'.'d'.'1Bh'.'b'.'mV'.'s','L21vZHV'.'sZ'.'XMvaW50cm'.'F'.'uZXQvcGFuZW'.'xfYnV'.'0d'.'G'.'9'.'uL'.'nB'.'ocA==',''.'RU5D'.'T0RF','WQ==');return base64_decode($_1138722882[$_1858127723]);}};$GLOBALS['____548304171'][0](___270199539(0), ___270199539(1));class CBXFeatures{ private static $_1018899762= 30; private static $_544175540= array( "Portal" => array( "CompanyCalendar", "CompanyPhoto", "CompanyVideo", "CompanyCareer", "StaffChanges", "StaffAbsence", "CommonDocuments", "MeetingRoomBookingSystem", "Wiki", "Learning", "Vote", "WebLink", "Subscribe", "Friends", "PersonalFiles", "PersonalBlog", "PersonalPhoto", "PersonalForum", "Blog", "Forum", "Gallery", "Board", "MicroBlog", "WebMessenger",), "Communications" => array( "Tasks", "Calendar", "Workgroups", "Jabber", "VideoConference", "Extranet", "SMTP", "Requests", "DAV", "intranet_sharepoint", "timeman", "Idea", "Meeting", "EventList", "Salary", "XDImport",), "Enterprise" => array( "BizProc", "Lists", "Support", "Analytics", "crm", "Controller", "LdapUnlimitedUsers",), "Holding" => array( "Cluster", "MultiSites",),); private static $_40688050= null; private static $_1567363878= null; private static function __402608607(){ if(self::$_40688050 === null){ self::$_40688050= array(); foreach(self::$_544175540 as $_2147424121 => $_975393077){ foreach($_975393077 as $_600215437) self::$_40688050[$_600215437]= $_2147424121;}} if(self::$_1567363878 === null){ self::$_1567363878= array(); $_1363442658= COption::GetOptionString(___270199539(2), ___270199539(3), ___270199539(4)); if($_1363442658 != ___270199539(5)){ $_1363442658= $GLOBALS['____548304171'][1]($_1363442658); $_1363442658= $GLOBALS['____548304171'][2]($_1363442658,[___270199539(6) => false]); if($GLOBALS['____548304171'][3]($_1363442658)){ self::$_1567363878= $_1363442658;}} if(empty(self::$_1567363878)){ self::$_1567363878= array(___270199539(7) => array(), ___270199539(8) => array());}}} public static function InitiateEditionsSettings($_1737566203){ self::__402608607(); $_1884340999= array(); foreach(self::$_544175540 as $_2147424121 => $_975393077){ $_2116926536= $GLOBALS['____548304171'][4]($_2147424121, $_1737566203); self::$_1567363878[___270199539(9)][$_2147424121]=($_2116926536? array(___270199539(10)): array(___270199539(11))); foreach($_975393077 as $_600215437){ self::$_1567363878[___270199539(12)][$_600215437]= $_2116926536; if(!$_2116926536) $_1884340999[]= array($_600215437, false);}} $_942945562= $GLOBALS['____548304171'][5](self::$_1567363878); $_942945562= $GLOBALS['____548304171'][6]($_942945562); COption::SetOptionString(___270199539(13), ___270199539(14), $_942945562); foreach($_1884340999 as $_973010168) self::__885455954($_973010168[(946-2*473)], $_973010168[round(0+0.33333333333333+0.33333333333333+0.33333333333333)]);} public static function IsFeatureEnabled($_600215437){ if($_600215437 == '') return true; self::__402608607(); if(!isset(self::$_40688050[$_600215437])) return true; if(self::$_40688050[$_600215437] == ___270199539(15)) $_2038172962= array(___270199539(16)); elseif(isset(self::$_1567363878[___270199539(17)][self::$_40688050[$_600215437]])) $_2038172962= self::$_1567363878[___270199539(18)][self::$_40688050[$_600215437]]; else $_2038172962= array(___270199539(19)); if($_2038172962[(201*2-402)] != ___270199539(20) && $_2038172962[(814-2*407)] != ___270199539(21)){ return false;} elseif($_2038172962[(796-2*398)] == ___270199539(22)){ if($_2038172962[round(0+0.2+0.2+0.2+0.2+0.2)]< $GLOBALS['____548304171'][7]((924-2*462),(1036/2-518),(876-2*438), Date(___270199539(23)), $GLOBALS['____548304171'][8](___270199539(24))- self::$_1018899762, $GLOBALS['____548304171'][9](___270199539(25)))){ if(!isset($_2038172962[round(0+0.5+0.5+0.5+0.5)]) ||!$_2038172962[round(0+1+1)]) self::__1890134892(self::$_40688050[$_600215437]); return false;}} return!isset(self::$_1567363878[___270199539(26)][$_600215437]) || self::$_1567363878[___270199539(27)][$_600215437];} public static function IsFeatureInstalled($_600215437){ if($GLOBALS['____548304171'][10]($_600215437) <= 0) return true; self::__402608607(); return(isset(self::$_1567363878[___270199539(28)][$_600215437]) && self::$_1567363878[___270199539(29)][$_600215437]);} public static function IsFeatureEditable($_600215437){ if($_600215437 == '') return true; self::__402608607(); if(!isset(self::$_40688050[$_600215437])) return true; if(self::$_40688050[$_600215437] == ___270199539(30)) $_2038172962= array(___270199539(31)); elseif(isset(self::$_1567363878[___270199539(32)][self::$_40688050[$_600215437]])) $_2038172962= self::$_1567363878[___270199539(33)][self::$_40688050[$_600215437]]; else $_2038172962= array(___270199539(34)); if($_2038172962[(1192/2-596)] != ___270199539(35) && $_2038172962[(219*2-438)] != ___270199539(36)){ return false;} elseif($_2038172962[min(180,0,60)] == ___270199539(37)){ if($_2038172962[round(0+0.33333333333333+0.33333333333333+0.33333333333333)]< $GLOBALS['____548304171'][11]((169*2-338),(906-2*453),(1416/2-708), Date(___270199539(38)), $GLOBALS['____548304171'][12](___270199539(39))- self::$_1018899762, $GLOBALS['____548304171'][13](___270199539(40)))){ if(!isset($_2038172962[round(0+2)]) ||!$_2038172962[round(0+0.5+0.5+0.5+0.5)]) self::__1890134892(self::$_40688050[$_600215437]); return false;}} return true;} private static function __885455954($_600215437, $_1804741422){ if($GLOBALS['____548304171'][14]("CBXFeatures", "On".$_600215437."SettingsChange")) $GLOBALS['____548304171'][15](array("CBXFeatures", "On".$_600215437."SettingsChange"), array($_600215437, $_1804741422)); $_1887203173= $GLOBALS['_____1234527744'][0](___270199539(41), ___270199539(42).$_600215437.___270199539(43)); while($_1996376383= $_1887203173->Fetch()) $GLOBALS['_____1234527744'][1]($_1996376383, array($_600215437, $_1804741422));} public static function SetFeatureEnabled($_600215437, $_1804741422= true, $_1436791437= true){ if($GLOBALS['____548304171'][16]($_600215437) <= 0) return; if(!self::IsFeatureEditable($_600215437)) $_1804741422= false; $_1804741422= (bool)$_1804741422; self::__402608607(); $_1624367750=(!isset(self::$_1567363878[___270199539(44)][$_600215437]) && $_1804741422 || isset(self::$_1567363878[___270199539(45)][$_600215437]) && $_1804741422 != self::$_1567363878[___270199539(46)][$_600215437]); self::$_1567363878[___270199539(47)][$_600215437]= $_1804741422; $_942945562= $GLOBALS['____548304171'][17](self::$_1567363878); $_942945562= $GLOBALS['____548304171'][18]($_942945562); COption::SetOptionString(___270199539(48), ___270199539(49), $_942945562); if($_1624367750 && $_1436791437) self::__885455954($_600215437, $_1804741422);} private static function __1890134892($_2147424121){ if($GLOBALS['____548304171'][19]($_2147424121) <= 0 || $_2147424121 == "Portal") return; self::__402608607(); if(!isset(self::$_1567363878[___270199539(50)][$_2147424121]) || self::$_1567363878[___270199539(51)][$_2147424121][(205*2-410)] != ___270199539(52)) return; if(isset(self::$_1567363878[___270199539(53)][$_2147424121][round(0+2)]) && self::$_1567363878[___270199539(54)][$_2147424121][round(0+0.5+0.5+0.5+0.5)]) return; $_1884340999= array(); if(isset(self::$_544175540[$_2147424121]) && $GLOBALS['____548304171'][20](self::$_544175540[$_2147424121])){ foreach(self::$_544175540[$_2147424121] as $_600215437){ if(isset(self::$_1567363878[___270199539(55)][$_600215437]) && self::$_1567363878[___270199539(56)][$_600215437]){ self::$_1567363878[___270199539(57)][$_600215437]= false; $_1884340999[]= array($_600215437, false);}} self::$_1567363878[___270199539(58)][$_2147424121][round(0+0.5+0.5+0.5+0.5)]= true;} $_942945562= $GLOBALS['____548304171'][21](self::$_1567363878); $_942945562= $GLOBALS['____548304171'][22]($_942945562); COption::SetOptionString(___270199539(59), ___270199539(60), $_942945562); foreach($_1884340999 as $_973010168) self::__885455954($_973010168[(800-2*400)], $_973010168[round(0+0.5+0.5)]);} public static function ModifyFeaturesSettings($_1737566203, $_975393077){ self::__402608607(); foreach($_1737566203 as $_2147424121 => $_1773390661) self::$_1567363878[___270199539(61)][$_2147424121]= $_1773390661; $_1884340999= array(); foreach($_975393077 as $_600215437 => $_1804741422){ if(!isset(self::$_1567363878[___270199539(62)][$_600215437]) && $_1804741422 || isset(self::$_1567363878[___270199539(63)][$_600215437]) && $_1804741422 != self::$_1567363878[___270199539(64)][$_600215437]) $_1884340999[]= array($_600215437, $_1804741422); self::$_1567363878[___270199539(65)][$_600215437]= $_1804741422;} $_942945562= $GLOBALS['____548304171'][23](self::$_1567363878); $_942945562= $GLOBALS['____548304171'][24]($_942945562); COption::SetOptionString(___270199539(66), ___270199539(67), $_942945562); self::$_1567363878= false; foreach($_1884340999 as $_973010168) self::__885455954($_973010168[(882-2*441)], $_973010168[round(0+0.2+0.2+0.2+0.2+0.2)]);} public static function SaveFeaturesSettings($_1454180523, $_813482432){ self::__402608607(); $_13187913= array(___270199539(68) => array(), ___270199539(69) => array()); if(!$GLOBALS['____548304171'][25]($_1454180523)) $_1454180523= array(); if(!$GLOBALS['____548304171'][26]($_813482432)) $_813482432= array(); if(!$GLOBALS['____548304171'][27](___270199539(70), $_1454180523)) $_1454180523[]= ___270199539(71); foreach(self::$_544175540 as $_2147424121 => $_975393077){ if(isset(self::$_1567363878[___270199539(72)][$_2147424121])){ $_515001264= self::$_1567363878[___270199539(73)][$_2147424121];} else{ $_515001264=($_2147424121 == ___270199539(74)? array(___270199539(75)): array(___270199539(76)));} if($_515001264[(246*2-492)] == ___270199539(77) || $_515001264[(126*2-252)] == ___270199539(78)){ $_13187913[___270199539(79)][$_2147424121]= $_515001264;} else{ if($GLOBALS['____548304171'][28]($_2147424121, $_1454180523)) $_13187913[___270199539(80)][$_2147424121]= array(___270199539(81), $GLOBALS['____548304171'][29]((188*2-376),(946-2*473), min(64,0,21.333333333333), $GLOBALS['____548304171'][30](___270199539(82)), $GLOBALS['____548304171'][31](___270199539(83)), $GLOBALS['____548304171'][32](___270199539(84)))); else $_13187913[___270199539(85)][$_2147424121]= array(___270199539(86));}} $_1884340999= array(); foreach(self::$_40688050 as $_600215437 => $_2147424121){ if($_13187913[___270199539(87)][$_2147424121][(778-2*389)] != ___270199539(88) && $_13187913[___270199539(89)][$_2147424121][(792-2*396)] != ___270199539(90)){ $_13187913[___270199539(91)][$_600215437]= false;} else{ if($_13187913[___270199539(92)][$_2147424121][min(40,0,13.333333333333)] == ___270199539(93) && $_13187913[___270199539(94)][$_2147424121][round(0+1)]< $GLOBALS['____548304171'][33]((964-2*482),(762-2*381),(1468/2-734), Date(___270199539(95)), $GLOBALS['____548304171'][34](___270199539(96))- self::$_1018899762, $GLOBALS['____548304171'][35](___270199539(97)))) $_13187913[___270199539(98)][$_600215437]= false; else $_13187913[___270199539(99)][$_600215437]= $GLOBALS['____548304171'][36]($_600215437, $_813482432); if(!isset(self::$_1567363878[___270199539(100)][$_600215437]) && $_13187913[___270199539(101)][$_600215437] || isset(self::$_1567363878[___270199539(102)][$_600215437]) && $_13187913[___270199539(103)][$_600215437] != self::$_1567363878[___270199539(104)][$_600215437]) $_1884340999[]= array($_600215437, $_13187913[___270199539(105)][$_600215437]);}} $_942945562= $GLOBALS['____548304171'][37]($_13187913); $_942945562= $GLOBALS['____548304171'][38]($_942945562); COption::SetOptionString(___270199539(106), ___270199539(107), $_942945562); self::$_1567363878= false; foreach($_1884340999 as $_973010168) self::__885455954($_973010168[(156*2-312)], $_973010168[round(0+0.5+0.5)]);} public static function GetFeaturesList(){ self::__402608607(); $_1982077469= array(); foreach(self::$_544175540 as $_2147424121 => $_975393077){ if(isset(self::$_1567363878[___270199539(108)][$_2147424121])){ $_515001264= self::$_1567363878[___270199539(109)][$_2147424121];} else{ $_515001264=($_2147424121 == ___270199539(110)? array(___270199539(111)): array(___270199539(112)));} $_1982077469[$_2147424121]= array( ___270199539(113) => $_515001264[(852-2*426)], ___270199539(114) => $_515001264[round(0+0.25+0.25+0.25+0.25)], ___270199539(115) => array(),); $_1982077469[$_2147424121][___270199539(116)]= false; if($_1982077469[$_2147424121][___270199539(117)] == ___270199539(118)){ $_1982077469[$_2147424121][___270199539(119)]= $GLOBALS['____548304171'][39](($GLOBALS['____548304171'][40]()- $_1982077469[$_2147424121][___270199539(120)])/ round(0+43200+43200)); if($_1982077469[$_2147424121][___270199539(121)]> self::$_1018899762) $_1982077469[$_2147424121][___270199539(122)]= true;} foreach($_975393077 as $_600215437) $_1982077469[$_2147424121][___270199539(123)][$_600215437]=(!isset(self::$_1567363878[___270199539(124)][$_600215437]) || self::$_1567363878[___270199539(125)][$_600215437]);} return $_1982077469;} private static function __1840753651($_1982075834, $_1675612174){ if(IsModuleInstalled($_1982075834) == $_1675612174) return true; $_527153933= $_SERVER[___270199539(126)].___270199539(127).$_1982075834.___270199539(128); if(!$GLOBALS['____548304171'][41]($_527153933)) return false; include_once($_527153933); $_1001049645= $GLOBALS['____548304171'][42](___270199539(129), ___270199539(130), $_1982075834); if(!$GLOBALS['____548304171'][43]($_1001049645)) return false; $_42173769= new $_1001049645; if($_1675612174){ if(!$_42173769->InstallDB()) return false; $_42173769->InstallEvents(); if(!$_42173769->InstallFiles()) return false;} else{ if(CModule::IncludeModule(___270199539(131))) CSearch::DeleteIndex($_1982075834); UnRegisterModule($_1982075834);} return true;} protected static function OnRequestsSettingsChange($_600215437, $_1804741422){ self::__1840753651("form", $_1804741422);} protected static function OnLearningSettingsChange($_600215437, $_1804741422){ self::__1840753651("learning", $_1804741422);} protected static function OnJabberSettingsChange($_600215437, $_1804741422){ self::__1840753651("xmpp", $_1804741422);} protected static function OnVideoConferenceSettingsChange($_600215437, $_1804741422){ self::__1840753651("video", $_1804741422);} protected static function OnBizProcSettingsChange($_600215437, $_1804741422){ self::__1840753651("bizprocdesigner", $_1804741422);} protected static function OnListsSettingsChange($_600215437, $_1804741422){ self::__1840753651("lists", $_1804741422);} protected static function OnWikiSettingsChange($_600215437, $_1804741422){ self::__1840753651("wiki", $_1804741422);} protected static function OnSupportSettingsChange($_600215437, $_1804741422){ self::__1840753651("support", $_1804741422);} protected static function OnControllerSettingsChange($_600215437, $_1804741422){ self::__1840753651("controller", $_1804741422);} protected static function OnAnalyticsSettingsChange($_600215437, $_1804741422){ self::__1840753651("statistic", $_1804741422);} protected static function OnVoteSettingsChange($_600215437, $_1804741422){ self::__1840753651("vote", $_1804741422);} protected static function OnFriendsSettingsChange($_600215437, $_1804741422){ if($_1804741422) $_845474130= "Y"; else $_845474130= ___270199539(132); $_1588798985= CSite::GetList(___270199539(133), ___270199539(134), array(___270199539(135) => ___270199539(136))); while($_1441293837= $_1588798985->Fetch()){ if(COption::GetOptionString(___270199539(137), ___270199539(138), ___270199539(139), $_1441293837[___270199539(140)]) != $_845474130){ COption::SetOptionString(___270199539(141), ___270199539(142), $_845474130, false, $_1441293837[___270199539(143)]); COption::SetOptionString(___270199539(144), ___270199539(145), $_845474130);}}} protected static function OnMicroBlogSettingsChange($_600215437, $_1804741422){ if($_1804741422) $_845474130= "Y"; else $_845474130= ___270199539(146); $_1588798985= CSite::GetList(___270199539(147), ___270199539(148), array(___270199539(149) => ___270199539(150))); while($_1441293837= $_1588798985->Fetch()){ if(COption::GetOptionString(___270199539(151), ___270199539(152), ___270199539(153), $_1441293837[___270199539(154)]) != $_845474130){ COption::SetOptionString(___270199539(155), ___270199539(156), $_845474130, false, $_1441293837[___270199539(157)]); COption::SetOptionString(___270199539(158), ___270199539(159), $_845474130);} if(COption::GetOptionString(___270199539(160), ___270199539(161), ___270199539(162), $_1441293837[___270199539(163)]) != $_845474130){ COption::SetOptionString(___270199539(164), ___270199539(165), $_845474130, false, $_1441293837[___270199539(166)]); COption::SetOptionString(___270199539(167), ___270199539(168), $_845474130);}}} protected static function OnPersonalFilesSettingsChange($_600215437, $_1804741422){ if($_1804741422) $_845474130= "Y"; else $_845474130= ___270199539(169); $_1588798985= CSite::GetList(___270199539(170), ___270199539(171), array(___270199539(172) => ___270199539(173))); while($_1441293837= $_1588798985->Fetch()){ if(COption::GetOptionString(___270199539(174), ___270199539(175), ___270199539(176), $_1441293837[___270199539(177)]) != $_845474130){ COption::SetOptionString(___270199539(178), ___270199539(179), $_845474130, false, $_1441293837[___270199539(180)]); COption::SetOptionString(___270199539(181), ___270199539(182), $_845474130);}}} protected static function OnPersonalBlogSettingsChange($_600215437, $_1804741422){ if($_1804741422) $_845474130= "Y"; else $_845474130= ___270199539(183); $_1588798985= CSite::GetList(___270199539(184), ___270199539(185), array(___270199539(186) => ___270199539(187))); while($_1441293837= $_1588798985->Fetch()){ if(COption::GetOptionString(___270199539(188), ___270199539(189), ___270199539(190), $_1441293837[___270199539(191)]) != $_845474130){ COption::SetOptionString(___270199539(192), ___270199539(193), $_845474130, false, $_1441293837[___270199539(194)]); COption::SetOptionString(___270199539(195), ___270199539(196), $_845474130);}}} protected static function OnPersonalPhotoSettingsChange($_600215437, $_1804741422){ if($_1804741422) $_845474130= "Y"; else $_845474130= ___270199539(197); $_1588798985= CSite::GetList(___270199539(198), ___270199539(199), array(___270199539(200) => ___270199539(201))); while($_1441293837= $_1588798985->Fetch()){ if(COption::GetOptionString(___270199539(202), ___270199539(203), ___270199539(204), $_1441293837[___270199539(205)]) != $_845474130){ COption::SetOptionString(___270199539(206), ___270199539(207), $_845474130, false, $_1441293837[___270199539(208)]); COption::SetOptionString(___270199539(209), ___270199539(210), $_845474130);}}} protected static function OnPersonalForumSettingsChange($_600215437, $_1804741422){ if($_1804741422) $_845474130= "Y"; else $_845474130= ___270199539(211); $_1588798985= CSite::GetList(___270199539(212), ___270199539(213), array(___270199539(214) => ___270199539(215))); while($_1441293837= $_1588798985->Fetch()){ if(COption::GetOptionString(___270199539(216), ___270199539(217), ___270199539(218), $_1441293837[___270199539(219)]) != $_845474130){ COption::SetOptionString(___270199539(220), ___270199539(221), $_845474130, false, $_1441293837[___270199539(222)]); COption::SetOptionString(___270199539(223), ___270199539(224), $_845474130);}}} protected static function OnTasksSettingsChange($_600215437, $_1804741422){ if($_1804741422) $_845474130= "Y"; else $_845474130= ___270199539(225); $_1588798985= CSite::GetList(___270199539(226), ___270199539(227), array(___270199539(228) => ___270199539(229))); while($_1441293837= $_1588798985->Fetch()){ if(COption::GetOptionString(___270199539(230), ___270199539(231), ___270199539(232), $_1441293837[___270199539(233)]) != $_845474130){ COption::SetOptionString(___270199539(234), ___270199539(235), $_845474130, false, $_1441293837[___270199539(236)]); COption::SetOptionString(___270199539(237), ___270199539(238), $_845474130);} if(COption::GetOptionString(___270199539(239), ___270199539(240), ___270199539(241), $_1441293837[___270199539(242)]) != $_845474130){ COption::SetOptionString(___270199539(243), ___270199539(244), $_845474130, false, $_1441293837[___270199539(245)]); COption::SetOptionString(___270199539(246), ___270199539(247), $_845474130);}} self::__1840753651(___270199539(248), $_1804741422);} protected static function OnCalendarSettingsChange($_600215437, $_1804741422){ if($_1804741422) $_845474130= "Y"; else $_845474130= ___270199539(249); $_1588798985= CSite::GetList(___270199539(250), ___270199539(251), array(___270199539(252) => ___270199539(253))); while($_1441293837= $_1588798985->Fetch()){ if(COption::GetOptionString(___270199539(254), ___270199539(255), ___270199539(256), $_1441293837[___270199539(257)]) != $_845474130){ COption::SetOptionString(___270199539(258), ___270199539(259), $_845474130, false, $_1441293837[___270199539(260)]); COption::SetOptionString(___270199539(261), ___270199539(262), $_845474130);} if(COption::GetOptionString(___270199539(263), ___270199539(264), ___270199539(265), $_1441293837[___270199539(266)]) != $_845474130){ COption::SetOptionString(___270199539(267), ___270199539(268), $_845474130, false, $_1441293837[___270199539(269)]); COption::SetOptionString(___270199539(270), ___270199539(271), $_845474130);}}} protected static function OnSMTPSettingsChange($_600215437, $_1804741422){ self::__1840753651("mail", $_1804741422);} protected static function OnExtranetSettingsChange($_600215437, $_1804741422){ $_2018582497= COption::GetOptionString("extranet", "extranet_site", ""); if($_2018582497){ $_1924687473= new CSite; $_1924687473->Update($_2018582497, array(___270199539(272) =>($_1804741422? ___270199539(273): ___270199539(274))));} self::__1840753651(___270199539(275), $_1804741422);} protected static function OnDAVSettingsChange($_600215437, $_1804741422){ self::__1840753651("dav", $_1804741422);} protected static function OntimemanSettingsChange($_600215437, $_1804741422){ self::__1840753651("timeman", $_1804741422);} protected static function Onintranet_sharepointSettingsChange($_600215437, $_1804741422){ if($_1804741422){ RegisterModuleDependences("iblock", "OnAfterIBlockElementAdd", "intranet", "CIntranetEventHandlers", "SPRegisterUpdatedItem"); RegisterModuleDependences(___270199539(276), ___270199539(277), ___270199539(278), ___270199539(279), ___270199539(280)); CAgent::AddAgent(___270199539(281), ___270199539(282), ___270199539(283), round(0+100+100+100+100+100)); CAgent::AddAgent(___270199539(284), ___270199539(285), ___270199539(286), round(0+150+150)); CAgent::AddAgent(___270199539(287), ___270199539(288), ___270199539(289), round(0+900+900+900+900));} else{ UnRegisterModuleDependences(___270199539(290), ___270199539(291), ___270199539(292), ___270199539(293), ___270199539(294)); UnRegisterModuleDependences(___270199539(295), ___270199539(296), ___270199539(297), ___270199539(298), ___270199539(299)); CAgent::RemoveAgent(___270199539(300), ___270199539(301)); CAgent::RemoveAgent(___270199539(302), ___270199539(303)); CAgent::RemoveAgent(___270199539(304), ___270199539(305));}} protected static function OncrmSettingsChange($_600215437, $_1804741422){ if($_1804741422) COption::SetOptionString("crm", "form_features", "Y"); self::__1840753651(___270199539(306), $_1804741422);} protected static function OnClusterSettingsChange($_600215437, $_1804741422){ self::__1840753651("cluster", $_1804741422);} protected static function OnMultiSitesSettingsChange($_600215437, $_1804741422){ if($_1804741422) RegisterModuleDependences("main", "OnBeforeProlog", "main", "CWizardSolPanelIntranet", "ShowPanel", 100, "/modules/intranet/panel_button.php"); else UnRegisterModuleDependences(___270199539(307), ___270199539(308), ___270199539(309), ___270199539(310), ___270199539(311), ___270199539(312));} protected static function OnIdeaSettingsChange($_600215437, $_1804741422){ self::__1840753651("idea", $_1804741422);} protected static function OnMeetingSettingsChange($_600215437, $_1804741422){ self::__1840753651("meeting", $_1804741422);} protected static function OnXDImportSettingsChange($_600215437, $_1804741422){ self::__1840753651("xdimport", $_1804741422);}} $GLOBALS['____548304171'][44](___270199539(313), ___270199539(314));/**/			//Do not remove this

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

/*ZDUyZmZZTM1ZDhhNDk2YTdjYjMzNzlkZmI3MTA2MGQ1YThiNjc=*/$GLOBALS['____1741090209']= array(base64_decode('bXRfcmFuZA'.'=='),base64_decode('Z'.'XhwbG9kZ'.'Q='.'='),base64_decode('cGFjaw'.'=='),base64_decode('bWQ'.'1'),base64_decode('Y'.'29uc3RhbnQ='),base64_decode('a'.'GFzaF'.'9obWFj'),base64_decode('c3RyY21w'),base64_decode('aX'.'Nfb2Jq'.'ZW'.'N0'),base64_decode('Y'.'2Fsb'.'F91c'.'2V'.'yX'.'2'.'Z1'.'b'.'mM='),base64_decode('Y2F'.'sbF'.'9'.'1c2VyX'.'2Z1bmM='),base64_decode(''.'Y2FsbF91c2VyX2Z1bmM='),base64_decode(''.'Y'.'2FsbF'.'91c2Vy'.'X2Z1bmM='),base64_decode('Y2Fs'.'bF91'.'c2Vy'.'X'.'2Z1bmM='));if(!function_exists(__NAMESPACE__.'\\___1807195369')){function ___1807195369($_1371020623){static $_671112880= false; if($_671112880 == false) $_671112880=array('REI'.'=','U0VMRUNUI'.'FZBTFVF'.'IEZ'.'ST0'.'0'.'gYl9vcHRpb'.'24gV0'.'h'.'FUkUgTkFN'.'RT0nfl'.'B'.'BUkFNX01BWF9VU'.'0VS'.'Uy'.'c'.'gQU5EIE1PRFV'.'M'.'RV9JRD'.'0nbWFpbic'.'gQU5'.'EIFNJV'.'EV'.'fSUQgSVMgTlV'.'MT'.'A==','VkFMV'.'UU=',''.'Lg==','SCo'.'=','Yml0c'.'ml4','TElD'.'RU'.'5'.'TRV'.'9LRV'.'k=','c2hhMjU2','VVNFUg==',''.'VVNF'.'Ug==','VVNF'.'Ug==','SXNB'.'dXR'.'ob3JpemVk',''.'V'.'VNFU'.'g==','SXN'.'B'.'ZG'.'1'.'p'.'bg==','Q'.'VBQTElDQVRJT'.'04=','UmVzdG'.'Fy'.'dEJ'.'1ZmZlcg==','TG9jY'.'WxSZWR'.'pcm'.'VjdA==',''.'L2'.'xpY2'.'Vu'.'c'.'2Vf'.'cmVzdH'.'JpY3Rpb'.'24uc'.'Gh'.'w',''.'XEJpdHJpe'.'FxN'.'YWluX'.'EN'.'vbmZpZ1xPcHRpb24'.'6O'.'nNldA==','bWFpbg'.'==','UE'.'F'.'S'.'QU1'.'fTUFYX1VTR'.'VJT');return base64_decode($_671112880[$_1371020623]);}};if($GLOBALS['____1741090209'][0](round(0+0.25+0.25+0.25+0.25), round(0+10+10)) == round(0+1.4+1.4+1.4+1.4+1.4)){ $_1476454034= $GLOBALS[___1807195369(0)]->Query(___1807195369(1), true); if($_885344925= $_1476454034->Fetch()){ $_461482779= $_885344925[___1807195369(2)]; list($_1208828225, $_1684906182)= $GLOBALS['____1741090209'][1](___1807195369(3), $_461482779); $_770214477= $GLOBALS['____1741090209'][2](___1807195369(4), $_1208828225); $_1780234091= ___1807195369(5).$GLOBALS['____1741090209'][3]($GLOBALS['____1741090209'][4](___1807195369(6))); $_324995636= $GLOBALS['____1741090209'][5](___1807195369(7), $_1684906182, $_1780234091, true); if($GLOBALS['____1741090209'][6]($_324995636, $_770214477) !== min(76,0,25.333333333333)){ if(isset($GLOBALS[___1807195369(8)]) && $GLOBALS['____1741090209'][7]($GLOBALS[___1807195369(9)]) && $GLOBALS['____1741090209'][8](array($GLOBALS[___1807195369(10)], ___1807195369(11))) &&!$GLOBALS['____1741090209'][9](array($GLOBALS[___1807195369(12)], ___1807195369(13)))){ $GLOBALS['____1741090209'][10](array($GLOBALS[___1807195369(14)], ___1807195369(15))); $GLOBALS['____1741090209'][11](___1807195369(16), ___1807195369(17), true);}}} else{ $GLOBALS['____1741090209'][12](___1807195369(18), ___1807195369(19), ___1807195369(20), round(0+3+3+3+3));}}/**/       //Do not remove this

