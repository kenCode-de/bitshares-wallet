import React from "react";
import {PropTypes, Component} from "react";

import Translate from "react-translate-component";
import counterpart from "counterpart";
import AccountImage from "./AccountImage";
import { Router, Route, Link, IndexRoute } from 'react-router';
import { createHashHistory, useBasename } from 'history';
const history = useBasename(createHashHistory)({});

// Flux Transactions view to display a single contact
class ContactItem extends React.Component {

  constructor(props) {
    super(props);

    this.state = {tapped: false}
  }

  shouldComponentUpdate(nextProps) {

      return  this.props.contact_name !== nextProps.contact_name ||
              this.props.notes !== nextProps.notes ||
              this.props.friendly_name !== nextProps.friendly_name ||
              this.props.email == nextProps.email
  }

  _tapHandler() {

    if (this.props.transfer)
    {
      history.pushState({contactname: this.props.contact_name, transfer: this.props.transfer}, 'send');
    }
    else
    {
      let current_contact_json = JSON.stringify({name: this.props.contact_name, friendly_name: this.props.friendly_name, notes: this.props.notes, email: this.props.email });
      history.pushState({contact: current_contact_json}, 'contact-overview');
    }

    /*this.setState({tapped: true})
    setTimeout(() => {
      this.setState({tapped: false});

    }.bind(this), 500);*/

  }

 /* _editHandler()
  {
    let current_contact_json = JSON.stringify({name: this.props.contact_name, friendly_name: this.props.friendly_name, notes: this.props.notes, email: this.props.email });
    history.pushState({contact: current_contact_json}, 'contact-edit');
  }*/




  render() {

    //let current_contact_json = JSON.stringify({name: this.props.contact_name, friendly_name: this.props.friendly_name, notes: this.props.notes });
    let tapped = "no_tapped";

    if (this.state.tapped === true) {
      tapped = "tapped";
    }
  ////      <Link to="contact-overview" query={{contact: current_contact_json}}> </Link>


    return (
      <tr >

        <td onTouchTap={this._tapHandler.bind(this)} className={tapped} ><AccountImage className="contact-image"  email={this.props.email} account={this.props.contact_name} size={{height: 35, width: 35}}/></td>

        <td onTouchTap={this._tapHandler.bind(this)} className={tapped}> <span className="b bold">{this.props.friendly_name}</span>{counterpart.translate("wallet.home.account")+": " + this.props.contact_name}<br/>{counterpart.translate("wallet.contactNotes")+": " + this.props.notes}</td>
        {this.props.transfer? null:
        <td>
          <span className="edit-contact" onTouchTap={this.props.onEdit.bind(this)}  ></span>
          <span className="delete-contact" onTouchTap={this.props.onDelete.bind(this)} ></span>
        </td> }
      </tr>

    );
  }
}

export default ContactItem;
