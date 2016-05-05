import React, {PropTypes, Component} from "react"
import Translate from "react-translate-component"
import Immutable from "immutable"
import cname from "classnames"
import TextField  from "./Utility/TextField";
import counterpart from "counterpart"

export default class PasswordConfirm extends Component {

    static propTypes = {
        // Called everytime a valid password is provided and matches a confirmed password
        onValid: PropTypes.func.isRequired
    }

    constructor() {
        super()
        this.state = {
            password: "",
            confirm: "",
            errors: Immutable.Map(),
            // An empty form has no errors but is still invaid
            valid: false
        }
    }


//    <PasswordInput ref="verifyPassword" confirmation={false} onEnter={this.onAccept.bind(this)}/>


    render() {
        var {password, confirm, valid, errors} = this.state



        return <div className={cname(
            "grid-content", "no-overflow", {"has-error": errors.size})}>
            <div>
              <TextField
                  name="password"
                  id="password"
                  ref="password"
                  floatingLabelText={counterpart.translate("wallet.six_digits_pin")}
                  type="password"
                  value={this.state.password}
                  onChange={this.formChange.bind(this)} />
            </div>
            <div>
                <TextField
                  name="password"
                  id="confirm"
                  ref="password"
                  floatingLabelText={counterpart.translate("wallet.six_digits_pin_confirm")}
                  type="password"
                  value={this.state.confirm}
                  onChange={this.formChange.bind(this)} />
            </div>
            <div>{errors.get("password_match") || errors.get("password_length")}</div>
            <br/>
        </div>
    }

    formChange(event) {
        var state = this.state
        state[event.target.id] = event.target.value
        this.setState(state)
        this.validate(state)
    }

    validate(state) {
        var {password, confirm} = state
        confirm = confirm.trim()
        password = password.trim()

        var errors = Immutable.Map()
        // Don't report until typing begins
        if(password.length !== 6)
            errors = errors.set("password_length", "PIN must be 6 characters")

        // Don't report it until the confirm is populated
        if( password !== "" && confirm !== "" && password !== confirm)
            errors = errors.set("password_match", "PIN do not match")

        var valid = password.length == 6 && password === confirm
        this.setState({errors, valid})
        this.props.onValid(valid ? password : null)
    }
}
