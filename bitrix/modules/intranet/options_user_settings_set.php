<?php
use Bitrix\Main\Loader;
use Bitrix\Main\Context;

$ID = (int)$ID;
$intranetWarningTmp = '';
$intranet_res = true;
$request = Context::getCurrent()->getRequest();

if (Loader::includeModule('intranet') && check_bitrix_sessid())
{
	$newUserPost = (($request->getPost('intranet_NEW_USER_POST') ?? 'N') === 'Y') ? 'Y' : 'N';

	$intranet_res = CUserOptions::SetOption('intranet', 'socnet_new_user_post', $newUserPost, false, $ID);
}
