import React, { useState, useEffect, useRef } from 'react';
import { Modal, Card, Table, Input, Upload, Button, message } from 'antd';
import { UploadOutlined, ImportOutlined, EditOutlined } from '@ant-design/icons';
import { connect } from 'umi';
import ImportForm from './ImportForm';
import styles from '../../System.less';

const addOrUpdate = (arr, obj) => {
  const newArr = [...arr];
  for (let i = 0; i < newArr.length; i += 1) {
    if (Object.keys(newArr[i])[0] === Object.keys(obj)[0]) {
      newArr[i] = { ...obj };
      return newArr;
    }
  }
  newArr.push(obj);
  return newArr;
};

const UploadTable = connect(({ systemApi: { apiList } }) => ({
  apiList,
}))(({ loading, children, apiList, dispatch }) => {
  // 【自定义列属性】
  const inputTextRef = useRef(null);
  const [column, setColumn] = useState([]);
  // 【模态框显示隐藏属性】
  const [visible, setVisible] = useState(false);
  // 【复选框状态属性与函数】
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  useEffect(() => {
    dispatch({
      type: 'systemApi/updateFile',
      payload: [...column],
    });
  }, [column]);

  // 【模态框显示隐藏函数】
  const showModalHandler = (e) => {
    if (e) e.stopPropagation();
    setVisible(true);
  };
  const hideModelHandler = () => {
    dispatch({
      type: 'systemApi/clearFile',
    });
    setVisible(false);
  };

  // 【上传】
  const props = {
    name: 'swagger',
    accept: '.json',
    beforeUpload: (file) => {
      message.success(`${file.name} 上传成功。`);
      const reader = new FileReader();
      reader.readAsText(file);
      // reader.readAsText(file, 'UTF-8');
      reader.onload = () => {
        const fileContent = JSON.parse(reader.result);
        dispatch({
          type: 'systemApi/uploadFile',
          payload: {
            fileContent,
          },
        });
      };
      return false;
    },
    onRemove() {
      dispatch({
        type: 'systemApi/clearFile',
      });
    },
  };

  // 【复选框相关操作】
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => {
      setSelectedRowKeys(keys);
    },
  };

  // 动态修改上传文件某列值
  const handleSubmit = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setColumn(addOrUpdate(column, { [dataIndex]: selectedKeys[0] }));
  };
  const handleReset = (clearFilters, dataIndex) => {
    clearFilters();
    setColumn(addOrUpdate(column, { [dataIndex]: '' }));
  };
  const handleChange = (e, setSelectedKeys, dataIndex) => {
    setColumn(addOrUpdate(column, { [dataIndex]: e.target.value }));
    setSelectedKeys(e.target.value ? [e.target.value] : []);
  };
  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div>
        <Input
          ref={inputTextRef}
          placeholder="'添加前缀"
          value={selectedKeys[0]}
          onChange={(e) => handleChange(e, setSelectedKeys, dataIndex)}
          onPressEnter={() => handleSubmit(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Button
          type="primary"
          onClick={() => handleSubmit(selectedKeys, confirm, dataIndex)}
          size="small"
          style={{ width: 90, marginRight: 8 }}
        >
          确定
        </Button>
        <Button
          onClick={() => handleReset(clearFilters, dataIndex)}
          size="small"
          style={{ width: 90 }}
        >
          重置
        </Button>
      </div>
    ),
    onFilter: (value, record) =>
      record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
    filterIcon: (filtered) => (
      <EditOutlined title="编辑" style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilterDropdownVisibleChange: (filterVisible) => {
      if (filterVisible) {
        setTimeout(() => inputTextRef.current.select());
      }
    },
  });

  // 【表格列】
  const columns = [
    {
      title: '接口名称',
      dataIndex: 'name',
      ellipsis: true,
    },
    {
      title: '接口url',
      dataIndex: 'uri',
      ellipsis: true,
      ...getColumnSearchProps('uri'),
    },
    {
      title: '编码',
      dataIndex: 'code',
      ...getColumnSearchProps('code'),
    },
    {
      title: '方法类型',
      dataIndex: 'method',
    },
  ];

  return (
    <>
      <span onClick={showModalHandler}>{children}</span>
      <Modal
        width={800}
        destroyOnClose
        title="上传"
        visible={visible}
        onCancel={hideModelHandler}
        footer={null}
      >
        <Card bordered={false} bodyStyle={{ padding: 0 }}>
          <div className={styles.tableList}>
            <div className={styles.tableListOperator}>
              <Upload {...props}>
                <Button title="上传">
                  <UploadOutlined />
                </Button>
              </Upload>
              <ImportForm
                ids={selectedRowKeys}
                className={styles.import}
                onClean={() => setSelectedRowKeys([])}
              >
                <Button type="primary" disabled={selectedRowKeys.length <= 0} title="导入">
                  <ImportOutlined />
                </Button>
              </ImportForm>
            </div>
            <Table
              key="key"
              bordered
              size="small"
              loading={loading}
              columns={columns}
              dataSource={apiList}
              pagination={false}
              rowSelection={rowSelection}
            />
          </div>
        </Card>
      </Modal>
    </>
  );
});

export default UploadTable;
