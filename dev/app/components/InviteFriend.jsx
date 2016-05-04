import React from "react";
import {PropTypes, Component} from "react";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import AccountSelector from './AccountSelector';
import AccountActions from "actions/AccountActions";
const RaisedButton = require('material-ui/lib/raised-button');
const Dialog = require('material-ui/lib/dialog');
import { createHashHistory, useBasename } from 'history';

const history = useBasename(createHashHistory)({});

// ContactOverview view
class InviteFriend extends React.Component {

  constructor(props) {
    super(props);

     this.state = {emails: ""}
  }

  _handleOnLinkCancel(e) {
      history.pushState(null, 'contacts');
  }

  _handleShareInvite() {

      if (window.plugins && window.plugins.socialsharing) {

          let onSuccess = function() {
            history.pushState(null, 'contacts');
          }

          let onError = function(error) {
            console.log(error);
          }

          window.plugins.socialsharing.shareViaEmail(
              'Hi, I just found this awesome BitShares Wallet that allows you to send and receive Smartcoins. Check it out! Cheers', // can contain HTML tags, but support on Android is rather limited:  http://stackoverflow.com/questions/15136480/how-to-send-html-content-with-image-through-android-default-email-client
              'Awesome BitShares',
              null, // TO: must be null or an array
              null, // CC: must be null or an array
              null, // BCC: must be null or an array
              ['https://www.google.nl/images/srpr/logo4w.png','www/localimage.png'], // FILES: can be null, a string, or an array
              onSuccess, // called when sharing worked, but also when the user cancelled sharing via email (I've found no way to detect the difference)
              onError // called when sh*t hits the fan
          );

      } else {
         console.log('BitShares invite: social network sharing plugin is not available');
      }

  }

  toChangedEmails(e) {
      this.setState({emails: e.target.value});
  }

  // Render ContactsScreen view
  render() {

    return (
       <section className="content">
           <div style={{'text-align': 'center', 'padding': '5px'}}>
           Invite one or more of your friends to try out the BitShares Wallet! Email addresses are not saved or collected by anyone so their privacy is assured.
           </div>
           <div style={{'text-align': 'center', 'padding': '20px 0px'}}>
             <RaisedButton
              label="Open email application"
              primary={true}
              onTouchTap={this._handleShareInvite.bind(this)} />
          </div>
         </section>
    );
  }
};

export default InviteFriend;