<?php

$agent = \Bitrix\Main\UpdateSystem\Migration::getInstance()->agent();

$agent->add('Bitrix\HumanResources\Access\Install\AccessInstaller::installAgent();', 60, false);
$agent->add('Bitrix\HumanResources\Compatibility\Converter\StructureBackwardConverter::startDefaultConverting();', 60, false);
$agent->add('Bitrix\HumanResources\Install\Stepper\UpdateSortAndActiveFieldsStepper::checkDefaultConverting();', 600, false);
$agent->add('Bitrix\HumanResources\Install\Agent\HcmLink\JobCleaner::run();', 3600, false);
$agent->add('Bitrix\HumanResources\Install\Agent\HcmLink\ExpiredFieldValueCleaner::run();', 3600, false);
