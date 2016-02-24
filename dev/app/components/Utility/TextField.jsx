import React from "react";

class TextField extends React.Component {

    onChange(event) {
        let amount = event.target.value
        this.setState({amount})
        this.props.onChange({amount: amount, asset: this.props.asset})
    }

    _handlerFocus() {
        this.refs.input.focus();
    }

    render() {

        let contents = null;

        let errorText = this.props.errorText ? this.props.errorText : "";

        let lbl = this.props.floatingLabelText ? this.props.floatingLabelText : "";
        let type = this.props.type ? this.props.type : "text";
        let pattern = this.props.pattern ? this.props.pattern : "";
        let _handlerChange = this.props.onChange ? this.props.onChange : null;
        let inputmode = this.props.inputmode ? this.props.inputmode : null;
        let onkeypress = this.props.onKeyPress  ? this.props.onKeyPress  : null;
        let name = this.props.name  ? this.props.name  : "";
        let id = this.props.id || "";
        let onKeyDown = this.props.onKeyDown  ? this.props.onKeyDown  : null;

        let disabled = null;
        let style = {};
        let cur_ref = this.props.ref ? this.props.ref : "input";

        if (this.props.disabled && this.props.disabled == true) {
            disabled  =  "disabled" ;
            style = {"border": "none"};
        }

        let value = this.props.value  ?  this.props.value  : null;

        this.props.multiLine ? contents=[
            <span className="label bold">{lbl}</span>,
            <textarea  onChange={_handlerChange} ref={cur_ref} onKeyDown={onKeyDown} value={value} style={style} name={name}  id={id} disabled={disabled} onKeyPress={onkeypress}  pattern={pattern} inputmode={inputmode} className="text-area"></textarea>,
            <span className="label error">{errorText}</span>
        ] : contents=[
            <span onTouchTap={this._handlerFocus.bind(this)} className="label bold">{lbl}</span>,
            <input onChange={_handlerChange} ref={cur_ref} onKeyDown={onKeyDown} value={value} style={style} name={name}  id={id} disabled={disabled} onKeyPress={onkeypress} type={type} pattern={pattern}  inputmode={inputmode} className="text-field"></input>,
            <span className="label error">{errorText}</span>
            ]

        return (
            <section>{contents}</section>
        )
    }
}

export default TextField;
