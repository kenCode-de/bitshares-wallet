var alt = require("../alt-instance");
var IntlActions = require("../actions/IntlActions");
var BaseStore = require("./BaseStore");
//var SettingsActions = require("../actions/SettingsActions");
var SettingsStore = require("./SettingsStore");
var counterpart = require("counterpart-instance");
var locale_en = require("assets/locales/locale-en");
var currencies = require("assets/dictionaries/currencies");
var timezones = require("assets/dictionaries/timezones");

counterpart.registerTranslations("en", locale_en);

class IntlStore extends BaseStore {
    constructor() {
        super();
        this.currentLocale = null;//"en";
        this.localeDictionary = null;
        this.locales = ["en", "ru", "fr"];
        this.localesObject = {en: locale_en};
        this.currencies = currencies.currencies;
        this.timezones = timezones.timezones;
        this.currentTimezone = null;
        this.currency== null;
        this.languages = locale_en.languages;

        this.bindListeners({
            onSwitchLocale: IntlActions.switchLocale,
            onGetLocale: IntlActions.getLocale,
            onSwitchTimezone: IntlActions.switchTimezone,
            onSwitchCurrency: IntlActions.switchCurrency
        });

        this._export("getCurrentLocale", "translate" ,"hasLocale", "getLanguages", "getCurrencies", "getCurrencyById",
            "getTimezones", "getCurrentTimeZone", "formatNow", "formatTime", "formatTimeSeparated",
            "getCurrency","formatCurrency");
    }

    hasLocale(locale) {
        console.log("hasLocale:", this.locales.indexOf(locale));
        return this.locales.indexOf(locale) !== -1;
    }
    getCurrentLocale() {
        if (this.currentLocale == null)
        {
            var locale =   SettingsStore.getSetting("currentlocale");
            if (locale)
            {
                console.log("Locale is initialized from settings store: ", locale);
            }
            else if (navigator && navigator.language)
            {
                locale = navigator.language.substring(0,2);
                //SettingsStore.changeSetting({setting: "currentlocale", value: locale });
                console.log("Locale is initialized from navigator settings: ", locale);
            }
            else
            {
                locale = en;
                console.log("Locale is not initialized, assigned EN by default");
            }
            this.onSwitchLocale(locale);
        }
        return this.currentLocale;
    }
    onGetLanguages() {
        return this.languages;
    }
    getLanguages() {
        return this.languages;
    }
    translate(key)
    {
        if (this.localeDictionary == null)
            this.getCurrentLocale();
        var translation = _.get(this.localeDictionary.wallet, key);
        return translation === undefined ? 'No translation for '+ key : translation;

    }
    getCurrencies(){
        return this.currencies;
    }
    getCurrency(){
        if (this.currency== null)
        {
            var id = SettingsStore.getSetting("currencyid") || this.currencies[0].id;
            this.currency = this.getCurrencyById(id);
        }
        return this.currency;
    }
    formatCurrency(amount, thouSeparator, decSeparator) {
        var cur = this.getCurrency();
        //var fract = Math.abs(~~((amount%1)*cur.ratio).toFixed());
        var decSeparator = decSeparator == undefined ? "." : decSeparator,
            thouSeparator = thouSeparator == undefined ? "," : thouSeparator,
            sign = n < 0 ? "-" : "";
        //
        //var n = amount.toString(), p = n.indexOf('.');

        //if (cur.ratio%10 !=0) {
        var n = (~~amount).toString();
        var fract = Math.abs(~~((amount%1)*cur.ratio).toFixed(cur.decplaces));
        var raw =  n.replace(/\d(?=(?:\d{3})+(?:\.|$))/g, function($0, i){
            return  ($0+thouSeparator);
        });
        raw = (cur.symbol|| cur.iso) + ' ' +  raw;
        if (fract != 0)
        {
            fract = String('0000000000' + fract).slice(-cur.decplaces);
            raw += decSeparator + fract;
        }
        return raw;


    }
    getCurrencyById(id){
        for (var i=0; i<this.currencies.length; i++)
        {
            if (this.currencies[i].id == id)
            {
                var cur = this.currencies[i];
                var ratio = parseInt(cur.ratio);
                if (isNaN(ratio))
                {
                    ratio = 0;
                    cur.decplaces = 0;
                }
                else
                {
                    cur.decplaces = (ratio-1).toString().length;
                }
                cur.ratio = ratio;
                return cur;
            }
        }
        return null;
    }
    getTimezones(){
        return this.timezones;
    }
    getCurrentTimeZone(){
        if (this.currentTimezone == null)
        {
            var id = SettingsStore.getSetting("timezoneid") || this.timezones[0].abbr;
            this.currentTimezone = this.getTimezoneById(id);
        }
        return this.currentTimezone;
    }
    getTimezoneById(id){
        for (var i=0; i<this.timezones.length; i++)
        {
            if (this.cachedTimezone && this.cachedTimezone.abbr == id)
                return cachedTimezone;
            if (this.timezones[i].abbr == id)
            {
                var tz = this.timezones[i];
                var sa = tz.offset.replace('UTC', '').split(':');
                var offsetMs = 0; // bare 'UTC'
                if (sa[0].length != 0)
                {
                    offsetMs = parseInt(sa[0])*3600000; // hrs
                }
                if (sa.length>1)// min
                {
                    if (offsetMs<0)
                        offsetMs -= 60000*parseInt(sa[1]);
                    else
                        offsetMs += 60000*parseInt(sa[1]);
                }
                tz.offsetMs = offsetMs;
                this.cachedTimezone = tz;
                return tz;
            }
        }
        return null;
    }
    formatTime(utcTime, options)
    {
        var locale = this.getCurrentLocale();
        options = options ||  { year: 'numeric', month: 'short', day:"numeric", hour: "numeric", minute: "numeric"};
        options.timeZone = 'UTC';
        //{hour: "numeric", minute: "numeric", second: "numeric", timeZoneName: "short"}
        var tz = this.getCurrentTimeZone();
        var formatted = new Intl.DateTimeFormat(locale, options).format(utcTime+tz.offsetMs);
        return formatted + ' ' + tz.abbr;
    }
    formatTimeSeparated(utcTime)
    {
        var locale = this.getCurrentLocale();
        var options =   { year: 'numeric', month: 'short', day:"numeric" }
        options.timeZone = 'UTC';
        //{hour: "numeric", minute: "numeric", second: "numeric", timeZoneName: "short"}
        var tz = this.getCurrentTimeZone();
        var formatted = [];
        formatted.push(new Intl.DateTimeFormat(locale, options).format(utcTime+tz.offsetMs));
        options =  {hour: "numeric", minute: "numeric", timeZone : 'UTC'};
        var correction = new Date().getTimezoneOffset()*-60000; // cheat Intl that considers current timezone
        formatted.push(new Intl.DateTimeFormat(locale, options).format(utcTime+tz.offsetMs+correction)+ ' ' + tz.abbr);
        return formatted;
    }

    formatLocalDate(localDate, options)
    {
        var utcTime = localDate.getTime() + localDate.getTimezoneOffset() * 60000;
        return this.formatTime(utcTime, options)
    }
    formatNow(options)
    {
        //return this.formatLocalDate(new Date());
        return this.formatTime(new Date().getTime());
    }


    /*
    return new Promise( resolve => {
            this.dispatch({wallet_name, create_wallet_password, brnkey, resolve})
        })
    */

    onSwitchLocale(locale) {
        var langs = null;
        switch (locale) {
            case "en":
                counterpart.registerTranslations("en", this.localesObject.en);
                this.localesObject[locale] =  this.localesObject.en;
                this.languages = this.localesObject.en.languages;
                break;

            default:
                let newLocale = this.localesObject[locale];
                if (!newLocale) {
                    newLocale = require("assets/locales/locale-" + locale);
                    this.localesObject[locale] = newLocale;
                }
                counterpart.registerTranslations(locale, newLocale);
                this.languages = newLocale.languages;
                break;
        }
        counterpart.setLocale(locale);
        this.currentLocale = locale;
        this.localeDictionary = this.localesObject[locale];
        SettingsStore.changeSetting({setting: "currentlocale", value: locale });
    }
    onSwitchTimezone(id){
        var tz = this.getTimezoneById(id);
        this.currentTimezone = tz;
        SettingsStore.changeSetting({setting: "timezoneid", value: id });
    }
    onSwitchCurrency(id){
        var currency = this.getCurrencyById(id);
        this.currency = currency;
        SettingsStore.changeSetting({setting: "currencyid", value: id });
    }

    onGetLocale(locale) {
        if (this.locales.indexOf(locale) === -1) {
            this.locales.push(locale);
        }
    }
}

module.exports = alt.createStore(IntlStore, "IntlStore");
