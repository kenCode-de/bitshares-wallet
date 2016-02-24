import React from "react";
import {PropTypes, Component} from "react";
import BalanceComponent from "./Utility/BalanceComponent";
import AccountActions from "actions/AccountActions";
import Translate from "react-translate-component";
import AccountSelect from "./Forms/AccountSelect";
import AccountSelector from "./AccountSelector";
import AccountStore from "stores/AccountStore";
import AmountSelector from "./Utility/AmountSelector";
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
import { createHashHistory, useBasename } from 'history';
const history = useBasename(createHashHistory)({});

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
            outOfBalance : false
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

                    FetchChainObjects(ChainStore.getAsset, [invoice.currency]).then(assets_array => {

                        let amount = invoice.line_items[0].price;

                      // TODO redirect on Send Screen with query params
                        this.setState({to_name: invoice.to, memo: invoice.memo, amount: amount, asset_id: assets_array[0].get("id")});

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
    }


    toChanged(to_name) {
        this.setState({to_name, error: null})
    }

    onToAccountChanged(to_account) {

        this.setState({to_account, error: null, to_account_valid: !!to_account})
    }

    onAmountChanged({amount, asset}) {

        let outOfBalance = false;
        if (amount && asset)
        {
          let precision = utils.get_asset_precision(asset.get("precision"));
          let requestedAmount = parseInt(amount * precision, 10);
          let availableBalance = this.getAvailableBalance();
          if (availableBalance && parseInt(availableBalance.amount * precision, 10) < requestedAmount)
          {
            outOfBalance = true;
            //console.log("$$$sendScreen._insufficient_balance"); //$$$
          }
        }
        this.setState({amount, asset, error: null,  outOfBalance: outOfBalance});
    }

    onMemoChanged(e) {
        this.setState({memo: e.target.value});
    }

    onDonateChanged(e) {
        this.setState({donate: this.refs.chkDonate.isChecked()});
    }

    onTrxIncluded(confirm_store_state) {
        if(confirm_store_state.included && confirm_store_state.broadcasted_transaction) {
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
         && this.state.amount != "0" && (this.state.asset || this.state.asset_id) && this.state.amount.length != 0
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
            this.state.donate
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

  // Render SendScreen view
  render() {

     let from_error = null;
        let from_my_account = AccountStore.isMyAccount(this.state.from_account)
        let propose = this.state.propose
        if(this.state.from_account && ! from_my_account && ! propose ) {
            from_error = <span>
                {counterpart.translate("wallet.account_not_yours")}
                {/* &nbsp;(<a onClick={this.onPropose.bind(this, true)}>{counterpart.translate("propose")}</a>) */}
            </span>;
        }

        let asset_types = [];
        let balance = null;
        if (this.state.from_account && !from_error) {
            let account_balances = this.state.from_account.get("balances").toJS();
            asset_types = Object.keys(account_balances);
            if (this.state.outOfBalance)
                balance = <span className="avalibel-label" ><Translate component="span" content="wallet.out_of_balance"/></span>;
            else if (asset_types.length > 0) {
                let current_asset_id = this.state.asset ? this.state.asset.get("id") : asset_types[0];
                balance = (<span className="avalibel-label" onTouchTap={this.availableBalanceClick.bind(this)}  ><BalanceComponent  ref="bc1" balance={account_balances[current_asset_id]}/> <Translate component="span" content="wallet.transfer_available"/></span>)
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
