import React from "react";
import {PropTypes, Component} from "react";
import ReactDOM from 'react-dom';
import classNames from "classnames";
import Translate from "react-translate-component";
import ThemeManager from 'material-ui/lib/styles/theme-manager';
import LightRawTheme from 'material-ui/lib/styles/raw-themes/light-raw-theme';
import Colors from'material-ui/lib/styles/colors';
import TextField  from "../Utility/TextField";
import counterpart from "counterpart";

class PasswordInput extends Component {

    childContextTypes: {
      muiTheme: React.PropTypes.object,
    }

    static propTypes = {
        onChange: PropTypes.func,
        onEnter: PropTypes.func,
        confirmation: PropTypes.bool,
        wrongPassword: PropTypes.bool
    }

    getChildContext() {
        muiTheme: this.state.muiTheme
    }

    constructor() {
        super();
        this.handleChange = this.handleChange.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.state = {muiTheme: ThemeManager.getMuiTheme(LightRawTheme), value: "", error: null, wrong: false, doesnt_match: false, passwordValue: "", confirmPasswordValue: ""};
    }

    componentWillMount() {
      let newMuiTheme = ThemeManager.modifyRawThemePalette(this.state.muiTheme, {
        accent1Color: Colors.deepOrange500,
      });

      this.setState({muiTheme: newMuiTheme, watermark: this.props.watermark});
    }

    value() {
        let node = this.state.passwordValue;
        return node ? node.value : "";
    }

    clear() {
        this.setState({
            confirmPasswordValue: "",
            passwordValue: ""
        })
     //   if(this.props.confirmation) ReactDOM.findDOMNode(this.refs.confirm_password).value = "";
    }

    focus() {
        ReactDOM.findDOMNode(this.password.password).focus();
    }

    valid() {
        return !(this.state.error || this.state.wrong || this.state.doesnt_match) && this.state.value.length === 6;
    }

    checkPasswordConfirmation(password, confirmPassword) {
        this.state.doesnt_match = password !== confirmPassword;
        this.setState({doesnt_match: this.state.doesnt_match});
    }

    handleChange(e) {

        if(/^\d*$/.test(e.target.value)) {
               //   e.preventDefault();
     //   e.stopPropagation();
            let confirmation =  true;

            let password = this.state.passwordValue;
            let confirmPassword = this.state.confirmPasswordValue;

            if (e.target.name === "confirm_password") {
                confirmation = this.props.confirmation ? e.target.value : true;
                confirmPassword = e.target.value;
            } else {
                confirmation = this.props.confirmation ? this.state.confirmPasswordValue : true;
                password = e.target.value;
            }

             this.checkPasswordConfirmation(password, confirmPassword);

            let state = {
                valid: !this.state.error && !this.state.wrong
                && !(this.props.confirmation && this.state.doesnt_match)
                && confirmation && password.length === 6,
                confirmPasswordValue: confirmPassword,
                passwordValue: password,
                value: password
            };

            if (this.props.onChange) this.props.onChange(state);
            this.setState(state);
        }
    }

    onKeyDown(e) {
        if (e.keyCode >= 48 && e.keyCode <= 57) {
        } else {
          return false;
        }
    }

    render() {
        let password_error = null, confirmation_error = null;
        if(this.state.wrong || this.props.wrongPassword) password_error = <div>Incorrect password</div>;
        else if(this.state.error) password_error = <div>{this.state.error}</div>;
        if (!password_error && (this.state.value.length > 6 || this.state.value.length < 6))
            password_error = "PIN must be 6 characters";
        if(this.state.doesnt_match) confirmation_error = <div>Confirmation doesnt match PIN</div>;
        let password_class_name = classNames("form-group", {"has-error": password_error});
        let password_confirmation_class_name = classNames("form-group", {"has-error": this.state.doesnt_match});
        return (
            <div>
                <div>
                    <TextField
                      name="password"
                      ref={this.props.ref}
                      floatingLabelText={this.state.watermark || counterpart.translate("wallet.six_digits_pin")}
                      type="password"
                      pattern="[0-9]"
                      inputmode="numeric"
                      value={this.state.passwordValue}
                      onChange={this.handleChange}
                      errorText={password_error}
                      onKeyDown={this.onKeyDown}/>
                </div>
                {this.props.confirmation ?
                    <div>
                    <TextField
                      name="confirm_password"
                      floatingLabelText={counterpart.translate("wallet.six_digits_pin_confirm")}
                      type="password"
                      pattern="[0-9]"
                      inputmode="numeric"
                      value={this.state.confirmPasswordValue}
                      onKeyDown={this.onKeyDown}
                      onChange={this.handleChange}
                      errorText= {confirmation_error}/>
                    </div>
                : null}
            </div>

        );
    }
}

export default PasswordInput;
