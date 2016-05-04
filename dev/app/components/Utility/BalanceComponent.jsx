import React from "react";
import FormattedAsset from "./FormattedAsset";
import ChainTypes from "./ChainTypes";
import BindToChainState from "./BindToChainState";

/**
 *  Given a balance_object, displays it in a pretty way
 *
 *  Expects one property, 'balance' which should be a balance_object id
 */

@BindToChainState({keep_updating: true})
class BalanceComponent extends React.Component {


    /*constructor() {
        super();
        this.exportPublicMethods({getAmount: this.getAmount.bind(this)});
    }*/

    static propTypes = {
        balance: ChainTypes.ChainObject.isRequired
    }

    getAmount() {
        let amount = Number(this.props.balance.get('balance'));
        return amount;
    }

    componentWillMount()
    {
        /*let amount = Number(this.props.balance.get('balance'));
        let type = this.props.balance.get('asset_type');
        var formatedAsset = <FormattedAsset amount={amount} asset={type}/>
        this.setState({formatedAsset: formatedAsset});*/


    }

    render() {

        //let formatedAsset = this.state.formatedAsset;
        let amount = Number(this.props.balance.get('balance'));
        let type = this.props.balance.get('asset_type');
        var formatedAsset = <FormattedAsset ref="formattedAsset" amount={amount} asset={type}/>
        return formatedAsset;
    }
}

export default BalanceComponent;
