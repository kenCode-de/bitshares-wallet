import React from "react";
import Translate from "react-translate-component";
import ChainStore from "api/ChainStore";
import ChainTypes from "./ChainTypes";
import BindToChainState from "./BindToChainState";
import FormattedAsset from "./FormattedAsset";
import counterpart from "counterpart";
// import utils from "common/utils";
import TextField  from "./TextField";

@BindToChainState()
class AssetOption extends React.Component {

    static propTypes = {
        asset: ChainTypes.ChainObject,
        asset_id: React.PropTypes.string
    }

    render() {

        if(this.props.asset_option == "-1"){
            return (<option value="false">Choose Asset</option>);
        }
        else{
            let symbol = this.props.asset ? this.props.asset.get("symbol") : this.props.asset_id;
            return (<option value={this.props.asset_id}>{symbol}</option>);
        }
        
    }
}

@BindToChainState()
class TradeAssetSelector extends React.Component {

    static propTypes = {
        value: React.PropTypes.string, // asset id
        assets: React.PropTypes.array, // a translation key for the label
        onChange: React.PropTypes.func
    }

    constructor(props) {
        super(props)
    }

    onChange(event) {
        this.props.onChange(event.target.value);
    }

    render() {
        
        var options = [];
        options = this.props.assets.map(function (value) {
            return <AssetOption key={value} asset={value} asset_id={value} />
        });
        options.splice(0, 0, <AssetOption asset_option={"-1"} />);
        

        return (
            <select value={this.props.value} className="nice-select" style={{"font-weight": "bold"}} onChange={this.onChange.bind(this)}>
                {options}
            </select>
        )
    }
}


export default TradeAssetSelector;
