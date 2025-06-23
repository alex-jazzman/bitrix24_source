<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Controller\Prefilter;

use Bitrix\Main\Engine\ActionFilter\Base;

interface AttributePrefilterInterface
{
	public function getPrefilter(): Base;
}