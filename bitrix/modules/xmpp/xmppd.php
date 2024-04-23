<?php

if (!isset($_SERVER['DOCUMENT_ROOT']) || empty($_SERVER['DOCUMENT_ROOT']))
{
	$_SERVER['DOCUMENT_ROOT'] = DirName(__FILE__);
	$_SERVER['DOCUMENT_ROOT'] = mb_substr($_SERVER['DOCUMENT_ROOT'], 0, mb_strlen($_SERVER['DOCUMENT_ROOT']) - mb_strlen("/bitrix/modules/xmpp"));
}

define('NOT_CHECK_PERMISSIONS', true);
define('BX_BUFFER_USED',false);
define("BX_NO_ACCELERATOR_RESET", true);

require($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/main/include/prolog_before.php');

if (!CModule::IncludeModule('xmpp'))
{
	die('XMPP module is not installed');
}

$overload  = intval(ini_get('mbstring.func_overload'));
$encoding = mb_strtolower(ini_get('mbstring.internal_encoding'));

if (!($overload == 0 && !$encoding))
{
	die('Mbstring settings are incorrect (mbstring.func_overload='.$overload.' mbstring.internal_encoding='.$encoding.'). Required: mbstring.func_overload=0 mbstring.internal_encoding=');
}

CXMPPServer::Run();

require($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/main/include/epilog_after.php');
