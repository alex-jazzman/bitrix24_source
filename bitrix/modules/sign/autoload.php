<?php

\CModule::AddAutoloadClasses('sign', [
	\Bitrix\Sign\Controllers\V1\Document::class => 'lib/Controllers/V1/Document.php',
	\Bitrix\Sign\Controllers\V1\Portal::class => 'lib/Controllers/V1/Portal.php',
	\Bitrix\Sign\Controllers\V1\Document\Blank::class => 'lib/Controllers/V1/Document/Blank.php',
	\Bitrix\Sign\Controllers\V1\Document\Blank\Block::class => 'lib/Controllers/V1/Document/Blank/Block.php',
	\Bitrix\Sign\Controllers\V1\Document\Member::class => 'lib/Controllers/V1/Document/Member.php',
	\Bitrix\Sign\Controllers\V1\Document\Pages::class => 'lib/Controllers/V1/Document/Pages.php',
	\Bitrix\Sign\Controllers\V1\Document\SignedFile::class => 'lib/Controllers/V1/Document/SignedFile.php',
	\Bitrix\Sign\Controllers\V1\Document\Signing::class => 'lib/Controllers/V1/Document/Signing.php',
	\Bitrix\Sign\Controllers\V1\Document\Send::class => 'lib/Controllers/V1/Document/Send.php',
	\Bitrix\Sign\Controllers\V1\Integration\Crm\Field::class => 'lib/Controllers/V1/Integration/Crm/Field.php',
	\Bitrix\Sign\Controllers\V1\Integration\Crm\B2eCompany::class => 'lib/Controllers/V1/Integration/Crm/B2eCompany.php',
	\Bitrix\Sign\Controllers\V1\Integration\HumanResources\HcmLink::class => 'lib/Controllers/V1/Integration/HumanResources/HcmLink.php',
	\Bitrix\Sign\Controllers\V1\B2e\Fields::class => 'lib/Controllers/V1/B2e/Fields.php',
	\Bitrix\Sign\Controllers\V1\B2e\Scheme::class => 'lib/Controllers/V1/B2e/Scheme.php',
	\Bitrix\Sign\Controllers\V1\B2e\Member\Communication::class => 'lib/Controllers/V1/B2e/Member/Communication.php',
	\Bitrix\Sign\Controllers\V1\B2e\Member::class => 'lib/Controllers/V1/B2e/Member.php',
	\Bitrix\Sign\Controllers\V1\B2e\Member\Link::class => 'lib/Controllers/V1/B2e/Member/Link.php',
	\Bitrix\Sign\Controllers\V1\B2e\Member\Reminder::class => 'lib/Controllers/V1/B2e/Member/Reminder.php',
	\Bitrix\Sign\Controllers\V1\B2e\Document\Template::class => 'lib/Controllers/V1/B2e/Document/Template.php',
	\Bitrix\Sign\Controllers\V1\Integration\Im\GroupChat::class => 'lib/Controllers/V1/Integration/Im/GroupChat.php',
	\Bitrix\Sign\Controllers\V1\B2e\Document\Group::class => 'lib/Controllers/V1/B2e/Document/Group.php',
	\Bitrix\Sign\Controllers\V1\B2e\WizardOptions::class => 'lib/Controllers/V1/B2e/WizardOptions.php',
	\Bitrix\Sign\Controllers\V1\B2e\Document\TemplateFolder::class => 'lib/Controllers/V1/B2e/Document/TemplateFolder.php',
]);
