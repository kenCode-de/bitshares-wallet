import React from "react";
import {PropTypes, Component} from "react";
import BalanceComponent from "./Utility/BalanceComponent";
import AccountActions from "actions/AccountActions";
import Translate from "react-translate-component";
import AccountSelect from "./Forms/AccountSelect";
import AccountSelector from "./AccountSelector";
import AccountStore from "stores/AccountStore";
import AmountSelector from "./Utility/AmountSelector";
import RewardUia from "./Utility/RewardUia";
import utils from "common/utils";
import counterpart from "counterpart";
import TransactionConfirmStore from "stores/TransactionConfirmStore";
import Immutable from "immutable";
const Checkbox = require('material-ui/lib/checkbox');
import TextField  from "./Utility/TextField";
import ChainTypes from "./Utility/ChainTypes";
import BindToChainState from "./Utility/BindToChainState";
import { Router, Route, Link, IndexRoute } from 'react-router';
import WalletDb from "stores/WalletDb";
import WalletUnlockActions from "actions/WalletUnlockActions"
import SettingsStore from "stores/SettingsStore";
import LoadingIndicator from "./LoadingIndicator";
import bs58 from "common/base58";
import lzma from "lzma";
import {FetchChainObjects} from "api/ChainStore";
import TradeBeforeSendActions from "actions/TradeBeforeSendActions"
import TradeConfirmStore from "stores/TradeConfirmStore";
import { createHashHistory, useBasename } from 'history';
const history = useBasename(createHashHistory)({});
import key from "common/key_utils";
var Aes = require('ecc/aes');

// Flux SendScreen view to to configure the application
@BindToChainState()
class SendScreen extends React.Component {

    static propTypes = {
       account: ChainTypes.ChainAccount.isRequired
    }

    static defaultProps = {
      account: "props.params.account_name"
    }

    constructor(props) {
        super(props);
        this.state =  {
            from_name: "",
            to_name: "",
            from_account: null,
            to_account: null,
            amount: "",
            loading: false,
            asset_id: null,
            asset: null,
            memo: "",
            error: null,
            propose: false,
            propose_account: "",
            to_account_valid: false,
            donate: true,
            outOfBalance : false,
            callback: ""
        };

        

         let { query, state } = this.props.location;

         if (query.hasOwnProperty("contact")) {
            let current_contact = JSON.parse(query.contact);
            this.state.to_name= current_contact.name;
         }
         if (state && state.contactname)
         {
            this.state.to_name= state.contactname;
         }
         if (state && state.transfer)
         {
            //let current_transfer = {amount: this.state.amount,  memo: this.state.memo, donate: this.state.donate};
            let transfer = state.transfer;//JSON.parse(state.transfer);
            this.state.amount = transfer.amount;
            this.state.memo = transfer.memo;
            this.state.donate = transfer.donate;

         }

         if (state && state.hasOwnProperty("payment")) {

            let payment = JSON.parse(state.payment);

            let compressed_data = bs58.decode(payment);

            try {

                lzma.decompress(compressed_data, result => {

                    let invoice = JSON.parse(result);
                    let amount = 0;
                    for(var id=0; id<invoice.line_items.length; id++){
                            amount = +amount + +invoice.line_items[id].price;
                    }
                    this.setState({to_name: invoice.to, memo: invoice.memo, amount: amount, 
                      remaining_amount : amount, actual_amount: amount,
                      billed_currency:invoice.currency, ruia:invoice.ruia});



                    FetchChainObjects(ChainStore.getAsset, [invoice.currency]).then(assets_array => {

                      // TODO redirect on Send Screen with query params

                      let uia_asset = ChainStore.getAsset(invoice.ruia);
                      let uia_asset_symbol = uia_asset.get("symbol");
                      let uia_asset_precision = uia_asset.get("precision");
                      
                      this.setState({asset_id: assets_array[0].get("id"),
                                    billed_asset_id: assets_array[0].get("id"),
                                    billed_asset_precision : assets_array[0].get("precision"),
                                    callback: invoice.callback, 
                                     ruia_symbol: uia_asset_symbol,
                                     ruia_precision: uia_asset_precision });

                        // Uncomment this line & handle error properly
                        this.getExchangeRate(invoice.ruia, assets_array[0].get("id"));

                        let asset_types = [];
                        let account_balances = this.props.account.get("balances").toJS();
                        
                        let billedBalance = ChainStore.getAccountBalance(this.props.account, assets_array[0].get("id"));
                        let basePrecision = utils.get_asset_precision(assets_array[0].get("precision"));
                        billedBalance = billedBalance / basePrecision;

                        if(!(assets_array[0].get("id") in account_balances)){
                          //memo, asset id, account balances, account id, amount
                          this.openTradePopUpWithRequiredFees(invoice.memo, 
                            assets_array[0].get("id"), 
                            account_balances, 
                            this.props.account.get("id"), amount);
                        }
                        else if((billedBalance < amount)){
                          let remainingAmount = amount - billedBalance;
                          this.openTradePopUpWithRequiredFees(invoice.memo, 
                            assets_array[0].get("id"), 
                            account_balances, 
                            this.props.account.get("id"), remainingAmount);
                        }

                    });

                });

            } catch(error) {
                console.dir(error);
                this.setState({error: error.message});
            }

         }

        this.state.from_name = this.props.account.get("name");
        this.state.from_account = this.props.account;
        this.onTrxIncluded = this.onTrxIncluded.bind(this);
        this.onTradeTrx = this.onTradeTrx.bind(this);

        // let account_balances = this.props.account.get("balances").toJS();

        // //Account balances, user account id, billed asset id, billing amount
        // TradeBeforeSendActions.talk(account_balances, this.props.account.get("id"), 
        //   "1.3.120", 0.1);
        TradeConfirmStore.listen(this.onTradeTrx);

    }

    openTradePopUpWithRequiredFees(memo, asset_id, account_balances, account_id, amount_needed){
        // var memo = 'Order: a9fdbb24-d2b7-4886-9690-bb866e576794 #sapos';
        var encryption_buffer = key.get_random_key().toBuffer();
        var local_aes_private = Aes.fromSeed( encryption_buffer );
        var hash = local_aes_private.encryptToHex( memo );
        let transfer_op_object = { "memo":{ "message": hash } }
        Apis.instance().db_api().exec("get_required_fees", [
              [[0, transfer_op_object ]], asset_id
          ]).then(results => {
              let feeAsset = ChainStore.getAsset(asset_id);
              let feeAssetPrecision = utils.get_asset_precision(feeAsset.get("precision"));
              let feeAmount = (results[0].amount / feeAssetPrecision).toFixed(feeAsset.get("precision"));
              let actual_amount = +amount_needed + +feeAmount;
              actual_amount = actual_amount.toFixed(feeAsset.get("precision"));
              //10 percent increase in original amount for margin
              actual_amount = ((+actual_amount * 0.005) + +actual_amount).toFixed(feeAsset.get("precision"));
              TradeBeforeSendActions.talk(account_balances, account_id, asset_id, actual_amount);
              
          }).catch((error) => {
              console.log("Error in fetching required fees: ", error);
              console.log(error);
          });
    }

    getExchangeRate(baseAssetId, quoteAssetId){
      this.setState({error: null, loading: true});
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
                    let rps_eq_amount = (this.state.amount/exchangeRate).toFixed(this.state.ruia_precision);
                    console.log('----Exchange rate block');
                    console.log(exchangeRate);
                    console.log(rps_eq_amount);
                    this.setState({ ruia_ex_rate : exchangeRate, error: null, loading: false, 
                                    rps_eq_amount: rps_eq_amount});
                    

                }).catch((error) => {
                    console.log("Error in fetching exchange rate: ", error);
                    console.log(error);
                });
    }

    toChanged(to_name) {
        this.setState({to_name, error: null})
    }

    
    onToAccountChanged(to_account) {

        this.setState({to_account, error: null, to_account_valid: !!to_account})
    }

    onAmountBlured({amount, asset}) {
      if (amount && asset){

          console.log('----On Amount blurred');
          let user_typed_rp = 0;
          if(this.state.reward_points){
            user_typed_rp = this.state.reward_points;
          }
          let remaining_amount = +this.state.actual_amount - ((+user_typed_rp * +this.state.ruia_ex_rate) + +amount);
          let ruia_remaining_amount = remaining_amount / this.state.ruia_ex_rate;

        this.setState({remaining_amount : remaining_amount, rps_eq_amount: ruia_remaining_amount});
      }
    }

    onRewardPointsBlured({amount}) {
      console.log('----On Reward points blurred called');
      let user_typed_amount = 0;
      if(this.state.amount){
        user_typed_amount = this.state.amount;
      }
      
      let remaining_amount = +this.state.actual_amount - ((+amount * +this.state.ruia_ex_rate) + +user_typed_amount);
      let ruia_remaining_amount = remaining_amount / this.state.ruia_ex_rate;
      console.log(remaining_amount);
      this.setState({reward_points: amount, remaining_amount : remaining_amount, 
        rps_eq_amount: ruia_remaining_amount});
      //this.getExchangeRate(sellAssetId, buyAssetId, amount);  
    }

    onRewardPointsChanged({reward_points}) {
      console.log('----On Reward points changed called');
      let user_typed_amount = 0;
      if(this.state.amount){
        user_typed_amount = this.state.amount;
      }
      
      let remaining_amount = +this.state.actual_amount - ((+reward_points * +this.state.ruia_ex_rate) + +user_typed_amount);
      let ruia_remaining_amount = remaining_amount / this.state.ruia_ex_rate;
      remaining_amount = remaining_amount.toFixed(this.state.billed_asset_precision);
      ruia_remaining_amount = ruia_remaining_amount.toFixed(this.state.ruia_precision);

      this.setState({reward_points: reward_points, remaining_amount : remaining_amount, 
        rps_eq_amount: ruia_remaining_amount});
    }

    onAmountChanged({amount, asset, asset_changed}) {
      console.log('-----On Amount Changed');
      console.log(amount);
        let outOfBalance = false;
        if (amount && asset && asset_changed == false)
        {
          let precision = utils.get_asset_precision(asset.get("precision"));
          let requestedAmount = parseInt(amount * precision, 10);
          let availableBalance = this.getAvailableBalance();

          if (availableBalance && parseInt(availableBalance.amount * precision, 10) < requestedAmount)
          {
            outOfBalance = true;
            //console.log("$$$sendScreen._insufficient_balance"); //$$$
          }
          // Code for showing remaining balance
          let user_typed_rp = 0;
          if(this.state.reward_points){
            user_typed_rp = this.state.reward_points;
          }
          let remaining_amount = +this.state.actual_amount - ((+user_typed_rp * +this.state.ruia_ex_rate) + +amount);
          remaining_amount = remaining_amount.toFixed(this.state.billed_asset_precision);
          let ruia_remaining_amount = remaining_amount / this.state.ruia_ex_rate;
          ruia_remaining_amount = ruia_remaining_amount.toFixed(this.state.ruia_precision);

          this.setState({amount, asset, error: null,  outOfBalance: outOfBalance, 
          remaining_amount : remaining_amount, rps_eq_amount: ruia_remaining_amount});
        }
        else if (amount && asset && asset_changed){
          let sellAssetId = asset.get("id");
          let buyAssetId = this.state.billed_asset_id;

          console.log('------Get excahnge rate block called');
          console.log(sellAssetId);
          console.log(buyAssetId);
          // this.getExchangeRate(sellAssetId, buyAssetId);
          // this.setState({amount, asset, error: null});

        }
        
    }

    onMemoChanged(e) {
        this.setState({memo: e.target.value});
    }

    onDonateChanged(e) {
        this.setState({donate: this.refs.chkDonate.isChecked()});
    }

    onTradeTrx(confirm_store_state) {
      console.log('-----Send Trade Trx called');
      this.setState({loading: true});      
// Change hardcoded values
// this.state.billed_asset_id
// this.state.actual_amount
      setTimeout(() => { 
          console.log('----Transfer called after few seconds');
          // // In real transaction uncomment these line
            let asset = ChainStore.getAsset(this.state.billed_asset_id);
            let precision = utils.get_asset_precision(asset.get("precision"));
            // let asset = ChainStore.getAsset('1.3.0');
            // let precision = utils.get_asset_precision(asset.get("precision"));
            Promise.all([
              // In real transaction uncomment these line
                    Apis.instance().db_api().exec("get_account_balances", 
                        [this.props.account.get("id"), [this.state.billed_asset_id] ])
                    // Apis.instance().db_api().exec("get_account_balances", 
                    //     [this.props.account.get("id"), ['1.3.0'] ])
                ])
                .then(results => {
                    console.log('----Account balances result');
                    let accountBalance = results[0][0].amount;
                    console.log(accountBalance);
                    console.log(precision);
                    console.log(this.state.amount);
                    console.log(( (accountBalance / precision) >= this.state.amount));
                    // Change hardcoded value with this.state.amount
                    if( (accountBalance / precision) >= this.state.amount){
                        // Call Transfer method
                        console.log('-----Call transfer after trade');
                        AccountActions.transfer(
                          this.state.from_account.get("id"),
                          this.state.to_account.get("id"),
                          parseInt(this.state.amount * precision, 10),
                          asset.get("id"),
                          this.state.memo,
                          this.state.propose ? this.state.propose_account : null,
                          null,
                          null,
                          null,
                          true
                            
                        ).then( () => {
                            this.setState({loading: false});
                            TransactionConfirmStore.unlisten(this.onTrxIncluded);
                            TransactionConfirmStore.listen(this.onTrxIncluded);
                        }).catch( e => {
                            this.setState({loading: false});
                            let msg = e.message ? e.message.split( '\n' )[1] : null;
                            console.log( "error: ", e, msg)
                            this.setState({error: msg})
                        } );
                    }
                    else{
                      // Pop up for Msg : Sorry you cannot pay
                      this.setState({loading: false});
                      console.log('-----Transfer error');
                      window.plugins.toast.showLongBottom('You cannot pay. You have low balance');
                    }
                    TradeConfirmStore.unlisten(this.onTradeTrx);
                    
                }).catch((error) => {
                    console.log("Error in transfer method: ", error);
                    console.log(error);
                    TradeConfirmStore.unlisten(this.onTradeTrx);
                })
       }, 35000);
      ;
    }

    onTrxIncluded(confirm_store_state) {
        console.log('-----SendScreen Trx');
        if(confirm_store_state.included && confirm_store_state.broadcasted_transaction) {
          var callback = this.state.callback + "?block=" + confirm_store_state.trx_block_num + "&trx=" + confirm_store_state.trx_id;
          var xhttp = new XMLHttpRequest();
          xhttp.open("GET", callback, true);
          xhttp.send();

              this.setState({
              from_name: "",
              to_name: "",
              from_account: null,
              to_account: null,
              amount: "",
              asset_id: null,
              asset: null,
              memo: "",
              error: null,
              propose: false,
              propose_account: "",
              callback: ""
          });
            TransactionConfirmStore.unlisten(this.onTrxIncluded);
            TransactionConfirmStore.reset();

        } else if (confirm_store_state.closed) {
            TransactionConfirmStore.unlisten(this.onTrxIncluded);
            TransactionConfirmStore.reset();
        }
    }

    onPropose(propose, e) {
        e.preventDefault()
        this.setState({ propose, propose_account: null })
    }

    onProposeAccount(propose_account) {
        this.setState({ propose_account });
    }

    contactsClick(){
      let current_transfer = {amount: this.state.amount,  memo: this.state.memo, donate: this.state.donate};
      //if (this.state.to_account)
      //  current_transfer.to_account = this.state.to_account.get("id");
      if (this.state.asset)
        current_transfer.asset = this.state.asset.get("id");
     history.pushState({transfer: JSON.stringify(current_transfer)}, 'contacts');
    }

    availableBalanceClick()
    {
        let availableBalance = this.getAvailableBalance()
        if (availableBalance)
          this.setState({amount:availableBalance.amount, asset: availableBalance.asset});


    }

    getAvailableBalance()
    {
        if (this.state.from_account && this.refs.bc1 ) {
            let account_balances = this.state.from_account.get("balances").toJS();
            let asset_types = Object.keys(account_balances);
            if (asset_types.length > 0) {
                let current_asset_id = this.state.asset ? this.state.asset.get("id") : asset_types[0];
                //let bc = React.render( <BalanceComponent ref="bc0" balance={account_balances[current_asset_id]}/>, document.getElementById('fakeContainer'))
                var rawAmount=   Number(this.refs.bc1.state.balance.get('balance'))    //Number(bc.state.balance.get('balance'));
                let asset = this.refs.bc1._reactInternalInstance._renderedComponent._instance.refs.formattedAsset.state.asset
                let rawAsset = asset;
                if( asset && asset.toJS ) asset = asset.toJS();
                let precision = utils.get_asset_precision(asset.precision);
                var displayAmount = (rawAmount / precision).toFixed(asset.precision)
                return  {amount:displayAmount, asset: rawAsset};
            }
        }
        else
          return null;
    }



    canSubmit(){
         return this.state.from_account && this.state.to_account && this.state.amount
         && this.state.amount != "0" && this.state.remaining_amount >= 0  && (this.state.asset || this.state.asset_id) && this.state.amount.length != 0
         && !this.state.error && !this.state.outOfBalance
    }


    onSubmit(e) {
        if (!this.state.to_account_valid || !this.canSubmit())
        {
          return;
        }
        e.preventDefault();

        let asset = this.state.asset || ChainStore.getAsset(this.state.asset_id);
        let precision = utils.get_asset_precision(asset.get("precision"));

        var reward_points = null;
        var reward_points_asset = null
        if(this.state.reward_points){
          reward_points_asset = this.state.ruia;
          let rp_asset = ChainStore.getAsset(reward_points_asset);
          let rp_precision = utils.get_asset_precision(rp_asset.get("precision"));
          reward_points = +this.state.reward_points * rp_precision;
        }

        //let advancedSettings = SettingsStore.getAdvancedSettings();
        this.setState({error: null, loading: true});
        //if (advancedSettings.requirePinToOpen)
        WalletUnlockActions.lock();
        //else
        //WalletDb.tryUnlock();

        //"1.2.90200" - bitshares-munich
        AccountActions.transfer(
            this.state.from_account.get("id"),
            this.state.to_account.get("id"),
            parseInt(this.state.amount * precision, 10),
            asset.get("id"),
            this.state.memo,
            this.state.propose ? this.state.propose_account : null,
            this.state.donate,
            reward_points,
            reward_points_asset
        ).then( () => {
            this.setState({loading: false});
            TransactionConfirmStore.unlisten(this.onTrxIncluded);
            TransactionConfirmStore.listen(this.onTrxIncluded);
        }).catch( e => {
            this.setState({loading: false});
            let msg = e.message ? e.message.split( '\n' )[1] : null;
            console.log( "error: ", e, msg)
            this.setState({error: msg})
        } );
    }

    onTrade(e) {
        console.log('trade called');
        this.setState({error: null, loading: true});
        let baseAsset = ChainStore.getAsset('1.3.0'); //sell
        let basePrecision = utils.get_asset_precision(baseAsset.get("precision"));
        let quoteAsset = ChainStore.getAsset('1.3.121'); //buy
        let quotePrecision = utils.get_asset_precision(quoteAsset.get("precision"));

        AccountActions.trade(
            this.state.from_account.get("id"),
            {amount: +(1 * basePrecision), asset_id: baseAsset.get("id")},
            baseAsset.get("symbol"),
            {amount: +(0.00609 * quotePrecision),asset_id: quoteAsset.get("id")},
            quoteAsset.get("symbol")
        ).then( () => {
            console.log('trade then');
        });
    }

  // Render SendScreen view
  render() {

      console.log('----Render method called');
     let from_error = null;
        let from_my_account = AccountStore.isMyAccount(this.state.from_account)
        let propose = this.state.propose;
        let { query, state } = this.props.location;   

        if(this.state.from_account && ! from_my_account && ! propose ) {
            from_error = <span>
                {counterpart.translate("wallet.account_not_yours")}
                {/* &nbsp;(<a onClick={this.onPropose.bind(this, true)}>{counterpart.translate("propose")}</a>) */}
            </span>;
        }

        let asset_types = [];
        let balance = null;
        let reward_uia = null;
        let remain_balance = null;
        let bill_amount_warning = null;

        if (this.state.from_account && !from_error) {
            let account_balances = this.state.from_account.get("balances").toJS();
            asset_types = Object.keys(account_balances);

            if (this.state.remaining_amount) {
              remain_balance = (<span> Remaining balance is {this.state.remaining_amount} {this.state.billed_currency} ({this.state.rps_eq_amount} {this.state.ruia_symbol})  </span>);
            }
            if (this.state.remaining_amount < 0) {
              bill_amount_warning = (<span style={{color: '#ff0000'}}>  Cannot send amount more than billing amount  </span>);
            }
            
            if (this.state.outOfBalance)
                balance = <span className="avalibel-label" ><Translate component="span" content="wallet.out_of_balance"/></span>;
            else if (asset_types.length > 0) {
                let current_asset_id = this.state.asset ? this.state.asset.get("id") : asset_types[0];
                balance = (<span className="avalibel-label" onTouchTap={this.availableBalanceClick.bind(this)}  ><BalanceComponent  ref="bc1" balance={account_balances[current_asset_id]}/> <Translate component="span" content="wallet.transfer_available"/></span>)
                if (state && state.hasOwnProperty("payment")) {   
                  let reward_found = false    
                  for(var i=0; i<asset_types.length; i++){    
                      if(asset_types[i] == this.state.ruia){    
                        reward_found = true;                            
                        break;    
                      }   
                    } 

				  
  
                    if(reward_found)
			{  

              		reward_uia = 	(
					<table className="full-input" style={{background: 'transparent'}}>
						<tr>
							<td>
                      					<RewardUia  
                                          onChange={this.onRewardPointsChanged.bind(this)}/>
							</td>							
						</tr>
						<tr>
							<td >
							<div className="avalibel-label-reward full-input" style={{background: 'transparent'}}>
							<span style={{background: 'transparent'}}>   
                      					<BalanceComponent  ref="bc2" balance={account_balances[this.state.ruia]}/> 
							<Translate component="span" content="wallet.transfer_available"/>
							</span>
							</div>
							</td>							
						</tr>						
					</table>
					)    
                    	}   
                    else{   

                      reward_uia = 	(
					<table className="full-input" style={{background: 'transparent'}}>
						<tr>
							<td>  
                      					<RewardUia 
                                          onChange={this.onRewardPointsChanged.bind(this)} />
							</td>							
						</tr>
						<tr>
							<td >
							<div className="avalibel-label-reward full-input" style={{background: 'transparent'}}>
							<span style={{background: 'transparent'}}>   
                      					<BalanceComponent  ref="bc2" balance={0}/> 
							<Translate component="span" content="wallet.transfer_available"/>
							</span>
							</div>
							</td>							
						</tr>						
					</table>
					)          
                    }   
                }                
            }
            else {
                balance = <Translate component="span" content="wallet.no_funds"/>;
            }
        }
        let propose_incomplete = this.state.propose && ! this.state.propose_account

        let submitButtonClass = "";

        if(from_error || propose_incomplete || !this.canSubmit())
            submitButtonClass += "disabled";

        let accountsList = Immutable.Set();
        accountsList = accountsList.add(this.state.from_account)
        let tabIndex = 1;
        let from_span = counterpart.translate("wallet.home.from") + ": " + this.state.from_name;
   return (
     <section>
     {this.state.loading ? <LoadingIndicator type="circle"/> : null}
     <main className="no-nav content">
          <form className="send-form" onSubmit={this.onSubmit.bind(this)} noValidate>
              <div className="form-row">
                <span className="bold">{from_span}</span>
              </div>
              <div className="form-row">
                  <AccountSelector label={counterpart.translate("wallet.home.to")}
                     accountName={this.state.to_name}
                     onChange={this.toChanged.bind(this)}
                     onAccountChanged={this.onToAccountChanged.bind(this)}
                     account={this.state.to_name}/>
              </div>
              <div className="form-row send-buttons">
                <a className="btn send-form-btn" onTouchTap={this.contactsClick.bind(this)}>{counterpart.translate("wallet.home.contacts")}</a>
                <a href="#" className="btn photo-btn is-disabled"></a>
                <a href="#" className="btn send-form-btn is-disabled">{counterpart.translate("wallet.clipboard")}</a>
              </div>
              <div className="form-row curr-input">
                  <AmountSelector
                      amount={this.state.amount}
                      onChange={this.onAmountChanged.bind(this)}
                      asset={asset_types.length > 0 && this.state.asset ? this.state.asset.get("id") : ( this.state.asset_id ? this.state.asset_id : asset_types[0])}
                      assets={asset_types}
                      display_balance={balance}/>
                   {balance}
              </div>

	      <div className="form-row full-input" style={{background: 'transparent'}}>
                {reward_uia}
	      </div>
              <div className="form-row">
                {bill_amount_warning}
              </div>
              <div className="form-row">
                {remain_balance}
              </div>
              <div className="form-row">
                    <span className="label bold">{counterpart.translate("wallet.home.memo") + ":"}</span>
                    <TextField
                      name="memo"
                      id="memo"
                      value={this.state.memo}
                      onChange={this.onMemoChanged.bind(this)}
                      multiLine={true} />
              </div>
              <div className="form-row dt">
                <span className="danate-checkbox">
                  <Checkbox
                    name="chkDonate"
                    labelStyle={{"font-size": "10px"}}
                    ref = "chkDonate"
                    onCheck={this.onDonateChanged.bind(this)}
                    checked={this.state.donate}/>
                </span>
                <span className="donate-label">{counterpart.translate("wallet.home.donateToDevs")}</span>
              </div>
              <button className={"btn btn-send-big upper "+ submitButtonClass} type="submit" value="Submit">
                  <Translate component="span" content="wallet.home.send"/>
              </button>
            </form>
      </main>
      </section>
    );
  }
}

export default  SendScreen;
