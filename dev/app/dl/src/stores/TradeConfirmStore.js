import alt from "alt-instance"
import TradeConfirmActions from "actions/TradeConfirmActions"
import WalletDb from "stores/WalletDb"
import SettingsStore from "stores/SettingsStore"

import { createHashHistory, useBasename } from 'history';
const history = useBasename(createHashHistory)({});

class TradeConfirmStore {

    constructor() {
        this.bindActions(TradeConfirmActions)
        this.state = {locked: true, unclosable:false, trade_asset: false}
	console.log('store constructor tbs setState', WalletDb.isLocked())
    }

    onUnlock({resolve, reject}) {
        console.log('store onUnlock tbs setState', WalletDb.isLocked());
	//this.setState({open:true});
        if( ! WalletDb.isLocked()) {
      //  if(true) { // TODO for test
            resolve()
            return
        }
        this.setState({resolve, reject, locked: WalletDb.isLocked()})
    }

    onForceLock(){
	console.log('store onForce lock tbs setState', WalletDb.isLocked())
        //SettingsStore.changeSetting({setting: "currentAction", value: "" });
        SettingsStore.rememberWalletPassword("");
        WalletDb.onLock()
        this.setState({unclosable:true});
    }


    onLock({resolve}) {
        //DEBUG console.log('... WalletUnlockStore\tprogramatic lock', WalletDb.isLocked())
	console.log('store onlock tbs setState', WalletDb.isLocked())
        if(WalletDb.isLocked()) {
            resolve()
            return
        }
        WalletDb.onLock()
        resolve()
        this.setState({resolve:null, reject:null, locked: WalletDb.isLocked()})
        //this.setState({locked: WalletDb.isLocked()})
    }

	onTalk({resolve}) {
        //DEBUG console.log('... WalletUnlockStore\tprogramatic lock', WalletDb.isLocked())
	console.log('------Trade Confirm Store talk called ');
        resolve();
	//return
	   this.setState({trade_asset: true});
    }

    onClose() {
        //console.log("-- TransactionConfirmStore.onClose -->", state);
        this.setState({unclosable:false });
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

export default alt.createStore(TradeConfirmStore, 'TradeConfirmStore')
