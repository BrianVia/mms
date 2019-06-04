//@ts-check
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import Typography from '@material-ui/core/Typography';

import arrayToTree from 'array-to-tree';

import Server from 'server';
import { Paper, List, ListItem, ListItemLink, ListItemText, Link } from '@material-ui/core';

import PlaylistCollection from '../Views/Collection';

const styles = {
	card: {}
};

class Playlist extends Component {
	state = {
		playlistsArray: [],
		playlistsTree: [],
		selectedPlaylist: null,
		selectedPlaylistTracks: []
	};

	componentDidMount = () => {
		this.getPlaylists();
	}

	getPlaylists = () => {
		Server.getPlaylists().then(playlists => {
			this.setState({ playlistsArray: playlists });
			this.transformPlaylistsArray(playlists);
		});
	}

	// ListItemLink = (props) => {
	// 	const { to, open, ...other } = props;
	// 	const primary = breadcrumbNameMap[to];

	// 	return (
	// 		<li>
	// 			<ListItem button component={RouterLink} to={to} {...other}>
	// 				<ListItemText primary={primary} />
	// 				{open != null ? open ? <ExpandLess /> : <ExpandMore /> : null}
	// 			</ListItem>
	// 		</li>
	// 	);
	// }

	transformPlaylistsArray = (playlists) => {
		// console.table(playlists);
		let playlistsTree = arrayToTree(playlists, { parentProperty: 'parent_guid', childrenProperty: 'children', customID: 'guid' });
		this.setState({
			playlistsTree: playlistsTree
		});


	}


	getPlaylistContent = (playlist_guid) => {
		return Server.getPlaylistContent(playlist_guid)
			.then(tracks => {
				console.log(tracks);
				this.setState({ selectedPlaylistTracks: tracks });
				return tracks;
			});
	}

	handlePlaylistClick = (playlist) => {
		this.getPlaylistContent(playlist.guid);
		this.setState({ selectedPlaylist: playlist });
	}


	render() {
		const { classes } = this.props;

		return (
			<Grid container justify="flex-start">
				<Grid item>
					<List>
						{this.state.playlistsTree.map((playlist) => {
							return <ListItem key={playlist.guid}>
								<Link onClick={() => this.handlePlaylistClick(playlist)}>{playlist.name}</Link>
							</ListItem>;
						})}
					</List>
				</Grid>
				<Grid item>
					<PlaylistCollection></PlaylistCollection>
				</Grid>
			</Grid>
		);
	}
}

Playlist.propTypes = {
	classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Playlist);
