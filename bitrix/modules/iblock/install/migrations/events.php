<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();
$event = $migration->event();
$mode = $migration->context()->getDatabaseUpdateMode();

$event
	->registerCompatible('main', 'OnGroupDelete', 'CIBlock', 'OnGroupDelete')
	->registerCompatible('main', 'OnBeforeLangDelete', 'CIBlock', 'OnBeforeLangDelete')
	->registerCompatible('main', 'OnLangDelete', 'CIBlock', 'OnLangDelete')
	->registerCompatible('main', 'OnUserTypeRightsCheck', 'CIBlockSection', 'UserTypeRightsCheck')
	->registerCompatible('search', 'OnReindex', 'CIBlock', 'OnSearchReindex')
	->registerCompatible('search', 'OnSearchGetURL', 'CIBlock', 'OnSearchGetURL')
	->registerCompatible('main', 'OnEventLogGetAuditTypes', 'CIBlock', 'GetAuditTypes')
	->registerCompatible('main', 'OnEventLogGetAuditHandlers', 'CEventIBlock', 'MakeIBlockObject')
	->registerCompatible('main', 'OnTaskOperationsChanged', 'CIBlockRightsStorage', 'OnTaskOperationsChanged')
	->registerCompatible('main', 'OnGroupDelete', 'CIBlockRightsStorage', 'OnGroupDelete')
	->registerCompatible('main', 'OnUserDelete', 'CIBlockRightsStorage', 'OnUserDelete')
	->registerCompatible('perfmon', 'OnGetTableSchema', 'iblock', 'OnGetTableSchema')
	// Spelled out with the leading backslash on purpose: the old installer wrote TO_CLASS
	// exactly like this, and unRegisterEventHandler() matches the column verbatim. ::class
	// yields the name without it, which would leave the old row in place on every portal
	// installed before the migration.
	->registerCompatible('sender', 'OnConnectorList', '\Bitrix\Iblock\SenderEventHandler', 'onConnectorListIblock')

	->register('main', 'onVirtualClassBuildList', \Bitrix\Iblock\IblockTable::class, 'compileAllEntities')
;

// Subscriptions that carry a sort go through the legacy pair. event()->registerCompatible()
// took the argument only recently, while a migration runs against the main already installed
// on the portal - there the fifth argument is dropped and every handler lands on 100. For the
// property types the sort is the contract: it orders the list the property editor offers.
// The whole list is registered here, the trailing 100 included, to keep the order in one place.
if ($mode === \Bitrix\Main\UpdateSystem\Migration\DatabaseUpdateMode::ModuleInstall)
{
	RegisterModuleDependences('main', 'OnGetRatingContentOwner', 'iblock', 'CRatingsComponentsIBlock', 'OnGetRatingContentOwner', 200);

	RegisterModuleDependences('iblock', 'OnIBlockPropertyBuildList', 'iblock', 'CIBlockPropertyDate', 'GetUserTypeDescription', 10);
	RegisterModuleDependences('iblock', 'OnIBlockPropertyBuildList', 'iblock', 'CIBlockPropertyDateTime', 'GetUserTypeDescription', 20);
	RegisterModuleDependences('iblock', 'OnIBlockPropertyBuildList', 'iblock', 'CIBlockPropertyXmlID', 'GetUserTypeDescription', 30);
	RegisterModuleDependences('iblock', 'OnIBlockPropertyBuildList', 'iblock', 'CIBlockPropertyFileMan', 'GetUserTypeDescription', 40);
	RegisterModuleDependences('iblock', 'OnIBlockPropertyBuildList', 'iblock', 'CIBlockPropertyHTML', 'GetUserTypeDescription', 50);
	RegisterModuleDependences('iblock', 'OnIBlockPropertyBuildList', 'iblock', 'CIBlockPropertyElementList', 'GetUserTypeDescription', 60);
	RegisterModuleDependences('iblock', 'OnIBlockPropertyBuildList', 'iblock', 'CIBlockPropertySequence', 'GetUserTypeDescription', 70);
	RegisterModuleDependences('iblock', 'OnIBlockPropertyBuildList', 'iblock', 'CIBlockPropertyElementAutoComplete', 'GetUserTypeDescription', 80);
	RegisterModuleDependences('iblock', 'OnIBlockPropertyBuildList', 'iblock', 'CIBlockPropertySKU', 'GetUserTypeDescription', 90);
	RegisterModuleDependences('iblock', 'OnIBlockPropertyBuildList', 'iblock', 'CIBlockPropertySectionAutoComplete', 'GetUserTypeDescription', 100);
}
elseif ($mode === \Bitrix\Main\UpdateSystem\Migration\DatabaseUpdateMode::ModuleUninstall)
{
	UnRegisterModuleDependences('main', 'OnGetRatingContentOwner', 'iblock', 'CRatingsComponentsIBlock', 'OnGetRatingContentOwner');

	UnRegisterModuleDependences('iblock', 'OnIBlockPropertyBuildList', 'iblock', 'CIBlockPropertyDate', 'GetUserTypeDescription');
	UnRegisterModuleDependences('iblock', 'OnIBlockPropertyBuildList', 'iblock', 'CIBlockPropertyDateTime', 'GetUserTypeDescription');
	UnRegisterModuleDependences('iblock', 'OnIBlockPropertyBuildList', 'iblock', 'CIBlockPropertyXmlID', 'GetUserTypeDescription');
	UnRegisterModuleDependences('iblock', 'OnIBlockPropertyBuildList', 'iblock', 'CIBlockPropertyFileMan', 'GetUserTypeDescription');
	UnRegisterModuleDependences('iblock', 'OnIBlockPropertyBuildList', 'iblock', 'CIBlockPropertyHTML', 'GetUserTypeDescription');
	UnRegisterModuleDependences('iblock', 'OnIBlockPropertyBuildList', 'iblock', 'CIBlockPropertyElementList', 'GetUserTypeDescription');
	UnRegisterModuleDependences('iblock', 'OnIBlockPropertyBuildList', 'iblock', 'CIBlockPropertySequence', 'GetUserTypeDescription');
	UnRegisterModuleDependences('iblock', 'OnIBlockPropertyBuildList', 'iblock', 'CIBlockPropertyElementAutoComplete', 'GetUserTypeDescription');
	UnRegisterModuleDependences('iblock', 'OnIBlockPropertyBuildList', 'iblock', 'CIBlockPropertySKU', 'GetUserTypeDescription');
	UnRegisterModuleDependences('iblock', 'OnIBlockPropertyBuildList', 'iblock', 'CIBlockPropertySectionAutoComplete', 'GetUserTypeDescription');
}
