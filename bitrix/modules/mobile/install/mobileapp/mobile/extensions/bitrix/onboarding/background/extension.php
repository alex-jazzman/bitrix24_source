<?php

use Bitrix\Mobile\Config\Feature;
use Bitrix\Mobile\Feature\OnboardingFeature;

return [
	'isOnboardingEnabled' => Feature::isEnabled(OnboardingFeature::class),
];
