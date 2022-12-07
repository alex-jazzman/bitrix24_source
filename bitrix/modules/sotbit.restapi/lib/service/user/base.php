<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Service\User;

use Sotbit\RestAPI\Exception\User;
use Sotbit\RestAPI\Repository\UserRepository;
use Sotbit\RestAPI\Service\BaseService;
use Sotbit\RestAPI\Service\RedisService;
use Respect\Validation\Validator as v;

abstract class Base extends BaseService
{
    protected $userRepository;

    public function __construct(
        UserRepository $userRepository
    ) {
        $this->userRepository = $userRepository;
    }

    protected function getUserFromDb(int $userId): array
    {
        return $this->userRepository->get($userId);
    }


    /*protected static function validateUserName(string $name): string
    {
        if (! v::alnum()->length(1, 100)->validate($name)) {
            throw new User('Invalid name.', 400);
        }

        return $name;
    }
    protected static function validateEmail(string $emailValue): string
    {
        $email = filter_var($emailValue, FILTER_SANITIZE_EMAIL);
        if (! v::email()->validate($email)) {
            throw new User('Invalid email', 400);
        }

        return $email;
    }*/
}
