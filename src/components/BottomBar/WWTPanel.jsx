import React, { Component } from 'react';
import Popover from '../common/Popover/Popover';
import Button from '../common/Input/Button/Button';
import Picker from './Picker';
import MaterialIcon from '../common/MaterialIcon/MaterialIcon';
import Input from '../common/Input/Input/Input';
import CenteredLabel from '../common/CenteredLabel/CenteredLabel';
import Row from '../common/Row/Row';
import ScrollOverlay from '../common/ScrollOverlay/ScrollOverlay';
import FilterList from '../common/FilterList/FilterList';
import SkybrowserFocusEntry from './Origin/SkybrowserFocusEntry';
import propertyDispatcher from '../../api/propertyDispatcher';
import Checkbox from '../common/Input/Checkbox/Checkbox';
// Import the module
import { kdTree } from "kd-tree-javascript";

import {
  setPopoverVisibility,
  selectImgSkyBrowser
} from '../../api/Actions';

import {
  NavigationAnchorKey,
  NavigationAimKey,
  RetargetAnchorKey,
} from '../../api/keys';

import { connect } from 'react-redux';

import styles from './WWTPanel.scss';

import PropertyOwner from '../Sidebar/Properties/PropertyOwner'
import subStateToProps from '../../utils/subStateToProps';

class WWTPanel extends Component {

  constructor(props) {
    super(props);
    this.state = {
      imageName: undefined,
      showOnlyNearest: false,
    };
    this.togglePopover = this.togglePopover.bind(this);
    this.onSelect = this.onSelect.bind(this);
    this.getAllImages = this.getAllImages.bind(this);
    this.getNearestImages = this.getNearestImages.bind(this);
  }

  togglePopover() {
    this.props.setPopoverVisibility(!this.props.popoverVisible)
  }

  updateimageName(evt) {
    this.setState({
      imageName: evt.target.value
    });
  }

  onSelect(identifier, evt) {
    this.setState({
      imageName: identifier,
    });
    this.props.selectImage(identifier);
  }

  getAllImages() {
    if(this.props.systemList == null) return {};
    return this.props.systemList;
  }

  getNearestImages() {
    let targetPoint = {RA: 1, Dec: 1};
    let searchRadius = 5;
    let maxNoOfImages = 100

    // Only load images that have coordinates for this mode
    let imgDataWithCoords = this.props.systemList.filter(function(img) {
      if(img["HasCoords"] == false) {
        return false; // skip
      }
      return true;
    })

    var distance = function(a, b){
      // Account for wrap-around at 0 & 360 degrees
      let RA_dist = Math.abs(a.RA - b.RA);
      if(RA_dist > 180) {
        RA_dist = 360 - RA_dist;
      }
      return Math.pow(RA_dist, 2) +  Math.pow(a.Dec - b.Dec, 2);
    }

    var tree = new kdTree(imgDataWithCoords, distance, ["RA", "Dec"]);
    var result = tree.nearest(targetPoint, maxNoOfImages, [searchRadius]);

    let nearestImages = result.map( function(item, index) {
      return {"name" : item[0]["name"] , "identifier":  item[0]["identifier"] , "key":  item[0]["key"], "url": item[0]["url"] };
    });

    return nearestImages;
  }

  get popover() {
    const imageNameLabel = <span>Image name</span>;

    let imageList = this.state.showOnlyNearest ? this.getNearestImages() : this.getAllImages();

   let filterList = <FilterList
     data={imageList}
     className={styles.list}
     searchText={"Search from " + imageList.length.toString() + " images..."}
     viewComponent={SkybrowserFocusEntry}
     onSelect={this.onSelect}
     active={this.state.imageName}
     searchAutoFocus
   />;
   const textFormatLabel = <span>Show only near images</span>;
    return (
      <Popover
        className={Picker.Popover}
        title="WorldWide Telescope"
        closeCallback={this.togglePopover}
        detachable
        attached={true}
      >
        <div className={Popover.styles.content}>
        <Picker onClick={() => this.setState({ showOnlyNearest: false })}>
            <div>
              <MaterialIcon className={styles.photoIcon} icon="list_alt" />
            </div>
          </Picker>
        <Picker onClick={() => this.setState({ showOnlyNearest: true })}>
            <div>
              <MaterialIcon className={styles.photoIcon} icon="my_location" />
            </div>
          </Picker>
            <Checkbox
              checked={this.state.showOnlyNearest}
              label={textFormatLabel}
              setChecked={() => this.setState({ showOnlyNearest: ! this.state.showOnlyNearest })}
            />

        {filterList}
        </div>
      </Popover>
    );
  }

  render() {
    const { popoverVisible, hasSystems } = this.props;

    return (
      <div className={Picker.Wrapper}>
        {<Picker onClick={this.togglePopover}>
            <div>
              <MaterialIcon className={styles.photoIcon} icon="picture_in_picture" />
            </div>
          </Picker>
        }
        {popoverVisible && this.popover }
      </div>
    );
  }
}

const mapSubStateToProps = ({propertyOwners, popoverVisible, luaApi, skybrowserData}) => {

  return {
    popoverVisible: popoverVisible,
    luaApi: luaApi,
    systemList: skybrowserData,
    hasSystems: (skybrowserData && skybrowserData.length > 0),
  }
};

const mapStateToSubState = (state) => ({
  propertyOwners: state.propertyTree.propertyOwners,
  popoverVisible: state.local.popovers.skybrowser.visible,
  luaApi: state.luaApi,
  skybrowserData: state.skybrowser.data,
});


const mapDispatchToProps = dispatch => ({
  setPopoverVisibility: visible => {
    dispatch(setPopoverVisibility({
      popover: 'skybrowser',
      visible
    }));
  },
  selectImage: (imgName) => {
    dispatch(selectImgSkyBrowser({
      imgName
    }));
  },
})

WWTPanel = connect(
  subStateToProps(mapSubStateToProps, mapStateToSubState),
  mapDispatchToProps
)(WWTPanel);

export default WWTPanel;
