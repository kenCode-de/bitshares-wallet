import React from "react";
import {PropTypes, Component} from "react";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import AccountSelector from './AccountSelector';
import AccountActions from "actions/AccountActions";
import AccountStore from "stores/AccountStore";
import ChainStore from "api/ChainStore";
const RaisedButton = require('material-ui/lib/raised-button');
const Dialog = require('material-ui/lib/dialog');
import TextField  from "./Utility/TextField";

import { createHashHistory, useBasename } from 'history';
const history = useBasename(createHashHistory)({});

// ContactOverview view
class AddContact extends React.Component {

  constructor(props) {
    super(props);

     this.state = {contact_name: "", friendly_name: "", notes:"", email:"", contactExists: false, accountSelected: false}
  }

  canSubmit()
  {
    return !this.state.contactExists && this.state.accountSelected;
  }

  toChanged(contact_name) {
      let  exists = AccountStore.doesContactExist(contact_name);
      this.setState({contact_name: contact_name, contactExists: exists});
      let acnt = ChainStore.getAccount(contact_name);
      if (acnt)
        this.setState({accountSelected:true});
      else
        this.setState({accountSelected:false});

  }

  toChangedFriendlyName(e) {
      this.setState({friendly_name: e.target.value});
  }

  toChangedNotes(e) {
      this.setState({notes: e.target.value});
  }

   toChangedEmail(e) {
      this.setState({email: e.target.value.toLowerCase()});
  }

  _handlerOnLinkContact(e) {
    if (!this.canSubmit())
        return;
    // TODO add validate account name
      AccountActions.linkContact({name: this.state.contact_name, friendly_name: this.state.friendly_name, notes: this.state.notes, email: this.state.email});
      history.pushState(null, 'contacts');
  }

  _handleOnLinkCancel(e) {
      history.pushState(null, 'contacts');
  }



  // Render ContactsScreen view
  render() {

    return (
       <section className="content">
          <AccountSelector
               label={counterpart.translate("wallet.home.account")}
               accountName={this.state.contact_name}  email={this.state.email}
               onChange={this.toChanged.bind(this)}
               error = {this.state.contactExists && (this.state.contact_name && (this.state.contact_name.length!=0))?  counterpart.translate("wallet.contact_does_exist"): null}
               account={this.state.contact_name} />
          <TextField
              floatingLabelText={counterpart.translate("wallet.contactFriendlyName")+":"}
              type="text"
              onChange={this.toChangedFriendlyName.bind(this)}
              value={this.state.friendly_name}/>
           <TextField
              floatingLabelText={counterpart.translate("wallet.contact_email_hint")+":"}
              type="text"
              onChange={this.toChangedEmail.bind(this)}
              value={this.state.email}/>
           <TextField
              floatingLabelText={counterpart.translate("wallet.contactNotes")+":"}
              type="text"
              onChange={this.toChangedNotes.bind(this)}
              value={this.state.notes}
              multiLine={true}/>
          <div>
            <RaisedButton
            label={counterpart.translate("wallet.home.cancel")}
            backgroundColor = "#FF4081" primary = {true}
            onTouchTap={this._handleOnLinkCancel}  />&nbsp;
           <RaisedButton
            label={counterpart.translate("wallet.add")}
            backgroundColor = {this.canSubmit() ? "#008000" : "#CCC"} secondary={true}
            onTouchTap={this._handlerOnLinkContact.bind(this)} />
          </div>
         </section>
    );
  }
};

export default AddContact;