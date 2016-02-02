/*jslint node: true, esversion: 6 */
"use strict";

const assert = require('assert');
const Async = require('async');
const Path = require('path');

const debug = require('debug')('upnpserver:repositories:Directory');
const logger = require('../logger');

const Repository = require('./repository');
const PathRepository = require('./pathRepository');
const Node = require('../node');

const AudioItem = require('../class/object.item.audioItem');
const VideoItem = require('../class/object.item.videoItem');
const ImageItem = require('../class/object.item.imageItem');

const BROWSE_FILES_LIMIT = 4;

class DirectoryRepository extends PathRepository {

  /**
   * 
   */
  constructor(mountPath, path, searchClasses) {

    if (searchClasses === undefined) {
      searchClasses = [ {
        name : AudioItem.UPNP_CLASS,
        includeDerived : true
      }, {
        name : ImageItem.UPNP_CLASS,
        includeDerived : true
      }, {
        name : VideoItem.UPNP_CLASS,
        includeDerived : true
      } ];
    }

    super(mountPath, path, searchClasses);
  }
  
  get type() {
    return "directory";
  }

  /**
   * 
   */
  browse(list, node, options, callback) {
    assert(node instanceof Node, "Invalid node parameter");
    assert(typeof(callback)==="function", "Invalid callback parameter");

    debug("Browse of #",node.id,"path=",node.path,"mountPath=",this.mountPath);

    if (node.path.indexOf(this.mountPath) !== 0) {
      return callback();
    }

    node.takeLock("scanner", () => {

      var itemPath = node.path;
      var path = itemPath.substring(this.mountPath.length);
      var contentProvider = this.contentProvider;

      this._addSearchClasses(node);

      if (path) {
        path = "/" + path.replace(/^\//, '');
      }

      path = this.directoryPath + path;

      debug("browse #", node.id, "nodePath=", itemPath, "diskPath=", path);

      node.mapChildrenByTitle((error, map) => {
        if (error) {
          node.leaveLock("scanner");
          
          logger.error("Can not map node #"+node.id, error);
          return callback(null);
        }

        contentProvider.readdir(path, (error, files) => {
          if (error) {
            if (error.code === "ENOENT") {
              // It can be a virtual folder!

              debug("browse: ENOENT for " + path);

              node.leaveLock("scanner");
              return callback(null);
            }

            if (error.code === "EACCES") {
              // No right to read Folder

              logger.error("DirectoryRepository: Can not read directory " + path);
              node.leaveLock("scanner");
              return callback(null);
            }

            logger.error("DirectoryRepository: Error for " + path, error);
            node.leaveLock("scanner");
            return callback(error);
          }

          debug("browse: path=" , path, "returns length=" + files.length);

          Async.eachLimit(files, BROWSE_FILES_LIMIT, (file, callback) => {

            var p = file;
            contentProvider.stat(p, (error, stats) => {
              debug("browse: child=",p,"stats=",stats);
              if (error) {
                logger.error("Stat error for ", p, error);
                return callback(null, list); // Access problem ...
              }

              if (stats.isDirectory()) {
                this.addDirectory(node, map, p, stats, (error, node) => {
                  if (error) {
                    logger.error("Stat add directory error for ", p, error);
                    return callback(error);
                  }

                  if (node) {
                    list.push(node);
                  }
                  callback();
                });
                return;
              }

              if (stats.isFile()) {
                this.addFile(node, map, p, stats, (error, node) => {

                  // console.log("Add item '" + p + "' returns ", node);

                  if (error) {
                    if (error.code === Repository.UPNP_CLASS_UNKNOWN) {
                      return callback();
                    }
                    logger.error("Stat add file error for ", p, error);
                    return callback(error);
                  }

                  if (node) {
                    list.push(node);
                  }
                  callback();
                });
                return;
              }

              logger.warn("Unsupported file '" + p + "' ", stats);
              callback();
            });

          }, (error) => {
            node.leaveLock("scanner");

            if (error) {
              return callback(error);
            }

            debug("browse: END browse=", itemPath, " path=", path,
                " list.length=", list.length);
            callback(null, list);
          });
        });
      });
    });
  }

  /**
   * 
   */
  _addSearchClasses(node) {
    if (!this.searchClasses) {
      return;
    }

    this.searchClasses.forEach((sc) => node.addSearchClass(sc.name, sc.includeDerived));
  }

  /**
   * 
   */
  addDirectory(parentNode, map, contentURL, stats, callback) {
    var name = stats.name;
    if (!name) {
      var ret = /\/([^/]+$)/.exec(contentURL); // We can not use basename, because of Win32
      name = (ret && ret[1]) || name;
    }

    var nodesIdsByTitle=map[name];
    
    var found;
    Async.detectLimit(nodesIdsByTitle, 2, (nodeId, callback) => {
        parentNode.service.getNodeById(nodeId, (error, node) => {
          if (error) {
            logger.error("Can not getNodeById #", nodeId, error);
            return callback(false);
          }
          
          if (node.contentURL === contentURL && stats.isDirectory() && node.isContainer) {

            debug("File ALREADY EXISTS #", node.id, "contentURL=", node.contentURL);

            return callback(true);
          }
          
          callback(false);
        });
    }, (result) => {
      if (result) {
        return callback(null, result);
      }

      this.newFolder(parentNode, contentURL, null, stats, callback);
    });
  }

  /**
   * 
   */
  addFile(parentNode, map, contentURL, stats, callback) {
    var name = stats.name;
    if (!name) {
      var ret = /\/([^/]+$)/.exec(contentURL); // We can not use basename, because of Win32
      name = (ret && ret[1]) || name;
    }
    
    var nodesIdsByTitle=map[name];
    
    var found;
    Async.detectLimit(nodesIdsByTitle, 2, (nodeId, callback) => {
        parentNode.service.getNodeById(nodeId, (error, node) => {
          if (error) {
            logger.error("Can not getNodeById #",nodeId, error);
            return callback(false);
          }
          
          if (node.contentURL === contentURL &&
              node.contentTime === stats.mtime.getTime() && stats.isFile() && !node.isContainer) {

            debug("File ALREADY EXISTS #", node.id, "contentURL=", node.contentURL);

            return callback(true);
          }
                    
          callback(false);
        });
    }, (result) => {
      if (result) {
        return callback(null, result);
      }

      this.newFile(parentNode, contentURL, null, stats,  null, false, null, callback);     
    });
  }
}

module.exports = DirectoryRepository;