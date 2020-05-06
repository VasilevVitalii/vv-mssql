//@ts-check

const builder = require('jsdoc-to-markdown')
const path = require('path')
const fs = require('fs')
const os = require('os')

let path_result = path.dirname(__dirname)
let file_result = path.join(path_result, 'readme.md')

let template = [
    '{{#functions}}',
    '* ### {{name}}',
    '{{description}}',
    '{{>params~}}',
    '{{/functions}}'
].join(os.EOL)

if (fs.existsSync(file_result)) {
    fs.unlinkSync(file_result)
}

fs.copyFileSync(path.join(__dirname, '.readme.welcome.md'), file_result)

let data = ''
data = os.EOL.concat(fs.readFileSync(path.join(__dirname, '.readme.subsystem_connection.md'), {encoding: 'utf8'}))
fs.appendFileSync(file_result, data, {encoding: 'utf8'})

data = os.EOL.concat('## Functions', os.EOL, builder.renderSync({files: path.join(path.join(path_result, 'connection', 'app.js')), headingDepth: 4, template: template}))
fs.appendFileSync(file_result, data, {encoding: 'utf8'})

data = fs.readFileSync(path.join(path.join(path_result, 'connection', '@type.js')), {encoding: 'utf8'}).replace("{function('actual'|'estimate')}","{function}")
data = os.EOL.concat(builder.renderSync({source: data, headingDepth: 4}))
fs.appendFileSync(file_result, data, {encoding: 'utf8'})

console.log('README BUILD DONE')

