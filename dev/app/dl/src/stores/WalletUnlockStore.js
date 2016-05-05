import alt from "alt-instance"
import WalletUnlockActions from "actions/WalletUnlockActions"
import WalletDb from "stores/WalletDb"
import SettingsStore from "stores/SettingsStore"

import { createHashHistory, useBasename } from 'history';
const history = useBasename(createHashHistory)({});

class WalletUnlockStore {

    constructor() {
        this.bindActions(WalletUnlockActions)
        this.state = {locked: true, unclosable:false}
    }

    onUnlock({resolve, reject}) {
        //DEBUG console.log('... onUnlock setState', WalletDb.isLocked())
        if( ! WalletDb.isLocked()) {
      //  if(true) { // TODO for test
            resolve()
            return
        }
        this.setState({resolve, reject, locked: WalletDb.isLocked()})
    }

    onForceLock(){
        //SettingsStore.changeSetting({setting: "currentAction", value: "" });
        SettingsStore.rememberWalletPassword("");
        WalletDb.onLock()
        this.setState({unclosable:true});
    }


    onLock({resolve}) {
        //DEBUG console.log('... WalletUnlockStore\tprogramatic lock', WalletDb.isLocked())
        if(WalletDb.isLocked()) {
            resolve()
            return
        }
        WalletDb.onLock()
        resolve()
        this.setState({resolve:null, reject:null, locked: WalletDb.isLocked()})
        //this.setState({locked: WalletDb.isLocked()})
    }

    onCancel() {
        //this.state.reject();
        this.setState({resolve:null, reject:null});
    }

    onChange() {
        var locked = WalletDb.isLocked();
        this.setState({locked: locked, unclosable: locked});
    }

    onQuitApp(){
        WalletDb.onLock();
        //SettingsStore.changeSetting({setting: "currentAction", value: "" });
        SettingsStore.rememberWalletPassword("");
        if(navigator.app){
                navigator.app.exitApp();
            }
            else if(navigator.device){
                navigator.device.exitApp();
            }
            else
            {
                console.log('No device detected, redirecting to homepage instead of quit app');
                history.pushState(null, '/');
            }
    }
}

export default alt.createStore(WalletUnlockStore, 'WalletUnlockStore')
