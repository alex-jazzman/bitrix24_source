<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Repository\Mapper;

use Bitrix\Tasks\V2\Entity\UserCollection;
use Bitrix\Tasks\V2\Internals\Service\NameService;
use Bitrix\Tasks\V2\Internals\Service\PhotoService;
use Bitrix\Tasks\V2\Entity;

class UserMapper
{
	public function __construct(
		private readonly PhotoService $photoService,
		private readonly NameService $nameService
	)
	{

	}

	public function mapToCollection(
		array $users,
		?Entity\FileCollection $files = null
	): Entity\UserCollection
	{
		$result = [];

		foreach ($users as $user)
		{
			$personalPhoto = $files?->findOneById((int)$user['PERSONAL_PHOTO']);
			$gender = $user['PERSONAL_GENDER'] ?? '';

			$result[] = new Entity\User(
				id: (int)$user['ID'],
				name: $this->nameService->format($user),
				image: $personalPhoto ? $this->photoService->resize($personalPhoto)?->src : null,
				gender: Entity\User\Gender::tryFrom($gender) ?? Entity\User\Gender::Male,
			);
		}

		return new UserCollection(...$result);
	}
}
