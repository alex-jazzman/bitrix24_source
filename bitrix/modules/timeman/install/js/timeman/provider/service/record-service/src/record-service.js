import { ajax } from 'main.core';

import type { Record } from './types';

class RecordService
{
	async getCurrentRecord(userId: number): Promise<?Record>
	{
		const response = await ajax.runAction('timeman.V2.Record.getCurrentRecord', {
			json: { userId },
		});

		return (response?.data ?? null);
	}
}

export { RecordService };
export const recordService = new RecordService();
