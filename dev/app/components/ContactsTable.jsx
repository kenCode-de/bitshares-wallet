import React from "react";
import {PropTypes, Component} from "react";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import ContactItem from "./ContactItem";
import AccountStore from "stores/AccountStore";
import AccountActions from "actions/AccountActions";
import alt from "alt";
const Dialog = require('material-ui/lib/dialog');
import If from './If';
import AccountImage from "./AccountImage";
import EditContact from "./EditContact"

const RaisedButton = require('material-ui/lib/raised-button');
import { createHashHistory, useBasename } from 'history';
const history = useBasename(createHashHistory)({});



class ContactsTable extends React.Component {

   constructor () {
    super();
    this.state = {
      current_contact: {},
      deletionConfirmOpen:false}


  }

  shouldComponentUpdate(nextProps, nextState) {

      return this.props.contacts !== nextProps.contacts ||
             this.state.current_contact != nextState.current_contact ||
             this.state.deletionConfirmOpen != nextState.deletionConfirmOpen;
  }

  IsJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
  }

  _handleContactDelete() {
      AccountActions.unlinkContact(this.state.current_contact);
      this.setState({deletionConfirmOpen: false});
      history.pushState(null, 'contacts');
  }



  _handleDeleteContactCancel() {
    //this.refs.delete_confirm.dismiss();
    this.setState({deletionConfirmOpen: false});
  }

  _handleConfirmDeleteContact(contact) {
    this.setState({deletionConfirmOpen: true, current_contact: contact});
  }
  _handleEditContact(contact)
  {
    //let current_contact_json = JSON.stringify(contact);
    history.pushState({contact: contact}, 'contact-edit');
  }





  render() {



  let delete_contact_actions  =
            [<RaisedButton
            label={counterpart.translate("wallet.home.cancel")}
            backgroundColor = "#FF4081" primary = {true}
            onTouchTap={this._handleDeleteContactCancel.bind(this)}  />,
           <RaisedButton
            label={counterpart.translate("wallet.confirm")}
            backgroundColor = "#008000" secondary={true}
            onTouchTap={this._handleContactDelete.bind(this)} />]




    let contacts_arr = this.props.contacts.toArray();
    let contacts = [];

    if (contacts_arr.length > 0) {

      for (var i=contacts_arr.length-1; i > -1; i--) {
        if (this.IsJsonString(contacts_arr[i])) {
          var json = JSON.parse(contacts_arr[i]);
          //json.contactJson = contacts_arr[i];
          contacts.push(json);
        }
      }
     contacts.sort(function(a, b) {
                return a.hasOwnProperty("timestamp") ?
                    b.timestamp - a.timestamp:
                    a.name < b.name ? -1: a.name> b.name? 1: 0
            });
    }


    let dlg = <Dialog title={counterpart.translate("wallet.contactDeleteConfirm")}
              open={this.state.deletionConfirmOpen}
              actions={delete_contact_actions}
              modal={true}
              style={{width: '90%'}}
              ref="delete_confirm" autoScrollBodyContent={true}>
        </Dialog>;



      let table = <table className="contacts-table">
        <theader>
          <tr>
            <th></th>
            <th>{counterpart.translate("wallet.home.name")}</th>
            <th></th>
          </tr>
        </theader>
        <tbody>
           {contacts.map((contact_item, i) =>
              <ContactItem ref="contact_item" contact_name={contact_item.name} friendly_name={contact_item.friendly_name} notes={contact_item.notes} email={contact_item.email} key={i}
              onDelete={this._handleConfirmDeleteContact.bind(this, contact_item)}
              onEdit= {this._handleEditContact.bind(this,contact_item)}
               transfer={this.props.transfer}   />
            )}
        </tbody>
      </table>

    return <div>{dlg}{table}</div>;


  }
}

export default ContactsTable;
