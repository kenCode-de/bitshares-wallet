import React from "react";
import {PropTypes, Component} from "react";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import ChainTypes from "./Utility/ChainTypes";
import BindToChainState from "./Utility/BindToChainState";
import BalanceComponent from "./Utility/BalanceComponent";
//import {BalanceValueComponent} from "./Utility/EquivalentValueComponent";
import Immutable from "immutable";
import If from "./If"

// A component for displaying the wallet balance
@BindToChainState({keep_updating: true})
class Balances extends React.Component {

  static propTypes = {
      account: ChainTypes.ChainAccount.isRequired
  }

  constructor(props)
  {
     super(props)
     this.state = {show: true}
  }

  /*shouldComponentUpdate(nextProps) {
      return this.props.account !== nextProps.account
  }*/

  _handleToogle() {

      let show = this.state.show;
      this.setState({ show: !show });
  }

  render() {

        if (!this.props.account) {
            return null;
        }

        let name = null;
        let balances = null;
        let isMyAccount = false;
        if( this.props.account )
        {
           name = this.props.account.get('name');
           let abal = this.props.account.get('balances')
           if( abal )
           {
              balances = abal.map( x => <li key={x}><BalanceComponent balance={x}/></li>).toArray();
           }
         //  isMyAccount = AccountStore.isMyAccount(this.props.account);
        }

    let expand_class = "expanded";

    if (this.state.show === true) {
      expand_class = "expand";
    }
    let balancesL = null, balancesR = null;
    if (balances && balances.length >0)
    {
      let slicer = Math.ceil(balances.length/2);
      balancesL = balances.slice(0, slicer);
      balancesR = balances.slice(slicer);
    }

    return (
      <section className="balances">
        <div className="section-header active">
          <h2 className="toogle-header"><i onClick={this._handleToogle.bind(this)} className={expand_class}></i><Translate content="wallet.home.balances" /></h2>
        </div>
            <If condition={this.state.show}>
            <div className="balances__content toogle-panel">
              <div className="balances__content-left">
                <ul className="balances">
                    {balancesL}
                </ul>
              </div>
              <div className="balances__content-right">
                <ul className="balances">
                    {balancesR}
                </ul>
              </div>
            </div>
            </If>
      </section>
    );
  }
};

export default Balances;
