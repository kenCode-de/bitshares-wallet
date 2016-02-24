import React from "react";
import Translate from "react-translate-component";
import Transactions from "./Transactions";
import AccountCard from "./AccountCard";
import Balances from "./Balances";
import RecentTransactions from "./RecentTransactions";
import AltContainer from "alt/AltContainer";
import BindToChainState from "./Utility/BindToChainState";
import { Router, Route, Link, IndexRoute } from 'react-router';
const SelectField = require('material-ui/lib/select-field');
import AccountActions from "actions/AccountActions";
import AccountStore from "stores/AccountStore";
import SettingsStore from "stores/SettingsStore";
import WalletUnlockStore from "stores/WalletUnlockStore";
import BackupStore from "stores/BackupStore";
import Immutable from "immutable";
import ChainTypes from "./Utility/ChainTypes";
import KeyGenComponent from  "./KeyGenComponent"
import WalletDb from "stores/WalletDb";
import counterpart from "counterpart";

import { createHashHistory, useBasename } from 'history';
const history = useBasename(createHashHistory)({});
import QRCode from 'qrcode.react';

class HomeScreen extends React.Component {

    constructor(props) {
      super(props);

      this.state =  {
          qrContainerSize: 48//64
          //The QR code on the homescreen is WAY too big. Take off 25% of its size.
      };

    }

    shouldComponentUpdate(nextState) {
      return (
          nextState.qrContainerSize !== this.state.qrContainerSize
      );
    }

    componentDidMount() {

      var getDOMNode;
      if (/^0\.14/.test(React.version)) {
        getDOMNode = function (ref) {
          return ref;
        };
      } else {
        getDOMNode = function (ref) {
          return ref.getDOMNode();
        };
      }

      let mainDom = getDOMNode(this.refs.qr_main);

    //  let mainPadding = 20;

      let mainWidth = mainDom.offsetWidth; //- mainPadding;



      this.setState({qrContainerSize: mainWidth});
    }

    _shareBTSAddress()
    {

      console.log(window.plugins);

      //onclick="window.plugins.socialsharing.share({qrcontent.privateKey})"
        if (window.plugins && window.plugins.socialsharing)
        {
            var qrcontent = KeyGenComponent.getComponents();

            window.plugins.socialsharing.share(
                qrcontent.privateKey,
                'BTS address',
                null, // images
                'http://bitshares-munich.evennode.com/');
        }
        else
            console.log('BTS address share: social network sharing plugin is not available');
    }

    _scan() {

        cordova.plugins.barcodeScanner.scan(

            function (result) {

                if(!result.cancelled)
                {
                    if(result.format == "QR_CODE")
                    {

                        history.pushState({payment: JSON.stringify(result.text) }, 'send');
                    }
                }
            },
            function (error) {
                alert("Scanning failed: " + error);
            }
       );
    }

    _onQRCodeClick()
    {
       history.pushState(null, 'receive');
    }

    render() {

      var isBackupRequired = BackupStore.isBackupRequired();
      var qrcontent = KeyGenComponent.getComponents();

      //WalletDb.unlock();

      var isLocked = WalletDb.isLocked();
      console.log('$$$isLocked', isLocked);

      var contents = isBackupRequired ?        <section className="code content-home">
        <Link to="backup" className="active"><Translate content="wallet.createBackupPrompt" /></Link>
      </section> :       [
            <section className="code content-home">
              <div className="code__item">
                <div className="code__item__img" ref="qr_main" onTouchTap={this._onQRCodeClick.bind(this)}>
                  <QRCode    value="" fgColor="#064012" bgColor ="#C9E6F2"  size={this.state.qrContainerSize}/>
                </div>
                <div className="code__item__data">
                      <AltContainer
                          stores={
                            {
                              account: () => { // props is the property of AltContainer
                                return {
                                  store: AccountStore,
                                  value: AccountStore.getState().currentAccount
                                };
                              },
                              linkedAccounts: () => {
                                return {
                                  store: AccountStore,
                                  value: AccountStore.getState().linkedAccounts
                                }
                              }
                            }
                          }
                        >
                         <AccountCard/>
                    </AltContainer>
                    <div className="data-text"  onTouchTap = {this._shareBTSAddress.bind(this)} >{qrcontent.privateKey}</div>
                </div>
              </div>
            </section>,
            <section className="code-buttons">
              <Link to="receive" className="btn btn-receive upper">{counterpart.translate("wallet.home.receive")}</Link>
              <div className="send-btn-container">
                <span onTouchTap={this._scan.bind(this)} className="btn btn-qr-scan"></span>
                <Link to="send" className="btn btn-send upper">{counterpart.translate("wallet.home.send")}</Link>
              </div>
            </section>,
                      <AltContainer
                          stores={
                            {
                              account: () => { // props is the property of AltContainer
                                return {
                                  store: AccountStore,
                                  value: AccountStore.getState().currentAccount
                                };
                              }
                            }
                          }>
                       <Balances />
                       <Transactions  />
                    </AltContainer>]

       return (
         <section>
            {contents}
        </section>
       );
    }
};

export default HomeScreen;
