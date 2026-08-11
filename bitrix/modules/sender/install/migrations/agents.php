<?php
$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();
$agent = $migration->agent();
$stepper = $migration->stepper();

$agent->add('Bitrix\\Sender\\Access\\Install\\AccessInstaller::installAgent();', 60, false);

$stepper->add(\Bitrix\Sender\Install\SetFileInfoStepper::class);
