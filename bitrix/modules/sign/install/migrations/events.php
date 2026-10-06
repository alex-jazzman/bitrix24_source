<?php

$event = \Bitrix\Main\UpdateSystem\Migration::getInstance()->event();

$event
	->register('crm', 'onSiteFormFillSign', \Bitrix\Sign\Integration\CRM\Form::class, 'onSiteFormFillSign')
	->register('bitrix24', 'onDomainChange', \Bitrix\Sign\Integration\Bitrix24\Domain::class, 'onChangeDomain')
	->register('main', 'OnUserTypeBuildList', \Bitrix\Sign\UserFields\SnilsUserType::class, 'OnUserTypeBuildList')
	->register('main', 'OnUISelectorGetProviderByEntityType', \Bitrix\Sign\Integration\Main\UiSelector\EventHandler::class, 'OnUISelectorGetProviderByEntityType')
	->register('main', 'OnAfterUserUpdate', \Bitrix\Sign\Integration\Main\SignersListEventHandler::class, 'OnAfterUserUpdate')
	->register('main', 'OnAfterUserDelete', \Bitrix\Sign\Integration\Main\SignersListEventHandler::class, 'OnAfterUserDelete')
	->register('main', 'OnAfterUserTypeAdd', \Bitrix\Sign\Integration\Main\DocumentPlaceholderCacheEventHandler::class, 'onAfterAddField')
	->register('main', 'OnAfterUserTypeDelete', \Bitrix\Sign\Integration\Main\DocumentPlaceholderCacheEventHandler::class, 'onAfterDeleteField')
	->register('pull', 'OnGetDependentModule', \Bitrix\Sign\SignPullSchema::class, 'OnGetDependentModule')
	->register('intranet', 'onProfileConfigAdditionalBlocks', \Bitrix\Sign\Config\LegalInfo::class, 'onProfileConfigAdditionalBlocks')
	->register('rest', 'OnRestServiceBuildDescription', \Bitrix\Sign\Rest\B2e\MySafe::class, 'onRestServiceBuildDescription')
	->register('rest', 'OnRestServiceBuildDescription', \Bitrix\Sign\Rest\B2e\Provider::class, 'onRestServiceBuildDescription')
	->register('rest', 'OnRestServiceBuildDescription', \Bitrix\Sign\Rest\B2e\HcmLink\SignedFile::class, 'onRestServiceBuildDescription')
	->register('rest', 'OnRestServiceBuildDescription', \Bitrix\Sign\Rest\B2e\CompanyProvider::class, 'onRestServiceBuildDescription')
	->register('rest', 'OnRestServiceBuildDescription', \Bitrix\Sign\Rest\B2e\Document::class, 'onRestServiceBuildDescription')
	->register('im', 'OnGetNotifySchema', \Bitrix\Sign\Integration\Im\NotificationEventHandler::class, 'onGetNotifySchema')
;
