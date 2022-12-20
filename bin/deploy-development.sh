#/bin/bash

#build
cd ..
ng build -c development

#upload files
aws s3 cp ./dist/Frontend s3://bc-frontend-development --recursive --acl public-read
