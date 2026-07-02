<?php
define('NEED_AUTH', false);
define('NOT_CHECK_PERMISSIONS', true);
define('SKIP_TEMPLATE_AUTH_ERROR', true);
define('BX_SKIP_USER_LIMIT_CHECK', true);
define('SKIP_SHOW_PANEL', true);

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php';

$APPLICATION->SetTitle(GetMessage('IM_GUEST_PAGE_TITLE'));
$APPLICATION->IncludeComponent('bitrix:im.router', '', [], false, ['HIDE_ICONS' => 'Y']);

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php';
