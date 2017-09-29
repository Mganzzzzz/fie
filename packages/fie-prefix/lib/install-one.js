'use strict';

const home = require('fie-home');
const npm = require('fie-npm');
const log = require('fie-log')('fie-module');
const utils = require('./utils');
const cache = require('fie-cache');

function* installOne(name, options) {

  const prefix = utils.modPrefix();
  console.log(name,options);

  let pureName = '';
  options = Object.assign({}, {
    type: 'install'
  }, options);
  name = utils.fullName(name);
  //匹配套件名称，其中需要判断前缀是否是自定义的
  const match = name.match(/^(@ali\/)?([A-Za-z0-9_-]*)-(toolkit|plugin)-/);
  //判断逻辑：前缀存在 且 前缀为自定义设置的 或者前缀是fie
  if (!(match && match[2] && (match[2] === prefix || match[2] === 'fie'))) {
    log.error('您传入的包名有误，请输入正确的包名，如： toolkit-blue，plugin-git');
    return;
  }

  if (!/^(@ali\/)?.+@.+$/.test(name)) {
    // 没带版本号
    pureName = name;
    if (options.lastPkg && options.lastPkg.version) {
      name += `@${options.lastPkg.version}`;
    } else {
      name += '@latest';
    }
  } else {
    pureName = name.split('@');
    pureName.pop();
    pureName = pureName.join('@');
  }

  // 开始安装
  log.debug(`开始安装 ${name}`);
  yield npm.install(name, {
    cwd: home.getHomePath()
  });

  // 设置缓存, 1小时内不再检查
  cache.set(`${utils.UPDATE_CHECK_PRE}${pureName}`, true, {
    expires: utils.NO_TIP_PERIOD
  });

  // 提示安装成功
  if (options.type === 'install') {
    log.success(`${name} 安装成功`);
    return;
  }

  log.success(`${name} 更新成功`);
  // 打印更新日志
  if (!options.lastPkg) {
    options.lastPkg = yield npm.latest(pureName);
  }
  if (!options.lastPkg) {
    return;
  }
  utils.updateLog(name, {
    localPkg: options.localPkg,
    lastPkg: options.lastPkg,
    level: 'success'
  });
}

module.exports = installOne;