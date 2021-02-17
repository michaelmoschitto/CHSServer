#!/bin/bash

cp ../connectionCLASSDB ./connection.json
cp ../../instructor/CHS/V0/JSServer/package.json .
cp ../../instructor/CHS/V0/JSServer/tsconfig.json .
npm install
cd JSServer/Src 
tsc 
cd ../built 
node main.js -p 4015&
cd ../../
newman run CHSV1.postman.json -e environment.json > out.txt