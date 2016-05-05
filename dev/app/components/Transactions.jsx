import React from "react";
import {PropTypes, Component} from "react";

import Translate from "react-translate-component";
import counterpart from "counterpart";
import RecentTransactions from "./RecentTransactions";
import BindToChainState from "./Utility/BindToChainState";
import ChainTypes from "./Utility/ChainTypes";
import Immutable from "immutable";
import If from "./If";

// Flux Transactions view to display the list of transactions
@BindToChainState({keep_updating: true})
class Transactions extends React.Component{

  static propTypes = {
      account: ChainTypes.ChainAccount.isRequired
  }

  constructor(props) {
    super(props);
    this.state = {show: true}
  }

  /*shouldComponentUpdate(nextProps) {
      return this.props.account !== nextProps.account;
  }*/

  _handleToogle() {

      let show = this.state.show;
      this.setState({ show: !show });
      //console.log('_handleToogle() , show=', show)
  }

  render() {

    let account = this.props.account;
    if (!account) {
        return null;
    }

    let expand_class = "expanded";

    if (this.state.show === true) {
      expand_class = "expand";
    }

    return (
      <section className="transactions">
        <div className="section-header transactions"> 
          <h2 className="toogle-header"><i onClick={this._handleToogle.bind(this)} className={expand_class}></i><span>{counterpart.translate("wallet.home.transactions")}</span></h2>
        </div>
            <If condition={this.state.show}>
            <div className="balances__content toogle-panel">
              <ul className="balances">
                <RecentTransactions accountsList={Immutable.fromJS([account.get("id")])}
                            compactView={false}   showMore={true}/>
              </ul>
            </div>
            </If>
      </section>
    );
  }
};


export default  Transactions;