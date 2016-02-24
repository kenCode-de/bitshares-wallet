import React, {PropTypes, Component} from "react"
import {FormattedDate} from "react-intl"
import {Link} from "react-router";
import Inspector from "react-json-inspector";
import connectToStores from "alt/utils/connectToStores"
import WalletUnlockActions from "actions/WalletUnlockActions"
import WalletActions from "actions/WalletActions"
import CachedPropertyActions from "actions/CachedPropertyActions"
import WalletManagerStore from "stores/WalletManagerStore"
import BackupStore from "stores/BackupStore"
import WalletDb from "stores/WalletDb"
import BackupActions, {backup, restore, decryptWalletBackup} from "actions/BackupActions"
import notify from "actions/NotificationActions"
import cname from "classnames"
import hash from "common/hash"
import Translate from "react-translate-component";
import chain_config from "chain/config";
import TextField  from "./Utility/TextField";
const RaisedButton = require('material-ui/lib/raised-button');
import IntlStore from "stores/IntlStore";
import SettingsStore from "stores/SettingsStore";
import { createHashHistory, useBasename } from 'history';
import counterpart from "counterpart";
import PasswordInput from "./Forms/PasswordInput";
import {saveAs} from "common/filesaver.js"


const history = useBasename(createHashHistory)({})

class BackupBaseComponent extends Component {

    static getStores() {
        return [WalletManagerStore, BackupStore]
    }

    static getPropsFromStores() {
        var wallet = WalletManagerStore.getState()
        var backup = BackupStore.getState()
        return { wallet, backup }
    }
}

//The default component is WalletManager.jsx
@connectToStores
export class BackupCreate extends BackupBaseComponent {
    render() {
        return <span className="content_block">
            <h3><Translate content="wallet.create_backup" /></h3>
            <Create>
                <NameSizeModified/>
                <Sha1/>
                <Download/>
                <Reset/>
            </Create></span>
    }
}

@connectToStores
export class BackupVerify extends BackupBaseComponent {
    render() {
        return <span>
            <h3><Translate content="wallet.backup.verify_prior_backup" /></h3>
            <Upload>
                <NameSizeModified/>
                <DecryptBackup saveWalletObject={true}>
                    <h4><Translate content="wallet.backup.verified" /></h4>
                    <WalletObjectInspector
                        walletObject={this.props.backup.wallet_object}/>
                </DecryptBackup>
                <Reset/>
            </Upload>

        </span>
    }
}

// layout is a small project
// class WalletObjectInspector extends Component {
//     static propTypes={ walletObject: PropTypes.object }
//     render() {
//         return <div style={{overflowY:'auto'}}>
//             <Inspector
//                 data={ this.props.walletObject || {} }
//                 search={false}/>
//         </div>
//     }
// }

@connectToStores
export class BackupRestore extends BackupBaseComponent {

    constructor() {
        super()
        this.state = {
            newWalletName: null
        }
    }

    render() {
        var new_wallet = this.props.wallet.new_wallet
        var has_new_wallet = this.props.wallet.wallet_names.has(new_wallet)
        var restored = has_new_wallet

        return <div>
            <h3>{counterpart.translate("wallet.import_backup")}</h3>
            {(new FileReader).readAsBinaryString ? null : <p className="error">Warning! You browser doesnt support some some file operations required to restore backup, we recommend you to use Chrome or Firefox browsers to restore your backup.</p>}
            <Upload>
                <NameSizeModified/>
                <DecryptBackup saveWalletObject={true}>
                    <NewWalletName>
                        <Restore/>
                    </NewWalletName>
                </DecryptBackup>
                <Reset label={restored ? <Translate content="wallet.done" /> : <Translate content="wallet.reset" />}/>
            </Upload>
        </div>
    }

}

@connectToStores
class Restore extends BackupBaseComponent {

    constructor() {
        super()
        this.state = { }
    }

    isRestored() {
        var new_wallet = this.props.wallet.new_wallet
        var has_new_wallet = this.props.wallet.wallet_names.has(new_wallet)
        return has_new_wallet
    }

    render() {
        var new_wallet = this.props.wallet.new_wallet
        var has_new_wallet = this.isRestored()

        if(has_new_wallet)
            return <div className="content">
                <h5>{"Restore success" + new_wallet.toUpperCase()}</h5>
                <div>{this.props.children}</div>
            </div>

        return <div>
            <h3>Ready to restore</h3>
            <RaisedButton label={"restore wallet of " + new_wallet}
                    onTouchTap={this.onRestore.bind(this)} />
        </div>
    }

    onRestore() {
        WalletActions.restore(
            this.props.wallet.new_wallet,
            this.props.backup.wallet_object
        )
    }
}

@connectToStores
class NewWalletName extends BackupBaseComponent {

    constructor() {
        super()
        this.state = {
            new_wallet: null,
            accept: false
        }
    }

    componentWillMount() {
        var has_current_wallet = !!this.props.wallet.current_wallet
        if( ! has_current_wallet) {
            WalletManagerStore.setNewWallet("default")
            this.setState({accept: true})
        }
        if( has_current_wallet && this.props.backup.name && ! this.state.new_wallet) {
            // begning of the file name might make a good wallet name
            var new_wallet = this.props.backup.name.match(/[a-z0-9_-]*/)[0]
            if( new_wallet )
                this.setState({new_wallet})
        }
    }

    render() {
        if(this.state.accept)
            return <span>{this.props.children}</span>

        var has_wallet_name = !!this.state.new_wallet
        var has_wallet_name_conflict = has_wallet_name ?
            this.props.wallet.wallet_names.has(this.state.new_wallet) : false
        var name_ready = ! has_wallet_name_conflict && has_wallet_name

        return <span>
            <h5>New wallet name</h5>
            <input type="text" id="new_wallet"
                onChange={this.formChange.bind(this)}
                value={this.state.new_wallet} />
            <p>{ has_wallet_name_conflict ? "Wallet exist" : null}</p>
            <RaisedButton label="Accept"
                    disabled={!name_ready}
                    onTouchTap={this.onAccept.bind(this)} />
        </span>
    }

    onAccept() {
        this.setState({accept: true})
        WalletManagerStore.setNewWallet(this.state.new_wallet)
    }

    formChange(event) {
        var key_id = event.target.id
        var value = event.target.value
        if(key_id === "new_wallet") {
            //case in-sensitive
            value = value.toLowerCase()
            // Allow only valid file name characters
            if( /[^a-z0-9_-]/.test(value) ) return
        }
        var state = {}
        state[key_id] = value
        this.setState(state)
    }

}

@connectToStores
class Download extends BackupBaseComponent {

    componentWillMount() {
        try { this.isFileSaverSupported = !!new Blob; } catch (e) {}
    }

    componentDidMount() {
        if( ! this.isFileSaverSupported )
            notify.error("File saving is not supported")
    }

    render() {
        let translate = IntlStore.translate;
        return   <section className="setting-item">
                  <RaisedButton label={counterpart.translate("wallet.download")}
                    onTouchTap={this._onDownload.bind(this)}   />
          </section>
    }

    _onDownload() {

        var errorHandler = function(e) {
            console.log(error);
        }

        var fileName = this.props.backup.name;

        var contents = this.props.backup.contents;

        var blob_size = this.props.backup.size;

        var blob = new Blob([ contents ], {
                            type: "application/octet-stream; charset=us-ascii"});


         if (window.resolveLocalFileSystemURL) // phone
             window.resolveLocalFileSystemURL(cordova.file.externalRootDirectory, function (directoryEntry) {
                directoryEntry.getFile(fileName, { create: true }, function (fileEntry) {
                    fileEntry.createWriter(function (fileWriter) {
                        fileWriter.onwriteend = function (e) {

                            WalletActions.setBackupDate()

                            history.pushState(null, '/');
                        };

                        fileWriter.onerror = function (e) {
                            // you could hook this up with our global error handler, or pass in an error callback
                            console.log('Write failed: ' + e.toString());
                        };

                        console.log(contents, 'contents');

                        //var blob = new Blob([ contents ], {
                        //    type: "application/octet-stream; charset=us-ascii"})

                        if(blob.size !== blob_size)
                            throw new Error("Invalid backup to download conversion")

                        fileWriter.write(blob);
                    }, errorHandler.bind(null, fileName));
                }, errorHandler.bind(null, fileName));
            }, errorHandler.bind(null, fileName));
        else
           saveAs(blob, this.props.backup.name); // browser
    }
}



@connectToStores
class Create extends BackupBaseComponent {

    render() {
        var has_backup = !!this.props.backup.contents
        if( has_backup ) return <div>{this.props.children}</div>

        var ready = WalletDb.getWallet() != null
        let translate = IntlStore.translate
        let buttonText = translate('backup.create_backup') + '(' + this.props.wallet.current_wallet+ ')';


        return(<section>
                <main className="no-nav content" ref="backupCreateRef">
                <section className="setting-item">
                 </section>
                  <section className="setting-item">
                      <RaisedButton label={buttonText}
                        onTouchTap={this._onCreateBackup.bind(this)}   />
                  </section>
                  </main>
                 </section> )

        /*return <div>
            <div onClick={this.onCreateBackup.bind(this)}
                className={cname("button success", {disabled: !ready})}>
                <Translate content="wallet.backup.create_backup_of" name={this.props.wallet.current_wallet} /></div>
        </div>*/
    }

    _onCreateBackup() {
        var backup_pubkey = WalletDb.getWallet().password_pubkey
        backup(backup_pubkey).then( contents => {
            var name = this.props.wallet.current_wallet
            var address_prefix = chain_config.address_prefix.toLowerCase()
            if(name.indexOf(address_prefix) !== 0)
                name = address_prefix + "_" + name
            name = name + ".bin"
            BackupActions.incommingBuffer({name, contents})
        })
    }

}

/*class LastBackupDate extends Component {
    render() {
        var backup_date = WalletDb.getWallet().backup_date
        var last_modified = WalletDb.getWallet().last_modified
        var backup_time = false? //: backup_date ?
            <h4>Last backup <FormattedDate value={backup_date}/></h4>:
            <h4><Translate content="wallet.never_backed_up" /></h4>
        var needs_backup = null
        if( backup_date ) {
            needs_backup = last_modified.getTime() > backup_date.getTime() ?
                <h4>wallet need backup</h4>:
                <h4 className="success"><Translate content="wallet.noneed_backup" /></h4>
        }
        return <span>
            <p>{backup_time}</p>
            <p>{needs_backup}</p>
        </span>
    }
}*/

@connectToStores
class Upload extends BackupBaseComponent {

    render() {
        if(
            this.props.backup.contents &&
            this.props.backup.public_key
        )
            return <span>{this.props.children}</span>

        var is_invalid =
            this.props.backup.contents &&
            ! this.props.backup.public_key

        return <div>
          <span>{counterpart.translate("wallet.choose_backup")}</span>
          <input type="file" id="backup_input_file"  onChange={this.onFileUpload.bind(this)}/>
            { is_invalid ? <h5>{counterpart.translate("wallet.invalid_format")}</h5> : null }
        </div>
    }

    onFileUpload(evt) {
        var file = evt.target.files[0]
        BackupActions.incommingWebFile(file)
        this.forceUpdate()
    }
}


@connectToStores
class NameSizeModified extends BackupBaseComponent {
    render() {
        return <span>
            <h5><b>{this.props.backup.name}</b> ({this.props.backup.size} bytes)</h5>
            {this.props.backup.last_modified ?
                <div>{this.props.backup.last_modified}</div> : null }
            <br/>
        </span>
    }
}

@connectToStores
class DecryptBackup extends BackupBaseComponent {

    static propTypes = {
        saveWalletObject: PropTypes.bool
    }

    constructor() {
        super()
        this.state = this._getInitialState()
    }

    _getInitialState() {
        return {
            backup_password: null,
            verified: false
        }
    }

    onPasswordChange() {
    }


    render() {
        if(this.state.verified) return <span>{this.props.children}</span>
        return <div className="content">

          <span className="label bold">{counterpart.translate("wallet.enter_password")}</span>
            <PasswordInput ref="password" confirmation={false} onChange={this.onPasswordChange.bind(this)}/>
            <Sha1/>
            <div>
            <RaisedButton label="Verify" secondary={true} onTouchTap={this.onPassword.bind(this)}/>
            </div>
        </div>
    }

    onPassword() {

        let backup_password = this.refs.password.state.value;

        console.log(backup_password, 'this.state.backup_password');

        var private_key = PrivateKey.fromSeed(backup_password || "")

        var contents = this.props.backup.contents;

        decryptWalletBackup(private_key.toWif(), contents).then( wallet_object => {
       //     console.log(private_key.toWif(), 'wallet_object');
            this.setState({verified: true})
            SettingsStore.rememberWalletPassword(this.state.backup_password); //?
            //SettingsStore.changeSetting({setting: "currentAction", value: btoa(this.state.backup_password) });
            if(this.props.saveWalletObject)
                BackupStore.setWalletObjct(wallet_object)

        }).catch( error => {
            console.error("Error verifying wallet " + this.props.backup.name,
                error, error.stack)
            if(error === "invalid_decryption_key")
                notify.error("Invalid Password")
            else
                notify.error(""+error)
        })
    }

    formChange(event) {
        var state = {}
        state[event.target.id] = event.target.value
        this.setState(state)
    }

}

@connectToStores
export class Sha1 extends BackupBaseComponent {
    render() {
        return <div>
            <pre className="no-overflow">{this.props.backup.sha1} * SHA1</pre>
            <br/>
        </div>
    }
}

@connectToStores
class Reset extends BackupBaseComponent {

    // static contextTypes = {router: React.PropTypes.func.isRequired}
    render() {

        var label = this.props.label || <Translate content="wallet.reset" />

        return <div className="setting-item">
                  <RaisedButton label={label}
                    onTouchTap={this._onReset.bind(this)}   />
                </div>
    }

    _onReset() {
        BackupActions.reset()
        history.pushState(null, '/');
  }
}