import React from "react";
import {PropTypes, Component} from "react";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import AccountImage from "./AccountImage";
import AccountActions from "actions/AccountActions";
import TextField  from "./Utility/TextField";
import { Router, Route, Link, IndexRoute } from 'react-router';
const RaisedButton = require('material-ui/lib/raised-button');
const Dialog = require('material-ui/lib/dialog');
import { createHashHistory, useBasename } from 'history';
const history = useBasename(createHashHistory)({});


// ContactOverview view
class ContactOverview extends React.Component {

  constructor(props) {
    super(props);

    let { query } = this.props.location;

    this.state =  {current_contact : JSON.parse(query && query.contact? query.contact : this.props.location.state.contact)}

  }


  friendlyNameChanged(e)
  {
    let current_contact = this.state.current_contact;
    current_contact.friendly_name = e.target.value;
    this.setState({current_contact: current_contact});


  }
  notesChanged(e)
  {

    let current_contact = this.state.current_contact;
    current_contact.notes = e.target.value;
    this.setState({current_contact: current_contact});


  }

  _handleContactDelete() {
      AccountActions.unlinkContact(this.state.current_contact);
      history.pushState(null, 'contacts');
  }

  _handleDeleteContactCancel() {
    this.refs.delete_confirm.dismiss();
  }

  _handleConfirmDeleteContact() {
    this.refs.delete_confirm.show();
  }

     onSubmit(e) {
        if (!this.state.to_account_valid)
        {
          return;
        }
        e.preventDefault();
      }

  // Render ContactsScreen view
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





    return (
      <section className="content">
        <div className="header__links"><button className="contact-delet-btn"><i onTouchTap={this._handleConfirmDeleteContact.bind(this)} className="contact_delet"></i></button></div>
        <Dialog title={counterpart.translate("wallet.contactDeleteConfirm")}
              actions={delete_contact_actions}
              modal={true}
              style={{width: '90%'}}
              ref="delete_confirm" autoScrollBodyContent={true}>
        </Dialog>
        <div style={{"height": "50px"}}>
          <AccountImage className="contact-image" account={this.state.current_contact.name}  email={this.state.current_contact.email} size={{height: 45, width: 45}}/>
        </div>
        <div>
        <TextField
          floatingLabelText={counterpart.translate("wallet.home.account")}
          value={this.state.current_contact.name}
          disabled={true} />
        </div>
         <form className="send-form" onSubmit={this.onSubmit.bind(this)} noValidate>
          <div>
          <TextField
            floatingLabelText={counterpart.translate("wallet.contactFriendlyName")}
            value={this.state.current_contact.friendly_name}
            onChange={this.friendlyNameChanged.bind(this)}
            disabled={true} />
          </div>
          <div>
          <TextField
            floatingLabelText={counterpart.translate("wallet.contactNotes")}
            value={this.state.current_contact.notes}
            onChange={this.notesChanged.bind(this)}
            disabled={true}
            multiLine={true} />
          </div>
          <section className="code-buttons">
                <div>
                  <Link to="receive" className="btn btn-receive upper" query={{contact: JSON.stringify(this.state.current_contact)}}><Translate component="span" content="wallet.home.receive"/></Link>
                  <Link to="send"  query={{contact: JSON.stringify(this.state.current_contact)}} className="btn btn-send btn-send-alone upper"><Translate component="span" content="wallet.home.send"/></Link>
                </div>
          </section>
        </form>
      </section>
    );
  }
};

export default ContactOverview;