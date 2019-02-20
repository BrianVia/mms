import React, { Component } from 'react';
//import PropTypes from 'prop-types';
import { withStyles, withTheme } from '@material-ui/core/styles';


import Input from '@material-ui/core/Input';
// import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import ListItemText from '@material-ui/core/ListItemText';
import Checkbox from '@material-ui/core/Checkbox';
import Select from '@material-ui/core/Select';
import List from '@material-ui/icons/List';

const styles = theme => ({
    width: '50px'
});

class ColumnSelection extends Component {

    state = {
        displayedColumns: []
    }

    render() {

        return (
            <div>
                <FormControl>
                    <Select
                        IconComponent={() => (
                            <List />
                          )}>
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
                </FormControl>
            </div>
        )
    }

}

export default withTheme()(withStyles(styles)(ColumnSelection));