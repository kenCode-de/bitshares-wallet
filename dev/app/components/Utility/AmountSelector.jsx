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
class AssetOption extends React.Component {

    static propTypes = {
        asset: ChainTypes.ChainObject,
        asset_id: React.PropTypes.string
    }

    render() {
        let symbol = this.props.asset ? this.props.asset.get("symbol") : this.props.asset_id;
        return (<option value={this.props.asset_id}>{symbol}</option>);
    }
}

class AssetSelector extends React.Component {

    static propTypes = {
        value: React.PropTypes.string, // asset id
        assets: React.PropTypes.array, // a translation key for the label
        onChange: React.PropTypes.func
    }

    constructor(props) {
        super(props)
    }

    onChange(event) {
        this.props.onChange(ChainStore.getAsset(event.target.value))
    }

    render() {

        var options = this.props.assets.map(function (value) {
            return <AssetOption key={value} asset={value} asset_id={value}/>
        });

        return (
            <select value={this.props.value} className="nice-select" style={{"font-weight": "bold"}} onChange={this.onChange.bind(this)}>
                {options}
            </select>
        )
    }
}

@BindToChainState()
class AmountSelector extends React.Component {

    static propTypes = {
//        label: React.PropTypes.string, // a translation key for the label
        asset: ChainTypes.ChainAsset.isRequired, // selected asset by default
        assets: React.PropTypes.array,
        amount: React.PropTypes.string,
        onChange: React.PropTypes.func.isRequired,
        display_balance: React.PropTypes.object
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

        let amount = event.target.value
        this.setState({amount})
        this.props.onChange({amount: amount, asset: this.props.asset})
    }

    onAssetChange(selected_asset) {
        this.setState({selected_asset})
        this.props.onChange({amount: this.props.amount, asset: selected_asset})
    }

    onKeyDown(e) {
        
        if (e.keyCode >= 48 && e.keyCode <= 57) {
        } else {
          return false;
        }
    }

    render() {

        let value = this.formatAmount(this.props.amount);

        return (
                <div>
                   <span className="label-amount bold">{counterpart.translate("wallet.home.amount") + ": "} </span>
                   <input onChange={this._onChange.bind(this)}  onKeyDown={this.onKeyDown} value={value}  type="text" pattern="[0-9]" className="text-field input-amount"></input>
                    <AssetSelector
                           assets={this.props.assets}
                           value={this.props.asset.get("id")}
                           onChange={this.onAssetChange.bind(this)}/>
                </div>

        )
    }

}

export default AmountSelector;
