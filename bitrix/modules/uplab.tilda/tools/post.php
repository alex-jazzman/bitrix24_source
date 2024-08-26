<?php

use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Uplab\Tilda\Cache;

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_before.php';

$request = Bitrix\Main\Context::getCurrent()->getRequest();

if (!Loader::includeModule('uplab.tilda')) {
	die(Loc::getMessage('uplab.tilda_NO_MODULE'));
}

if($request->get('clearCache') === 'Y') {
	Cache::clearAllCache();
	echo Loc::getMessage('uplab.tilda_CACHE_CLEARED');
	die();
}

if($request->get('clearCacheList') === 'Y') {
	Cache::clearListCache();
	echo Loc::getMessage('uplab.tilda_CACHE_LIST_CLEARED');
	die();
}
