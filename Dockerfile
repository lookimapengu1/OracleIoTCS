FROM ubuntu:16.04


WORKDIR /iot-js/
RUN apt-get update -y && apt-get install -y curl && \
 curl -sL https://deb.nodesource.com/setup_6.x | bash && \
 apt-get install -y nodejs build-essential && \
 npm install -g npm && \
 apt-get install -y bluetooth bluez libbluetooth-dev libudev-dev && \
 npm install -g nodemon && \
 npm install node-forge && \
 npm install jsdoc && npm install noble
ENV NODE_MODULES_PATH /usr/local/lib/node_modules
ENV NODE_PATH /usr/local/lib/node_modules
COPY . .
#CMD ["/iot-js/iot/csl/js/samples/run-device-node-sample.sh", "HelloWorldSample.js", "/iot-js/iot/csl/js/samples/urn_test_helloworld3", "Iot12345"]
