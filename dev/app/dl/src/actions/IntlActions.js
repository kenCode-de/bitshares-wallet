var alt = require("../alt-instance");

class IntlActions {

    switchLocale(locale) {
        this.dispatch(locale);
    }

    getLocale(locale) {
        this.dispatch(locale);
    }

    switchTimezone(id){
        this.dispatch(id);
    }
    switchCurrency(id){
        this.dispatch(id);
    }

}

module.exports = alt.createActions(IntlActions);
