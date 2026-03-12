<?php

use Bitrix\Mobile\Config\Feature;
use Bitrix\Mobile\Feature\AhaMomentFeature;

return [
	'momentsEnabled' => Feature::isEnabled(AhaMomentFeature::class),
];
