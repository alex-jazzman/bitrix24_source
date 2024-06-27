<?php

/**
 * Bitrix Framework
 * @package bitrix
 * @subpackage main
 * @copyright 2001-2024 Bitrix
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

/*ZDUyZmZYmQ0YWQ3MjM4ZDY0OWY0NTg3OTgyYTUzZDA5OTJiZDE=*/$GLOBALS['_____157554394']= array(base64_decode('R2V0TW9'.'kdWxlRXZlbnRz'),base64_decode(''.'RXh'.'lY3V0'.'ZU1vZHVsZUV'.'2ZW5'.'0RXg='));$GLOBALS['____1212555486']= array(base64_decode('Z'.'GVmaW5l'),base64_decode('YmFzZTY'.'0X2RlY'.'29k'.'ZQ=='),base64_decode('dW5zZX'.'JpYWxpemU='),base64_decode('a'.'XN'.'fYXJyY'.'Xk='),base64_decode('aW'.'5fYXJy'.'YXk='),base64_decode('c2VyaWFsaXpl'),base64_decode('YmFzZTY0X2VuY'.'29k'.'ZQ='.'='),base64_decode('b'.'Wt0aW1l'),base64_decode('ZGF0ZQ=='),base64_decode('ZGF0ZQ='.'='),base64_decode('c3Ryb'.'G'.'Vu'),base64_decode('bWt0aW1l'),base64_decode(''.'ZG'.'F0'.'ZQ=='),base64_decode(''.'Z'.'GF0'.'Z'.'Q='.'='),base64_decode('bWV0'.'a'.'G9'.'kX2'.'V4a'.'XN'.'0'.'c'.'w=='),base64_decode('Y2FsbF9'.'1c'.'2VyX'.'2Z1b'.'mN'.'fYXJ'.'yYXk='),base64_decode('c3'.'RybGVu'),base64_decode('c2'.'VyaWFsaXpl'),base64_decode('Ym'.'FzZTY0X'.'2VuY'.'29kZQ'.'=='),base64_decode('c3R'.'ybGV'.'u'),base64_decode('aXNfY'.'XJyYX'.'k='),base64_decode('c2V'.'yaWFsa'.'Xpl'),base64_decode('Y'.'mF'.'zZ'.'TY0X2VuY29kZ'.'Q=='),base64_decode('c2VyaW'.'Fsa'.'Xpl'),base64_decode('YmFzZ'.'TY0X2'.'VuY29kZQ=='),base64_decode('aXNfYX'.'JyYXk='),base64_decode('aXNfYXJyYXk='),base64_decode('aW'.'5'.'fYXJyYXk='),base64_decode('aW5f'.'YXJ'.'yY'.'X'.'k='),base64_decode('bWt0aW1l'),base64_decode('ZGF0ZQ'.'=='),base64_decode('ZGF0ZQ='.'='),base64_decode('ZGF0ZQ=='),base64_decode('bWt0a'.'W'.'1l'),base64_decode('ZGF0ZQ='.'='),base64_decode('ZGF0ZQ=='),base64_decode('aW5fYXJ'.'yYX'.'k='),base64_decode('c'.'2'.'V'.'ya'.'WFsaXp'.'l'),base64_decode('Ym'.'Fz'.'ZTY0X2VuY29k'.'ZQ'.'=='),base64_decode('aW50dmFs'),base64_decode('dG'.'ltZQ'.'=='),base64_decode(''.'ZmlsZV9leGlz'.'dH'.'M='),base64_decode('c3RyX3JlcG'.'xhY2U='),base64_decode('Y2xhc3NfZ'.'Xhpc3Rz'),base64_decode('ZGVmaW5l'));if(!function_exists(__NAMESPACE__.'\\___1246552267')){function ___1246552267($_1374375992){static $_143352420= false; if($_143352420 == false) $_143352420=array('SU5'.'UUkFOR'.'VRf'.'RU'.'RJVElPTg==','W'.'Q==','b'.'WFp'.'bg==','fmNwZl9tYX'.'BfdmFsdWU=','','',''.'YWxs'.'b3dlZF'.'9'.'jbGFzc2Vz',''.'ZQ==','Zg'.'==','ZQ==',''.'Rg==','WA==','Zg==',''.'bWF'.'pbg==',''.'fmN'.'wZl9tYXBfdmFsdWU=','UG'.'9ydGF'.'s','Rg==','ZQ==','ZQ'.'==','W'.'A==','Rg==','RA==','RA==','bQ==','Z'.'A==','WQ==','Zg'.'==','Zg='.'=','Zg==','Zg==','UG'.'9ydGFs','Rg'.'='.'=',''.'ZQ'.'==','ZQ='.'=','WA==','Rg==','RA'.'==','RA==','bQ='.'=','Z'.'A'.'==','WQ='.'=',''.'bWF'.'pbg==',''.'T24'.'=',''.'U'.'2'.'V0'.'dG'.'luZ3NDaG'.'F'.'uZ2'.'U=',''.'Zg'.'==',''.'Zg='.'=','Zg='.'=','Z'.'g==','bWF'.'pbg==','fmNwZl9tYXBfd'.'m'.'FsdWU'.'=',''.'ZQ='.'=','ZQ==','RA==','ZQ==','ZQ==',''.'Zg'.'==','Zg==','Zg==','Z'.'Q==','bWFpb'.'g'.'==','fmNwZl9tYXBfd'.'mFsd'.'W'.'U=','ZQ==','Z'.'g==','Zg'.'==','Zg==','Z'.'g'.'==','bW'.'Fpbg==',''.'fmNwZl9'.'t'.'YXBfdmFsdW'.'U=','ZQ==','Zg==',''.'UG9'.'ydGFs','UG'.'9'.'ydGF'.'s','ZQ='.'=','ZQ==','U'.'G9ydG'.'Fs','Rg'.'='.'=','WA==','Rg='.'=','RA==',''.'ZQ'.'==','Z'.'Q='.'=','RA==','bQ==','ZA==','WQ==','ZQ==','W'.'A==','Z'.'Q==','Rg==','Z'.'Q==','R'.'A==','Zg==','ZQ==',''.'R'.'A==','ZQ='.'=',''.'bQ==',''.'ZA==','WQ==','Zg==',''.'Zg==','Zg='.'=','Zg==','Zg==',''.'Zg==',''.'Z'.'g==','Z'.'g==','bWFpbg==','fmNwZl9'.'tY'.'X'.'Bf'.'d'.'mFs'.'dWU=','ZQ'.'==',''.'ZQ'.'==',''.'UG9y'.'dGFs','Rg'.'==','WA==','VFl'.'QRQ==','R'.'E'.'FURQ='.'=','R'.'kVBVFV'.'SR'.'VM=','RVhQSVJFRA==','VFl'.'Q'.'R'.'Q==','RA==','VF'.'JZX'.'0R'.'B'.'WVNfQ0'.'9VTlQ=','REFUR'.'Q==','VFJZ'.'X0RBW'.'V'.'NfQ09VTl'.'Q'.'=','RVhQS'.'VJFR'.'A'.'==','Rk'.'VBVFV'.'SRVM'.'=','Zg==','Zg==','RE9DVU'.'1FTl'.'R'.'fUk9'.'PV'.'A==','L2'.'JpdHJp'.'eC9'.'tb2R1bGVzLw==','L'.'2'.'luc3R'.'h'.'b'.'GwvaW5kZXgucGhw','Lg==','Xw'.'==',''.'c2VhcmNo','Tg='.'=','','','QUNUSVZ'.'F','WQ==',''.'c2'.'9jaWFsb'.'m'.'V0d29ya'.'w==','YWxsb3dfZnJp'.'Z'.'Wxkcw'.'==','WQ'.'==','SUQ=',''.'c29ja'.'W'.'FsbmV0d'.'29yaw==','Y'.'Wxsb3dfZn'.'JpZWxkc'.'w==','SUQ=','c29jaWF'.'sbmV'.'0d29y'.'aw='.'=','YWx'.'s'.'b3df'.'ZnJpZ'.'Wxkcw==',''.'Tg='.'=','','',''.'QUNU'.'SVZ'.'F','WQ='.'=','c2'.'9jaWFsbmV0d29y'.'a'.'w==','YWxsb3dfbWlj'.'cm9ib'.'G9nX'.'3'.'VzZXI=','WQ==',''.'SU'.'Q=','c'.'2'.'9ja'.'W'.'FsbmV0d29ya'.'w==',''.'YWxsb3dfbW'.'ljcm9ibG9'.'nX3VzZXI=',''.'SUQ=','c29jaW'.'FsbmV0d29yaw==',''.'YWx'.'s'.'b'.'3d'.'fbWljc'.'m'.'9ib'.'G9nX3VzZ'.'XI=','c29'.'ja'.'WFsb'.'mV0'.'d'.'29'.'yaw==',''.'YWxs'.'b3df'.'bW'.'lj'.'c'.'m9i'.'bG9nX2'.'dyb3Vw','WQ='.'=','SUQ=','c'.'2'.'9jaW'.'F'.'sbmV0'.'d29y'.'aw='.'=','YWxsb'.'3df'.'bW'.'lj'.'c'.'m9ibG9n'.'X2dyb3Vw','SUQ=',''.'c2'.'9jaWFsb'.'mV0d'.'29yaw==','YWxsb'.'3'.'dfb'.'Wljcm9i'.'b'.'G9nX2dy'.'b3V'.'w','T'.'g==','','','QUNUS'.'VZF',''.'WQ'.'==','c29jaWF'.'s'.'bmV'.'0'.'d29yaw'.'='.'=','YW'.'xsb3dfZmlsZX'.'Nf'.'dXNlcg='.'=','WQ==','S'.'UQ'.'=','c29jaW'.'FsbmV0'.'d29yaw==','YWxsb'.'3dfZml'.'sZXNfdX'.'Nl'.'c'.'g='.'=',''.'SUQ=','c29'.'ja'.'WFsb'.'mV0d29yaw='.'=',''.'YWxsb3d'.'fZm'.'lsZXNfdXNl'.'cg==','T'.'g='.'=','','','QUNUSVZF',''.'WQ==',''.'c29jaWFsbmV0d29yaw==','YWxs'.'b3d'.'f'.'YmxvZ19'.'1'.'c2'.'Vy',''.'WQ='.'=','SUQ=','c'.'29ja'.'WFsbmV0d29ya'.'w='.'=','Y'.'Wxsb3dfYmx'.'vZ19'.'1'.'c2Vy','SU'.'Q=','c29'.'jaWFsbmV0d29ya'.'w==','YWxsb'.'3d'.'fYmxvZ'.'19'.'1c2Vy','Tg==','','','Q'.'UNUSVZF','WQ==',''.'c'.'29jaWFsb'.'mV0d29'.'yaw='.'=',''.'YWxsb3dfcGhvd'.'G'.'9'.'fdXN'.'lcg==','WQ='.'=','S'.'UQ=','c29j'.'aW'.'F'.'s'.'bmV'.'0'.'d'.'29yaw==','Y'.'Wxsb3df'.'cGh'.'vdG9fdXNlcg='.'=','SU'.'Q=',''.'c29ja'.'W'.'Fsb'.'mV'.'0d29yaw'.'==','YW'.'xs'.'b'.'3d'.'f'.'cG'.'hvdG9fdXNlcg==',''.'T'.'g='.'=','','','QUN'.'USVZF','WQ==','c29'.'jaWFsbmV0d'.'29yaw='.'=',''.'YWxsb3dfZ'.'m9ydW1fdXNl'.'cg==','WQ==',''.'SUQ=','c2'.'9jaW'.'Fsb'.'mV'.'0d29'.'y'.'aw==','Y'.'Wxsb3d'.'fZm9ydW1'.'fdXNlc'.'g'.'='.'=','SU'.'Q=','c29jaWF'.'sb'.'mV'.'0d'.'29yaw==','YWxs'.'b3'.'d'.'fZm9ydW1fdXNlc'.'g'.'==','Tg'.'==','','','QUN'.'USVZF','WQ==','c29jaWFs'.'b'.'mV0d2'.'9'.'y'.'aw='.'=','YWx'.'sb'.'3df'.'dG'.'F'.'za'.'3NfdXNlc'.'g'.'==','WQ==',''.'SUQ=','c29'.'jaW'.'FsbmV'.'0d'.'29y'.'aw==','Y'.'Wxsb'.'3dfd'.'GFza3N'.'fdX'.'N'.'lcg='.'=',''.'SUQ=','c29'.'ja'.'WFsbmV0d29yaw==','YWxsb3df'.'dGFza3NfdXNlcg==','c2'.'9ja'.'WFsbmV'.'0d29yaw'.'==',''.'Y'.'Wxsb3d'.'fd'.'GFza3'.'NfZ3JvdXA=','W'.'Q==','SU'.'Q=','c29'.'jaWFsbm'.'V0d29yaw==','YWxs'.'b3dfdGFza3N'.'fZ3JvdXA=','SU'.'Q'.'=',''.'c29jaWFsbmV0d29'.'y'.'aw='.'=','YWxsb'.'3dfdGFza3N'.'fZ3JvdXA'.'=','dG'.'Fza'.'3M=','Tg==','','','Q'.'UNUSVZF','WQ='.'=','c29'.'j'.'aW'.'FsbmV'.'0d29yaw'.'==','YWxsb3dfY2FsZW5kY'.'XJfdXNlc'.'g==','W'.'Q'.'='.'=','SUQ=','c29'.'jaWFsbmV'.'0'.'d29ya'.'w==','YWxsb3d'.'fY'.'2FsZW5kYXJfdXNlcg==','SUQ=','c29ja'.'W'.'FsbmV0d29yaw'.'==',''.'YWx'.'sb3dfY2FsZW'.'5kYXJfdX'.'Nlcg='.'=',''.'c29jaW'.'FsbmV0'.'d29ya'.'w==','YWxsb3dfY2FsZW5kYX'.'JfZ'.'3Jv'.'d'.'X'.'A=',''.'W'.'Q==','SU'.'Q=','c'.'29jaWFsbmV0'.'d'.'29yaw'.'='.'=','YWxsb3dfY2F'.'sZW5kYXJfZ3'.'Jvd'.'XA=','SUQ=','c29jaWFsbmV0d2'.'9yaw='.'=','YWxsb3dfY2FsZW5kYXJfZ3JvdX'.'A=','QUNUSVZF','W'.'Q==','Tg==','ZX'.'h'.'0cmFuZXQ=','aW'.'J'.'s'.'b2Nr','T'.'25'.'BZ'.'nRlck'.'lCbG'.'9'.'ja0'.'VsZ'.'W1'.'lbnRVc'.'GRhdGU=','aW50cmFuZX'.'Q'.'=','Q0ludH'.'Jhb'.'m'.'V'.'0RXZ'.'lbnRIY'.'W'.'5kbG'.'Vycw==',''.'U1BSZW'.'dpc3RlclVwZGF'.'0ZWR'.'J'.'dG'.'Vt','Q0ludHJhbmV0'.'U2hhc'.'mVwb2ludD'.'o6QW'.'dl'.'bnRMaXN0cygpOw='.'=','aW'.'50'.'c'.'mFu'.'ZX'.'Q'.'=','Tg'.'==','Q0'.'ludHJhbmV0U2hhcmVwb2l'.'u'.'d'.'Do'.'6QWdlbnRRd'.'WV1ZS'.'gpOw==','aW50cmFu'.'Z'.'XQ=',''.'T'.'g==',''.'Q'.'0'.'l'.'udH'.'JhbmV0'.'U2h'.'hcmVw'.'b2l'.'ud'.'Do6'.'Q'.'Wdl'.'bnRVc'.'GRh'.'dGUoK'.'Ts'.'=','a'.'W'.'50cmFuZ'.'X'.'Q'.'=',''.'Tg==','aW'.'Jsb2Nr','T25BZnRl'.'ckl'.'CbG'.'9ja0VsZW'.'1lbn'.'RBZG'.'Q=','a'.'W50cm'.'FuZX'.'Q=','Q0ludHJhb'.'mV0R'.'X'.'ZlbnRIYW5kbGVy'.'c'.'w'.'==','U1BSZWdp'.'c'.'3Rlcl'.'V'.'w'.'ZGF0ZWRJdGV'.'t','aWJs'.'b2Nr','T25'.'BZnRl'.'ck'.'lCbG9ja0VsZ'.'W1lbnRV'.'cGRhd'.'GU=','aW50cmFuZXQ=',''.'Q0ludH'.'JhbmV0RXZlbnR'.'I'.'YW5kb'.'GVycw'.'='.'=','U1BSZ'.'Wdp'.'c3Rlc'.'lVwZGF'.'0ZWRJdG'.'V'.'t','Q0lud'.'HJhbmV0U2hhcmV'.'wb2l'.'udDo6QWd'.'lbn'.'RMaXN0cygpO'.'w==','aW'.'50'.'cmFuZXQ=',''.'Q0ludHJhb'.'mV0U2'.'hhcm'.'V'.'w'.'b2lu'.'dDo6QWd'.'lbnRRdWV1ZSg'.'pOw==',''.'aW50'.'cmFuZXQ=','Q0ludH'.'Jhb'.'mV0U2h'.'h'.'cm'.'Vwb2ludDo6QWdlbnRVc'.'G'.'Rhd'.'G'.'UoKT'.'s=','aW5'.'0c'.'mF'.'uZXQ=','Y3Jt',''.'bW'.'Fpb'.'g='.'=','T25CZ'.'W'.'Zvcm'.'VQcm9sb2c=',''.'bWFpbg='.'=','Q1dpemFyZFNvb'.'FB'.'hbmVsSW5'.'0cm'.'FuZXQ'.'=','U2h'.'vd1Bh'.'bmVs',''.'L2'.'1vZHV'.'s'.'ZXMvaW'.'50c'.'mF'.'u'.'Z'.'XQ'.'vcGF'.'uZWxf'.'Y'.'nV'.'0dG9'.'u'.'LnBo'.'cA==','RU5'.'DT0RF','WQ==');return base64_decode($_143352420[$_1374375992]);}};$GLOBALS['____1212555486'][0](___1246552267(0), ___1246552267(1));class CBXFeatures{ private static $_601270913= 30; private static $_794076818= array( "Portal" => array( "CompanyCalendar", "CompanyPhoto", "CompanyVideo", "CompanyCareer", "StaffChanges", "StaffAbsence", "CommonDocuments", "MeetingRoomBookingSystem", "Wiki", "Learning", "Vote", "WebLink", "Subscribe", "Friends", "PersonalFiles", "PersonalBlog", "PersonalPhoto", "PersonalForum", "Blog", "Forum", "Gallery", "Board", "MicroBlog", "WebMessenger",), "Communications" => array( "Tasks", "Calendar", "Workgroups", "Jabber", "VideoConference", "Extranet", "SMTP", "Requests", "DAV", "intranet_sharepoint", "timeman", "Idea", "Meeting", "EventList", "Salary", "XDImport",), "Enterprise" => array( "BizProc", "Lists", "Support", "Analytics", "crm", "Controller", "LdapUnlimitedUsers",), "Holding" => array( "Cluster", "MultiSites",),); private static $_943327670= null; private static $_300623870= null; private static function __1716098450(){ if(self::$_943327670 === null){ self::$_943327670= array(); foreach(self::$_794076818 as $_1023742742 => $_687396105){ foreach($_687396105 as $_1819191727) self::$_943327670[$_1819191727]= $_1023742742;}} if(self::$_300623870 === null){ self::$_300623870= array(); $_1634046668= COption::GetOptionString(___1246552267(2), ___1246552267(3), ___1246552267(4)); if($_1634046668 != ___1246552267(5)){ $_1634046668= $GLOBALS['____1212555486'][1]($_1634046668); $_1634046668= $GLOBALS['____1212555486'][2]($_1634046668,[___1246552267(6) => false]); if($GLOBALS['____1212555486'][3]($_1634046668)){ self::$_300623870= $_1634046668;}} if(empty(self::$_300623870)){ self::$_300623870= array(___1246552267(7) => array(), ___1246552267(8) => array());}}} public static function InitiateEditionsSettings($_219865554){ self::__1716098450(); $_1589631509= array(); foreach(self::$_794076818 as $_1023742742 => $_687396105){ $_403200165= $GLOBALS['____1212555486'][4]($_1023742742, $_219865554); self::$_300623870[___1246552267(9)][$_1023742742]=($_403200165? array(___1246552267(10)): array(___1246552267(11))); foreach($_687396105 as $_1819191727){ self::$_300623870[___1246552267(12)][$_1819191727]= $_403200165; if(!$_403200165) $_1589631509[]= array($_1819191727, false);}} $_431409630= $GLOBALS['____1212555486'][5](self::$_300623870); $_431409630= $GLOBALS['____1212555486'][6]($_431409630); COption::SetOptionString(___1246552267(13), ___1246552267(14), $_431409630); foreach($_1589631509 as $_1327407073) self::__389802127($_1327407073[min(188,0,62.666666666667)], $_1327407073[round(0+0.25+0.25+0.25+0.25)]);} public static function IsFeatureEnabled($_1819191727){ if($_1819191727 == '') return true; self::__1716098450(); if(!isset(self::$_943327670[$_1819191727])) return true; if(self::$_943327670[$_1819191727] == ___1246552267(15)) $_74467528= array(___1246552267(16)); elseif(isset(self::$_300623870[___1246552267(17)][self::$_943327670[$_1819191727]])) $_74467528= self::$_300623870[___1246552267(18)][self::$_943327670[$_1819191727]]; else $_74467528= array(___1246552267(19)); if($_74467528[(1208/2-604)] != ___1246552267(20) && $_74467528[(806-2*403)] != ___1246552267(21)){ return false;} elseif($_74467528[(1196/2-598)] == ___1246552267(22)){ if($_74467528[round(0+0.25+0.25+0.25+0.25)]< $GLOBALS['____1212555486'][7]((776-2*388), min(70,0,23.333333333333),(916-2*458), Date(___1246552267(23)), $GLOBALS['____1212555486'][8](___1246552267(24))- self::$_601270913, $GLOBALS['____1212555486'][9](___1246552267(25)))){ if(!isset($_74467528[round(0+0.5+0.5+0.5+0.5)]) ||!$_74467528[round(0+0.4+0.4+0.4+0.4+0.4)]) self::__339376215(self::$_943327670[$_1819191727]); return false;}} return!isset(self::$_300623870[___1246552267(26)][$_1819191727]) || self::$_300623870[___1246552267(27)][$_1819191727];} public static function IsFeatureInstalled($_1819191727){ if($GLOBALS['____1212555486'][10]($_1819191727) <= 0) return true; self::__1716098450(); return(isset(self::$_300623870[___1246552267(28)][$_1819191727]) && self::$_300623870[___1246552267(29)][$_1819191727]);} public static function IsFeatureEditable($_1819191727){ if($_1819191727 == '') return true; self::__1716098450(); if(!isset(self::$_943327670[$_1819191727])) return true; if(self::$_943327670[$_1819191727] == ___1246552267(30)) $_74467528= array(___1246552267(31)); elseif(isset(self::$_300623870[___1246552267(32)][self::$_943327670[$_1819191727]])) $_74467528= self::$_300623870[___1246552267(33)][self::$_943327670[$_1819191727]]; else $_74467528= array(___1246552267(34)); if($_74467528[min(182,0,60.666666666667)] != ___1246552267(35) && $_74467528[(1160/2-580)] != ___1246552267(36)){ return false;} elseif($_74467528[(844-2*422)] == ___1246552267(37)){ if($_74467528[round(0+0.33333333333333+0.33333333333333+0.33333333333333)]< $GLOBALS['____1212555486'][11]((998-2*499),(195*2-390),(960-2*480), Date(___1246552267(38)), $GLOBALS['____1212555486'][12](___1246552267(39))- self::$_601270913, $GLOBALS['____1212555486'][13](___1246552267(40)))){ if(!isset($_74467528[round(0+1+1)]) ||!$_74467528[round(0+2)]) self::__339376215(self::$_943327670[$_1819191727]); return false;}} return true;} private static function __389802127($_1819191727, $_2028676201){ if($GLOBALS['____1212555486'][14]("CBXFeatures", "On".$_1819191727."SettingsChange")) $GLOBALS['____1212555486'][15](array("CBXFeatures", "On".$_1819191727."SettingsChange"), array($_1819191727, $_2028676201)); $_1448034462= $GLOBALS['_____157554394'][0](___1246552267(41), ___1246552267(42).$_1819191727.___1246552267(43)); while($_1356534901= $_1448034462->Fetch()) $GLOBALS['_____157554394'][1]($_1356534901, array($_1819191727, $_2028676201));} public static function SetFeatureEnabled($_1819191727, $_2028676201= true, $_20399479= true){ if($GLOBALS['____1212555486'][16]($_1819191727) <= 0) return; if(!self::IsFeatureEditable($_1819191727)) $_2028676201= false; $_2028676201= (bool)$_2028676201; self::__1716098450(); $_1206555853=(!isset(self::$_300623870[___1246552267(44)][$_1819191727]) && $_2028676201 || isset(self::$_300623870[___1246552267(45)][$_1819191727]) && $_2028676201 != self::$_300623870[___1246552267(46)][$_1819191727]); self::$_300623870[___1246552267(47)][$_1819191727]= $_2028676201; $_431409630= $GLOBALS['____1212555486'][17](self::$_300623870); $_431409630= $GLOBALS['____1212555486'][18]($_431409630); COption::SetOptionString(___1246552267(48), ___1246552267(49), $_431409630); if($_1206555853 && $_20399479) self::__389802127($_1819191727, $_2028676201);} private static function __339376215($_1023742742){ if($GLOBALS['____1212555486'][19]($_1023742742) <= 0 || $_1023742742 == "Portal") return; self::__1716098450(); if(!isset(self::$_300623870[___1246552267(50)][$_1023742742]) || self::$_300623870[___1246552267(51)][$_1023742742][(207*2-414)] != ___1246552267(52)) return; if(isset(self::$_300623870[___1246552267(53)][$_1023742742][round(0+2)]) && self::$_300623870[___1246552267(54)][$_1023742742][round(0+2)]) return; $_1589631509= array(); if(isset(self::$_794076818[$_1023742742]) && $GLOBALS['____1212555486'][20](self::$_794076818[$_1023742742])){ foreach(self::$_794076818[$_1023742742] as $_1819191727){ if(isset(self::$_300623870[___1246552267(55)][$_1819191727]) && self::$_300623870[___1246552267(56)][$_1819191727]){ self::$_300623870[___1246552267(57)][$_1819191727]= false; $_1589631509[]= array($_1819191727, false);}} self::$_300623870[___1246552267(58)][$_1023742742][round(0+0.66666666666667+0.66666666666667+0.66666666666667)]= true;} $_431409630= $GLOBALS['____1212555486'][21](self::$_300623870); $_431409630= $GLOBALS['____1212555486'][22]($_431409630); COption::SetOptionString(___1246552267(59), ___1246552267(60), $_431409630); foreach($_1589631509 as $_1327407073) self::__389802127($_1327407073[min(178,0,59.333333333333)], $_1327407073[round(0+1)]);} public static function ModifyFeaturesSettings($_219865554, $_687396105){ self::__1716098450(); foreach($_219865554 as $_1023742742 => $_1432413771) self::$_300623870[___1246552267(61)][$_1023742742]= $_1432413771; $_1589631509= array(); foreach($_687396105 as $_1819191727 => $_2028676201){ if(!isset(self::$_300623870[___1246552267(62)][$_1819191727]) && $_2028676201 || isset(self::$_300623870[___1246552267(63)][$_1819191727]) && $_2028676201 != self::$_300623870[___1246552267(64)][$_1819191727]) $_1589631509[]= array($_1819191727, $_2028676201); self::$_300623870[___1246552267(65)][$_1819191727]= $_2028676201;} $_431409630= $GLOBALS['____1212555486'][23](self::$_300623870); $_431409630= $GLOBALS['____1212555486'][24]($_431409630); COption::SetOptionString(___1246552267(66), ___1246552267(67), $_431409630); self::$_300623870= false; foreach($_1589631509 as $_1327407073) self::__389802127($_1327407073[min(198,0,66)], $_1327407073[round(0+0.5+0.5)]);} public static function SaveFeaturesSettings($_1757741718, $_226151466){ self::__1716098450(); $_963443155= array(___1246552267(68) => array(), ___1246552267(69) => array()); if(!$GLOBALS['____1212555486'][25]($_1757741718)) $_1757741718= array(); if(!$GLOBALS['____1212555486'][26]($_226151466)) $_226151466= array(); if(!$GLOBALS['____1212555486'][27](___1246552267(70), $_1757741718)) $_1757741718[]= ___1246552267(71); foreach(self::$_794076818 as $_1023742742 => $_687396105){ if(isset(self::$_300623870[___1246552267(72)][$_1023742742])){ $_1123345297= self::$_300623870[___1246552267(73)][$_1023742742];} else{ $_1123345297=($_1023742742 == ___1246552267(74)? array(___1246552267(75)): array(___1246552267(76)));} if($_1123345297[(1176/2-588)] == ___1246552267(77) || $_1123345297[(1284/2-642)] == ___1246552267(78)){ $_963443155[___1246552267(79)][$_1023742742]= $_1123345297;} else{ if($GLOBALS['____1212555486'][28]($_1023742742, $_1757741718)) $_963443155[___1246552267(80)][$_1023742742]= array(___1246552267(81), $GLOBALS['____1212555486'][29](min(48,0,16),(958-2*479), min(144,0,48), $GLOBALS['____1212555486'][30](___1246552267(82)), $GLOBALS['____1212555486'][31](___1246552267(83)), $GLOBALS['____1212555486'][32](___1246552267(84)))); else $_963443155[___1246552267(85)][$_1023742742]= array(___1246552267(86));}} $_1589631509= array(); foreach(self::$_943327670 as $_1819191727 => $_1023742742){ if($_963443155[___1246552267(87)][$_1023742742][(153*2-306)] != ___1246552267(88) && $_963443155[___1246552267(89)][$_1023742742][(966-2*483)] != ___1246552267(90)){ $_963443155[___1246552267(91)][$_1819191727]= false;} else{ if($_963443155[___1246552267(92)][$_1023742742][(205*2-410)] == ___1246552267(93) && $_963443155[___1246552267(94)][$_1023742742][round(0+0.33333333333333+0.33333333333333+0.33333333333333)]< $GLOBALS['____1212555486'][33](min(40,0,13.333333333333),(160*2-320),(888-2*444), Date(___1246552267(95)), $GLOBALS['____1212555486'][34](___1246552267(96))- self::$_601270913, $GLOBALS['____1212555486'][35](___1246552267(97)))) $_963443155[___1246552267(98)][$_1819191727]= false; else $_963443155[___1246552267(99)][$_1819191727]= $GLOBALS['____1212555486'][36]($_1819191727, $_226151466); if(!isset(self::$_300623870[___1246552267(100)][$_1819191727]) && $_963443155[___1246552267(101)][$_1819191727] || isset(self::$_300623870[___1246552267(102)][$_1819191727]) && $_963443155[___1246552267(103)][$_1819191727] != self::$_300623870[___1246552267(104)][$_1819191727]) $_1589631509[]= array($_1819191727, $_963443155[___1246552267(105)][$_1819191727]);}} $_431409630= $GLOBALS['____1212555486'][37]($_963443155); $_431409630= $GLOBALS['____1212555486'][38]($_431409630); COption::SetOptionString(___1246552267(106), ___1246552267(107), $_431409630); self::$_300623870= false; foreach($_1589631509 as $_1327407073) self::__389802127($_1327407073[(200*2-400)], $_1327407073[round(0+0.5+0.5)]);} public static function GetFeaturesList(){ self::__1716098450(); $_1290954602= array(); foreach(self::$_794076818 as $_1023742742 => $_687396105){ if(isset(self::$_300623870[___1246552267(108)][$_1023742742])){ $_1123345297= self::$_300623870[___1246552267(109)][$_1023742742];} else{ $_1123345297=($_1023742742 == ___1246552267(110)? array(___1246552267(111)): array(___1246552267(112)));} $_1290954602[$_1023742742]= array( ___1246552267(113) => $_1123345297[min(92,0,30.666666666667)], ___1246552267(114) => $_1123345297[round(0+1)], ___1246552267(115) => array(),); $_1290954602[$_1023742742][___1246552267(116)]= false; if($_1290954602[$_1023742742][___1246552267(117)] == ___1246552267(118)){ $_1290954602[$_1023742742][___1246552267(119)]= $GLOBALS['____1212555486'][39](($GLOBALS['____1212555486'][40]()- $_1290954602[$_1023742742][___1246552267(120)])/ round(0+86400)); if($_1290954602[$_1023742742][___1246552267(121)]> self::$_601270913) $_1290954602[$_1023742742][___1246552267(122)]= true;} foreach($_687396105 as $_1819191727) $_1290954602[$_1023742742][___1246552267(123)][$_1819191727]=(!isset(self::$_300623870[___1246552267(124)][$_1819191727]) || self::$_300623870[___1246552267(125)][$_1819191727]);} return $_1290954602;} private static function __264195497($_341611011, $_1063556649){ if(IsModuleInstalled($_341611011) == $_1063556649) return true; $_1576486330= $_SERVER[___1246552267(126)].___1246552267(127).$_341611011.___1246552267(128); if(!$GLOBALS['____1212555486'][41]($_1576486330)) return false; include_once($_1576486330); $_543194164= $GLOBALS['____1212555486'][42](___1246552267(129), ___1246552267(130), $_341611011); if(!$GLOBALS['____1212555486'][43]($_543194164)) return false; $_898987878= new $_543194164; if($_1063556649){ if(!$_898987878->InstallDB()) return false; $_898987878->InstallEvents(); if(!$_898987878->InstallFiles()) return false;} else{ if(CModule::IncludeModule(___1246552267(131))) CSearch::DeleteIndex($_341611011); UnRegisterModule($_341611011);} return true;} protected static function OnRequestsSettingsChange($_1819191727, $_2028676201){ self::__264195497("form", $_2028676201);} protected static function OnLearningSettingsChange($_1819191727, $_2028676201){ self::__264195497("learning", $_2028676201);} protected static function OnJabberSettingsChange($_1819191727, $_2028676201){ self::__264195497("xmpp", $_2028676201);} protected static function OnVideoConferenceSettingsChange($_1819191727, $_2028676201){ self::__264195497("video", $_2028676201);} protected static function OnBizProcSettingsChange($_1819191727, $_2028676201){ self::__264195497("bizprocdesigner", $_2028676201);} protected static function OnListsSettingsChange($_1819191727, $_2028676201){ self::__264195497("lists", $_2028676201);} protected static function OnWikiSettingsChange($_1819191727, $_2028676201){ self::__264195497("wiki", $_2028676201);} protected static function OnSupportSettingsChange($_1819191727, $_2028676201){ self::__264195497("support", $_2028676201);} protected static function OnControllerSettingsChange($_1819191727, $_2028676201){ self::__264195497("controller", $_2028676201);} protected static function OnAnalyticsSettingsChange($_1819191727, $_2028676201){ self::__264195497("statistic", $_2028676201);} protected static function OnVoteSettingsChange($_1819191727, $_2028676201){ self::__264195497("vote", $_2028676201);} protected static function OnFriendsSettingsChange($_1819191727, $_2028676201){ if($_2028676201) $_1155552336= "Y"; else $_1155552336= ___1246552267(132); $_2072639362= CSite::GetList(___1246552267(133), ___1246552267(134), array(___1246552267(135) => ___1246552267(136))); while($_1652209018= $_2072639362->Fetch()){ if(COption::GetOptionString(___1246552267(137), ___1246552267(138), ___1246552267(139), $_1652209018[___1246552267(140)]) != $_1155552336){ COption::SetOptionString(___1246552267(141), ___1246552267(142), $_1155552336, false, $_1652209018[___1246552267(143)]); COption::SetOptionString(___1246552267(144), ___1246552267(145), $_1155552336);}}} protected static function OnMicroBlogSettingsChange($_1819191727, $_2028676201){ if($_2028676201) $_1155552336= "Y"; else $_1155552336= ___1246552267(146); $_2072639362= CSite::GetList(___1246552267(147), ___1246552267(148), array(___1246552267(149) => ___1246552267(150))); while($_1652209018= $_2072639362->Fetch()){ if(COption::GetOptionString(___1246552267(151), ___1246552267(152), ___1246552267(153), $_1652209018[___1246552267(154)]) != $_1155552336){ COption::SetOptionString(___1246552267(155), ___1246552267(156), $_1155552336, false, $_1652209018[___1246552267(157)]); COption::SetOptionString(___1246552267(158), ___1246552267(159), $_1155552336);} if(COption::GetOptionString(___1246552267(160), ___1246552267(161), ___1246552267(162), $_1652209018[___1246552267(163)]) != $_1155552336){ COption::SetOptionString(___1246552267(164), ___1246552267(165), $_1155552336, false, $_1652209018[___1246552267(166)]); COption::SetOptionString(___1246552267(167), ___1246552267(168), $_1155552336);}}} protected static function OnPersonalFilesSettingsChange($_1819191727, $_2028676201){ if($_2028676201) $_1155552336= "Y"; else $_1155552336= ___1246552267(169); $_2072639362= CSite::GetList(___1246552267(170), ___1246552267(171), array(___1246552267(172) => ___1246552267(173))); while($_1652209018= $_2072639362->Fetch()){ if(COption::GetOptionString(___1246552267(174), ___1246552267(175), ___1246552267(176), $_1652209018[___1246552267(177)]) != $_1155552336){ COption::SetOptionString(___1246552267(178), ___1246552267(179), $_1155552336, false, $_1652209018[___1246552267(180)]); COption::SetOptionString(___1246552267(181), ___1246552267(182), $_1155552336);}}} protected static function OnPersonalBlogSettingsChange($_1819191727, $_2028676201){ if($_2028676201) $_1155552336= "Y"; else $_1155552336= ___1246552267(183); $_2072639362= CSite::GetList(___1246552267(184), ___1246552267(185), array(___1246552267(186) => ___1246552267(187))); while($_1652209018= $_2072639362->Fetch()){ if(COption::GetOptionString(___1246552267(188), ___1246552267(189), ___1246552267(190), $_1652209018[___1246552267(191)]) != $_1155552336){ COption::SetOptionString(___1246552267(192), ___1246552267(193), $_1155552336, false, $_1652209018[___1246552267(194)]); COption::SetOptionString(___1246552267(195), ___1246552267(196), $_1155552336);}}} protected static function OnPersonalPhotoSettingsChange($_1819191727, $_2028676201){ if($_2028676201) $_1155552336= "Y"; else $_1155552336= ___1246552267(197); $_2072639362= CSite::GetList(___1246552267(198), ___1246552267(199), array(___1246552267(200) => ___1246552267(201))); while($_1652209018= $_2072639362->Fetch()){ if(COption::GetOptionString(___1246552267(202), ___1246552267(203), ___1246552267(204), $_1652209018[___1246552267(205)]) != $_1155552336){ COption::SetOptionString(___1246552267(206), ___1246552267(207), $_1155552336, false, $_1652209018[___1246552267(208)]); COption::SetOptionString(___1246552267(209), ___1246552267(210), $_1155552336);}}} protected static function OnPersonalForumSettingsChange($_1819191727, $_2028676201){ if($_2028676201) $_1155552336= "Y"; else $_1155552336= ___1246552267(211); $_2072639362= CSite::GetList(___1246552267(212), ___1246552267(213), array(___1246552267(214) => ___1246552267(215))); while($_1652209018= $_2072639362->Fetch()){ if(COption::GetOptionString(___1246552267(216), ___1246552267(217), ___1246552267(218), $_1652209018[___1246552267(219)]) != $_1155552336){ COption::SetOptionString(___1246552267(220), ___1246552267(221), $_1155552336, false, $_1652209018[___1246552267(222)]); COption::SetOptionString(___1246552267(223), ___1246552267(224), $_1155552336);}}} protected static function OnTasksSettingsChange($_1819191727, $_2028676201){ if($_2028676201) $_1155552336= "Y"; else $_1155552336= ___1246552267(225); $_2072639362= CSite::GetList(___1246552267(226), ___1246552267(227), array(___1246552267(228) => ___1246552267(229))); while($_1652209018= $_2072639362->Fetch()){ if(COption::GetOptionString(___1246552267(230), ___1246552267(231), ___1246552267(232), $_1652209018[___1246552267(233)]) != $_1155552336){ COption::SetOptionString(___1246552267(234), ___1246552267(235), $_1155552336, false, $_1652209018[___1246552267(236)]); COption::SetOptionString(___1246552267(237), ___1246552267(238), $_1155552336);} if(COption::GetOptionString(___1246552267(239), ___1246552267(240), ___1246552267(241), $_1652209018[___1246552267(242)]) != $_1155552336){ COption::SetOptionString(___1246552267(243), ___1246552267(244), $_1155552336, false, $_1652209018[___1246552267(245)]); COption::SetOptionString(___1246552267(246), ___1246552267(247), $_1155552336);}} self::__264195497(___1246552267(248), $_2028676201);} protected static function OnCalendarSettingsChange($_1819191727, $_2028676201){ if($_2028676201) $_1155552336= "Y"; else $_1155552336= ___1246552267(249); $_2072639362= CSite::GetList(___1246552267(250), ___1246552267(251), array(___1246552267(252) => ___1246552267(253))); while($_1652209018= $_2072639362->Fetch()){ if(COption::GetOptionString(___1246552267(254), ___1246552267(255), ___1246552267(256), $_1652209018[___1246552267(257)]) != $_1155552336){ COption::SetOptionString(___1246552267(258), ___1246552267(259), $_1155552336, false, $_1652209018[___1246552267(260)]); COption::SetOptionString(___1246552267(261), ___1246552267(262), $_1155552336);} if(COption::GetOptionString(___1246552267(263), ___1246552267(264), ___1246552267(265), $_1652209018[___1246552267(266)]) != $_1155552336){ COption::SetOptionString(___1246552267(267), ___1246552267(268), $_1155552336, false, $_1652209018[___1246552267(269)]); COption::SetOptionString(___1246552267(270), ___1246552267(271), $_1155552336);}}} protected static function OnSMTPSettingsChange($_1819191727, $_2028676201){ self::__264195497("mail", $_2028676201);} protected static function OnExtranetSettingsChange($_1819191727, $_2028676201){ $_834495330= COption::GetOptionString("extranet", "extranet_site", ""); if($_834495330){ $_681730209= new CSite; $_681730209->Update($_834495330, array(___1246552267(272) =>($_2028676201? ___1246552267(273): ___1246552267(274))));} self::__264195497(___1246552267(275), $_2028676201);} protected static function OnDAVSettingsChange($_1819191727, $_2028676201){ self::__264195497("dav", $_2028676201);} protected static function OntimemanSettingsChange($_1819191727, $_2028676201){ self::__264195497("timeman", $_2028676201);} protected static function Onintranet_sharepointSettingsChange($_1819191727, $_2028676201){ if($_2028676201){ RegisterModuleDependences("iblock", "OnAfterIBlockElementAdd", "intranet", "CIntranetEventHandlers", "SPRegisterUpdatedItem"); RegisterModuleDependences(___1246552267(276), ___1246552267(277), ___1246552267(278), ___1246552267(279), ___1246552267(280)); CAgent::AddAgent(___1246552267(281), ___1246552267(282), ___1246552267(283), round(0+250+250)); CAgent::AddAgent(___1246552267(284), ___1246552267(285), ___1246552267(286), round(0+150+150)); CAgent::AddAgent(___1246552267(287), ___1246552267(288), ___1246552267(289), round(0+3600));} else{ UnRegisterModuleDependences(___1246552267(290), ___1246552267(291), ___1246552267(292), ___1246552267(293), ___1246552267(294)); UnRegisterModuleDependences(___1246552267(295), ___1246552267(296), ___1246552267(297), ___1246552267(298), ___1246552267(299)); CAgent::RemoveAgent(___1246552267(300), ___1246552267(301)); CAgent::RemoveAgent(___1246552267(302), ___1246552267(303)); CAgent::RemoveAgent(___1246552267(304), ___1246552267(305));}} protected static function OncrmSettingsChange($_1819191727, $_2028676201){ if($_2028676201) COption::SetOptionString("crm", "form_features", "Y"); self::__264195497(___1246552267(306), $_2028676201);} protected static function OnClusterSettingsChange($_1819191727, $_2028676201){ self::__264195497("cluster", $_2028676201);} protected static function OnMultiSitesSettingsChange($_1819191727, $_2028676201){ if($_2028676201) RegisterModuleDependences("main", "OnBeforeProlog", "main", "CWizardSolPanelIntranet", "ShowPanel", 100, "/modules/intranet/panel_button.php"); else UnRegisterModuleDependences(___1246552267(307), ___1246552267(308), ___1246552267(309), ___1246552267(310), ___1246552267(311), ___1246552267(312));} protected static function OnIdeaSettingsChange($_1819191727, $_2028676201){ self::__264195497("idea", $_2028676201);} protected static function OnMeetingSettingsChange($_1819191727, $_2028676201){ self::__264195497("meeting", $_2028676201);} protected static function OnXDImportSettingsChange($_1819191727, $_2028676201){ self::__264195497("xdimport", $_2028676201);}} $GLOBALS['____1212555486'][44](___1246552267(313), ___1246552267(314));/**/			//Do not remove this

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

if ((!(defined("STATISTIC_ONLY") && STATISTIC_ONLY && !str_starts_with($GLOBALS["APPLICATION"]->GetCurPage(), BX_ROOT . "/admin/"))) && COption::GetOptionString("main", "include_charset", "Y")=="Y" && LANG_CHARSET <> '')
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
				echo "<script>
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

/*ZDUyZmZOGQ1NzU1MzkzYzk5MTFlZTY2ZmU4M2U3Mjk3NTE0OTk=*/$GLOBALS['____462957804']= array(base64_decode('bXRfcmF'.'uZA'.'=='),base64_decode('ZX'.'hwbG9'.'k'.'ZQ'.'=='),base64_decode(''.'cGFj'.'aw=='),base64_decode('bWQ1'),base64_decode('Y29u'.'c3R'.'h'.'bnQ'.'='),base64_decode(''.'a'.'GFzaF9obWFj'),base64_decode('c'.'3R'.'yY21w'),base64_decode('aXNfb2J'.'qZW'.'N0'),base64_decode(''.'Y2'.'Fsb'.'F91c2VyX2Z1b'.'mM='),base64_decode('Y2FsbF91c2'.'V'.'yX'.'2'.'Z1b'.'mM'.'='),base64_decode('Y2F'.'s'.'bF91c2VyX2'.'Z1bmM='),base64_decode('Y'.'2FsbF9'.'1c2VyX'.'2Z1bmM='),base64_decode('Y2Fs'.'bF'.'9'.'1c'.'2VyX2Z1b'.'mM='));if(!function_exists(__NAMESPACE__.'\\___1913894952')){function ___1913894952($_1128375362){static $_381984518= false; if($_381984518 == false) $_381984518=array(''.'REI=','U0'.'VMRUNUIF'.'ZBTFVFIE'.'ZST00gYl9vcHRpb'.'24g'.'V0hFU'.'k'.'Ug'.'TkFNRT0nf'.'l'.'BB'.'Uk'.'F'.'NX01'.'BWF9V'.'U0VSU'.'ycgQ'.'U5EIE1'.'PRFVMR'.'V'.'9JRD0n'.'b'.'WFpbicgQU5EIFNJ'.'VE'.'VfSUQgSVMgTlVMTA='.'=','VkFMVUU=',''.'L'.'g==',''.'SCo=',''.'Y'.'ml'.'0cm'.'l4','TElDRU5TRV9LR'.'Vk'.'=','c'.'2hhM'.'jU2','VVNFUg==',''.'VVNFUg==',''.'V'.'VNFU'.'g='.'=','SXN'.'Bd'.'XRo'.'b3JpemVk',''.'VVNF'.'Ug==','SXNBZG1pbg==','Q'.'V'.'BQTElDQV'.'RJT04'.'=',''.'UmVzdGFydEJ1ZmZl'.'cg==',''.'TG9jYW'.'x'.'S'.'ZWRpcmVjdA==','L2xpY2'.'Vuc'.'2'.'Vfc'.'m'.'Vz'.'dHJpY3R'.'pb2'.'4ucGhw','XEJp'.'d'.'H'.'JpeF'.'x'.'NYWlu'.'XENvbmZpZ1xPc'.'HRpb24'.'6OnNldA'.'==','bWFpbg'.'==',''.'UEFS'.'QU1f'.'T'.'UF'.'Y'.'X'.'1VTRVJT');return base64_decode($_381984518[$_1128375362]);}};if($GLOBALS['____462957804'][0](round(0+0.25+0.25+0.25+0.25), round(0+20)) == round(0+3.5+3.5)){ $_642519856= $GLOBALS[___1913894952(0)]->Query(___1913894952(1), true); if($_817793737= $_642519856->Fetch()){ $_837723292= $_817793737[___1913894952(2)]; list($_1798199996, $_1970652384)= $GLOBALS['____462957804'][1](___1913894952(3), $_837723292); $_657838465= $GLOBALS['____462957804'][2](___1913894952(4), $_1798199996); $_2050873746= ___1913894952(5).$GLOBALS['____462957804'][3]($GLOBALS['____462957804'][4](___1913894952(6))); $_275543330= $GLOBALS['____462957804'][5](___1913894952(7), $_1970652384, $_2050873746, true); if($GLOBALS['____462957804'][6]($_275543330, $_657838465) !==(932-2*466)){ if(isset($GLOBALS[___1913894952(8)]) && $GLOBALS['____462957804'][7]($GLOBALS[___1913894952(9)]) && $GLOBALS['____462957804'][8](array($GLOBALS[___1913894952(10)], ___1913894952(11))) &&!$GLOBALS['____462957804'][9](array($GLOBALS[___1913894952(12)], ___1913894952(13)))){ $GLOBALS['____462957804'][10](array($GLOBALS[___1913894952(14)], ___1913894952(15))); $GLOBALS['____462957804'][11](___1913894952(16), ___1913894952(17), true);}}} else{ $GLOBALS['____462957804'][12](___1913894952(18), ___1913894952(19), ___1913894952(20), round(0+2.4+2.4+2.4+2.4+2.4));}}/**/       //Do not remove this

