import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import 'react-virtualized/styles.css';
import { AutoSizer } from 'react-virtualized';
import { Table, Column } from 'react-virtualized';
import Avatar from '@material-ui/core/Avatar';
import Draggable from 'react-draggable';

import Server from 'server';
import Playback from 'playback';
import {
	subscribeCollectionSort,
	subscribeCollectionChangeFilters,
	getCollectionFilters
} from 'actions';

import ColumnSelection from '../Fragments/ColumnSelection';

const styles = theme => ({
	root: {
		position: 'absolute', // For correct positioning of the virtual table
		left: 0,
		top: 0,
		right: 0,
		bottom: 0,
		overflow: 'hidden'
	},
	table: {
		boxSizing: 'border-box',
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
		cursor: 'pointer'
	},
	artwork: {
		width: '100%',
		height: '100%',
		objectFit: 'contain',
		objectPosition: 'center center',
		maxWidth: '100%',
		maxHeight: '100%'
	},
	cellArtwork: {
		padding: '2px 0px 2px 0px',
		height: 48 // Not sure why this is needed explicitly here, otherwise image is offset few pixels up
	},
	cell: {
		textAlign: 'left',
		padding: '4px 2px 4px 4px'
	},
	cellRight: {
		textAlign: 'right',
		padding: '4px 10px 4px 4px'
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
		borderBottom: 'none'
	},
	footer: {
		borderTop: `1px solid ${theme.palette.text.divider}`
	},
	albumAvatar: {
		margin: 4
	}
});

class Collection extends Component {

	defaultDesktopColumns = {
		title: {
			name: 'title',
			label: 'Title',
			display: true,
			width: 100,
			nextKey: 'artists'
		},
		artists: {
			name: 'artists',
			label: 'Artists',
			display: true,
			width: 100,
			nextKey: 'album'
		},
		album: {
			name: 'album',
			label: 'Album',
			display: true,
			width: 100,
			nextKey: 'genres'
		},
		genres: {
			name: 'genres',
			label: 'Genres',
			display: true,
			width: 50,
			nextKey: 'year'
		},
		year: {
			name: 'year',
			label: 'Year',
			display: true,
			width: 30,
			nextKey: 'duration'
		},
		duration: {
			name: 'duration',
			label: 'Duration',
			display: true,
			width: 15,
			nextKey: 'bpm'
		},
		bpm: {
			name: 'bpm',
			label: 'BPM',
			display: true,
			width: 50,
			nextKey: 'size'
		},
		size: {
			name: 'size',
			label: 'Size',
			display: true,
			width: 50,
			nextKey: 'path'
		},
		path: {
			name: 'path',
			label: 'Path',
			display: false,
			width: 0,
			nextKey: ''
		}
	};
	defaultMobileColumns = {
		title: {
			name: 'title',
			label: 'Title',
			display: true,
			width: 100,
			nextKey: 'artists'
		},
		artists: {
			name: 'artists',
			label: 'Artists',
			display: true,
			width: 100,
			nextKey: 'album'
		},
		album: {
			name: 'album',
			label: 'Album',
			display: true,
			width: 100,
			nextKey: 'genres'
		},
		genres: {
			name: 'genres',
			label: 'Genres',
			display: false,
			width: 0,
			nextKey: 'year'
		},
		year: {
			name: 'year',
			label: 'Year',
			display: false,
			width: 0,
			nextKey: 'duration'
		},
		duration: {
			name: 'duration',
			label: 'Duration',
			display: false,
			width: 0,
			nextKey: 'bpm'
		},
		bpm: {
			name: 'bpm',
			label: 'BPM',
			display: false,
			width: 0,
			nextKey: 'size'
		},
		size: {
			name: 'size',
			label: 'Size',
			display: false,
			width: 0,
			nextKey: 'path'
		},
		path: {
			name: 'path',
			label: 'Path',
			display: false,
			width: 0,
			nextKey: ''
		}

	};

	state = {
		tracks: [],
		headerHeight: 30,
		displayedColumns: [],
		renderTableHeader: true,
		playingTrack: {},
		columns: this.defaultDesktopColumns
	};
	collectionID = null;
	sort = null;
	filters = [];
	minWidth= 5;


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

		const localStorageRefColumns = localStorage.getItem('columnsConfig-' + this.collectionID);

		if (localStorageRefColumns) {
			this.setState({ columns: JSON.parse(localStorageRefColumns) });
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

		if (Playback.getActive()) {
			this.setState({ playingTrack: Playback.getCurrentMediaItem() });
		}

		// console.log(this.state.columns.artists.display);
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
			var min = String(Math.trunc(duration / 60) + ':');
			var sec = String(Math.trunc(duration % 60));
			while (sec.length < 2) sec = '0' + sec;
			return min + sec;
		} else return '';
	};

	renderArtwork = ({ rowData }) => {
		if (rowData.artworkURL)
			return (
				<img
					src={rowData.artworkURL}
					alt='artwork'
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
		this.setState({ columns: newColumns });

		localStorage.setItem('columnsConfig-' + this.collectionID, JSON.stringify(newColumns));
	};

	renderColumnSelectionHeader = () => {
		console.log(this.state.columns);
		if (this.state.renderTableHeader) {
			return (
				<ColumnSelection columns={this.state.columns} updateDisplayedColumns={this.updateDisplayedColumns} />
			);
		} else {
			return null;
		}
	};

	renderDraggableHeader = ({
		columnData,
		dataKey,
		disableSort,
		label,
		sortBy,
		sortDirection
	}) => {
		return (
			<React.Fragment key={dataKey}>
				<div className='ReactVirtualized__Table__headerTruncatedText'>
					{label}
				</div>
				<Draggable
					axis='x'
					defaultClassName='DragHandle'
					defaultClassNameDragging='DragHandleActive'
					onDrag={(event, { deltaX }) =>
						this.resizeRow({
							event,
							dataKey,
							deltaX
						})
					}
					position={{ x: 0 }}
					zIndex={999}
				>
					<span className='DragHandleIcon'>⋮</span>
				</Draggable>
			</React.Fragment>
		);
	};

	resizeRow = ({ event, dataKey, deltaX }) => {
		this.setState(prevState => {
			const columns = prevState.columns;
			let newColumns = columns;
			newColumns[dataKey].width = columns[dataKey].width + deltaX;
			newColumns[newColumns[dataKey].nextKey].width = columns[columns[dataKey].nextKey].width - deltaX;

			return {
				columns: newColumns
			};

		});
	};


	handleTrackClick = ({ event, index, rowData }) => {
		//@TODO implement track list selection
		Playback.playMediaItem(rowData);
		this.setState({ playingTrack: rowData });
	};

	renderTextCell = ({ cellData, rowData }) => {
		if (rowData.db_id === this.state.playingTrack.db_id) {
			return (<strong>{cellData}</strong>);
		} else {
			return cellData;
		}
	}

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


							<Column
								label='Artwork'
								dataKey='artworkURL'

								className={classes.cellArtwork}
								width={60}
								flexGrow={0}
								flexShrink={0}
								cellRenderer={this.renderArtwork}
							/>


							{this.state.columns.title.display ? (
								<Column
									label='Track Title'
									dataKey='title'
									cellRenderer={this.renderTextCell}
									headerHeight={headerHeight}
									className={classes.cell}
									width={this.state.columns.title.width}
									flexGrow={10}
									flexShrink={20}
								/>
							) : null}
							{this.state.columns.artists.display ? (
								<Column
									label={this.state.columns.artists.label}
									dataKey='artists'
									cellRenderer={this.renderTextCell}
									width={this.state.columns.artists.width}
									flexGrow={10}
									flexShrink={20}
									className={classes.cell}
									cellDataGetter={this.getArtistCellData}
								/>
							) : null}
							{this.state.columns.album.display ? (
								<Column
									label='Album'
									dataKey='album'
									cellRenderer={this.renderTextCell}
									width={this.state.columns.album.width}
									flexGrow={10}
									flexShrink={20}
									className={classes.cell}
								/>
							) : null}
							{this.state.columns.genres.display ? (
								<Column
									label='Genres'
									dataKey='genres'
									cellRenderer={this.renderTextCell}
									width={this.state.columns.genres.width}
									flexGrow={10}
									flexShrink={20}
									className={classes.cell}
								/>
							) : null}
							{this.state.columns.year.display ? (
								<Column
									label='Year'
									dataKey='year'
									cellRenderer={this.renderTextCell}
									width={this.state.columns.year.width}
									flexGrow={10}
									flexShrink={20}
									className={classes.cell}
								/>
							) : null}
							{this.state.columns.duration.display ? (
								<Column
									label='Duration'
									dataKey='duration'
									cellRenderer={this.renderTextCell}
									width={this.state.columns.duration.width}
									flexGrow={20}
									flexShrink={20}
									className={classes.cell}
									cellDataGetter={this.getDurationCellData}
								/>
							) : null}
							{this.state.columns.bpm.display ? (
								<Column
									label='BPM'
									dataKey='bpm'
									cellRenderer={this.renderTextCell}
									width={this.state.columns.bpm.width}
									flexGrow={10}
									flexShrink={20}
									className={classes.cell}
								/>
							) : null}
							{this.state.columns.size.display ? (
								<Column
									label='File Size'
									dataKey='size'
									cellRenderer={this.renderTextCell}
									width={this.state.columns.size.width}
									flexGrow={10}
									flexShrink={20}
									className={classes.cell}
									cellDataGetter={this.getFileSizeCellData}
								/>
							) : null}
							{this.state.columns.path.display ? (
								<Column
									label='Path'
									dataKey='path'
									cellRenderer={this.renderTextCell}
									width={this.state.columns.path.width}
									flexGrow={40}
									flexShrink={20}
									className={classes.cell}
								/>
							) : null}

							{/*Column Selection Empty Column */}
							{this.state.renderTableHeader ? (<Column
								headerRenderer={this.renderColumnSelectionHeader}
								width={45}
								flexGrow={0}
								flexShrink={0}
								dataKey=''
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
