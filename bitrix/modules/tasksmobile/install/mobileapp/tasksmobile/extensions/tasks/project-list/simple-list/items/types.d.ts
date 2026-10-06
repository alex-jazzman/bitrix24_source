declare const ListItemType: {
	PROJECT: 'Project',
};

declare const ROLE_BADGE_HEIGHT: number;
declare const RoleBadgeType: {
	OWNER: 'owner',
	MODERATOR: 'moderator',
};

type ProjectListItemFactoryData = {
	item: {
		id: number | string,
	},
	testId: string,
	[key: string]: any,
};

type ProjectListProjectContentProps = {
	id: number | string,
	testId: string,
};

type ProjectContentGroup = {
	name?: string,
	image?: string,
	resizedImage100?: string,
};

type ProjectContentProject = Pick<ProjectListItem,
	| 'id'
	| 'activityDate'
	| 'ownerId'
	| 'moderatorIds'
	| 'memberIds'
	| 'counter'
	| 'hasCollabers'
>;

type ProjectContentProps = ProjectListProjectContentProps & {
	project?: ProjectContentProject,
	group?: ProjectContentGroup,
};

type ProjectRoleStackProps = {
	testId: string,
	ownerId: number,
	moderatorIds?: number[],
};

type ProjectMemberStackProps = {
	testId: string,
	memberIds?: number[],
};

type ProjectRoleBadgeType = 'owner' | 'moderator';

type ProjectRoleBadgeIconProps = {
	type: ProjectRoleBadgeType,
};

type ProjectRoleBadgeSvgParams = {
	width: number,
	height: number,
	viewBox: string,
	path: string,
	fill: string,
};

type ProjectRoleBadgeProps = {
	testId: string,
	index: number,
	ownerId: number,
};

type ProjectRoleBadgesProps = {
	testId: string,
	visibleCount: number,
	ownerId: number,
};

type ProjectRoleStackFrameProps = {
	testId: string,
	entities: number[],
};

declare class ProjectListItemsFactory
{
	static create(type: string, data: ProjectListItemFactoryData): object;
}

declare class Project
{
	constructor(props: ProjectListItemFactoryData);
	renderItemContent(): object | null;
	blink(callback?: Function | null): void;
	setLoading(callback?: Function | null): void;
	dropLoading(callback?: Function | null): void;
}

declare function ProjectContentView(props: ProjectListProjectContentProps): object | null;
declare function ProjectRoleStack(props: ProjectRoleStackProps): object | null;
declare function ProjectMemberStack(props: ProjectMemberStackProps): object | null;
declare function RoleBadgeIcon(props: ProjectRoleBadgeIconProps): object;
