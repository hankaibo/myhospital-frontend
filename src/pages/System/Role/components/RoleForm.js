import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Switch, TreeSelect, Button, message } from 'antd';
import { connect } from 'umi';
import { isEmpty } from 'lodash';
import styles from '../../System.less';

const RoleForm = connect(({ systemRole: { tree, role }, loading }) => ({
  tree,
  role,
  loading: loading.effects[('systemRole/fetchById', 'systemRole/add', 'systemRole/update')],
}))(({ loading, children, isEdit, id, searchParams, role, tree, dispatch }) => {
  const [form] = Form.useForm();
  const { resetFields, setFieldsValue } = form;

  // 【模态框显示隐藏属性】
  const [visible, setVisible] = useState(false);

  // 【模态框显示隐藏函数】
  const showModalHandler = (e) => {
    if (e) e.stopPropagation();
    setVisible(true);
  };
  const hideModelHandler = () => {
    resetFields();
    setVisible(false);
  };

  // 【修改时，获取角色表单数据】
  useEffect(() => {
    if (visible && isEdit) {
      dispatch({
        type: 'systemRole/fetchById',
        payload: {
          id,
        },
      });
    }
    return () => {
      dispatch({
        type: 'systemRole/clear',
      });
    };
  }, [visible, isEdit, id, dispatch]);

  // 【修改时，回显角色表单】
  useEffect(() => {
    // 👍 将条件判断放置在 effect 中
    if (visible && isEdit) {
      if (!isEmpty(role)) {
        const formData = { ...role, parentId: role.parentId.toString() };
        setFieldsValue(formData);
      }
    }
  }, [visible, isEdit, role, setFieldsValue]);

  // 【新建时】
  useEffect(() => {
    if (visible && !isEdit) {
      if (id) {
        setFieldsValue({ parentId: id.toString() });
      }
    }
  }, [visible, isEdit, tree, setFieldsValue]);

  // 【添加与修改角色】
  const handleAddOrUpdate = (values) => {
    if (isEdit) {
      Object.assign(values, { id });
      dispatch({
        type: 'systemRole/update',
        payload: {
          values,
          searchParams,
        },
        callback: () => {
          hideModelHandler();
          message.success('角色修改成功。');
        },
      });
    } else {
      dispatch({
        type: 'systemRole/add',
        payload: {
          values,
          searchParams,
        },
        callback: () => {
          hideModelHandler();
          message.success('角色添加成功。');
        },
      });
    }
  };

  // 【表单布局】
  const layout = {
    labelCol: {
      xs: { span: 24 },
      sm: { span: 5 },
    },
    wrapperCol: {
      xs: { span: 24 },
      sm: { span: 19 },
    },
  };
  const tailLayout = {
    wrapperCol: {
      xs: { offset: 0, span: 24 },
      sm: { offset: 5, span: 19 },
    },
  };

  return (
    <>
      <span onClick={showModalHandler}>{children}</span>
      <Modal
        forceRender
        destroyOnClose
        title={isEdit ? '修改' : '新增'}
        visible={visible}
        onCancel={hideModelHandler}
        footer={null}
      >
        <Form
          {...layout}
          form={form}
          name="roleForm"
          className={styles.form}
          initialValues={{
            status: true,
          }}
          onFinish={handleAddOrUpdate}
        >
          <Form.Item
            label="名称"
            name="name"
            rules={[
              {
                required: true,
                message: '请将名称长度保持在1至20字符之间！',
                min: 1,
                max: 20,
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="父角色"
            name="parentId"
            rules={[{ required: false, message: '请选择一个父角色！' }]}
          >
            <TreeSelect
              dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
              treeData={tree}
              placeholder="请选择角色。"
              treeDefaultExpandAll
            />
          </Form.Item>
          <Form.Item
            label="编码"
            name="code"
            rules={[
              {
                required: true,
                message: '请将编码长度保持在1至20字符之间！',
                min: 1,
                max: 20,
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="状态"
            name="status"
            rules={[{ required: true }]}
            valuePropName="checked"
          >
            <Switch checkedChildren="开" unCheckedChildren="关" />
          </Form.Item>
          <Form.Item
            label="描述"
            name="description"
            rules={[{ message: '请将描述长度保持在1至50字符之间！', min: 1, max: 50 }]}
          >
            <Input.TextArea placeholder="请输入角色描述。" autoSize={{ minRows: 2, maxRows: 6 }} />
          </Form.Item>
          <Form.Item {...tailLayout}>
            <Button onClick={hideModelHandler}>取消</Button>
            <Button type="primary" loading={loading} htmlType="submit">
              确定
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
});

export default RoleForm;
