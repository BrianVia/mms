import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles, withTheme } from '@material-ui/core/styles';


import Input from '@material-ui/core/Input';
// import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemText from '@material-ui/core/ListItemText';
import Checkbox from '@material-ui/core/Checkbox';
import Select from '@material-ui/core/Select';
import List from '@material-ui/icons/List';

const styles = theme => ({
	width: '50px',
	listIconStyle: {
		position: 'absolute',
		top: '0',
		right: '0',
		display: 'inline-block',
		color: '#000',
		width: '40px',
		height: '40px',
		pointerEvents: 'none',
	}

});

class ColumnSelection extends Component {

	state = {
		displayedColumns: []
	}

	onColumnSelectionChange = (e, child) => {
		let newColumns = this.props.columns;
		newColumns[child.key].display = !newColumns[child.key].display;
		this.props.updateDisplayedColumns(newColumns);
	};

	componentDidMount = () => {
		console.log(this.props);
	}

	render() {
		const { classes } = this.props;
		console.log(classes);

		return (


			<Select
				IconComponent={() =>
					<List className={classes.listIconStyle} />
				}
				value={this.state.displayedColumns}
				multiple
				onChange={this.onColumnSelectionChange}
				input={<Input id="select-multiple-checkbox" />}
				renderValue={selected => selected.join(", ")}

			>
				{Object.keys(this.props.columns).map(key => (
					<MenuItem
						key={this.props.columns[key].name}
						value={this.props.columns[key].display}
					>
						<Checkbox checked={this.props.columns[key].display} />
						<ListItemText primary={this.props.columns[key].label} />
					</MenuItem>
				))}
			</Select>

		)
	}

}

ColumnSelection.propTypes = {
	columns: PropTypes.object.isRequired,
	classes: PropTypes.object.isRequired
}

export default withTheme()(withStyles(styles)(ColumnSelection));