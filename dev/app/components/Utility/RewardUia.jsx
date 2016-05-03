import React from "react";
import Translate from "react-translate-component";
import ChainStore from "api/ChainStore";
import ChainTypes from "./ChainTypes";
import BindToChainState from "./BindToChainState";
import FormattedAsset from "./FormattedAsset";
import counterpart from "counterpart";
//import utils from "common/utils";
import TextField  from "./TextField";

@BindToChainState()
class RewardUia extends React.Component {

    static propTypes = {
//        label: React.PropTypes.string, // a translation key for the label
        //asset: ChainTypes.ChainAsset.isRequired, // selected asset by default
        //assets: React.PropTypes.array,
        //amount: React.PropTypes.string,
        //onChange: React.PropTypes.func.isRequired,
        //display_balance: React.PropTypes.object
    };

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

    _onChange(event) {

        let reward_points = event.target.value;
        // this.setState({reward_points})
        this.props.onChange({reward_points: reward_points})
    }

    _onBlur(event) {
        let amount = event.target.value;
        this.props.onBlur({amount: amount})
    }

    onKeyDown(e) {
        
        if (e.keyCode >= 48 && e.keyCode <= 57) {
        } else {
          return false;
        }
    }

    render() {

        //let value = this.formatAmount(this.props.amount);

        return (
            <div>
            <span className="label-amount bold text-wrap">{counterpart.translate("wallet.home.reward_points") + ": "}</span>

                <input onChange={this._onChange.bind(this)}  
                   onBlur={this._onBlur.bind(this)}
                   onKeyDown={this.onKeyDown}  
                   type="text" pattern="[0-9]" 
                   className="text-field input-amount-rewards"></input>
            </div>
            
        );
    }

}

export default RewardUia;
