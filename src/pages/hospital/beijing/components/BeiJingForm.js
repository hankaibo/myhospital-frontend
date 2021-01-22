import React, { useEffect } from 'react';
import { Form, message } from 'antd';
import { connect } from 'umi';
import { isEmpty } from '@/utils/utils';
import HospitalForm from '../../components/HospitalForm';

const BeiJingForm = connect(({ hospital: { hospital }, loading }) => ({
  hospital,
  loading:
    loading.effects['hospital/fetchById'] || loading.effects['hospital/add'] || loading.effects['hospital/update'],
}))(({ loading, isEdit, id, hospital, closeModal, dispatch }) => {
  const [form] = Form.useForm();
  const { setFieldsValue, resetFields } = form;

  // 【修改时，获取医院表单数据】
  useEffect(() => {
    if (isEdit) {
      dispatch({
        type: 'hospital/fetchById',
        payload: {
          id,
        },
      });
    }
    return () => {
      if (isEdit) {
        dispatch({
          type: 'hospital/clear',
        });
      }
    };
  }, [isEdit, id, dispatch]);

  // 【修改时，回显医院表单】
  useEffect(() => {
    // 👍 将条件判断放置在 effect 中
    if (isEdit) {
      if (!isEmpty(hospital)) {
        setFieldsValue(hospital);
      }
    }
  }, [isEdit, hospital, setFieldsValue]);

  // 【添加与修改】
  const handleAddOrUpdate = (values) => {
    if (isEdit) {
      dispatch({
        type: 'hospital/update',
        payload: {
          ...values,
          id,
        },
        callback: () => {
          resetFields();
          closeModal();
          message.success('修改医院成功。');
        },
      });
    } else {
      dispatch({
        type: 'hospital/add',
        payload: {
          ...values,
        },
        callback: () => {
          resetFields();
          closeModal();
          message.success('添加医院成功。');
        },
      });
    }
  };

  return <HospitalForm loading={loading} form={form} onFinish={handleAddOrUpdate} closeModal={closeModal} />;
});

export default BeiJingForm;
