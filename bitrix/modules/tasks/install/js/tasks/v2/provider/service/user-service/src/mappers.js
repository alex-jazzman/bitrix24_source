import type { UserModel } from 'tasks.v2.model.users';
import type { UserDto } from './types';

export function mapModelToDto(user: UserModel): UserDto
{
	return {
		id: user.id,
		name: user.name,
		image: user.image,
		type: user.type,
	};
}

export function mapDtoToModel(userDto: UserDto): UserModel
{
	return {
		id: userDto.id,
		name: userDto.name,
		image: userDto.image,
		type: userDto.type,
	};
}
