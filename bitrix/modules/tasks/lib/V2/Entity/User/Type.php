<?php

namespace Bitrix\Tasks\V2\Entity\User;

enum Type: string
{
	case Intranet = 'intranet';
	case Extranet = 'extranet';
	case Collaber = 'collaber';
}
