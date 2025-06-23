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

/*ZDUyZmZMmVlNTc5NTE1ODM0Zjg1MmI2NmFkOGQzMTUwMWFhNWI=*/$GLOBALS['_____10003062']= array(base64_decode(''.'R2V0TW'.'9kdWxlRXZlbnR'.'z'),base64_decode(''.'RX'.'hlY3'.'V0Z'.'U1'.'vZHVsZUV2ZW'.'50RXg='));$GLOBALS['____1898867209']= array(base64_decode('ZGV'.'maW5l'),base64_decode('Ym'.'FzZTY0X2Rl'.'Y29'.'kZ'.'Q'.'=='),base64_decode('dW5zZ'.'XJpYWxpe'.'mU='),base64_decode('aXNf'.'YXJ'.'yYXk='),base64_decode(''.'aW5fY'.'XJy'.'YX'.'k='),base64_decode('c2V'.'y'.'aW'.'FsaXpl'),base64_decode(''.'YmFz'.'ZT'.'Y0'.'X2VuY'.'2'.'9k'.'ZQ=='),base64_decode('bWt0aW1'.'l'),base64_decode('ZG'.'F0ZQ=='),base64_decode('ZGF0ZQ='.'='),base64_decode('c3R'.'ybGVu'),base64_decode('bWt'.'0a'.'W1l'),base64_decode(''.'ZG'.'F0ZQ=='),base64_decode('Z'.'GF0ZQ'.'=='),base64_decode('bWV0aG9kX2V4aXN0c'.'w=='),base64_decode(''.'Y2F'.'sbF91c2VyX'.'2Z1bmNfYX'.'JyYX'.'k='),base64_decode('c'.'3R'.'ybGVu'),base64_decode('c2VyaW'.'FsaXpl'),base64_decode(''.'YmFzZTY'.'0X2VuY'.'29kZQ=='),base64_decode('c3R'.'ybGVu'),base64_decode('aXNfYX'.'JyYXk='),base64_decode('c2VyaWFsa'.'Xpl'),base64_decode(''.'YmF'.'zZTY'.'0X2Vu'.'Y29kZQ'.'=='),base64_decode('c2V'.'yaW'.'FsaXpl'),base64_decode('YmFz'.'Z'.'TY0'.'X2V'.'u'.'Y'.'29kZQ=='),base64_decode('aXNfYX'.'Jy'.'YXk='),base64_decode(''.'a'.'X'.'N'.'fYXJyYXk='),base64_decode(''.'aW5'.'fYXJyYXk'.'='),base64_decode('aW'.'5'.'fYXJyYX'.'k='),base64_decode('b'.'Wt0aW1l'),base64_decode(''.'Z'.'G'.'F0ZQ'.'=='),base64_decode('ZGF0ZQ='.'='),base64_decode('Z'.'GF0ZQ='.'='),base64_decode('bWt0'.'aW'.'1l'),base64_decode('Z'.'GF0ZQ'.'=='),base64_decode('Z'.'GF0ZQ=='),base64_decode(''.'aW5fYX'.'JyYXk='),base64_decode('c2VyaWFsaXpl'),base64_decode(''.'YmFzZTY0'.'X2V'.'uY29kZQ=='),base64_decode(''.'aW50dm'.'Fs'),base64_decode('dGltZQ=='),base64_decode('Zml'.'sZV9leGlzdHM='),base64_decode('c3RyX3JlcGxhY2'.'U'.'='),base64_decode(''.'Y2xhc3N'.'fZXhpc3Rz'),base64_decode('Z'.'GVmaW'.'5l'));if(!function_exists(__NAMESPACE__.'\\___1941807525')){function ___1941807525($_532480192){static $_1428527128= false; if($_1428527128 == false) $_1428527128=array('SU5'.'UUkFOR'.'VRfRURJVElPT'.'g='.'=',''.'WQ==','bWF'.'pbg==',''.'fmNwZ'.'l9tYXBfdmFsd'.'WU=','','','YWxsb3d'.'lZ'.'F9'.'jbGF'.'z'.'c2Vz','ZQ'.'==','Zg==',''.'ZQ='.'=','R'.'g'.'==','WA='.'=','Z'.'g==','b'.'WFpb'.'g==','f'.'mN'.'w'.'Z'.'l9tY'.'XBfdmFsdWU=','U'.'G'.'9ydGFs',''.'Rg'.'==','ZQ='.'=','ZQ==','WA==','Rg'.'==','RA'.'==','RA==','bQ==','ZA==','W'.'Q==','Zg==','Zg==',''.'Z'.'g==','Zg==','U'.'G9ydG'.'Fs',''.'R'.'g==','Z'.'Q==','ZQ'.'==','WA==','R'.'g==','RA'.'==','R'.'A='.'=','bQ==','ZA='.'=','WQ==','b'.'WFpbg==','T24'.'=','U2V'.'0dGluZ3NDaGFuZ2U=','Zg='.'=','Zg==',''.'Zg==','Zg==','b'.'WFpb'.'g==','fmNwZl9tYXBfdmFsdWU=',''.'ZQ==','Z'.'Q==','RA'.'==','ZQ==','ZQ==','Zg'.'==','Zg==','Z'.'g==','ZQ==','bWFpbg='.'=','f'.'mN'.'wZl9'.'tYXBfd'.'m'.'Fs'.'dW'.'U=','ZQ==','Zg==',''.'Z'.'g'.'==','Zg==','Zg==',''.'b'.'W'.'Fp'.'bg'.'='.'=','fmNwZl9tYXBfdmFsdW'.'U=',''.'ZQ==',''.'Zg'.'==','UG9ydGFs','U'.'G'.'9ydGF'.'s','ZQ'.'==','ZQ==','UG9ydGFs','R'.'g'.'='.'=',''.'W'.'A==','Rg==','RA'.'==',''.'Z'.'Q==','Z'.'Q==','RA==',''.'b'.'Q==','ZA'.'==','WQ==','Z'.'Q='.'=','WA'.'='.'=',''.'ZQ==','Rg==',''.'ZQ==','R'.'A'.'==','Z'.'g==','ZQ==','RA='.'=','ZQ='.'=','bQ'.'==','ZA==','W'.'Q==','Zg==',''.'Zg==','Z'.'g==',''.'Z'.'g==','Zg='.'=','Zg==','Zg'.'==','Zg'.'==','bW'.'Fpbg==','fmN'.'wZ'.'l9tYXBfdm'.'FsdWU=','ZQ==','ZQ==',''.'UG9ydG'.'F'.'s','Rg==','WA==','VFlQRQ='.'=',''.'R'.'E'.'FURQ==','RkVBVFV'.'SR'.'V'.'M'.'=','RVhQ'.'SVJFRA==',''.'V'.'FlQRQ='.'=','RA==','VFJ'.'ZX'.'0'.'RBWV'.'NfQ09VTl'.'Q=','R'.'EFUR'.'Q='.'=','VFJZX0R'.'BWVNfQ09'.'VTlQ=','RVhQSVJFRA==','R'.'kVBVFVSRVM=',''.'Zg==','Zg==','RE9'.'D'.'VU1FTlRf'.'Uk'.'9PVA='.'=','L'.'2JpdHJp'.'e'.'C9'.'tb2'.'R1bGVz'.'Lw==',''.'L2'.'l'.'u'.'c3Rhb'.'GwvaW5k'.'Z'.'X'.'gucG'.'hw',''.'Lg==','Xw='.'=',''.'c2Vh'.'cmNo',''.'Tg==','','','QUNUSVZ'.'F','WQ==',''.'c29'.'j'.'a'.'WF'.'sbm'.'V0d2'.'9'.'y'.'a'.'w'.'==','YWxsb'.'3dfZn'.'J'.'pZW'.'xkc'.'w==','WQ==',''.'SUQ=','c2'.'9ja'.'WFsbm'.'V0d29yaw='.'=','YWxsb3dfZnJpZWx'.'kcw==',''.'SUQ=','c29jaW'.'FsbmV'.'0d2'.'9'.'y'.'aw==','YWxs'.'b3'.'df'.'Z'.'nJ'.'pZWxkc'.'w='.'=',''.'Tg'.'==','','','QUN'.'US'.'VZF','WQ==',''.'c2'.'9jaW'.'Fsbm'.'V0d29yaw='.'=','Y'.'Wxsb'.'3dfbWljcm9ib'.'G9nX'.'3Vz'.'ZXI=','WQ==','SUQ'.'=','c29jaWFsbm'.'V0d29'.'yaw==','YW'.'xsb'.'3d'.'fbWljcm9'.'ibG9n'.'X3VzZXI=','S'.'UQ=','c29'.'ja'.'WFsbmV0'.'d29ya'.'w'.'==','Y'.'Wxsb3dfbWljcm'.'9'.'i'.'bG9nX3V'.'z'.'ZXI=','c'.'29jaWFsbm'.'V0d'.'2'.'9y'.'aw==','Y'.'Wxsb3df'.'bW'.'ljcm9ibG9nX2d'.'yb3'.'Vw','WQ==','SUQ'.'=','c29'.'j'.'aW'.'F'.'s'.'bmV'.'0d29yaw==',''.'YWxsb3dfbWlj'.'cm9ibG9nX2dy'.'b3Vw',''.'S'.'UQ=','c29'.'j'.'aWF'.'sb'.'mV0d'.'29yaw==',''.'YWxsb3dfbWl'.'jc'.'m9ib'.'G9n'.'X2'.'d'.'yb3V'.'w','Tg'.'==','','','QU'.'NUS'.'VZF','WQ==','c'.'29ja'.'WF'.'s'.'bm'.'V0d'.'29ya'.'w'.'==','YWxsb3dfZmlsZXN'.'fdXNlcg='.'=','WQ==','SUQ=',''.'c29ja'.'W'.'F'.'s'.'bmV0d29yaw==','YWxs'.'b3dfZmlsZXNfdXNl'.'cg'.'==',''.'SUQ'.'=',''.'c2'.'9jaW'.'Fs'.'bmV'.'0d29ya'.'w'.'='.'=','YWxsb3d'.'fZmlsZXNfdXNlc'.'g==','T'.'g'.'==','','','QUNUS'.'V'.'Z'.'F',''.'WQ==',''.'c29jaWFsb'.'mV'.'0d29y'.'a'.'w'.'==','YW'.'xsb3'.'dfYm'.'x'.'vZ191c'.'2V'.'y','WQ'.'==','SUQ=',''.'c29j'.'aWF'.'sb'.'m'.'V'.'0'.'d29yaw==','Y'.'Wxsb'.'3d'.'fYmxvZ191c2'.'Vy','SU'.'Q=','c29'.'j'.'aWFsbm'.'V0d29yaw==',''.'YW'.'xsb'.'3dfYmxvZ191'.'c2V'.'y','Tg==','','','QUNUSVZF','WQ==','c29jaW'.'F'.'s'.'b'.'mV'.'0d29yaw==','Y'.'W'.'xsb3df'.'cG'.'hvdG9'.'f'.'dXNlcg==',''.'WQ==','SUQ'.'=','c2'.'9'.'jaWF'.'sbm'.'V0'.'d'.'29'.'yaw'.'==',''.'Y'.'Wxsb'.'3dfcGhv'.'dG9fdXNlcg==','SUQ=','c29ja'.'WFsbmV0'.'d29yaw==',''.'YWx'.'sb3dfcGhv'.'dG9fdX'.'N'.'lcg==','Tg==','','','QUNUSVZF','WQ==','c2'.'9jaWFsbmV0d2'.'9'.'yaw==','YWxs'.'b3df'.'Zm9y'.'dW'.'1fdX'.'Nlc'.'g'.'='.'=','WQ==','S'.'UQ=','c'.'29'.'jaW'.'FsbmV0d29yaw='.'=',''.'YWxsb3'.'dfZm9'.'ydW1fdXN'.'l'.'cg==','S'.'U'.'Q'.'=','c'.'29'.'jaWFsbmV0d'.'29yaw='.'=',''.'YWxsb3dfZ'.'m9ydW1fdXNlcg='.'=','Tg'.'==','','','QU'.'NU'.'SVZF',''.'WQ==',''.'c29jaW'.'F'.'sbmV'.'0d29yaw==','YW'.'xsb3'.'df'.'dGFza3N'.'fd'.'XNlcg==','WQ'.'==','SU'.'Q=','c'.'2'.'9'.'jaWF'.'sbmV0d'.'2'.'9ya'.'w==','Y'.'Wxsb3'.'dfdGFza3Nf'.'dXNlcg='.'=','SUQ=','c'.'29ja'.'WFsbmV'.'0d'.'29yaw==','YWxsb'.'3'.'d'.'fdG'.'Fz'.'a3Nfd'.'XNlcg='.'=','c29jaWFsb'.'mV0d'.'29ya'.'w='.'=','Y'.'W'.'xsb3d'.'fdGFz'.'a3NfZ'.'3JvdXA=',''.'W'.'Q='.'=',''.'SU'.'Q'.'=',''.'c'.'29jaW'.'FsbmV0d29yaw'.'==','YWxsb3dfdGFza3'.'N'.'f'.'Z3JvdXA=',''.'SUQ=','c2'.'9j'.'aW'.'FsbmV'.'0d29yaw==','Y'.'Wxsb'.'3d'.'f'.'dGF'.'za'.'3N'.'fZ3J'.'vdXA=','dGF'.'za3'.'M=','Tg'.'==','','','Q'.'U'.'NU'.'S'.'V'.'ZF','WQ==','c29j'.'aWFs'.'bm'.'V'.'0d29yaw==','Y'.'Wx'.'sb3dfY2FsZW5kYXJ'.'fdXN'.'lcg==','WQ==',''.'SUQ=','c2'.'9jaW'.'FsbmV0d29y'.'aw==','YWx'.'s'.'b'.'3dfY2F'.'sZ'.'W5'.'k'.'YX'.'JfdXN'.'lcg==','SUQ=','c29jaWFsbmV0d29yaw==','YWxsb'.'3dfY'.'2FsZW'.'5k'.'Y'.'XJfdXNlcg='.'=','c'.'2'.'9jaWFsbmV0d2'.'9y'.'a'.'w==','YWxsb'.'3'.'dfY2FsZW5kYXJfZ'.'3'.'J'.'vdXA=',''.'WQ==','SU'.'Q=',''.'c29j'.'aWFs'.'b'.'mV0d29ya'.'w==','YWxs'.'b3dfY2FsZW5k'.'YXJf'.'Z'.'3Jvd'.'XA'.'=','SU'.'Q'.'=','c29jaWFsbmV0d29yaw==','YW'.'xsb3dfY'.'2FsZ'.'W5k'.'YX'.'JfZ3JvdXA=','QUNUSVZF','WQ==',''.'Tg==','ZXh0cmFuZ'.'X'.'Q=','aWJsb2Nr','T25BZ'.'nRlckl'.'CbG9j'.'a0VsZ'.'W'.'1lbn'.'RVc'.'GRhdGU=','a'.'W'.'5'.'0cmFuZ'.'XQ=','Q0ludH'.'J'.'hb'.'mV0RXZlbnRI'.'YW5'.'kbGVyc'.'w='.'=','U1BSZ'.'Wd'.'pc3'.'Rlcl'.'VwZ'.'G'.'F0ZWRJdGV'.'t','Q0l'.'ud'.'HJhbmV0U2'.'h'.'h'.'cmV'.'wb2lu'.'dDo6QWd'.'lbn'.'RMaX'.'N0'.'cyg'.'p'.'O'.'w==','aW'.'50c'.'mFuZX'.'Q=','Tg==','Q0lu'.'dHJhbmV'.'0'.'U2'.'h'.'h'.'cmVwb'.'2ludDo6QW'.'dlbn'.'RRdWV'.'1'.'ZSgpOw==','aW5'.'0'.'cm'.'FuZXQ=','Tg==','Q0ludHJhbm'.'V'.'0U2'.'hh'.'c'.'mVwb'.'2lu'.'dDo'.'6QW'.'dlbn'.'RVcGRh'.'d'.'GUo'.'KT'.'s=','aW5'.'0'.'cmFuZXQ=','T'.'g==','aWJsb2Nr','T25'.'BZnRl'.'cklCbG9'.'ja0VsZW'.'1lbnRBZ'.'GQ=','aW50cmFuZX'.'Q=','Q0ludHJhbmV0RXZ'.'lbnRIY'.'W5kbG'.'Vyc'.'w'.'==','U'.'1B'.'SZWdpc3Rl'.'clV'.'wZ'.'GF'.'0ZWRJd'.'GVt','aWJsb2'.'Nr',''.'T25BZnR'.'l'.'ck'.'lCbG'.'9j'.'a0VsZW1lbnRVcG'.'R'.'h'.'dGU'.'=','aW5'.'0cm'.'F'.'uZ'.'XQ=','Q0ludHJh'.'bmV0RXZl'.'bnRI'.'YW5'.'kbGVycw==','U1BSZWdpc3RlclVwZGF0ZWRJdGVt','Q0ludH'.'Jh'.'bmV0U2hh'.'cmVwb2lu'.'dDo'.'6QWdl'.'bnRMaXN0'.'cygpO'.'w='.'=','aW5'.'0c'.'m'.'FuZXQ=',''.'Q0lu'.'d'.'HJhbmV'.'0U'.'2hh'.'cmVw'.'b2'.'l'.'udDo'.'6'.'QWd'.'lbnRRdWV'.'1ZSgp'.'Ow==','aW50cm'.'FuZX'.'Q=','Q0lu'.'dHJh'.'b'.'mV0U2'.'hhc'.'mVw'.'b2ludD'.'o6'.'QW'.'d'.'lbnRVcG'.'Rhd'.'GUoKTs=','aW50cmF'.'uZXQ=','Y'.'3Jt','bWFpb'.'g='.'=','T25'.'C'.'Z'.'WZvcmVQ'.'cm9sb2'.'c=','bW'.'Fpbg='.'=','Q1dpemFyZ'.'F'.'NvbF'.'B'.'hbmVsSW50cmFuZXQ=','U2hvd1BhbmVs','L21vZHVsZXMvaW50cmF'.'uZXQvcGF'.'uZWxfY'.'nV0d'.'G9u'.'L'.'nBoc'.'A==',''.'RU'.'5'.'DT0RF','WQ'.'='.'=');return base64_decode($_1428527128[$_532480192]);}};$GLOBALS['____1898867209'][0](___1941807525(0), ___1941807525(1));class CBXFeatures{ private static $_679217829= 30; private static $_887040981= array( "Portal" => array( "CompanyCalendar", "CompanyPhoto", "CompanyVideo", "CompanyCareer", "StaffChanges", "StaffAbsence", "CommonDocuments", "MeetingRoomBookingSystem", "Wiki", "Learning", "Vote", "WebLink", "Subscribe", "Friends", "PersonalFiles", "PersonalBlog", "PersonalPhoto", "PersonalForum", "Blog", "Forum", "Gallery", "Board", "MicroBlog", "WebMessenger",), "Communications" => array( "Tasks", "Calendar", "Workgroups", "Jabber", "VideoConference", "Extranet", "SMTP", "Requests", "DAV", "intranet_sharepoint", "timeman", "Idea", "Meeting", "EventList", "Salary", "XDImport",), "Enterprise" => array( "BizProc", "Lists", "Support", "Analytics", "crm", "Controller", "LdapUnlimitedUsers",), "Holding" => array( "Cluster", "MultiSites",),); private static $_119383209= null; private static $_1642955997= null; private static function __492414332(){ if(self::$_119383209 === null){ self::$_119383209= array(); foreach(self::$_887040981 as $_549243411 => $_956656272){ foreach($_956656272 as $_1794011425) self::$_119383209[$_1794011425]= $_549243411;}} if(self::$_1642955997 === null){ self::$_1642955997= array(); $_1328606483= COption::GetOptionString(___1941807525(2), ___1941807525(3), ___1941807525(4)); if($_1328606483 != ___1941807525(5)){ $_1328606483= $GLOBALS['____1898867209'][1]($_1328606483); $_1328606483= $GLOBALS['____1898867209'][2]($_1328606483,[___1941807525(6) => false]); if($GLOBALS['____1898867209'][3]($_1328606483)){ self::$_1642955997= $_1328606483;}} if(empty(self::$_1642955997)){ self::$_1642955997= array(___1941807525(7) => array(), ___1941807525(8) => array());}}} public static function InitiateEditionsSettings($_84978262){ self::__492414332(); $_67781525= array(); foreach(self::$_887040981 as $_549243411 => $_956656272){ $_1200763134= $GLOBALS['____1898867209'][4]($_549243411, $_84978262); self::$_1642955997[___1941807525(9)][$_549243411]=($_1200763134? array(___1941807525(10)): array(___1941807525(11))); foreach($_956656272 as $_1794011425){ self::$_1642955997[___1941807525(12)][$_1794011425]= $_1200763134; if(!$_1200763134) $_67781525[]= array($_1794011425, false);}} $_1357796523= $GLOBALS['____1898867209'][5](self::$_1642955997); $_1357796523= $GLOBALS['____1898867209'][6]($_1357796523); COption::SetOptionString(___1941807525(13), ___1941807525(14), $_1357796523); foreach($_67781525 as $_444850900) self::__2002507979($_444850900[(846-2*423)], $_444850900[round(0+0.5+0.5)]);} public static function IsFeatureEnabled($_1794011425){ if($_1794011425 == '') return true; self::__492414332(); if(!isset(self::$_119383209[$_1794011425])) return true; if(self::$_119383209[$_1794011425] == ___1941807525(15)) $_138390885= array(___1941807525(16)); elseif(isset(self::$_1642955997[___1941807525(17)][self::$_119383209[$_1794011425]])) $_138390885= self::$_1642955997[___1941807525(18)][self::$_119383209[$_1794011425]]; else $_138390885= array(___1941807525(19)); if($_138390885[(932-2*466)] != ___1941807525(20) && $_138390885[min(186,0,62)] != ___1941807525(21)){ return false;} elseif($_138390885[(134*2-268)] == ___1941807525(22)){ if($_138390885[round(0+0.25+0.25+0.25+0.25)]< $GLOBALS['____1898867209'][7]((1328/2-664),(156*2-312),(806-2*403), Date(___1941807525(23)), $GLOBALS['____1898867209'][8](___1941807525(24))- self::$_679217829, $GLOBALS['____1898867209'][9](___1941807525(25)))){ if(!isset($_138390885[round(0+0.66666666666667+0.66666666666667+0.66666666666667)]) ||!$_138390885[round(0+0.66666666666667+0.66666666666667+0.66666666666667)]) self::__2070639235(self::$_119383209[$_1794011425]); return false;}} return!isset(self::$_1642955997[___1941807525(26)][$_1794011425]) || self::$_1642955997[___1941807525(27)][$_1794011425];} public static function IsFeatureInstalled($_1794011425){ if($GLOBALS['____1898867209'][10]($_1794011425) <= 0) return true; self::__492414332(); return(isset(self::$_1642955997[___1941807525(28)][$_1794011425]) && self::$_1642955997[___1941807525(29)][$_1794011425]);} public static function IsFeatureEditable($_1794011425){ if($_1794011425 == '') return true; self::__492414332(); if(!isset(self::$_119383209[$_1794011425])) return true; if(self::$_119383209[$_1794011425] == ___1941807525(30)) $_138390885= array(___1941807525(31)); elseif(isset(self::$_1642955997[___1941807525(32)][self::$_119383209[$_1794011425]])) $_138390885= self::$_1642955997[___1941807525(33)][self::$_119383209[$_1794011425]]; else $_138390885= array(___1941807525(34)); if($_138390885[(900-2*450)] != ___1941807525(35) && $_138390885[(1128/2-564)] != ___1941807525(36)){ return false;} elseif($_138390885[(1008/2-504)] == ___1941807525(37)){ if($_138390885[round(0+1)]< $GLOBALS['____1898867209'][11]((130*2-260),(230*2-460),(942-2*471), Date(___1941807525(38)), $GLOBALS['____1898867209'][12](___1941807525(39))- self::$_679217829, $GLOBALS['____1898867209'][13](___1941807525(40)))){ if(!isset($_138390885[round(0+1+1)]) ||!$_138390885[round(0+2)]) self::__2070639235(self::$_119383209[$_1794011425]); return false;}} return true;} private static function __2002507979($_1794011425, $_617314875){ if($GLOBALS['____1898867209'][14]("CBXFeatures", "On".$_1794011425."SettingsChange")) $GLOBALS['____1898867209'][15](array("CBXFeatures", "On".$_1794011425."SettingsChange"), array($_1794011425, $_617314875)); $_319793987= $GLOBALS['_____10003062'][0](___1941807525(41), ___1941807525(42).$_1794011425.___1941807525(43)); while($_2070292949= $_319793987->Fetch()) $GLOBALS['_____10003062'][1]($_2070292949, array($_1794011425, $_617314875));} public static function SetFeatureEnabled($_1794011425, $_617314875= true, $_774554220= true){ if($GLOBALS['____1898867209'][16]($_1794011425) <= 0) return; if(!self::IsFeatureEditable($_1794011425)) $_617314875= false; $_617314875= (bool)$_617314875; self::__492414332(); $_693354321=(!isset(self::$_1642955997[___1941807525(44)][$_1794011425]) && $_617314875 || isset(self::$_1642955997[___1941807525(45)][$_1794011425]) && $_617314875 != self::$_1642955997[___1941807525(46)][$_1794011425]); self::$_1642955997[___1941807525(47)][$_1794011425]= $_617314875; $_1357796523= $GLOBALS['____1898867209'][17](self::$_1642955997); $_1357796523= $GLOBALS['____1898867209'][18]($_1357796523); COption::SetOptionString(___1941807525(48), ___1941807525(49), $_1357796523); if($_693354321 && $_774554220) self::__2002507979($_1794011425, $_617314875);} private static function __2070639235($_549243411){ if($GLOBALS['____1898867209'][19]($_549243411) <= 0 || $_549243411 == "Portal") return; self::__492414332(); if(!isset(self::$_1642955997[___1941807525(50)][$_549243411]) || self::$_1642955997[___1941807525(51)][$_549243411][(148*2-296)] != ___1941807525(52)) return; if(isset(self::$_1642955997[___1941807525(53)][$_549243411][round(0+0.5+0.5+0.5+0.5)]) && self::$_1642955997[___1941807525(54)][$_549243411][round(0+0.5+0.5+0.5+0.5)]) return; $_67781525= array(); if(isset(self::$_887040981[$_549243411]) && $GLOBALS['____1898867209'][20](self::$_887040981[$_549243411])){ foreach(self::$_887040981[$_549243411] as $_1794011425){ if(isset(self::$_1642955997[___1941807525(55)][$_1794011425]) && self::$_1642955997[___1941807525(56)][$_1794011425]){ self::$_1642955997[___1941807525(57)][$_1794011425]= false; $_67781525[]= array($_1794011425, false);}} self::$_1642955997[___1941807525(58)][$_549243411][round(0+0.4+0.4+0.4+0.4+0.4)]= true;} $_1357796523= $GLOBALS['____1898867209'][21](self::$_1642955997); $_1357796523= $GLOBALS['____1898867209'][22]($_1357796523); COption::SetOptionString(___1941807525(59), ___1941807525(60), $_1357796523); foreach($_67781525 as $_444850900) self::__2002507979($_444850900[(236*2-472)], $_444850900[round(0+1)]);} public static function ModifyFeaturesSettings($_84978262, $_956656272){ self::__492414332(); foreach($_84978262 as $_549243411 => $_1411310812) self::$_1642955997[___1941807525(61)][$_549243411]= $_1411310812; $_67781525= array(); foreach($_956656272 as $_1794011425 => $_617314875){ if(!isset(self::$_1642955997[___1941807525(62)][$_1794011425]) && $_617314875 || isset(self::$_1642955997[___1941807525(63)][$_1794011425]) && $_617314875 != self::$_1642955997[___1941807525(64)][$_1794011425]) $_67781525[]= array($_1794011425, $_617314875); self::$_1642955997[___1941807525(65)][$_1794011425]= $_617314875;} $_1357796523= $GLOBALS['____1898867209'][23](self::$_1642955997); $_1357796523= $GLOBALS['____1898867209'][24]($_1357796523); COption::SetOptionString(___1941807525(66), ___1941807525(67), $_1357796523); self::$_1642955997= false; foreach($_67781525 as $_444850900) self::__2002507979($_444850900[(1092/2-546)], $_444850900[round(0+1)]);} public static function SaveFeaturesSettings($_1008260236, $_241704173){ self::__492414332(); $_2049187908= array(___1941807525(68) => array(), ___1941807525(69) => array()); if(!$GLOBALS['____1898867209'][25]($_1008260236)) $_1008260236= array(); if(!$GLOBALS['____1898867209'][26]($_241704173)) $_241704173= array(); if(!$GLOBALS['____1898867209'][27](___1941807525(70), $_1008260236)) $_1008260236[]= ___1941807525(71); foreach(self::$_887040981 as $_549243411 => $_956656272){ if(isset(self::$_1642955997[___1941807525(72)][$_549243411])){ $_920688761= self::$_1642955997[___1941807525(73)][$_549243411];} else{ $_920688761=($_549243411 == ___1941807525(74)? array(___1941807525(75)): array(___1941807525(76)));} if($_920688761[(966-2*483)] == ___1941807525(77) || $_920688761[(1388/2-694)] == ___1941807525(78)){ $_2049187908[___1941807525(79)][$_549243411]= $_920688761;} else{ if($GLOBALS['____1898867209'][28]($_549243411, $_1008260236)) $_2049187908[___1941807525(80)][$_549243411]= array(___1941807525(81), $GLOBALS['____1898867209'][29]((1096/2-548),(1384/2-692),(974-2*487), $GLOBALS['____1898867209'][30](___1941807525(82)), $GLOBALS['____1898867209'][31](___1941807525(83)), $GLOBALS['____1898867209'][32](___1941807525(84)))); else $_2049187908[___1941807525(85)][$_549243411]= array(___1941807525(86));}} $_67781525= array(); foreach(self::$_119383209 as $_1794011425 => $_549243411){ if($_2049187908[___1941807525(87)][$_549243411][(912-2*456)] != ___1941807525(88) && $_2049187908[___1941807525(89)][$_549243411][(1456/2-728)] != ___1941807525(90)){ $_2049187908[___1941807525(91)][$_1794011425]= false;} else{ if($_2049187908[___1941807525(92)][$_549243411][(153*2-306)] == ___1941807525(93) && $_2049187908[___1941807525(94)][$_549243411][round(0+0.25+0.25+0.25+0.25)]< $GLOBALS['____1898867209'][33]((756-2*378), min(250,0,83.333333333333),(1224/2-612), Date(___1941807525(95)), $GLOBALS['____1898867209'][34](___1941807525(96))- self::$_679217829, $GLOBALS['____1898867209'][35](___1941807525(97)))) $_2049187908[___1941807525(98)][$_1794011425]= false; else $_2049187908[___1941807525(99)][$_1794011425]= $GLOBALS['____1898867209'][36]($_1794011425, $_241704173); if(!isset(self::$_1642955997[___1941807525(100)][$_1794011425]) && $_2049187908[___1941807525(101)][$_1794011425] || isset(self::$_1642955997[___1941807525(102)][$_1794011425]) && $_2049187908[___1941807525(103)][$_1794011425] != self::$_1642955997[___1941807525(104)][$_1794011425]) $_67781525[]= array($_1794011425, $_2049187908[___1941807525(105)][$_1794011425]);}} $_1357796523= $GLOBALS['____1898867209'][37]($_2049187908); $_1357796523= $GLOBALS['____1898867209'][38]($_1357796523); COption::SetOptionString(___1941807525(106), ___1941807525(107), $_1357796523); self::$_1642955997= false; foreach($_67781525 as $_444850900) self::__2002507979($_444850900[(1116/2-558)], $_444850900[round(0+1)]);} public static function GetFeaturesList(){ self::__492414332(); $_1318252258= array(); foreach(self::$_887040981 as $_549243411 => $_956656272){ if(isset(self::$_1642955997[___1941807525(108)][$_549243411])){ $_920688761= self::$_1642955997[___1941807525(109)][$_549243411];} else{ $_920688761=($_549243411 == ___1941807525(110)? array(___1941807525(111)): array(___1941807525(112)));} $_1318252258[$_549243411]= array( ___1941807525(113) => $_920688761[(155*2-310)], ___1941807525(114) => $_920688761[round(0+0.5+0.5)], ___1941807525(115) => array(),); $_1318252258[$_549243411][___1941807525(116)]= false; if($_1318252258[$_549243411][___1941807525(117)] == ___1941807525(118)){ $_1318252258[$_549243411][___1941807525(119)]= $GLOBALS['____1898867209'][39](($GLOBALS['____1898867209'][40]()- $_1318252258[$_549243411][___1941807525(120)])/ round(0+43200+43200)); if($_1318252258[$_549243411][___1941807525(121)]> self::$_679217829) $_1318252258[$_549243411][___1941807525(122)]= true;} foreach($_956656272 as $_1794011425) $_1318252258[$_549243411][___1941807525(123)][$_1794011425]=(!isset(self::$_1642955997[___1941807525(124)][$_1794011425]) || self::$_1642955997[___1941807525(125)][$_1794011425]);} return $_1318252258;} private static function __321606551($_1048567281, $_43167641){ if(IsModuleInstalled($_1048567281) == $_43167641) return true; $_2043024168= $_SERVER[___1941807525(126)].___1941807525(127).$_1048567281.___1941807525(128); if(!$GLOBALS['____1898867209'][41]($_2043024168)) return false; include_once($_2043024168); $_629304218= $GLOBALS['____1898867209'][42](___1941807525(129), ___1941807525(130), $_1048567281); if(!$GLOBALS['____1898867209'][43]($_629304218)) return false; $_1339042386= new $_629304218; if($_43167641){ if(!$_1339042386->InstallDB()) return false; $_1339042386->InstallEvents(); if(!$_1339042386->InstallFiles()) return false;} else{ if(CModule::IncludeModule(___1941807525(131))) CSearch::DeleteIndex($_1048567281); UnRegisterModule($_1048567281);} return true;} protected static function OnRequestsSettingsChange($_1794011425, $_617314875){ self::__321606551("form", $_617314875);} protected static function OnLearningSettingsChange($_1794011425, $_617314875){ self::__321606551("learning", $_617314875);} protected static function OnJabberSettingsChange($_1794011425, $_617314875){ self::__321606551("xmpp", $_617314875);} protected static function OnVideoConferenceSettingsChange($_1794011425, $_617314875){} protected static function OnBizProcSettingsChange($_1794011425, $_617314875){ self::__321606551("bizprocdesigner", $_617314875);} protected static function OnListsSettingsChange($_1794011425, $_617314875){ self::__321606551("lists", $_617314875);} protected static function OnWikiSettingsChange($_1794011425, $_617314875){ self::__321606551("wiki", $_617314875);} protected static function OnSupportSettingsChange($_1794011425, $_617314875){ self::__321606551("support", $_617314875);} protected static function OnControllerSettingsChange($_1794011425, $_617314875){ self::__321606551("controller", $_617314875);} protected static function OnAnalyticsSettingsChange($_1794011425, $_617314875){ self::__321606551("statistic", $_617314875);} protected static function OnVoteSettingsChange($_1794011425, $_617314875){ self::__321606551("vote", $_617314875);} protected static function OnFriendsSettingsChange($_1794011425, $_617314875){ if($_617314875) $_1590453745= "Y"; else $_1590453745= ___1941807525(132); $_1523846673= CSite::GetList(___1941807525(133), ___1941807525(134), array(___1941807525(135) => ___1941807525(136))); while($_1705616028= $_1523846673->Fetch()){ if(COption::GetOptionString(___1941807525(137), ___1941807525(138), ___1941807525(139), $_1705616028[___1941807525(140)]) != $_1590453745){ COption::SetOptionString(___1941807525(141), ___1941807525(142), $_1590453745, false, $_1705616028[___1941807525(143)]); COption::SetOptionString(___1941807525(144), ___1941807525(145), $_1590453745);}}} protected static function OnMicroBlogSettingsChange($_1794011425, $_617314875){ if($_617314875) $_1590453745= "Y"; else $_1590453745= ___1941807525(146); $_1523846673= CSite::GetList(___1941807525(147), ___1941807525(148), array(___1941807525(149) => ___1941807525(150))); while($_1705616028= $_1523846673->Fetch()){ if(COption::GetOptionString(___1941807525(151), ___1941807525(152), ___1941807525(153), $_1705616028[___1941807525(154)]) != $_1590453745){ COption::SetOptionString(___1941807525(155), ___1941807525(156), $_1590453745, false, $_1705616028[___1941807525(157)]); COption::SetOptionString(___1941807525(158), ___1941807525(159), $_1590453745);} if(COption::GetOptionString(___1941807525(160), ___1941807525(161), ___1941807525(162), $_1705616028[___1941807525(163)]) != $_1590453745){ COption::SetOptionString(___1941807525(164), ___1941807525(165), $_1590453745, false, $_1705616028[___1941807525(166)]); COption::SetOptionString(___1941807525(167), ___1941807525(168), $_1590453745);}}} protected static function OnPersonalFilesSettingsChange($_1794011425, $_617314875){ if($_617314875) $_1590453745= "Y"; else $_1590453745= ___1941807525(169); $_1523846673= CSite::GetList(___1941807525(170), ___1941807525(171), array(___1941807525(172) => ___1941807525(173))); while($_1705616028= $_1523846673->Fetch()){ if(COption::GetOptionString(___1941807525(174), ___1941807525(175), ___1941807525(176), $_1705616028[___1941807525(177)]) != $_1590453745){ COption::SetOptionString(___1941807525(178), ___1941807525(179), $_1590453745, false, $_1705616028[___1941807525(180)]); COption::SetOptionString(___1941807525(181), ___1941807525(182), $_1590453745);}}} protected static function OnPersonalBlogSettingsChange($_1794011425, $_617314875){ if($_617314875) $_1590453745= "Y"; else $_1590453745= ___1941807525(183); $_1523846673= CSite::GetList(___1941807525(184), ___1941807525(185), array(___1941807525(186) => ___1941807525(187))); while($_1705616028= $_1523846673->Fetch()){ if(COption::GetOptionString(___1941807525(188), ___1941807525(189), ___1941807525(190), $_1705616028[___1941807525(191)]) != $_1590453745){ COption::SetOptionString(___1941807525(192), ___1941807525(193), $_1590453745, false, $_1705616028[___1941807525(194)]); COption::SetOptionString(___1941807525(195), ___1941807525(196), $_1590453745);}}} protected static function OnPersonalPhotoSettingsChange($_1794011425, $_617314875){ if($_617314875) $_1590453745= "Y"; else $_1590453745= ___1941807525(197); $_1523846673= CSite::GetList(___1941807525(198), ___1941807525(199), array(___1941807525(200) => ___1941807525(201))); while($_1705616028= $_1523846673->Fetch()){ if(COption::GetOptionString(___1941807525(202), ___1941807525(203), ___1941807525(204), $_1705616028[___1941807525(205)]) != $_1590453745){ COption::SetOptionString(___1941807525(206), ___1941807525(207), $_1590453745, false, $_1705616028[___1941807525(208)]); COption::SetOptionString(___1941807525(209), ___1941807525(210), $_1590453745);}}} protected static function OnPersonalForumSettingsChange($_1794011425, $_617314875){ if($_617314875) $_1590453745= "Y"; else $_1590453745= ___1941807525(211); $_1523846673= CSite::GetList(___1941807525(212), ___1941807525(213), array(___1941807525(214) => ___1941807525(215))); while($_1705616028= $_1523846673->Fetch()){ if(COption::GetOptionString(___1941807525(216), ___1941807525(217), ___1941807525(218), $_1705616028[___1941807525(219)]) != $_1590453745){ COption::SetOptionString(___1941807525(220), ___1941807525(221), $_1590453745, false, $_1705616028[___1941807525(222)]); COption::SetOptionString(___1941807525(223), ___1941807525(224), $_1590453745);}}} protected static function OnTasksSettingsChange($_1794011425, $_617314875){ if($_617314875) $_1590453745= "Y"; else $_1590453745= ___1941807525(225); $_1523846673= CSite::GetList(___1941807525(226), ___1941807525(227), array(___1941807525(228) => ___1941807525(229))); while($_1705616028= $_1523846673->Fetch()){ if(COption::GetOptionString(___1941807525(230), ___1941807525(231), ___1941807525(232), $_1705616028[___1941807525(233)]) != $_1590453745){ COption::SetOptionString(___1941807525(234), ___1941807525(235), $_1590453745, false, $_1705616028[___1941807525(236)]); COption::SetOptionString(___1941807525(237), ___1941807525(238), $_1590453745);} if(COption::GetOptionString(___1941807525(239), ___1941807525(240), ___1941807525(241), $_1705616028[___1941807525(242)]) != $_1590453745){ COption::SetOptionString(___1941807525(243), ___1941807525(244), $_1590453745, false, $_1705616028[___1941807525(245)]); COption::SetOptionString(___1941807525(246), ___1941807525(247), $_1590453745);}} self::__321606551(___1941807525(248), $_617314875);} protected static function OnCalendarSettingsChange($_1794011425, $_617314875){ if($_617314875) $_1590453745= "Y"; else $_1590453745= ___1941807525(249); $_1523846673= CSite::GetList(___1941807525(250), ___1941807525(251), array(___1941807525(252) => ___1941807525(253))); while($_1705616028= $_1523846673->Fetch()){ if(COption::GetOptionString(___1941807525(254), ___1941807525(255), ___1941807525(256), $_1705616028[___1941807525(257)]) != $_1590453745){ COption::SetOptionString(___1941807525(258), ___1941807525(259), $_1590453745, false, $_1705616028[___1941807525(260)]); COption::SetOptionString(___1941807525(261), ___1941807525(262), $_1590453745);} if(COption::GetOptionString(___1941807525(263), ___1941807525(264), ___1941807525(265), $_1705616028[___1941807525(266)]) != $_1590453745){ COption::SetOptionString(___1941807525(267), ___1941807525(268), $_1590453745, false, $_1705616028[___1941807525(269)]); COption::SetOptionString(___1941807525(270), ___1941807525(271), $_1590453745);}}} protected static function OnSMTPSettingsChange($_1794011425, $_617314875){ self::__321606551("mail", $_617314875);} protected static function OnExtranetSettingsChange($_1794011425, $_617314875){ $_990706972= COption::GetOptionString("extranet", "extranet_site", ""); if($_990706972){ $_3662484= new CSite; $_3662484->Update($_990706972, array(___1941807525(272) =>($_617314875? ___1941807525(273): ___1941807525(274))));} self::__321606551(___1941807525(275), $_617314875);} protected static function OnDAVSettingsChange($_1794011425, $_617314875){ self::__321606551("dav", $_617314875);} protected static function OntimemanSettingsChange($_1794011425, $_617314875){ self::__321606551("timeman", $_617314875);} protected static function Onintranet_sharepointSettingsChange($_1794011425, $_617314875){ if($_617314875){ RegisterModuleDependences("iblock", "OnAfterIBlockElementAdd", "intranet", "CIntranetEventHandlers", "SPRegisterUpdatedItem"); RegisterModuleDependences(___1941807525(276), ___1941807525(277), ___1941807525(278), ___1941807525(279), ___1941807525(280)); CAgent::AddAgent(___1941807525(281), ___1941807525(282), ___1941807525(283), round(0+125+125+125+125)); CAgent::AddAgent(___1941807525(284), ___1941807525(285), ___1941807525(286), round(0+60+60+60+60+60)); CAgent::AddAgent(___1941807525(287), ___1941807525(288), ___1941807525(289), round(0+1200+1200+1200));} else{ UnRegisterModuleDependences(___1941807525(290), ___1941807525(291), ___1941807525(292), ___1941807525(293), ___1941807525(294)); UnRegisterModuleDependences(___1941807525(295), ___1941807525(296), ___1941807525(297), ___1941807525(298), ___1941807525(299)); CAgent::RemoveAgent(___1941807525(300), ___1941807525(301)); CAgent::RemoveAgent(___1941807525(302), ___1941807525(303)); CAgent::RemoveAgent(___1941807525(304), ___1941807525(305));}} protected static function OncrmSettingsChange($_1794011425, $_617314875){ if($_617314875) COption::SetOptionString("crm", "form_features", "Y"); self::__321606551(___1941807525(306), $_617314875);} protected static function OnClusterSettingsChange($_1794011425, $_617314875){ self::__321606551("cluster", $_617314875);} protected static function OnMultiSitesSettingsChange($_1794011425, $_617314875){ if($_617314875) RegisterModuleDependences("main", "OnBeforeProlog", "main", "CWizardSolPanelIntranet", "ShowPanel", 100, "/modules/intranet/panel_button.php"); else UnRegisterModuleDependences(___1941807525(307), ___1941807525(308), ___1941807525(309), ___1941807525(310), ___1941807525(311), ___1941807525(312));} protected static function OnIdeaSettingsChange($_1794011425, $_617314875){ self::__321606551("idea", $_617314875);} protected static function OnMeetingSettingsChange($_1794011425, $_617314875){ self::__321606551("meeting", $_617314875);} protected static function OnXDImportSettingsChange($_1794011425, $_617314875){ self::__321606551("xdimport", $_617314875);}} $GLOBALS['____1898867209'][44](___1941807525(313), ___1941807525(314));/**/			//Do not remove this

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

/*ZDUyZmZNTkyNTA5ZmE1YmI2ZGZiZDhmMDI2NWJhOWJlZWMzYzI=*/$GLOBALS['____1765533286']= array(base64_decode('bXRfcmFuZA'.'='.'='),base64_decode('Y2FsbF91'.'c2'.'VyX2Z1b'.'m'.'M='),base64_decode('c3RycG9z'),base64_decode('ZXh'.'wbG9kZ'.'Q'.'=='),base64_decode('cGFjaw=='),base64_decode(''.'bWQ1'),base64_decode('Y'.'29uc3RhbnQ'.'='),base64_decode('aGF'.'zaF9obWFj'),base64_decode('c'.'3RyY'.'21w'),base64_decode(''.'Y2Fsb'.'F'.'91c2VyX2Z1'.'bmM='),base64_decode(''.'Y2FsbF9'.'1'.'c2VyX2Z'.'1bmM='),base64_decode('aXNfb'.'2J'.'qZWN0'),base64_decode('Y2Fs'.'bF91c2VyX'.'2Z1b'.'mM='),base64_decode(''.'Y2FsbF91c2'.'VyX2Z'.'1'.'bmM='),base64_decode('Y2'.'FsbF91c2VyX2Z1bmM='),base64_decode('Y2Fs'.'bF91c2VyX2Z1bm'.'M='),base64_decode(''.'Y2FsbF91'.'c2VyX2Z'.'1bmM='),base64_decode('Y2Fs'.'bF91c2VyX2Z1bmM='));if(!function_exists(__NAMESPACE__.'\\___1674692311')){function ___1674692311($_609483848){static $_1604044093= false; if($_1604044093 == false) $_1604044093=array('XE'.'NPcHRpb'.'246O'.'kdl'.'dE'.'9wdG'.'lv'.'blN'.'0'.'cm'.'luZw==','bWFpbg==','flBBUkF'.'NX01BWF'.'9'.'VU0'.'V'.'SUw='.'=','Lg==',''.'Lg==','SCo=','Ym'.'l0'.'cml4','TE'.'lDR'.'U5TRV9LRVk=','c'.'2h'.'hMjU'.'2','XENP'.'cHRp'.'b246O'.'k'.'dld'.'E9wdG'.'lvbl'.'N0cmluZw==','bWFpbg='.'=','UE'.'F'.'SQ'.'U1fTUFYX1VTRVJ'.'T',''.'XEJ'.'p'.'dHJpe'.'FxNYWluXENvb'.'mZpZ'.'1x'.'PcHRpb2'.'4'.'6OnNldA='.'=','b'.'WFpbg==','U'.'E'.'F'.'S'.'QU1'.'fT'.'UFY'.'X1VTRVJ'.'T','VVNFUg='.'=','VVNFUg'.'==','VVNF'.'Ug='.'=','SXNBdXRob3J'.'pe'.'mV'.'k','VVNFUg==','SXN'.'BZ'.'G1'.'pbg==','Q'.'VBQT'.'El'.'DQ'.'VRJT04=','Um'.'Vzd'.'GFydEJ'.'1Z'.'mZ'.'lcg==','T'.'G'.'9jY'.'WxSZWRpcmVjdA==',''.'L2x'.'pY2'.'V'.'uc2VfcmVzdHJpY3Rpb24ucGhw','XENPcHRp'.'b'.'2'.'4'.'6O'.'kdl'.'dE9wdGlvblN0cmluZw==','bWFp'.'bg==','UE'.'FSQU1'.'fTUF'.'YX1VTR'.'VJT','XEJpd'.'H'.'Jpe'.'F'.'x'.'NYW'.'luX'.'ENvbm'.'ZpZ1xPcH'.'Rpb246OnNldA'.'='.'=','bWFpbg==','UEFSQU'.'1f'.'TU'.'FYX1VT'.'RVJ'.'T');return base64_decode($_1604044093[$_609483848]);}};if($GLOBALS['____1765533286'][0](round(0+0.2+0.2+0.2+0.2+0.2), round(0+20)) == round(0+2.3333333333333+2.3333333333333+2.3333333333333)){ $_697462478= $GLOBALS['____1765533286'][1](___1674692311(0), ___1674692311(1), ___1674692311(2)); if(!empty($_697462478) && $GLOBALS['____1765533286'][2]($_697462478, ___1674692311(3)) !== false){ list($_139984540, $_333364841)= $GLOBALS['____1765533286'][3](___1674692311(4), $_697462478); $_917928840= $GLOBALS['____1765533286'][4](___1674692311(5), $_139984540); $_692007394= ___1674692311(6).$GLOBALS['____1765533286'][5]($GLOBALS['____1765533286'][6](___1674692311(7))); $_1588632696= $GLOBALS['____1765533286'][7](___1674692311(8), $_333364841, $_692007394, true); if($GLOBALS['____1765533286'][8]($_1588632696, $_917928840) !==(916-2*458)){ if($GLOBALS['____1765533286'][9](___1674692311(9), ___1674692311(10), ___1674692311(11)) != round(0+4+4+4)){ $GLOBALS['____1765533286'][10](___1674692311(12), ___1674692311(13), ___1674692311(14), round(0+4+4+4));} if(isset($GLOBALS[___1674692311(15)]) && $GLOBALS['____1765533286'][11]($GLOBALS[___1674692311(16)]) && $GLOBALS['____1765533286'][12](array($GLOBALS[___1674692311(17)], ___1674692311(18))) &&!$GLOBALS['____1765533286'][13](array($GLOBALS[___1674692311(19)], ___1674692311(20)))){ $GLOBALS['____1765533286'][14](array($GLOBALS[___1674692311(21)], ___1674692311(22))); $GLOBALS['____1765533286'][15](___1674692311(23), ___1674692311(24), true);}}} else{ if($GLOBALS['____1765533286'][16](___1674692311(25), ___1674692311(26), ___1674692311(27)) != round(0+12)){ $GLOBALS['____1765533286'][17](___1674692311(28), ___1674692311(29), ___1674692311(30), round(0+2.4+2.4+2.4+2.4+2.4));}}}/**/       //Do not remove this

