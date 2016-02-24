import React from "react";
import Translate from "react-translate-component";
import Operation from "./Operation";
import ChainTypes from "./Utility/ChainTypes";
import BindToChainState from "./Utility/BindToChainState";
import utils from "common/utils";
import {operations} from "chain/chain_types";
import Immutable from "immutable";
import ChainStore from "api/ChainStore";
import IntlStore from "stores/IntlStore";
import SettingsStore from "stores/SettingsStore";






class SortableHeader extends React.Component {

    constructor(props) {
        super();

    }

    render()
    {
        if (this.props.col == this.props.sorting.col)
        {
            //dangerouslySetInnerHTML={{__html: getMarkup()}}
             //<Translate content="wallet.to_slash_from" />&#x25B2 &#x25BC</th>
            let arrow =  this.props.sorting.descending ? "&#x25BC" : "&#x25B2";
            return  <th onClick={this.props.onSort.bind(this, this.props.col)} ><b>{this.props.children}</b><span  dangerouslySetInnerHTML={{__html: arrow}}  /></th>
        }
        else
        {
            return  <th onClick={this.props.onSort.bind(this, this.props.col)} >{this.props.children}</th>
        }

    }

}



@BindToChainState({keep_updating: true})
class RecentTransactions extends React.Component {

    static propTypes = {
        accountsList: ChainTypes.ChainAccountsList.isRequired,
        compactView: React.PropTypes.bool,
        limit: React.PropTypes.number
    }

    constructor(props) {
        super();
        let limit = props.limit ? Math.max(20, props.limit) : 20;
        this.state = {
            limit: limit,
            more: limit,
            sorting:
                {col: '',
                 descending: false},
            sortingChange: false};
    }


    compareOps1(b, a) {
    if(a.block_num < b.block_num) return -1;
    if(a.block_num === b.block_num) {
        if(a.trx_in_block < b.trx_in_block) return -1;
        if(a.trx_in_block === b.trx_in_block) {
            if(a.op_in_trx < b.op_in_trx) return -1;
            if(a.op_in_trx === b.op_in_trx) return 0;
        }
    }
    return 1;
    }

    compareOps(b,a){
        return this.state.sorting.descending? -this.compareOps1(b,a) : this.compareOps1(b,a)
    }



    compareAccounts(b, a) {
        let id = a.op[1].from || a.op[1].to; //  "1.2.98491"
        let acnt = ChainStore.getAccount(id);
        let x = acnt? ChainStore.getAccount(id).get("name"): "";
        id = b.op[1].from || b.op[1].to;
        acnt = ChainStore.getAccount(id);
        let y = acnt? ChainStore.getAccount(id).get("name"): "";
        return this.state.sorting.descending? (x > y ? -1: x==y ? 0: 1):
            (x > y ? 1: x==y ? 0: -1);
    }

    //history[0].op[1].amount.amount
    compareAmounts(b, a) {
        let x = a.op[1].amount? a.op[1].amount.amount: 0;
        let y = b.op[1].amount? b.op[1].amount.amount: 0;
        return this.state.sorting.descending?  (x > y ? -1: x==y ? 0: 1):
            (x > y ? 1: x==y ? 0: -1);
    }


    shouldComponentUpdate(nextProps, nextState) {
        if(!utils.are_equal_shallow(this.props.accountsList, nextProps.accountsList)) return true;
        if (nextState.limit !== this.state.limit) return true;
        if (nextState.sortingChange !== this.state.sortingChange) return true;

        if(!utils.are_equal_shallow(this.props.sorting, nextProps.sorting)) return true;
        for(let key = 0; key < nextProps.accountsList.length; ++key) {
            let npa = nextProps.accountsList[key];
            let nsa = this.props.accountsList[key];
            if(npa && nsa && (npa.get("history") !== nsa.get("history"))) return true;
        }
        return false;
    }


    componentWillMount() {
        this.setState({hideDonations : SettingsStore.getAdvancedSettings().hideDonations == true});
        var sorting = SettingsStore.getSetting("transactionListSortCol");
        if (sorting)
            this.setState({sorting: sorting});

    }



    _onIncreaseLimit() {
        this.setState({
            limit: this.state.limit + this.state.more
        });
    }



    _onSort(col){
        let sorting = this.state.sorting;
        if (sorting.col == col)
            sorting.descending = !sorting.descending;
        else
            sorting.col = col;
        this.setState({sorting:sorting, sortingChange:!this.state.sortingChange}); // weird, but update is not triggered without it
        SettingsStore.changeSetting({setting: "transactionListSortCol", value: this.state.sorting });
    }




    render() {


        let ops = Object.keys(operations);
        let iso = IntlStore.getCurrency().iso;
        let taxableCurrencyId = null;
        if (iso && iso.length != 0 )
        {
            var test_asset = ChainStore.getAsset(iso);
            if (test_asset != null)
                    taxableCurrencyId = iso;
        }


        let {accountsList, compactView, filter} = this.props;
        let {limit} = this.state;
        let history = [];
        let current_account = null, current_account_id = null;
        let accounts_counter = 0;
        var seen_ops = new Set();
        for(let account of accountsList) {
            accounts_counter += 1;
            if(account) {
                current_account = account;
                let h = account.get("history");
                if (h) history = history.concat(h.toJS().filter(op => !seen_ops.has(op.id) && seen_ops.add(op.id)));
            }
        }


        if (filter) {
            history = history.filter(a => {
                return a.op[0] === operations[filter] /*&& ops[a.op[0]] == "transfer" *///
            });
        }
        if (this.state.hideDonations)
            history = history.filter(a => {
                return a.op[1].to != "1.2.90200";
            });
        //sorting
        history = history.filter(a => { //weird sorting glitch
            return a.op[0] === 0 // weird sorting glitch
        });


        if (current_account)
            current_account_id = current_account.get("id");
        if (current_account_id)
        {
            let incomingTrans = history.filter(a =>  a.op[1].to == current_account_id);
            let currentIncomingCount =  incomingTrans.length;
            if (this.lastIncomingCount && this.lastIncomingCount < currentIncomingCount)
            {
                console.log('$$$ incoming transaction - playing sound');
                if (Media)
                {
                    let src = "http://bitshares-munich.de/img/woohoo.wav"
                    //console.log('$$$Media feature is installed');
                    var media = new Media(src);
                    media.play();
                }

            }
            this.lastIncomingCount = currentIncomingCount;
        }








        let comparer = this.compareOps.bind(this);
        let sortCol = this.state.sorting.col;
        if (sortCol == "to")
            comparer = this.compareAccounts.bind(this);
        else if (sortCol == "amount")
            comparer = this.compareAmounts.bind(this);


        //console.log('$$$raw history =', history); // $$$
        if (current_account_id && sortCol=="op")
        {
            let desc = this.state.sorting.descending;
            comparer = function(b,a)
            {
                let x =  b.op[1].from == current_account_id;
                let y =  a.op[1].from == current_account_id;
                return desc ?
                    (x==y ? 0: x == true ? 1: -1):
                    (x==y ? 0: x == true ? -1: 1);
            }
        }



        let rowid =0;
        if (!this.lastHistory)
        {

        }
        history = history
            .sort(comparer);
       // if (this.state.sorting.descending)
       //     history = history.reverse();
      let historyCount = history.length;

         history = history.slice(0, limit)
            .map(o => {
                return (
                    <Operation
                        rowid = {rowid++}
                        key={o.id}
                        op={o.op}
                        result={o.result}
                        block={o.block_num}
                        current={current_account_id}
                        inverted={false}
                        hideFee={true}
                        hideOpLabel={compactView}
                        taxableCurrencyId={taxableCurrencyId} />
                )
        });
        /*return (
            <div>
                <table className={"table" + (compactView ? " compact" : "")}>
                    <thead>
                    <tr>
                        {compactView ? null : <th><Translate content="wallet.transaction_op" /></th>}
                        <th><Translate content="wallet.transaction_info" /></th>
                        <th><Translate content="wallet.transaction_date" /></th>
                    </tr>
                    </thead>
                    <tbody>
                        {history}
                    </tbody>
                </table>
                {this.props.showMore && historyCount > 20 && limit < historyCount ? (
                    <div className="account-info more-button">
                        <div className="button outline" onClick={this._onIncreaseLimit.bind(this)}>
                            <Translate content="account.more" />
                        </div>
                    </div>
                    ) : null}
            </div>
        );*/

//                 <th onTouchTap={this._onSort.bind(this, "to" )}><Translate content="wallet.to_slash_from" />&#x25B2 &#x25BC</th>
// <Translate content="wallet.to_slash_from" />&#x25B2 &#x25BC</th>

        return   <div>
                <table className="table">
                    <thead>
                    <tr>
                        <SortableHeader onSort={this._onSort.bind(this)} col="" sorting = {this.state.sorting} className="right-td" ><Translate content="wallet.transaction_date" /></SortableHeader>
                        <SortableHeader onSort={this._onSort.bind(this)} col="op" sorting = {this.state.sorting} ><Translate content="wallet.transaction_op" /></SortableHeader>
                        <SortableHeader onSort={this._onSort.bind(this)} col="to" sorting = {this.state.sorting} ><Translate content="wallet.to_slash_from" /></SortableHeader>
                        <SortableHeader onSort={this._onSort.bind(this)} col="amount" sorting = {this.state.sorting} ><Translate content="wallet.home.amount" /> </SortableHeader>
                    </tr>
                    </thead>
                    <tbody>
                        {history}
                    </tbody>
                </table>
                {this.props.showMore &&  limit < historyCount ? (
                    <div className="account-info more-button">
                        <div className="button outline " onClick={this._onIncreaseLimit.bind(this)}>
                            <Translate content="wallet.account_more" />
                        </div>
                    </div>
                    ) : null}
            </div>
    }
}

export default RecentTransactions;
