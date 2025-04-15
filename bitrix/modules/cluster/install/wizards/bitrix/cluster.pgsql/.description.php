<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}
// https://selectel.ru/blog/tutorials/how-to-set-up-replication-in-postgresql/
// https://www.cherryservers.com/blog/how-to-set-up-postgresql-database-replication
// https://www.postgresql.org/docs/current/monitoring-stats.html#MONITORING-PG-STAT-REPLICATION-VIEW
// https://stackoverflow.com/a/32737925
$arWizardDescription = [
	'NAME' => GetMessage('CLUWIZ_DESCR_NAME'),
	'DESCRIPTION' => GetMessage('CLUWIZ_DESCR_DESCRIPTION'),
	'ICON' => '',
	'COPYRIGHT' => GetMessage('CLUWIZ_DESCR_COPYRIGHT'),
	'VERSION' => '1.0.0',
	'STEPS' => [
		'CPgSqlAddStep1',
		'CPgSqlAddFinalStep',
		'CPgSqlAddCancelStep',
	],
];
