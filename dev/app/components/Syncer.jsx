//import React, {Component} from "react/addons";
//let Perf = React.addons.Perf;

import React from 'react'
//import cname from "classnames"


import AltContainer from "alt/AltContainer"
import Translate from "react-translate-component";
import BindToChainState from "./Utility/BindToChainState";
import ChainTypes from "./Utility/ChainTypes";
import CachedPropertyStore from "stores/CachedPropertyStore"
import CachedPropertyActions from "actions/CachedPropertyActions"
import BlockchainStore from "stores/BlockchainStore";
import ChainStore from "api/ChainStore"
import WalletDb from "stores/WalletDb";
import TimeAgo from "./Utility/TimeAgo";
//import Icon from "../Icon/Icon";
//import ReactTooltip from "react-tooltip"

@BindToChainState({keep_updating: true})
class Footer extends React.Component {

    static propTypes = {
        dynGlobalObject: ChainTypes.ChainObject.isRequired,
        synced: React.PropTypes.bool.isRequired
    }

    static defaultProps = {
        dynGlobalObject: "2.1.0"
    }

    static contextTypes = {
        router: React.PropTypes.func.isRequired
    }

    constructor(props) {
        super(props);
        this.state = {perf: false};
    }

    shouldComponentUpdate(nextProps, nextState) {
        return nextProps.dynGlobalObject !== this.props.dynGlobalObject ||
               nextProps.backup_recommended !== this.props.backup_recommended ||
               nextProps.rpc_connection_status !== this.props.rpc_connection_status ||
               nextProps.synced !== this.props.synced;
    }

    render() {

        let block_height = this.props.dynGlobalObject.get("head_block_number");
        let block_time = this.props.dynGlobalObject.get("time") + "+00:00";
        // console.log("block_time", block_time)
        let bt = (new Date(block_time).getTime() + ChainStore.getEstimatedChainTimeOffset()) / 1000;
        let now = new Date().getTime() / 1000;
        let version_match = APP_VERSION.match(/2\.0\.(\d\w+)/);
        let version = version_match ? `.${version_match[1]}` : ` ${APP_VERSION}`;

        let blockEl =  block_height ? <span ><span style={{float:"left"}}>block #</span>{block_height} </span> : null
        let syncEl = this.props.synced ? <a href="#"><i className="check"></i></a>:
            this.props.rpc_connection_status === "closed" ? <span>No Blockchain connection</span>:
            <a href="#"><i className="sync"></i></a>
        return <span>{syncEl} {blockEl}</span>;

    }
}

class AltFooter extends React.Component {

    render()
    {
        var wallet = WalletDb.getWallet()
        return <AltContainer
            stores={[CachedPropertyStore, BlockchainStore, WalletDb]}
            inject ={{
                backup_recommended: ()=>
                    (wallet && ( ! wallet.backup_date || CachedPropertyStore.get("backup_recommended"))),
                rpc_connection_status: ()=> BlockchainStore.getState().rpc_connection_status
                // Disable notice for separate brainkey backup for now to keep things simple.  The binary wallet backup includes the brainkey...
                // backup_brainkey_recommended: ()=> {
                //     var wallet = WalletDb.getWallet()
                //     if( ! wallet ) return undefined
                //     return wallet.brainkey_sequence !== 0 && wallet.brainkey_backup_date == null
                // }
            }}
            ><Footer {...this.props}/>
        </AltContainer>
    }
}

export default AltFooter;
