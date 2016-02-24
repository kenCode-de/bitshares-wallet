import React from "react";
import Translate from "react-translate-component";
import Transactions from "./Transactions";
import Balances from "./Balances";
import BackupBrainkey from "./BackupBrainkey"
import { Router, Route, Link, IndexRoute } from 'react-router';
import counterpart from "counterpart";
import IntlActions from "actions/IntlActions";
import IntlStore from "stores/IntlStore";
import SettingsStore from "stores/SettingsStore";
import SettingsActions from "actions/SettingsActions";
import WalletUnlockActions from "actions/WalletUnlockActions"


const Checkbox = require('material-ui/lib/checkbox');
import ThemeManager from 'material-ui/lib/styles/theme-manager';
import LightRawTheme from 'material-ui/lib/styles/raw-themes/light-raw-theme';
import Colors from'material-ui/lib/styles/colors';
const RaisedButton = require('material-ui/lib/raised-button');
const RadioButton = require('material-ui/lib/radio-button');
const RadioButtonGroup = require('material-ui/lib/radio-button-group');
const Dialog = require('material-ui/lib/dialog');
import _ from "lodash";

import { createHashHistory, useBasename } from 'history';
const history = useBasename(createHashHistory)({});
import Select  from "react-select";
import BindToChainState from "./Utility/BindToChainState";

@BindToChainState()
class SettingsScreen extends React.Component {


  childContextTypes: {
    muiTheme: React.PropTypes.object,
  }

  constructor(props) {
    super(props);
    this.state ={ muiTheme: ThemeManager.getMuiTheme(LightRawTheme)}
  }

  getChildContext() {
      muiTheme: this.state.muiTheme
  }

  shouldComponentUpdate(nextProps, nextState) {
        //console.log('$$$settingsscreen -  shouldComponentUpdate, nextState=', nextState);
        return true;
  }
  _displayFormatSamples(){
      console.log('$$$formattedNow', IntlStore.formatNow(null));
      console.log('$$$formatted currency:-4624.6', IntlStore.formatCurrency(-4624.6));
      console.log('$$$formatted currency:14624.92', IntlStore.formatCurrency(14624.92));
      console.log('$$$formatted currency:24500', IntlStore.formatCurrency(24500));
      console.log('$$$formatted currency:3433.02', IntlStore.formatCurrency(3433.02));
      console.log('$$$formatted currency:5555.004', IntlStore.formatCurrency(5555.004));
  }

  componentWillMount() {
    //this._displayFormatSamples();
    let newMuiTheme = ThemeManager.modifyRawThemePalette(this.state.muiTheme, {
      accent1Color: Colors.deepOrange500,
    });
    var advancedSettings = SettingsStore.getAdvancedSettings();
    this.setState({muiTheme: newMuiTheme, advancedSettings: advancedSettings});
    // currencies
    var currencies = IntlStore.getCurrencies();
    var rows = [];
    for (var i=0; i<currencies.length; i++) {
          var currency = currencies[i];
          var label = currency.state + ' (' + (currency.iso || '(none)') + ' - '  + (currency.name ||'') +')';
          rows.push({value:currency.id, label: label});
        }
    this.currencyEntries = rows;
    let currencyId = IntlStore.getCurrency().id;
    this.setState({currencyId: currencyId});
    // languages
    let locale = IntlStore.getCurrentLocale();
    this.setState({currentLocale: locale});
    var langs = IntlStore.getLanguages();
    rows = [];
    for (var key in langs)
    {
      if (langs.hasOwnProperty(key))
        rows.push({value: key, label:langs[key]});
    }
    this.languageEntries = rows;
    // timezones
    let currentTz = IntlStore.getCurrentTimeZone().abbr;
    this.setState({ currentTimeZone: currentTz});
    var timezones = IntlStore.getTimezones();
    rows = [];
    for (var i=0; i<timezones.length; i++) {
        var timezone = timezones[i];
        //  (  ) ACDT - Australian Central Daylight Savings Time (UTC+10:30)
        // {abbr:'ACT', name: 'Acre Time', offset: 'UTC−05'},
        var label = timezone.abbr + ' - ' + timezone.name + ' (' + timezone.offset+')';
        rows.push({value:timezone.abbr, label:label});
    }
    this.timezoneEntries = rows;
  }
  _switchCurrency(value)
  {
    IntlActions.switchCurrency(value);
    this.setState({ currencyId: value});

  }
  _switchLanguage(value)
  {
    let locale = IntlStore.getCurrentLocale();
    if (value !== locale) {
        IntlActions.switchLocale(value);
    }
    this.setState({ currentLocale: value});
  }
  _switchTimezone(value)
  {
    let tz = IntlStore.getCurrentTimeZone().abbr;
    if (value !== tz) {
        IntlActions.switchTimezone(value);
    }
    this.setState({ currentTimeZone: value});
  }


  _handleAdvancedSettingsUpdate(e)
  {

    //e.preventDefault();
      var advancedSettings =  {
          checkUpdatesStartup: this.refs.chkCheckUpdatesStartup.isChecked(),
          autoInstallMajorVer: this.refs.chkAutoInstallMajorVer.isChecked(),
          requirePinToOpen: this.refs.chkrequirePinToOpen.isChecked(),
          autoCloseWalletAfterInactivity: this.refs.chkAutoCloseWalletAfterInactivity.isChecked(),
          alwaysDonateDevsMunich: this.refs.chkAlwaysDonateDevsMunich.isChecked(),
          hideDonations: this.refs.chkHideDonations.isChecked()
      }
      SettingsStore.changeAdvancedSettings(advancedSettings);
      this.setState({advancedSettings: advancedSettings});

      //console.log("$$$settings screen - advanced settings updated", advancedSettings);

  }

  _redirectToBackup()
  {
    //Router.navigate('backup');
    //this.transitionTo('backup');
    history.pushState(null, 'backup');
  }
  _redirectToChangePin()
  {
    history.pushState(null, 'changepin');
  }

  onBrainkeyOpenClick(e) {
        e.preventDefault();
        //this.refs.brainkeyModal.dismiss();
    //    WalletUnlockActions.lock();
   //     WalletUnlockActions.unlock().then( () => {
            var pw = SettingsStore.getWalletPassword();
            this.setState({brainkeyModalOpen: true, brainKeyPw: pw});
      //  })
   }

  onBrainkeyCloseClick(e) {
        e.preventDefault();
        //this.refs.brainkeyModal.dismiss();
        this.setState({brainkeyModalOpen: false});
   }



  // Render SettingsScreen view
  render() {

    let okActions = [
      { text: counterpart.translate("wallet.ok") },
    ];
    //let translate = IntlStore.translate;
    let settings = this.state.advancedSettings;

    return (

      <section className="content">
        <main className="no-nav" ref="settingsScreenRef">

          <section className="setting-item">
            <div className="code__item"><Translate content="wallet.settings.taxableCountry" /></div>
            <Select name="test-selectbox"    value={this.state.currencyId}
                options={this.currencyEntries} clearable={false}
                onChange={this._switchCurrency.bind(this)}   />
          </section>


          <section className="setting-item">
            <div className="code__item"><Translate content="wallet.settings.preferredLanguage" /></div>
            <Select name="test-selectbox1"    value={this.state.currentLocale}
                options={this.languageEntries} clearable={false}
                onChange={this._switchLanguage.bind(this)}   />
          </section>

          <section className="setting-item">
            <div className="code__item"><Translate content="wallet.settings.displayDtAs" /></div>
            <Select name="test-selectbox2"    value={this.state.currentTimeZone}
                options={this.timezoneEntries} clearable={false}
                onChange={this._switchTimezone.bind(this)}   />
          </section>
        <section className="setting-item">
          <Checkbox ref="chkCheckUpdatesStartup"
                name="cchkCheckUpdatesStartup"
                value="checkboxValue1"
                label={<Translate content="wallet.settings.checkUpdatesStartup" />}
                checked={settings.checkUpdatesStartup} onCheck={this._handleAdvancedSettingsUpdate.bind(this)} />
        </section>
        <section className="setting-item">
          <Checkbox ref="chkAutoInstallMajorVer"
            name="chkAutoInstallMajorVer"
            value="checkboxValue2"
            label={<Translate content="wallet.settings.autoInstallMajorVer" />}
            checked={settings.autoInstallMajorVer} onCheck={this._handleAdvancedSettingsUpdate.bind(this)} />
          </section>
          <section className="setting-item">
              <Checkbox  ref="chkrequirePinToOpen"
                name="chkrequirePinToOpen"
                value="checkboxValue3"
                label={<Translate content="wallet.requirePinToOpen" />}
                checked={settings.requirePinToOpen} onCheck={this._handleAdvancedSettingsUpdate.bind(this)} />
          </section>
          <section className="setting-item">
              <Checkbox  ref="chkAutoCloseWalletAfterInactivity"
                name="chkAutoCloseWalletAfterInactivity"
                value="checkboxValue4"
                label={<Translate content="wallet.settings.autoCloseWalletAfterInactivity" />}
                checked={settings.autoCloseWalletAfterInactivity} onCheck={this._handleAdvancedSettingsUpdate.bind(this)} />
           </section>
           <section className="setting-item">
               <Checkbox  ref="chkAlwaysDonateDevsMunich"
                name="chkAlwaysDonateDevsMunich"
                value="checkboxValue5"
                label={<Translate content="wallet.settings.alwaysDonateDevsMunich" />}
                checked={settings.alwaysDonateDevsMunich}  onCheck={this._handleAdvancedSettingsUpdate.bind(this)} />
          </section>
           <section className="setting-item">
               <Checkbox  ref="chkHideDonations"
                name="chkHideDonations"
                value="checkboxValue6"
                label={<Translate content="wallet.home.hideDonations" />}
                checked={settings.hideDonations}  onCheck={this._handleAdvancedSettingsUpdate.bind(this)} />
          </section>
          <section className="setting-item">
            <RaisedButton style={{'width': '32%', 'min-width': '40px'}} label={<Translate content="wallet.settings.backup" />}
              onTouchTap={this._redirectToBackup.bind(this)}    />
            <RaisedButton style={{'margin-left': '7%', 'width': '60%', 'min-width': '40px'}} label={<Translate content="wallet.brainkey_backup" />}
              onTouchTap={this.onBrainkeyOpenClick.bind(this)}    />
          </section>
          <section className="setting-item">
            <RaisedButton label={<Translate content="wallet.settings.editPin" />}
              onTouchTap={this._redirectToChangePin.bind(this)}    />
          </section>


          <section className="setting-item">
            <div><Translate content="wallet.settings.q_sharePublicAddress" /></div>
            <div><Translate content="wallet.settings.a_sharePublicAddress" /></div>
          </section>
          <section className="setting-item">
            <div><Translate content="wallet.settings.q_accessPrivateKeys" /></div>
            <div><Translate content="wallet.settings.a_accessPrivateKeys" /></div>
          </section>
          <section className="setting-item">
            <div><Translate content="wallet.settings.q_switchAccount" /></div>
            <div><Translate content="wallet.settings.a_switchAccount" /></div>
          </section>
          <section className="setting-item">
            <div><Translate content="wallet.settings.q_searchTransaction" /></div>
            <div><Translate content="wallet.settings.a_searchTransaction" /></div>
          </section>
        </main>
         <Dialog title={counterpart.translate("wallet.brainkey_backup")}
               open={this.state.brainkeyModalOpen}
               autoScrollBodyContent={true}
               ref="brainkeyModal">
             <div style={{maxHeight: "60vh", overflowY:'auto'}}>
                <BackupBrainkey  pin = {this.state.brainKeyPw}/>
              </div>
              <div className="grid-block shrink" style={{paddingTop: "1rem"}}>
                 <div className="button-group">
                      <RaisedButton label={counterpart.translate("wallet.close")}
                          secondary={true}
                          onTouchTap={this.onBrainkeyCloseClick.bind(this)} />
                  </div>
              </div>
          </Dialog>

      </section>
    );
  }

}

export default  SettingsScreen;
