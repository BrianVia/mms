//@ts-check
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import Typography from '@material-ui/core/Typography';

import Server from 'server';

const styles = {
	card: {}
};

class Playlist extends Component {
	state = {
		playlistsArray: [],
		playlistsTree: {}
	};

	componentDidMount = () => {
		this.getPlaylists();
	}

	getPlaylists = async () => {
		Server.getPlaylists().then(playlists => {
			this.setState({ playlistsArray: playlists });
			this.transformPlaylistsArray(playlists);
		});
	}

	transformPlaylistsArray = (playlists) => {

	}

	getPlaylistContent = async (playlist_guid) => {
		return Server.getPlaylistContent(playlist_guid)
			.then(tracks => {
				return tracks;
			});
	}

	render() {
		const { classes } = this.props;

		return (
			<Grid container justify="center">
				<Grid item>

				</Grid>
			</Grid>
		);
	}
}

Playlist.propTypes = {
	classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Playlist);
