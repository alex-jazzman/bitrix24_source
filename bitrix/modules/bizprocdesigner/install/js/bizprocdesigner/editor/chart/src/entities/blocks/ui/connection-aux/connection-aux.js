import { Connection, DeleteConnectionBtn } from 'ui.block-diagram';

// eslint-disable-next-line no-unused-vars
import type { Connection as TConnection } from '../../../../shared/types';

// @vue/components
export const ConnectionAux = {
	name: 'connection-aux',
	components: { Connection, DeleteConnectionBtn },
	props:
	{
		/** @type TConnection */
		connection:
		{
			type: Object,
			required: true,
		},
	},
	template: `
		<Connection
			:stroke-dasharray="5"
			:connection="connection"
			:key="connection.id"
		>
			<template #default="{ isDisabled }">
				<DeleteConnectionBtn
					:connectionId="connection.id"
					:disabled="isDisabled"
				/>
			</template>
		</Connection>
	`,
};
