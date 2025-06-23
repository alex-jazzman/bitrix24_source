<?php

namespace Bitrix\Call;

use Bitrix\Main\Config\Configuration;
use Bitrix\Main\LoaderException;
use Bitrix\Main\Security\Cipher;
use Bitrix\Main\Security\SecurityException;
use Bitrix\Main\Config\Option;
use Bitrix\Main\Web\JWT;
use Bitrix\Im\Call\Call;
use Bitrix\Main\Service\MicroService\Client;

class JwtCall
{
	protected static function getCurrentUserId(): int
	{
		global $USER;

		return $USER->getId();
	}

	public static function getPrivateKey(): string
	{
		$decryptedKey = '';
		$cryptoOptions = Configuration::getValue('crypto');

		if (!empty($cryptoOptions['crypto_key']))
		{
			try
			{
				$cipher = new Cipher();
				$encryptedKey = base64_decode(Option::get("call", "call_portal_key"));

				$decryptedKey = $cipher->decrypt($encryptedKey, $cryptoOptions['crypto_key']);
			}
			catch (SecurityException $exception)
			{
			}
		}

		return $decryptedKey;
	}

	protected static function getUserData(): array
	{
		$user = \Bitrix\Im\User::getInstance(self::getCurrentUserId());

		return [
			'userId' => $user->getId(),
			'userName' => $user->getFullName(false),
			'avatar' => $user->getAvatar(),
		];
	}

	/**
	 * Generates a user JWT for a call
	 *
	 * @return string
	 */
	public static function getUserJwt(): string
	{
		return JWT::encode(
			self::getUserData(),
			self::getPrivateKey()
		);
	}

	/**
	 * Generates call JWT
	 *
	 * @param array $chatData Chat info for token
	 * @param array|null $additionalData Additional info for call token
	 *
	 * @return string
	 */
	protected static function getCallJwt(array $chatData, array|null $additionalData = null): string
	{
		if (empty($chatData))
		{
			return '';
		}

		$portalId = (int)Option::get("call", "call_portal_id", 0);
		$callToken = [
			'portalId' => $portalId,
			'chatId' => $chatData['CHAT_ID'],
			'tokenVersion' => $chatData['TOKEN_VERSION'],
			'usersLimit' => Call::getMaxCallServerParticipants(),
			'portalType' => Client::getPortalType(),
			'portalUrl' => Client::getServerName(),
			'controllerUrl' => (new ControllerClient())->getServiceUrl(),
			'roomType' => 1,
			'additionalData' => $additionalData,
		];
		if (!empty($chatData['USER_ROLE']))
		{
			$callToken['role'] = $chatData['USER_ROLE'];
		}

		return JWT::encode($callToken, self::getPrivateKey());
	}

	/**
	 * Return call JWT
	 *
	 * @param int $chatId Chat info for token
	 * @param int $userId
	 * @param array|null $additionalData Additional info for call token
	 *
	 * @return string
	 */
	public static function getCallToken(int $chatId, int $userId, array|null $additionalData = null): string
	{
		if (empty($chatId))
		{
			return '';
		}

		return self::getCallJwt(
			[
				'CHAT_ID' => $chatId,
				'TOKEN_VERSION' => self::getTokenVersion($chatId),
				'USER_ROLE' => self::getUserRole($chatId, $userId),
			],
			$additionalData
		);
	}

	/**
	 * Return call JWT list
	 *
	 * @param array<int> $chatIdList List of chat ids for get token
	 * @param array|null $additionalData Additional info for call token
	 *
	 * @return array<string>
	 */
	public static function getCallTokenList(array $chatIdList, array|null $additionalData = null): array
	{
		$result = [];

		if (empty($chatIdList))
		{
			return $result;
		}

		$chatEntityList = CallChatEntity::findAll($chatIdList);
		foreach ($chatIdList as $chatId)
		{
			$tokenVersion = 1;
			if (isset($chatEntityList[$chatId]))
			{
				$tokenVersion = $chatEntityList[$chatId];
			}

			$additionalFields = [];
			if (isset($additionalData[$chatId]))
			{
				$additionalFields = $additionalData[$chatId];
			}

			$result[$chatId] =  self::getCallJwt(
				[
					'CHAT_ID' => $chatId,
					'TOKEN_VERSION' => $tokenVersion,
				],
				$additionalFields
			);
		}

		return $result;
	}

	/**
	 * Update call JWT version
	 *
	 * @param int $chatId Chat id for token update
	 * @param int $userId
	 * @return string
	 */
	public static function updateCallToken(int $chatId, int $userId): string
	{
		if (empty($chatId))
		{
			return '';
		}

		$chatEntity = CallChatEntity::updateVersion($chatId);

		$newTokenVersion = $chatEntity->getCallTokenVersion();
		(new BalancerClient())->updateTokenVersion($newTokenVersion, $chatId);

		return self::getCallJwt([
			'CHAT_ID' => $chatId,
			'TOKEN_VERSION' => $newTokenVersion,
			'USER_ROLE' => self::getUserRole($chatId, $userId),
		]);
	}

	/**
	 * Get version for call token
	 *
	 * @param int $chatId Chat id for token update
	 *
	 * @return int|null
	 */
	public static function getTokenVersion(int $chatId): ?int
	{
		if (empty($chatId))
		{
			return null;
		}

		$tokenVersion = 1;
		$chatEntity = CallChatEntity::find($chatId);
		if ($chatEntity)
		{
			$tokenVersion = $chatEntity->getCallTokenVersion();
		}

		return $tokenVersion;
	}

	private static function getUserRole(int $chatId, int $userId): string
	{
		static $cache = [];

		if (isset($cache[$chatId][$userId]))
		{
			return $cache[$chatId][$userId];
		}

		$role = 'USER';
		if ($chatId == 0 || $userId == 0)
		{
			return $role;
		}

		\Bitrix\Main\Loader::includeModule('im');

		$chat = \Bitrix\Im\V2\Chat::getInstance($chatId);
		if ($chat->getId() == $chatId)
		{
			if ($userId === $chat->getAuthorId())
			{
				$role = 'ADMIN';
			}
			elseif (in_array($userId, $chat->getManagerList(), true))
			{
				$role = 'MANAGER';
			}
		}

		$cache[$chatId][$userId] = $role;

		return $role;
	}
}
