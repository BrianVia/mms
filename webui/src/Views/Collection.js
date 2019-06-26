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
				<TrackCollection classes={this.props.classes} collectionID={this.props.collectionID} tracks={this.props.tracks} search={this.props.search} searchTerm={this.props.searchTerm}></TrackCollection>
			</div>
		);
	}
}

Collection.propTypes = {
	classes: PropTypes.object.isRequired,
	collectionID: PropTypes.string,
	search: PropTypes.bool,
	searchTerm: PropTypes.string,
};

export default withStyles(styles)(Collection);