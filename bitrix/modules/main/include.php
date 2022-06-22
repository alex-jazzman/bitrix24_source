<?php
/**
 * Bitrix Framework
 * @package bitrix
 * @subpackage main
 * @copyright 2001-2013 Bitrix
 */

use Bitrix\Main\Session\Legacy\HealerEarlySessionStart;

require_once(__DIR__."/bx_root.php");
require_once(__DIR__."/start.php");

$application = \Bitrix\Main\Application::getInstance();
$application->initializeExtendedKernel(array(
	"get" => $_GET,
	"post" => $_POST,
	"files" => $_FILES,
	"cookie" => $_COOKIE,
	"server" => $_SERVER,
	"env" => $_ENV
));

//define global application object
$GLOBALS["APPLICATION"] = new CMain;

if(defined("SITE_ID"))
	define("LANG", SITE_ID);

if(defined("LANG"))
{
	if(defined("ADMIN_SECTION") && ADMIN_SECTION===true)
		$db_lang = CLangAdmin::GetByID(LANG);
	else
		$db_lang = CLang::GetByID(LANG);

	$arLang = $db_lang->Fetch();

	if(!$arLang)
	{
		throw new \Bitrix\Main\SystemException("Incorrect site: ".LANG.".");
	}
}
else
{
	$arLang = $GLOBALS["APPLICATION"]->GetLang();
	define("LANG", $arLang["LID"]);
}

if($arLang["CULTURE_ID"] == '')
{
	throw new \Bitrix\Main\SystemException("Culture not found, or there are no active sites or languages.");
}

$lang = $arLang["LID"];
if (!defined("SITE_ID"))
	define("SITE_ID", $arLang["LID"]);
define("SITE_DIR", ($arLang["DIR"] ?? ''));
define("SITE_SERVER_NAME", ($arLang["SERVER_NAME"] ?? ''));
define("SITE_CHARSET", $arLang["CHARSET"]);
define("FORMAT_DATE", $arLang["FORMAT_DATE"]);
define("FORMAT_DATETIME", $arLang["FORMAT_DATETIME"]);
define("LANG_DIR", ($arLang["DIR"] ?? ''));
define("LANG_CHARSET", $arLang["CHARSET"]);
define("LANG_ADMIN_LID", $arLang["LANGUAGE_ID"]);
define("LANGUAGE_ID", $arLang["LANGUAGE_ID"]);

$culture = \Bitrix\Main\Localization\CultureTable::getByPrimary($arLang["CULTURE_ID"], ["cache" => ["ttl" => CACHED_b_lang]])->fetchObject();

$context = $application->getContext();
$context->setLanguage(LANGUAGE_ID);
$context->setCulture($culture);

$request = $context->getRequest();
if (!$request->isAdminSection())
{
	$context->setSite(SITE_ID);
}

$application->start();

$GLOBALS["APPLICATION"]->reinitPath();

if (!defined("POST_FORM_ACTION_URI"))
{
	define("POST_FORM_ACTION_URI", htmlspecialcharsbx(GetRequestUri()));
}

$GLOBALS["MESS"] = [];
$GLOBALS["ALL_LANG_FILES"] = [];
IncludeModuleLangFile(__DIR__."/tools.php");
IncludeModuleLangFile(__FILE__);

error_reporting(COption::GetOptionInt("main", "error_reporting", E_COMPILE_ERROR|E_ERROR|E_CORE_ERROR|E_PARSE) & ~E_STRICT & ~E_DEPRECATED);

if(!defined("BX_COMP_MANAGED_CACHE") && COption::GetOptionString("main", "component_managed_cache_on", "Y") <> "N")
{
	define("BX_COMP_MANAGED_CACHE", true);
}

// global functions
require_once(__DIR__."/filter_tools.php");

define('BX_AJAX_PARAM_ID', 'bxajaxid');

/*ZDUyZmZMTczNDRlMzRhYTA3YTRkZmRkMmIyOWU5N2MwZGE5NTk=*/$GLOBALS['_____842261274']= array(base64_decode('R2V0TW'.'9k'.'dWxlRX'.'ZlbnRz'),base64_decode(''.'RXhl'.'Y3'.'V0'.'ZU'.'1vZHVsZ'.'UV2ZW50RXg='));$GLOBALS['____1169259475']= array(base64_decode('Z'.'GVmaW5l'),base64_decode(''.'c3RybG'.'V'.'u'),base64_decode('YmFzZT'.'Y0'.'X2Rl'.'Y29'.'kZQ=='),base64_decode('dW5'.'zZXJpYWxp'.'emU='),base64_decode('aXNf'.'YXJyYXk='),base64_decode(''.'Y'.'291b'.'n'.'Q'.'='),base64_decode('aW5f'.'YXJyYX'.'k='),base64_decode('c2Vy'.'aWFsaXpl'),base64_decode('Ym'.'F'.'zZTY0X'.'2Vu'.'Y'.'29kZQ=='),base64_decode(''.'c'.'3RybGVu'),base64_decode('Y'.'XJyY'.'Xlfa'.'2V'.'5X2'.'V4'.'aX'.'N0c'.'w=='),base64_decode(''.'YXJy'.'YXlfa'.'2V5X'.'2'.'V4'.'aXN0cw=='),base64_decode('bW'.'t0a'.'W1l'),base64_decode('ZGF'.'0Z'.'Q'.'=='),base64_decode('Z'.'GF0ZQ'.'=='),base64_decode('YXJyYXlf'.'a2V'.'5X'.'2V4'.'a'.'XN'.'0cw=='),base64_decode('c3R'.'ybG'.'Vu'),base64_decode(''.'YXJyYXlf'.'a'.'2V5X2V'.'4aX'.'N0cw='.'='),base64_decode(''.'c3RybGVu'),base64_decode('YX'.'JyYXlf'.'a2'.'V5X2V4'.'aXN0cw='.'='),base64_decode('YXJ'.'yY'.'X'.'lfa'.'2V5X'.'2V4aXN0cw=='),base64_decode('bWt0'.'a'.'W1'.'l'),base64_decode('ZGF0ZQ=='),base64_decode('Z'.'GF0ZQ=='),base64_decode('b'.'WV0aG9'.'kX2V4aXN0cw=='),base64_decode(''.'Y'.'2FsbF91c2VyX2Z1bmNfYXJyYXk'.'='),base64_decode(''.'c3RybGVu'),base64_decode('YXJy'.'YXlfa2V5'.'X2V'.'4'.'aXN0cw=='),base64_decode('YXJ'.'yYXlfa2V5X'.'2V'.'4aXN0'.'cw='.'='),base64_decode('c'.'2VyaWFs'.'aXp'.'l'),base64_decode(''.'YmFzZTY0X2'.'V'.'uY2'.'9kZQ=='),base64_decode('c'.'3RybGVu'),base64_decode(''.'Y'.'XJyYXlfa2V5X2V4aX'.'N0'.'cw=='),base64_decode('YX'.'JyYXlfa2V5X2V4aXN0cw='.'='),base64_decode('YXJyYXlfa2V5X2V4aXN0cw=='),base64_decode(''.'aXNfY'.'XJ'.'y'.'YXk='),base64_decode('Y'.'XJ'.'yYX'.'lf'.'a2'.'V'.'5X'.'2'.'V4aXN0cw='.'='),base64_decode('c'.'2'.'VyaWF'.'saXpl'),base64_decode('Y'.'mFzZTY'.'0X2VuY2'.'9kZQ=='),base64_decode('YXJ'.'yYXlfa2'.'V5X2V'.'4aXN0cw'.'='.'='),base64_decode('YXJ'.'yYXlfa2V5'.'X'.'2V4'.'aXN0'.'cw='.'='),base64_decode('c'.'2VyaWFsaXpl'),base64_decode('YmFzZTY0X'.'2'.'VuY2'.'9kZQ=='),base64_decode('aX'.'NfY'.'XJy'.'Y'.'Xk='),base64_decode(''.'a'.'XNfY'.'X'.'JyYXk='),base64_decode('a'.'W5fYXJyY'.'Xk'.'='),base64_decode(''.'YXJyY'.'X'.'lfa2V'.'5'.'X2V4aXN0cw='.'='),base64_decode('aW5fYXJyYXk='),base64_decode('bWt0a'.'W1l'),base64_decode('ZGF'.'0ZQ='.'='),base64_decode(''.'ZGF'.'0'.'ZQ'.'=='),base64_decode('ZGF0Z'.'Q=='),base64_decode('b'.'W'.'t'.'0aW1'.'l'),base64_decode('ZGF0'.'ZQ=='),base64_decode('ZGF0'.'Z'.'Q=='),base64_decode('aW'.'5'.'fY'.'XJy'.'YXk='),base64_decode('YXJy'.'YX'.'lfa2'.'V5'.'X2V4aXN0c'.'w='.'='),base64_decode('YXJ'.'yYXlfa2V5X2V4aXN0'.'c'.'w'.'=='),base64_decode(''.'c2VyaWFsa'.'X'.'pl'),base64_decode('YmFzZTY0X2'.'VuY29kZQ'.'=='),base64_decode('YXJyYXlfa'.'2'.'V5X2V4aXN0cw=='),base64_decode(''.'a'.'W50dm'.'Fs'),base64_decode(''.'dGl'.'tZ'.'Q=='),base64_decode('YX'.'Jy'.'YXl'.'fa'.'2V5X'.'2V4'.'aXN0cw=='),base64_decode('Zm'.'l'.'sZV9l'.'eGlzd'.'H'.'M'.'='),base64_decode('c3'.'R'.'yX3J'.'lcGxhY2U='),base64_decode('Y2xhc3NfZ'.'X'.'hpc'.'3Rz'),base64_decode('Z'.'GV'.'ma'.'W5'.'l'));if(!function_exists(__NAMESPACE__.'\\___715264495')){function ___715264495($_361705830){static $_1170100266= false; if($_1170100266 == false) $_1170100266=array('SU5UU'.'kFORVRfRURJVE'.'lP'.'Tg='.'=',''.'WQ==','bW'.'Fpb'.'g='.'=','f'.'m'.'NwZl9tYXB'.'fdmFsd'.'WU'.'=','',''.'ZQ==','Zg==','ZQ==','Rg==','WA==','Zg==','b'.'WF'.'p'.'b'.'g==',''.'fmN'.'wZ'.'l9tYXBfdmFsdW'.'U=','UG9y'.'d'.'GF'.'s','Rg='.'=','ZQ==','ZQ==','W'.'A==','Rg='.'=','R'.'A==','RA==','bQ==',''.'Z'.'A==',''.'W'.'Q==','Zg==','Zg==','Zg==','Zg==',''.'UG9ydGFs','Rg='.'=','ZQ==','ZQ==','W'.'A'.'==','Rg==','R'.'A==','RA'.'==','bQ='.'=','Z'.'A='.'=',''.'WQ==','bW'.'F'.'pbg==','T2'.'4=',''.'U2V0'.'dGl'.'uZ'.'3'.'NDaGFuZ2'.'U=','Zg==','Zg='.'=','Zg'.'==','Zg'.'==','bW'.'F'.'p'.'bg==','f'.'m'.'NwZl9tYX'.'BfdmFsdW'.'U=','ZQ==','ZQ==','Z'.'Q==',''.'RA==','ZQ'.'='.'=','ZQ='.'=','Zg==','Zg==','Zg==','ZQ==','b'.'W'.'Fpbg==',''.'fmNw'.'Zl9tYXBfd'.'m'.'FsdWU'.'=','ZQ==','Zg'.'==',''.'Zg==','Z'.'g==','Zg==','bW'.'F'.'pbg==','fm'.'NwZl'.'9tY'.'XBfd'.'mFsdW'.'U=',''.'ZQ==','Zg==',''.'U'.'G'.'9ydGFs','UG9'.'y'.'dGF'.'s',''.'Z'.'Q'.'==','Z'.'Q==','UG9'.'y'.'dGFs','Rg'.'==',''.'W'.'A'.'='.'=','Rg'.'==','R'.'A==','Z'.'Q==',''.'ZQ==','RA='.'=','bQ='.'=','ZA==','WQ==','ZQ='.'=',''.'WA==','ZQ==','Rg==','ZQ==','RA='.'=','Zg==','ZQ==','R'.'A==','ZQ==','bQ'.'==','ZA==','WQ==','Zg'.'==','Z'.'g==','Zg==','Zg'.'==','Zg='.'=','Zg==','Zg==','Zg==','bWFpbg==','fm'.'NwZl'.'9tYXBfdmFs'.'dWU=','ZQ==','ZQ'.'==','UG9'.'yd'.'G'.'F'.'s','Rg'.'==','WA='.'=','V'.'FlQRQ==','REFURQ='.'=','RkV'.'BVFVSR'.'VM=','RVhQSVJFRA==','VFlQR'.'Q==','RA==','VFJZX'.'0RB'.'WVNfQ0'.'9VTlQ=','REFURQ==','V'.'FJZ'.'X'.'0RB'.'W'.'V'.'NfQ'.'09VTlQ=','RV'.'hQS'.'VJFRA='.'=','R'.'kVBVFVSRVM'.'=',''.'Zg'.'==','Zg==','RE9DVU1FTlR'.'fUk9PVA==','L2Jp'.'dHJ'.'peC9'.'tb2'.'R1bGVz'.'L'.'w='.'=','L'.'2'.'luc3R'.'h'.'b'.'Gwva'.'W5kZXgu'.'cGhw',''.'Lg='.'=','Xw='.'=','c2VhcmNo','Tg'.'='.'=','','','QUNUS'.'VZF',''.'W'.'Q==',''.'c29'.'jaWF'.'s'.'bmV0d'.'29yaw='.'=','YW'.'xsb3dfZnJpZWxkcw'.'==','WQ='.'=','SUQ=',''.'c2'.'9ja'.'WFsbm'.'V'.'0d2'.'9yaw'.'==','Y'.'W'.'xsb3dfZnJpZ'.'Wxkcw==','S'.'UQ'.'=','c29'.'jaWFsbmV0d29y'.'a'.'w==',''.'YWxs'.'b3dfZnJpZ'.'W'.'xkcw==','T'.'g==','','','QU'.'NUSVZF','WQ='.'=','c29'.'jaWF'.'s'.'bmV0d29'.'ya'.'w==','YWxsb3dfbW'.'lj'.'cm9ib'.'G9nX3Vz'.'ZXI=',''.'W'.'Q==','SUQ=','c2'.'9jaW'.'Fsb'.'mV0d'.'29'.'yaw==','YWx'.'sb3dfbWljcm9ib'.'G9nX3VzZXI'.'=',''.'SUQ=','c29jaWFsbmV0'.'d29yaw==','Y'.'W'.'xsb3dfbW'.'l'.'j'.'cm9ibG9nX3VzZXI'.'=','c29jaWFsbm'.'V0d'.'29yaw==','Y'.'Wxsb3d'.'fbWljcm9ib'.'G9n'.'X2dyb3Vw','W'.'Q==','S'.'U'.'Q=',''.'c29jaWFsbmV0d2'.'9y'.'aw==','YWxsb3'.'dfbWljcm9'.'ibG9nX'.'2dy'.'b3Vw',''.'SUQ=','c29jaWFsb'.'mV0d29'.'ya'.'w==',''.'YWx'.'sb3dfbWljcm9ibG9n'.'X2dyb'.'3'.'Vw',''.'Tg==','','','QU'.'NUSVZF',''.'WQ==','c2'.'9'.'ja'.'W'.'Fsbm'.'V0d29yaw'.'='.'=','YWxsb3'.'dfZmlsZXN'.'fdXN'.'lcg='.'=','WQ==','SUQ'.'=','c29ja'.'WFsbmV0d'.'29y'.'a'.'w==','Y'.'W'.'xsb'.'3d'.'fZmls'.'ZXNfdXN'.'lcg='.'=','SUQ=',''.'c29jaWFs'.'bmV0d29'.'yaw'.'='.'=','Y'.'Wxsb3d'.'fZmlsZXNfdX'.'Nlcg'.'==','Tg'.'==','','',''.'Q'.'UNUSVZF','WQ==','c'.'29jaW'.'FsbmV0d29yaw==',''.'YWxsb3d'.'f'.'Ym'.'x'.'vZ'.'1'.'91c2Vy','WQ==','SUQ=','c29'.'j'.'a'.'WFsbmV0d2'.'9'.'ya'.'w==',''.'YWxsb'.'3d'.'fYm'.'xvZ191c2Vy','SUQ=','c29jaWFsbmV0d29yaw==',''.'YWxsb3dfYmxvZ191c2Vy','Tg==','','','Q'.'U'.'NUSV'.'ZF','WQ==','c29'.'j'.'aWFsbmV0'.'d'.'29y'.'aw='.'=',''.'Y'.'Wxsb3d'.'f'.'cG'.'hvdG9f'.'dXNlcg==','WQ='.'=','S'.'UQ'.'=','c'.'29ja'.'WFsbmV'.'0d2'.'9yaw'.'==','YW'.'xs'.'b3dfcG'.'hvdG9'.'fdXNlc'.'g='.'=','SUQ'.'=','c29jaWFsbmV0d'.'29'.'yaw==','YWxsb3dfc'.'Ghvd'.'G9f'.'dX'.'Nlcg==','Tg==','','','QUNUSV'.'ZF','WQ='.'=','c29j'.'aWF'.'sbmV0d29yaw==',''.'YWxsb3'.'dfZm'.'9ydW1fdXNlc'.'g==',''.'WQ==','SUQ'.'=','c2'.'9jaW'.'F'.'sbm'.'V0d29yaw='.'=','YWxsb'.'3df'.'Zm'.'9yd'.'W1'.'fdXNlcg='.'=',''.'SUQ=','c29'.'jaW'.'FsbmV0d29'.'ya'.'w'.'==','YWxsb3dfZm9ydW'.'1fd'.'XNlcg==','Tg==','','','Q'.'UNUSVZF',''.'W'.'Q==',''.'c29'.'jaW'.'F'.'sbmV0d29yaw='.'=','YW'.'xsb3dfdGFza3NfdXNlcg==',''.'WQ==',''.'SUQ=',''.'c29jaWF'.'sbmV0d29'.'yaw==','YWxsb'.'3dfdG'.'Fz'.'a3Nfd'.'XNlcg='.'=','SU'.'Q=','c29ja'.'WFsbmV'.'0d29'.'yaw==','YWx'.'sb3d'.'f'.'dG'.'Fz'.'a3N'.'fd'.'XNlcg'.'==','c29'.'j'.'aWFs'.'bmV0d29'.'yaw==','YWxs'.'b3dfdGFza'.'3Nf'.'Z3Jv'.'d'.'XA=','WQ==','S'.'UQ'.'=','c2'.'9jaWFsbmV0d29yaw==','Y'.'Wxsb3dfdG'.'Fza3NfZ'.'3Jvd'.'XA=','S'.'U'.'Q=','c29jaWF'.'sbmV0'.'d29yaw==','Y'.'Wxs'.'b3'.'df'.'dGF'.'za3NfZ'.'3J'.'vdX'.'A=','dGFz'.'a3M=','T'.'g==','','','QUNUSV'.'ZF','WQ==',''.'c29ja'.'WFsbmV'.'0d29yaw==',''.'YW'.'xsb3dfY2F'.'sZ'.'W'.'5k'.'YXJfdX'.'N'.'lc'.'g'.'==',''.'WQ='.'=','SUQ=','c2'.'9'.'jaWFsbmV'.'0d29y'.'aw'.'==','Y'.'W'.'xs'.'b3dfY2Fs'.'ZW5'.'kYX'.'JfdXNlc'.'g'.'==','SUQ'.'=','c29ja'.'WF'.'s'.'bm'.'V'.'0d29y'.'aw==',''.'YWxsb3d'.'fY2FsZW5k'.'YXJfdXNlc'.'g==','c'.'29jaWFsbm'.'V0d29ya'.'w='.'=','YWxs'.'b'.'3'.'dfY2FsZW5kY'.'X'.'J'.'f'.'Z3JvdXA'.'=','WQ==',''.'SUQ=','c29jaWFsbmV0d29yaw==','YWx'.'sb3d'.'fY2FsZW5kYXJfZ3JvdXA=','SUQ=',''.'c'.'29jaWFsbmV'.'0d29ya'.'w==','YWx'.'sb3d'.'fY2Fs'.'ZW5kY'.'X'.'J'.'fZ'.'3J'.'vdXA'.'=','Q'.'UNUSVZF','WQ==','Tg==','ZX'.'h0cmFuZXQ=',''.'aWJsb2Nr','T'.'2'.'5BZ'.'nRlck'.'lCbG9ja0Vs'.'ZW'.'1'.'lbn'.'RVc'.'GR'.'hdGU=','a'.'W'.'50'.'cm'.'FuZX'.'Q=','Q0ludHJhbmV0RXZl'.'bnRIYW'.'5'.'kbGVyc'.'w==','U1BSZ'.'W'.'dpc3RlclVwZGF0ZWR'.'JdGVt','Q0lu'.'dHJhbmV0'.'U2hhcmVwb2'.'lu'.'dDo6QWdl'.'b'.'nR'.'MaXN0cyg'.'pOw==','aW50'.'cm'.'F'.'uZXQ=','Tg==','Q0ludHJhbm'.'V0U2hh'.'cmVwb'.'2'.'ludDo6QWdl'.'bnRRdW'.'V1'.'ZSgpOw==','aW'.'50'.'cmFu'.'Z'.'XQ=','Tg==','Q0'.'ludHJhbmV'.'0U2hhc'.'mVwb2'.'ludDo'.'6QWd'.'lbnRVc'.'GRh'.'dGU'.'oKTs=','aW50'.'cmFuZXQ=','Tg==','aW'.'Jsb'.'2'.'Nr',''.'T'.'2'.'5BZ'.'nRlcklC'.'bG9ja0VsZW1'.'lb'.'nRBZGQ=','aW5'.'0cm'.'FuZ'.'XQ=','Q0ludH'.'JhbmV'.'0RXZlb'.'nRIYW5kbG'.'Vy'.'c'.'w='.'=','U'.'1BS'.'ZWdpc3R'.'lc'.'l'.'VwZGF0ZWRJ'.'d'.'GVt','aWJsb2Nr','T'.'2'.'5'.'BZnRlcklCbG9ja0VsZW'.'1l'.'b'.'nRVcGRhdG'.'U=','aW50cmFuZ'.'X'.'Q=','Q0l'.'udHJh'.'bm'.'V0RXZlbnRIYW5'.'kbGVy'.'cw='.'=','U1B'.'SZ'.'W'.'dp'.'c3R'.'l'.'cl'.'VwZGF0'.'ZW'.'RJdGVt','Q'.'0'.'ludHJhbmV'.'0U'.'2h'.'hc'.'mVwb2lu'.'dD'.'o6QWdlbnRMaXN'.'0cygpOw'.'==','a'.'W'.'50cmFu'.'ZXQ=','Q0'.'lud'.'HJhbmV0U2h'.'hcmVwb2ludDo6QWdlbnRRdWV1ZSgpOw='.'=','aW50cmFu'.'ZXQ'.'=','Q'.'0ludHJ'.'hbmV0U2h'.'hcmVwb2lu'.'dDo6QWd'.'l'.'bn'.'R'.'V'.'cGRhdGUoKTs=',''.'aW50cm'.'F'.'uZXQ=','Y'.'3Jt','bWFpbg==','T2'.'5CZW'.'ZvcmVQ'.'cm9s'.'b2c=','bWFp'.'bg==','Q1dpemFyZFNvbFB'.'hbmVs'.'SW50c'.'m'.'Fu'.'ZXQ=','U2hvd1'.'BhbmVs','L21v'.'ZH'.'VsZXMvaW50cmFuZXQv'.'cGF'.'u'.'ZWxfYn'.'V0'.'dG'.'9u'.'Ln'.'BocA='.'=',''.'RU5DT0'.'RF','WQ='.'=');return base64_decode($_1170100266[$_361705830]);}};$GLOBALS['____1169259475'][0](___715264495(0), ___715264495(1));class CBXFeatures{ private static $_404217331= 30; private static $_2123280556= array( "Portal" => array( "CompanyCalendar", "CompanyPhoto", "CompanyVideo", "CompanyCareer", "StaffChanges", "StaffAbsence", "CommonDocuments", "MeetingRoomBookingSystem", "Wiki", "Learning", "Vote", "WebLink", "Subscribe", "Friends", "PersonalFiles", "PersonalBlog", "PersonalPhoto", "PersonalForum", "Blog", "Forum", "Gallery", "Board", "MicroBlog", "WebMessenger",), "Communications" => array( "Tasks", "Calendar", "Workgroups", "Jabber", "VideoConference", "Extranet", "SMTP", "Requests", "DAV", "intranet_sharepoint", "timeman", "Idea", "Meeting", "EventList", "Salary", "XDImport",), "Enterprise" => array( "BizProc", "Lists", "Support", "Analytics", "crm", "Controller", "LdapUnlimitedUsers",), "Holding" => array( "Cluster", "MultiSites",),); private static $_1666200679= false; private static $_202427201= false; private static function __1605502410(){ if(self::$_1666200679 == false){ self::$_1666200679= array(); foreach(self::$_2123280556 as $_1564943752 => $_1171046316){ foreach($_1171046316 as $_366087222) self::$_1666200679[$_366087222]= $_1564943752;}} if(self::$_202427201 == false){ self::$_202427201= array(); $_1837795956= COption::GetOptionString(___715264495(2), ___715264495(3), ___715264495(4)); if($GLOBALS['____1169259475'][1]($_1837795956)>(1180/2-590)){ $_1837795956= $GLOBALS['____1169259475'][2]($_1837795956); self::$_202427201= $GLOBALS['____1169259475'][3]($_1837795956); if(!$GLOBALS['____1169259475'][4](self::$_202427201)) self::$_202427201= array();} if($GLOBALS['____1169259475'][5](self::$_202427201) <=(187*2-374)) self::$_202427201= array(___715264495(5) => array(), ___715264495(6) => array());}} public static function InitiateEditionsSettings($_556195277){ self::__1605502410(); $_881274393= array(); foreach(self::$_2123280556 as $_1564943752 => $_1171046316){ $_7715157= $GLOBALS['____1169259475'][6]($_1564943752, $_556195277); self::$_202427201[___715264495(7)][$_1564943752]=($_7715157? array(___715264495(8)): array(___715264495(9))); foreach($_1171046316 as $_366087222){ self::$_202427201[___715264495(10)][$_366087222]= $_7715157; if(!$_7715157) $_881274393[]= array($_366087222, false);}} $_262087071= $GLOBALS['____1169259475'][7](self::$_202427201); $_262087071= $GLOBALS['____1169259475'][8]($_262087071); COption::SetOptionString(___715264495(11), ___715264495(12), $_262087071); foreach($_881274393 as $_53299742) self::__1703554389($_53299742[min(2,0,0.66666666666667)], $_53299742[round(0+0.2+0.2+0.2+0.2+0.2)]);} public static function IsFeatureEnabled($_366087222){ if($GLOBALS['____1169259475'][9]($_366087222) <= 0) return true; self::__1605502410(); if(!$GLOBALS['____1169259475'][10]($_366087222, self::$_1666200679)) return true; if(self::$_1666200679[$_366087222] == ___715264495(13)) $_112712175= array(___715264495(14)); elseif($GLOBALS['____1169259475'][11](self::$_1666200679[$_366087222], self::$_202427201[___715264495(15)])) $_112712175= self::$_202427201[___715264495(16)][self::$_1666200679[$_366087222]]; else $_112712175= array(___715264495(17)); if($_112712175[(944-2*472)] != ___715264495(18) && $_112712175[(192*2-384)] != ___715264495(19)){ return false;} elseif($_112712175[(1028/2-514)] == ___715264495(20)){ if($_112712175[round(0+1)]< $GLOBALS['____1169259475'][12](min(22,0,7.3333333333333),(876-2*438),(1392/2-696), Date(___715264495(21)), $GLOBALS['____1169259475'][13](___715264495(22))- self::$_404217331, $GLOBALS['____1169259475'][14](___715264495(23)))){ if(!isset($_112712175[round(0+2)]) ||!$_112712175[round(0+0.4+0.4+0.4+0.4+0.4)]) self::__556563091(self::$_1666200679[$_366087222]); return false;}} return!$GLOBALS['____1169259475'][15]($_366087222, self::$_202427201[___715264495(24)]) || self::$_202427201[___715264495(25)][$_366087222];} public static function IsFeatureInstalled($_366087222){ if($GLOBALS['____1169259475'][16]($_366087222) <= 0) return true; self::__1605502410(); return($GLOBALS['____1169259475'][17]($_366087222, self::$_202427201[___715264495(26)]) && self::$_202427201[___715264495(27)][$_366087222]);} public static function IsFeatureEditable($_366087222){ if($GLOBALS['____1169259475'][18]($_366087222) <= 0) return true; self::__1605502410(); if(!$GLOBALS['____1169259475'][19]($_366087222, self::$_1666200679)) return true; if(self::$_1666200679[$_366087222] == ___715264495(28)) $_112712175= array(___715264495(29)); elseif($GLOBALS['____1169259475'][20](self::$_1666200679[$_366087222], self::$_202427201[___715264495(30)])) $_112712175= self::$_202427201[___715264495(31)][self::$_1666200679[$_366087222]]; else $_112712175= array(___715264495(32)); if($_112712175[(1292/2-646)] != ___715264495(33) && $_112712175[min(18,0,6)] != ___715264495(34)){ return false;} elseif($_112712175[min(34,0,11.333333333333)] == ___715264495(35)){ if($_112712175[round(0+0.33333333333333+0.33333333333333+0.33333333333333)]< $GLOBALS['____1169259475'][21]((148*2-296),(760-2*380), min(162,0,54), Date(___715264495(36)), $GLOBALS['____1169259475'][22](___715264495(37))- self::$_404217331, $GLOBALS['____1169259475'][23](___715264495(38)))){ if(!isset($_112712175[round(0+1+1)]) ||!$_112712175[round(0+0.66666666666667+0.66666666666667+0.66666666666667)]) self::__556563091(self::$_1666200679[$_366087222]); return false;}} return true;} private static function __1703554389($_366087222, $_214753281){ if($GLOBALS['____1169259475'][24]("CBXFeatures", "On".$_366087222."SettingsChange")) $GLOBALS['____1169259475'][25](array("CBXFeatures", "On".$_366087222."SettingsChange"), array($_366087222, $_214753281)); $_367780828= $GLOBALS['_____842261274'][0](___715264495(39), ___715264495(40).$_366087222.___715264495(41)); while($_1052701613= $_367780828->Fetch()) $GLOBALS['_____842261274'][1]($_1052701613, array($_366087222, $_214753281));} public static function SetFeatureEnabled($_366087222, $_214753281= true, $_119470553= true){ if($GLOBALS['____1169259475'][26]($_366087222) <= 0) return; if(!self::IsFeatureEditable($_366087222)) $_214753281= false; $_214753281=($_214753281? true: false); self::__1605502410(); $_180386247=(!$GLOBALS['____1169259475'][27]($_366087222, self::$_202427201[___715264495(42)]) && $_214753281 || $GLOBALS['____1169259475'][28]($_366087222, self::$_202427201[___715264495(43)]) && $_214753281 != self::$_202427201[___715264495(44)][$_366087222]); self::$_202427201[___715264495(45)][$_366087222]= $_214753281; $_262087071= $GLOBALS['____1169259475'][29](self::$_202427201); $_262087071= $GLOBALS['____1169259475'][30]($_262087071); COption::SetOptionString(___715264495(46), ___715264495(47), $_262087071); if($_180386247 && $_119470553) self::__1703554389($_366087222, $_214753281);} private static function __556563091($_1564943752){ if($GLOBALS['____1169259475'][31]($_1564943752) <= 0 || $_1564943752 == "Portal") return; self::__1605502410(); if(!$GLOBALS['____1169259475'][32]($_1564943752, self::$_202427201[___715264495(48)]) || $GLOBALS['____1169259475'][33]($_1564943752, self::$_202427201[___715264495(49)]) && self::$_202427201[___715264495(50)][$_1564943752][(241*2-482)] != ___715264495(51)) return; if(isset(self::$_202427201[___715264495(52)][$_1564943752][round(0+1+1)]) && self::$_202427201[___715264495(53)][$_1564943752][round(0+2)]) return; $_881274393= array(); if($GLOBALS['____1169259475'][34]($_1564943752, self::$_2123280556) && $GLOBALS['____1169259475'][35](self::$_2123280556[$_1564943752])){ foreach(self::$_2123280556[$_1564943752] as $_366087222){ if($GLOBALS['____1169259475'][36]($_366087222, self::$_202427201[___715264495(54)]) && self::$_202427201[___715264495(55)][$_366087222]){ self::$_202427201[___715264495(56)][$_366087222]= false; $_881274393[]= array($_366087222, false);}} self::$_202427201[___715264495(57)][$_1564943752][round(0+0.5+0.5+0.5+0.5)]= true;} $_262087071= $GLOBALS['____1169259475'][37](self::$_202427201); $_262087071= $GLOBALS['____1169259475'][38]($_262087071); COption::SetOptionString(___715264495(58), ___715264495(59), $_262087071); foreach($_881274393 as $_53299742) self::__1703554389($_53299742[(1144/2-572)], $_53299742[round(0+0.2+0.2+0.2+0.2+0.2)]);} public static function ModifyFeaturesSettings($_556195277, $_1171046316){ self::__1605502410(); foreach($_556195277 as $_1564943752 => $_101006918) self::$_202427201[___715264495(60)][$_1564943752]= $_101006918; $_881274393= array(); foreach($_1171046316 as $_366087222 => $_214753281){ if(!$GLOBALS['____1169259475'][39]($_366087222, self::$_202427201[___715264495(61)]) && $_214753281 || $GLOBALS['____1169259475'][40]($_366087222, self::$_202427201[___715264495(62)]) && $_214753281 != self::$_202427201[___715264495(63)][$_366087222]) $_881274393[]= array($_366087222, $_214753281); self::$_202427201[___715264495(64)][$_366087222]= $_214753281;} $_262087071= $GLOBALS['____1169259475'][41](self::$_202427201); $_262087071= $GLOBALS['____1169259475'][42]($_262087071); COption::SetOptionString(___715264495(65), ___715264495(66), $_262087071); self::$_202427201= false; foreach($_881274393 as $_53299742) self::__1703554389($_53299742[(1416/2-708)], $_53299742[round(0+0.2+0.2+0.2+0.2+0.2)]);} public static function SaveFeaturesSettings($_401879269, $_2116401604){ self::__1605502410(); $_1975329563= array(___715264495(67) => array(), ___715264495(68) => array()); if(!$GLOBALS['____1169259475'][43]($_401879269)) $_401879269= array(); if(!$GLOBALS['____1169259475'][44]($_2116401604)) $_2116401604= array(); if(!$GLOBALS['____1169259475'][45](___715264495(69), $_401879269)) $_401879269[]= ___715264495(70); foreach(self::$_2123280556 as $_1564943752 => $_1171046316){ if($GLOBALS['____1169259475'][46]($_1564943752, self::$_202427201[___715264495(71)])) $_1425158293= self::$_202427201[___715264495(72)][$_1564943752]; else $_1425158293=($_1564943752 == ___715264495(73))? array(___715264495(74)): array(___715264495(75)); if($_1425158293[(145*2-290)] == ___715264495(76) || $_1425158293[(1500/2-750)] == ___715264495(77)){ $_1975329563[___715264495(78)][$_1564943752]= $_1425158293;} else{ if($GLOBALS['____1169259475'][47]($_1564943752, $_401879269)) $_1975329563[___715264495(79)][$_1564943752]= array(___715264495(80), $GLOBALS['____1169259475'][48]((1088/2-544), min(122,0,40.666666666667),(158*2-316), $GLOBALS['____1169259475'][49](___715264495(81)), $GLOBALS['____1169259475'][50](___715264495(82)), $GLOBALS['____1169259475'][51](___715264495(83)))); else $_1975329563[___715264495(84)][$_1564943752]= array(___715264495(85));}} $_881274393= array(); foreach(self::$_1666200679 as $_366087222 => $_1564943752){ if($_1975329563[___715264495(86)][$_1564943752][(854-2*427)] != ___715264495(87) && $_1975329563[___715264495(88)][$_1564943752][(181*2-362)] != ___715264495(89)){ $_1975329563[___715264495(90)][$_366087222]= false;} else{ if($_1975329563[___715264495(91)][$_1564943752][(238*2-476)] == ___715264495(92) && $_1975329563[___715264495(93)][$_1564943752][round(0+0.2+0.2+0.2+0.2+0.2)]< $GLOBALS['____1169259475'][52](min(62,0,20.666666666667),(1256/2-628),(175*2-350), Date(___715264495(94)), $GLOBALS['____1169259475'][53](___715264495(95))- self::$_404217331, $GLOBALS['____1169259475'][54](___715264495(96)))) $_1975329563[___715264495(97)][$_366087222]= false; else $_1975329563[___715264495(98)][$_366087222]= $GLOBALS['____1169259475'][55]($_366087222, $_2116401604); if(!$GLOBALS['____1169259475'][56]($_366087222, self::$_202427201[___715264495(99)]) && $_1975329563[___715264495(100)][$_366087222] || $GLOBALS['____1169259475'][57]($_366087222, self::$_202427201[___715264495(101)]) && $_1975329563[___715264495(102)][$_366087222] != self::$_202427201[___715264495(103)][$_366087222]) $_881274393[]= array($_366087222, $_1975329563[___715264495(104)][$_366087222]);}} $_262087071= $GLOBALS['____1169259475'][58]($_1975329563); $_262087071= $GLOBALS['____1169259475'][59]($_262087071); COption::SetOptionString(___715264495(105), ___715264495(106), $_262087071); self::$_202427201= false; foreach($_881274393 as $_53299742) self::__1703554389($_53299742[(1172/2-586)], $_53299742[round(0+0.2+0.2+0.2+0.2+0.2)]);} public static function GetFeaturesList(){ self::__1605502410(); $_1496963320= array(); foreach(self::$_2123280556 as $_1564943752 => $_1171046316){ if($GLOBALS['____1169259475'][60]($_1564943752, self::$_202427201[___715264495(107)])) $_1425158293= self::$_202427201[___715264495(108)][$_1564943752]; else $_1425158293=($_1564943752 == ___715264495(109))? array(___715264495(110)): array(___715264495(111)); $_1496963320[$_1564943752]= array( ___715264495(112) => $_1425158293[min(150,0,50)], ___715264495(113) => $_1425158293[round(0+1)], ___715264495(114) => array(),); $_1496963320[$_1564943752][___715264495(115)]= false; if($_1496963320[$_1564943752][___715264495(116)] == ___715264495(117)){ $_1496963320[$_1564943752][___715264495(118)]= $GLOBALS['____1169259475'][61](($GLOBALS['____1169259475'][62]()- $_1496963320[$_1564943752][___715264495(119)])/ round(0+43200+43200)); if($_1496963320[$_1564943752][___715264495(120)]> self::$_404217331) $_1496963320[$_1564943752][___715264495(121)]= true;} foreach($_1171046316 as $_366087222) $_1496963320[$_1564943752][___715264495(122)][$_366087222]=(!$GLOBALS['____1169259475'][63]($_366087222, self::$_202427201[___715264495(123)]) || self::$_202427201[___715264495(124)][$_366087222]);} return $_1496963320;} private static function __1714329711($_1332758676, $_993204165){ if(IsModuleInstalled($_1332758676) == $_993204165) return true; $_639110036= $_SERVER[___715264495(125)].___715264495(126).$_1332758676.___715264495(127); if(!$GLOBALS['____1169259475'][64]($_639110036)) return false; include_once($_639110036); $_567746221= $GLOBALS['____1169259475'][65](___715264495(128), ___715264495(129), $_1332758676); if(!$GLOBALS['____1169259475'][66]($_567746221)) return false; $_3398082= new $_567746221; if($_993204165){ if(!$_3398082->InstallDB()) return false; $_3398082->InstallEvents(); if(!$_3398082->InstallFiles()) return false;} else{ if(CModule::IncludeModule(___715264495(130))) CSearch::DeleteIndex($_1332758676); UnRegisterModule($_1332758676);} return true;} protected static function OnRequestsSettingsChange($_366087222, $_214753281){ self::__1714329711("form", $_214753281);} protected static function OnLearningSettingsChange($_366087222, $_214753281){ self::__1714329711("learning", $_214753281);} protected static function OnJabberSettingsChange($_366087222, $_214753281){ self::__1714329711("xmpp", $_214753281);} protected static function OnVideoConferenceSettingsChange($_366087222, $_214753281){ self::__1714329711("video", $_214753281);} protected static function OnBizProcSettingsChange($_366087222, $_214753281){ self::__1714329711("bizprocdesigner", $_214753281);} protected static function OnListsSettingsChange($_366087222, $_214753281){ self::__1714329711("lists", $_214753281);} protected static function OnWikiSettingsChange($_366087222, $_214753281){ self::__1714329711("wiki", $_214753281);} protected static function OnSupportSettingsChange($_366087222, $_214753281){ self::__1714329711("support", $_214753281);} protected static function OnControllerSettingsChange($_366087222, $_214753281){ self::__1714329711("controller", $_214753281);} protected static function OnAnalyticsSettingsChange($_366087222, $_214753281){ self::__1714329711("statistic", $_214753281);} protected static function OnVoteSettingsChange($_366087222, $_214753281){ self::__1714329711("vote", $_214753281);} protected static function OnFriendsSettingsChange($_366087222, $_214753281){ if($_214753281) $_1496552394= "Y"; else $_1496552394= ___715264495(131); $_445856351= CSite::GetList(($_7715157= ___715264495(132)),($_1965539339= ___715264495(133)), array(___715264495(134) => ___715264495(135))); while($_1284320352= $_445856351->Fetch()){ if(COption::GetOptionString(___715264495(136), ___715264495(137), ___715264495(138), $_1284320352[___715264495(139)]) != $_1496552394){ COption::SetOptionString(___715264495(140), ___715264495(141), $_1496552394, false, $_1284320352[___715264495(142)]); COption::SetOptionString(___715264495(143), ___715264495(144), $_1496552394);}}} protected static function OnMicroBlogSettingsChange($_366087222, $_214753281){ if($_214753281) $_1496552394= "Y"; else $_1496552394= ___715264495(145); $_445856351= CSite::GetList(($_7715157= ___715264495(146)),($_1965539339= ___715264495(147)), array(___715264495(148) => ___715264495(149))); while($_1284320352= $_445856351->Fetch()){ if(COption::GetOptionString(___715264495(150), ___715264495(151), ___715264495(152), $_1284320352[___715264495(153)]) != $_1496552394){ COption::SetOptionString(___715264495(154), ___715264495(155), $_1496552394, false, $_1284320352[___715264495(156)]); COption::SetOptionString(___715264495(157), ___715264495(158), $_1496552394);} if(COption::GetOptionString(___715264495(159), ___715264495(160), ___715264495(161), $_1284320352[___715264495(162)]) != $_1496552394){ COption::SetOptionString(___715264495(163), ___715264495(164), $_1496552394, false, $_1284320352[___715264495(165)]); COption::SetOptionString(___715264495(166), ___715264495(167), $_1496552394);}}} protected static function OnPersonalFilesSettingsChange($_366087222, $_214753281){ if($_214753281) $_1496552394= "Y"; else $_1496552394= ___715264495(168); $_445856351= CSite::GetList(($_7715157= ___715264495(169)),($_1965539339= ___715264495(170)), array(___715264495(171) => ___715264495(172))); while($_1284320352= $_445856351->Fetch()){ if(COption::GetOptionString(___715264495(173), ___715264495(174), ___715264495(175), $_1284320352[___715264495(176)]) != $_1496552394){ COption::SetOptionString(___715264495(177), ___715264495(178), $_1496552394, false, $_1284320352[___715264495(179)]); COption::SetOptionString(___715264495(180), ___715264495(181), $_1496552394);}}} protected static function OnPersonalBlogSettingsChange($_366087222, $_214753281){ if($_214753281) $_1496552394= "Y"; else $_1496552394= ___715264495(182); $_445856351= CSite::GetList(($_7715157= ___715264495(183)),($_1965539339= ___715264495(184)), array(___715264495(185) => ___715264495(186))); while($_1284320352= $_445856351->Fetch()){ if(COption::GetOptionString(___715264495(187), ___715264495(188), ___715264495(189), $_1284320352[___715264495(190)]) != $_1496552394){ COption::SetOptionString(___715264495(191), ___715264495(192), $_1496552394, false, $_1284320352[___715264495(193)]); COption::SetOptionString(___715264495(194), ___715264495(195), $_1496552394);}}} protected static function OnPersonalPhotoSettingsChange($_366087222, $_214753281){ if($_214753281) $_1496552394= "Y"; else $_1496552394= ___715264495(196); $_445856351= CSite::GetList(($_7715157= ___715264495(197)),($_1965539339= ___715264495(198)), array(___715264495(199) => ___715264495(200))); while($_1284320352= $_445856351->Fetch()){ if(COption::GetOptionString(___715264495(201), ___715264495(202), ___715264495(203), $_1284320352[___715264495(204)]) != $_1496552394){ COption::SetOptionString(___715264495(205), ___715264495(206), $_1496552394, false, $_1284320352[___715264495(207)]); COption::SetOptionString(___715264495(208), ___715264495(209), $_1496552394);}}} protected static function OnPersonalForumSettingsChange($_366087222, $_214753281){ if($_214753281) $_1496552394= "Y"; else $_1496552394= ___715264495(210); $_445856351= CSite::GetList(($_7715157= ___715264495(211)),($_1965539339= ___715264495(212)), array(___715264495(213) => ___715264495(214))); while($_1284320352= $_445856351->Fetch()){ if(COption::GetOptionString(___715264495(215), ___715264495(216), ___715264495(217), $_1284320352[___715264495(218)]) != $_1496552394){ COption::SetOptionString(___715264495(219), ___715264495(220), $_1496552394, false, $_1284320352[___715264495(221)]); COption::SetOptionString(___715264495(222), ___715264495(223), $_1496552394);}}} protected static function OnTasksSettingsChange($_366087222, $_214753281){ if($_214753281) $_1496552394= "Y"; else $_1496552394= ___715264495(224); $_445856351= CSite::GetList(($_7715157= ___715264495(225)),($_1965539339= ___715264495(226)), array(___715264495(227) => ___715264495(228))); while($_1284320352= $_445856351->Fetch()){ if(COption::GetOptionString(___715264495(229), ___715264495(230), ___715264495(231), $_1284320352[___715264495(232)]) != $_1496552394){ COption::SetOptionString(___715264495(233), ___715264495(234), $_1496552394, false, $_1284320352[___715264495(235)]); COption::SetOptionString(___715264495(236), ___715264495(237), $_1496552394);} if(COption::GetOptionString(___715264495(238), ___715264495(239), ___715264495(240), $_1284320352[___715264495(241)]) != $_1496552394){ COption::SetOptionString(___715264495(242), ___715264495(243), $_1496552394, false, $_1284320352[___715264495(244)]); COption::SetOptionString(___715264495(245), ___715264495(246), $_1496552394);}} self::__1714329711(___715264495(247), $_214753281);} protected static function OnCalendarSettingsChange($_366087222, $_214753281){ if($_214753281) $_1496552394= "Y"; else $_1496552394= ___715264495(248); $_445856351= CSite::GetList(($_7715157= ___715264495(249)),($_1965539339= ___715264495(250)), array(___715264495(251) => ___715264495(252))); while($_1284320352= $_445856351->Fetch()){ if(COption::GetOptionString(___715264495(253), ___715264495(254), ___715264495(255), $_1284320352[___715264495(256)]) != $_1496552394){ COption::SetOptionString(___715264495(257), ___715264495(258), $_1496552394, false, $_1284320352[___715264495(259)]); COption::SetOptionString(___715264495(260), ___715264495(261), $_1496552394);} if(COption::GetOptionString(___715264495(262), ___715264495(263), ___715264495(264), $_1284320352[___715264495(265)]) != $_1496552394){ COption::SetOptionString(___715264495(266), ___715264495(267), $_1496552394, false, $_1284320352[___715264495(268)]); COption::SetOptionString(___715264495(269), ___715264495(270), $_1496552394);}}} protected static function OnSMTPSettingsChange($_366087222, $_214753281){ self::__1714329711("mail", $_214753281);} protected static function OnExtranetSettingsChange($_366087222, $_214753281){ $_1131432702= COption::GetOptionString("extranet", "extranet_site", ""); if($_1131432702){ $_881181258= new CSite; $_881181258->Update($_1131432702, array(___715264495(271) =>($_214753281? ___715264495(272): ___715264495(273))));} self::__1714329711(___715264495(274), $_214753281);} protected static function OnDAVSettingsChange($_366087222, $_214753281){ self::__1714329711("dav", $_214753281);} protected static function OntimemanSettingsChange($_366087222, $_214753281){ self::__1714329711("timeman", $_214753281);} protected static function Onintranet_sharepointSettingsChange($_366087222, $_214753281){ if($_214753281){ RegisterModuleDependences("iblock", "OnAfterIBlockElementAdd", "intranet", "CIntranetEventHandlers", "SPRegisterUpdatedItem"); RegisterModuleDependences(___715264495(275), ___715264495(276), ___715264495(277), ___715264495(278), ___715264495(279)); CAgent::AddAgent(___715264495(280), ___715264495(281), ___715264495(282), round(0+100+100+100+100+100)); CAgent::AddAgent(___715264495(283), ___715264495(284), ___715264495(285), round(0+300)); CAgent::AddAgent(___715264495(286), ___715264495(287), ___715264495(288), round(0+720+720+720+720+720));} else{ UnRegisterModuleDependences(___715264495(289), ___715264495(290), ___715264495(291), ___715264495(292), ___715264495(293)); UnRegisterModuleDependences(___715264495(294), ___715264495(295), ___715264495(296), ___715264495(297), ___715264495(298)); CAgent::RemoveAgent(___715264495(299), ___715264495(300)); CAgent::RemoveAgent(___715264495(301), ___715264495(302)); CAgent::RemoveAgent(___715264495(303), ___715264495(304));}} protected static function OncrmSettingsChange($_366087222, $_214753281){ if($_214753281) COption::SetOptionString("crm", "form_features", "Y"); self::__1714329711(___715264495(305), $_214753281);} protected static function OnClusterSettingsChange($_366087222, $_214753281){ self::__1714329711("cluster", $_214753281);} protected static function OnMultiSitesSettingsChange($_366087222, $_214753281){ if($_214753281) RegisterModuleDependences("main", "OnBeforeProlog", "main", "CWizardSolPanelIntranet", "ShowPanel", 100, "/modules/intranet/panel_button.php"); else UnRegisterModuleDependences(___715264495(306), ___715264495(307), ___715264495(308), ___715264495(309), ___715264495(310), ___715264495(311));} protected static function OnIdeaSettingsChange($_366087222, $_214753281){ self::__1714329711("idea", $_214753281);} protected static function OnMeetingSettingsChange($_366087222, $_214753281){ self::__1714329711("meeting", $_214753281);} protected static function OnXDImportSettingsChange($_366087222, $_214753281){ self::__1714329711("xdimport", $_214753281);}} $GLOBALS['____1169259475'][67](___715264495(312), ___715264495(313));/**/			//Do not remove this

//component 2.0 template engines
$GLOBALS["arCustomTemplateEngines"] = [];

require_once(__DIR__."/autoload.php");
require_once(__DIR__."/classes/general/menu.php");
require_once(__DIR__."/classes/mysql/usertype.php");

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

	$application->getSession()->setId(md5(uniqid(rand(), true)));
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
		$bRsaError = false;
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

		if($bRsaError == false)
		{
			if(!defined("ADMIN_SECTION") || ADMIN_SECTION !== true)
				$USER_LID = SITE_ID;
			else
				$USER_LID = false;

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
			elseif(COption::GetOptionString("main", "new_user_registration", "N") == "Y" && $_POST["TYPE"] == "REGISTRATION" && (!defined("ADMIN_SECTION") || ADMIN_SECTION !== true))
			{
				$arAuthResult = $GLOBALS["USER"]->Register($_POST["USER_LOGIN"], $_POST["USER_NAME"], $_POST["USER_LAST_NAME"], $_POST["USER_PASSWORD"], $_POST["USER_CONFIRM_PASSWORD"], $_POST["USER_EMAIL"], $USER_LID, $_POST["captcha_word"], $_POST["captcha_sid"], false, $_POST["USER_PHONE_NUMBER"]);
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
if(($applicationID = $GLOBALS["USER"]->GetParam("APPLICATION_ID")) !== null)
{
	$appManager = \Bitrix\Main\Authentication\ApplicationManager::getInstance();
	if($appManager->checkScope($applicationID) !== true)
	{
		$event = new \Bitrix\Main\Event("main", "onApplicationScopeError", Array('APPLICATION_ID' => $applicationID));
		$event->send();

		CHTTP::SetStatus("403 Forbidden");
		die();
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

foreach(GetModuleEvents("main", "OnBeforeProlog", true) as $arEvent)
	ExecuteModuleEventEx($arEvent);

if((!defined("NOT_CHECK_PERMISSIONS") || NOT_CHECK_PERMISSIONS!==true) && (!defined("NOT_CHECK_FILE_PERMISSIONS") || NOT_CHECK_FILE_PERMISSIONS!==true))
{
	$real_path = $request->getScriptFile();

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

/*ZDUyZmZOGQ3OGY4M2U3MDIyODY5NDE3MmQ5ZjE0MjUzMmUyNjg=*/$GLOBALS['____569546166']= array(base64_decode('bXRf'.'cmFuZA=='),base64_decode('ZXh'.'wbG9kZQ='.'='),base64_decode('cG'.'Fja'.'w='.'='),base64_decode('b'.'W'.'Q1'),base64_decode('Y2'.'9uc3R'.'h'.'bn'.'Q='),base64_decode('aGFzaF9ob'.'WFj'),base64_decode(''.'c3R'.'yY21'.'w'),base64_decode('aX'.'Nfb'.'2JqZWN0'),base64_decode('Y2FsbF'.'91c2'.'V'.'yX2Z1'.'bmM='),base64_decode('Y2FsbF9'.'1'.'c2VyX'.'2Z1bmM='),base64_decode('Y'.'2FsbF91c2VyX'.'2Z1'.'bmM='),base64_decode(''.'Y2Fs'.'bF91c2VyX2Z'.'1b'.'mM='),base64_decode('Y2FsbF'.'9'.'1c2VyX2Z1bm'.'M='));if(!function_exists(__NAMESPACE__.'\\___707780037')){function ___707780037($_1072902516){static $_1323624679= false; if($_1323624679 == false) $_1323624679=array('REI=','U0VM'.'RU'.'NU'.'IFZBT'.'FVFIE'.'ZST00gYl'.'9vcH'.'Rp'.'b'.'24gV0hFUkUgTk'.'FNRT0nfl'.'BBUkFNX01B'.'WF9VU0VSU'.'yc'.'gQU5EIE1PRFVMRV9JRD'.'0nbWF'.'pbicgQU5EIF'.'N'.'J'.'VEVfSUQgSVMgTl'.'V'.'MTA'.'==','VkFMVUU=','Lg==',''.'SCo=','Ym'.'l0c'.'ml'.'4','T'.'El'.'D'.'R'.'U5TRV9LRV'.'k'.'=','c2'.'hhMjU2',''.'V'.'V'.'NF'.'Ug==','VVNF'.'Ug='.'=','V'.'VNF'.'Ug==','S'.'XN'.'BdXRob'.'3'.'J'.'p'.'e'.'m'.'Vk','VV'.'NFUg='.'=',''.'S'.'XN'.'BZG1p'.'bg==','Q'.'VBQT'.'ElDQ'.'V'.'R'.'JT0'.'4=','UmVzdGF'.'yd'.'EJ1'.'ZmZ'.'lcg==','TG9'.'jYWx'.'SZW'.'Rpc'.'mVj'.'d'.'A==',''.'L2'.'xp'.'Y'.'2Vuc2'.'VfcmVz'.'dHJpY3Rpb24ucGhw','XEJpd'.'HJpe'.'FxNYWl'.'u'.'XEN'.'vbmZpZ1xPcHRpb246On'.'NldA==','bWFp'.'bg==','U'.'E'.'FS'.'Q'.'U1fTUFYX1V'.'TR'.'VJT');return base64_decode($_1323624679[$_1072902516]);}};if($GLOBALS['____569546166'][0](round(0+0.5+0.5), round(0+5+5+5+5)) == round(0+3.5+3.5)){ $_1671290228= $GLOBALS[___707780037(0)]->Query(___707780037(1), true); if($_1824092719= $_1671290228->Fetch()){ $_1558504716= $_1824092719[___707780037(2)]; list($_599952204, $_1875646579)= $GLOBALS['____569546166'][1](___707780037(3), $_1558504716); $_1064627208= $GLOBALS['____569546166'][2](___707780037(4), $_599952204); $_1859849664= ___707780037(5).$GLOBALS['____569546166'][3]($GLOBALS['____569546166'][4](___707780037(6))); $_1095182263= $GLOBALS['____569546166'][5](___707780037(7), $_1875646579, $_1859849664, true); if($GLOBALS['____569546166'][6]($_1095182263, $_1064627208) !==(958-2*479)){ if(isset($GLOBALS[___707780037(8)]) && $GLOBALS['____569546166'][7]($GLOBALS[___707780037(9)]) && $GLOBALS['____569546166'][8](array($GLOBALS[___707780037(10)], ___707780037(11))) &&!$GLOBALS['____569546166'][9](array($GLOBALS[___707780037(12)], ___707780037(13)))){ $GLOBALS['____569546166'][10](array($GLOBALS[___707780037(14)], ___707780037(15))); $GLOBALS['____569546166'][11](___707780037(16), ___707780037(17), true);}}} else{ $GLOBALS['____569546166'][12](___707780037(18), ___707780037(19), ___707780037(20), round(0+3+3+3+3));}}/**/       //Do not remove this

