import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import 'react-virtualized/styles.css';
import { AutoSizer } from 'react-virtualized';
import { Table, Column } from 'react-virtualized';
import Avatar from '@material-ui/core/Avatar';
import Draggable from 'react-draggable';
import Server from '../server';
import Playback from '../playback';

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
		paddingRight: theme.spacing(3)
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

const TOTAL_WIDTH = window.innerWidth;

class Collection extends Component {
	defaultDesktopColumns = {
		title: {
			dataKey: 'title',
			label: 'Title',
			display: true,
			width: 0.15
		},
		artists: {
			dataKey: 'artists',
			label: 'Artists',
			display: true,
			width: 0.15
		},
		album: {
			dataKey: 'album',
			label: 'Album',
			display: true,
			width: 0.1
		},
		genres: {
			dataKey: 'genres',
			label: 'Genre',
			display: true,
			width: 0.1
		},
		year: {
			dataKey: 'year',
			label: 'Year',
			display: true,
			width: 0.1
		},
		duration: {
			dataKey: 'duration',
			label: 'Duration',
			display: true,
			width: 0.1
		},
		bpm: {
			dataKey: 'bpm',
			label: 'BPM',
			display: true,
			width: 0.05
		},
		size: {
			dataKey: 'size',
			label: 'Size',
			display: true,
			width: 0.05
		},
		path: {
			dataKey: 'path',
			label: 'Path',
			display: false,
			width: 0.15
		}
	};
	defaultMobileColumns = {
		title: {
			dataKey: 'title',
			label: 'Title',
			display: true,
			width: 0.30
		},
		artists: {
			dataKey: 'artists',
			label: 'Artists',
			display: true,
			width: 0.25
		},
		album: {
			dataKey: 'album',
			label: 'Album',
			display: true,
			width: 0.35
		},
		genres: {
			dataKey: 'genres',
			label: 'Genre',
			display: false,
			width: 0.1
		},
		year: {
			dataKey: 'year',
			label: 'Year',
			display: false,
			width: 0.1
		},
		duration: {
			dataKey: 'duration',
			label: 'Duration',
			display: false,
			width: 0.1
		},
		bpm: {
			dataKey: 'bpm',
			label: 'BPM',
			display: false,
			width: 0.05
		},
		size: {
			dataKey: 'size',
			label: 'Size',
			display: false,
			width: 0.05
		},
		path: {
			dataKey: 'path',
			label: 'Path',
			display: false,
			width: 0.15
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
	minWidth = 5;

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

		const localStorageRefColumns = localStorage.getItem(
			'columnsConfig-' + this.collectionID
		);

		//needs to check if width is super different
		if (localStorageRefColumns && window.innerWidth > 768) {
			this.setState({ columns: JSON.parse(localStorageRefColumns) });
			this.setState({ renderTableHeader: true });
			this.setState({ headerHeight: 30 });
		} else {
			if (window.innerWidth < 768) {
				this.setState({ columns: this.defaultMobileColumns });
				this.setState({ renderTableHeader: false });
				this.setState({ headerHeight: 0 });
			} else {
				this.setState({ columns: this.defaultDesktopColumns });
				this.setState({ renderTableHeader: true });
				this.setState({ headerHeight: 30 });
			}
		}

		if (Playback.getActive()) {
			this.setState({ playingTrack: Playback.getCurrentMediaItem() });
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

	getFileSizeCellData = ({ cellData }) => {
		let fileSize = cellData;
		if (fileSize > 1024 && fileSize < 1048576) {
			return (fileSize / 1024).toFixed(2) + ' KB';
		} else if (fileSize > 1048576) {
			return (fileSize / 1048576).toFixed(2) + ' MB';
		}
	};

	getDurationCellData = ({ cellData }) => {
		var duration = cellData;
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

	updateDisplayedColumns = newColumns => {
		this.setState({ columns: newColumns });
		localStorage.setItem(
			'columnsConfig-' + this.collectionID,
			JSON.stringify(newColumns)
		);
	};

	renderColumnSelectionHeader = () => {
		if (this.state.renderTableHeader) {
			return (
				<ColumnSelection
					columns={this.state.columns}
					updateDisplayedColumns={this.updateDisplayedColumns}
				/>
			);
		} else {
			return null;
		}
	};

	renderDraggableHeader = ({
		dataKey,
		label,
	}) => {
		return (
			<React.Fragment key={dataKey}>
				<div className="ReactVirtualized__Table__headerTruncatedText">
					{label}
				</div>
				<Draggable
					axis="x"
					defaultClassName="DragHandle"
					defaultClassNameDragging="DragHandleActive"
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
					<span>⋮</span>
				</Draggable>
			</React.Fragment>
		);
	};

	resizeRow = ({ dataKey, deltaX }) => {
		return this.setState(prevState => {
			const prevColumns = prevState.columns;
			const percentDelta = deltaX / TOTAL_WIDTH;

			// const nextDataKey = dataKey === "name" ? "location" : "description";

			const dataKeys = Object.keys(this.state.columns);
			const nextDataKey =
				dataKeys[
					dataKeys.findIndex(element => {
						return dataKey === element;
					}) + 1
				];

			if (nextDataKey) {
				const column = prevColumns[dataKey];
				column.width = prevColumns[dataKey].width + percentDelta;

				const nextColumn = prevColumns[nextDataKey];
				nextColumn.width = prevColumns[nextDataKey].width - percentDelta;

				return {
					columns: {
						...prevColumns,
						[dataKey]: column,
						[nextDataKey]: nextColumn
					}
				};
			} else {
				const column = prevColumns[dataKey];
				column.width = prevColumns[dataKey].width + percentDelta;

				return {
					columns: {
						...prevColumns,
						[dataKey]: column
					}
				};
			}
		});
	};

	handleTrackClick = ({ rowData }) => {
		//@TODO implement track list selection
		Playback.playMediaItem(rowData);
		this.setState({ playingTrack: rowData });
	};

	renderTextCell = ({
		cellData,
		dataKey,
		rowData
	}) => {
		if (dataKey === 'duration') {
			cellData = this.getDurationCellData({ cellData });
		} else if (dataKey === 'artists') {
			cellData = this.getArtistCellData({ rowData });
		} else if (dataKey === 'size') {
			cellData = this.getFileSizeCellData({ cellData });
		}

		if (rowData.db_id === this.state.playingTrack.db_id) {
			return <strong>{cellData}</strong>;
		} else {
			return cellData;
		}
	};

	renderDynamicColumns = (columns, classes) => {
		const { headerHeight } = this.state;
		const tableColumns = [];
		for (const column in columns) {
			tableColumns.push(
				columns[column].display ? (
					<Column
						width={columns[column].width * TOTAL_WIDTH}
						headerHeight={headerHeight}
						cellRenderer={this.renderTextCell}
						label={columns[column].label}
						flexGrow={columns[column].flexGrow}
						flexShrink={columns[column].flexShrink}
						dataKey={columns[column].dataKey}
						className={classes.cell}
						headerRenderer={this.renderDraggableHeader}
					/>
				) : null
			);
		}

		return tableColumns;
	};

	render() {
		const { classes } = this.props;
		const { headerHeight } = this.state;
		const { columns } = this.state;

		return (
			<div className={classes.root}>
				<AutoSizer>
					{({ height, width }) => (
						<Table
							width={width}
							height={height}
							className={classes.table}
							gridClassName={classes.grid}
							disableHeader={this.state.renderTableHeader === false}
							headerHeight={headerHeight}
							rowHeight={48}
							rowCount={this.state.tracks.length}
							rowGetter={({ index }) => this.state.tracks[index]}
							rowClassName={classes.row}
							onRowClick={this.handleTrackClick}
						>
							<Column
								label=""
								dataKey="artworkURL"
								className={classes.cellArtwork}
								width={60}
								flexGrow={0}
								flexShrink={0}
								cellRenderer={this.renderArtwork}
							/>

							{this.renderDynamicColumns(columns, classes)}

							{/*Column Selection Empty Column */}
							{this.state.renderTableHeader ? (
								<Column
									headerRenderer={this.renderColumnSelectionHeader}
									width={45}
									flexGrow={0}
									flexShrink={0}
									dataKey=""
									className={classes.cellInLastColumn}
								/>
							) : null}
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
