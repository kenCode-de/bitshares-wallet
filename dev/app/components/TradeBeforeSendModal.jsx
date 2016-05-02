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
import IntlStore from "stores/IntlStore";
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

    onTrade(baseAssetId, quoteAssetId, amount){
        // seller,amount_to_sell,symbol_to_sell,min_to_receive,symbol_to_receive
        // seller, amount in BTS, BTS(selected_asset), amount in USD, USD

        console.log(this.props.exchange_rate);
        let buyAmount = +(amount / this.props.exchange_rate);

        let baseAsset = ChainStore.getAsset(baseAssetId);
        let quoteAsset = ChainStore.getAsset(quoteAssetId);
        let quotePrecision = utils.get_asset_precision(quoteAsset.get("precision"));
        let basePrecision = utils.get_asset_precision(baseAsset.get("precision"));

        console.log('-----Call trade method');
        Promise.all([
              // In real transaction uncomment these line
                    Apis.instance().db_api().exec("get_account_balances", 
                        [this.props.account_id, [baseAssetId] ])
                    
                ])
                .then(results => {
                    console.log('----Account balances result');
                    let billedBalance = results[0][0].amount;
                    billedBalance = billedBalance / basePrecision;

                    console.log('-----Billed Balance', billedBalance);
                    console.log(buyAmount)
                    if(billedBalance < buyAmount){
                        console.log('----Amount is less');
                        window.plugins.toast.showLongBottom('You do not have enough balance to trade. Please select other backup asset');    
                    }
                    else{
                        console.log('----Trade initiate')
                        AccountActions.trade(
                            this.props.account_id,
                            {amount: parseInt(buyAmount * basePrecision), asset_id: baseAsset.get("id")},
                            baseAsset.get("symbol"),
                            {amount: parseInt(amount * quotePrecision),asset_id: quoteAsset.get("id")},
                            quoteAsset.get("symbol")
                        ).then( () => {
                            console.log('trade then');
                            TransactionConfirmStore.unlisten(this.onTrxIncluded);
                            TransactionConfirmStore.listen(this.onTrxIncluded);
                            TradeBeforeSendActions.close();

                        });
                    }
                    
                    
                }).catch((error) => {
                    console.log("Error in transfer method: ", error);
                    console.log(error);
                    
                })


        

    }
    
    _handleClose(e) {
        console.log('----Trade modal: On close');

        e.preventDefault();
        TradeBeforeSendActions.close();
    }

    _handleTrade(e){
        console.log('----Trade modal: On Trade');
        e.preventDefault();
        let selected_asset = IntlStore.getAsset();
        console.log('-----Exchange rate', this.props.exchange_rate);
        if(selected_asset != undefined && selected_asset != "false" && 
            this.props.exchange_rate != -1){
            console.log('Back up asset is selected');
            this.onTrade(selected_asset, 
                this.props.billed_asset, +this.props.billed_amount);
        }
        else if(this.props.exchange_rate == -1){
            console.log('Exchange rate is not available');
            window.plugins.toast.showLongBottom('Exchange rate is not available. Please select other backup asset');    
        }
        else{
            console.log('Back up asset not selected');
            window.plugins.toast.showLongBottom('Back up asset is not selected in settings. Please select first');
        }
    }

    onAssetChange(selected_asset) {
        this.setState({selected_asset: selected_asset})
    }

    onTrxIncluded(confirm_store_state) {
        if(confirm_store_state.included && confirm_store_state.trx_id != null) {
            console.log('----TradeBeforeSend Trx');    
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
        let selected_asset = IntlStore.getAsset();
        let exchangeRateSpan = null;
        if(selected_asset != undefined && selected_asset != "false" &&
            this.props.exchange_rate != -1){
            let baseAsset = ChainStore.getAsset(selected_asset);
            let quoteAsset = ChainStore.getAsset(this.props.billed_asset);
            let baseAssetSymbol = baseAsset.get("symbol");
            let quoteAssetSymbol = quoteAsset.get("symbol");
        
            exchangeRateSpan = (<span >  1 {baseAssetSymbol} = {this.props.exchange_rate.toFixed(quoteAsset.get("precision")) } {quoteAssetSymbol} </span>);
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

                    <div className="trade-info"> {counterpart.translate("wallet.exchange.trade_msg")} </div>
                    <div className="trade-info"> {counterpart.translate("wallet.exchange.price")} {exchangeRateSpan} </div>
                    <div className="trade-modal-btn">
                        <div style={{float: 'left'}}>
                        <RaisedButton  label={counterpart.translate("wallet.home.cancel")}
                                         backgroundColor = "#FF4081" primary = {true}
                                         onTouchTap={this._handleClose.bind(this)}  />
                        </div>
                        <div className="button-group" style={{float: 'right'}}>
                            
                           <RaisedButton
                            label={counterpart.translate("wallet.exchange.trade")}
                            backgroundColor = "#008000" secondary={true}
                            onTouchTap={this._handleTrade.bind(this)} />
                        </div>
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
