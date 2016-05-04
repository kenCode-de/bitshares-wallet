import React, {Component} from "react"
import {FormattedDate} from "react-intl"
import BrainkeyInput from "./BrainkeyInput"
import Translate from "react-translate-component"
import WalletActions from "actions/WalletActions"
import WalletDb from "stores/WalletDb"
import hash from "common/hash"
import cname from "classnames"


export default class BackupBrainkey extends Component {

    constructor() {
        super()
        this.state = this._getInitialState()
    }

    _getInitialState() {
        return {
            password: null,
            brainkey: null,
            invalid_password: false,
            verify: false
        }
    }

    componentWillMount()
    {
        this.setState({password:this.props.pin});
        var brainkey = WalletDb.getBrainKey();
        this.setState({brainkey: brainkey});
    }

    render() {
        var content
        var brainkey = WalletDb.getBrainKey();
        var brainkey_backup_date = WalletDb.getWallet().brainkey_backup_date
        var brainkey_backup_time = brainkey_backup_date ?
            <h3><Translate content="wallet.verified" /> <FormattedDate value={brainkey_backup_date}/></h3>: null

        var sha1 = hash.sha1(this.state.brainkey).toString('hex').substring(0,4)
        content = <div>
            <h3><Translate content="wallet.wallet_brainkey" /></h3>
            <div className="card"><div className="card-content">
                <h5>{this.state.brainkey}</h5></div></div>
            <br/>
            <pre className="no-overflow">{sha1} * Check Digits</pre>
            <br/>
            {brainkey_backup_time}
            <br/>
        </div>


        return <div className="grid-block vertical" style={{overflowY: 'hidden'}}>
            <div class="grid-container">
                <div className="grid-content no-overflow">
                    {content}
                </div>
            </div>
        </div>
    }
}