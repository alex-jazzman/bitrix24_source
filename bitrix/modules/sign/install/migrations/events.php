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
	// Activity provider of the KEDO process start (BRIEF-kedo-run-process-2026-08-25). This file runs on
	// module install only, so the same registration lives in dev/updates/current/updater.php for portals
	// where sign is already installed: the two are changed as a pair.
	->register(
		'crm',
		'OnGetActivityProviders',
		\Bitrix\Sign\Integration\CRM\Activity\Provider\Process::class,
		'onGetActivityProviders',
	)
	// End of a KEDO process (BRIEF-kedo-run-process-2026-08-25): both events that finish a process close
	// the deal of the documents it created. OnWorkflowComplete is fired by GetModuleEvents() and needs the
	// compatible form, onAfterWorkflowKill is sent through the event manager and needs the modern one.
	// This file runs on module install only, so the same pair lives in dev/updates/current/updater.php:
	// the two declarations are changed together.
	->registerCompatible(
		'bizproc',
		'OnWorkflowComplete',
		\Bitrix\Sign\Integration\CRM\Activity\ProcessActivityHandler::class,
		'onWorkflowComplete',
	)
	->register(
		'bizproc',
		'onAfterWorkflowKill',
		\Bitrix\Sign\Integration\CRM\Activity\ProcessActivityHandler::class,
		'onAfterWorkflowKill',
	)
;
