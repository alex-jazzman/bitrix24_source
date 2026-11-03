<?php

include __DIR__ . '/compatibility.php';

CModule::AddAutoloadClasses(
	'biconnector',
	[
		'CBIConnectorSqlBuilder' => 'classes/sqlbuilder.php',
		'biconnector' => 'install/index.php',
	]
);

// Dev/QA controllers (e2e provisioning among them) live under dev/, which is not part of a
// shipped portal, so they exist only in a developer checkout. Registered the way ui, disk and
// imbot register theirs: the whole dev/ under Controller\Dev — Controller, not Dev, because
// the action resolver only routes to classes under the module's controller namespaces from
// .settings.php. Each controller under it guards itself in processBeforeAction.
if (is_dir(__DIR__ . '/dev'))
{
	\Bitrix\Main\Loader::registerNamespace('Bitrix\\BIConnector\\Controller\\Dev', __DIR__ . '/dev');
}
