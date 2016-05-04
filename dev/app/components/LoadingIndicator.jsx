import React from "react";
const CircularProgress = require('material-ui/lib/circular-progress');

class LoadingIndicator extends React.Component {

    constructor(props) {
        super(props);
        this.state = {progress: 0};
    }

    render() {
        return (
        <div className="preloader">
            <CircularProgress mode="indeterminate" color={"rgb(16, 150, 208)"} size={1.5}/>
        </div>
        );
    }

}

export default LoadingIndicator;
