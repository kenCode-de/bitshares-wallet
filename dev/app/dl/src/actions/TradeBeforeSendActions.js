import alt from "alt-instance"

class TradeBeforeSendActions {

    /** If you get resolved then the wallet is or was just unlocked.  If you get
        rejected then the wallet is still locked.

        @return nothing .. Just test for resolve() or reject()
    */
    unlock() {
        console.log('unlock trade befire send called');
        return new Promise( (resolve, reject) => {
            this.dispatch({resolve, reject})
        }).then( was_unlocked => {
            //DEBUG  console.log('... WalletUnlockStore\tmodal unlock')
            if(was_unlocked)
                WrappedTradeBeforeSendActions.change()
        })
    }

    lock() {
        console.log('lock trade befire send called');
        return new Promise( resolve => {
            this.dispatch({resolve})
        }).then( was_unlocked => {
            if(was_unlocked)
                WrappedTradeBeforeSendActions.change()
        })
    }

	talk() {
        //console.log('talk trade befire send called');
        return new Promise(  
				resolve => {
            				this.dispatch({resolve})
					}
			)
		}

    cancel() {
        this.dispatch()
    }

    change() {
        this.dispatch()
    }
    forceLock() {
	console.log('force lock trade befire send called');
        this.dispatch()
    }
    quitApp(){
       this.dispatch()
    }

}

var WrappedTradeBeforeSendActions = alt.createActions(TradeBeforeSendActions)
export default WrappedTradeBeforeSendActions
