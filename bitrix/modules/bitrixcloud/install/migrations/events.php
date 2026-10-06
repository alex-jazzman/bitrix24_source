<?php
$event = \Bitrix\Main\UpdateSystem\Migration::getInstance()->event();

$event
	->registerCompatible('main', 'OnAdminInformerInsertItems', 'CBitrixCloudBackup', 'OnAdminInformerInsertItems')
	->registerCompatible('mobileapp', 'OnBeforeAdminMobileMenuBuild', 'CBitrixCloudMobile', 'OnBeforeAdminMobileMenuBuild')
;
