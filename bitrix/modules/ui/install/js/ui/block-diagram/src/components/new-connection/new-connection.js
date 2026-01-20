import { computed, toValue } from 'ui.vue3';
import { useNewConnectionState } from '../../composables';
import type { UseNewConnectionState } from '../../composables';
import './new-connection.css';

type NewConnectionSetup = {
	hasNewConnection: boolean;
	newConnectionPathInfo: Pick<UseNewConnectionState, 'newConnectionPathInfo'>;
};

const PATH_CLASS_NAMES = {
	base: 'ui-block-diagram-new-connection__path',
	error: '--error',
};

// @vue/component
export const NewConnection = {
	name: 'NewConnection',
	setup(props): NewConnectionSetup
	{
		const {
			hasNewConnection,
			newConnectionPathInfo,
			isValid,
		} = useNewConnectionState();

		const pathClassNames = computed((): { [string]: boolean } => ({
			[PATH_CLASS_NAMES.base]: true,
			[PATH_CLASS_NAMES.error]: !toValue(isValid),
		}));

		return {
			hasNewConnection,
			newConnectionPathInfo,
			pathClassNames,
		};
	},
	template: `
		<svg
			v-if="hasNewConnection"
			class="ui-block-diagram-new-connection"
		>
			<path
				:d="newConnectionPathInfo.path"
				:class="pathClassNames"
			/>
		</svg>
	`,
};
