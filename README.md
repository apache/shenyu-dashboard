# Apache ShenYu Dashboard

![build](https://github.com/apache/shenyu-dashboard/workflows/build/badge.svg)


## Overview
Apache ShenYu Dashboard is frontend of a management background for [Apache ShenYu](https://github.com/apache/shenyu). The API interface is in the [Apache Shenyu Admin](https://github.com/apache/shenyu/tree/master/shenyu-admin) module.
                                                                                                   
## Prerequisite
- node v8.0+

## How to Build

### Configuration

Modify the api url for different environment, eg: `http://192.168.1.100:8000`


### Develop Environment

```shell
# install dependencies in this project root path.
npm install
# start
npm start
```

### Production Environment

```shell
# install dependencies in this project root path.
npm install
# build for production
npm run build

# copy to apache-shenyu-admin
cp -rf dist/* shenyu-admin/src/main/resources/static/
```

