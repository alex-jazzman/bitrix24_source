export type Avatar = {
	src: string,
	width: number,
	height: number,
	size: number
}

export const EntityTypes = Object.freeze({
	USER: 'USER',
	DEPARTMENT: 'DEPARTMENT',
});

export type EntityType = typeof EntityTypes;

export type BaseEntity = {
	id: number,
	name: string,
	type: EntityType,
}

export type User = BaseEntity & {
	avatar: Avatar,
	pathToProfile: string,
	position: string,
	type: EntityTypes.USER,
}

export type Department = BaseEntity & {
	type: EntityTypes.DEPARTMENT,
	pathToStructure?: string,
}

export type Entity = User | Department;
