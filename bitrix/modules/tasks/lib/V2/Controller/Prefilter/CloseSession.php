<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Controller\Prefilter;

use Attribute;
use Bitrix\Main\Engine\ActionFilter\Base;
use Bitrix\Main\Engine\ActionFilter;

#[Attribute(Attribute::TARGET_METHOD)]
class CloseSession implements AttributePrefilterInterface
{
	public function getPrefilter(): Base
	{
		return new ActionFilter\CloseSession();
	}
}