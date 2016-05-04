import React from 'react'
import cname from "classnames"

import PasswordInput from "./Forms/PasswordInput"
import notify from "actions/NotificationActions"
import Translate from "react-translate-component";
import counterpart from "counterpart";

import AltContainer from "alt/AltContainer"
import WalletDb from "stores/WalletDb"
import WalletUnlockStore from "stores/WalletUnlockStore"
import SessionActions from "actions/SessionActions"
import WalletUnlockActions from "actions/WalletUnlockActions"
import Apis from "rpc_api/ApiInstances"
const Dialog = require('material-ui/lib/dialog');
const RaisedButton = require('material-ui/lib/raised-button');
import If from "./If";

import SettingsStore from "stores/SettingsStore";

import { createHashHistory, useBasename } from 'history';
const history = useBasename(createHashHistory)({});


class WalletUnlockModal extends React.Component {

    constructor() {
        super()
        this.state = this._getInitialState()
        this.onPasswordEnter = this.onPasswordEnter.bind(this)
        this.pin_attempts = 0;
    }

    componentWillReceiveProps(next_props) {
        /*if(next_props.unclosable !== this.props.unclosable) {
            this.forceUpdate();
        }*/
    }

    _getInitialState() {
        return {
            password_error: null,
            password_input_reset: Date.now(),
            open: false

        }
    }
    /*shouldComponentUpdate(nextProps, nextState) {
        return      (nextState.password_error != this.state.password_error) ||
        (nextState.password_input_reset != this.state.password_input_reset) ||
        (nextState.open != this.state.open);
    }*/

    reset() {
        this.setState(this._getInitialState())
    }

    _show() {
        if (this.state.open)
            return;
        this.setState({open:true});
        //this.refs.password_input.clear()
        if(Apis.instance().chain_id !== WalletDb.getWallet().chain_id) {
            notify.error("This wallet was intended for a different block-chain; expecting " +
                WalletDb.getWallet().chain_id.substring(0,4).toUpperCase() + ", but got " +
                Apis.instance().chain_id.substring(0,4).toUpperCase())
                this.setState({open:false});//this.refs.unlockDialog.dismiss();// MODAL close
            return
        }
    }

    _handleDismiss() {

        if(this.props.reject) this.props.reject()
                WalletUnlockActions.cancel()

    }

    componentDidUpdate() {
        //DEBUG console.log('... componentDidUpdate this.props.resolve', this.props.resolve)
        if (this.props.unclosable)
        {
            this._show();
            return;
        }
        else if(this.props.resolve) {
            if (WalletDb.isLocked())
                this._show();
            else
                if (this.closing == true)
                {
                    this.closing = false;
                    this._handleDismiss();
                }
                else
                    this.props.resolve()
            return;
        }
    }

    onPasswordEnter(e) {
        //attepmts count here
        e.preventDefault()
        var password = this.refs.password_input.state.value;
        this.setState({password_error: null})
        WalletDb.validatePassword(
            password || "",
            true //unlock
        )
        if (WalletDb.isLocked()) {
            this.pin_attempts++;
            this.setState({password_error: true})
            if (this.pin_attempts >= 3)
            { // locking for 15 min
                var unlockTime = new Date().getTime() + 15*60000;
                SettingsStore.changeSetting({setting: "walletUnlockTime", value: unlockTime });
                console.log("Invalid pin was entered 3 times, locking for 15 minutes until ", new Date(unlockTime))
                WalletUnlockActions.quitApp();
            }
            return false
        }
        else {
            this.pin_attempts = 0;
            SettingsStore.changeSetting({setting: "walletUnlockTime", value: null});
            //SettingsStore.changeSetting({setting: "currentAction", value: btoa(password) });
            SettingsStore.rememberWalletPassword(password);
            this.refs.password_input.clear()
            this.setState({open:false});
            //if (!this.props.unclosable)
            //    this.props.resolve()
            SessionActions.onUnlock()
            WalletUnlockActions.change()
            this.setState({password_input_reset: Date.now(), password_error: false})
        }
        return false
    }
    _handleClose() {
        if (!this.props.unclosable)
        {
            WalletDb.tryUnlock();
            this.setState({open:false});
            this.closing = true;

        }
       // history.pushState(null, '/');
    }

    render() {
        //DEBUG console.log('... U N L O C K',this.props)
        var unlock_what = this.props.unlock_what || counterpart.translate("wallet.title");

        // Modal overlayClose must be false pending a fix that allows us to detect
        // this event and clear the password (via this.refs.password_input.clear())
        // https://github.com/akiran/react-foundation-apps/issues/34
        return (

            <Dialog title={counterpart.translate("wallet.unlock_wallet")}
              actions={this.props.actions} autoScrollBodyContent={true}
              ref="unlockDialog" open={this.state.open}
              onRequestClose={this._handleDismiss.bind(this)}>

                <form onSubmit={this.onPasswordEnter} noValidate>
                    <PasswordInput ref="password_input"
                        onEnter={this.onPasswordEnter.bind(this)}
                        key={this.state.password_input_reset}
                        wrongPassword={this.state.password_error}/>
                    <div className="button-group">
                        <If condition={!this.props.unclosable}>
                           <RaisedButton  label={counterpart.translate("wallet.home.cancel")}
                                        backgroundColor = "#FF4081" primary = {true}
                                        onTouchTap={this._handleClose.bind(this)}  />
                        </If>
                       <RaisedButton
                        label={counterpart.translate("wallet.unlock")}
                        backgroundColor = "#008000" secondary={true}
                        type="submit" />
                    </div>
                </form>
           </Dialog>
        )
    }
}




WalletUnlockModal.defaultProps = {
    modalId: "unlock_wallet_modal2"
}

class WalletUnlockModalContainer extends React.Component {
    render() {
        return (
            <AltContainer store={WalletUnlockStore}>
                <WalletUnlockModal/>
            </AltContainer>
        )
    }
}
export default WalletUnlockModalContainer
