import React from "react";
import {PropTypes, Component} from "react";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import ContactsTable from "./ContactsTable";
import AddContact from "./AddContact";
import { Router, Route, Link, IndexRoute } from 'react-router';
import AltContainer from "alt/AltContainer";


// Flux ContactsScreen view
class ContactsScreen extends React.Component {

  constructor(props) {
    super(props);
     let { query } = this.props.location;

    this.state = {transfer: query && this.props.location.state && this.props.location.state.transfer? JSON.parse(this.props.location.state.transfer) : null}

  }




  // Render ContactsScreen view
  render() {


    return (
      <section className="content-contacts">
        <main>
           <AltContainer
                  stores={
                    {
                      account: () => { // props is the property of AltContainer
                        return {
                          store: AccountStore,
                          value: AccountStore.getState().currentAccount
                        };
                      },
                      contacts: () => {
                        return {
                          store: AccountStore,
                          value: AccountStore.getState().contacts
                        }
                      },
                      linkedAccounts: () => {
                        return {
                          store: AccountStore,
                          value: AccountStore.getState().linkedAccounts
                        }
                      }
                    }
                  }
                >
                  <ContactsTable transfer={this.state.transfer} />
            </AltContainer>
        </main>
      </section>
    );
  }
};

export default ContactsScreen;