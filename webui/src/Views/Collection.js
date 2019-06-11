import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/styles';

import TrackCollection from '../Fragments/TrackCollection';


const styles = theme => ({});

class Collection extends Component {

	componentDidMount = () => { }

	componentDidUpdate = () => {
	}

	render() {
		return (
			<div>
				<TrackCollection collectionID={this.props.collectionID}></TrackCollection>
			</div>
		);
	}
}

Collection.PropTypes = {
	collectionID: PropTypes.string
};

export default withStyles(styles)(Collection);