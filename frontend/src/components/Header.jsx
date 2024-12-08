import React from 'react';
import { Layout, Select } from 'antd';
import { CodeOutlined, GithubOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Header: AntHeader } = Layout;
const { Option } = Select;

const Header = () => {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (value) => {
    i18n.changeLanguage(value);
  };

  return (
    <AntHeader 
      style={{ 
        background: '#fff', 
        padding: '0 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 1,
      }}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: '12px'
      }}>
        <CodeOutlined style={{ 
          fontSize: '24px', 
          color: '#1890ff' 
        }} />
        <h1 style={{ 
          margin: 0,
          color: '#1890ff',
          fontSize: '20px',
          fontWeight: 600,
        }}>
          {t('appName')}
        </h1>
      </div>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <Select
          defaultValue={i18n.language}
          style={{ width: 120 }}
          onChange={handleLanguageChange}
        >
          <Option value="zh">中文</Option>
          <Option value="ja">日本語</Option>
          <Option value="en">English</Option>
        </Select>

        <a 
          href="https://github.com/civilix/VisionaryLens" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            color: '#1890ff',
            fontSize: '24px',
            transition: 'color 0.3s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#40a9ff'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#1890ff'}
        >
          <GithubOutlined />
        </a>
      </div>
    </AntHeader>
  );
};

export default Header; 