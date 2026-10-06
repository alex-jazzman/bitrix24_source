import { AutomationSliderService } from '../services/automation-slider-service';
import { createEmptySlider } from './helpers';
import actions from './actions';
import getters from './getters';
import mutations from './mutations';

export default ({ entityTypeId, categoryId }) => ({
	state: {
		entityTypeId,
		categoryId,
		expandedScenarioCodes: [],
		slider: createEmptySlider(),
		isLoading: true,
		isSaving: false,
		errorCode: null,
		service: new AutomationSliderService(entityTypeId, categoryId),
	},
	getters,
	mutations,
	actions,
});
