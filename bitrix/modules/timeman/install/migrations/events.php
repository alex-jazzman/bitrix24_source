<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();

$migration->event()->registerCompatible(
	'main',
	'OnAfterUserAdd',
	\Bitrix\Timeman\V2\Internal\Service\AutomaticModeConfigurationEvents::class,
	'onUserChanged',
);

$migration->event()->registerCompatible(
	'main',
	'OnAfterUserUpdate',
	\Bitrix\Timeman\V2\Internal\Service\AutomaticModeConfigurationEvents::class,
	'onUserChanged',
);

$migration->event()->registerCompatible(
	'main',
	'OnAfterUserDelete',
	\Bitrix\Timeman\V2\Internal\Service\AutomaticModeConfigurationEvents::class,
	'onUserDeleted',
);

$migration->event()->registerCompatible(
	'iblock',
	'OnAfterIBlockSectionAdd',
	\Bitrix\Timeman\V2\Internal\Service\AutomaticModeConfigurationEvents::class,
	'onSectionChanged',
);

$migration->event()->registerCompatible(
	'iblock',
	'OnAfterIBlockSectionUpdate',
	\Bitrix\Timeman\V2\Internal\Service\AutomaticModeConfigurationEvents::class,
	'onSectionChanged',
);

$migration->event()->registerCompatible(
	'iblock',
	'OnAfterIBlockSectionDelete',
	\Bitrix\Timeman\V2\Internal\Service\AutomaticModeConfigurationEvents::class,
	'onSectionDeleted',
);

$migration->event()->registerCompatible(
	'main',
	'OnAfterUserTypeAdd',
	\Bitrix\Timeman\V2\Internal\Service\AutomaticModeConfigurationEvents::class,
	'onUserFieldChanged',
);

$migration->event()->registerCompatible(
	'main',
	'OnAfterUserTypeUpdate',
	\Bitrix\Timeman\V2\Internal\Service\AutomaticModeConfigurationEvents::class,
	'onUserFieldChanged',
);

$migration->event()->registerCompatible(
	'main',
	'OnAfterUserTypeDelete',
	\Bitrix\Timeman\V2\Internal\Service\AutomaticModeConfigurationEvents::class,
	'onUserFieldChanged',
);

$migration->event()->registerCompatible(
	'main',
	'onAfterSetEnumValues',
	\Bitrix\Timeman\V2\Internal\Service\AutomaticModeConfigurationEvents::class,
	'onEnumChanged',
);

$migration->event()->register(
	'timeman',
	'\Bitrix\Timeman\Model\Schedule\Schedule::OnAfterAdd',
	\Bitrix\Timeman\V2\Internal\Service\AutomaticModeConfigurationEvents::class,
	'onScheduleChanged',
);

$migration->event()->register(
	'timeman',
	'\Bitrix\Timeman\Model\Schedule\Assignment\User\ScheduleUser::OnAfterAdd',
	\Bitrix\Timeman\V2\Internal\Service\AutomaticModeConfigurationEvents::class,
	'onUserAssignmentChanged',
);

$migration->event()->register(
	'timeman',
	'\Bitrix\Timeman\Model\Schedule\Assignment\Department\ScheduleDepartment::OnAfterAdd',
	\Bitrix\Timeman\V2\Internal\Service\AutomaticModeConfigurationEvents::class,
	'onStructureChanged',
);

$migration->event()->register(
	'humanresources',
	'OnNodeAdded',
	\Bitrix\Timeman\V2\Internal\Service\AutomaticModeConfigurationEvents::class,
	'onStructureChanged',
);

$migration->event()->register(
	'humanresources',
	'\Bitrix\HumanResources\Model\NodeBackwardAccessCode::OnAfterAdd',
	\Bitrix\Timeman\V2\Internal\Service\AutomaticModeConfigurationEvents::class,
	'onStructureChanged',
);

$migration->event()->register(
	'timeman',
	'\Bitrix\Timeman\Model\Schedule\Schedule::OnAfterUpdate',
	\Bitrix\Timeman\V2\Internal\Service\AutomaticModeConfigurationEvents::class,
	'onScheduleChanged',
);

$migration->event()->register(
	'timeman',
	'\Bitrix\Timeman\Model\Schedule\Assignment\User\ScheduleUser::OnAfterUpdate',
	\Bitrix\Timeman\V2\Internal\Service\AutomaticModeConfigurationEvents::class,
	'onUserAssignmentChanged',
);

$migration->event()->register(
	'timeman',
	'\Bitrix\Timeman\Model\Schedule\Assignment\Department\ScheduleDepartment::OnAfterUpdate',
	\Bitrix\Timeman\V2\Internal\Service\AutomaticModeConfigurationEvents::class,
	'onStructureChanged',
);

$migration->event()->register(
	'humanresources',
	'OnNodeUpdated',
	\Bitrix\Timeman\V2\Internal\Service\AutomaticModeConfigurationEvents::class,
	'onNodeChanged',
);

$migration->event()->register(
	'humanresources',
	'\Bitrix\HumanResources\Model\NodeBackwardAccessCode::OnAfterUpdate',
	\Bitrix\Timeman\V2\Internal\Service\AutomaticModeConfigurationEvents::class,
	'onStructureChanged',
);

$migration->event()->register(
	'timeman',
	'\Bitrix\Timeman\Model\Schedule\Schedule::OnAfterDelete',
	\Bitrix\Timeman\V2\Internal\Service\AutomaticModeConfigurationEvents::class,
	'onScheduleChanged',
);

$migration->event()->register(
	'timeman',
	'\Bitrix\Timeman\Model\Schedule\Assignment\User\ScheduleUser::OnAfterDelete',
	\Bitrix\Timeman\V2\Internal\Service\AutomaticModeConfigurationEvents::class,
	'onUserAssignmentChanged',
);

$migration->event()->register(
	'timeman',
	'\Bitrix\Timeman\Model\Schedule\Assignment\Department\ScheduleDepartment::OnAfterDelete',
	\Bitrix\Timeman\V2\Internal\Service\AutomaticModeConfigurationEvents::class,
	'onStructureChanged',
);

$migration->event()->register(
	'humanresources',
	'OnNodeDeleted',
	\Bitrix\Timeman\V2\Internal\Service\AutomaticModeConfigurationEvents::class,
	'onStructureChanged',
);

$migration->event()->register(
	'humanresources',
	'\Bitrix\HumanResources\Model\NodeBackwardAccessCode::OnAfterDelete',
	\Bitrix\Timeman\V2\Internal\Service\AutomaticModeConfigurationEvents::class,
	'onStructureChanged',
);
