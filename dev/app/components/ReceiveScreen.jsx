import React from "react";
import {PropTypes, Component} from "react";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import BalanceComponent from "./Utility/BalanceComponent";
import AmountSelector from "./Utility/AmountSelector";
import ChainTypes from "./Utility/ChainTypes";
import BindToChainState from "./Utility/BindToChainState";
import KeyGenComponent from  "./KeyGenComponent"

import { Router, Route, Link, IndexRoute } from 'react-router';

import bs58 from "common/base58";
import lzma from "lzma";

import QRCode from 'qrcode.react';



// Flux ReceiveScreen view
@BindToChainState()
class ReceiveScreen extends React.Component {

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
            currency: "BTS",
            asset_id: null,
            asset: null,
            mainSize: 150,
            paymentData: ""
        };

         let { query } = this.props.location;

         if (query.hasOwnProperty("contact")) {
            let current_contact = JSON.parse(query.contact);
            this.state.to_name= current_contact.name;
         }

        this.state.from_name = this.props.account.get("name");

        this.changePaymentData();
  }

  shouldComponentUpdate(nextState) {
      return (
          nextState.mainSize !== this.state.mainSize
      );
  }

  _shareReceiveScrn() {

       var sharingMsg = 'Payment ' + this.state.amount + ' ' + this.state.currency + ' for ' + this.state.from_name;

        if (window.plugins && window.plugins.socialsharing)
        {
            var seed = this.state.amount;
            var qrcontent = KeyGenComponent.getComponents(seed);

            window.plugins.socialsharing.share(
                qrcontent.privateKey,
                sharingMsg,
                null, // images
                'http://bitshares-munich.evennode.com/');
        }
        else
            console.log('shareReceiveScrn: social network sharing plugin is not available, message=', sharingMsg);
  }

  formChange(event) {
      var state = this.state
      state[event.target.id] = event.target.value
      this.setState(state);

      this.changePaymentData();
  }

  changePaymentData() {

    let payment_data = {
          "to" : this.state.from_name,
          "to_label" : this.state.from_name,
          "currency": this.state.currency,
          "memo": "",
          "line_items": [{"label": "", "quantity": 1, "price": this.formatAmount( this.state.amount )}],
          "note": "",
          "callback": ""
    }

    payment_data = JSON.stringify(payment_data);

    lzma.compress(payment_data, 1, function(result, error) {

      payment_data = bs58.encode(new Buffer(result, 'hex'));

        this.setState({paymentData: payment_data});

    }.bind(this));
 }

  setAccountName(name) {
    var state = this.state
    state.accountName = name;
    this.setState(state)
    return null;
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

    let mainDom = getDOMNode(this.refs.main);

    let mainPadding = 20;

    let mainWidth = mainDom.offsetWidth - mainPadding;


    this.setState({mainSize: mainWidth});
  }

  onAmountChanged({amount, asset}) {
      this.setState({amount, asset, error: null})
  }

  onKeyDown(e) {
    if (e.keyCode >= 48 && e.keyCode <= 57) {
    } else {
      return false;
    }
  }

  formatAmount(v) {
    // TODO: use asset's precision to format the number
    if (!v) v = "";
    if (typeof v === "number") v = v.toString();
    let value = v.trim().replace(/,/g, "");
    // value = utils.limitByPrecision(value, this.props.asset.get("precision"));
    while (value.substring(0, 2) == "00")
        value = value.substring(1);
    if (value[0] === ".") value = "0" + value;
    else if (value.length) {
        let n = Number(value)
        if (isNaN(n)) {
            value = parseFloat(value);
            if (isNaN(value)) return "";
        }
        let parts = (value + "").split('.');
        value = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        if (parts.length > 1) value += "." + parts[1];
    }
    return value;
}

  // Render ReceiveScreen view
  render() {

    let asset_types = [];
    let balance = null;

   // var qrcontent = KeyGenComponent.getComponents(this.state.amount);
   // orig #009A2D
    let value = this.formatAmount( this.state.amount );

    return (

    <main ref="main" className="no-nav content">
      <div className="receive-qr">
          <QRCode value={this.state.paymentData} fgColor="#064012" size={this.state.mainSize}/>
      </div>
      <div className="amount">
        <h2><Translate component="span" content="wallet.home.requestSpecificAmount"/>:</h2>
        <form className="receive_form" action="#">

          <input type="text" className="text-field receive-input"  value={value} onKeyDown={this.onKeyDown} id="amount" pattern="[0-9]" onChange={this.formChange.bind(this)} />
          <select className="nice-select receive-select" style={{"background": "transparent"}} name="currency" id = "currency" onChange={this.formChange.bind(this)} >
            <option value="BTS">BTS</option>
            <option value="USD">USD</option>
            <option value="CNY">CNY</option>
            <option value="EUR">EUR</option>
           </select>

        </form>
        <div className="share_block">
            <i className="share" onTouchTap={this._shareReceiveScrn.bind(this)}></i>
        </div>
      </div>
      <div className="clearfix"></div>
    </main>
    );
  }
}

export default ReceiveScreen;
