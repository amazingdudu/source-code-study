import { POP } from './Actions';

// 创建location对象
function createLocation(path='/', state=null, action=POP, key=null) {
  var index = path.indexOf('?');
  // 拆分pathname和search
  var pathname, search;
  if (index !== -1) {
    pathname = path.substring(0, index);
    search = path.substring(index);
  } else {
    pathname = path;
    search = '';
  }

  if (pathname === '')
    pathname = '/';

  return {
    pathname,
    search,
    state,
    action,
    key
  };
}

export default createLocation;
