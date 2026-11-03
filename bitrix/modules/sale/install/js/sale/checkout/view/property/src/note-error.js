import { BitrixVue } from 'ui.vue';

BitrixVue.component('sale-checkout-view-property-note_error', {
    props: ['errorId', 'message'],
    template: `
        <div class="invalid-feedback" :id="errorId" data-testid="sale-checkout-property-error">
            {{message}}
        </div>
	`
});