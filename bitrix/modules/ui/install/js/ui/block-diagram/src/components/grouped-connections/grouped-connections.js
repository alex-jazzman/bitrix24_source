import './grouped-connections.css';
import { computed, toValue } from 'ui.vue3';
import { useBlockDiagram } from '../../composables';
import { Connection } from '../connection/connection';
import { NewConnection } from '../new-connection/new-connection';
import { ConnectionsQueueTransition } from '../connections-queue-transition/connections-queue-transition';
import { getGroupConnectionSlotName } from '../../utils';
import type {
	GroupedConnections as TGroupedConnections,
	ConnectionGroupNames,
} from '../../types';

type GroupedConnectionsSetup = {
	groupedVisibleConnections: TGroupedConnections;
	visibleConnectionGroupNames: ConnectionGroupNames;
	getGroupConnectionSlotName: typeof getGroupConnectionSlotName;
};

// @vue/component
export const GroupedConnections = {
	name: 'grouped-connections',
	components: {
		Connection,
		NewConnection,
		ConnectionsQueueTransition,
	},
	setup(): GroupedConnectionsSetup
	{
		const { blockIntersections, connectionPreview } = useBlockDiagram();
		const groupedVisibleConnections = computed((): TGroupedConnections => {
			const hiddenConnectionId = toValue(connectionPreview)?.hiddenConnectionId;
			const groups = toValue(blockIntersections.groupedVisibleConnections);

			if (!hiddenConnectionId)
			{
				return groups;
			}

			return Object.fromEntries(
				Object.entries(groups).map(([groupName, connections]) => [
					groupName,
					connections.filter((connection) => connection.id !== hiddenConnectionId),
				]),
			);
		});

		return {
			groupedVisibleConnections,
			visibleConnectionGroupNames: blockIntersections.visibleConnectionGroupNames,
			getGroupConnectionSlotName,
		};
	},
	template: `
		<ConnectionsQueueTransition>
			<slot
				v-for="connection in visibleConnectionGroupNames"
				:key="connection"
				:name="getGroupConnectionSlotName(connection)"
				:connections="groupedVisibleConnections[connection]"
			/>
			<NewConnection/>
		</ConnectionsQueueTransition>
	`,
};
