import React from "react";
import connectToStores from "alt/utils/connectToStores";
import classNames from "classnames";
import AccountActions from "actions/AccountActions";
import AccountStore from "stores/AccountStore";
import AccountNameInput from "./Forms/AccountNameInput";
import PasswordInput from "./Forms/PasswordInput";
import WalletDb from "stores/WalletDb";
import notify from 'actions/NotificationActions';
import {Link} from "react-router";
import AccountImage from "./AccountImage";
import AccountSelect from "./Forms/AccountSelect";
import WalletUnlockActions from "actions/WalletUnlockActions";
import TransactionConfirmStore from "stores/TransactionConfirmStore";
import LoadingIndicator from "./LoadingIndicator";
import WalletActions from "actions/WalletActions";
import Translate from "react-translate-component";
import RefcodeInput from "./Forms/RefcodeInput";
import ThemeManager from 'material-ui/lib/styles/theme-manager';
import LightRawTheme from 'material-ui/lib/styles/raw-themes/light-raw-theme';
import Colors from'material-ui/lib/styles/colors';
const RaisedButton = require('material-ui/lib/raised-button');
const Dialog = require('material-ui/lib/dialog');
import IntlStore from "stores/IntlStore";
import IntlActions from "actions/IntlActions";

import { createHashHistory, useBasename } from 'history';
import BackupActions, {backup, restore, decryptWalletBackup} from "actions/BackupActions";
import If from "./If";
const FlatButton = require('material-ui/lib/flat-button');
var SettingsStore = require("stores/SettingsStore");
import counterpart from "counterpart";

const history = useBasename(createHashHistory)({})

@connectToStores
class CreateAccount extends React.Component {
    static getStores() {
        return [AccountStore]
    }

    static getPropsFromStores() {
        return {}
    }

    constructor() {
        super();

        super();
        this.state = {
            validAccountName: false,
            accountName: "",
            validPassword: false,
            registrar_account: "",
            loading: false,
            //hide_refcode: true,
            show_identicon: true,
            isDisclaimer: false
        };
        this.onFinishConfirm = this.onFinishConfirm.bind(this);
   }

   shouldComponentUpdate(nextProps, nextState) {
        return nextState.validAccountName !== this.state.validAccountName ||
            nextState.accountName !== this.state.accountName ||
            nextState.validPassword !== this.state.validPassword ||
            nextState.registrar_account !== this.state.registrar_account ||
            nextState.loading !== this.state.loading ||
            //nextState.hide_refcode !== this.state.hide_refcode ||
            nextState.isDisclaimer !== this.state.isDisclaimer ||
            nextState.show_identicon !== this.state.show_identicon;
    }

    componentDidMount() {
        this.refs.disclaimer.show();

    }

    isValid() {
        let first_account = AccountStore.getMyAccounts().length === 0;
        let valid = this.state.validAccountName;
        if (!WalletDb.getWallet()) valid = valid && this.state.validPassword;
        if (!first_account) valid = valid && this.state.registrar_account;
        return valid;
    }

    onAccountNameChange(e) {
         const state = {};
        if(e.valid !== undefined) this.setState({ validAccountName: e.valid })
        if(e.value !== undefined) this.setState({ accountName: e.value });
        if (!this.state.show_identicon) state.show_identicon = true;
        this.setState(state);
    }

    onPasswordChange(e) {
        this.setState({validPassword: e.valid});
    }

    onFinishConfirm(confirm_store_state) {
        if(confirm_store_state.included && confirm_store_state.broadcasted_transaction) {
            let trx_obj = confirm_store_state.broadcasted_transaction.toObject();
            let op0 = trx_obj.operations[0];
            TransactionConfirmStore.unlisten(this.onFinishConfirm);
            TransactionConfirmStore.reset();
            if(op0[0] === 5 && op0[1].name === this.state.accountName) {
                this.context.router.transitionTo("/", {account_name: this.state.accountName});
            }
        }

        this.setState({loading: false});
    }

    createAccount(name) {
        let refcode = 'bitshares-munich';//this.refs.refcode ? this.refs.refcode.value() : null;
            AccountActions.createAccount(name, this.state.registrar_account, this.state.registrar_account, 0, refcode).then(() => {

                if(this.state.registrar_account) {
                    TransactionConfirmStore.listen(this.onFinishConfirm);
                } else {

                    history.pushState(null, '/');
                    this.setState({loading: false});
                }
            }).catch(error => {
                console.log("ERROR AccountActions.createAccount", error);
                   history.pushState(null, '/');
                let error_msg = error.base && error.base.length && error.base.length > 0 ? error.base[0] : "unknown error";
                if (error.remote_ip) error_msg = error.remote_ip[0];
                notify.addNotification({
                    message: `Failed to create account: ${name} - ${error_msg}`,
                    level: "error",
                    autoDismiss: 10
                });
                this.setState({loading: false});
            });
    }

    createWallet(password) {
        return WalletActions.setWallet(
            "default", //wallet name
            password
        ).then(()=> {
            SettingsStore.rememberWalletPassword(password);
            // SettingsStore.changeSetting({setting: "currentAction", value: btoa(password) });
            this.setState({loading: false});
            console.log("Congratulations, your wallet was successfully created.");
            BackupActions.requireBackup();
        }).catch(err => {
            console.log("CreateWallet failed:", err);
            notify.addNotification({
                message: `Failed to create wallet: ${err}`,
                level: "error",
                autoDismiss: 10
            })
        });
    }

    onSubmit(e) {
        e.preventDefault();

        if (!this.isValid()) return;
        this.setState({loading: true});
        let account_name = this.refs.account_name.value();
        if (WalletDb.getWallet()) {
            this.createAccount(account_name);
        } else {
            let password = this.refs.password.state.value;
            this.createWallet(password).then(() => this.createAccount(account_name));
        }
    }

    onRegistrarAccountChange(registrar_account) {
        this.setState({registrar_account});
    }

    /*showRefcodeInput(e) {
        e.preventDefault();
        this.setState({hide_refcode: false});
    }*/

    _handleDisclaimerAgree() {
        this.refs.disclaimer.dismiss();
        this.setState({isDisclaimer: false})
    }

    _handleDisclaimerCancel() {

        if(navigator.app){
            navigator.app.exitApp();
        } else if(navigator.device){
            navigator.device.exitApp();
        }

        this.refs.disclaimer.dismiss();

        // if exist not working (iOS)
        this.setState({isDisclaimer: true})
    }

    _handleDisclaimerShow() {
        this.refs.disclaimer.show();
    }

    render() {
        let locale = IntlStore.getCurrentLocale();
        IntlActions.switchLocale(locale);
        console.log("Locale is set via CreateAccount :", locale)

        let my_accounts = AccountStore.getMyAccounts()
        let first_account = my_accounts.length === 0;
        let valid = this.isValid();
        let buttonClass = classNames("button", {disabled: !valid});

        let disclaimer_actions  = [
         <button type="button" className="primary"  onTouchTap={this._handleDisclaimerCancel.bind(this)}>{counterpart.translate("wallet.settings.cancelAndExit")} </button>,
        <button type="button" className="secondary"  onTouchTap={this._handleDisclaimerAgree.bind(this)}>{counterpart.translate("wallet.settings.iAgree")}</button>
        ];

        if (this.state.isDisclaimer === true) {

            return (
                <main className="no-nav content">
                    <FlatButton label={counterpart.translate("wallet.to_accept_agreement")}
                         onTouchTap={this._handleDisclaimerShow.bind(this)}
                         style={{width: '95%'}}
                        primary={true} />
                    <Dialog title={counterpart.translate("wallet.agreement")}
                        actions={disclaimer_actions}
                        modal={true}
                        ref="disclaimer" autoScrollBodyContent={true}>
                          <div  style={{width: '95%'}}>
                            <p>BitShares Wallet Terms and Conditions of Use</p>
                            <p>The following terminology applies to these Terms and Conditions of Use (our “Terms”), the Privacy and Transparency
                                Statement, and any and all other agreements between you and us: “Client”, “Customer”, “User”, “You” and “Your” refers to you, the person accessing the BitShares Wallet software application (“App”) and accepting our Terms. “The Company”, “BitShares”, “BitShares Munich”, “Our”, “Ourselves”, “We” and “Us” collectively refers to the App and to its owners, operators, developers, contractors, directors, officers, employees, agents, insurers, suppliers, and attorneys. “Party” refers to either you or Us. In these Terms, unless otherwise specified, words importing the singular include the plural and vice versa and words importing gender include all genders. “Digital asset”, “asset”, “coin”, “cryptocurrency”, “good”, “ledger entry”, “altcoin” and “token” refer to blockchain-based software ledger data entries.
                            </p>
                            <p>
                            By using the App, you represent and warrant that you are:
                                <ul style={{'list-style': 'initial'}}>
                                <li>at least 18 years old and have full capacity to contract under applicable law;</li>
                                <li>only transacting with the App with legally-obtained funds that belong to you;</li>
                                <li>not furthering, performing, undertaking, engaging in, aiding, or abetting any unlawful activity through your relationship with Us or through your use of the App; and,</li>
                                <li>comporting with and obeying all applicable laws.</li>
                                </ul>
                            </p>
                            <p>1. Terms<br/>
                                By accessing the App, you agree to be bound by our Terms, all applicable laws and regulations, and you agree that you are responsible for compliance with, and that you are compliant with applicable law. If you do not agree with any of our Terms, you are prohibited from using or accessing the App; your only recourse is to stop using the App. Any use of the App is your deemed acceptance of our Terms as they may be modified and amended from time to time. The materials contained in the App are protected by applicable copyright and trademark laws and treaties. You should check back often in case our Terms undergo changes.
                                By accepting our Terms, you expressly allow Us to export data outside of the jurisdiction in which you reside or are located when you access the App.
                                </p>
                            <p>2. Limitations<br/>
                            Use of the App may carry financial risk, and is to be used as an experimental software utility only.
                            In no event shall We be liable or responsible for any damages, claims, applications, losses, injuries, delays,
                            accidents, costs, business interruption costs, or other expenses (including, without limitation, attorneys’ fees or the costs of any claim or suit), nor for any incidental, direct, indirect, general, special, punitive, exemplary, or consequential damages, loss of goodwill or business profits, loss of cryptocurrency or digital assets, work stoppage, data loss, computer or device failure or malfunction, or any other commercial or other losses directly or indirectly arising out of or related to: our Terms; the Privacy and Transparency Statement; any service We provide; the use of the App; any use of your digital assets or cryptocurrency with the App by any other party not authorized by you (collectively, all of the foregoing items shall be referred to herein as “Losses”). We are hereby released by you from liability for any and all Losses. We disclaim any and all warranties or guarantees, including any warranty of merchantability and warranty of fitness for any particular purpose. The foregoing limitations of liability shall apply whether the alleged liability or Losses are based on contract, negligence, tort, strict liability, or any other basis, even if We have been advised of or should have known of the possibility of such losses and damages, and without regard to the success or effectiveness of other remedies. Notwithstanding anything else in our Terms, in no event shall the combined aggregate liability for any Loss hereunder exceed 50.00€.
                            </p>
                            <p>3. Prices, Exchange Rates, and Confirmations<br/>
                            Cryptocurrency and digital assets are highly experimental and risky. Our App attempts to provide accurate price and exchange rate information, but this information is highly volatile and can change quickly without users necessarily being aware of these changes.
                            For normal orders (i.e., not “Specific Amount” orders), the exchange rate you receive is calculated at the time your payment is accepted. Due to blockchain specifications, your payment is typically considered “accepted” at one block confirmation. We may occasionally accept a payment with zero confirmations, though this decision is at Our sole discretion. It is important to note that a payment being broadcast to the blockchain network does not constitute an acceptance by Us of that payment.
                            Users who are sensitive to the exchange rate they receive should use Our “Amount” feature, which guarantees an exchange rate for a specified period of time. The User’s payment must be received by Us within that period in order to receive the guaranteed exchange rate. Please contact Us for more information on exchange rates.
                            </p>
                            <p>4. Returns and Refund Policy<br/>
                            Cryptocurrencies, tokens, and digital assets are, by their nature, generally irreversible, and their exchange rates are highly volatile and transitory. For these reasons, customers may only receive a refund if the App has not yet sent or transmitted the User’s asset to the User’s address. Once the User’s asset has been transmitted to the User’s address, no refund is possible, even if the wrong address was provided to the App. All sales after transmission are final.
                            </p>
                            <p>5. Governing Law <br/>
                            These Terms are governed by the laws of Munich, Germany, and any and all laws applicable therein.
                            </p>
                            <p>
                            6. Prohibited Jurisdictions<br/>
                            It is prohibited to use or access cryptocurrencies and/or Digital assets from certain jurisdictions. Transactions from Users in these jurisdictions are prohibited. By accessing the App or any services therein, you represent and warrant that you are not physically located in a prohibited jurisdiction.
                            </p>
                            <p>7. Permissible Use<br/>
                            The App and all its services may be used only as a mechanism of software ledger entry translation between the User and the BitShares blockchain. You are prohibited from using the App for the purpose of translating ledger entries with other parties, with the exception of explicit payment for goods and services.
                            </p>
                            <p>8. Terms of Use Modifications<br/>
                            We may revise our Terms at any time and without notice to you or third parties. By using the App, you agree to
                            be bound by the then-current version of our Terms. We reserve the right to make any changes retroactive.
                            </p>
                            <p>9. Costs<br/>
                            From time to time, We may need to spend time dealing with issues brought to Us by customers. Where any customer issue is not caused by our negligence or oversight, We reserve the right to recover reasonable administrative costs spent addressing the customer issue.
                            Privacy and Transparency Statement
                            We respect the privacy of Users of Our App by not requesting any information that is unnecessary for the use of the service or to comport with our obligations under applicable law.
                            We also do not in any way obscure the information that it does request or obtain. Due to the inherent transparency
                            of blockchains, transactions to and from the App are public and easily correlated. Utilizing the App to obscure
                            transactions or assets in any way is futile. Law enforcement has full access to blockchain information that
                            goes in or out of the BitShares network.
                            You accept that We will comply willingly with all legal requests for information from it. We reserve the right to
                            provide information to law enforcement personnel and other third parties to answer inquiries; to respond to legal process; to respond to the order of a court of competent jurisdiction and those exercising the court’s authority; and, to protect Ourselves and our users.
                            </p>
                            <p>If you agree to these terms and conditions, please tap on the green button below.</p>
                          </div>
                    </Dialog>
                </main>
            )

        } else {

            return (
                    <section>
                      {this.state.loading ?  <LoadingIndicator type="circle"/> : null}
                      <main className="no-nav content">
                        <Dialog title={counterpart.translate("wallet.agreement")}
                        actions={disclaimer_actions}
                        modal={true}
                        ref="disclaimer" autoScrollBodyContent={true}>
                          <div  style={{width: '95%'}}>
                            <p>BitShares Wallet Terms and Conditions of Use</p>
                            <p>The following terminology applies to these Terms and Conditions of Use (our “Terms”), the Privacy and Transparency
                                Statement, and any and all other agreements between you and us: “Client”, “Customer”, “User”, “You” and “Your” refers to you, the person accessing the BitShares Wallet software application (“App”) and accepting our Terms. “The Company”, “BitShares”, “BitShares Munich”, “Our”, “Ourselves”, “We” and “Us” collectively refers to the App and to its owners, operators, developers, contractors, directors, officers, employees, agents, insurers, suppliers, and attorneys. “Party” refers to either you or Us. In these Terms, unless otherwise specified, words importing the singular include the plural and vice versa and words importing gender include all genders. “Digital asset”, “asset”, “coin”, “cryptocurrency”, “good”, “ledger entry”, “altcoin” and “token” refer to blockchain-based software ledger data entries.
                            </p>
                            <p>
                            By using the App, you represent and warrant that you are:
                                <ul>
                                <li>at least 18 years old and have full capacity to contract under applicable law;</li>
                                <li>only transacting with the App with legally-obtained funds that belong to you;</li>
                                <li>not furthering, performing, undertaking, engaging in, aiding, or abetting any unlawful activity through your relationship with Us or through your use of the App; and,</li>
                                <li>comporting with and obeying all applicable laws.</li>
                                </ul>
                            </p>
                            <p>1. Terms<br/>
                                By accessing the App, you agree to be bound by our Terms, all applicable laws and regulations, and you agree that you are responsible for compliance with, and that you are compliant with applicable law. If you do not agree with any of our Terms, you are prohibited from using or accessing the App; your only recourse is to stop using the App. Any use of the App is your deemed acceptance of our Terms as they may be modified and amended from time to time. The materials contained in the App are protected by applicable copyright and trademark laws and treaties. You should check back often in case our Terms undergo changes.
                                By accepting our Terms, you expressly allow Us to export data outside of the jurisdiction in which you reside or are located when you access the App.
                                </p>
                            <p>2. Limitations<br/>
                            Use of the App may carry financial risk, and is to be used as an experimental software utility only.
                            In no event shall We be liable or responsible for any damages, claims, applications, losses, injuries, delays,
                            accidents, costs, business interruption costs, or other expenses (including, without limitation, attorneys’ fees or the costs of any claim or suit), nor for any incidental, direct, indirect, general, special, punitive, exemplary, or consequential damages, loss of goodwill or business profits, loss of cryptocurrency or digital assets, work stoppage, data loss, computer or device failure or malfunction, or any other commercial or other losses directly or indirectly arising out of or related to: our Terms; the Privacy and Transparency Statement; any service We provide; the use of the App; any use of your digital assets or cryptocurrency with the App by any other party not authorized by you (collectively, all of the foregoing items shall be referred to herein as “Losses”). We are hereby released by you from liability for any and all Losses. We disclaim any and all warranties or guarantees, including any warranty of merchantability and warranty of fitness for any particular purpose. The foregoing limitations of liability shall apply whether the alleged liability or Losses are based on contract, negligence, tort, strict liability, or any other basis, even if We have been advised of or should have known of the possibility of such losses and damages, and without regard to the success or effectiveness of other remedies. Notwithstanding anything else in our Terms, in no event shall the combined aggregate liability for any Loss hereunder exceed 50.00€.
                            </p>
                            <p>3. Prices, Exchange Rates, and Confirmations<br/>
                            Cryptocurrency and digital assets are highly experimental and risky. Our App attempts to provide accurate price and exchange rate information, but this information is highly volatile and can change quickly without users necessarily being aware of these changes.
                            For normal orders (i.e., not “Specific Amount” orders), the exchange rate you receive is calculated at the time your payment is accepted. Due to blockchain specifications, your payment is typically considered “accepted” at one block confirmation. We may occasionally accept a payment with zero confirmations, though this decision is at Our sole discretion. It is important to note that a payment being broadcast to the blockchain network does not constitute an acceptance by Us of that payment.
                            Users who are sensitive to the exchange rate they receive should use Our “Amount” feature, which guarantees an exchange rate for a specified period of time. The User’s payment must be received by Us within that period in order to receive the guaranteed exchange rate. Please contact Us for more information on exchange rates.
                            </p>
                            <p>4. Returns and Refund Policy<br/>
                            Cryptocurrencies, tokens, and digital assets are, by their nature, generally irreversible, and their exchange rates are highly volatile and transitory. For these reasons, customers may only receive a refund if the App has not yet sent or transmitted the User’s asset to the User’s address. Once the User’s asset has been transmitted to the User’s address, no refund is possible, even if the wrong address was provided to the App. All sales after transmission are final.
                            </p>
                            <p>5. Governing Law <br/>
                            These Terms are governed by the laws of Munich, Germany, and any and all laws applicable therein.
                            </p>
                            <p>
                            6. Prohibited Jurisdictions<br/>
                            It is prohibited to use or access cryptocurrencies and/or Digital assets from certain jurisdictions. Transactions from Users in these jurisdictions are prohibited. By accessing the App or any services therein, you represent and warrant that you are not physically located in a prohibited jurisdiction.
                            </p>
                            <p>7. Permissible Use<br/>
                            The App and all its services may be used only as a mechanism of software ledger entry translation between the User and the BitShares blockchain. You are prohibited from using the App for the purpose of translating ledger entries with other parties, with the exception of explicit payment for goods and services.
                            </p>
                            <p>8. Terms of Use Modifications<br/>
                            We may revise our Terms at any time and without notice to you or third parties. By using the App, you agree to
                            be bound by the then-current version of our Terms. We reserve the right to make any changes retroactive.
                            </p>
                            <p>9. Costs<br/>
                            From time to time, We may need to spend time dealing with issues brought to Us by customers. Where any customer issue is not caused by our negligence or oversight, We reserve the right to recover reasonable administrative costs spent addressing the customer issue.
                            Privacy and Transparency Statement
                            We respect the privacy of Users of Our App by not requesting any information that is unnecessary for the use of the service or to comport with our obligations under applicable law.
                            We also do not in any way obscure the information that it does request or obtain. Due to the inherent transparency
                            of blockchains, transactions to and from the App are public and easily correlated. Utilizing the App to obscure
                            transactions or assets in any way is futile. Law enforcement has full access to blockchain information that
                            goes in or out of the BitShares network.
                            You accept that We will comply willingly with all legal requests for information from it. We reserve the right to
                            provide information to law enforcement personnel and other third parties to answer inquiries; to respond to legal process; to respond to the order of a court of competent jurisdiction and those exercising the court’s authority; and, to protect Ourselves and our users.
                            </p>
                            <p>If you agree to these terms and conditions, please tap on the green button below.</p>
                          </div>
                    </Dialog>
                        <div className="page-header">
                            <h3>{counterpart.translate("wallet.acnt_createRegisterOrImport")}  </h3>
                        </div>
                            <form className="register-form" onSubmit={this.onSubmit.bind(this)} noValidate>
                                <div className="form-group">
                                    <AccountImage className="contact-image" account={this.state.validAccountName ? this.state.accountName:null}/>
                                </div>
                                <AccountNameInput ref="account_name" cheapNameOnly={first_account}
                                                  onChange={this.onAccountNameChange.bind(this)}
                                                  accountShouldNotExist={true}/>

                                {WalletDb.getWallet() ?
                                    null :
                                    <PasswordInput ref="password" confirmation={true} onChange={this.onPasswordChange.bind(this)}/>
                                }
                                {
                                    first_account ? null : (
                                        <div className="full-width-content form-group">
                                            <label><Translate content="account.pay_from" /></label>
                                            <AccountSelect account_names={my_accounts}
                                                onChange={this.onRegistrarAccountChange.bind(this)}/>
                                        </div>)
                                }
                                <RaisedButton type="submit" label={counterpart.translate("wallet.create")} secondary={true} />
                                <br/>
                                <br/>
                                <label className="inline"><Link to="existing-account">{counterpart.translate("wallet.existing_account")}</Link></label>
                            </form>
                      </main>
                      </section>
            );
        }


    }
}

export default CreateAccount;
