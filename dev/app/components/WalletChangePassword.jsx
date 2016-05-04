import React, {PropTypes, Component} from "react"
import Translate from "react-translate-component"
import notify from "actions/NotificationActions"
import cname from "classnames"
import WalletDb from "stores/WalletDb"
import PasswordConfirm from "./PasswordConfirm"
import PasswordInput from "./Forms/PasswordInput";
import IntlStore from "stores/IntlStore";



const RaisedButton = require('material-ui/lib/raised-button');

export default class WalletChangePassword extends Component {
    constructor() {
        super()
        this.state = {}
    }

    render() {

        /*
           <div className={cname("button success", {disabled: ! ready})}
                    onClick={this.onAccept.bind(this)}><Translate content="wallet.accept" /></div>
        */
        var acceptButton = <section className="setting-item">
          <RaisedButton label={<Translate content="wallet.accept" />}
            onTouchTap={this.onAccept.bind(this)}   />
          </section>



        var ready = !!this.state.new_password
        return <span>
            <h3><Translate content="wallet.settings.editPin"/></h3>
            <WalletPassword onValid={this.onOldPassword.bind(this)}>
                <PasswordConfirm onValid={this.onNewPassword.bind(this)}/>
            {ready? acceptButton : null}
            </WalletPassword>
            <Reset/>
        </span>
    }

    onAccept() {
        var {old_password, new_password} = this.state
        WalletDb.changePassword(old_password, new_password, true/*unlock*/)
            .then(()=> {
                notify.success("Password changed")
                window.history.back()
            })
            .catch( error => {
                // Programmer or database error ( validation missed something? )
                // .. translation may be unnecessary
                console.error(error)
                notify.error("Unable to change password: " + error)
            })
    }
    onOldPassword(old_password) { this.setState({ old_password }) }
    onNewPassword(new_password) { this.setState({ new_password }) }
}

class WalletPassword extends Component {

    static propTypes = {
        onValid: React.PropTypes.func.isRequired
    }

    constructor() {
        super()
        this.state = {
            password: null,
            verified: false
        }
    }

    render() {

//            <span className="button success"
//                onClick={this.onPassword.bind(this)}><Translate content="wallet.verify" /></span>

        var label = this.props.label || <Translate content="wallet.verify" />
        var watermark = IntlStore.translate('existing_password');


        if(this.state.verified) return <span>{this.props.children}</span>
        return  <span><PasswordInput ref="verifyPassword" watermark={watermark} confirmation={false} onEnter={this._onPassword.bind(this)} onChange={this._onPasswordTyping.bind(this)}/>
                <section className="setting-item"><RaisedButton label= {label}
                    onTouchTap={this._onPassword.bind(this)}   />
                </section></span>




        /*return <span>
            <label>{<Translate content="wallet.existing_password"/>}</label>
            <input type="password" id="password"
                onChange={this.formChange.bind(this)}
                value={this.state.password}/>

          return <section className="setting-item">
          <RaisedButton label= {label}
            onTouchTap={this._onPassword.bind(this)}   />
          </section>

        </span>*/
    }

    _onPassword() {
        if( WalletDb.validatePassword(this.state.password) ) {
            this.setState({ verified: true })
            this.props.onValid(this.state.password)
        } else
        {
            this.refs.verifyPassword.setState({watermark: 'Invalid PIN'})
            notify.error("Invalid Password")
        }
    }
    _onPasswordTyping(event){
        this.refs.verifyPassword.setState({watermark: this.refs.verifyPassword.props.watermark});
        //event = Object {valid: false, passwordValue: "1", value: "1"}
        this.setState({password: event.passwordValue })

    }

    /*formChange(event) {
        var state = {}
        state[event.target.id] = event.target.value
        this.setState(state)
    }*/

}

class Reset extends Component {

    render() {
        var label = this.props.label || <Translate content="wallet.reset" />

          return <section className="setting-item">
          <RaisedButton label={label}
            onTouchTap={this._onReset.bind(this)}   />
          </section>


        //return  <span className="button cancel"
        //    onClick={this.onReset.bind(this)}>{label}</span>
    }

    _onReset() {
        window.history.back()
    }
}
