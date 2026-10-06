<?php

$event = \Bitrix\Main\UpdateSystem\Migration::getInstance()->event();

$event
	->registerCompatible('main', 'onNumberGeneratorsClassesCollect', 'Bitrix\DocumentGenerator\Integration\Numerator\DocumentNumberGenerator', 'onGeneratorClassesCollect')
	->register('rest', 'OnRestServiceBuildDescription', '\Bitrix\DocumentGenerator\Driver', 'onRestServiceBuildDescription')
	->register('pull', 'OnGetDependentModule', '\Bitrix\DocumentGenerator\Driver', 'onGetDependentModule', 800)
;
