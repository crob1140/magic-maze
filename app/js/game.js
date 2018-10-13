import ai from './ai';
import config from './config';
import helpers from './helpers';

export default {

    scenario: 0,
    admin: false,

    init(options) {
        if (options) {
            this.admin = true;
            this.scenario = options.scenario;
            ai.init(options);
        }
    },

    // TODO: win and lose
    win() {
        console.log('game won!');
    },

    lose() {
        console.log('game lost!');
    }
}
