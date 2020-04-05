import {
  getDepartmentTree,
  pageUser,
  addUser,
  getUserById,
  updateUser,
  enableUser,
  resetUserPassword,
  deleteUser,
  deleteBatchUser,
  listUserRole,
  grantUserRole,
} from './service';

export default {
  namespace: 'systemUser',

  state: {
    tree: [],
    // 列表及分页
    list: [],
    pagination: {},
    // 编辑
    user: {},
    // 角色树、选中的keys
    treeData: [],
    checkedKeys: [],
  },

  effects: {
    *fetchTree({ payload, callback }, { call, put }) {
      const response = yield call(getDepartmentTree, payload);
      const { apierror } = response;
      if (apierror) {
        return;
      }
      yield put({
        type: 'saveTree',
        payload: {
          tree: response,
        },
      });
      if (callback) callback();
    },
    *fetch({ payload, callback }, { call, put }) {
      const response = yield call(pageUser, payload);
      const { apierror } = response;
      if (apierror) {
        return;
      }
      const { list, pageNum: current, pageSize, total } = response;
      const newList = list.map((item) => ({ ...item, status: !!item.status }));
      yield put({
        type: 'saveList',
        payload: {
          list: newList,
          pagination: { current, pageSize, total },
        },
      });
      if (callback) callback();
    },
    *add({ payload, callback }, { call, put }) {
      const { values, searchParams } = payload;
      const params = { ...values, status: +values.status };
      const response = yield call(addUser, params);
      const { apierror } = response;
      if (apierror) {
        return;
      }
      yield put({
        type: 'fetch',
        payload: {
          ...searchParams,
          current: 1,
        },
      });
      if (callback) callback();
    },
    *fetchById({ payload, callback }, { call, put }) {
      const { id } = payload;
      const response = yield call(getUserById, id);
      const { apierror } = response;
      if (apierror) {
        return;
      }
      const user = {
        ...response,
        status: !!response.status,
        departmentId: response.departmentId.toString(),
      };
      yield put({
        type: 'save',
        payload: {
          user,
        },
      });
      if (callback) callback();
    },
    *update({ payload, callback }, { call, put }) {
      const { values, searchParams } = payload;
      const params = { ...values, status: +values.status };
      const response = yield call(updateUser, params);
      const { apierror } = response;
      if (apierror) {
        return;
      }
      yield put({
        type: 'fetch',
        payload: {
          ...searchParams,
        },
      });
      if (callback) callback();
    },
    *enable({ payload, callback }, { call, put }) {
      const { id, status, searchParams } = payload;
      const params = { id, status: +status };
      const response = yield call(enableUser, params);
      const { apierror } = response;
      if (apierror) {
        return;
      }
      yield put({
        type: 'fetch',
        payload: {
          ...searchParams,
        },
      });
      if (callback) callback();
    },
    *reset({ payload, callback }, { call }) {
      const response = yield call(resetUserPassword, payload);
      const { apierror } = response;
      if (apierror) {
        return;
      }
      if (callback) callback();
    },
    *delete({ payload, callback }, { call, put }) {
      const { id, searchParams } = payload;
      const response = yield call(deleteUser, id);
      const { apierror } = response;
      if (apierror) {
        return;
      }
      yield put({
        type: 'fetch',
        payload: {
          ...searchParams,
        },
      });
      if (callback) callback();
    },
    *deleteBatch({ payload, callback }, { call, put }) {
      const { ids, searchParams } = payload;
      const response = yield call(deleteBatchUser, ids);
      const { apierror } = response;
      if (apierror) {
        return;
      }
      yield put({
        type: 'fetch',
        payload: {
          ...searchParams,
        },
      });
      if (callback) callback();
    },
    *fetchRoleTree({ payload, callback }, { call, put }) {
      const response = yield call(listUserRole, payload);
      const { apierror } = response;
      if (apierror) {
        return;
      }
      const { roleTree, roleSelected } = response;
      yield put({
        type: 'saveRoleTree',
        payload: {
          treeData: roleTree,
          checkedKeys: roleSelected.map((item) => item.id.toString()),
        },
      });
      if (callback) callback();
    },
    *grantUserRole({ payload, callback }, { call }) {
      const response = yield call(grantUserRole, payload);
      const { apierror } = response;
      if (apierror) {
        return;
      }
      if (callback) callback();
    },
  },

  reducers: {
    saveTree(state, { payload }) {
      const { tree } = payload;
      return {
        ...state,
        tree,
      };
    },
    clearTree(state) {
      return {
        ...state,
        tree: [],
      };
    },
    saveList(state, { payload }) {
      const { list, pagination } = payload;
      return {
        ...state,
        list,
        pagination,
      };
    },
    clearList(state) {
      return {
        ...state,
        list: [],
        pagination: {},
      };
    },
    save(state, { payload }) {
      const { user } = payload;
      return {
        ...state,
        user,
      };
    },
    clear(state) {
      return {
        ...state,
        user: {},
      };
    },
    saveRoleTree(state, { payload }) {
      const { treeData, checkedKeys } = payload;
      return {
        ...state,
        treeData,
        checkedKeys,
      };
    },
    clearRoleTree(state) {
      return {
        ...state,
        treeData: [],
        checkedKeys: [],
      };
    },
  },
};
