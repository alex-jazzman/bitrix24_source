<?php

declare(strict_types=1);

namespace Bitrix\Im\V2\Promotion\Internals;

enum DeviceType: string
{
	case WEB = 'web'; // browser + desktop
	case BROWSER = 'browser';
	case DESKTOP = 'desktop';
	case MOBILE = 'mobile';
	case ALL = 'all';
}
