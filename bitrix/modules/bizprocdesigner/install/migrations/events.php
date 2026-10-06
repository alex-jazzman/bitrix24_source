<?php

$event = \Bitrix\Main\UpdateSystem\Migration::getInstance()->event();

// Class strings match the historical registrations (old InstallEvents and install/updater.php) so
// INSERT IGNORE collapses duplicates and uninstall unregisters cleanly.
$event
	->registerCompatible('pull', 'OnGetDependentModule', '\Bitrix\BizprocDesigner\Internal\Integration\Pull\BizprocDesignerPullManager', 'OnGetDependentModule')
	->registerCompatible('rest', 'OnRestServiceBuildDescription', '\Bitrix\BizprocDesigner\RestService', 'onRestServiceBuildDescription')
	->register('main', 'OnAfterRegisterModule', '\Bitrix\BizprocDesigner\Internal\Integration\Main\EventHandler', 'onAfterRegisterModule')
;
