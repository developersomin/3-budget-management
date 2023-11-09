FROM node:18

COPY ./package.json /api/
COPY ./yarn.lock /api/
WORKDIR /api/
RUN yarn install

COPY . /api/

CMD yarn start:dev