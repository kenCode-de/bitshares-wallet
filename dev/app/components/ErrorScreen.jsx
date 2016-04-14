import React from "react";
import Translate from "react-translate-component";

import { Router, Route, Link, IndexRoute } from 'react-router';
const SelectField = require('material-ui/lib/select-field');
import WalletUnlockStore from "stores/WalletUnlockStore";
import WalletUnlockActions from "actions/WalletUnlockActions"
import BackupStore from "stores/BackupStore";
import Immutable from "immutable";
import ChainTypes from "./Utility/ChainTypes";
import KeyGenComponent from  "./KeyGenComponent"
import WalletDb from "stores/WalletDb";
import counterpart from "counterpart";

import { createHashHistory, useBasename } from 'history';
const history = useBasename(createHashHistory)({});

class ErrorScreen extends React.Component {

    constructor(props) {
      super(props);

    }

  _onReload()
    {
        console.log("Application reload triggered");
        var loc = window.location.toString()
        var hashNdx = loc.indexOf(window.location.hash);
        if (hashNdx !=-1)
          loc = loc.substring(0,hashNdx);
        window.location = loc;
    }


    render() {

      //"TypeError"
      var errMsg = this.props.location.state && this.props.location.state.error ?
        this.props.location.state.error: "Unhandled application error";
      //if (!errMsg || errMsg.length == 0)
      //  history.pushState(null, '/');



       return (
        <section className="code content-home">
            <div  onClick={this._onReload.bind(this)}>
                <span>{errMsg}</span><br/>
                <a style={{"color": "#00C9FF"}} >Retry</a>
            </div>
        </section>
       );
    }
};

export default ErrorScreen;
