<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Service\User;

use Sotbit\RestAPI\Exception\UserException;
use Sotbit\RestAPI\Core\Config;
use Respect\Validation\Validator as v;
use Firebase\JWT\JWT;
use Sotbit\RestAPI\Localisation as l;

class UserService extends Base
{

    public function getOne(int $userId): array
    {
        if(!isset($userId)) {
            throw new UserException(l::get('ERROR_USER_ID_EMPTY'), 400);
        }

        return $this->getUserFromDb($userId);
    }

    public function login(array $input): array
    {
        $data = json_decode(json_encode($input), false);
        /*if (! isset($data->email)) {
            throw new UserException('The field "email" is required.', 400);
        }*/

        if(!isset($data->login)) {
            throw new UserException(l::get('ERROR_USER_LOGIN_EMPTY'), 400);
        }

        if(!isset($data->password)) {
            throw new UserException(l::get('ERROR_USER_PASSWORD_EMPTY'), 400);
        }

        //$password = hash('sha512', $data->password);

        $user = $this->userRepository->login($data->login, $data->password);
        $token = [
            'sub'   => $user['ID'],
            'login' => $user['LOGIN'],
            'iat'   => time(),
            'exp'   => time() + Config::getTokenExpire(),
        ];

        return [
            'token'   => JWT::encode($token, Config::getSecretKey()),
            'user_id' => $user['ID'],
        ];
    }

    public function forgot(array $input): array
    {
        $data = json_decode(json_encode($input), false);
        if(empty($data->email)) {
            throw new UserException(l::get('ERROR_USER_EMAIL_EMPTY'), 400);
        }
        if(!v::email()->validate($data->email)) {
            throw new UserException(l::get('ERROR_USER_EMAIL_INVALID'), 400);
        }

        return $this->userRepository->forgot($data->email);
    }
}
