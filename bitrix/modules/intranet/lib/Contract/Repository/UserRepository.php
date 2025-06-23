<?php

namespace Bitrix\Intranet\Contract\Repository;

use Bitrix\Intranet\Entity\Collection\UserCollection;
use Bitrix\Intranet\Entity\User;

interface UserRepository
{
	public function getUserById(int $id): User;

	public function findUsersByLogins(array $logins): UserCollection;

	public function findUsersByPhoneNumbers(array $phoneNumbers): UserCollection;

	public function findUsersByIds(array $ids): UserCollection;

	public function findUsersByEmails(array $emails): UserCollection;

	public function findUsersByLoginsAndEmails(array $emails): UserCollection;

	public function findUsersByLoginsAndPhoneNumbers(array $phoneNumbers): UserCollection;

	public function findInvitedUsersByLogins(array $logins, array $notUserTypes = []): UserCollection;

	public function findActivatedUsersByLogins(array $logins, array $notUserTypes = []): UserCollection;

	public function findRealUsersByLogins(array $logins, array $notUserTypes = []): UserCollection;

	public function findEmailOrShopUsersByLogins(array $logins): UserCollection;

	public function findUsersByUserGroup(int $userGroup): UserCollection;

	public function findActiveUsersWithDepartmentsOnline(int $limitOnlineSeconds, int $limitRows = 0): UserCollection;

	public function findActiveUsersWithDepartmentsOnlineCount(int $limitOnlineSeconds): int;

	public function create(User $user): User;

	public function update(User $user): User;
}