<?php

namespace Bitrix\Calendar\Integration\Dav;

use Bitrix\Calendar\Sync\Builders\BuilderConnectionFromDM;
use Bitrix\Calendar\Sync\Connection\Connection;
use Bitrix\Dav\Internals\DavConnectionTable;
use Bitrix\Main\Loader;

class ConnectionProvider
{
	/**
	 * @param int $userId
	 * @param string $type
	 * @param array $providers
	 *
	 * @return Connection[]
	 *
	 * @throws \Bitrix\Main\ArgumentException
	 * @throws \Bitrix\Main\LoaderException
	 * @throws \Bitrix\Main\ObjectPropertyException
	 * @throws \Bitrix\Main\SystemException
	 */
	public function getSyncConnections(int $userId, string $type, array $providers): array
	{
		if (!Loader::includeModule('dav'))
		{
			return [];
		}

		$syncConnections = [];
		$query = DavConnectionTable::query()
			->setSelect(['*'])
			->whereIn('ACCOUNT_TYPE', $providers)
			->where('ENTITY_TYPE', $type)
			->where('ENTITY_ID', $userId)
			->where('IS_DELETED', 'N')
			->setOrder(['SYNCHRONIZED' => 'ASC'])
		;

		foreach ($query->exec()->fetchCollection() as $davConnection)
		{
			$syncConnections[] = (new BuilderConnectionFromDM($davConnection))->build();
		}

		return $syncConnections;
	}
}
