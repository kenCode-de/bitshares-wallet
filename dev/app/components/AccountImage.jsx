import React from "react";
import Identicon from "./Identicon";
import Gravatar from "./Gravatar";
import {PropTypes, Component} from "react";

class AccountImage extends Component {

    render() {
        let {account, image, email} = this.props;
        let {height, width} = this.props.size;
        let custom_image = image ?
            <img src={image} height={height + "px"} width={width + "px"}/> :
            email && email.length!=0?
            <Gravatar id={account} email={email} size={this.props.size}/> :
            <Identicon id={account} account={account} size={this.props.size}/>;
        return (
            <div className={this.props.className}>
                {custom_image}
            </div>
        )
    }
}

AccountImage.defaultProps = {
    src: "",
    account: "",
    size: {height: 20, width: 20}
};

AccountImage.propTypes = {
    src: PropTypes.string,
    account: PropTypes.string,
    size: PropTypes.object.isRequired
};

export default AccountImage;
