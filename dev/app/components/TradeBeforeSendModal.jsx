import React from 'react'
import cname from "classnames"

import PasswordInput from "./Forms/PasswordInput"
import notify from "actions/NotificationActions"
import Translate from "react-translate-component";
import counterpart from "counterpart";

import AltContainer from "alt/AltContainer"
import WalletDb from "stores/WalletDb"
import TradeBeforeSendStore from "stores/TradeBeforeSendStore"
import SessionActions from "actions/SessionActions"
import TradeBeforeSendActions from "actions/TradeBeforeSendActions"
import Apis from "rpc_api/ApiInstances"
const Dialog = require('material-ui/lib/dialog');
const RaisedButton = require('material-ui/lib/raised-button');
import If from "./If";

import SettingsStore from "stores/SettingsStore";

import { createHashHistory, useBasename } from 'history';
import TradeAssetSelector from "./Utility/TradeAssetSelector";
import {FetchChainObjects} from "api/ChainStore";
import utils from "common/utils";
import AccountActions from "actions/AccountActions";
import TransactionConfirmStore from "stores/TransactionConfirmStore";
import TradeConfirmActions from "actions/TradeConfirmActions";
import SendScreen from "./SendScreen";
const history = useBasename(createHashHistory)({});


class TradeBeforeSendModal extends React.Component {

    constructor() {
        super();
        this.state = this._getInitialState();
        this.pin_attempts = 0;
        this.onTrxIncluded = this.onTrxIncluded.bind(this);
    }

    componentWillReceiveProps(next_props) {
        /*if(next_props.unclosable !== this.props.unclosable) {
            this.forceUpdate();
        }*/
    }

    _getInitialState() {
        return {
            password_error: null,
            password_input_reset: Date.now(),
            open: false

        }
    }
    /*shouldComponentUpdate(nextProps, nextState) {
        return      (nextState.password_error != this.state.password_error) ||
        (nextState.password_input_reset != this.state.password_input_reset) ||
        (nextState.open != this.state.open);
    }*/

    reset() {
        this.setState(this._getInitialState())
    }

    _show() {
        if (this.state.open)
            return;
        this.setState({open:true});
        //this.refs.password_input.clear()
        //if(Apis.instance().chain_id !== WalletDb.getWallet().chain_id) {
        //    notify.error("This wallet was intended for a different block-chain; expecting " +
        //        WalletDb.getWallet().chain_id.substring(0,4).toUpperCase() + ", but got " +
        //        Apis.instance().chain_id.substring(0,4).toUpperCase())
        //        this.setState({open:false});//this.refs.unlockDialog.dismiss();// MODAL close
        //    return
        //}
    }

    _handleDismiss() {

        if(this.props.reject) this.props.reject()
                TradeBeforeSendActions.cancel()

    }

    componentDidUpdate() {
        //DEBUG console.log('... componentDidUpdate this.props.resolve', this.props.resolve)
	// console.log('modal componentDidUpdate tbs setState')
	//this._show();
  
	if (this.props.unclosable)
        {
            this._show();
            return;
        }
        else if(this.props.resolve) {
		this._show();            
		/*if (WalletDb.isLocked())
                this._show();
            else
                if (this.closing == true)
                {
                    this.closing = false;
                    this._handleDismiss();
                }
                else
                    this.props.resolve()
		*/            
		return;
        }
    }

    onSubmit(e) {
        
    }

    getExchangeRate(baseAssetId, quoteAssetId, amount){
      console.log('----In Exchange Rate method');
      console.log(baseAssetId);
      console.log(quoteAssetId);
      Promise.all([
                    Apis.instance().db_api().exec("get_limit_orders", [
                        baseAssetId,quoteAssetId, 1
                    ]),
                ])
                .then(results => {
                    let baseAmount = 0;
                    let quoteAmount = 0;
                    if (results[0][0].sell_price.base.asset_id == baseAssetId){
                        baseAmount = results[0][0].sell_price.base.amount;
                        quoteAmount = results[0][0].sell_price.quote.amount;
                    }else if (results[0][0].sell_price.quote.asset_id == baseAssetId){
                        quoteAmount = results[0][0].sell_price.base.amount;
                        baseAmount = results[0][0].sell_price.quote.amount;
                    }
                    let baseAsset = ChainStore.getAsset(baseAssetId);
                    let quoteAsset = ChainStore.getAsset(quoteAssetId);
                    let quotePrecision = utils.get_asset_precision(quoteAsset.get("precision"));
                    let basePrecision = utils.get_asset_precision(baseAsset.get("precision"));
                    let exchangeRate = (quoteAmount/quotePrecision)/(baseAmount/basePrecision);
                    console.log('----Exchange rate block');
                    console.log(exchangeRate);
                    let buyAmount = +(amount * exchangeRate);
                    // buyAmount = Math.round(buyAmount * 100) / 100;
                    // buyAmount = +((buyAmount + 0.01).toFixed(2));
                    console.log('-----Buy Amount: ',buyAmount);
                    console.log('------quote precision: ', quotePrecision);
                    console.log('-----base Amount: ',amount);
                    console.log('------base precision: ', basePrecision);
                    console.log('-----baseAsset symbol: ',baseAsset.get("symbol"));
                    console.log('------quoteAsset symbol: ', quoteAsset.get("symbol"));

// 19.98414
                    // AccountActions.trade(
                    //     this.props.account_id,

                    //     {amount: 21999999, asset_id: '1.3.0'},
                    //     'BTS',
                    //     {amount: 1000, asset_id: '1.3.120'},
                    //     'EUR'
                    // ).then( () => {
                    //     console.log('trade then');
                    //     TransactionConfirmStore.unlisten(this.onTrxIncluded);
                    //     TransactionConfirmStore.listen(this.onTrxIncluded);
                    //     TradeBeforeSendActions.close();

                    // });

                    AccountActions.trade(
                        this.props.account_id,
                        {amount: parseInt(buyAmount * quotePrecision), asset_id: quoteAsset.get("id")},
                        quoteAsset.get("symbol"),
                        {amount: parseInt(amount * basePrecision),asset_id: baseAsset.get("id")},
                        baseAsset.get("symbol")
                    ).then( () => {
                        console.log('trade then');
                        TransactionConfirmStore.unlisten(this.onTrxIncluded);
                        TransactionConfirmStore.listen(this.onTrxIncluded);
                        TradeBeforeSendActions.close();

                    });



                }).catch((error) => {
                    console.log("Error in fetching exchange rate: ", error);
                    console.log(error);
                });
    }
    
    _handleClose(e) {
        console.log('----Trade modal: On close');

        e.preventDefault();
        TradeBeforeSendActions.close();
    }

    _handleTrade(e){
        console.log('----Trade modal: On Trade');
        e.preventDefault();
        this.getExchangeRate(this.props.billed_asset, 
            this.state.selected_asset, +this.props.billed_amount);
        // TradeConfirmActions.talk();
    }

    onAssetChange(selected_asset) {
        this.setState({selected_asset: selected_asset})
    }

    onTrxIncluded(confirm_store_state) {
        console.log('----TradeBeforeSend Trx');
        if(confirm_store_state.included && confirm_store_state.broadcasted_transaction) {
            setTimeout(() => { TradeConfirmActions.talk(); }, 1000);
            TransactionConfirmStore.unlisten(this.onTrxIncluded);
            TransactionConfirmStore.reset();
            
        } else if (confirm_store_state.closed) {
            TransactionConfirmStore.unlisten(this.onTrxIncluded);
            TransactionConfirmStore.reset();
        }
    }

    render() {
        //DEBUG console.log('... U N L O C K',this.props)
        console.log('-----In Trade Modal');
        if ( !this.props.unclosable ) {return null; }

       let assets = Object.keys(this.props.assets)
       let tradeSelector = null;
       if(this.props.assets !== undefined){
        if(this.state.selected_asset === undefined){
            this.state.selected_asset = assets[0];
        } 
        tradeSelector = (<div> Choose asset to trade:  <TradeAssetSelector
                           assets={assets}
                           value={this.state.selected_asset}
                           onChange={this.onAssetChange.bind(this)}
                           /> </div>);
       }

        var unlock_what = this.props.unlock_what || counterpart.translate("wallet.title");

        // Modal overlayClose must be false pending a fix that allows us to detect
        // this event and clear the password (via this.refs.password_input.clear())
        // https://github.com/akiran/react-foundation-apps/issues/34
        return (

            <Dialog title={counterpart.translate("wallet.exchange.trade_currency")}
              actions={this.props.actions} autoScrollBodyContent={true}
              ref="tradeDialog" open={this.state.open}
              onRequestClose={this._handleDismiss.bind(this)}>

                    <div> You don't have asset which merchant wants. Would you like to buy? </div>
                    {tradeSelector}
                    
                    <div className="button-group">
                        
                       <RaisedButton  label={counterpart.translate("wallet.home.cancel")}
                                    backgroundColor = "#FF4081" primary = {true}
                                    onTouchTap={this._handleClose.bind(this)}  />
                        
                       <RaisedButton
                        label={counterpart.translate("wallet.exchange.trade")}
                        backgroundColor = "#008000" secondary={true}
                        onTouchTap={this._handleTrade.bind(this)} />
                    </div>
           </Dialog>
        )
    }
}



TradeBeforeSendModal.defaultProps = {
    modalId: "trade_before_send_modal"
}

class TradeBeforeSendModalContainer extends React.Component {
    render() {
        return (
            <AltContainer store={TradeBeforeSendStore}>
                <TradeBeforeSendModal/>
            </AltContainer>
        )
    }
}
export default TradeBeforeSendModalContainer
