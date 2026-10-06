const TEST_ID_PREFIX = 'vibe-plus-notifications-app-limit';

export const APPLICATION_LIMIT_LEARN_MORE_TEST_ID = `${TEST_ID_PREFIX}-learn-more`;

export function getApplicationLimitActionTestId(type: string): string
{
	return {
		buy: `${TEST_ID_PREFIX}-upgrade-btn`,
		trial: `${TEST_ID_PREFIX}-trial-btn`,
		list: `${TEST_ID_PREFIX}-applist-btn`,
	}[type] ?? `${TEST_ID_PREFIX}-action-btn`;
}
