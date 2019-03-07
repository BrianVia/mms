import React, { Component } from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import "react-virtualized/styles.css";
import { AutoSizer } from "react-virtualized";
import { Table, Column } from "react-virtualized";
import Avatar from "@material-ui/core/Avatar";


import Server from "server";
import Playback from "playback";
import {
	subscribeCollectionSort,
	subscribeCollectionChangeFilters,
	getCollectionFilters
} from "actions";

import ColumnSelection from "../Fragments/ColumnSelection";

const styles = theme => ({
	root: {
		position: "absolute", // For correct positioning of the virtual table
		left: 0,
		top: 0,
		right: 0,
		bottom: 0,
		overflow: "hidden"
	},
	table: {
		boxSizing: "border-box",
		border: `0px solid ${theme.palette.divider}`,
		fontSize: theme.typography.pxToRem(14),
		color: theme.palette.text.primary
	},
	grid: {
		outline: 0
	},
	row: {
		borderBottom: `1px solid ${theme.palette.divider}`,
		outline: 0,
		cursor: "pointer"
	},
	artwork: {
		width: "100%",
		height: "100%",
		objectFit: "contain",
		objectPosition: "center center",
		maxWidth: "100%",
		maxHeight: "100%"
	},
	cellArtwork: {
		padding: "2px 0px 2px 0px",
		height: 48 // Not sure why this is needed explicitly here, otherwise image is offset few pixels up
	},
	cell: {
		textAlign: "left",
		padding: "4px 2px 4px 4px"
	},
	cellRight: {
		textAlign: "right",
		padding: "4px 10px 4px 4px"
	},
	cellHeader: {
		fontSize: theme.typography.pxToRem(12),
		fontWeight: theme.typography.fontWeightMedium,
		color: theme.palette.text.secondary
	},
	cellInLastColumn: {
		paddingRight: theme.spacing.unit * 3
	},
	cellInLastRow: {
		borderBottom: "none"
	},
	footer: {
		borderTop: `1px solid ${theme.palette.text.divider}`
	},
	albumAvatar: {
		margin: 4
	}
});

class Collection extends Component {
	state = {
		tracks: [],
		headerHeight: 30,
		displayedColumns: [],
		renderTableHeader: false,
		columns: {
			title: {
				name: "title",
				label: "Title",
				display: true,
				width: 200
			},
			artist: {
				name: "artist",
				label: "Artist",
				display: true,
				width: 150
			},
			album: {
				name: "album",
				label: "Album",
				display: true,
				width: 100
			},
			duration: {
				name: "duration",
				label: "Duration",
				display: true,
				width: 20
			},
			genre: {
				name: "genre",
				label: "Genre",
				display: true,
				width: 50
			},
			year: {
				name: "year",
				label: "Year",
				display: true,
				width: 30
			},
			bpm: {
				name: "bpm",
				label: "BPM",
				display: true,
				width: 30
			},
			path: {
				name: "path",
				label: "Path",
				display: false,
				width: 40
			},
			size: {
				name: "size",
				label: "Size",
				display: true,
				width: 40
			}
		}
	};
	collectionID = null;
	sort = null;
	filters = [];
	defaultDesktopColumns = {
		title: {
			name: "title",
			label: "Title",
			display: true,
			width: 200
		},
		artist: {
			name: "artist",
			label: "Artist",
			display: true,
			width: 150
		},
		album: {
			name: "album",
			label: "Album",
			display: true,
			width: 200
		},
		duration: {
			name: "duration",
			label: "Duration",
			display: true,
			width: 20
		},
		genre: {
			name: "genre",
			label: "Genre",
			display: true,
			width: 50
		},
		year: {
			name: "year",
			label: "Year",
			display: true,
			width: 30
		},
		bpm: {
			name: "bpm",
			label: "BPM",
			display: true,
			width: 30
		},
		path: {
			name: "path",
			label: "Path",
			display: false,
			width: 40
		},
		size: {
			name: "size",
			label: "Size",
			display: true,
			width: 40
		}
	};
	defaultMobileColumns = {
		title: {
			name: "title",
			label: "Title",
			display: true,
			width: 100
		},
		artist: {
			name: "artist",
			label: "Artist",
			display: true,
			width: 100
		},
		album: {
			name: "album",
			label: "Album",
			display: true,
			width: 100
		},
		duration: {
			name: "duration",
			label: "Duration",
			display: false,
			width: 0
		},
		genre: {
			name: "genre",
			label: "Genre",
			display: false,
			width: 0
		},
		year: {
			name: "year",
			label: "Year",
			display: false,
			width: 0
		},
		bpm: {
			name: "bpm",
			label: "BPM",
			display: false,
			width: 0
		},
		path: {
			name: "path",
			label: "Path",
			display: false,
			width: 0
		},
		size: {
			name: "size",
			label: "Size",
			display: false,
			width: 0
		}
	}

	updateContent = () => {
		this.setState({ tracks: [] });
		if (this.props.search) {
			Server.search(this.props.searchTerm, this.sort, this.filters).then(
				tracklist => this.setState({ tracks: tracklist })
			);
		} else {
			Server.getTracklist(this.collectionID, this.sort, this.filters).then(
				tracklist => this.setState({ tracks: tracklist })
			);
		}
	};

	componentDidMount = () => {
		this.collectionID = this.props.collectionID;
		this.filters = getCollectionFilters();
		this.updateContent();
		subscribeCollectionSort(this.handleChangeSort);
		subscribeCollectionChangeFilters(this.handleChangeFilters);

		const localStorageRefColumns = localStorage.getItem('columns');

		if (localStorageRefColumns) {
			this.setState({ columns: JSON.parse(localStorageRefColumns) })
		} else {
			if (window.innerWidth < 768) {
				this.setState({ columns: this.defaultMobileColumns });
				this.setState({ renderTableHeader: false });
				this.setState({ headerHeight: 0 });
			} else {
				this.setState({ columns: this.defaultDesktopColumns });
				this.setState({ renderTableHeader: true });

			}
		}
	};

	componentDidUpdate = prevProps => {
		if (
			this.props.collectionID !== prevProps.collectionID ||
			this.props.search !== prevProps.search ||
			this.props.searchTerm !== prevProps.searchTerm
		) {
			this.collectionID = this.props.collectionID;
			this.updateContent();
		}
	};

	handleChangeSort = data => {
		this.sort = data.newSort;
		this.updateContent();
	};

	handleChangeFilters = data => {
		this.filters = data.filters;
		this.updateContent();
	};

	getArtistCellData = ({ rowData }) => {
		if (rowData.artists) return rowData.artists.join('; ');
		else return '';
	};

	getFileSizeCellData = ({ rowData }) => {
		let fileSize = rowData.size;
		if (fileSize > 1024 && fileSize < 1048576) {
			return (fileSize / 1024).toFixed(2) + ' KB';
		} else if (fileSize > 1048576) {
			return (fileSize / 1048576).toFixed(2) + ' MB';
		}
	};

	getDurationCellData = ({ rowData }) => {
		var duration = rowData.duration;
		if (duration >= 0) {
			var min = String(Math.trunc(duration / 60) + ":");
			var sec = String(Math.trunc(duration % 60));
			while (sec.length < 2) sec = "0" + sec;
			return min + sec;
		} else return '';
	};

	renderArtwork = ({ rowData }) => {
		if (rowData.artworkURL)
			return (
				<img
					src={rowData.artworkURL}
					alt="artwork"
					className={this.props.classes.artwork}
				/>
			);
		else {
			var short = (rowData.album || '').slice(0, 2);
			return (
				<Avatar className={this.props.classes.albumAvatar}>{short}</Avatar>
			);
		}
	};

	updateDisplayedColumns = (newColumns) => {

		this.setState({ columns: newColumns })
		localStorage.setItem('columns', JSON.stringify(newColumns));

	}

	renderColumnSelectionHeader = () => {
		if (this.state.renderTableHeader) {
			return (
				<ColumnSelection columns={this.state.columns} updateDisplayedColumns={this.updateDisplayedColumns} />
			);
		} else {
			return null;
		}

	};


	handleTrackClick = ({ rowData, e }) => {
		Playback.playMediaItem(rowData);
	};

	render() {
		const { classes } = this.props;
		const { headerHeight } = this.state;

		return (
			<div className={classes.root}>
				<AutoSizer>
					{({ height, width }) => (
						<Table
							width={width}
							height={height}
							className={classes.table}
							gridClassName={classes.grid}
							disableHeader={headerHeight === 0}
							headerHeight={headerHeight}
							rowHeight={48}
							rowCount={this.state.tracks.length}
							rowGetter={({ index }) => this.state.tracks[index]}
							rowClassName={classes.row}
							onRowClick={this.handleTrackClick}
						>
							{
								this.state.renderTableHeader ? (
									<Column
										label="Artwork"
										dataKey="artworkURL"
										className={classes.cellArtwork}
										width={48}
										flexGrow={0}
										flexShrink={0}
										cellRenderer={this.renderArtwork}
									/>
								) : null
							}
							{this.state.columns.title.display ? (
								<Column
									label="Track Title"
									dataKey="title"
									headerHeight={headerHeight}
									className={classes.cell}
									width={this.state.columns.title.width}
									flexGrow={10}
								/>
							) : null}
							{this.state.columns.artist.display ? (
								<Column
									label="Artist"
									dataKey="artists"
									width={this.state.columns.artist.width}
									flexGrow={10}
									className={classes.cell}
									cellDataGetter={this.getArtistCellData}
								/>
							) : null}
							{this.state.columns.album.display ? (
								<Column
									label="Album"
									dataKey="album"
									width={this.state.columns.album.width}
									flexGrow={10}
									className={classes.cell}
								/>
							) : null}
							{this.state.columns.genre.display ? (
								<Column
									label="Genre"
									dataKey="genres"
									width={this.state.columns.genre.width}
									flexGrow={10}
									className={classes.cell}
								/>
							) : null}
							{this.state.columns.year.display ? (
								<Column
									label="Year"
									dataKey="year"
									width={this.state.columns.year.width}
									flexGrow={10}
									className={classes.cell}
								/>
							) : null}
							{this.state.columns.duration.display ? (
								<Column
									label="Duration"
									dataKey="duration"
									width={this.state.columns.duration.width}
									flexGrow={20}
									flexShrink={0}
									className={classes.cellRight}
									cellDataGetter={this.getDurationCellData}
								/>
							) : null}
							{this.state.columns.bpm.display ? (
								<Column
									label="BPM"
									dataKey="bpm"
									width={this.state.columns.bpm.width}
									flexGrow={10}
									flexShrink={0}
									className={classes.cell}
								/>
							) : null}
							{this.state.columns.size.display ? (
								<Column
									label="File Size"
									dataKey="size"
									width={this.state.columns.size.width}
									flexGrow={10}
									flexShrink={0}
									className={classes.cell}
									cellDataGetter={this.getFileSizeCellData}
								/>
							) : null}
							{this.state.columns.path.display ? (
								<Column
									label="Path"
									dataKey="path"
									width={this.state.columns.path.width}
									flexGrow={40}
									flexShrink={0}
									className={classes.cell}
								/>
							) : null}

							{/*Column Selection Empty Column */}
							{this.state.renderTableHeader ? (<Column
								headerRenderer={this.renderColumnSelectionHeader}
								width={45}
								flexGrow={0}
								flexShrink={0}
								dataKey=""
								className={classes.cell}
							/>) : null}
						</Table>
					)}
				</AutoSizer>
			</div>
		);
	}

}

Collection.propTypes = {
	classes: PropTypes.object.isRequired,
	collectionID: PropTypes.string,
	search: PropTypes.bool,
	searchTerm: PropTypes.string
};

export default withStyles(styles)(Collection);
