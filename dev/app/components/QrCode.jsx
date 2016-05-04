import React from "react";
import qr from "common/qr-image";

class QrCode extends React.Component {

    constructor(props) {
      super(props);
    }

    shouldComponentUpdate(nextProps) {
      return this.props.data !== nextProps.data
    }

    render() {
        var svg_string = qr.imageSync(this.props.data, { type: 'svg' })
        return <div>
            <img  onClick={this.props.onClick.bind(null, this)} dangerouslySetInnerHTML={{__html: svg_string}} />
        </div>
    }
}