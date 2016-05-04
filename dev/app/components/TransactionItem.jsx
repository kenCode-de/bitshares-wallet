import React from "react";
import {PropTypes, Component} from "react";

import Translate from "react-translate-component";
import counterpart from "counterpart";


// Flux Transactions view to display a single transaction data

class TransactionItem extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
         <section className="transactions">
        <div className="section-header">
          <h2><i className="expand"></i><Translate content="wallet.home.transactions" /></h2>
        </div>
        <div className="transactions__content">
          <table>
            <thead>
              <tr>
                <th>{counterpart.translate("wallet.transaction_date")}</th>
                <th>{"|"+counterpart.translate("wallet.home.all")+"|"}</th>
                <th>{counterpart.translate("wallet.to_slash_from")}</th>
                <th>{counterpart.translate("wallet.home.amount")}</th>
              </tr>
            </thead>
            <tbody>
            <tr className="rec-color">
              <td>17.10.2015<span className="table-span">14:32 CET</span></td>
              <td> <span className="sent-color table-span">|Sent|</span><span className="rec-color table-span">|Recd|</span></td>
              <td> <span className="table-span">To: delegate.kencode</span><span className="table-span">From: anon</span><span className="table-span">Memo: hey ken, great job on the ATM’s!</span></td>
              <td>+ 20.00 EUR</td>
            </tr>
            </tbody>
          </table>
        </div>
      </section>
    );
  }
};


export default  TransactionItem;