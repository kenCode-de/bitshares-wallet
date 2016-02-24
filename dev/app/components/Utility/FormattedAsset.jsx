import React from "react";
import utils from "common/utils";
import {PropTypes} from "react";
import {Link} from "react-router";
import ChainTypes from "./ChainTypes";
import BindToChainState from "./BindToChainState";
//import ValueComponent from "./EquivalentValueComponent";

/**
 *  Given an amount and an asset, render it with proper precision
 *
 *  Expected Properties:
 *     asset:  asset id, which will be fetched from the
 *     amount: the ammount of asset
 *
 */

@BindToChainState({keep_updating: true})
class FormattedAsset extends React.Component {

    static propTypes = {
          amount: PropTypes.number.isRequired,
          asset: ChainTypes.ChainAsset.isRequired,
          exact_amount: PropTypes.bool,
          decimalOffset: PropTypes.number,
          color: PropTypes.string,
          hide_asset: PropTypes.bool,
          hide_amount: PropTypes.bool
    }

    static defaultProps = {
        decimalOffset: 0,
        amount: 0,
        asset: "",
        hide_asset: false,
        hide_amount: false
        //nested: false // prevents recursion
    }

    constructor(props) {
        super(props);
     //   this.state = {asset: this.props.asset}
    }


    render() {

       let {amount, decimalOffset, color, asset, hide_asset, hide_amount, display_sign, className} = this.props;

        if( asset && asset.toJS ) asset = asset.toJS();

        let colorClass = color ? "facolor-" + color : "";

        let precision = utils.get_asset_precision(asset.precision);

        let decimals = Math.max(0, asset.precision - decimalOffset);

        if (hide_amount) {
            colorClass += " no-amount";
        }
        if (className)
        {
          if (colorClass.length != 0)
            colorClass +=" ";
           colorClass += className;
        }
        let displayAmount = (this.props.exact_amount ? amount : amount / precision).toFixed(decimals);
        let sign = display_sign? amount>0 ? '+': "": ""

        return (
                <span className={colorClass}  >
                {sign}
                {!hide_amount ?
                   <span className="amount_span">{displayAmount}</span>
                : null}
                {hide_asset ? null : <span className="currency">{"\u00a0" + asset.symbol}</span>}
                </span>

        );
    }
}

export default FormattedAsset;

