const fs = require('fs');
const parse = require('csv-parse');
const lbModel = require("./Model/loopback-model.json");
const mkdirp = require('mkdirp');
const args = process.argv;
const { resolve } = require('path');

const firstPropertyTitleColumn = "Text Area 1";
const firstEntityTitleColumn = "Name";
let modelNameTitlePos = 0;
let entityNameTitlePos = 0;
let jsonObjects = [];

if (args.length != 3) {
  return;
}

const knowColTitlesPositions = (row) => {
  for (let i = 0; i < row.length; i++) {
    const title = row[i];
    if (title === firstPropertyTitleColumn) {
      modelNameTitlePos = i;
    }
    if (title === firstEntityTitleColumn) {
      entityNameTitlePos = i;
    }
  }
};

const buildObject = (intanceModel, row) => {

  for (let i = 0; i < row.length; i++) {
    if (modelNameTitlePos === i) {
      intanceModel.name = row[i];
    }
    if (modelNameTitlePos < i && row[i] === "" && row[i + 2]) {
      let properties = Object.assign({}, intanceModel.properties);
      properties[`${row[i + 1]}`] = { type: row[i + 2] };
      intanceModel.properties = properties;
    }
    if (row.length - 1 === i) {
      jsonObjects.push(intanceModel);
    }
  }

};

const createJSONs = (jsonObjects) => {
  mkdirp.sync('./output');
  jsonObjects.forEach(object => {
    let data = JSON.stringify(object, null, 2);
    fs.writeFile(`./output/${object.name}.json`, data, (err) => {
      if (err) throw err;
      const file = fs.createWriteStream(
        resolve(`./output/${object.name}.js`)
      );
      file.write(`'use strict';\n`);
      file.write(`module.exports = function(Action) {\n\n`);
      file.write(`};`);
      file.end();
    });
  });
}

fs.createReadStream(args[2])
  .pipe(parse({ delimiter: ',' }))
  .on('data', function (csvrow) {
    let intanceModel = Object.assign({}, lbModel);
    let firstColTitle = csvrow[0];

    if (firstColTitle === "Id") {
      knowColTitlesPositions(csvrow);
    } else {
      if (csvrow[entityNameTitlePos] === "Entity") {
        buildObject(intanceModel, csvrow);
      }
    }
  })
  .on('end', function () {
    createJSONs(jsonObjects);
  });